export type TileLayerSource = {
  id: string;
  label: string;
  layer: string;
  tileMatrixSet: string;
  format: "jpg" | "jpeg" | "png" | "tif";
  attribution: string;
  infoUrl?: string;
  urlTemplate: string;
  opacity: number;
  kind?: "wmts" | "geotiff";
};

export type GraticuleSource = {
  id: string;
  label: string;
  kind: "graticule";
  attribution: string;
  opacity: number;
  minLat: number;
  maxLat: number;
  latStep: number;
  lonStep: number;
  segmentStep: number;
  labelEveryLat?: number;
  labelEveryLon?: number;
  labelLon?: number;
  labelLat?: number;
  zoomSteps?: GraticuleZoomStep[];
  color?: string;
  weight?: number;
  dashArray?: string;
};

export type GraticuleZoomStep = {
  minZoom: number;
  maxZoom?: number;
  latStep: number;
  lonStep: number;
  segmentStep?: number;
  labelEveryLat?: number;
  labelEveryLon?: number;
};

export type OverlaySource = TileLayerSource | GraticuleSource;

export const isGraticuleSource = (
  source: OverlaySource | undefined,
): source is GraticuleSource => !!source && source.kind === "graticule";

export const isTileLayerSource = (
  source: OverlaySource | undefined,
): source is TileLayerSource => !!source && "urlTemplate" in source;

export type Snapshot = {
  label: string;
  date: string;
  extent: number;
  anomaly: number;
  drift: string;
  concentration: number;
};

export type DatasetResponse = {
  mapConfig: {
    projection: string;
    proj4: string;
    resolutions: number[];
    origin: [number, number];
    bounds: [[number, number], [number, number]];
    center: [number, number];
    initialZoom: number;
    minZoom: number;
    maxZoom: number;
    maxBounds: [[number, number], [number, number]];
  };
  baseLayers: Record<string, TileLayerSource>;
  iceSources: Record<string, TileLayerSource>;
  overlays: Record<string, OverlaySource>;
  snapshots: Snapshot[];
  calendarDays: Array<number | null>;
  defaults: {
    baseLayerKey: string;
    iceSourceKey: string;
    showCoastlines: boolean;
    showGraticule: boolean;
    defaultDate: string;
  };
};

