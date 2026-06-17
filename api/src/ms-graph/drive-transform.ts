import type {
  MsGraphDriveItem,
  MsGraphDriveItemFolder,
  MsGraphDriveItemImage,
  MsGraphDriveItemVideo,
  MsGraphRawDriveItem,
} from "./drive-types";

export function transformDriveItem(
  item: MsGraphRawDriveItem
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
    download_url: item["@microsoft.graph.downloadUrl"] || undefined,
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
