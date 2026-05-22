import { createMemo } from "solid-js";
import { defineGlobalStore } from "solid-tiny-context";
import { getTimestamp } from "time-core";
import type { Locale } from "../i18n";
import { detectLanguage } from "../utils/lang";
import { req } from "../utils/req";

export interface TokensResp {
  access_token: string;
  expires_at: string;
  refresh_token: string;
}

const appState = defineGlobalStore("app-state", {
  state: () => ({
    theme: "auto" as "auto" | "light" | "dark",
    themeMediaChanges: 1,
    hue: 165,
    locale: "auto" as Locale | "auto",
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

    getLocale() {
      if (this.state.locale === "auto") {
        return detectLanguage();
      }
      return this.state.locale;
    },

    getTheme() {
      if (this.state.theme === "auto" && this.state.themeMediaChanges) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      return this.state.theme as "light" | "dark";
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

export function useTheme() {
  const [, actions] = useAppState();
  const theme = createMemo(() => actions.getTheme());
  const setTheme = (theme: "auto" | "light" | "dark") => {
    actions.setState("theme", theme);
  };

  return [theme, setTheme] as const;
}
