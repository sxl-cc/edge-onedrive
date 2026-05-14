import { type Context, type Env, Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import type { KeyValueStorage } from "./kv-storage";
import { MsGraphSDK } from "./ms-graph";
import { ApiError } from "./utils/error";
import { normalizeUrlPath } from "./utils/path";

interface OAuthTokenExchangePayload {
  authorityHost: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  scopes: string;
  tenant: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

interface AppEnv extends Env {
  Bindings: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    ROOT_DIR: string;
    ENTRA_ID_ENDPOINT: string;
    GRAPH_ENDPOINT: string;
    CORS_ORIGIN: string;
    DOWNLOAD_PROXY: boolean;
  };
  Variables: {
    kv: KeyValueStorage;
  };
}

async function createMsGraphSDK(c: Context<AppEnv>) {
  const kv = c.get("kv");
  const { CLIENT_ID, CLIENT_SECRET, ENTRA_ID_ENDPOINT, GRAPH_ENDPOINT } =
    env(c);
  const accessToken = await kv.get("access_token");
  const refreshToken = await kv.get("refresh_token");
  const tokenExpiresAtStr = await kv.get("token_expires_at");
  const tokenExpiresAt = tokenExpiresAtStr
    ? Number.parseInt(tokenExpiresAtStr, 10)
    : undefined;

  return new MsGraphSDK({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    entraIdEndpoint: ENTRA_ID_ENDPOINT,
    graphEndpoint: GRAPH_ENDPOINT,
    onTokensChange: async (tokens) => {
      await kv.set("access_token", tokens.accessToken);
      await kv.set("refresh_token", tokens.refreshToken);
      await kv.set("token_expires_at", tokens.expiresAt.toString());
    },
    accessToken: accessToken ?? undefined,
    refreshToken: refreshToken ?? undefined,
    tokenExpiresAt,
  });
}

function fullPath(c: Context<AppEnv>, p: string) {
  const rootDir = env(c).ROOT_DIR;
  const fullPath = normalizeUrlPath(rootDir, p);

  return fullPath;
}

export interface edgeOnedriveAppParams {
  kv: KeyValueStorage;
}

export function createEdgeOnedriveApp(params: edgeOnedriveAppParams) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const kv = params.kv;
    c.set("kv", kv);
    await next();
  });

  app.use(
    "/api/*",
    cors({
      origin: (origin, c) => {
        const allowedOrigin: string | undefined = env(c).CORS_ORIGIN;
        if (allowedOrigin?.trim()) {
          const origins = allowedOrigin.split(",").map((o) => o.trim());
          if (origins.includes("*")) {
            return "*";
          }
          if (origins.includes(origin)) {
            return origin;
          }
        }

        return "*";
      },
    })
  );

  app.get("/", (c) => c.text("edge-onedrive api"));

  app.get("/d/:file_path{.+}", async (c) => {
    const filePath = c.req.param("file_path");
    const sdk = await createMsGraphSDK(c);
    const file = await sdk.getItemDetails(fullPath(c, filePath));
    if (file.is_folder) {
      throw new ApiError("Can not download folder", {
        status: 400,
        details: file,
      });
    }

    if (!file.download_url) {
      throw new ApiError("Missing download url", {
        status: 400,
        details: file,
      });
    }

    if (env(c).DOWNLOAD_PROXY) {
      return fetch(file.download_url);
    }

    return c.redirect(file.download_url, 302);
  });

  const v1 = new Hono<AppEnv>();

  v1.get("/hello", (c) =>
    c.json({
      message: "Hello from edge-onedrive API",
    })
  );

  v1.get("/drive/list/:path{.*}", async (c) => {
    const path = c.req.param("path");
    const ps = c.req.query("page_size");
    const pageSize = ps ? Number.parseInt(ps, 10) : undefined;
    const sdk = await createMsGraphSDK(c);

    const res = await sdk.listDir({
      path: fullPath(c, path),
      pageSize,
      nextToken: c.req.query("next_token"),
    });
    return c.json(res);
  });

  v1.get("/drive/get/:path{.*}", async (c) => {
    const path = c.req.param("path");
    const sdk = await createMsGraphSDK(c);
    const res = await sdk.getItemDetails(fullPath(c, path));
    return c.json(res);
  });

  app.route("/api/v1", v1);

  app.post("/api/v1/debug/pkce/token", async (c) => {
    const payload = (await c.req.json()) as Partial<OAuthTokenExchangePayload>;

    if (
      !(
        isNonEmptyString(payload.authorityHost) &&
        isNonEmptyString(payload.tenant) &&
        isNonEmptyString(payload.clientId) &&
        isNonEmptyString(payload.clientSecret) &&
        isNonEmptyString(payload.redirectUri) &&
        isNonEmptyString(payload.scopes) &&
        isNonEmptyString(payload.code)
      )
    ) {
      return c.json(
        {
          error: "invalid_request",
          error_description:
            "Missing required authorization code exchange fields.",
        },
        400
      );
    }

    const sdk = await createMsGraphSDK(c);

    const data = await sdk.authByCode({
      code: payload.code,
      redirectUri: payload.redirectUri,
      scopes: payload.scopes,
    });

    return c.json(data);
  });

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(
        {
          message: err.message,
          code: err.code,
          details: err.details,
        },
        err.status
      );
    }

    return c.json(
      {
        message: err.message,
        code: "INTERNAL_SERVER_ERROR",
      },
      500
    );
  });

  return app;
}

export type { KeyValueStorage } from "./kv-storage";

export type {
  MsGraphDriveItem,
  MsGraphDriveItemFile,
  MsGraphDriveItemFolder,
  MsGraphDriveItemImage,
} from "./ms-graph/drive";
