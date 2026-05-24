import crypto from "uncrypto";
import { S3Error } from "./error";

const AWS_ALGORITHM = "AWS4-HMAC-SHA256";
const SERVICE = "s3";

interface ParsedAuthorization {
  accessKeyId: string;
  credentialScope: string;
  region: string;
  signature: string;
  signedHeaders: string[];
}

export interface VerifyS3SignatureOptions {
  accessKeyId: string;
  method: string;
  request: Request;
  secretAccessKey: string;
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export function canonicalUri(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => encodeRfc3986(decodeURIComponent(segment)))
    .join("/");
}

export function canonicalQuery(searchParams: URLSearchParams) {
  const pairs = [...searchParams.entries()].map(([key, value]) => [
    encodeRfc3986(key),
    encodeRfc3986(value),
  ]);

  pairs.sort(([keyA, valueA], [keyB, valueB]) => {
    if (keyA === keyB) {
      return valueA.localeCompare(valueB);
    }
    return keyA.localeCompare(keyB);
  });

  return pairs.map(([key, value]) => `${key}=${value}`).join("&");
}

function normalizeHeaderValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parseAuthorization(value: string): ParsedAuthorization {
  const [algorithm, ...rawParts] = value.trim().split(/\s+/);
  if (algorithm !== AWS_ALGORITHM) {
    throw new S3Error(
      "InvalidRequest",
      "Only AWS Signature Version 4 is supported",
      400
    );
  }

  const parts = new Map(
    rawParts
      .join(" ")
      .split(",")
      .map((part) => {
        const [key, ...rest] = part.trim().split("=");
        return [key, rest.join("=")];
      })
  );
  const credential = parts.get("Credential");
  const signedHeaders = parts.get("SignedHeaders");
  const signature = parts.get("Signature");

  if (!(credential && signedHeaders && signature)) {
    throw new S3Error(
      "AuthorizationHeaderMalformed",
      "Invalid Authorization header",
      400
    );
  }

  const [accessKeyId, date, region, service, terminator] =
    credential.split("/");
  if (
    !(
      accessKeyId &&
      date &&
      region &&
      service === SERVICE &&
      terminator === "aws4_request"
    )
  ) {
    throw new S3Error(
      "AuthorizationHeaderMalformed",
      "Invalid credential scope",
      400
    );
  }

  return {
    accessKeyId,
    credentialScope: [date, region, service, terminator].join("/"),
    region,
    signature,
    signedHeaders: signedHeaders
      .split(";")
      .map((header) => header.toLowerCase()),
  };
}

async function sha256Hex(data: string | ArrayBuffer) {
  const source =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", source);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Bytes(key: ArrayBuffer | Uint8Array, data: string) {
  let rawKey: ArrayBuffer;
  if (key instanceof Uint8Array) {
    rawKey = new ArrayBuffer(key.byteLength);
    new Uint8Array(rawKey).set(key);
  } else {
    rawKey = key;
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(data)
  );
  return new Uint8Array(signature);
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signingKey(
  secretAccessKey: string,
  date: string,
  region: string
) {
  const dateKey = await hmacSha256Bytes(
    new TextEncoder().encode(`AWS4${secretAccessKey}`),
    date
  );
  const regionKey = await hmacSha256Bytes(dateKey, region);
  const serviceKey = await hmacSha256Bytes(regionKey, SERVICE);
  return hmacSha256Bytes(serviceKey, "aws4_request");
}

export async function verifyS3Signature(options: VerifyS3SignatureOptions) {
  const authorization = options.request.headers.get("authorization");
  if (!authorization) {
    throw new S3Error("AccessDenied", "Missing Authorization header", 403);
  }

  const parsed = parseAuthorization(authorization);
  if (parsed.accessKeyId !== options.accessKeyId) {
    throw new S3Error(
      "InvalidAccessKeyId",
      "The AWS access key ID does not exist",
      403
    );
  }

  const amzDate = options.request.headers.get("x-amz-date");
  if (!amzDate) {
    throw new S3Error("AccessDenied", "Missing x-amz-date header", 403);
  }

  const url = new URL(options.request.url);
  const canonicalHeaders = parsed.signedHeaders
    .map((header) => {
      const value = options.request.headers.get(header);
      if (value === null) {
        throw new S3Error(
          "AuthorizationHeaderMalformed",
          `Signed header ${header} is missing`,
          400
        );
      }
      return `${header}:${normalizeHeaderValue(value)}`;
    })
    .join("\n");
  const payloadHash =
    options.request.headers.get("x-amz-content-sha256") || "UNSIGNED-PAYLOAD";
  const canonicalRequest = [
    options.method.toUpperCase(),
    canonicalUri(url.pathname),
    canonicalQuery(url.searchParams),
    `${canonicalHeaders}\n`,
    parsed.signedHeaders.join(";"),
    payloadHash,
  ].join("\n");
  const canonicalRequestHash = await sha256Hex(canonicalRequest);
  const stringToSign = [
    AWS_ALGORITHM,
    amzDate,
    parsed.credentialScope,
    canonicalRequestHash,
  ].join("\n");
  const [date] = parsed.credentialScope.split("/");
  const key = await signingKey(options.secretAccessKey, date, parsed.region);
  const expectedSignature = bytesToHex(
    await hmacSha256Bytes(key, stringToSign)
  );

  if (expectedSignature !== parsed.signature) {
    throw new S3Error(
      "SignatureDoesNotMatch",
      "The request signature we calculated does not match the signature you provided",
      403
    );
  }
}
