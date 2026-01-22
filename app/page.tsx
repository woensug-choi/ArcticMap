"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const baseLayerUrl =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Polar/Arctic_Ocean_Base/MapServer/tile/{z}/{y}/{x}";
const referenceLayerUrl =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Polar/Arctic_Ocean_Reference/MapServer/tile/{z}/{y}/{x}";
const iceLayerUrl =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Polar/Arctic_Ocean_Sea_Ice/MapServer/tile/{z}/{y}/{x}";

const snapshots = [
  {
    label: "Jan 12",
    date: "2026-01-12",
    extent: 13.92,
    anomaly: -0.34,
    drift: "NNE",
    concentration: 92
  },
  {
    label: "Jan 16",
    date: "2026-01-16",
    extent: 13.71,
    anomaly: -0.41,
    drift: "NE",
    concentration: 89
  },
  {
    label: "Jan 19",
    date: "2026-01-19",
    extent: 13.55,
    anomaly: -0.48,
    drift: "E",
    concentration: 86
  },
  {
    label: "Jan 21",
    date: "2026-01-21",
    extent: 13.42,
    anomaly: -0.53,
    drift: "ESE",
    concentration: 83
  }
];

const calendarDays = [
  null,
  null,
  null,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31
];

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const iceLayer = useRef<import("leaflet").TileLayer | null>(null);

  const active = snapshots[activeIndex];
  const activeDay = Number(active.date.split("-")[2]);

  const tileUrlWithTime = useMemo(() => {
    const time = new Date(`${active.date}T00:00:00Z`).getTime();
    return `${iceLayerUrl}?time=${time}`;
  }, [active.date]);

  useEffect(() => {
    let mounted = true;

    const setupMap = async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current || mapInstance.current) {
        return;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 6,
        preferCanvas: true
      }).setView([82, 0], 2);

      L.tileLayer(baseLayerUrl, {
        maxZoom: 6,
        opacity: 0.9
      }).addTo(map);

      L.tileLayer(referenceLayerUrl, {
        maxZoom: 6,
        opacity: 0.8
      }).addTo(map);

      const ice = L.tileLayer(tileUrlWithTime, {
        maxZoom: 6,
        opacity: 0.7
      }).addTo(map);

      iceLayer.current = ice;
      mapInstance.current = map;

      L.control.zoom({ position: "topleft" }).addTo(map);
    };

    void setupMap();

    return () => {
      mounted = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [tileUrlWithTime]);

  useEffect(() => {
    if (iceLayer.current) {
      iceLayer.current.setUrl(tileUrlWithTime);
    }
  }, [tileUrlWithTime]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % snapshots.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <main className="min-h-screen bg-[#1b1b1b] px-6 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-900">
              <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
                <circle cx="32" cy="32" r="20" fill="#e2e8f0" />
                <path
                  d="M22 26c4 8 10 12 20 12"
                  stroke="#1e40af"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M20 38c6-6 18-8 26-6"
                  stroke="#1e40af"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Polar View
              </p>
              <h1 className="text-2xl font-semibold text-slate-100">
                Arctic sea ice concentration browser
              </h1>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 text-xs text-slate-400">
            <span>Source: ArcGIS Living Atlas</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Projection: Arctic Polar</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily selector</CardTitle>
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
                  {"Su Mo Tu We Th Fr Sa"
                    .split(" ")
                    .map((day) => (
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
                      <button
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
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 bg-slate-900/70 text-slate-200"
                  onClick={() => setIsPlaying((value) => !value)}
                >
                  {isPlaying ? "Stop animation" : "Start animation"}
                </Button>
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                    <p className="text-slate-300">Layer style</p>
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked
                          readOnly
                          className="h-3 w-3 accent-sky-400"
                        />
                        Visual composite
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3 accent-sky-400"
                        />
                        NIC / Purple
                      </label>
                    </div>
                  </div>
                  <p>No image for 21 January 2026.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-400">
                <p>
                  Ice concentration tiles use ArcGIS Living Atlas polar services
                  updated with daily composites.
                </p>
                <p>
                  Coastal land masks are applied to reduce concentration bleed
                  along shorelines.
                </p>
                <p className="text-slate-500">
                  Data source: University of Bremen (via ArcGIS).
                </p>
              </CardContent>
            </Card>
          </aside>

          <section className="flex flex-col gap-4">
            <Card className="border-slate-700 bg-slate-900/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-6 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Selected day
                  </p>
                  <p className="text-2xl font-semibold text-slate-100">
                    {active.label}
                  </p>
                  <p className="text-xs text-slate-500">{active.date}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {snapshots.map((snapshot, index) => (
                    <Button
                      key={snapshot.date}
                      variant={index === activeIndex ? "default" : "outline"}
                      className={`h-9 rounded-full px-4 text-xs ${
                        index === activeIndex
                          ? "bg-sky-500 text-slate-900"
                          : "border-slate-600 bg-transparent text-slate-200"
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      {snapshot.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <Card className="relative min-h-[520px] overflow-hidden border-slate-700">
                <div
                  ref={mapRef}
                  className="h-full w-full bg-slate-900"
                  aria-label="Arctic sea ice map"
                />
                <div className="absolute bottom-4 right-4 rounded-md bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                  Lat: 73.72 · Lon: 69.59 · Scale 1:40M
                </div>
              </Card>

              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Extent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-100">
                      {active.extent.toFixed(2)}M km²
                    </p>
                    <p className="text-xs text-slate-400">
                      Anomaly: {active.anomaly.toFixed(2)}M km²
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Drift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-100">
                      {active.drift}
                    </p>
                    <p className="text-xs text-slate-400">
                      Wind-aligned circulation
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Concentration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Observed</span>
                      <span>{active.concentration}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-sky-400 transition-all duration-700"
                        style={{ width: `${active.concentration}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
