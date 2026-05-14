export interface OAuthDebugForm {
  authorityHost: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  tenant: string;
}

export interface OAuthDebugSession {
  authorityHost: string;
  clientId: string;
  clientSecret: string;
  createdAt: number;
  redirectUri: string;
  scopes: string;
  state: string;
  tenant: string;
}

export const PKCE_FORM_STORAGE_KEY = "oauth-debug-form";
export const PKCE_SESSION_STORAGE_KEY = "oauth-debug-session";

function randomString(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function createAuthorityBase(authorityHost: string, tenant: string) {
  const normalizedHost = authorityHost.trim().replace(/\/+$/, "");
  const normalizedTenant = tenant.trim() || "common";
  return `https://${normalizedHost}/${normalizedTenant}/oauth2/v2.0`;
}

export function createDefaultPkceForm(): OAuthDebugForm {
  const fallbackRedirect = "http://localhost:5122/debug/pkce/callback";
  const redirectUri =
    typeof window === "undefined"
      ? fallbackRedirect
      : `${window.location.origin}/debug/pkce/callback`;

  return {
    authorityHost: "login.microsoftonline.com",
    tenant: "common",
    clientId: "",
    clientSecret: "",
    redirectUri,
    scopes: "openid profile offline_access Files.Read",
  };
}

export function createAuthorizationRequest(form: OAuthDebugForm) {
  const state = randomString(24);

  const sessionState: OAuthDebugSession = {
    authorityHost: form.authorityHost.trim(),
    tenant: form.tenant.trim() || "common",
    clientId: form.clientId.trim(),
    clientSecret: form.clientSecret,
    redirectUri: form.redirectUri.trim(),
    scopes: form.scopes.trim(),
    state,
    createdAt: Date.now(),
  };

  const url = new URL(
    `${createAuthorityBase(form.authorityHost, form.tenant)}/authorize`
  );

  url.searchParams.set("client_id", sessionState.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", sessionState.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", sessionState.scopes);
  url.searchParams.set("state", state);

  return {
    sessionState,
    authorizationUrl: url.toString(),
  };
}

export async function exchangeAuthorizationCode(
  sessionState: OAuthDebugSession,
  code: string
) {
  const response = await fetch("/api/v1/debug/pkce/token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      authorityHost: sessionState.authorityHost,
      tenant: sessionState.tenant,
      clientId: sessionState.clientId,
      clientSecret: sessionState.clientSecret,
      redirectUri: sessionState.redirectUri,
      scopes: sessionState.scopes,
      code,
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof data.error_description === "string"
        ? data.error_description
        : // biome-ignore lint/style/noNestedTernary: ok
          typeof data.error === "string"
          ? data.error
          : "Token exchange failed";

    throw new Error(message);
  }

  return data;
}
