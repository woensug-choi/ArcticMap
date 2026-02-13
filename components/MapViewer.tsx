"use client";

import { useEffect, useRef, useState } from "react";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { get as getProjection } from "ol/proj";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import TileGrid from "ol/tilegrid/TileGrid";
import { createXYZ } from "ol/tilegrid";
import { defaults as defaultControls } from "ol/control";
import { Card } from "@/components/ui/card";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";
import { buildTileUrl } from "@/lib/datasets";
import { useLanguage } from "@/components/LanguageProvider";

interface MapViewerProps {
  dataset: DatasetResponse | null;
  activeDate: string;
  activeBaseLayer?: TileLayerSource;
  activeIceSource?: TileLayerSource;
  baseLayerUrl: string;
  iceLayerUrl: string;
  showCoastlines: boolean;
  showGraticule: boolean;
}

const toExtent = (bounds: [[number, number], [number, number]]) =>
  [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]] as [
    number,
    number,
    number,
    number
  ];

const createXyzSource = (
  url: string,
  attribution: string | undefined,
  tileGrid: TileGrid,
  projection: string,
) =>
  new XYZ({
    url,
    tileGrid,
    projection,
    attributions: attribution ? [attribution] : undefined,
    wrapX: false,
    crossOrigin: "anonymous",
  });

