"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  defaultLocale,
  getMessages,
  supportedLocales,
  type Locale,
  type MessageKey,
  type Messages
} from "@/lib/i18n";

const STORAGE_KEY = "arcticmap.locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  messages: Messages;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const normalizeLocale = (value: string | null | undefined): Locale => {
  if (!value) return defaultLocale;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("en")) return "en";
  return defaultLocale;
};

const detectLocale = (): Locale => {
  if (typeof window === "undefined") return defaultLocale;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && supportedLocales.includes(stored as Locale)) {
    return stored as Locale;
  }

  return normalizeLocale(window.navigator.language);
};

export default function LanguageProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!supportedLocales.includes(nextLocale)) return;
    setLocaleState(nextLocale);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (key: MessageKey) => {
      const value = messages[key];
      return typeof value === "string" ? value : "";
    },
    [messages]
  );

  const contextValue = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, messages, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};