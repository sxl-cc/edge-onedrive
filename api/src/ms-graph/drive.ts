import type { MsGraphSDK } from ".";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export interface MsGraphListDrivePayload {
  nextToken?: string;
  pageSize?: number;
  path?: string;
}

export interface MsGraphDriveItemCommon {
  created_at: string;
  is_folder: boolean;
  last_modified_at: string;
  name: string;
  size: number;
}

export interface MsGraphDriveItemFile extends MsGraphDriveItemCommon {
  download_url: string;
  is_folder: false;
  mime_type: string;
}

export interface MsGraphDriveItemImage extends MsGraphDriveItemFile {
  height: number;
  thumbnail: {
    url: string;
    height: number;
    width: number;
  };
  width: number;
}

export interface MsGraphDriveItemFolder extends MsGraphDriveItemCommon {
  child_count: number;
  is_folder: true;
}

export type MsGraphDriveItem =
  | MsGraphDriveItemFile
  | MsGraphDriveItemFolder
  | MsGraphDriveItemImage;

interface MsGraphRawDriveItem {
  "@microsoft.graph.downloadUrl"?: string;
  createdDateTime: string;
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
  image?: {
    height: number;
    width: number;
  };
  lastModifiedDateTime: string;
  name: string;
  size: number;
  thumbnails?: {
    medium?: {
      url: string;
      height: number;
      width: number;
    };
  }[];
}

interface MsGraphListDriveResponse {
  "@odata.nextLink"?: string;
  value: MsGraphRawDriveItem[];
}

function transformDriveItem(
  item: MsGraphListDriveResponse["value"][number]
): MsGraphDriveItem {
  const common = {
    name: item.name,
    size: item.size,
    created_at: item.createdDateTime,
    last_modified_at: item.lastModifiedDateTime,
    is_folder: Boolean(item.folder),
  };

  if (item.folder) {
    return {
      ...common,
      is_folder: true,
      child_count: item.folder.childCount,
    };
  }

  const file: MsGraphDriveItemFile = {
    ...common,
    is_folder: false,
    mime_type: item.file?.mimeType || "application/octet-stream",
    download_url: item["@microsoft.graph.downloadUrl"] || "",
  };

  if (item.image) {
    return {
      ...file,
      height: item.image.height,
      width: item.image.width,
      thumbnail: item.thumbnails?.[0]?.medium ?? {
        url: "",
        height: 0,
        width: 0,
      },
    };
  }

  return file;
}

function normalizePath(path: string | undefined) {
  const realPath = (path || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!realPath) {
    return "";
  }

  return `/${realPath}`;
}

export async function listDir(
  sdk: MsGraphSDK,
  payload: MsGraphListDrivePayload
): Promise<{
  next_token?: string;
  data: MsGraphDriveItem[];
}> {
  const p = normalizePath(payload.path);
  const path = `/v1.0/me/drive/root:${p ? `${p}:` : ""}/children`;

  const searchParams = new URLSearchParams({
    $select:
      "name,size,createdDateTime,lastModifiedDateTime,folder,file,image,thumbnails",
    $top: `${payload.pageSize || 200}`,
    $skiptoken: payload.nextToken || "",
    $expand: "thumbnails($select=medium)",
  });

  const fullPath = `${path}?${searchParams.toString()}`;
  const res = await sdk.graphFetch(fullPath);
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

export async function getItemDetails(sdk: MsGraphSDK, itemPath: string) {
  const p = normalizePath(itemPath);
  const path = `/v1.0/me/drive/root${p ? `:${p}:` : ""}`;

  const searchParams = new URLSearchParams({
    // according to https://stackoverflow.com/questions/65883820/how-to-get-the-download-url-onedrive-graph-api
    // you should using `content.downloadUrl` to select `@microsoft.graph.downloadUrl`
    // or use `select` instead of `$select`
    $select:
      "name,size,createdDateTime,lastModifiedDateTime,folder,file,content.downloadUrl,image,thumbnails",
    $expand: "thumbnails($select=medium)",
  });

  const res = await sdk.graphFetch(`${path}?${searchParams.toString()}`);
  const data = (await parseMsResponseBody(res)) as MsGraphRawDriveItem;
  if (!res.ok) {
    throw toMsGraphError(data, res.status);
  }

  return transformDriveItem(data);
}
