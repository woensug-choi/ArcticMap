"use client";

import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";

interface DataLayersPanelProps {
  dataset: DatasetResponse | null;
  iceSourceKey: string;
  setIceSourceKey: Dispatch<SetStateAction<string>>;
  baseLayerKey: string;
  setBaseLayerKey: Dispatch<SetStateAction<string>>;
  showCoastlines: boolean;
  setShowCoastlines: Dispatch<SetStateAction<boolean>>;
  showGraticule: boolean;
  setShowGraticule: Dispatch<SetStateAction<boolean>>;
  activeIceSource?: TileLayerSource;
  activeBaseLayer?: TileLayerSource;
  title?: string;
}

export default function DataLayersPanel({
  dataset,
  iceSourceKey,
  setIceSourceKey,
  baseLayerKey,
  setBaseLayerKey,
  showCoastlines,
  setShowCoastlines,
  showGraticule,
  setShowGraticule,
  activeIceSource,
  activeBaseLayer,
  title = "Data & layers"
}: DataLayersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-slate-400">
        <div className="space-y-2">
          <p className="text-slate-300">Ice Concentration</p>
          <select
            value={iceSourceKey}
            onChange={(event) => setIceSourceKey(event.target.value)}
            aria-label="Ice Concentration"
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
          >
            {Object.entries(dataset?.iceSources ?? {}).map(([key, source]) => (
              <option key={key} value={key}>
                {source.label}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500">
            <span>Info: </span>
            <a
              href={activeIceSource?.infoUrl ?? "#"}
              className="text-sky-300 underline decoration-slate-600 underline-offset-2"
            >
              {activeIceSource?.infoUrl ?? "Loading..."}
            </a>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-300">Base Map</p>
          <select
            value={baseLayerKey}
            onChange={(event) => setBaseLayerKey(event.target.value)}
            aria-label="Base Map"
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
          >
            {Object.entries(dataset?.baseLayers ?? {}).map(([key, layer]) => (
              <option key={key} value={key}>
                {layer.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Active: {activeBaseLayer?.label ?? "Loading..."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showCoastlines}
            onChange={(event) => setShowCoastlines(event.target.checked)}
            className="h-3 w-3 accent-sky-400"
          />
          Show coastlines / borders
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showGraticule}
            onChange={(event) => setShowGraticule(event.target.checked)}
            className="h-3 w-3 accent-sky-400"
          />
          Show polar graticule
        </label>
      </CardContent>
    </Card>
  );
}
