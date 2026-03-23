import { NextResponse } from "next/server";
import { trendData } from "@/lib/trend-data";
import { getStoredTrends } from "@/lib/trend-storage";

export async function GET() {
  const stored = await getStoredTrends();
  return NextResponse.json({
    updatedAt: stored.updatedAt || new Date().toISOString(),
    platforms: stored.platforms || trendData,
  });
}
