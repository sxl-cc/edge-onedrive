import { createMemo, createRoot } from "solid-js";
import {
  assignAccessors,
  createPersistedStore,
  makeEventListener,
} from "solid-tiny-utils";
import { getTimestamp } from "time-core";
import type { Locale } from "../i18n";
import { detectLanguage } from "../utils/lang";
import { req } from "../utils/req";

export interface TokensResp {
  access_token: string;
  expires_at: string;
  refresh_token: string;
}

const appState = createRoot(() => {
  const [state, setState] = createPersistedStore(
    {
      theme: "auto" as "auto" | "light" | "dark",
      themeMediaChanges: 1,
      locale: "auto" as Locale | "auto",
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
    },
    {
      name: "app-state",
    }
  );

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  makeEventListener(mediaQuery, "change", () => {
    setState("themeMediaChanges", (p) => p + 1);
  });

  const locale = createMemo(() => {
    if (state.locale === "auto") {
      return detectLanguage();
    }
    return state.locale;
  });

  const theme = createMemo(() => {
    if (state.theme === "auto" && state.themeMediaChanges) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    return state.theme as "light" | "dark";
  });

  const login = async (username: string, password: string) => {
    const tokens = await req.post<TokensResp>("/api/v1/auth/login", {
      username,
      password,
    });

    setState({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: getTimestamp(tokens.expires_at),
    });
  };

  const refresh = async () => {
    try {
      const tokens = await req.post<TokensResp>("/api/v1/auth/refresh", {
        refresh_token: state.refreshToken,
      });
      setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: getTimestamp(tokens.expires_at),
      });
    } catch (err) {
      setState({
        accessToken: "",
        refreshToken: "",
        expiresAt: 0,
      });

      throw err;
    }
  };

  const logout = () => {
    setState({
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
    });
  };

  return [
    assignAccessors(
      {},
      {
        theme,
        locale,
        isLoggedIn: createMemo(() => Boolean(state.accessToken)),
        accessToken: createMemo(() => state.accessToken),
        refreshToken: createMemo(() => state.refreshToken),
      }
    ),
    { login, logout, refresh, setState },
  ] as const;
});

export function useAppState() {
  return appState;
}

export function useTheme() {
  const [state, actions] = useAppState();
  const theme = createMemo(() => state.theme);
  const setTheme = (theme: "auto" | "light" | "dark") => {
    actions.setState("theme", theme);
  };

  return [theme, setTheme] as const;
}
