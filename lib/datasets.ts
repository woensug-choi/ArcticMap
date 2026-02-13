export type TileLayerSource = {
  id: string;
  label: string;
  layer: string;
  tileMatrixSet: string;
  format: "jpg" | "jpeg" | "png" | "tif" | "nc";
  attribution: string;
  infoUrl?: string;
  urlTemplate: string;
  opacity: number;
  kind?: "wmts" | "geotiff" | "wms";
  bounds?: [[number, number], [number, number]];
  wmsCrs?: string[];
  wmsTime?: boolean;
  wmsStyles?: string[];
  wmsDefaultStyle?: string;
  wmsCatalogRoot?: string;
};

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
  overlays: Record<string, TileLayerSource>;
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
const osiSafWmsFileTemplate =
  "https://thredds.met.no/thredds/wms/osisaf/met.no/ice/amsr2_conc/{YYYY}/{MM}/ice_conc_nh_polstere-100_amsr2_{YYYYMMDD}1200.nc";

export const dataset: DatasetResponse = {
  mapConfig: {
    projection: "EPSG:3413",
    proj4:
      "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
    resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64],
    origin: [-4194304, 4194304],
    bounds: [
      [-4194304, -4194304],
      [4194304, 4194304]
    ],
    center: [90, 0],
    initialZoom: 1,
    minZoom: 0,
    maxZoom: 7,
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

    osiSafAmsr2Wms: {
      id: "osiSafAmsr2Wms",
      label: "OSI SAF AMSR2 SIC (WMS · ice_conc)",
      layer: "ice_conc",
      tileMatrixSet: "wms",
      format: "png",
      attribution: "EUMETSAT OSI SAF",
      infoUrl: "https://osi-saf.eumetsat.int/products/sea-ice-products",
      urlTemplate: osiSafWmsFileTemplate,
      opacity: 0.75,
      kind: "wms",
      wmsTime: false,
      wmsCrs: ["EPSG:3857", "CRS:84", "EPSG:4326"],
      wmsCatalogRoot:
        "https://thredds.met.no/thredds/catalog/osisaf/met.no/ice/amsr2_conc",
    },
    osiSafAmsr2WmsUncertainty: {
      id: "osiSafAmsr2WmsUncertainty",
      label: "OSI SAF AMSR2 SIC (WMS · total_uncertainty)",
      layer: "total_uncertainty",
      tileMatrixSet: "wms",
      format: "png",
      attribution: "EUMETSAT OSI SAF",
      infoUrl: "https://osi-saf.eumetsat.int/products/sea-ice-products",
      urlTemplate: osiSafWmsFileTemplate,
      opacity: 0.75,
      kind: "wms",
      wmsTime: false,
      wmsCrs: ["EPSG:3857", "CRS:84", "EPSG:4326"],
      wmsCatalogRoot:
        "https://thredds.met.no/thredds/catalog/osisaf/met.no/ice/amsr2_conc",
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
      label: "Graticule",
      layer: "Graticule",
      tileMatrixSet: "250m",
      format: "png",
      attribution: "NASA GIBS",
      urlTemplate: gibsStaticUrlTemplate,
      opacity: 0.45
    },
    graticuleExtended: {
      id: "graticuleExtended",
      label: "Graticule Extended",
      layer: "Graticule_Extended",
      tileMatrixSet: "1.5km",
      format: "png",
      attribution: "NASA GIBS",
      urlTemplate: gibsStaticUrlTemplate,
      opacity: 0.6
    }
  },
  snapshots: [
    {
      label: "Feb 01",
      date: "2026-02-01",
      extent: 13.92,
      anomaly: -0.34,
      drift: "NNE",
      concentration: 92
    },
    {
      label: "Feb 02",
      date: "2026-02-02",
      extent: 13.71,
      anomaly: -0.41,
      drift: "NE",
      concentration: 89
    },
    {
      label: "Feb 03",
      date: "2026-02-03",
      extent: 13.55,
      anomaly: -0.48,
      drift: "E",
      concentration: 86
    },
    {
      label: "Feb 04",
      date: "2026-02-04",
      extent: 13.42,
      anomaly: -0.53,
      drift: "ESE",
      concentration: 83
    },
    {
      label: "Feb 05",
      date: "2026-02-05",
      extent: 13.66,
      anomaly: -0.36,
      drift: "ENE",
      concentration: 90
    },
    {
      label: "Feb 06",
      date: "2026-02-06",
      extent: 13.58,
      anomaly: -0.39,
      drift: "NE",
      concentration: 88
    },
    {
      label: "Feb 07",
      date: "2026-02-07",
      extent: 13.49,
      anomaly: -0.42,
      drift: "E",
      concentration: 87
    },
    {
      label: "Feb 08",
      date: "2026-02-08",
      extent: 13.44,
      anomaly: -0.45,
      drift: "ESE",
      concentration: 85
    }
  ],
  calendarDays: [
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
    28
  ],
  defaults: {
    baseLayerKey: "",
    iceSourceKey: "",
    showCoastlines: true,
    showGraticule: true,
    defaultDate: "2026-02-08"
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

export const buildWmsUrl = (source: TileLayerSource, date: string) => {
  const [year, month, day] = date.split("-");
  const ymd = `${year}${month}${day}`;
  return source.urlTemplate
    .replace("{YYYY}", year)
    .replace("{MM}", month)
    .replace("{DD}", day)
    .replace("{YYYYMMDD}", ymd);
};

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
