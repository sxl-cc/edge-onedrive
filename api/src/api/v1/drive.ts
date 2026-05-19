import { env } from "hono/adapter";
import { auth } from "../../middleware/auth";
import { createMsGraphSDK, fullPath } from "../../ms-graph/client";
import { isEnabled } from "../../utils/env";
import type { V1App } from ".";

export function registerV1DriveRoutes(v1: V1App) {
  v1.get(
    "/drive/list/:path{.*}",
    auth((c) => {
      const { ENABLE_GUEST } = env(c);
      return isEnabled(ENABLE_GUEST);
    }),
    async (c) => {
      const path = c.req.param("path");
      if (path === undefined) {
        throw new Error("path is required");
      }
      const ps = c.req.query("page_size");
      const pageSize = ps ? Number.parseInt(ps, 10) : undefined;
      const sdk = await createMsGraphSDK(c);
      const res = await sdk.listDir({
        path: fullPath(c, encodeURIComponent(path)),
        pageSize,
        nextToken: c.req.query("next_token"),
      });
      return c.json(res);
    }
  );

  v1.get(
    "/drive/get/:path{.*}",
    auth((c) => {
      const { ENABLE_GUEST } = env(c);
      return isEnabled(ENABLE_GUEST);
    }),
    async (c) => {
      const path = c.req.param("path");
      if (path === undefined) {
        throw new Error("path is required");
      }

      const select = c.req.query("select");
      const sdk = await createMsGraphSDK(c);
      const res = await sdk.getItemDetails(
        fullPath(c, encodeURIComponent(path)),
        select
      );
      return c.json(res);
    }
  );
}
