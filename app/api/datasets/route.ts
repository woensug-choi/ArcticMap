import { NextResponse } from "next/server";
import { dataset } from "@/lib/datasets";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(dataset);
}
