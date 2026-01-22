"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataLayersPanel from "@/components/DataLayersPanel";
import type { DatasetResponse } from "@/lib/datasets";
import { buildGeoTiffUrl, buildTileUrl } from "@/lib/datasets";

const MapViewer = dynamic(() => import("../components/MapViewer"), {
  ssr: false,
});
const CalendarSelector = dynamic(
  () => import("../components/CalendarSelector"),
  {
    ssr: false,
  },
);

export default function HomePage() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [baseLayerKey, setBaseLayerKey] = useState<string>("");
  const [iceSourceKey, setIceSourceKey] = useState<string>("");
  const [showCoastlines, setShowCoastlines] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);

  const snapshots = dataset?.snapshots ?? [];
  const active = snapshots[activeIndex] ?? null;
  const activeDay = active ? Number(active.date.split("-")[2]) : null;
  const activeIceSource = dataset?.iceSources[iceSourceKey];
  const activeBaseLayer = dataset?.baseLayers[baseLayerKey];

  const activeDate = active?.date ?? dataset?.defaults.defaultDate ?? "";

  const baseLayerUrl = useMemo(() => {
    if (!activeBaseLayer || !activeDate) return "";
    return buildTileUrl(activeBaseLayer, activeDate);
  }, [activeBaseLayer, activeDate]);

  const iceLayerUrl = useMemo(() => {
    if (!activeIceSource || !activeDate) return "";
    if (activeIceSource.kind === "geotiff") {
      return buildGeoTiffUrl(activeIceSource, activeDate);
    }
    return buildTileUrl(activeIceSource, activeDate);
  }, [activeIceSource, activeDate]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const response = await fetch("/api/datasets");
        if (!response.ok) {
          throw new Error("Failed to load dataset metadata.");
        }
        const payload: DatasetResponse = await response.json();
        if (mounted) {
          setDataset(payload);
          setBaseLayerKey(
            (current) => current || payload.defaults.baseLayerKey,
          );
          setIceSourceKey(
            (current) => current || payload.defaults.iceSourceKey,
          );
          setShowCoastlines(payload.defaults.showCoastlines);
          setShowGraticule(payload.defaults.showGraticule);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

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
            <span>Source: {activeIceSource?.label ?? "Loading..."}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>
              Projection: {dataset?.mapConfig.projection ?? "Loading..."}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <CalendarSelector
              snapshots={snapshots}
              activeDay={activeDay}
              setActiveIndex={setActiveIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
            />

            <DataLayersPanel
              dataset={dataset}
              iceSourceKey={iceSourceKey}
              setIceSourceKey={setIceSourceKey}
              baseLayerKey={baseLayerKey}
              setBaseLayerKey={setBaseLayerKey}
              showCoastlines={showCoastlines}
              setShowCoastlines={setShowCoastlines}
              showGraticule={showGraticule}
              setShowGraticule={setShowGraticule}
              activeIceSource={activeIceSource}
              activeBaseLayer={activeBaseLayer}
            />
          </aside>

          <section className="flex flex-col gap-4">
            <Card className="border-slate-700 bg-slate-900/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-6 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Selected day
                  </p>
                  <p className="text-2xl font-semibold text-slate-100">
                    {active?.label ?? "Loading..."}
                  </p>
                  <p className="text-xs text-slate-500">
                    {active?.date ?? "Loading..."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <MapViewer
              dataset={dataset}
              activeDate={activeDate}
              activeBaseLayer={activeBaseLayer}
              activeIceSource={activeIceSource}
              baseLayerUrl={baseLayerUrl}
              iceLayerUrl={iceLayerUrl}
              showCoastlines={showCoastlines}
              showGraticule={showGraticule}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
