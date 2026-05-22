/* @refresh reload */
import { render } from "solid-js/web";
import { App } from "./app";

import "uno.css";
import "./styles.css";
import { flatten } from "@solid-primitives/i18n";
import type { Dictionary, RawDictionary } from "./i18n";
import { detectLanguage } from "./utils/lang";

const root = document.querySelector("#root");

if (!(root instanceof HTMLElement)) {
  throw new Error("Root element not found");
}

let dict: Dictionary | undefined;
let locale: string | undefined;

// Try to load the dictionary from localStorage to avoid a flash of untranslated content on startup
try {
  const appState = JSON.parse(localStorage.getItem("app-state") || "{}");
  const lang = appState?.state?.locale || "auto";
  const realLocale = ["en", "zh-cn"].includes(lang) ? lang : detectLanguage();
  if (realLocale) {
    const rawDict: RawDictionary = (
      await import(`./i18n/${realLocale}/index.ts`)
    ).dict;
    dict = flatten(rawDict);
    locale = realLocale;
  }
} catch (e) {
  console.error(e);
}

render(() => <App dict={dict} locale={locale} />, root);
