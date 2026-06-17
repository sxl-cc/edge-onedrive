import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ApiError, type ApiErrorDetails } from "../utils/error";

export function fetchWithAuth(
  uri: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(uri, {
    ...options,
    headers,
  });
}

export function normalizeUrlBase(url: string) {
  const trimmedUrl = url.trim();
  if (trimmedUrl.includes("://")) {
    return trimmedUrl.replace(/\/+$/, "");
  }

  return `https://${trimmedUrl}`.replace(/\/+$/, "");
}

export function msGraphFetch(
  graphEndpoint: string,
  accessToken: string,
  path: string,
  options: RequestInit = {}
) {
  const uri = `${normalizeUrlBase(graphEndpoint)}${path}`;
  return fetchWithAuth(uri, accessToken, options);
}

export function parseMsResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export class MsGraphError extends ApiError {
  constructor(
    message: string,
    options: {
      code: string;
      details?: ApiErrorDetails;
      status: ContentfulStatusCode;
    }
  ) {
    super(message, options);
    this.name = "MsGraphError";
  }
}

export function toMsGraphError(
  respData: unknown,
  status: number
): MsGraphError {
  if (
    typeof respData === "object" &&
    respData !== null &&
    "code" in respData &&
    typeof respData.code === "string"
  ) {
    const error = respData as { code: string; message?: string };
    return new MsGraphError(error.message ?? error.code, {
      status: (status as ContentfulStatusCode) || 500,
      details: {
        service: "microsoft_graph",
        status,
        upstreamCode: error.code,
      },
      code: "MS_GRAPH_REQUEST_FAILED",
    });
  }

  return new MsGraphError(
    `Microsoft Graph request failed with status ${status}`,
    {
      status: 500,
      details: {
        service: "microsoft_graph",
        status,
      },
      code: "MS_GRAPH_REQUEST_FAILED",
    }
  );
}
