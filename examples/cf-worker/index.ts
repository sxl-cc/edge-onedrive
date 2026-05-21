import {
  type AppEnv,
  createEdgeOnedriveApp,
  type KeyValueStorage,
  MsGraphSDK,
} from "api";

interface CloudflareKvNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

type CloudflareWorkerEnv = AppEnv["Bindings"] & {
  KV: CloudflareKvNamespace;
};

const app = createEdgeOnedriveApp({
  kv: (c) => {
    if ("KV" in c.env) {
      const kv = c.env.KV as CloudflareKvNamespace;

      return {
        get(key) {
          return kv.get(key);
        },
        set(key, value) {
          return kv.put(key, value);
        },
        delete(key) {
          return kv.delete(key);
        },
      } satisfies KeyValueStorage;
    }

    throw new Error("KV is not defined");
  },
});

export default {
  fetch: app.fetch,
  async scheduled(
    _controller: unknown,
    env: CloudflareWorkerEnv,
    _ctx: CloudflareExecutionContext
  ) {
    const kv = env.KV;
    const accessToken = await kv.get("access_token");
    const refreshToken = await kv.get("refresh_token");
    const tokenExpiresAtStr = await kv.get("token_expires_at");
    const tokenExpiresAt = tokenExpiresAtStr
      ? Number.parseInt(tokenExpiresAtStr, 10)
      : undefined;

    const sdk = new MsGraphSDK({
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      entraIdEndpoint: env.ENTRA_ID_ENDPOINT,
      graphEndpoint: env.GRAPH_ENDPOINT,
      onTokensChange: async (tokens) => {
        await kv.put("access_token", tokens.accessToken);
        await kv.put("refresh_token", tokens.refreshToken);
        await kv.put("token_expires_at", tokens.expiresAt.toString());
      },
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
      tokenExpiresAt,
    });

    await sdk.refreshAllTokens(false);
    console.log("check tokens successfully");
  },
};
