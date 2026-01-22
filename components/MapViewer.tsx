"use client";

import { useEffect, useRef } from "react";
import proj4 from "proj4";
import leaflet from "leaflet";
import proj4leaflet from "proj4leaflet";
import { Card } from "@/components/ui/card";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";
import { buildTileUrl } from "@/lib/datasets";

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

export default function MapViewer({
  dataset,
  activeDate,
  activeBaseLayer,
  activeIceSource,
  baseLayerUrl,
  iceLayerUrl,
  showCoastlines,
  showGraticule
}: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const iceLayer = useRef<import("leaflet").TileLayer | null>(null);
  const geoTiffLayer = useRef<import("leaflet").Layer | null>(null);
  const baseLayer = useRef<import("leaflet").TileLayer | null>(null);
  const coastLayer = useRef<import("leaflet").TileLayer | null>(null);
  const graticuleLayer = useRef<import("leaflet").TileLayer | null>(null);

  const overlayTileUrl = (
    overlay?: TileLayerSource,
    date: string | undefined = activeDate
  ) => {
    if (!overlay || !date) return "";
    return buildTileUrl(overlay, date);
  };

  useEffect(() => {
    let mounted = true;

    const setupMap = async () => {
      if (
        !mounted ||
        !mapRef.current ||
        mapInstance.current ||
        !dataset ||
        !baseLayerUrl ||
        !iceLayerUrl
      ) {
        return;
      }

      const L = leaflet as unknown as typeof import("leaflet") & {
        Proj: { CRS: new (...args: any[]) => any };
      };

      (window as unknown as { proj4: typeof proj4; L: typeof L }).proj4 = proj4;
      (window as unknown as { proj4: typeof proj4; L: typeof L }).L = L;

      if (typeof proj4leaflet === "function") {
        (proj4leaflet as unknown as (leaflet: typeof L) => void)(L);
      } else if (typeof (proj4leaflet as { default?: unknown }).default === "function") {
        (proj4leaflet as { default: (leaflet: typeof L) => void }).default(L);
      }

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
        .setView(dataset.mapConfig.center, dataset.mapConfig.initialZoom)
        .setMaxBounds(dataset.mapConfig.maxBounds);

      baseLayer.current = L.tileLayer(baseLayerUrl, {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: activeBaseLayer?.opacity ?? 0.9,
        tileSize: 512,
        attribution: activeBaseLayer?.attribution
      }).addTo(map);

      const coastSource = dataset.overlays.coastlines;
      coastLayer.current = L.tileLayer(overlayTileUrl(coastSource), {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: coastSource.opacity,
        tileSize: 512,
        attribution: coastSource.attribution
      });
      if (showCoastlines) {
        coastLayer.current.addTo(map);
      }

      const graticuleSource = dataset.overlays.graticule;
      graticuleLayer.current = L.tileLayer(overlayTileUrl(graticuleSource), {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: graticuleSource.opacity,
        tileSize: 512,
        attribution: graticuleSource.attribution,
        className: "graticule-layer"
      });
      if (showGraticule) {
        graticuleLayer.current.addTo(map);
      }

      const addGeoTiffLayer = async () => {
        if (!iceLayerUrl) return;
        const response = await fetch(iceLayerUrl);
        const buffer = await response.arrayBuffer();
        const { default: parseGeoraster } = await import("georaster");
        const { default: GeoRasterLayer } = await import(
          "georaster-layer-for-leaflet"
        );
        const georaster = await parseGeoraster(buffer);
        const layer = new GeoRasterLayer({
          georaster,
          opacity: activeIceSource?.opacity ?? 0.7
        });
        geoTiffLayer.current = layer;
        layer.addTo(map);
      };

      if (activeIceSource?.kind === "geotiff") {
        void addGeoTiffLayer();
      } else {
        const ice = L.tileLayer(iceLayerUrl, {
          maxZoom: dataset.mapConfig.maxZoom,
          opacity: activeIceSource?.opacity ?? 0.7,
          tileSize: 512,
          attribution: activeIceSource?.attribution
        }).addTo(map);

        iceLayer.current = ice;
      }
      mapInstance.current = map;

      L.control.zoom({ position: "topleft" }).addTo(map);
    };

    void setupMap();

    return () => {
      mounted = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [
    dataset,
    baseLayerUrl,
    iceLayerUrl,
    activeBaseLayer,
    activeIceSource,
    showCoastlines,
    showGraticule
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !iceLayerUrl) return;

    if (activeIceSource?.kind === "geotiff") {
      if (iceLayer.current) {
        iceLayer.current.removeFrom(map);
        iceLayer.current = null;
      }
      if (geoTiffLayer.current) {
        geoTiffLayer.current.removeFrom(map);
        geoTiffLayer.current = null;
      }

      const loadGeoTiff = async () => {
        const response = await fetch(iceLayerUrl);
        const buffer = await response.arrayBuffer();
        const { default: parseGeoraster } = await import("georaster");
        const { default: GeoRasterLayer } = await import(
          "georaster-layer-for-leaflet"
        );
        const georaster = await parseGeoraster(buffer);
        const layer = new GeoRasterLayer({
          georaster,
          opacity: activeIceSource?.opacity ?? 0.7
        });
        geoTiffLayer.current = layer;
        layer.addTo(map);
      };

      void loadGeoTiff();
    } else if (iceLayer.current) {
      iceLayer.current.setUrl(iceLayerUrl);
    }
  }, [iceLayerUrl, activeIceSource?.kind, activeIceSource?.opacity]);

  useEffect(() => {
    if (baseLayer.current && baseLayerUrl) {
      baseLayer.current.setUrl(baseLayerUrl);
      if (activeBaseLayer) {
        baseLayer.current.setOpacity(activeBaseLayer.opacity);
      }
    }
  }, [baseLayerUrl, activeBaseLayer]);

  useEffect(() => {
    if (!activeIceSource) return;
    if (iceLayer.current) {
      iceLayer.current.setOpacity(activeIceSource.opacity);
    }
    if (geoTiffLayer.current && "setOpacity" in geoTiffLayer.current) {
      (geoTiffLayer.current as unknown as { setOpacity: (o: number) => void }).setOpacity(
        activeIceSource.opacity
      );
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
  );
}
