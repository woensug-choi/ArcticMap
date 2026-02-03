"use client";

import { useEffect, useRef, useState } from "react";
import proj4 from "proj4";
import leaflet from "leaflet";
import proj4leaflet from "proj4leaflet";
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
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const iceLayer = useRef<import("leaflet").TileLayer | null>(null);
  const geoTiffLayer = useRef<import("leaflet").Layer | null>(null);
  const baseLayer = useRef<import("leaflet").TileLayer | null>(null);
  const coastLayer = useRef<import("leaflet").TileLayer | null>(null);
  const graticuleLayer = useRef<import("leaflet").TileLayer | null>(null);
  const didInitialView = useRef(false);
  const [cursor, setCursor] = useState<{ lat: number; lon: number } | null>(null);
  const dataBoundsRef = useRef<import("leaflet").LatLngBounds | null>(null);
  const { t } = useLanguage();

  const overlayTileUrl = (overlay?: TileLayerSource, date: string | undefined = activeDate) => {
    if (!overlay || !date) return "";
    return buildTileUrl(overlay, date);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !dataset) return;

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

    const crs = new L.Proj.CRS(dataset.mapConfig.projection, dataset.mapConfig.proj4, {
      resolutions: dataset.mapConfig.resolutions,
      origin: dataset.mapConfig.origin,
      bounds: L.bounds(dataset.mapConfig.bounds[0], dataset.mapConfig.bounds[1]),
    });

    const map = L.map(mapRef.current, {
      crs,
      zoomControl: false,
      attributionControl: true,
      minZoom: dataset.mapConfig.minZoom,
      maxZoom: dataset.mapConfig.maxZoom,
      preferCanvas: true,
    });

    map.createPane("basemap");
    map.getPane("basemap")!.style.zIndex = "200";

    map.createPane("ice");
    map.getPane("ice")!.style.zIndex = "400";

    map.createPane("overlay");
    map.getPane("overlay")!.style.zIndex = "600";

    const [[x1, y1], [x2, y2]] = dataset.mapConfig.bounds as [number[], number[]];
    // corners (projected)
    const pA = L.point(x1, y1);
    const pB = L.point(x2, y2);
    // CRS가 아는 방식으로 unproject (가장 안전)
    const llA = crs.unproject(pA);
    const llB = crs.unproject(pB);
    const latLngBounds = L.latLngBounds(llA, llB);
    dataBoundsRef.current = latLngBounds;

    map.fitBounds(latLngBounds, { animate: false });

    console.log("center", dataset.mapConfig.center, "maxBounds", dataset.mapConfig.maxBounds);

    baseLayer.current = L.tileLayer("", {
      maxZoom: dataset.mapConfig.maxZoom,
      opacity: activeBaseLayer?.opacity ?? 0.9,
      tileSize: 512,
      attribution: activeBaseLayer?.attribution,
      pane: "basemap",
    }).addTo(map);



    coastLayer.current = (L as any).tileLayer.wms("https://geos.polarview.aq/geoserver/gwc/service/wms", {
      layers: "gwcPolarviewCoastArctic10Grat",
      format: "image/png",
      transparent: true,
      version: "1.1.1",
      tiled: true,
      tileSize: 512,
      opacity: 1.0,
      attribution: "PolarView",
      srs: "EPSG:3413",
      pane: "overlay",
    });

    const coastSource = dataset.overlays.coastlines;
    coastLayer.current = (leaflet as unknown as typeof import("leaflet")).tileLayer.wms(
      "https://geos.polarview.aq/geoserver/gwc/service/wms",
      {
        layers: "gwcPolarviewCoastArctic10Grat",
        format: "image/png",
        transparent: true,
        version: "1.1.1",
        tiled: true,
        tileSize: 512,
        opacity: 1.0,
        attribution: "PolarView",
        // Leaflet 타입이 까다로우면 아래처럼 any 처리해도 됨
        srs: "EPSG:3413" as any,
      } as any,
    );

    const graticuleSource = dataset.overlays.graticule;
    graticuleLayer.current = L.tileLayer(overlayTileUrl(graticuleSource), {
      maxZoom: dataset.mapConfig.maxZoom,
      opacity: graticuleSource.opacity,
      tileSize: 512,
      attribution: graticuleSource.attribution,
      className: "graticule-layer",
      pane: "overlay",
    });

    if (showCoastlines) coastLayer.current.addTo(map);
    if (showGraticule) graticuleLayer.current.addTo(map);

    mapInstance.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);

    // ✅ 커서 위경도 표시 (rAF로 과도한 렌더 방지)
    let rafId = 0;
    let lastLatLon: { lat: number; lon: number } | null = null;

    const onMouseMove = (ev: any) => {
      try {
        // Proj4Leaflet 환경에서 이 값은 보통 EPSG:4326 lat/lon으로 잘 나옴
        const ll = map.mouseEventToLatLng(ev.originalEvent);
        if (!ll) return;

        lastLatLon = { lat: ll.lat, lon: ll.lng };
        if (rafId) return;

        rafId = requestAnimationFrame(() => {
          rafId = 0;
          if (lastLatLon) setCursor(lastLatLon);
        });
      } catch {
        // ignore
      }
    };

    map.on("mousemove", onMouseMove);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      map.off("mousemove", onMouseMove);
      mapInstance.current?.remove();
      mapInstance.current = null;
      didInitialView.current = false;
    };
  }, [dataset]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !dataset) return;

    const L = leaflet as unknown as typeof import("leaflet");

    // 1) basemap이 선택 안 된 상태면 제거
    if (!baseLayerUrl) {
      if (baseLayer.current) {
        baseLayer.current.removeFrom(map);
        baseLayer.current = null;
      }
      return;
    }

    // 2) 기존 basemap 제거 후 새로 생성(확실하게 전환)
    if (baseLayer.current) {
      baseLayer.current.removeFrom(map);
      baseLayer.current = null;
    }

    baseLayer.current = L.tileLayer(baseLayerUrl, {
      maxZoom: dataset.mapConfig.maxZoom,
      opacity: activeBaseLayer?.opacity ?? 0.9,
      tileSize: 512,
      attribution: activeBaseLayer?.attribution,
      // ✅ basemap은 bounds 걸고 싶으면 여기만(overlay는 X)
      // bounds: dataBoundsRef.current ?? undefined,
    }).addTo(map);

    // basemap은 항상 맨 뒤
    baseLayer.current.bringToBack();

    // 격자/해안선이 켜져있으면 맨 앞으로
    if (showGraticule && graticuleLayer.current && map.hasLayer(graticuleLayer.current)) {
      graticuleLayer.current.bringToFront();
    }
    if (showCoastlines && coastLayer.current && map.hasLayer(coastLayer.current)) {
      coastLayer.current.bringToFront();
    }
  }, [
    dataset,
    baseLayerUrl,
    activeBaseLayer?.opacity,
    activeBaseLayer?.attribution,
    showGraticule,
    showCoastlines,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !dataset) return;
  
    const L = leaflet as unknown as typeof import("leaflet");
  
    // ✅ 0) Select data 상태면: 얼음 레이어/GeoTIFF 레이어 제거하고 종료
    if (!iceLayerUrl) {
      if (iceLayer.current) {
        iceLayer.current.removeFrom(map);
        iceLayer.current = null;
      }
      if (geoTiffLayer.current) {
        geoTiffLayer.current.removeFrom(map);
        geoTiffLayer.current = null;
      }
      return;
    }
  
    const controller = new AbortController();
    let cancelled = false;
  
    const cleanup = () => {
      if (iceLayer.current) {
        iceLayer.current.removeFrom(map);
        iceLayer.current = null;
      }
      if (geoTiffLayer.current) {
        geoTiffLayer.current.removeFrom(map);
        geoTiffLayer.current = null;
      }
    };
  
    // ✅ 1) GeoTIFF 모드
    if (activeIceSource?.kind === "geotiff") {
      cleanup();
  
      (async () => {
        try {
          const proxied = `/api/proxy?url=${encodeURIComponent(iceLayerUrl)}`;
          const res = await fetch(proxied, { signal: controller.signal });
          if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  
          const buf = await res.arrayBuffer();
  
          const { default: parseGeoraster } = await import("georaster");
          const { default: GeoRasterLayer } = await import("georaster-layer-for-leaflet");
  
          if (cancelled) return;
  
          const georaster = await parseGeoraster(buf);
          if (cancelled) return;
  
          const layer = new GeoRasterLayer({
            georaster,
            opacity: activeIceSource.opacity ?? 0.7,
            pane: "ice", // ✅ pane에 올려서 basemap 위로
          });
  
          geoTiffLayer.current = layer as unknown as import("leaflet").Layer;
          layer.addTo(map);
  
          // overlay 다시 위로
          if (showGraticule && graticuleLayer.current && map.hasLayer(graticuleLayer.current)) {
            graticuleLayer.current.bringToFront();
          }
          if (showCoastlines && coastLayer.current && map.hasLayer(coastLayer.current)) {
            coastLayer.current.bringToFront();
          }
        } catch (e) {
          console.error("[GeoTIFF] error ❌", e);
        }
      })();
  
      return () => {
        cancelled = true;
        controller.abort();
        cleanup();
      };
    }
  
    // ✅ 2) Tile 모드
    if (geoTiffLayer.current) {
      geoTiffLayer.current.removeFrom(map);
      geoTiffLayer.current = null;
    }
  
    if (!iceLayer.current) {
      iceLayer.current = L.tileLayer(iceLayerUrl, {
        maxZoom: dataset.mapConfig.maxZoom,
        opacity: activeIceSource?.opacity ?? 0.7,
        tileSize: 512,
        attribution: activeIceSource?.attribution,
        pane: "ice",
      }).addTo(map);
    } else {
      iceLayer.current.setUrl(iceLayerUrl);
      if (activeIceSource?.opacity !== undefined) {
        iceLayer.current.setOpacity(activeIceSource.opacity);
      }
    }
  
    return () => controller.abort();
  }, [
    dataset,
    iceLayerUrl,
    activeIceSource?.kind,
    activeIceSource?.opacity,
    activeIceSource?.attribution,
    showGraticule,
    showCoastlines,
  ]);
  

  useEffect(() => {
    const map = mapInstance.current;
    const layer = baseLayer.current;
    if (!map || !layer) return;

    if (!baseLayerUrl) {
      if (map.hasLayer(layer)) layer.removeFrom(map);
      layer.setUrl("");
      return;
    }

    if (!map.hasLayer(layer)) layer.addTo(map);
    layer.setUrl(baseLayerUrl);

    if (activeBaseLayer?.opacity !== undefined) {
      layer.setOpacity(activeBaseLayer.opacity);
    }

    // ✅ 핵심: basemap은 무조건 맨 뒤로
    layer.bringToBack();

    // ✅ 격자/해안선이 켜져있으면 맨 앞으로 다시 올려줌
    if (showGraticule && graticuleLayer.current && map.hasLayer(graticuleLayer.current)) {
      graticuleLayer.current.bringToFront();
    }
    if (showCoastlines && coastLayer.current && map.hasLayer(coastLayer.current)) {
      coastLayer.current.bringToFront();
    }
  }, [baseLayerUrl, activeBaseLayer?.opacity, showGraticule, showCoastlines]);

  useEffect(() => {
    if (!activeIceSource) return;

    if (iceLayer.current) {
      iceLayer.current.setOpacity(activeIceSource.opacity);
    }

    if (geoTiffLayer.current && "setOpacity" in geoTiffLayer.current) {
      (geoTiffLayer.current as unknown as { setOpacity: (o: number) => void }).setOpacity(
        activeIceSource.opacity,
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
      coastLayer.current.setUrl(overlayTileUrl(dataset.overlays.coastlines, activeDate));
    }

    if (graticuleLayer.current) {
      graticuleLayer.current.setUrl(overlayTileUrl(dataset.overlays.graticule, activeDate));
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
    <Card className="relative min-h-[655px] overflow-hidden border-slate-700">
      <div ref={mapRef} className="h-[655px] w-full bg-slate-900" aria-label="Arctic sea ice map" />

      <div className="absolute left-4 top-4 z-[1000] rounded-md bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300 pointer-events-none">
        <div>{t("baseMap")}: {activeBaseLayer ? activeBaseLayer.label : <span>{t("notSelected")}</span>}</div>
        <div>{t("iceConcentration")}: {activeIceSource ? activeIceSource.label : <span>{t("notSelected")}</span>}</div>
      </div>

    </Card>
  );
}
