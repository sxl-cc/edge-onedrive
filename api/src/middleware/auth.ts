import type { Context, Next } from "hono";
import { HASHED_ACCESS_TOKEN_KEY, verifyApiKey, verifySafeHash } from "../auth";
import type { KeyValueStorage } from "../kv-storage";
import { ApiError } from "../utils/error";

const apiKeyInvalid = new ApiError("API key is invalid", {
  status: 401,
  details: null,
  code: "invalid_api_key",
});
export function authMiddleware(
  skip?: (c: Context) => Promise<boolean> | boolean
) {
  return async (c: Context, next: Next) => {
    if (await skip?.(c)) {
      return next();
    }

    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw apiKeyInvalid;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const kv: KeyValueStorage = c.get("kv");
    const hashedToken = await kv.get(HASHED_ACCESS_TOKEN_KEY);
    if (!(hashedToken && (await verifySafeHash(token, hashedToken)))) {
      throw apiKeyInvalid;
    }
    if (!verifyApiKey(token)) {
      await kv.delete(HASHED_ACCESS_TOKEN_KEY);
      throw new ApiError("API key is deprecated", {
        status: 401,
        details: null,
        code: "deprecated_api_key",
      });
    }

    return next();
  };
}
