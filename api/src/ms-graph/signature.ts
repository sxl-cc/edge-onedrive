import { hmacSha256 } from "../utils/signature";

const HOUR_IN_MS = 60 * 60 * 1000;

export interface MsGraphDownloadSignatureOptions {
  clientId: string;
  clientSecret: string;
  expirationHours?: number | string;
  forceSign?: boolean;
}

function normalizeExpirationHours(value: number | string | undefined) {
  const hours = Number.parseFloat(`${value ?? ""}`);
  return Number.isFinite(hours) && hours > 0 ? hours * HOUR_IN_MS : undefined;
}

export function shouldSignDownloadLink(
  options: MsGraphDownloadSignatureOptions
) {
  return Boolean(
    options.forceSign || normalizeExpirationHours(options.expirationHours)
  );
}

function createSignaturePayload(params: {
  clientId: string;
  expiry?: number;
  path: string;
}) {
  return params.expiry
    ? `${params.path}.${params.clientId}.${params.expiry}`
    : `${params.path}.${params.clientId}`;
}

function extractSignatureAndExpiry(
  sign: string
): [signature: string, expiry: number | undefined] {
  const [signature, expiry] = sign.split("_");
  const parsedExpiry = expiry ? Number.parseInt(expiry, 10) : undefined;
  return [signature, parsedExpiry];
}

export async function createDownloadSignature(
  path: string,
  options: MsGraphDownloadSignatureOptions
) {
  const expiration = normalizeExpirationHours(options.expirationHours);
  const expiry = expiration ? Date.now() + expiration : undefined;
  const signature = await hmacSha256(
    options.clientSecret,
    createSignaturePayload({
      clientId: options.clientId,
      expiry,
      path,
    })
  );

  return expiry ? `${signature}_${expiry}` : signature;
}

export async function verifyDownloadSignature(params: {
  options: MsGraphDownloadSignatureOptions;
  path: string;
  sign: string | undefined;
}) {
  const expiration = normalizeExpirationHours(params.options.expirationHours);
  const [signature, expiry] = extractSignatureAndExpiry(params.sign || "");

  if (expiration && !Number.isSafeInteger(expiry)) {
    throw new Error("sign is invalid");
  }

  if (expiry && expiry < Date.now()) {
    throw new Error("sign is expired");
  }

  const expectSign = await hmacSha256(
    params.options.clientSecret,
    createSignaturePayload({
      clientId: params.options.clientId,
      expiry,
      path: params.path,
    })
  );

  if (signature !== expectSign) {
    throw new Error("sign is invalid");
  }
}
