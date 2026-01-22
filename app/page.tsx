"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const snapshots = [
  {
    label: "Day 1",
    date: "2024-02-01",
    iceCoverage: 92,
    extent: 14.2,
    drift: "NNE",
    change: "+0.4"
  },
  {
    label: "Day 2",
    date: "2024-02-05",
    iceCoverage: 88,
    extent: 13.8,
    drift: "NE",
    change: "-0.6"
  },
  {
    label: "Day 3",
    date: "2024-02-10",
    iceCoverage: 82,
    extent: 13.1,
    drift: "E",
    change: "-0.7"
  },
  {
    label: "Day 4",
    date: "2024-02-15",
    iceCoverage: 76,
    extent: 12.6,
    drift: "ESE",
    change: "-0.5"
  }
];

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = snapshots[activeIndex];

  const iceStyle = useMemo(() => {
    const scale = 0.68 + active.iceCoverage / 200;
    const opacity = 0.45 + active.iceCoverage / 200;
    return {
      transform: `scale(${scale.toFixed(2)})`,
      opacity: opacity.toFixed(2)
    } as const;
  }, [active]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 px-6 py-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-500">
            Arctic Ice Mapper
          </p>
          <div className="flex flex-col gap-3">
            <h1 className="text-balance text-4xl font-semibold text-slate-900 md:text-5xl">
              Animate Arctic ice shifts across key observation days
            </h1>
            <p className="max-w-2xl text-base text-slate-600 md:text-lg">
              Select a snapshot to compare simulated ice coverage, drift, and
              extent. The map responds instantly, emphasizing changes in
              thickness and coverage with smooth transitions.
            </p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Selected day</p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {active.label}
                </h2>
                <p className="text-sm text-slate-500">{active.date}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshots.map((snapshot, index) => (
                  <Button
                    key={snapshot.date}
                    variant={index === activeIndex ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setActiveIndex(index)}
                  >
                    {snapshot.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
              <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_65%)]" />
                <svg
                  viewBox="0 0 400 400"
                  className="relative h-80 w-80"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                    <linearGradient id="ice" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                  </defs>
                  <circle cx="200" cy="200" r="170" fill="url(#ocean)" />
                  <g
                    style={iceStyle}
                    className="origin-center transition-all duration-700 ease-out"
                  >
                    <path
                      d="M110 140C150 95 250 80 290 140C330 200 310 280 240 305C180 330 120 280 100 230C85 195 90 165 110 140Z"
                      fill="url(#ice)"
                    />
                    <path
                      d="M140 190C170 165 235 155 260 185C285 215 275 260 235 270C200 280 160 260 145 230C135 215 130 205 140 190Z"
                      fill="#e2e8f0"
                      opacity="0.8"
                    />
                  </g>
                </svg>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow">
                  Ice coverage: {active.iceCoverage}%
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Extent (million km²)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {active.extent}
                  </p>
                  <p className="text-xs text-slate-500">Change: {active.change}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Drift Direction
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {active.drift}
                  </p>
                  <p className="text-xs text-slate-500">Wind-influenced flow</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Trend
                  </p>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-400 transition-all duration-700"
                      style={{ width: `${active.iceCoverage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Coverage relative to winter baseline
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-slate-600">Highlights</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Daily ice evolution
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Track simulated day-to-day shifts with quick selection and
                animated overlays.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {snapshots.map((snapshot, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={snapshot.date}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "border-sky-400 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-sky-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {snapshot.label}
                        </p>
                        <p className="text-xs text-slate-500">{snapshot.date}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">
                        {snapshot.iceCoverage}%
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-sky-400 transition-all duration-700"
                        style={{ width: `${snapshot.iceCoverage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Forecast note
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Ice concentration is estimated from remote sensing composites and
                is intended for visual storytelling only.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
