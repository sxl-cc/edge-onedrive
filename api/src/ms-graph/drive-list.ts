import type { MsGraphSDK } from ".";
import { rootDriveItemPath } from "./drive-path";
import { transformDriveItem } from "./drive-transform";
import type {
  MsGraphDriveItem,
  MsGraphListDrivePayload,
  MsGraphListDriveResponse,
} from "./drive-types";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export async function listDir(
  sdk: MsGraphSDK,
  payload: MsGraphListDrivePayload
): Promise<{
  next_token?: string;
  data: MsGraphDriveItem[];
}> {
  const path = `${rootDriveItemPath(payload.path)}/children`;

  const searchParams = new URLSearchParams({
    $select: payload.select,
    $top: `${payload.pageSize || 200}`,
    $skiptoken: payload.nextToken || "",
  });

  if (payload.select.includes("thumbnails")) {
    searchParams.set("$expand", "thumbnails");
  }

  const res = await sdk.graphFetch(`${path}?${searchParams.toString()}`);
  const data = (await parseMsResponseBody(res)) as MsGraphListDriveResponse;
  if (!res.ok) {
    throw toMsGraphError(data, res.status);
  }

  let nextToken: string | undefined;

  if (data["@odata.nextLink"]) {
    const url = new URL(data["@odata.nextLink"]);
    nextToken = url.searchParams.get("$skiptoken") || undefined;
  }

  return {
    next_token: nextToken,
    data: data.value.map(transformDriveItem),
  };
}
