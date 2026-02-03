"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OverlaySource, TileLayerSource } from "@/lib/datasets";
import { buildGeoTiffUrl, buildTileUrl, dataset as datasetData, isGraticuleSource, isTileLayerSource } from "@/lib/datasets";

const getDateRange = (dates: string[]) => {
  if (dates.length === 0) {
    return { start: "N/A", end: "N/A" };
  }
  const sorted = [...dates].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
};

export default function DataDebugPage() {
  const dataset = datasetData;
  const [baseLayerKey, setBaseLayerKey] = useState<string>(dataset.defaults.baseLayerKey);
  const [iceSourceKey, setIceSourceKey] = useState<string>(dataset.defaults.iceSourceKey);
  const [showCoastlines, setShowCoastlines] = useState(dataset.defaults.showCoastlines);
  const [showGraticule, setShowGraticule] = useState(dataset.defaults.showGraticule);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [previewType, setPreviewType] = useState<"base" | "ice" | "overlay">(
    "ice",
  );
  const [overlayKey, setOverlayKey] = useState<string>("coastlines");
  const [previewStatus, setPreviewStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | {
        state: "success";
        status: number;
        contentType: string | null;
        bodyPreview: string;
      }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [tileSamples, setTileSamples] = useState<
    Array<{ z: number; y: number; x: number }>
  >([]);

  const dateOptions = useMemo(() => {
    const today = new Date();
    const make = (offset: number) => {
      const value = new Date(today);
      value.setDate(value.getDate() + offset);
      return value.toISOString().slice(0, 10);
    };

    return {
      today: make(0),
      yesterday: make(-1),
      weekAgo: make(-7)
    };
  }, []);

  useEffect(() => {
    setSelectedDate((current) => current || dateOptions.yesterday);
  }, [dateOptions.yesterday]);

  const snapshotRange = useMemo(() => {
    const dates = dataset?.snapshots.map((snapshot) => snapshot.date) ?? [];
    return getDateRange(dates);
  }, [dataset]);

  const activeIceSource = dataset?.iceSources[iceSourceKey];
  const activeBaseLayer = dataset?.baseLayers[baseLayerKey];
  const sampleDate = selectedDate || dateOptions.yesterday;

  const previewSource = useMemo(() => {
    if (!dataset) return undefined;
    if (previewType === "base") return dataset.baseLayers[baseLayerKey];
    if (previewType === "overlay") return dataset.overlays[overlayKey];
    return dataset.iceSources[iceSourceKey];
  }, [dataset, previewType, baseLayerKey, iceSourceKey, overlayKey]);

  const replaceCoords = (url: string, z: number, y: number, x: number) =>
    url
      .replace("{z}", String(z))
      .replace("{y}", String(y))
      .replace("{x}", String(x))
      .replace("{TileMatrix}", String(z))
      .replace("{TileRow}", String(y))
      .replace("{TileCol}", String(x));

  const tileUrls = useMemo(() => {
    if (!previewSource || !sampleDate || tileSamples.length === 0) return [];
    if (!isTileLayerSource(previewSource)) return [];
    const baseUrl =
      previewSource.kind === "geotiff"
        ? buildGeoTiffUrl(previewSource, sampleDate)
        : buildTileUrl(previewSource, sampleDate);
    return tileSamples.map(({ z, y, x }) => replaceCoords(baseUrl, z, y, x));
  }, [previewSource, sampleDate, tileSamples]);

  const previewUrl = tileUrls[0] ?? "";

  useEffect(() => {
    if (!previewSource) {
      setTileSamples([]);
      return;
    }

    const maxZoom = dataset?.mapConfig.maxZoom ?? 5;
    const makeRandom = () => {
      const z = Math.floor(Math.random() * (maxZoom + 1));
      const size = Math.max(1, 2 ** z);
      return {
        z,
        y: Math.floor(Math.random() * size),
        x: Math.floor(Math.random() * size)
      };
    };

    setTileSamples([makeRandom(), makeRandom(), makeRandom()]);
  }, [previewSource, sampleDate, dataset?.mapConfig.maxZoom]);

  useEffect(() => {
    if (!previewUrl) {
      setPreviewStatus({ state: "idle" });
      return;
    }

    const controller = new AbortController();
    const loadPreview = async () => {
      try {
        setPreviewStatus({ state: "loading" });
        const response = await fetch(previewUrl, {
          mode: "cors",
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type");
        let bodyPreview = "";

        if (contentType?.includes("application/json") || contentType?.includes("text/")) {
          bodyPreview = await response.text();
        } else {
          const buffer = await response.arrayBuffer();
          bodyPreview = `Binary response (${buffer.byteLength} bytes)`;
        }

        setPreviewStatus({
          state: "success",
          status: response.status,
          contentType,
          bodyPreview,
        });
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setPreviewStatus({
          state: "error",
          message:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
        });
      }
    };

    void loadPreview();

    return () => {
      controller.abort();
    };
  }, [previewUrl]);

  const renderTileLayer = (source: TileLayerSource) => (
    <li
      key={source.id}
      className="rounded-md border border-slate-800 bg-slate-900/60 p-3"
    >
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
            {source.kind === "geotiff"
              ? buildGeoTiffUrl(source, sampleDate)
              : buildTileUrl(source, sampleDate)}
          </span>
        </p>
        <p className="mt-1">Attribution: {source.attribution}</p>
      </div>
    </li>
  );

  const renderGraticuleLayer = (source: OverlaySource) => {
    if (!isGraticuleSource(source)) return null;
    return (
      <li
        key={source.id}
        className="rounded-md border border-slate-800 bg-slate-900/60 p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-200">{source.label}</p>
            <p className="text-xs text-slate-500">Local graticule</p>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-slate-300">
            {source.latStep}° / {source.lonStep}°
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          <p>
            Extent: {source.minLat}° to {source.maxLat}°
          </p>
          <p className="mt-1">Attribution: {source.attribution}</p>
        </div>
      </li>
    );
  };

  const renderOverlay = (source: OverlaySource) =>
    isGraticuleSource(source) ? renderGraticuleLayer(source) : renderTileLayer(source);

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Dataset Debug Console</h1>
          <p className="text-sm text-slate-400">
            Verifies API payloads, layer paths, and available date ranges.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview fetch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-300">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">Layer type</span>
                  <select
                    value={previewType}
                    onChange={(event) =>
                      setPreviewType(
                        event.target.value as "base" | "ice" | "overlay",
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
                    aria-label="Preview layer type"
                  >
                    <option value="ice">Ice source</option>
                    <option value="base">Base layer</option>
                    <option value="overlay">Overlay</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">Select layer</span>
                  <select
                    value={
                      previewType === "base"
                        ? baseLayerKey
                        : previewType === "overlay"
                          ? overlayKey
                          : iceSourceKey
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      if (previewType === "base") {
                        setBaseLayerKey(value);
                      } else if (previewType === "overlay") {
                        setOverlayKey(value);
                      } else {
                        setIceSourceKey(value);
                      }
                    }}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
                    aria-label="Selected layer"
                  >
                    {previewType === "base"
                      ? Object.entries(dataset?.baseLayers ?? {}).map(
                          ([key, layer]) => (
                            <option key={key} value={key}>
                              {layer.label}
                            </option>
                          ),
                        )
                      : previewType === "overlay"
                        ? Object.entries(dataset?.overlays ?? {}).map(
                            ([key, layer]) => (
                              <option key={key} value={key}>
                                {layer.label}
                              </option>
                            ),
                          )
                        : Object.entries(dataset?.iceSources ?? {}).map(
                            ([key, layer]) => (
                              <option key={key} value={key}>
                                {layer.label}
                              </option>
                            ),
                          )}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">Date</span>
                  <select
                    value={sampleDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
                    aria-label="Preview date"
                  >
                    <option value={dateOptions.yesterday}>
                      Yesterday · {dateOptions.yesterday}
                    </option>
                    <option value={dateOptions.today}>
                      Today · {dateOptions.today}
                    </option>
                    <option value={dateOptions.weekAgo}>
                      A week ago · {dateOptions.weekAgo}
                    </option>
                  </select>
                </label>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-500">Preview URLs</p>
                <div className="mt-1 space-y-2 text-[12px] text-slate-200">
                  {tileUrls.length > 0 ? (
                    tileUrls.map((url, index) => (
                      <p key={`${url}-${index}`} className="break-all">
                        {url}
                      </p>
                    ))
                  ) : (
                    <p>Select a layer and date.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span>
                  Status:{" "}
                  {previewStatus.state === "loading"
                    ? "Loading..."
                    : previewStatus.state === "success"
                      ? `OK (${previewStatus.status})`
                      : previewStatus.state === "error"
                        ? "Error"
                        : "Idle"}
                </span>
                {previewStatus.state === "success" ? (
                  <span>
                    Content-Type: {previewStatus.contentType ?? "n/a"}
                  </span>
                ) : null}
                {previewStatus.state === "error" ? (
                  <span className="text-red-300">{previewStatus.message}</span>
                ) : null}
              </div>

              {previewStatus.state === "success" ? (
                <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-[11px] text-slate-500">Response</p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-200">
                    {previewStatus.bodyPreview || "(empty)"}
                  </pre>
                </div>
              ) : null}

              {tileUrls.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {tileUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-md border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={url}
                        alt={`Tile preview ${index + 1}`}
                        className="h-48 w-full object-contain"
                        loading="lazy"
                      />
                      <div className="border-t border-slate-800 px-3 py-2 text-[11px] text-slate-400">
                        z={tileSamples[index]?.z} · y={tileSamples[index]?.y} · x={tileSamples[index]?.x}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layer catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Base layers
                </p>
                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.baseLayers).map(renderTileLayer)
                    : "Loading..."}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Ice sources
                </p>
                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.iceSources).map(renderTileLayer)
                    : "Loading..."}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Overlays
                </p>
                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.overlays).map(renderOverlay)
                    : "Loading..."}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
