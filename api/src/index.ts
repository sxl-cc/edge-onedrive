import { type Context, type Env, Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import v1 from "./api/v1";
import type { KeyValueStorage } from "./kv-storage";
import { ApiError } from "./utils/error";

export interface AppEnv extends Env {
  Bindings: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    ROOT_DIR: string;
    ENTRA_ID_ENDPOINT: string;
    GRAPH_ENDPOINT: string;
    CORS_ORIGIN: string;
    LINK_PROXY: boolean | string;
    LINK_EXPIRATION: number | string;
    LINK_FORCE_SIGN: boolean | string;
    ENABLE_GUEST: boolean | string;
  };
  Variables: {
    kv: KeyValueStorage;
  };
}

export interface edgeOnedriveAppParams {
  kv: (c: Context<AppEnv>) => KeyValueStorage | Promise<KeyValueStorage>;
}

export function createEdgeOnedriveApp(params: edgeOnedriveAppParams) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const kv = params.kv;
    c.set("kv", await kv(c));
    await next();
  });

  app.use(
    "/api/*",
    cors({
      origin: (origin, c) => {
        const allowedOrigin: string | undefined = env(c).CORS_ORIGIN;
        if (allowedOrigin?.trim()) {
          const origins = allowedOrigin.split(",").map((o) => o.trim());
          if (origins.includes("*")) {
            return "*";
          }
          if (origins.includes(origin)) {
            return origin;
          }
        }

        return "*";
      },
    })
  );

  app.route("/api/v1", v1);

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(
        {
          message: err.message,
          code: err.code,
          details: err.details,
        },
        err.status
      );
    }

    return c.json(
      {
        message: err.message,
        code: "INTERNAL_SERVER_ERROR",
      },
      500
    );
  });

  return app;
}

export type { KeyValueStorage } from "./kv-storage";

export type {
  MsGraphDriveItem,
  MsGraphDriveItemFile,
  MsGraphDriveItemFolder,
  MsGraphDriveItemImage,
} from "./ms-graph/drive";
