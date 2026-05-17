import type { Context } from "hono";
import { env } from "hono/adapter";
import { normalizeUrlPath } from "../../../ui/src/utils/path";
import type { AppEnv } from "..";
import { MsGraphSDK } from ".";

export async function createMsGraphSDK(c: Context<AppEnv>) {
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

export function fullPath(c: Context<AppEnv>, p: string) {
  const rootDir = env(c).ROOT_DIR;

  return normalizeUrlPath(rootDir, p);
}