export default function MapViewer({
  dataset,
  activeDate,
  activeBaseLayer,
  activeIceSource,
  baseLayerUrl,
  iceLayerUrl,
  showCoastlines,
  showGraticule,
}: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const tileGridRef = useRef<TileGrid | null>(null);
  const baseLayer = useRef<TileLayer<XYZ> | null>(null);
  const coastLayer = useRef<TileLayer<XYZ> | null>(null);
  const graticuleLayer = useRef<TileLayer<XYZ> | null>(null);
  const iceLayer = useRef<TileLayer | null>(null);
  const [iceStatus, setIceStatus] = useState<{
    state: "idle" | "loading" | "ready" | "error";
    message?: string;
  }>({ state: "idle" });
  const [iceReloadToken, setIceReloadToken] = useState(0);

  const { t } = useLanguage();
  const handleRetry = () => setIceReloadToken((value) => value + 1);
  const setLoadingStatus = () =>
    setIceStatus((prev) => (prev.state === "error" ? prev : { state: "loading" }));

  const overlayTileUrl = (
    overlay?: TileLayerSource,
    date: string | undefined = activeDate,
  ) => {
    if (!overlay || !date) return "";
    return buildTileUrl(overlay, date);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !dataset) return;

    const projectionCode = dataset.mapConfig.projection;
    if (projectionCode !== "EPSG:4326") {
      proj4.defs(projectionCode, dataset.mapConfig.proj4);
      register(proj4);
    }

    const extent = toExtent(dataset.mapConfig.bounds);
    const projection = getProjection(projectionCode);
    if (projection) projection.setExtent(extent);

    const tileSize = projectionCode === "EPSG:4326" ? 256 : 512;
    const tileGrid = new TileGrid({
      origin: dataset.mapConfig.origin,
      resolutions: dataset.mapConfig.resolutions,
      extent,
      tileSize,
    });
    tileGridRef.current = tileGrid;

    const view = new View({
      projection: projectionCode,
      resolutions: dataset.mapConfig.resolutions,
      extent,
      minZoom: dataset.mapConfig.minZoom,
      maxZoom: dataset.mapConfig.maxZoom,
      center: [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2],
      zoom: dataset.mapConfig.initialZoom,
    });

    const map = new Map({
      target: mapRef.current,
      view,
      controls: defaultControls({ zoom: true, attribution: true }),
    });

    baseLayer.current = new TileLayer({
      source: createXyzSource("", undefined, tileGrid, projectionCode),
      opacity: 0.9,
      className: "basemap-layer",
    });
    baseLayer.current.setZIndex(10);
    map.addLayer(baseLayer.current);

    const coastSource = dataset.overlays.coastlines;
    coastLayer.current = new TileLayer({
      source: createXyzSource("", coastSource.attribution, tileGrid, projectionCode),
      opacity: coastSource.opacity,
      className: "coastline-layer",
      visible: false,
    });
    coastLayer.current.setZIndex(30);
    map.addLayer(coastLayer.current);

    const graticuleSource = dataset.overlays.graticule;
    graticuleLayer.current = new TileLayer({
      source: createXyzSource("", graticuleSource.attribution, tileGrid, projectionCode),
      opacity: graticuleSource.opacity,
      className: "graticule-layer",
      visible: false,
    });
    graticuleLayer.current.setZIndex(30);
    map.addLayer(graticuleLayer.current);

    mapInstance.current = map;

    map.once("postrender", () => {
      map.getView().fit(extent, { size: map.getSize(), duration: 0 });
    });

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
      tileGridRef.current = null;
      baseLayer.current = null;
      coastLayer.current = null;
      graticuleLayer.current = null;
      iceLayer.current = null;
    };
  }, [dataset]);

  useEffect(() => {
    if (!dataset || !tileGridRef.current || !baseLayer.current) return;

    if (!baseLayerUrl) {
      baseLayer.current.setVisible(false);
      return;
    }

    baseLayer.current.setSource(
      createXyzSource(
        baseLayerUrl,
        activeBaseLayer?.attribution,
        tileGridRef.current,
        dataset.mapConfig.projection,
      ),
    );
    baseLayer.current.setOpacity(activeBaseLayer?.opacity ?? 0.9);
    baseLayer.current.setVisible(true);
  }, [dataset, baseLayerUrl, activeBaseLayer?.opacity, activeBaseLayer?.attribution]);

  useEffect(() => {
    if (!dataset || !tileGridRef.current || !coastLayer.current) return;

    const url = overlayTileUrl(dataset.overlays.coastlines, activeDate);
    if (!url) return;

    coastLayer.current.setSource(
      createXyzSource(
        url,
        dataset.overlays.coastlines.attribution,
        tileGridRef.current,
        dataset.mapConfig.projection,
      ),
    );
    coastLayer.current.setOpacity(dataset.overlays.coastlines.opacity);
  }, [dataset, activeDate]);

  useEffect(() => {
    if (!dataset || !tileGridRef.current || !graticuleLayer.current) return;

    const url = overlayTileUrl(dataset.overlays.graticule, activeDate);
    if (!url) return;

    graticuleLayer.current.setSource(
      createXyzSource(
        url,
        dataset.overlays.graticule.attribution,
        tileGridRef.current,
        dataset.mapConfig.projection,
      ),
    );
    graticuleLayer.current.setOpacity(dataset.overlays.graticule.opacity);
  }, [dataset, activeDate]);

  useEffect(() => {
    if (coastLayer.current) {
      coastLayer.current.setVisible(showCoastlines);
    }
  }, [showCoastlines]);

  useEffect(() => {
    if (graticuleLayer.current) {
      graticuleLayer.current.setVisible(showGraticule);
    }
  }, [showGraticule]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !dataset) return;

    if (iceLayer.current) {
      map.removeLayer(iceLayer.current);
      iceLayer.current = null;
    }

    if (!iceLayerUrl || !activeIceSource) {
      setIceStatus({ state: "idle" });
      return;
    }

    setIceStatus({ state: "loading" });

    const detachEvents = (source: TileWMS | XYZ) => {
      source.un("tileloadstart", setLoadingStatus);
      source.un("tileloadend", onTileLoadEnd);
      source.un("tileloaderror", onTileLoadError);
    };

    const onTileLoadEnd = () => setIceStatus({ state: "ready" });
    const onTileLoadError = () =>
      setIceStatus({ state: "error", message: "tile load failed" });

    let layer: TileLayer | null = null;
    let source: TileWMS | XYZ | null = null;

    if (activeIceSource.kind === "wms") {
      const mapProjection = dataset.mapConfig.projection;
      const supported = (activeIceSource.wmsCrs ?? []).map((value) => value.toUpperCase());
      let wmsProjection = mapProjection;

      if (!supported.includes(mapProjection.toUpperCase())) {
        // When the map projection is unsupported, request WMS in a known CRS and let OL reproject.
        if (supported.includes("EPSG:3857")) {
          wmsProjection = "EPSG:3857";
        } else if (supported.includes("EPSG:4326") || supported.includes("CRS:84")) {
          wmsProjection = "EPSG:4326";
        }
      }

      const params: Record<string, string> = {
        LAYERS: activeIceSource.layer,
        FORMAT: "image/png",
        TRANSPARENT: "true",
        VERSION: "1.3.0",
        STYLES: activeIceSource.wmsDefaultStyle ?? "",
      };

      if (activeDate && activeIceSource.wmsTime !== false) {
        const today = new Date().toISOString().slice(0, 10);
        if (activeDate <= today) {
          params.TIME = `${activeDate}T12:00:00.000Z`;
        }
      }

      const tileGrid =
        wmsProjection === dataset.mapConfig.projection && tileGridRef.current
          ? tileGridRef.current
          : createXYZ({
              tileSize: 256,
              extent: getProjection(wmsProjection)?.getExtent(),
            });

      source = new TileWMS({
        url: iceLayerUrl,
        params,
        projection: wmsProjection,
        tileGrid,
        crossOrigin: "anonymous",
        attributions: activeIceSource.attribution,
      });

      layer = new TileLayer({
        source,
        opacity: activeIceSource.opacity ?? 0.75,
        className: "ice-layer",
      });
    } else if (activeIceSource.kind === "geotiff") {
      setIceStatus({ state: "error", message: "geotiff not supported in OpenLayers" });
      return;
    } else {
      if (!tileGridRef.current) return;

      source = createXyzSource(
        iceLayerUrl,
        activeIceSource.attribution,
        tileGridRef.current,
        dataset.mapConfig.projection,
      );

      layer = new TileLayer({
        source,
        opacity: activeIceSource.opacity ?? 0.75,
        className: "ice-layer",
      });
    }

    if (layer && source) {
      source.on("tileloadstart", setLoadingStatus);
      source.on("tileloadend", onTileLoadEnd);
      source.on("tileloaderror", onTileLoadError);

      layer.setZIndex(20);
      map.addLayer(layer);
      iceLayer.current = layer;

      return () => detachEvents(source!);
    }
  }, [dataset, iceLayerUrl, activeIceSource, activeDate, iceReloadToken]);

  useEffect(() => {
    if (iceLayer.current && activeIceSource?.opacity !== undefined) {
      iceLayer.current.setOpacity(activeIceSource.opacity);
    }
  }, [activeIceSource?.opacity]);

  return (
    <Card className="relative min-h-[655px] overflow-hidden border-slate-700">
      <div ref={mapRef} className="h-[655px] w-full bg-slate-900" aria-label="Arctic sea ice map" />

      <div className="absolute left-4 top-4 z-[1000] rounded-md bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
        <div>
          {t("baseMap")}: {activeBaseLayer ? activeBaseLayer.label : <span>{t("notSelected")}</span>}
        </div>
        <div>
          {t("iceConcentration")}: {activeIceSource ? activeIceSource.label : <span>{t("notSelected")}</span>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span>
            {t("iceStatus")}:{" "}
            <span
              className={
                iceStatus.state === "error"
                  ? "text-rose-300"
                  : iceStatus.state === "ready"
                    ? "text-emerald-300"
                    : iceStatus.state === "loading"
                      ? "text-amber-300"
                      : "text-slate-400"
              }
            >
              {iceStatus.state === "loading"
                ? t("loading")
                : iceStatus.state === "ready"
                  ? t("ready")
                  : iceStatus.state === "error"
                    ? t("error")
                    : t("notSelected")}
            </span>
          </span>
          {iceStatus.state === "error" ? (
            <button
              type="button"
              onClick={handleRetry}
              className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
