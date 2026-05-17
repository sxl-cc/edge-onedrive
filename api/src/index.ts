import { type Env, Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import v1 from "./api/v1";
import type { KeyValueStorage } from "./kv-storage";
import { authMiddleware } from "./middleware/auth";
import { createMsGraphSDK, fullPath } from "./ms-graph/client";
import { ApiError } from "./utils/error";

export interface AppEnv extends Env {
  Bindings: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    ROOT_DIR: string;
    ENTRA_ID_ENDPOINT: string;
    GRAPH_ENDPOINT: string;
    CORS_ORIGIN: string;
    DOWNLOAD_PROXY: boolean;
  };
  Variables: {
    kv: KeyValueStorage;
  };
}

export interface edgeOnedriveAppParams {
  kv: KeyValueStorage;
}

export function createEdgeOnedriveApp(params: edgeOnedriveAppParams) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const kv = params.kv;
    c.set("kv", kv);
    await next();
  });

  app
    .use(
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
    )
    .use(
      authMiddleware((c) => {
        const path = c.req.path;
        return path.startsWith("/api/v1/auth");
      })
    );

  app.get("/", (c) => c.text("edge-onedrive api"));

  app.get("/d/:file_path{.+}", async (c) => {
    const filePath = c.req.param("file_path");
    const sdk = await createMsGraphSDK(c);
    const file = await sdk.getItemDetails(fullPath(c, filePath));
    if (file.is_folder) {
      throw new ApiError("Can not download folder", {
        status: 400,
        details: file,
      });
    }

    if (!file.download_url) {
      throw new ApiError("Missing download url", {
        status: 400,
        details: file,
      });
    }

    if (env(c).DOWNLOAD_PROXY) {
      return fetch(file.download_url);
    }

    return c.redirect(file.download_url, 302);
  });

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
