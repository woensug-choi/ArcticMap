"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";
import { buildTileUrl } from "@/lib/datasets";

const getDateRange = (dates: string[]) => {
  if (dates.length === 0) {
    return { start: "N/A", end: "N/A" };
  }
  const sorted = [...dates].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
};

export default function DataDebugPage() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const snapshotRange = useMemo(() => {
    const dates = dataset?.snapshots.map((snapshot) => snapshot.date) ?? [];
    return getDateRange(dates);
  }, [dataset]);

  const sampleDate = dataset?.defaults.defaultDate ?? snapshotRange.start;

  const renderLayer = (source: TileLayerSource) => (
    <li key={source.id} className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{source.label}</p>
          <p className="text-xs text-slate-500">Layer ID: {source.layer}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-slate-300">
          {source.tileMatrixSet}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        <p>
          Sample URL:{" "}
          <span className="break-all text-slate-300">
            {buildTileUrl(source, sampleDate)}
          </span>
        </p>
        <p className="mt-1">Attribution: {source.attribution}</p>
      </div>
    </li>
  );

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Dataset Debug Console</h1>
          <p className="text-sm text-slate-400">
            Verifies API payloads, layer paths, and available date ranges.
          </p>
        </header>

        {error ? (
          <Card className="border-red-500/40 bg-red-500/10">
            <CardHeader>
              <CardTitle>Failed to load API</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-200">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Snapshot Coverage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            <p>
              Range:{" "}
              <span className="font-semibold">{snapshotRange.start}</span> →
              <span className="font-semibold"> {snapshotRange.end}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Default date: {dataset?.defaults.defaultDate ?? "Loading..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dataset
                ? Object.values(dataset.baseLayers).map(renderLayer)
                : "Loading..."}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ice Data Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dataset
                ? Object.values(dataset.iceSources).map(renderLayer)
                : "Loading..."}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overlays</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dataset
                ? Object.values(dataset.overlays).map(renderLayer)
                : "Loading..."}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
