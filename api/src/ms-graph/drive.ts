import type { MsGraphSDK } from ".";
import { createDownloadSignature, shouldSignDownloadLink } from "./signature";
import { parseMsResponseBody, toMsGraphError } from "./utils";

export interface MsGraphListDrivePayload {
  nextToken?: string;
  pageSize?: number;
  path?: string;
  select: string;
}

export interface MsGraphGetItemPayload {
  originalPath?: string;
  path: string;
  select: string;
  signDownload?: boolean;
}

export interface MsGraphUploadFilePayload {
  body: BodyInit;
  contentType?: string;
  path: string;
}

type StreamingRequestInit = RequestInit & {
  duplex?: "half";
};

export interface MsGraphDriveItemCommon {
  created_at: string;
  is_folder: boolean;
  last_modified_at: string;
  name: string;
  size: number;
}

export interface MsGraphDriveItemFile extends MsGraphDriveItemCommon {
  category: "image" | "video" | "unknown";
  download_url: string;
  is_folder: false;
  mime_type: string;
  sign?: string;
}

export interface MsGraphDriveItemImage extends MsGraphDriveItemFile {
  category: "image";
  height: number;
  thumbnail: {
    url: string;
    height: number;
    width: number;
  };
  width: number;
}

export interface MsGraphDriveItemVideo extends MsGraphDriveItemFile {
  category: "video";
  duration: number;
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
  | MsGraphDriveItemImage
  | MsGraphDriveItemVideo;

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
  video?: {
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    frameRate: number;
    fourCC: string;
  };
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

  const file: Exclude<MsGraphDriveItem, MsGraphDriveItemFolder> = {
    ...common,
    is_folder: false,
    mime_type: item.file?.mimeType || "application/octet-stream",
    download_url: item["@microsoft.graph.downloadUrl"] || "",
    category: "unknown",
  };

  if (item.thumbnails?.[0]?.medium) {
    const thumb = file as MsGraphDriveItemImage | MsGraphDriveItemVideo;
    thumb.thumbnail = item.thumbnails[0].medium;
  }

  if (item.image?.width) {
    const img = file as MsGraphDriveItemImage;
    img.width = item.image.width;
    img.height = item.image.height;
    img.category = "image";
  }

  if (item.video?.duration) {
    const video = file as MsGraphDriveItemVideo;
    video.duration = item.video.duration;
    video.width = item.video.width;
    video.height = item.video.height;
    video.category = "video";
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
  const path = `/v1.0/me/drive/root${p ? `:${p}:` : ""}/children`;

  const searchParams = new URLSearchParams({
    $select: payload.select,
    $top: `${payload.pageSize || 200}`,
    $skiptoken: payload.nextToken || "",
  });

  if (payload.select.includes("thumbnails")) {
    searchParams.set("$expand", "thumbnails");
  }

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

export async function getItemDetails(
  sdk: MsGraphSDK,
  payload: MsGraphGetItemPayload
) {
  const p = normalizePath(payload.path);
  const path = `/v1.0/me/drive/root${p ? `:${p}:` : ""}`;

  const searchParams = new URLSearchParams({
    $select: payload.select,
  });

  if (payload.select.includes("thumbnails")) {
    searchParams.set("$expand", "thumbnails($select=medium)");
  }

  const res = await sdk.graphFetch(`${path}?${searchParams.toString()}`);
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

export async function uploadFile(
  sdk: MsGraphSDK,
  payload: MsGraphUploadFilePayload
) {
  const p = normalizePath(payload.path);
  const path = `/v1.0/me/drive/root:${p}:/content`;
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

  const res = await sdk.graphFetch(path, requestInit);
  const data = (await parseMsResponseBody(res)) as MsGraphRawDriveItem;
  if (!res.ok) {
    throw toMsGraphError(data, res.status);
  }

  return transformDriveItem(data);
}
