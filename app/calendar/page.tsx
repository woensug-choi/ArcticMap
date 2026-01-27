"use client";

import { useEffect, useState } from "react";
import CalendarSelector from "@/components/CalendarSelector";
import { dataset as datasetData } from "@/lib/datasets";

export default function CalendarTestPage() {
  const dataset = datasetData;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  const snapshots = dataset?.snapshots ?? [];
  const active = snapshots[activeIndex] ?? null;
  const activeDay = active ? Number(active.date.split("-")[2]) : null;

  useEffect(() => {
    if (dataset && activeIndex >= dataset.snapshots.length) {
      setActiveIndex(0);
    }
  }, [dataset, activeIndex]);

  useEffect(() => {
    if (!isPlaying || snapshots.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % snapshots.length);
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, snapshots.length]);

  return (
    <main className="min-h-screen bg-[#111827] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Component test
          </p>
          <h1 className="text-2xl font-semibold">Calendar selector</h1>
        </header>
        <CalendarSelector
          snapshots={snapshots}
          activeDay={activeDay}
          setActiveIndex={setActiveIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
        />
      </div>
    </main>
  );
}
