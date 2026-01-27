"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataLayersPanel from "@/components/DataLayersPanel";
import { buildGeoTiffUrl, buildTileUrl, dataset as datasetData } from "@/lib/datasets";

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
  const [activeIndex, setActiveIndex] = useState(0); // activeIndwx: 현재 선택된 날짜
  const [isPlaying, setIsPlaying] = useState(false); // isplaying: 재생 중인지 여부 
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); //palyback speed: 날짜 넘어가는 속도 ㅡ> 날짜 애니메이션 플레이어 
  const [baseLayerKey, setBaseLayerKey] = useState<string>(dataset.defaults.baseLayerKey); //baselayerkey: 베이스맵 종류(osm, 위성)
  const [iceSourceKey, setIceSourceKey] = useState<string>(dataset.defaults.iceSourceKey); //iceSourcekey: 해빙데이터 소스
  const [showCoastlines, setShowCoastlines] = useState(dataset.defaults.showCoastlines); //해안선 표시 위경도 격자 표시여부 
  const [showGraticule, setShowGraticule] = useState(dataset.defaults.showGraticule);

  const snapshots = dataset?.snapshots ?? []; //snapshots: 가능한 날짜 목록 
  const active = snapshots[activeIndex] ?? null; //active: 현재 선택된 날짜 객체 
  const activeDay = active ? Number(active.date.split("-")[2]) : null; //캘린더에서 강조할 일
  const activeIceSource = dataset?.iceSources[iceSourceKey]; //key 기반으로 실제 레이더 설정 객체 가져옴 
  const activeBaseLayer = dataset?.baseLayers[baseLayerKey];

  const activeDate = active?.date ?? dataset?.defaults.defaultDate ?? ""; //선택 된 날짜가 없으면 기본 날짜 사용 

  const baseLayerUrl = useMemo(() => { //매우 중요: z,x,y 형태 타일 url 생성, 날짜가 필요한 wmts 여기서 처리 
    if (!activeBaseLayer || !activeDate) return "";
    return buildTileUrl(activeBaseLayer, activeDate);
  }, [activeBaseLayer, activeDate]);

  const iceLayerUrl = useMemo(() => { // GeoTIFF면 → buildGeoTiffUrl, 타일이면 → buildTileUrl
    if (!activeIceSource || !activeDate) return "";
    if (activeIceSource.kind === "geotiff") {
      return buildGeoTiffUrl(activeIceSource, activeDate);
    }
    return buildTileUrl(activeIceSource, activeDate);
  }, [activeIceSource, activeDate]);

  useEffect(() => { //데이터가 있는데 key 비어 있을 경우 대비 안정성요 안정 장치 
    if (!baseLayerKey) setBaseLayerKey(dataset.defaults.baseLayerKey);
    if (!iceSourceKey) setIceSourceKey(dataset.defaults.iceSourceKey);
  }, [dataset.defaults.baseLayerKey, dataset.defaults.iceSourceKey, baseLayerKey, iceSourceKey]);


  useEffect(() => { //누르면 날짜 자동 증가, 마지막 날짜 처음으로 루프, 속도 조절 가능 
    if (!isPlaying || snapshots.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % snapshots.length);
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, snapshots.length]);

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
            <CalendarSelector //날짜 선택, 속도조절, 작동여부 
              snapshots={snapshots}
              activeDay={activeDay}
              setActiveIndex={setActiveIndex}
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

            <MapViewer //실제 지도 
              dataset={dataset}
              activeDate={activeDate}
              activeBaseLayer={activeBaseLayer}
              activeIceSource={activeIceSource}
              baseLayerUrl={baseLayerUrl}
              iceLayerUrl={iceLayerUrl}
              showCoastlines={showCoastlines}
              showGraticule={showGraticule}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

