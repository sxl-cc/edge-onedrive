import { createMsGraphSDK } from "../../ms-graph/client";
import type { V1App } from ".";

export function registerV1HealthRoutes(v1: V1App) {
  v1.get("/health", async (c) => {
    const sdk = await createMsGraphSDK(c);
    await sdk.refreshAllTokens(false);

    return c.json({
      status: "ok",
    });
  });
}
