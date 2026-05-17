import type { MsGraphDriveItem } from "~api";
import { detectFileType } from "../../utils/file-type";

export function getDriveItemIconClass(item: MsGraphDriveItem) {
  if (item.is_folder) {
    return "i-ri:folder-6-line";
  }
  const fileType = detectFileType(item.mime_type, item.name);
  switch (fileType) {
    case "image":
      return "i-ri:image-2-line";
    case "video":
      return "i-ri:video-line";
    case "audio":
      return "i-ri:music-2-line";
    case "zip":
    case "rar":
      return "i-ri:folder-zip-line";
    case "markdown":
      return "i-ri:markdown-line";
    case "text":
      return "i-ri:file-text-line";
    case "word":
      return "i-ri:file-word-line";
    case "excel":
      return "i-ri:file-excel-line";
    case "powerpoint":
      return "i-ri:file-ppt-line";
    case "pdf":
      return "i-ri:file-pdf-line";
    default:
      return "i-ri:file-3-line";
  }
}
