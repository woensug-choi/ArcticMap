"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { DatasetResponse } from "@/lib/datasets";
import { calendarDays } from "@/lib/datasets";

interface CalendarSelectorProps {
  snapshots: DatasetResponse["snapshots"];
  activeDay: number | null;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  playbackSpeed: number;
  setPlaybackSpeed: Dispatch<SetStateAction<number>>;
}

export default function CalendarSelector({
  snapshots,
  activeDay,
  setActiveIndex,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed
}: CalendarSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Selector</CardTitle>
        <p className="text-xs text-slate-400">
          January 2026 · Use arrows to step days.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-slate-600 bg-transparent text-slate-200"
            onClick={() =>
              setActiveIndex(
                (current) =>
                  (current - 1 + snapshots.length) % snapshots.length
              )
            }
          >
            &lt;
          </Button>
          <div className="text-sm font-semibold text-slate-200">
            Jan 2026
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-slate-600 bg-transparent text-slate-200"
            onClick={() =>
              setActiveIndex((current) => (current + 1) % snapshots.length)
            }
          >
            &gt;
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
          {"Su Mo Tu We Th Fr Sa".split(" ").map((day) => (
            <div key={day} className="py-1 font-semibold">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const isActive = day === activeDay;
            const matchesSnapshot = snapshots.some(
              (snapshot) => Number(snapshot.date.split("-")[2]) === day
            );
            return (
              <Button
                key={`${day ?? "empty"}-${index}`}
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
                  if (day === null) return;
                  const indexMatch = snapshots.findIndex(
                    (snapshot) =>
                      Number(snapshot.date.split("-")[2]) === day
                  );
                  if (indexMatch >= 0) {
                    setActiveIndex(indexMatch);
                  }
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
            {isPlaying ? "Stop animation" : "Start Animation"}
          </Button>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Animation speed</span>
              <span>{(playbackSpeed / 1000).toFixed(1)}s</span>
            </div>
            <Slider
              value={[playbackSpeed]}
              min={500}
              max={2000}
              step={100}
              onValueChange={(value) => setPlaybackSpeed(value[0] ?? 500)}
              aria-label="Animation speed"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}