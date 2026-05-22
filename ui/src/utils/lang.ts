import type { Locale } from "../i18n";

export function detectLanguage(): Locale {
  const lang = navigator.language.split("-")[0];
  if (lang.includes("zh")) {
    return "zh-cn";
  }
  return "en";
}
