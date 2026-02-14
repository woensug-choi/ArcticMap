"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DataLayersPanel from "@/components/DataLayersPanel";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { buildGeoTiffUrl, buildTileUrl, buildWmsUrl, dataset as datasetData } from "@/lib/datasets";

const MapViewer = dynamic(() => import("../components/MapViewer"), {
  ssr: false,
});
const CalendarSelector = dynamic(
  () => import("../components/CalendarSelector"),
  {
    ssr: false, //서버 렌더링(SSR)을 끄고, 브라우저에서만 로딩하게 만듦

  },
);

export default function HomePage() {
  const dataset = datasetData; //정적 데이터 사용
  const [activeDate, setActiveDate] = useState<string>(
    () => dataset.defaults.defaultDate ?? dataset.snapshots?.[0]?.date ?? ""
  );
  const [isPlaying, setIsPlaying] = useState(false); // isplaying: 재생 중인지 여부 
  const [playbackSpeed, setPlaybackSpeed] = useState(3500); //palyback speed: 날짜 넘어가는 속도 ㅡ> 날짜 애니메이션 플레이어 
  const [baseLayerKey, setBaseLayerKey] = useState<string>(
    () => dataset.defaults.baseLayerKey
  );
  const [iceSourceKey, setIceSourceKey] = useState<string>(
    () => dataset.defaults.iceSourceKey
  );
  const [showCoastlines, setShowCoastlines] = useState(dataset.defaults.showCoastlines); //해안선 표시 위경도 격자 표시여부 
  const [showGraticule, setShowGraticule] = useState(dataset.defaults.showGraticule);
  const [iceStatus, setIceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const { t, locale } = useLanguage();

  const fallbackDates = useMemo(
    () => (dataset?.snapshots ?? []).map((snapshot) => snapshot.date).sort(),
    [dataset],
  );
  const [availableDates, setAvailableDates] = useState<string[]>(() => fallbackDates);

  const activeSnapshot = useMemo(
    () => (dataset?.snapshots ?? []).find((snapshot) => snapshot.date === activeDate) ?? null,
    [dataset, activeDate],
  );
  const activeIceSource = iceSourceKey ? dataset?.iceSources[iceSourceKey] : undefined; 
  const activeBaseLayer = baseLayerKey
  ? dataset?.baseLayers[baseLayerKey]
  : undefined;

  useEffect(() => {
    if (!availableDates.length) return;
    if (!availableDates.includes(activeDate)) {
      setActiveDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, activeDate]);

  useEffect(() => {
    if (!activeIceSource) {
      setAvailableDates(fallbackDates);
      return;
    }

    const controller = new AbortController();
    const loadDates = async () => {
      if (activeIceSource.kind === "wms" && activeIceSource.wmsCatalogRoot) {
        try {
          const params = new URLSearchParams({ root: activeIceSource.wmsCatalogRoot });
          const res = await fetch(`/api/wmsdates?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = (await res.json()) as { dates?: string[] };
          if (Array.isArray(data.dates) && data.dates.length > 0) {
            setAvailableDates([...data.dates].sort());
            return;
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            console.warn("[dates] WMS catalog load failed", e);
          }
        }
        setAvailableDates(fallbackDates);
        return;
      }

      if (activeIceSource.kind === "wmts" && activeIceSource.wmtsCapabilitiesUrl) {
        try {
          const params = new URLSearchParams({
            url: activeIceSource.wmtsCapabilitiesUrl,
            layer: activeIceSource.layer,
          });
          const res = await fetch(`/api/wmtsdates?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = (await res.json()) as { dates?: string[] };
          if (Array.isArray(data.dates) && data.dates.length > 0) {
            setAvailableDates([...data.dates].sort());
            return;
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            console.warn("[dates] WMTS capabilities load failed", e);
          }
        }
        setAvailableDates(fallbackDates);
        return;
      }

      setAvailableDates(fallbackDates);
    };

    void loadDates();

    return () => controller.abort();
  }, [activeIceSource, fallbackDates]);

  const baseLayerUrl = useMemo(() => { //매우 중요: z,x,y 형태 타일 url 생성, 날짜가 필요한 wmts 여기서 처리 
    if (!activeBaseLayer || !activeDate) return "";
    return buildTileUrl(activeBaseLayer, activeDate);
  }, [activeBaseLayer, activeDate]);

  const iceLayerUrl = useMemo(() => { // GeoTIFF/NetCDF면 → buildGeoTiffUrl, 타일이면 → buildTileUrl
    if (!activeIceSource || !activeDate) return "";
    if (activeIceSource.kind === "geotiff") {
      return buildGeoTiffUrl(activeIceSource, activeDate);
    }
    if (activeIceSource.kind === "wms") {
      return buildWmsUrl(activeIceSource, activeDate);
    }
    return buildTileUrl(activeIceSource, activeDate);
  }, [activeIceSource, activeDate]);

  useEffect(() => { //누르면 날짜 자동 증가, 마지막 날짜 처음으로 루프, 속도 조절 가능 
    if (!isPlaying || availableDates.length === 0) return;

    const timer = setInterval(() => {
      if (iceStatus === "loading") return;
      setActiveDate((current) => {
        const idx = availableDates.indexOf(current);
        const nextIdx = idx >= 0 ? (idx + 1) % availableDates.length : 0;
        return availableDates[nextIdx];
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, availableDates, iceStatus]);

  const activeLabel = useMemo(() => {
    if (activeSnapshot?.label) return activeSnapshot.label;
    if (!activeDate) return t("loading");
    const dt = new Date(`${activeDate}T00:00:00Z`);
    return dt.toLocaleDateString(locale, { month: "short", day: "2-digit" });
  }, [activeSnapshot, activeDate, locale, t]);

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
                {t("appName")}
              </p>
              <h1 className="text-2xl font-semibold text-slate-100">
                {t("appTitle")}
              </h1>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 text-xs text-slate-400">
            <LanguageSwitcher />
            <span>
              {t("sourceLabel")}:{" "}
              {activeIceSource
              ? activeIceSource.label
              : t("selectDataToViewInfo")}
              </span>

            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>
              {t("projectionLabel")}: {dataset?.mapConfig.projection ?? t("loading")}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <CalendarSelector //날짜 선택, 속도조절, 작동여부 
              availableDates={availableDates}
              activeDate={activeDate}
              setActiveDate={setActiveDate}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
            />

            <DataLayersPanel //해빙 데이터 선택, 베이스맵 선택, 보조레이어 토글
              dataset={dataset}
              iceSourceKey={iceSourceKey}
              setIceSourceKey={setIceSourceKey}
              baseLayerKey={baseLayerKey}
              setBaseLayerKey={setBaseLayerKey}
              showCoastlines={showCoastlines}
              setShowCoastlines={setShowCoastlines}
              showGraticule={showGraticule}
              setShowGraticule={setShowGraticule}
              activeIceSource={activeIceSource}
              activeBaseLayer={activeBaseLayer}
            />
          </aside>

          <section className="flex flex-col gap-4">
            <Card className="border-slate-700 bg-slate-900/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-6 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {t("selectedDay")}
                  </p>
                  <p className="text-2xl font-semibold text-slate-100">
                    {activeLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeDate || t("loading")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <MapViewer //실제 지도 
              dataset={dataset}
              activeDate={activeDate}
              activeBaseLayer={activeBaseLayer}
              activeIceSource={activeIceSource}
              baseLayerUrl={baseLayerUrl}
              iceLayerUrl={iceLayerUrl}
              showCoastlines={showCoastlines}
              showGraticule={showGraticule}
              isPlaying={isPlaying}
              onIceStatusChange={setIceStatus}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
