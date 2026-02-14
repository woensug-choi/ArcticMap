import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const cache = new Map<string, { at: number; dates: string[] }>();

const allowedHosts = new Set(["wmts.marine.copernicus.eu"]);

const layerRegex = /<Layer\b[\s\S]*?<\/Layer>/g;
const identifierRegex = /<ows:Identifier>([^<]+)<\/ows:Identifier>/;
const dimensionRegex = /<(?:ows:)?Dimension>[\s\S]*?<\/(?:ows:)?Dimension>/g;
const timeIdentifierRegex = /<ows:Identifier>\s*time\s*<\/ows:Identifier>/;
const valueRegex = /<Value>([^<]+)<\/Value>/;

async function fetchText(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    throw new Error(`Capabilities fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function extractTimeRange(xml: string, layerId: string) {
  const layers = xml.match(layerRegex) ?? [];
  for (const layerXml of layers) {
    const idMatch = layerXml.match(identifierRegex);
    if (!idMatch) continue;
    if (idMatch[1] !== layerId) continue;

    const dimensions = layerXml.match(dimensionRegex) ?? [];
    for (const dimensionXml of dimensions) {
      if (!timeIdentifierRegex.test(dimensionXml)) continue;
      const valueMatch = dimensionXml.match(valueRegex);
      if (valueMatch) return valueMatch[1];
    }
  }
  return null;
}

function buildDailyDates(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid time range");
  }

  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const dates: string[] = [];
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const layer = searchParams.get("layer");
  if (!url || !layer) {
    return new NextResponse("Missing url or layer", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!allowedHosts.has(target.host)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  const cacheKey = `${target.toString()}::${layer}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ dates: cached.dates });
  }

  try {
    const xml = await fetchText(target.toString());
    const range = extractTimeRange(xml, layer);
    if (!range) {
      return new NextResponse("Time range not found", { status: 404 });
    }
    const [start, end] = range.split("/");
    if (!start || !end) {
      return new NextResponse("Invalid time range", { status: 500 });
    }
    const dates = buildDailyDates(start, end);
    cache.set(cacheKey, { at: Date.now(), dates });
    return NextResponse.json({ dates });
  } catch (e) {
    return new NextResponse(String(e), { status: 500 });
  }
}
