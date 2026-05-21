import type { MsGraphSDK } from ".";
import { rootDriveItemPath } from "./drive-path";
import { transformDriveItem } from "./drive-transform";
import type {
  MsGraphRawDriveItem,
  MsGraphUploadFilePayload,
  StreamingRequestInit,
} from "./drive-types";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export async function uploadFile(
  sdk: MsGraphSDK,
  payload: MsGraphUploadFilePayload
) {
  const headers = new Headers();
  headers.set(
    "Content-Type",
    payload.contentType || "application/octet-stream"
  );
  const requestInit: StreamingRequestInit = {
    method: "PUT",
    headers,
    body: payload.body,
  };

  if (payload.body instanceof ReadableStream) {
    requestInit.duplex = "half";
  }

  const res = await sdk.graphFetch(
    `${rootDriveItemPath(payload.path)}/content`,
    requestInit
  );
  const data = (await parseMsResponseBody(res)) as MsGraphRawDriveItem;
  if (!res.ok) {
    throw toMsGraphError(data, res.status);
  }

  return transformDriveItem(data);
}
