"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { supportedLocales } from "@/lib/i18n";

const localeLabels: Record<string, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  fr: "Français",
  es: "Español"
};

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span>{t("languageLabel")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200"
        aria-label={t("languageLabel")}
      >
        {supportedLocales.map((item) => (
          <option key={item} value={item}>
            {localeLabels[item] ?? item}
          </option>
        ))}
      </select>
    </label>
  );
}