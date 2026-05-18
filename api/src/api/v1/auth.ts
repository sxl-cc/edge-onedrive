import { sValidator } from "@hono/standard-validator";
import { type } from "arktype";
import { env } from "hono/adapter";
import { nanoid } from "nanoid";
import { formatToIsoZulu } from "time-core";
import {
  generateApiKey,
  HASHED_ACCESS_TOKEN_KEY,
  HASHED_REFRESH_TOKEN_KEY,
  safeHash,
  verifySafeHash,
} from "../../auth";
import type { KeyValueStorage } from "../../kv-storage";
import { createMsGraphSDK } from "../../ms-graph/client";
import { ApiError } from "../../utils/error";
import { success } from "../../utils/resp";
import type { V1App } from ".";

const loginInfo = type({
  username: "string > 3",
  password: "string > 8",
});

const refreshInfo = type({
  refresh_token: "string",
});

const msGraphAuthorizationInfo = type({
  redirect_uri: "string > 0",
});
const msGraphAuthorizationCodeInfo = type({
  code: "string > 0",
  redirect_uri: "string > 0",
});

const ACCESS_TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 1 week
const MS_GRAPH_AUTH_SCOPES =
  "openid profile offline_access Files.ReadWrite.All";
const ERROR_TOKEN = new ApiError("Invalid token", {
  status: 401,
  details: null,
  code: "invalid_token",
});
async function setNewTokens(kv: KeyValueStorage) {
  const now = Date.now();
  const access_token = generateApiKey(now + ACCESS_TOKEN_EXPIRATION);

  const refresh_token = generateApiKey(now + REFRESH_TOKEN_EXPIRATION);

  await kv.set(HASHED_ACCESS_TOKEN_KEY, await safeHash(access_token));
  await kv.set(HASHED_REFRESH_TOKEN_KEY, await safeHash(refresh_token));

  return {
    access_token,
    refresh_token,
    expires_at: formatToIsoZulu(now + ACCESS_TOKEN_EXPIRATION),
  };
}

function createAuthorityBase(entraIdEndpoint: string | undefined) {
  const endpoint =
    entraIdEndpoint?.trim() || "https://login.microsoftonline.com";
  return `${endpoint.replace(/\/+$/, "")}/common/oauth2/v2.0`;
}

export function registerV1AuthRoutes(v1: V1App) {
  v1.post("/auth/login", sValidator("json", loginInfo), async (c) => {
    const data = c.req.valid("json");
    const kv = c.get("kv");
    const realUsername = await kv.get("username");
    const realHashedPassword = await kv.get("hashed_password");

    if (!(realUsername && realHashedPassword)) {
      throw new ApiError("Password not set", {
        status: 400,
        details: null,
        code: "password_not_set",
      });
    }

    if (data.username !== realUsername) {
      throw new ApiError("Username or password is invalid", {
        status: 401,
        details: null,
        code: "invalid_credentials",
      });
    }

    if (!(await verifySafeHash(data.password, realHashedPassword))) {
      throw new ApiError("Username or password is invalid", {
        status: 401,
        details: null,
        code: "invalid_credentials",
      });
    }

    const tokens = await setNewTokens(kv);
    return c.json(tokens);
  });

  v1.post("/auth/refresh", sValidator("json", refreshInfo), async (c) => {
    const { refresh_token } = c.req.valid("json");

    const kv = c.get("kv");
    const realHashedRefreshToken = await kv.get(HASHED_REFRESH_TOKEN_KEY);
    if (
      !(
        realHashedRefreshToken &&
        (await verifySafeHash(refresh_token, realHashedRefreshToken))
      )
    ) {
      throw ERROR_TOKEN;
    }

    const tokens = await setNewTokens(kv);
    return c.json(tokens);
  });

  v1.get("/auth/settings", async (c) => {
    const kv = c.get("kv");
    const username = await kv.get("username");
    const refreshToken = await kv.get("refresh_token");
    const apiKey = await kv.get("api_key");

    return c.json({
      username: username ?? "",
      has_ms_graph_refresh_token: Boolean(refreshToken),
      has_api_key: Boolean(apiKey),
    });
  });

  v1.post(
    "/auth/change-login-info",
    sValidator("json", loginInfo),
    async (c) => {
      const data = c.req.valid("json");
      const kv = c.get("kv");
      await kv.set("username", data.username);
      await kv.set("hashed_password", await safeHash(data.password));

      return success(c);
    }
  );

  v1.post(
    "/auth/ms-graph-authorization-url",
    sValidator("json", msGraphAuthorizationInfo),
    (c) => {
      const data = c.req.valid("json");
      const { CLIENT_ID, ENTRA_ID_ENDPOINT } = env(c);

      if (!CLIENT_ID?.trim()) {
        throw new ApiError("Missing Microsoft Graph client id", {
          status: 400,
          details: null,
          code: "missing_ms_graph_client_id",
        });
      }

      const state = nanoid();
      const url = new URL(
        `${createAuthorityBase(ENTRA_ID_ENDPOINT)}/authorize`
      );
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", data.redirect_uri);
      url.searchParams.set("response_mode", "query");
      url.searchParams.set("scope", MS_GRAPH_AUTH_SCOPES);
      url.searchParams.set("state", state);

      return c.json({
        authorization_url: url.toString(),
        redirect_uri: data.redirect_uri,
        scopes: MS_GRAPH_AUTH_SCOPES,
        state,
      });
    }
  );

  v1.post(
    "/auth/ms-graph-authorization-code",
    sValidator("json", msGraphAuthorizationCodeInfo),
    async (c) => {
      const data = c.req.valid("json");
      const sdk = await createMsGraphSDK(c);
      const tokens = await sdk.authByCode({
        code: data.code,
        redirectUri: data.redirect_uri,
        scopes: MS_GRAPH_AUTH_SCOPES,
      });

      return c.json({
        expires_at: formatToIsoZulu(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
        token_type: tokens.token_type,
      });
    }
  );

  v1.post("/auth/new-key", async (c) => {
    const newKey = generateApiKey(0);
    const kv = c.get("kv");

    const hashedKey = await safeHash(newKey);
    await kv.set("api_key", hashedKey);

    return c.json({
      key: newKey,
    });
  });

  v1.post("/auth/setup", sValidator("json", loginInfo), async (c) => {
    const kv = c.get("kv");
    const username = await kv.get("username");
    const hashedPassword = await kv.get("hashed_password");

    if (username && hashedPassword) {
      throw new ApiError("Password already set", {
        status: 400,
        details: null,
        code: "password_already_set",
      });
    }

    const data = c.req.valid("json");

    await kv.set("username", data.username);
    await kv.set("hashed_password", await safeHash(data.password));

    return success(c);
  });

  v1.get("/auth/setup", async (c) => {
    const kv = c.get("kv");
    const username = await kv.get("username");
    const hashedPassword = await kv.get("hashed_password");

    return c.json({
      is_setup: Boolean(username && hashedPassword),
    });
  });
}
