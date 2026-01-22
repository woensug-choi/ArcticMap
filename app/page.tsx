"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";
import { buildTileUrl } from "@/lib/datasets";

export default function HomePage() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1800);
  const [baseLayerKey, setBaseLayerKey] = useState<string>("");
  const [iceSourceKey, setIceSourceKey] = useState<string>("");
  const [showCoastlines, setShowCoastlines] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const iceLayer = useRef<import("leaflet").TileLayer | null>(null);
  const baseLayer = useRef<import("leaflet").TileLayer | null>(null);
  const coastLayer = useRef<import("leaflet").TileLayer | null>(null);
  const graticuleLayer = useRef<import("leaflet").TileLayer | null>(null);

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
    return buildTileUrl(activeIceSource, activeDate);
  }, [activeIceSource, activeDate]);

  const overlayTileUrl = (
    overlay?: TileLayerSource,
    date: string | undefined = activeDate
  ) => {
    if (!overlay || !date) return "";
    return buildTileUrl(overlay, date);
  };

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
          setBaseLayerKey((current) =>
            current || payload.defaults.baseLayerKey
          );
          setIceSourceKey((current) =>
            current || payload.defaults.iceSourceKey
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
    let mounted = true;

    const setupMap = async () => {
      if (
        !mounted ||
        !mapRef.current ||
        mapInstance.current ||
        !dataset ||
        !baseLayerKey ||
        !iceSourceKey ||
        !baseLayerUrl ||
        !iceLayerUrl
      ) {
        return;
      }

      const [{ default: proj4 }, L] = await Promise.all([
        import("proj4"),
        import("leaflet")
      ]);

      (window as unknown as { proj4: typeof proj4 }).proj4 = proj4;
      await import("proj4leaflet");

      const crs = new L.Proj.CRS(
        dataset.mapConfig.projection,
        dataset.mapConfig.proj4,
        {
          resolutions: dataset.mapConfig.resolutions,
          origin: dataset.mapConfig.origin,
          bounds: L.bounds(
            dataset.mapConfig.bounds[0],
            dataset.mapConfig.bounds[1]
          )
        }
      );

      const map = L.map(mapRef.current, {
        crs,
        zoomControl: false,
        attributionControl: true,
        minZoom: dataset.mapConfig.minZoom,
        maxZoom: dataset.mapConfig.maxZoom,
        preferCanvas: true
      })
        .setView(
          dataset.mapConfig.center,
          dataset.mapConfig.initialZoom
        )
        .setMaxBounds(dataset.mapConfig.maxBounds);

      baseLayer.current = L.tileLayer(baseLayerUrl, {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: activeBaseLayer?.opacity ?? 0.9,
        tileSize: 512,
        attribution: activeBaseLayer?.attribution
      }).addTo(map);

      const coastSource = dataset.overlays.coastlines;
      coastLayer.current = L.tileLayer(
        overlayTileUrl(coastSource),
        {
          maxZoom: dataset.mapConfig.maxZoom,
          opacity: coastSource.opacity,
          tileSize: 512,
          attribution: coastSource.attribution
        }
      );
      if (showCoastlines) {
        coastLayer.current.addTo(map);
      }

      const graticuleSource = dataset.overlays.graticule;
      graticuleLayer.current = L.tileLayer(
        overlayTileUrl(graticuleSource),
        {
          maxZoom: dataset.mapConfig.maxZoom,
          opacity: graticuleSource.opacity,
          tileSize: 512,
          attribution: graticuleSource.attribution
        }
      );
      if (showGraticule) {
        graticuleLayer.current.addTo(map);
      }

      const ice = L.tileLayer(iceLayerUrl, {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: activeIceSource?.opacity ?? 0.7,
        tileSize: 512,
        attribution: activeIceSource?.attribution
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
  }, []);

  useEffect(() => {
    if (iceLayer.current && iceLayerUrl) {
      iceLayer.current.setUrl(iceLayerUrl);
    }
  }, [iceLayerUrl]);

  useEffect(() => {
    if (baseLayer.current && baseLayerUrl) {
      baseLayer.current.setUrl(baseLayerUrl);
      if (activeBaseLayer) {
        baseLayer.current.setOpacity(activeBaseLayer.opacity);
      }
    }
  }, [baseLayerUrl, activeBaseLayer]);

  useEffect(() => {
    if (iceLayer.current && activeIceSource) {
      iceLayer.current.setOpacity(activeIceSource.opacity);
    }
  }, [activeIceSource]);

  useEffect(() => {
    if (!mapInstance.current || !coastLayer.current) {
      return;
    }

    if (showCoastlines) {
      coastLayer.current.addTo(mapInstance.current);
    } else {
      coastLayer.current.removeFrom(mapInstance.current);
    }
  }, [showCoastlines]);

  useEffect(() => {
    if (!dataset || !activeDate) {
      return;
    }
    if (coastLayer.current) {
      coastLayer.current.setUrl(
        overlayTileUrl(dataset.overlays.coastlines, activeDate)
      );
    }
    if (graticuleLayer.current) {
      graticuleLayer.current.setUrl(
        overlayTileUrl(dataset.overlays.graticule, activeDate)
      );
    }
  }, [dataset, activeDate]);

  useEffect(() => {
    if (!isPlaying || snapshots.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % snapshots.length);
    }, playbackSpeed);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, snapshots.length]);

  useEffect(() => {
    if (!mapInstance.current || !graticuleLayer.current) {
      return;
    }

    if (showGraticule) {
      graticuleLayer.current.addTo(mapInstance.current);
    } else {
      graticuleLayer.current.removeFrom(mapInstance.current);
    }
  }, [showGraticule]);

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
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 bg-slate-900/70 text-slate-200"
                    onClick={() => setIsPlaying((value) => !value)}
                  >
                    {isPlaying ? "Stop animation" : "Start animation"}
                  </Button>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Animation speed</span>
                      <span>{(playbackSpeed / 1000).toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={800}
                      max={3200}
                      step={200}
                      value={playbackSpeed}
                      onChange={(event) =>
                        setPlaybackSpeed(Number(event.target.value))
                      }
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>
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
                  <p>Aligned with EPSG:3413 polar stereographic tiles.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-400">
                <div className="space-y-2">
                  <p className="text-slate-300">Ice data source</p>
                  <select
                    value={iceSourceKey}
                    onChange={(event) =>
                      setIceSourceKey(event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
                  >
                    {Object.entries(dataset?.iceSources ?? {}).map(
                      ([key, source]) => (
                      <option key={key} value={key}>
                        {source.label}
                      </option>
                      )
                    )}
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
                  <p className="text-slate-300">Base map</p>
                  <select
                    value={baseLayerKey}
                    onChange={(event) =>
                      setBaseLayerKey(event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
                  >
                    {Object.entries(dataset?.baseLayers ?? {}).map(
                      ([key, layer]) => (
                      <option key={key} value={key}>
                        {layer.label}
                      </option>
                      )
                    )}
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
                <p className="text-slate-500">
                  External tiles may require CORS access for local development.
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
                    {active?.label ?? "Loading..."}
                  </p>
                  <p className="text-xs text-slate-500">
                    {active?.date ?? "Loading..."}
                  </p>
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
                  Lat: 90.00 · Lon: 0.00 · EPSG:3413
                </div>
                <div className="absolute left-4 top-4 rounded-md bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
                  <div>Base map: {activeBaseLayer?.label ?? "Loading..."}</div>
                  <div>Ice layer: {activeIceSource?.label ?? "Loading..."}</div>
                </div>
              </Card>

              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Extent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-100">
                      {active ? active.extent.toFixed(2) : "--"}M km²
                    </p>
                    <p className="text-xs text-slate-400">
                      Anomaly: {active ? active.anomaly.toFixed(2) : "--"}M km²
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Drift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-100">
                      {active?.drift ?? "--"}
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
                      <span>{active?.concentration ?? "--"}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-sky-400 transition-all duration-700"
                        style={{
                          width: `${active?.concentration ?? 0}%`
                        }}
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
