import { createMsGraphSDK } from "../../ms-graph/client";
import type { V1App } from ".";

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

export function registerV1DebugRoutes(v1: V1App) {
  v1.post("/debug/pkce/token", async (c) => {
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
}
