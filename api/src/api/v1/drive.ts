import { createMsGraphSDK, fullPath } from "../../ms-graph/client";
import type { V1App } from ".";

export function registerV1DriveRoutes(v1: V1App) {
  v1.get("/drive/list/:path{.*}", async (c) => {
    const path = c.req.param("path");
    const ps = c.req.query("page_size");
    const pageSize = ps ? Number.parseInt(ps, 10) : undefined;
    const sdk = await createMsGraphSDK(c);

    const res = await sdk.listDir({
      path: fullPath(c, path),
      pageSize,
      nextToken: c.req.query("next_token"),
    });
    return c.json(res);
  });

  v1.get("/drive/get/:path{.*}", async (c) => {
    const path = c.req.param("path");
    const select = c.req.query("select");
    const sdk = await createMsGraphSDK(c);
    const res = await sdk.getItemDetails(fullPath(c, path), select);
    return c.json(res);
  });
}
