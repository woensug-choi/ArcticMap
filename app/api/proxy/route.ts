import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // 🔒 허용 도메인 제한 (보안 + 실수 방지)
  const allowedHosts = [
    "noaadata.apps.nsidc.org",
    "nsidc.org",
    "seaice.uni-bremen.de",
    "geos.polarview.aq",
  ];

  const target = new URL(url);
  if (!allowedHosts.includes(target.host)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  const upstream = await fetch(url, {
    redirect: "follow",
    headers: {
      // 일부 데이터 서버는 UA 없으면 차단함
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!upstream.ok) {
    return new NextResponse(
      `Upstream error: ${upstream.status} ${upstream.statusText}`,
      { status: upstream.status }
    );
  }

  const buf = await upstream.arrayBuffer();
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
