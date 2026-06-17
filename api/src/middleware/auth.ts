import type { Context, Next } from "hono";
import type { KeyValueStorage } from "../kv-storage";
import { HASHED_ACCESS_TOKEN_KEY, verifyApiKey } from "../utils/api-key";
import { ApiError } from "../utils/error";
import { verifySafeHash } from "../utils/pbkdf2";

const apiKeyInvalid = new ApiError("API key is invalid", {
  status: 401,
  details: null,
  code: "INVALID_API_KEY",
});

export function auth(skip?: (c: Context) => Promise<boolean> | boolean) {
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
    const hashedApiKey = await kv.get("api_key");
    const isAccessToken = Boolean(
      hashedToken && (await verifySafeHash(token, hashedToken))
    );
    const isApiKey = Boolean(
      hashedApiKey && (await verifySafeHash(token, hashedApiKey))
    );

    if (!(isAccessToken || isApiKey)) {
      throw apiKeyInvalid;
    }

    if (!verifyApiKey(token)) {
      if (isAccessToken) {
        await kv.delete(HASHED_ACCESS_TOKEN_KEY);
      }
      throw new ApiError("API key is deprecated", {
        status: 401,
        details: null,
        code: "DEPRECATED_API_KEY",
      });
    }

    return next();
  };
}
