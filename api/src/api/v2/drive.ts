import { type } from "arktype";
import { arkVali } from "../../middleware/ark-vali";
import { auth } from "../../middleware/auth";
import { createMsGraphSDK, fullPath } from "../../ms-graph/client";
import {
  shouldSignDownloadLink,
  verifyDownloadSignature,
} from "../../ms-graph/signature";
import { getEnvConfig } from "../../utils/env";
import { ApiError } from "../../utils/error";
import type { V2App } from ".";

const MAX_SIMPLE_UPLOAD_SIZE = 250 * 1024 * 1024;

const driveListPayload = type({
  path: "string",
  "page_size?": "number.integer > 0",
  "next_token?": "string",
});

const driveGetPayload = type({
  path: "string",
  "select?": "string",
});

const driveDeleteItemPayload = type({
  path: "string > 0",
  "if_match?": "string",
  "prefer?": "string",
});

const driveGetDownloadUrlPayload = type({
  path: "string > 0",
  "sign?": "string",
});

function encodeDrivePath(path: string) {
  return encodeURIComponent(path);
}

export function registerV2DriveRoutes(v2: V2App) {
  v2.post(
    "/drive.list",
    auth((c) => getEnvConfig(c).auth.guest),
    arkVali("json", driveListPayload),
    async (c) => {
      const payload = c.req.valid("json");
      const sdk = await createMsGraphSDK(c);
      const res = await sdk.listDir({
        path: fullPath(c, encodeDrivePath(payload.path)),
        pageSize: payload.page_size,
        nextToken: payload.next_token,
        select:
          "name,size,createdDateTime,lastModifiedDateTime,folder,file,image,video",
      });

      return c.json(res);
    }
  );

  v2.post(
    "/drive.get",
    auth((c) => getEnvConfig(c).auth.guest),
    arkVali("json", driveGetPayload),
    async (c) => {
      const payload = c.req.valid("json");
      const sdk = await createMsGraphSDK(c);
      const res = await sdk.getItemDetails({
        originalPath: payload.path,
        path: fullPath(c, encodeDrivePath(payload.path)),
        select:
          payload.select ||
          "name,size,createdDateTime,lastModifiedDateTime,folder,file,image,video,thumbnails",
      });

      return c.json(res);
    }
  );

  v2.post("/drive.uploadFile", auth(), async (c) => {
    const form = await c.req.formData();
    const path = form.get("path");
    const file = form.get("file");

    if (typeof path !== "string" || !path) {
      throw new ApiError("Multipart field 'path' is required", {
        status: 400,
        details: {
          target: "form",
          field: "path",
        },
        code: "INVALID_REQUEST_PAYLOAD",
      });
    }

    if (!(file instanceof File)) {
      throw new ApiError("Multipart field 'file' is required", {
        status: 400,
        details: {
          target: "form",
          field: "file",
        },
        code: "INVALID_REQUEST_PAYLOAD",
      });
    }

    if (file.size > MAX_SIMPLE_UPLOAD_SIZE) {
      throw new ApiError("File is too large for simple upload", {
        status: 413,
        details: {
          field: "file",
          maxSize: MAX_SIMPLE_UPLOAD_SIZE,
        },
        code: "FILE_TOO_LARGE",
      });
    }

    const sdk = await createMsGraphSDK(c);
    const res = await sdk.uploadFile({
      path: fullPath(c, encodeDrivePath(path)),
      contentType: file.type || undefined,
      body: file.stream(),
    });

    return c.json(res);
  });

  v2.post(
    "/drive.deleteItem",
    auth(),
    arkVali("json", driveDeleteItemPayload),
    async (c) => {
      const payload = c.req.valid("json");
      const sdk = await createMsGraphSDK(c);
      await sdk.deleteItem({
        path: fullPath(c, encodeDrivePath(payload.path)),
        ifMatch: payload.if_match,
        prefer: payload.prefer,
      });

      return c.json({
        success: true,
      });
    }
  );

  v2.post(
    "/drive.getDownloadUrl",
    arkVali("json", driveGetDownloadUrlPayload),
    async (c) => {
      const payload = c.req.valid("json");
      const config = getEnvConfig(c);
      const downloadSignature = {
        clientId: config.microsoft.clientId,
        clientSecret: config.microsoft.clientSecret,
        expirationHours: config.download.expirationHours,
        forceSign: config.download.forceSign,
      };

      if (config.download.forceSign && !payload.sign) {
        throw new ApiError("Request field 'sign' is required", {
          status: 400,
          details: {
            target: "json",
            field: "sign",
          },
          code: "INVALID_REQUEST_PAYLOAD",
        });
      }

      if (shouldSignDownloadLink(downloadSignature)) {
        await verifyDownloadSignature({
          options: downloadSignature,
          path: payload.path,
          sign: payload.sign,
        });
      }

      const sdk = await createMsGraphSDK(c);
      const res = await sdk.getItemDetails({
        path: fullPath(c, encodeDrivePath(payload.path)),
        select: "content.downloadUrl",
        signDownload: false,
      });

      if ("download_url" in res) {
        return c.json({
          download_url: res.download_url,
        });
      }

      return c.notFound();
    }
  );
}
