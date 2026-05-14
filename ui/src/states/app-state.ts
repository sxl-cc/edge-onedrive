import { createMemo } from "solid-js";
import { defineGlobalStore } from "solid-tiny-context";
import type { Locale } from "../i18n";

const appState = defineGlobalStore("app-state", {
  state: () => ({
    isDark: false,
    hue: 165,
    locale: "en" as Locale,
  }),
  persist: "localStorage",
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
