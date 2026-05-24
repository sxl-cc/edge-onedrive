import { type Context, Hono } from "hono";
import type { AppEnv } from "..";
import { createMsGraphSDK, fullPath } from "../ms-graph/client";
import type { MsGraphDriveItem } from "../ms-graph/drive";
import { getEnvConfig } from "../utils/env";
import { normalizeUrlPath } from "../utils/path";
import { S3Error, s3ErrorResponse } from "./error";
import { verifyS3Signature } from "./signature";
import { escapeXml, xmlResponse } from "./xml";

const S3_XMLNS = "http://s3.amazonaws.com/doc/2006-03-01/";

interface ParsedS3Path {
  bucket?: string;
  key: string;
}

function parseS3Path(pathname: string): ParsedS3Path {
  const [, bucket = "", ...keyParts] = pathname.split("/");
  return {
    bucket: decodeURIComponent(bucket) || undefined,
    key: keyParts.map((part) => decodeURIComponent(part)).join("/"),
  };
}

function s3Bucket(c: Context<AppEnv>) {
  return getEnvConfig(c).s3.bucket;
}

function assertS3Configured(c: Context<AppEnv>) {
  const { accessKeyId, secretAccessKey } = getEnvConfig(c).s3;
  if (!(accessKeyId && secretAccessKey)) {
    throw new S3Error(
      "InvalidRequest",
      "S3 compatibility is not configured",
      400
    );
  }
  return {
    accessKeyId,
    secretAccessKey,
  };
}

async function authorize(c: Context<AppEnv>) {
  const credentials = assertS3Configured(c);
  await verifyS3Signature({
    ...credentials,
    method: c.req.method,
    request: c.req.raw,
  });
}

function assertBucket(c: Context<AppEnv>, bucket?: string) {
  if (!bucket || bucket !== s3Bucket(c)) {
    throw new S3Error(
      "NoSuchBucket",
      "The specified bucket does not exist",
      404
    );
  }
}

function encodeDrivePath(path: string) {
  return normalizeUrlPath(path)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function drivePath(c: Context<AppEnv>, key: string) {
  return fullPath(c, encodeDrivePath(key));
}

function isoToS3Date(value: string) {
  return new Date(value).toISOString();
}

function listBucketsXml(bucket: string) {
  const now = new Date().toISOString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ListAllMyBucketsResult xmlns="${S3_XMLNS}">`,
    "<Owner><ID>edge-onedrive</ID><DisplayName>edge-onedrive</DisplayName></Owner>",
    "<Buckets>",
    "<Bucket>",
    `<Name>${escapeXml(bucket)}</Name>`,
    `<CreationDate>${now}</CreationDate>`,
    "</Bucket>",
    "</Buckets>",
    "</ListAllMyBucketsResult>",
  ].join("");
}

function listObjectsXml(params: {
  bucket: string;
  commonPrefixes: string[];
  contents: MsGraphDriveItem[];
  continuationToken?: string;
  delimiter?: string;
  keyPrefix: string;
  maxKeys: number;
  nextToken?: string;
  prefix: string;
}) {
  const contents = params.contents
    .map((item) => {
      const key = `${params.keyPrefix}${item.name}${item.is_folder ? "/" : ""}`;
      return [
        "<Contents>",
        `<Key>${escapeXml(key)}</Key>`,
        `<LastModified>${escapeXml(isoToS3Date(item.last_modified_at))}</LastModified>`,
        "<ETag>&quot;&quot;</ETag>",
        `<Size>${item.size}</Size>`,
        "<StorageClass>STANDARD</StorageClass>",
        "</Contents>",
      ].join("");
    })
    .join("");
  const commonPrefixes = params.commonPrefixes
    .map(
      (prefix) =>
        `<CommonPrefixes><Prefix>${escapeXml(prefix)}</Prefix></CommonPrefixes>`
    )
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ListBucketResult xmlns="${S3_XMLNS}">`,
    `<Name>${escapeXml(params.bucket)}</Name>`,
    `<Prefix>${escapeXml(params.prefix)}</Prefix>`,
    `<KeyCount>${params.contents.length + params.commonPrefixes.length}</KeyCount>`,
    `<MaxKeys>${params.maxKeys}</MaxKeys>`,
    `<IsTruncated>${params.nextToken ? "true" : "false"}</IsTruncated>`,
    params.delimiter
      ? `<Delimiter>${escapeXml(params.delimiter)}</Delimiter>`
      : "",
    params.continuationToken
      ? `<ContinuationToken>${escapeXml(params.continuationToken)}</ContinuationToken>`
      : "",
    params.nextToken
      ? `<NextContinuationToken>${escapeXml(params.nextToken)}</NextContinuationToken>`
      : "",
    contents,
    commonPrefixes,
    "</ListBucketResult>",
  ].join("");
}

function objectHeaders(item: MsGraphDriveItem) {
  const headers = new Headers();
  headers.set("Content-Length", `${item.size}`);
  headers.set("Last-Modified", new Date(item.last_modified_at).toUTCString());
  headers.set("ETag", '""');
  if (!item.is_folder) {
    headers.set("Content-Type", item.mime_type);
  }
  return headers;
}

