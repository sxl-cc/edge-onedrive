import type { Context } from "hono";
import { normalizeUrlPath } from "../../../ui/src/utils/path";
import type { AppEnv } from "..";
import { getEnvConfig } from "../utils/env";
import { MsGraphSDK } from ".";

export async function createMsGraphSDK(c: Context<AppEnv>) {
  const kv = c.get("kv");
  const config = getEnvConfig(c);
  const accessToken = await kv.get("access_token");
  const refreshToken = await kv.get("refresh_token");
  const tokenExpiresAtStr = await kv.get("token_expires_at");
  const tokenExpiresAt = tokenExpiresAtStr
    ? Number.parseInt(tokenExpiresAtStr, 10)
    : undefined;

  return new MsGraphSDK({
    clientId: config.microsoft.clientId,
    clientSecret: config.microsoft.clientSecret,
    downloadSignature: {
      clientId: config.microsoft.clientId,
      clientSecret: config.microsoft.clientSecret,
      expirationHours: config.download.expirationHours,
      forceSign: config.download.forceSign,
    },
    entraIdEndpoint: config.microsoft.entraIdEndpoint,
    graphEndpoint: config.microsoft.graphEndpoint,
    onTokensChange: async (tokens) => {
      await kv.put("access_token", tokens.accessToken);
      await kv.put("refresh_token", tokens.refreshToken);
      await kv.put("token_expires_at", tokens.expiresAt.toString());
    },
    accessToken: accessToken ?? undefined,
    refreshToken: refreshToken ?? undefined,
    tokenExpiresAt,
  });
}

export function fullPath(c: Context<AppEnv>, p: string) {
  const { rootDir } = getEnvConfig(c).drive;

  return normalizeUrlPath(rootDir, p);
}
