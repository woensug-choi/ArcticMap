"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";
import type { DatasetResponse, TileLayerSource } from "@/lib/datasets";
import { buildGeoTiffUrl, buildTileUrl } from "@/lib/datasets";

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
  title,
}: DataLayersPanelProps) {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t("dataAndLayers");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const sampleDate =
    dataset?.defaults.defaultDate ?? dataset?.snapshots?.[0]?.date ?? "";

  const renderLayer = (source: TileLayerSource) => (
    <li
      key={source.id}
      className="rounded-md border border-slate-800 bg-slate-900/60 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{source.label}</p>
          <p className="text-xs text-slate-500">
            {t("layerIdLabel")}: {source.layer}
          </p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-slate-300">
          {source.tileMatrixSet}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        <p>
          {t("sampleUrlLabel")}: {" "}
          <span className="break-all text-slate-300">
            {source.kind === "geotiff"
              ? buildGeoTiffUrl(source, sampleDate)
              : buildTileUrl(source, sampleDate)}
          </span>
        </p>
        <p className="mt-1">
          {t("attributionLabel")}: {source.attribution}
        </p>
      </div>
    </li>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex w-full justify-between items-center">
            <div>{resolvedTitle}</div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-slate-600 bg-transparent text-slate-200"
              onClick={() => setIsCatalogOpen(true)}
            >
              {t("layerCatalogOpen")}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-slate-400">
        <div className="space-y-2">
          <p className="text-slate-300">{t("iceConcentration")}</p>
          <select
            value={iceSourceKey}
            onChange={(event) => setIceSourceKey(event.target.value)}
            aria-label={t("iceConcentration")}
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
          >
            <option value="">Select data</option>
            {Object.entries(dataset?.iceSources ?? {}).map(([key, source]) => (
              <option key={key} value={key}>
                {source.label}
              </option>
            ))}
          </select>
          
          <div className="text-[11px] text-slate-500">
            {t("info")}:{" "}            
            {activeIceSource?.infoUrl ? (
              <a
              href={activeIceSource.infoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-300 underline decoration-slate-600 underline-offset-2"
              >
                {activeIceSource.label}
                </a>
                ) : (
                  <span>{t("selectDataToViewInfo")}</span>
                )}

          </div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-300">{t("baseMap")}</p>
          <select 
          value={baseLayerKey}
          onChange={(event) => setBaseLayerKey(event.target.value)}
          aria-label={t("baseMap")}
          className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200"
          >
              <option value="">Select basemap</option>
              
              {Object.entries(dataset?.baseLayers ?? {}).map(([key, layer]) => (
                <option key={key} value={key}>
                  {layer.label}
                  </option>
                ))}
                </select>
                
                <p className="text-[11px] text-slate-500">
                  {t("active")}:{" "}
                  {activeBaseLayer ? activeBaseLayer.label : "Select basemap"}
                  </p>

        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showCoastlines}
            onChange={(event) => setShowCoastlines(event.target.checked)}
            className="h-3 w-3 accent-sky-400"
          />
          {t("showCoastlines")}
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showGraticule}
            onChange={(event) => setShowGraticule(event.target.checked)}
            className="h-3 w-3 accent-sky-400"
          />
          {t("showGraticule")}
        </label>
      </CardContent>
      {isCatalogOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-4"
          onClick={() => setIsCatalogOpen(false)}
        >
          <Card
            className="flex h-[90vh] w-[95vw] max-w-6xl flex-col border-slate-700 bg-slate-900 text-slate-100"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("layerCatalogTitle")}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/70 bg-red-500/20 text-red-100 hover:border-red-400 hover:bg-red-500/30"
                  onClick={() => setIsCatalogOpen(false)}
                >
                  {t("close")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto space-y-6 text-xs text-slate-300 scrollbar-dark">
              <div>
              <p className="text-[11px] text-slate-500">
                {t("active")}: {activeBaseLayer ? activeBaseLayer.label : "None"}
                </p>

                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.baseLayers).map(renderLayer)
                    : t("loading")}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("iceSourcesLabel")}
                </p>
                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.iceSources).map(renderLayer)
                    : t("loading")}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("overlaysLabel")}
                </p>
                <ul className="mt-2 space-y-3">
                  {dataset
                    ? Object.values(dataset.overlays).map(renderLayer)
                    : t("loading")}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
