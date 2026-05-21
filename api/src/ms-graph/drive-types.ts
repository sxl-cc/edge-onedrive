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

export interface MsGraphDeleteItemPayload {
  ifMatch?: string;
  path: string;
  prefer?: string;
}

export type StreamingRequestInit = RequestInit & {
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

export interface MsGraphRawDriveItem {
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

export interface MsGraphListDriveResponse {
  "@odata.nextLink"?: string;
  value: MsGraphRawDriveItem[];
}
