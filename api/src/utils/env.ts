import type { Context, Env } from "hono";
import { env } from "hono/adapter";

type EnvValue = boolean | number | string | undefined;

export interface AppRuntimeEnv {
  CLIENT_ID?: EnvValue;
  CLIENT_SECRET?: EnvValue;
  CORS_ORIGIN?: EnvValue;
  ENABLE_GUEST?: EnvValue;
  ENTRA_ID_ENDPOINT?: EnvValue;
  GRAPH_ENDPOINT?: EnvValue;
  LINK_EXPIRATION?: EnvValue;
  LINK_FORCE_SIGN?: EnvValue;
  LINK_PROXY?: EnvValue;
  ROOT_DIR?: EnvValue;
  S3_ACCESS_KEY_ID?: EnvValue;
  S3_BUCKET?: EnvValue;
  S3_SECRET_ACCESS_KEY?: EnvValue;
}

export interface AppEnvConfig {
  auth: {
    guest: boolean;
  };
  cors: {
    origins: string[];
  };
  download: {
    expirationHours?: number;
    forceSign: boolean;
    proxy: boolean;
  };
  drive: {
    rootDir: string;
  };
  microsoft: {
    clientId: string;
    clientSecret: string;
    entraIdEndpoint: string;
    graphEndpoint: string;
  };
  s3: {
    accessKeyId: string;
    bucket: string;
    secretAccessKey: string;
  };
}

const DEFAULT_ENTRA_ID_ENDPOINT = "https://login.microsoftonline.com";
const DEFAULT_GRAPH_ENDPOINT = "https://graph.microsoft.com";
const DEFAULT_ROOT_DIR = "/";
const DEFAULT_CORS_ORIGINS = ["*"];
const DEFAULT_S3_BUCKET = "onedrive";

function readString(value: EnvValue) {
  return value === undefined ? "" : `${value}`.trim();
}

function readBoolean(value: EnvValue) {
  if (typeof value === "boolean") {
    return value;
  }

  return readString(value).toLowerCase() === "true";
}

function readPositiveNumber(value: EnvValue) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  const parsed = Number.parseFloat(readString(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function readStringList(value: EnvValue) {
  const values = readString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : DEFAULT_CORS_ORIGINS;
}

export function createEnvConfig(raw: AppRuntimeEnv = {}): AppEnvConfig {
  return {
    auth: {
      guest: readBoolean(raw.ENABLE_GUEST),
    },
    cors: {
      origins: readStringList(raw.CORS_ORIGIN),
    },
    download: {
      expirationHours: readPositiveNumber(raw.LINK_EXPIRATION),
      forceSign: readBoolean(raw.LINK_FORCE_SIGN),
      proxy: readBoolean(raw.LINK_PROXY),
    },
    drive: {
      rootDir: readString(raw.ROOT_DIR) || DEFAULT_ROOT_DIR,
    },
    microsoft: {
      clientId: readString(raw.CLIENT_ID),
      clientSecret: readString(raw.CLIENT_SECRET),
      entraIdEndpoint:
        readString(raw.ENTRA_ID_ENDPOINT) || DEFAULT_ENTRA_ID_ENDPOINT,
      graphEndpoint: readString(raw.GRAPH_ENDPOINT) || DEFAULT_GRAPH_ENDPOINT,
    },
    s3: {
      accessKeyId: readString(raw.S3_ACCESS_KEY_ID),
      bucket: readString(raw.S3_BUCKET) || DEFAULT_S3_BUCKET,
      secretAccessKey: readString(raw.S3_SECRET_ACCESS_KEY),
    },
  };
}

export function getEnvConfig<E extends Env>(c: Context<E>) {
  return createEnvConfig(env(c) as AppRuntimeEnv);
}
