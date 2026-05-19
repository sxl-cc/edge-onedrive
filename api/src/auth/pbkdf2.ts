import crypto from "uncrypto";

const SALT_LENGTH = 16;
const ITERATIONS = 100_000;
const HASH_LENGTH = 32;
const HASH_ALGORITHM = "pbkdf2-sha256";
const HASH_SEGMENT_COUNT = 4;

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array | null {
  if (!/^[\d+/=A-Za-z]+$/.test(base64) || base64.length % 4 !== 0) {
    return null;
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt).buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_LENGTH * 8
  );
}

function parseHash(hashed: string) {
  const segments = hashed.split("$");
  if (segments.length !== HASH_SEGMENT_COUNT) {
    return null;
  }

  const [algorithm, iterationsText, saltB64, hashB64] = segments;
  if (algorithm !== HASH_ALGORITHM) {
    return null;
  }

  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 1) {
    return null;
  }

  try {
    const salt = base64ToUint8Array(saltB64);
    const hash = base64ToUint8Array(hashB64);
    if (!(salt && hash)) {
      return null;
    }

    return { iterations, salt, hash };
  } catch {
    return null;
  }
}

/**
 * Hash a password with a random salt using PBKDF2.
 * Returns a string in the format `pbkdf2-sha256$iterations$base64(salt)$base64(hash)`.
 */
export async function safeHash(input: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hashBuffer = await deriveKey(input, salt, ITERATIONS);
  const hash = new Uint8Array(hashBuffer);

  return `${HASH_ALGORITHM}$${ITERATIONS}$${uint8ArrayToBase64(salt)}$${uint8ArrayToBase64(hash)}`;
}

/**
 * Verify a password against a stored hash string.
 */
export async function verifySafeHash(
  input: string,
  hashed: string
): Promise<boolean> {
  const parsed = parseHash(hashed);
  if (!parsed) {
    return false;
  }

  const hashBuffer = await deriveKey(input, parsed.salt, parsed.iterations);
  const actualHash = new Uint8Array(hashBuffer);

  if (parsed.hash.length !== actualHash.length) {
    return false;
  }

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < parsed.hash.length; i++) {
    // biome-ignore lint: constant-time compare requires bitwise ops
    diff |= parsed.hash[i] ^ actualHash[i];
  }
  return diff === 0;
}