function listPathFromPrefix(prefix: string) {
  if (!prefix || prefix.endsWith("/")) {
    return {
      keyPrefix: prefix,
      path: prefix.replace(/\/$/, ""),
    };
  }

  const lastSlash = prefix.lastIndexOf("/");
  if (lastSlash === -1) {
    return {
      keyPrefix: "",
      path: "",
    };
  }

  return {
    keyPrefix: prefix.slice(0, lastSlash + 1),
    path: prefix.slice(0, lastSlash),
  };
}

function methodNotAllowed(): never {
  throw new S3Error(
    "MethodNotAllowed",
    "The specified method is not allowed",
    405
  );
}

function handleServiceRequest(c: Context<AppEnv>) {
  if (c.req.method !== "GET") {
    methodNotAllowed();
  }
  return xmlResponse(listBucketsXml(s3Bucket(c)));
}

async function handleBucketRequest(
  c: Context<AppEnv>,
  bucket: string,
  url: URL
) {
  if (c.req.method === "HEAD") {
    return c.body(null, 200);
  }

  if (c.req.method !== "GET") {
    methodNotAllowed();
  }

  const prefix = url.searchParams.get("prefix") || "";
  const delimiter = url.searchParams.get("delimiter") || undefined;
  const maxKeys = Number.parseInt(
    url.searchParams.get("max-keys") || "1000",
    10
  );
  const continuationToken =
    url.searchParams.get("continuation-token") || undefined;
  const listPath = listPathFromPrefix(prefix);
  const sdk = await createMsGraphSDK(c);
  const pageSize = Number.isSafeInteger(maxKeys) ? maxKeys : 1000;
  const result = await sdk.listDir({
    path: drivePath(c, listPath.path),
    pageSize,
    nextToken: continuationToken,
    select: "name,size,createdDateTime,lastModifiedDateTime,folder,file",
  });
  const filtered = result.data.filter((item) =>
    `${listPath.keyPrefix}${item.name}`.startsWith(prefix)
  );
  const commonPrefixes =
    delimiter === "/"
      ? filtered
          .filter((item) => item.is_folder)
          .map((item) => `${listPath.keyPrefix}${item.name}/`)
      : [];
  const contents =
    delimiter === "/" ? filtered.filter((item) => !item.is_folder) : filtered;

  return xmlResponse(
    listObjectsXml({
      bucket,
      commonPrefixes,
      contents,
      continuationToken,
      delimiter,
      keyPrefix: listPath.keyPrefix,
      maxKeys: pageSize,
      nextToken: result.next_token,
      prefix,
    })
  );
}

async function handlePutObject(c: Context<AppEnv>, key: string) {
  const body = c.req.raw.body;
  if (!body) {
    throw new S3Error("InvalidRequest", "Request body is required", 400);
  }

  const sdk = await createMsGraphSDK(c);
  await sdk.uploadFile({
    path: drivePath(c, key),
    contentType: c.req.header("content-type") || undefined,
    body,
  });

  return c.body(null, 200, {
    ETag: '""',
  });
}

async function handleDeleteObject(c: Context<AppEnv>, key: string) {
  const sdk = await createMsGraphSDK(c);
  await sdk.deleteItem({
    path: drivePath(c, key),
  });
  return c.body(null, 204);
}

async function handleReadObject(c: Context<AppEnv>, key: string) {
  const sdk = await createMsGraphSDK(c);
  const item = await sdk.getItemDetails({
    path: drivePath(c, key),
    select:
      "name,size,lastModifiedDateTime,createdDateTime,file,folder,content.downloadUrl",
    signDownload: false,
  });

  if (item.is_folder) {
    throw new S3Error("NoSuchKey", "The specified key does not exist", 404);
  }

  const headers = objectHeaders(item);
  if (c.req.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers,
    });
  }

  if (!item.download_url) {
    throw new S3Error("NoSuchKey", "The specified key does not exist", 404);
  }

  const requestHeaders = new Headers();
  const range = c.req.header("range");
  if (range) {
    requestHeaders.set("Range", range);
  }

  const response = await fetch(item.download_url, {
    headers: requestHeaders,
  });
  const responseHeaders = new Headers(headers);
  response.headers.forEach((value, name) => {
    if (
      name === "accept-ranges" ||
      name === "content-length" ||
      name === "content-range"
    ) {
      responseHeaders.set(name, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

function handleObjectRequest(c: Context<AppEnv>, key: string) {
  if (c.req.method === "PUT") {
    return handlePutObject(c, key);
  }

  if (c.req.method === "DELETE") {
    return handleDeleteObject(c, key);
  }

  if (c.req.method === "HEAD" || c.req.method === "GET") {
    return handleReadObject(c, key);
  }

  methodNotAllowed();
}

export function createS3Routes() {
  const s3 = new Hono<AppEnv>();

  s3.onError((err, c) => {
    if (err instanceof S3Error) {
      return s3ErrorResponse(err, new URL(c.req.url).pathname);
    }
    throw err;
  });

  s3.all("*", async (c) => {
    const url = new URL(c.req.url);
    if (url.pathname.startsWith("/api/")) {
      return c.notFound();
    }

    await authorize(c);

    const { bucket, key } = parseS3Path(url.pathname);
    if (!bucket) {
      return handleServiceRequest(c);
    }

    assertBucket(c, bucket);

    if (!key) {
      return handleBucketRequest(c, bucket, url);
    }

    return handleObjectRequest(c, key);
  });

  return s3;
}
