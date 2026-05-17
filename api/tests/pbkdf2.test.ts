import { describe, expect, it } from "vitest";
import { safeHash, verifySafeHash } from "../src/auth/pbkdf2";

describe("PBKDF2 password hashing", () => {
  it("hashes and verifies a matching input", async () => {
    const hashed = await safeHash("correct horse battery staple");

    expect(hashed).toMatch(
      /^pbkdf2-sha256\$600000\$[A-Za-z\d+/=]+\$[A-Za-z\d+/=]+$/
    );
    await expect(
      verifySafeHash("correct horse battery staple", hashed)
    ).resolves.toBe(true);
  });

  it("rejects a non-matching input", async () => {
    const hashed = await safeHash("correct horse battery staple");

    await expect(verifySafeHash("wrong password", hashed)).resolves.toBe(false);
  });

  it("rejects malformed hash strings", async () => {
    await expect(verifySafeHash("password", "")).resolves.toBe(false);
    await expect(verifySafeHash("password", "salt:hash")).resolves.toBe(false);
    await expect(
      verifySafeHash("password", "pbkdf2-sha256$600000$salt$hash$extra")
    ).resolves.toBe(false);
    await expect(
      verifySafeHash("password", "pbkdf2-sha1$600000$c2FsdA==$aGFzaA==")
    ).resolves.toBe(false);
    await expect(
      verifySafeHash("password", "pbkdf2-sha256$0$c2FsdA==$aGFzaA==")
    ).resolves.toBe(false);
  });

  it("returns false for invalid base64 instead of throwing", async () => {
    await expect(
      verifySafeHash("password", "pbkdf2-sha256$600000$not-base64!$aGFzaA==")
    ).resolves.toBe(false);
  });
});
