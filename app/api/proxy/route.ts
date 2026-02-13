import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
 

  console.log("[proxy] raw url param =", url);
  console.log("[proxy] startsWith http?", /^https?:\/\//i.test(url));
  

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  for (const [key, value] of searchParams.entries()) {
    if (key === "url") continue;
    target.searchParams.set(key, value);
  }

  const allowedHosts = [
    "noaadata.apps.nsidc.org",
    "nsidc.org",
    "seaice.uni-bremen.de",
    "geos.polarview.aq",
    "thredds.met.no",
    "www.dropbox.com",
    "dl.dropboxusercontent.com",
  ];

  if (!allowedHosts.includes(target.host)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!upstream.ok) {
      return new NextResponse(
        `Upstream error: ${upstream.status} ${upstream.statusText}`,
        { status: upstream.status }
      );
    }

    const buf = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return new NextResponse(`Proxy fetch threw: ${String(e?.message ?? e)}`, { status: 500 });
  }
}
