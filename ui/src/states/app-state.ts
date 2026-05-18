import { createMemo } from "solid-js";
import { defineGlobalStore } from "solid-tiny-context";
import { getTimestamp } from "time-core";
import type { Locale } from "../i18n";
import { req } from "../utils/req";

export interface TokensResp {
  access_token: string;
  expires_at: string;
  refresh_token: string;
}

const appState = defineGlobalStore("app-state", {
  state: () => ({
    isDark: false,
    hue: 165,
    locale: "en" as Locale,
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
  }),
  persist: "localStorage",
  methods: {
    async login(username: string, password: string) {
      const tokens = await req.post<TokensResp>("/api/v1/auth/login", {
        username,
        password,
      });

      this.actions.setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: getTimestamp(tokens.expires_at),
      });
    },

    async refresh() {
      try {
        const tokens = await req.post<TokensResp>("/api/v1/auth/refresh", {
          refresh_token: this.state.refreshToken,
        });
        this.actions.setState({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: getTimestamp(tokens.expires_at),
        });
      } catch (err) {
        this.actions.setState({
          accessToken: "",
          refreshToken: "",
          expiresAt: 0,
        });

        throw err;
      }
    },

    logout() {
      this.actions.setState({
        accessToken: "",
        refreshToken: "",
        expiresAt: 0,
      });
    },
  },
});

export function useAppState() {
  return appState;
}

export function useDarkMode() {
  const [state, actions] = useAppState();
  const isDark = createMemo(() => state.isDark);
  const setIsDark = (isDark: boolean) => actions.setState("isDark", isDark);

  return [isDark, setIsDark] as const;
}
