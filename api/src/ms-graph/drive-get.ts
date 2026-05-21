import type { MsGraphSDK } from ".";
import { rootDriveItemPath } from "./drive-path";
import { transformDriveItem } from "./drive-transform";
import type { MsGraphGetItemPayload, MsGraphRawDriveItem } from "./drive-types";
import { createDownloadSignature, shouldSignDownloadLink } from "./signature";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export async function getItemDetails(
  sdk: MsGraphSDK,
  payload: MsGraphGetItemPayload
) {
  const searchParams = new URLSearchParams({
    $select: payload.select,
  });

  if (payload.select.includes("thumbnails")) {
    searchParams.set("$expand", "thumbnails($select=medium)");
  }

  const res = await sdk.graphFetch(
    `${rootDriveItemPath(payload.path)}?${searchParams.toString()}`
  );
  const data = (await parseMsResponseBody(res)) as MsGraphRawDriveItem;
  if (!res.ok) {
    throw toMsGraphError(data, res.status);
  }

  const item = transformDriveItem(data);
  if (
    !item.is_folder &&
    sdk.downloadSignature &&
    payload.signDownload !== false &&
    shouldSignDownloadLink(sdk.downloadSignature)
  ) {
    item.sign = await createDownloadSignature(
      payload.originalPath || payload.path,
      sdk.downloadSignature
    );
  }

  return item;
}
