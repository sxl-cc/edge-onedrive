type OfficeType = "word" | "excel" | "powerpoint" | "pdf" | "unknown";

const OFFICE_MIME_MAP: Record<string, OfficeType> = {
  // Word
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "word",
  "application/vnd.ms-word.document.macroenabled.12": "word",

  // Excel
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "application/vnd.ms-excel.sheet.macroenabled.12": "excel",

  // PowerPoint
  "application/vnd.ms-powerpoint": "powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "powerpoint",
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": "powerpoint",

  // PDF
  "application/pdf": "pdf",
};

export function getOfficeTypeByMime(mimeType: string): OfficeType {
  const mime = mimeType.toLowerCase().split(";")[0].trim();
  return OFFICE_MIME_MAP[mime] ?? "unknown";
}

export function detectFileType(mimeType: string, filename: string) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType.startsWith("application/zip")) {
    return "zip";
  }
  if (mimeType.startsWith("text")) {
    if (mimeType.includes("markdown")) {
      return "markdown";
    }
    return "text";
  }

  const office = getOfficeTypeByMime(mimeType);
  if (office !== "unknown") {
    return office;
  }

  if (mimeType === "application/octet-stream") {
    const splitNames = filename.split(".");
    if (splitNames.length > 1) {
      const ext = splitNames.at(-1)!.toLowerCase();
      if (ext === "rar") {
        return "rar";
      }
    }
  }

  return "unknown";
}
