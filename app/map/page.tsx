"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { DatasetResponse } from "@/lib/datasets";
import { buildGeoTiffUrl, buildTileUrl } from "@/lib/datasets";

const MapViewer = dynamic(() => import("@/components/MapViewer"), { ssr: false });

export default function MapTestPage() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [baseLayerKey, setBaseLayerKey] = useState<string>("");
  const [iceSourceKey, setIceSourceKey] = useState<string>("");
  const [showCoastlines, setShowCoastlines] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);

  const activeDate = dataset?.defaults.defaultDate ?? "";
  const activeIceSource = dataset?.iceSources[iceSourceKey];
  const activeBaseLayer = dataset?.baseLayers[baseLayerKey];

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
          setBaseLayerKey((current) => current || payload.defaults.baseLayerKey);
          setIceSourceKey((current) => current || payload.defaults.iceSourceKey);
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

  return (
    <main className="min-h-screen bg-[#0b1220] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Component test
          </p>
          <h1 className="text-2xl font-semibold">Map viewer</h1>
        </header>

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
      </div>
    </main>
  );
}
