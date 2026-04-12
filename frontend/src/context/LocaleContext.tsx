"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useSystemSettings } from "@/hooks/useSettings";
import {
  dictionaries,
  type Locale,
  type MessageKey,
} from "@/i18n/dictionaries";

const STORAGE_KEY = "hp_lang";

interface LocaleContextValue {
  locale: Locale;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSystemSettings();

  const locale: Locale = data?.prefs?.lang === "en" ? "en" : "es";

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const t = useMemo(() => {
    const dict = dictionaries[locale];
    return (key: MessageKey) => dict[key] ?? dictionaries.es[key] ?? key;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "es",
      t: (key: MessageKey) => dictionaries.es[key] ?? key,
    };
  }
  return ctx;
}
