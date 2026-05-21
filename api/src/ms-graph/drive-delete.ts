import type { MsGraphSDK } from ".";
import { rootDriveItemPath } from "./drive-path";
import type { MsGraphDeleteItemPayload } from "./drive-types";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export async function deleteItem(
  sdk: MsGraphSDK,
  payload: MsGraphDeleteItemPayload
) {
  const headers = new Headers();
  if (payload.ifMatch) {
    headers.set("If-Match", payload.ifMatch);
  }
  if (payload.prefer) {
    headers.set("Prefer", payload.prefer);
  }

  const res = await sdk.graphFetch(rootDriveItemPath(payload.path), {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const data = await parseMsResponseBody(res);
    throw toMsGraphError(data, res.status);
  }
}
