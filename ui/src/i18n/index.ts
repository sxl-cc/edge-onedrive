import * as i18n from "@solid-primitives/i18n";
import { createQuery } from "solid-tiny-query";
import { useAppState } from "../states/app-state";
import type * as en from "./en";

export type Locale = "en" | "zh-cn";
export type RawDictionary = typeof en.dict;
export type Dictionary = i18n.Flatten<RawDictionary>;

export type TranslateKeys = keyof {
  [K in keyof Dictionary as Dictionary[K] extends string
    ? K
    : never]: Dictionary[K];
};

async function fetchDict(locale: Locale) {
  const dict: RawDictionary = (await import(`./${locale}/index.ts`)).dict;
  return i18n.flatten(dict) as Dictionary;
}

export function useTranslator() {
  const [, acts] = useAppState();
  const query = createQuery({
    queryKey: () => ["i18n", acts.getLocale()] as const,
    queryFn: ({ queryKey }) => fetchDict(queryKey[1]),
    staleTime: 3600 * 1000, // 1 hour
    placeholderData: {} as Dictionary,
  });

  const t = i18n.translator(() => query.data);

  // biome-ignore lint/suspicious/noExplicitAny: proxy
  return ((path: any, args: any) => t(path, args) ?? path) as typeof t;
}
