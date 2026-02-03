"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { supportedLocales } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <span className="w-full">{t("languageLabel")}</span>
      <Select value={locale} onValueChange={(value) => setLocale(value as typeof locale)}>
        <SelectTrigger
          aria-label={t("languageLabel")}
          className="border-slate-700 bg-slate-900/60 text-xs text-slate-200"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-slate-700 bg-slate-900 text-xs text-slate-200">
          <SelectGroup>
            {supportedLocales.map((item) => (
              <SelectItem key={item} value={item}>
                {localeLabels[item] ?? item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}