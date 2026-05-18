import { req } from "../utils/req";

export interface OneDriveAuthorizationSession {
  createdAt: number;
  redirectUri: string;
  state: string;
}

interface OneDriveAuthorizationUrlResp {
  authorization_url: string;
  redirect_uri: string;
  state: string;
}

export interface OneDriveAuthorizationResult {
  expires_at: string;
  scope: string;
  token_type: string;
}

export const ONEDRIVE_AUTH_SESSION_STORAGE_KEY = "onedrive-auth-session";

export function createOneDriveRedirectUri() {
  const fallbackRedirect = "http://localhost:5122/settings/onedrive/callback";

  if (typeof window === "undefined") {
    return fallbackRedirect;
  }

  return `${window.location.origin}/settings/onedrive/callback`;
}

export async function createOneDriveAuthorizationRequest() {
  const data = await req.post<OneDriveAuthorizationUrlResp>(
    "/api/v1/auth/ms-graph-authorization-url",
    {
      redirect_uri: createOneDriveRedirectUri(),
    }
  );

  return {
    authorizationUrl: data.authorization_url,
    sessionState: {
      createdAt: Date.now(),
      redirectUri: data.redirect_uri,
      state: data.state,
    },
  };
}

export async function exchangeOneDriveAuthorizationCode(
  sessionState: OneDriveAuthorizationSession,
  code: string
) {
  return await req.post<OneDriveAuthorizationResult>(
    "/api/v1/auth/ms-graph-authorization-code",
    {
      code,
      redirect_uri: sessionState.redirectUri,
    }
  );
}
