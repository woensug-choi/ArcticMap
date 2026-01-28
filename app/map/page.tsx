"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { buildGeoTiffUrl, buildTileUrl, dataset as datasetData } from "@/lib/datasets";

const MapViewer = dynamic(() => import("@/components/MapViewer"), { ssr: false });

export default function MapTestPage() {
  const dataset = datasetData;
  const [baseLayerKey, setBaseLayerKey] = useState<string>(dataset.defaults.baseLayerKey);
  const [iceSourceKey, setIceSourceKey] = useState<string>(dataset.defaults.iceSourceKey);
  const [showCoastlines, setShowCoastlines] = useState(dataset.defaults.showCoastlines);
  const [showGraticule, setShowGraticule] = useState(dataset.defaults.showGraticule);

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
    if (!baseLayerKey) setBaseLayerKey(dataset.defaults.baseLayerKey);
    if (!iceSourceKey) setIceSourceKey(dataset.defaults.iceSourceKey);
  }, [dataset.defaults.baseLayerKey, dataset.defaults.iceSourceKey, baseLayerKey, iceSourceKey]);

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
