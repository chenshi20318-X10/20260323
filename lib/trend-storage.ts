import fs from "fs/promises";
import path from "path";
import { trendData, PlatformTrend } from "@/lib/trend-data";

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "trend-store.json");

export async function ensureStoreFile() {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
    await fs.stat(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify({ platforms: trendData, updatedAt: new Date().toISOString() }, null, 2));
  }
}

export async function getStoredTrends() {
  await ensureStoreFile();
  try {
    const text = await fs.readFile(STORE_FILE, "utf8");
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    console.error("getStoredTrends error", error);
    return { platforms: trendData, updatedAt: new Date().toISOString() };
  }
}

export async function updateStoredPlatform(platformId: PlatformTrend["id"], items: PlatformTrend) {
  await ensureStoreFile();
  const data = await getStoredTrends();
  const platforms: PlatformTrend[] = data.platforms || trendData;
  const idx = platforms.findIndex((p) => p.id === platformId);
  if (idx === -1) {
    platforms.push(items);
  } else {
    platforms[idx] = items;
  }
  const payload = { platforms, updatedAt: new Date().toISOString() };
  await fs.writeFile(STORE_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
