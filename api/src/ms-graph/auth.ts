import type { MsGraphSDK } from ".";
import { normalizeUrlBase, parseMsResponseBody, toMsGraphError } from "./utils";

export interface MsGraphAuthByCodePayload {
  code: string;
  redirectUri: string;
  scopes: string;
}

export interface MsGraphAuthResponse {
  access_token: string;
  expires_in: number;
  ext_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface MsGraphOAuthErrorResponse {
  correlation_id?: string;
  error: string;
  error_codes?: number[];
  error_description?: string;
  error_uri?: string;
  timestamp?: string;
  trace_id?: string;
}

async function requestToken(
  context: ReturnType<MsGraphSDK["getTokenRequestContext"]>,
  body: URLSearchParams
): Promise<MsGraphAuthResponse> {
  const response = await fetch(
    `${normalizeUrlBase(context.entraIdEndpoint)}/${context.tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  const data = await parseMsResponseBody(response);
  if (!response.ok) {
    throw toMsGraphError(data, response.status);
  }

  return data as MsGraphAuthResponse;
}

export async function authByCode(
  sdk: MsGraphSDK,
  payload: MsGraphAuthByCodePayload
): Promise<MsGraphAuthResponse> {
  const context = sdk.getTokenRequestContext();
  return await requestToken(
    context,
    new URLSearchParams({
      client_id: context.clientId,
      client_secret: context.clientSecret,
      code: payload.code,
      redirect_uri: payload.redirectUri,
      grant_type: "authorization_code",
      scope: payload.scopes,
    })
  );
}

export async function refreshToken(
  sdk: MsGraphSDK
): Promise<MsGraphAuthResponse> {
  const context = sdk.getTokenRequestContext();
  return await requestToken(
    context,
    new URLSearchParams({
      client_id: context.clientId,
      client_secret: context.clientSecret,
      refresh_token: context.refreshToken || "",
      grant_type: "refresh_token",
    })
  );
}
