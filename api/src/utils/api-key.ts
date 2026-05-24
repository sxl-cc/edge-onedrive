import { nanoid } from "nanoid";

export const HASHED_ACCESS_TOKEN_KEY = "hashed_access_token";
export const HASHED_REFRESH_TOKEN_KEY = "hashed_refresh_token";

export function generateApiKey(expiresAt: number) {
  const uid = nanoid(36);

  return `sk_${expiresAt}_${uid}`;
}


export function verifyApiKey(apiKey: string) {
  if (!apiKey.startsWith("sk_")) {
    return false;
  }

  const [expiresAtText] = apiKey.slice(3).split("_");
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt)) {
    return false;
  }

  if (expiresAt <= 0) {
    // never expires
    return true;
  }
  return expiresAt > Date.now();
}
