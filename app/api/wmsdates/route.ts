import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const cache = new Map<string, { at: number; dates: string[] }>();

const allowedHosts = new Set(["thredds.met.no"]);

const catalogRefRegex = /<catalogRef[^>]*xlink:href="([^"]+)"/g;
const nhDateRegex = /nh_polstere-100_amsr2_(\d{8})1200\.nc/g;

async function fetchText(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    throw new Error(`Catalog fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function extractRefs(xml: string) {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = catalogRefRegex.exec(xml))) {
    refs.push(match[1]);
  }
  return refs;
}

function extractDates(xml: string) {
  const dates = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = nhDateRegex.exec(xml))) {
    const raw = match[1];
    const yyyy = raw.slice(0, 4);
    const mm = raw.slice(4, 6);
    const dd = raw.slice(6, 8);
    dates.add(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await worker(current));
    }
  });
  await Promise.all(runners);
  return results;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const root = searchParams.get("root");
  if (!root) return new NextResponse("Missing root", { status: 400 });

  let base: URL;
  try {
    base = new URL(root);
  } catch {
    return new NextResponse("Invalid root", { status: 400 });
  }

  if (!allowedHosts.has(base.host)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  const cacheKey = base.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ dates: cached.dates });
  }

  const rootUrl = base.toString().endsWith("/catalog.xml")
    ? base.toString()
    : `${base.toString().replace(/\/$/, "")}/catalog.xml`;

  try {
    const rootXml = await fetchText(rootUrl);
    const yearRefs = extractRefs(rootXml).filter((ref) => /^\d{4}\/catalog\.xml$/.test(ref));
    const yearUrls = yearRefs.map((ref) => new URL(ref, rootUrl).toString());

    const monthUrls = (
      await mapLimit(yearUrls, 4, async (yearUrl) => {
        const xml = await fetchText(yearUrl);
        const monthRefs = extractRefs(xml).filter((ref) => /^\d{2}\/catalog\.xml$/.test(ref));
        return monthRefs.map((ref) => new URL(ref, yearUrl).toString());
      })
    ).flat();

    const dates = new Set<string>();
    await mapLimit(monthUrls, 6, async (monthUrl) => {
      const xml = await fetchText(monthUrl);
      for (const date of extractDates(xml)) {
        dates.add(date);
      }
    });

    const sorted = Array.from(dates).sort();
    cache.set(cacheKey, { at: Date.now(), dates: sorted });

    return NextResponse.json({ dates: sorted });
  } catch (e) {
    return new NextResponse(String(e), { status: 500 });
  }
}
