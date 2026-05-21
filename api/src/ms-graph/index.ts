import {
  authByCode,
  type MsGraphAuthByCodePayload,
  refreshToken,
} from "./auth";
import {
  deleteItem,
  getItemDetails,
  listDir,
  type MsGraphDeleteItemPayload,
  type MsGraphGetItemPayload,
  type MsGraphListDrivePayload,
  type MsGraphUploadFilePayload,
  uploadFile,
} from "./drive";
import type { MsGraphDownloadSignatureOptions } from "./signature";
import { MsGraphError, msGraphFetch } from "./utils";

export type MsGraphTokensChangeHandler = (tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}) => void | Promise<void>;

export interface MsGraphSDKParameters {
  accessToken?: string;
  // Client ID of the Microsoft Entra app registration
  // Required for auth flows
  clientId?: string;
  // Client secret for confidential client Microsoft Entra app registrations
  // Required for auth flows
  clientSecret?: string;
  downloadSignature?: MsGraphDownloadSignatureOptions;
  // Microsoft Entra ID endpoint, default to https://login.microsoftonline.com
  entraIdEndpoint?: string;
  // Microsoft Graph endpoint, default to https://graph.microsoft.com
  graphEndpoint?: string;
  // callback when access token or refresh token is updated, useful for persisting tokens in storage
  onTokensChange?: MsGraphTokensChangeHandler;
  refreshToken?: string;
  // Tenant ID for Microsoft Entra ID, optional if using multi-tenant app registration
  // defaults to "common" if not provided, which allows authentication across all tenants
  tenantId?: string;
  tokenExpiresAt?: number;
}

export class MsGraphSDK {
  entraIdEndpoint: string;
  graphEndpoint: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  downloadSignature?: MsGraphDownloadSignatureOptions;
  onTokensChange: MsGraphTokensChangeHandler;
  constructor(parameters: MsGraphSDKParameters) {
    this.entraIdEndpoint =
      parameters.entraIdEndpoint || "https://login.microsoftonline.com";
    this.graphEndpoint =
      parameters.graphEndpoint || "https://graph.microsoft.com";
    this.tenantId = parameters.tenantId || "common";
    this.clientId = parameters.clientId || "";
    this.clientSecret = parameters.clientSecret || "";
    this.accessToken = parameters.accessToken;
    this.refreshToken = parameters.refreshToken;
    this.downloadSignature = parameters.downloadSignature;
    // biome-ignore lint/suspicious/noEmptyBlockStatements: noop
    this.onTokensChange = parameters.onTokensChange || (() => {});
    this.tokenExpiresAt = parameters.tokenExpiresAt;
  }

  getTokenRequestContext() {
    return {
      entraIdEndpoint: this.entraIdEndpoint,
      graphEndpoint: this.graphEndpoint,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      tenant: this.tenantId,
      refreshToken: this.refreshToken,
      accessToken: this.accessToken,
    };
  }

  private async changeTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiresAt = Date.now() + tokens.expiresIn * 1000;
    await this.onTokensChange({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: this.tokenExpiresAt,
    });
  }

  async authByCode(payload: MsGraphAuthByCodePayload) {
    const res = await authByCode(this, payload);
    await this.changeTokens({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresIn: res.expires_in,
    });

    return res;
  }

  async graphFetch(path: string, options: RequestInit = {}) {
    await this.refreshAllTokens(false);

    if (!this.accessToken) {
      throw new MsGraphError("No access token available", {
        status: 400,
        details: null,
        code: "no_access_token",
      });
    }

    let res = await msGraphFetch(
      this.graphEndpoint,
      this.accessToken,
      path,
      options
    );
    if (res.status === 401) {
      try {
        // Try to refresh token and retry once if unauthorized
        await this.refreshAllTokens(true);
      } catch (err) {
        console.error("Failed to refresh token after 401 response", err);
        return res;
      }

      res = await msGraphFetch(
        this.graphEndpoint,
        this.accessToken || "",
        path,
        options
      );
    }

    return res;
  }

  async refreshAllTokens(force: boolean) {
    if (!this.refreshToken) {
      throw new MsGraphError("No refresh token available", {
        status: 400,
        details: null,
        code: "no_refresh_token",
      });
    }

    if (!force) {
      const now = Date.now();
      if (this.tokenExpiresAt && this.tokenExpiresAt > now + 60_000) {
        // If the token is not expired and will not expire within the next 60 seconds, do not refresh yet
        return;
      }
    }

    const res = await refreshToken(this);
    await this.changeTokens({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresIn: res.expires_in,
    });
  }

  listDir(payload: MsGraphListDrivePayload) {
    return listDir(this, payload);
  }

  getItemDetails(payload: MsGraphGetItemPayload) {
    return getItemDetails(this, payload);
  }

  uploadFile(payload: MsGraphUploadFilePayload) {
    return uploadFile(this, payload);
  }

  deleteItem(payload: MsGraphDeleteItemPayload) {
    return deleteItem(this, payload);
  }
}
