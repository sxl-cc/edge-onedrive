import type { ContentfulStatusCode } from "hono/utils/http-status";
import { escapeXml, xmlResponse } from "./xml";

export class S3Error extends Error {
  code: string;
  status: ContentfulStatusCode;

  constructor(code: string, message: string, status: ContentfulStatusCode) {
    super(message);
    this.name = "S3Error";
    this.code = code;
    this.status = status;
  }
}

export function s3ErrorResponse(error: S3Error, resource = "") {
  return xmlResponse(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Error>",
      `<Code>${escapeXml(error.code)}</Code>`,
      `<Message>${escapeXml(error.message)}</Message>`,
      `<Resource>${escapeXml(resource)}</Resource>`,
      "</Error>",
    ].join(""),
    { status: error.status }
  );
}
