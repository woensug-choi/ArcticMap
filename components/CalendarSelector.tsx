"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/components/LanguageProvider";

interface CalendarSelectorProps {
  availableDates: string[];
  activeDate: string;
  setActiveDate: Dispatch<SetStateAction<string>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  playbackSpeed: number;
  setPlaybackSpeed: Dispatch<SetStateAction<number>>;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${pad2(month + 1)}-${pad2(day)}`;

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
};

const buildCalendar = (year: number, month: number) => {
  const first = new Date(Date.UTC(year, month, 1));
  const startDay = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export default function CalendarSelector({
  availableDates,
  activeDate,
  setActiveDate,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed
}: CalendarSelectorProps) {
  const { t, messages, locale } = useLanguage();
  const datesSet = useMemo(() => new Set(availableDates), [availableDates]);
  const datesIndex = useMemo(
    () => new Map(availableDates.map((date, index) => [date, index])),
    [availableDates],
  );

  const [viewMonth, setViewMonth] = useState(() => {
    const seed = activeDate || availableDates[availableDates.length - 1] || "";
    const dt = seed ? parseDateKey(seed) : new Date();
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() };
  });

  useEffect(() => {
    if (!activeDate) return;
    const dt = parseDateKey(activeDate);
    const next = { year: dt.getUTCFullYear(), month: dt.getUTCMonth() };
    setViewMonth((current) =>
      current.year === next.year && current.month === next.month ? current : next,
    );
  }, [activeDate]);

  const monthLabel = useMemo(() => {
    const dt = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(dt);
  }, [locale, viewMonth]);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale],
  );

  const { availableYears, monthsByYear } = useMemo(() => {
    const years = new Set<number>();
    const monthsMap = new Map<number, Set<number>>();
    for (const date of availableDates) {
      const parsed = parseDateKey(date);
      const year = parsed.getUTCFullYear();
      years.add(year);
      if (!monthsMap.has(year)) monthsMap.set(year, new Set());
      monthsMap.get(year)!.add(parsed.getUTCMonth());
    }
    if (years.size === 0) {
      years.add(viewMonth.year);
      monthsMap.set(viewMonth.year, new Set([viewMonth.month]));
    }
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const monthsByYear = new Map<number, number[]>();
    for (const [year, monthSet] of monthsMap.entries()) {
      monthsByYear.set(year, Array.from(monthSet).sort((a, b) => a - b));
    }
    return { availableYears: sortedYears, monthsByYear };
  }, [availableDates, viewMonth.year, viewMonth.month]);

  const availableMonths = useMemo(() => {
    const months = monthsByYear.get(viewMonth.year);
    if (months && months.length > 0) return months;
    return [viewMonth.month];
  }, [monthsByYear, viewMonth.year, viewMonth.month]);

  const calendarDays = useMemo(
    () => buildCalendar(viewMonth.year, viewMonth.month),
    [viewMonth],
  );

  const handlePrevDate = () => {
    if (!availableDates.length) return;
    const currentIndex = datesIndex.get(activeDate) ?? -1;
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex - 1 + availableDates.length) % availableDates.length
        : availableDates.length - 1;
    setActiveDate(availableDates[nextIndex]);
  };

  const handleNextDate = () => {
    if (!availableDates.length) return;
    const currentIndex = datesIndex.get(activeDate) ?? -1;
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + 1) % availableDates.length
        : 0;
    setActiveDate(availableDates[nextIndex]);
  };

  const handleYearChange = (value: number) => {
    const months = monthsByYear.get(value) ?? [];
    const fallbackMonth = months.includes(viewMonth.month)
      ? viewMonth.month
      : months[0] ?? 0;
    setViewMonth({ year: value, month: fallbackMonth });
  };

  const handleMonthChange = (value: number) => {
    setViewMonth({ year: viewMonth.year, month: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dateSelector")}</CardTitle>
        <p className="text-xs text-slate-400">
          {t("dateSelectorHint")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-slate-600 bg-transparent text-slate-200"
            onClick={handlePrevDate}
          >
            &lt;
          </Button>
          <div className="text-sm font-semibold text-slate-200">
            {monthLabel}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-slate-600 bg-transparent text-slate-200"
            onClick={handleNextDate}
          >
            &gt;
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <label className="flex flex-1 items-center gap-2">
            <span className="text-slate-400">{t("year")}</span>
            <select
              value={viewMonth.year}
              onChange={(event) => handleYearChange(Number(event.target.value))}
              className="h-7 flex-1 rounded border border-slate-700 bg-slate-900/60 px-2 text-xs text-slate-200"
              aria-label={t("year")}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 items-center gap-2">
            <span className="text-slate-400">{t("month")}</span>
            <select
              value={viewMonth.month}
              onChange={(event) => handleMonthChange(Number(event.target.value))}
              className="h-7 flex-1 rounded border border-slate-700 bg-slate-900/60 px-2 text-xs text-slate-200"
              aria-label={t("month")}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {monthFormatter.format(new Date(Date.UTC(viewMonth.year, month, 1)))}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
          {messages.weekdaysShort.map((day) => (
            <div key={day} className="py-1 font-semibold">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const dateKey = day ? toDateKey(viewMonth.year, viewMonth.month, day) : "";
            const isActive = day !== null && dateKey === activeDate;
            const matchesSnapshot = day !== null && datesSet.has(dateKey);
            return (
              <Button
                key={`${dateKey || "empty"}-${index}`}
                type="button"
                className={`h-7 rounded border text-[11px] transition-colors ${
                  day === null
                    ? "border-transparent bg-transparent"
                    : isActive
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : matchesSnapshot
                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-sky-400"
                        : "border-slate-700/40 bg-slate-900/40 text-slate-500"
                }`}
                onClick={() => {
                  if (!matchesSnapshot) return;
                  setActiveDate(dateKey);
                }}
              >
                {day ?? ""}
              </Button>
            );
          })}
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-slate-600 bg-slate-900/70 text-slate-200"
            onClick={() => setIsPlaying((value) => !value)}
          >
            {isPlaying ? t("animationStop") : t("animationStart")}
          </Button>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>{t("animationSpeed")}</span>
              <span>
                {(playbackSpeed / 1000).toFixed(1)}
                {t("secondsShort")}
              </span>
            </div>
            <Slider
              value={[playbackSpeed]}
              min={500}
              max={2000}
              step={100}
              onValueChange={(value) => setPlaybackSpeed(value[0] ?? 500)}
              aria-label={t("animationSpeed")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
