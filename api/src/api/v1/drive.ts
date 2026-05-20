import { env } from "hono/adapter";
import { auth } from "../../middleware/auth";
import { createMsGraphSDK, fullPath } from "../../ms-graph/client";
import {
  shouldSignDownloadLink,
  verifyDownloadSignature,
} from "../../ms-graph/signature";
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
        select:
          "name,size,createdDateTime,lastModifiedDateTime,folder,file,image,video",
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

      const select = c.req.query("select") || "";
      const sdk = await createMsGraphSDK(c);
      const res = await sdk.getItemDetails({
        originalPath: path,
        path: fullPath(c, encodeURIComponent(path)),
        select:
          select ||
          "name,size,createdDateTime,lastModifiedDateTime,folder,file,image,video,thumbnails",
      });

      return c.json(res);
    }
  );

  v1.get("/drive/d/:path{.*}", async (c) => {
    const path = c.req.param("path");
    if (path === undefined) {
      throw new Error("path is required");
    }
    const {
      CLIENT_ID,
      CLIENT_SECRET,
      LINK_EXPIRATION,
      LINK_FORCE_SIGN,
      LINK_PROXY,
    } = env(c);
    const downloadSignature = {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      expirationHours: LINK_EXPIRATION,
      forceSign: isEnabled(LINK_FORCE_SIGN),
    };

    const combinedSign = c.req.query("sign");
    if (isEnabled(LINK_FORCE_SIGN) && !combinedSign) {
      throw new Error("sign is required");
    }

    if (shouldSignDownloadLink(downloadSignature)) {
      await verifyDownloadSignature({
        options: downloadSignature,
        path,
        sign: combinedSign,
      });
    }

    const sdk = await createMsGraphSDK(c);
    // according to https://stackoverflow.com/questions/65883820/how-to-get-the-download-url-onedrive-graph-api
    // you should using `content.downloadUrl` to select `@microsoft.graph.downloadUrl`
    // or use `select` instead of `$select`
    const res = await sdk.getItemDetails({
      path: fullPath(c, encodeURIComponent(path)),
      select: "content.downloadUrl",
      signDownload: false,
    });

    if ("download_url" in res) {
      if (isEnabled(LINK_PROXY)) {
        return fetch(res.download_url);
      }
      return c.redirect(res.download_url, 307);
    }

    return c.notFound();
  });
}
