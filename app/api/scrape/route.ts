import { NextResponse } from "next/server";
import { scrapePlatformTrend } from "@/lib/scraper";
import { updateStoredPlatform } from "@/lib/trend-storage";

const validPlatforms = ["douyin", "xiaohongshu", "instagram", "tiktok"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") as "douyin" | "xiaohongshu" | "instagram" | "tiktok";
  const keyword = searchParams.get("keyword") || "热榜";

  if (!platform || !validPlatforms.includes(platform)) {
    return NextResponse.json({ error: "platform must be one of douyin,xiaohongshu,instagram,tiktok" }, { status: 400 });
  }

  try {
    const data = await scrapePlatformTrend(platform, keyword);
    return NextResponse.json({ platform, keyword, data, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "scrape failed", detail: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const platform = body.platform as "douyin" | "xiaohongshu" | "instagram" | "tiktok";
  const keyword = body.keyword || "热榜";

  if (!platform || !validPlatforms.includes(platform)) {
    return NextResponse.json({ error: "platform must be one of douyin,xiaohongshu,instagram,tiktok" }, { status: 400 });
  }

  try {
    const data = await scrapePlatformTrend(platform, keyword);
    const updated = await updateStoredPlatform(platform, {
      id: platform,
      name: platform === "douyin" ? "抖音" : platform === "xiaohongshu" ? "小红书" : platform === "instagram" ? "Instagram" : "TikTok",
      hotSearch: [keyword],
      highLikeVideos: data,
    });

    return NextResponse.json({ platform, keyword, data, updated, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "scrape failed", detail: (error as Error).message }, { status: 500 });
  }
}
