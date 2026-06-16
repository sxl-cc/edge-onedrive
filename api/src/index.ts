import { type Context, type Env, Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./api/v1";
import type { KeyValueStorage } from "./kv-storage";
import { type AppRuntimeEnv, getEnvConfig } from "./utils/env";
import { ApiError } from "./utils/error";

export interface AppEnv extends Env {
  Bindings: AppRuntimeEnv;
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
        const { origins } = getEnvConfig(c).cors;
        if (origins.includes("*")) {
          return "*";
        }
        if (origins.includes(origin)) {
          return origin;
        }

        return origins[0] ?? "*";
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
export type { MsGraphSDKParameters } from "./ms-graph";
export { MsGraphSDK } from "./ms-graph";
export type {
  MsGraphDriveItem,
  MsGraphDriveItemFile,
  MsGraphDriveItemFolder,
  MsGraphDriveItemImage,
} from "./ms-graph/drive";