const gibsUrlTemplate =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3413/best/{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.{format}";
const gibsStaticUrlTemplate =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3413/best/{layer}/default/{tileMatrixSet}/{z}/{y}/{x}.{format}";
const noaaGeoTiffTemplate =
  "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/geotiff/{year}/{month}_{monthName}/N_{ymd}_concentration_v4.0.tif";

export const dataset: DatasetResponse = {
  mapConfig: {
    projection: "EPSG:3413",
    proj4:
      "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
    resolutions: [8192, 4096, 2048, 1024, 512, 256],
    origin: [-4194304, 4194304],
    bounds: [
      [-4194304, -4194304],
      [4194304, 4194304]
    ],
    center: [90, 0],
    initialZoom: 1,
    minZoom: 0,
    maxZoom: 5,
    maxBounds: [
      [50, -180],
      [90, 180]
    ]
  },
  baseLayers: {
    blueMarble: {
      id: "blueMarble",
      label: "Blue Marble",
      layer: "BlueMarble_NextGeneration",
      tileMatrixSet: "500m",
      format: "jpeg",
      attribution: "NASA GIBS",
      urlTemplate: gibsStaticUrlTemplate,
      opacity: 0.9
    },
    blueMarbleBathymetry: {
      id: "blueMarbleBathymetry",
      label: "Blue Marble Bathymetry",
      layer: "BlueMarble_ShadedRelief_Bathymetry",
      tileMatrixSet: "500m",
      format: "jpeg",
      attribution: "NASA GIBS",
      urlTemplate: gibsStaticUrlTemplate,
      opacity: 0.9
    },
    // modis: {
    //   id: "modis",
    //   label: "MODIS Terra True Color",
    //   layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    //   tileMatrixSet: "250m",
    //   format: "jpg",
    //   attribution: "NASA GIBS",
    //   urlTemplate: gibsUrlTemplate,
    //   opacity: 0.95
    // }
  },
  iceSources: {
    seaIceConcentration: {
      id: "seaIceConcentration",
      label: "Sea Ice Concentration",
      layer: "SeaIce_Concentration",
      tileMatrixSet: "250m",
      format: "png",
      attribution: "NSIDC · NASA GIBS",
      infoUrl: "https://earthdata.nasa.gov/gibs",
      urlTemplate: gibsUrlTemplate,
      opacity: 0.7,
      kind: "wmts"
    },
    noaaSeaIceConcentration: {
      id: "noaaSeaIceConcentration",
      label: "NOAA Sea Ice Concentration (GeoTIFF)",
      layer: "NOAA_G02135",
      tileMatrixSet: "geotiff",
      format: "tif",
      attribution: "NSIDC NOAA G02135",
      infoUrl: "https://nsidc.org/data/g02135",
      urlTemplate: noaaGeoTiffTemplate,
      opacity: 0.7,
      kind: "geotiff"
    },
  },
  overlays: {
    coastlines: {
      id: "coastlines_nasa",
      label: "Coastlines NASA GIBS",
      layer: "Coastlines",
      tileMatrixSet: "250m",
      format: "png",
      attribution: "NASA GIBS",
      urlTemplate: gibsUrlTemplate,
      opacity: 0.9
    },
    graticule: {
      id: "graticule",
      label: "Graticule (Local)",
      kind: "graticule",
      attribution: "Generated locally",
      opacity: 0.4,
      minLat: 30,
      maxLat: 90,
      latStep: 10,
      lonStep: 30,
      segmentStep: 1,
      labelEveryLat: 10,
      labelEveryLon: 30,
      color: "#ffffff",
      weight: 1
    },
  },
  snapshots: [
    {
      label: "Jan 12",
      date: "2026-01-12",
      extent: 13.92,
      anomaly: -0.34,
      drift: "NNE",
      concentration: 92
    },
    {
      label: "Jan 16",
      date: "2026-01-16",
      extent: 13.71,
      anomaly: -0.41,
      drift: "NE",
      concentration: 89
    },
    {
      label: "Jan 19",
      date: "2026-01-19",
      extent: 13.55,
      anomaly: -0.48,
      drift: "E",
      concentration: 86
    },
    {
      label: "Jan 21",
      date: "2026-01-21",
      extent: 13.42,
      anomaly: -0.53,
      drift: "ESE",
      concentration: 83
    }
  ],
  calendarDays: [
    null,
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31
  ],
  defaults: {
    baseLayerKey: "modis",
    iceSourceKey: "seaIceConcentration",
    showCoastlines: true,
    showGraticule: true,
    defaultDate: "2026-01-12"
  }
};

export const calendarDays: (number | null)[] = (() => {
  // Generates a Sunday-starting calendar grid for January 2026
  const year = 2026;
  const month = 0; // January (0-based)
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
})();

export const buildTileUrl = (source: TileLayerSource, date: string) =>
  source.urlTemplate
    .replace("{layer}", source.layer)
    .replace("{time}", date)
    .replace("{tileMatrixSet}", source.tileMatrixSet)
    .replace("{format}", source.format);

export const buildGeoTiffUrl = (source: TileLayerSource, date: string) => {
  const [year, month, day] = date.split("-");
  const monthIndex = Number(month) - 1;
  const monthName = new Date(Number(year), monthIndex, 1).toLocaleString(
    "en-US",
    { month: "short" }
  );
  const paddedMonth = String(monthIndex + 1).padStart(2, "0");
  return source.urlTemplate
    .replace("{year}", year)
    .replace("{month}", paddedMonth)
    .replace("{monthName}", monthName)
    .replace("{ymd}", `${year}${paddedMonth}${day}`);
};
