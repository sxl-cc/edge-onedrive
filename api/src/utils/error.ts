import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError extends Error {
  status: ContentfulStatusCode;
  details: unknown;
  code?: string;
  constructor(
    message: string,
    options: { status: ContentfulStatusCode; details: unknown; code?: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.details = options.details;
    this.code = options.code;
  }
}
