import type { ContentfulStatusCode } from "hono/utils/http-status";

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ApiErrorDetails = Record<string, JsonValue> | null;

export class ApiError<
  TDetails extends ApiErrorDetails = ApiErrorDetails,
> extends Error {
  code: string;
  details: TDetails;
  status: ContentfulStatusCode;
  constructor(
    message: string,
    options: {
      code: string;
      details?: TDetails;
      status: ContentfulStatusCode;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.details = options.details ?? (null as TDetails);
    this.code = options.code;
  }
}
