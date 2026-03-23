"use client";

import { useState } from "react";

type Platform = "douyin" | "xiaohongshu" | "instagram" | "tiktok";

export function TrendScrapePanel() {
  const [platform, setPlatform] = useState<Platform>("douyin");
  const [keyword, setKeyword] = useState("热榜");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function runScrape(persist: boolean) {
    setStatus("运行中...");
    setResult(null);

    try {
      const method = persist ? "POST" : "GET";
      const url = persist
        ? "/api/scrape"
        : `/api/scrape?platform=${encodeURIComponent(platform)}&keyword=${encodeURIComponent(keyword)}`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: persist ? JSON.stringify({ platform, keyword }) : undefined,
      });

      const json = await response.json();
      setResult(json);
      setStatus(`完成（persist=${persist}，status=${response.status}）`);
    } catch (e) {
      setStatus("请求失败，请查看控制台");
      console.error(e);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">实时爬虫 & 持久化</h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium">平台</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="rounded-md border px-2 py-1">
          <option value="douyin">抖音</option>
          <option value="xiaohongshu">小红书</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
        <label className="text-xs font-medium">关键词</label>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="rounded-md border px-2 py-1" />
      </div>
      <div className="mb-3 flex gap-2">
        <button onClick={() => runScrape(false)} className="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600">
          运行爬虫（不保存）
        </button>
        <button onClick={() => runScrape(true)} className="rounded bg-green-500 px-3 py-2 text-white hover:bg-green-600">
          运行并持久化
        </button>
      </div>
      <div className="mb-2 text-sm text-slate-600">状态：{status}</div>
      <pre className="max-h-56 overflow-auto rounded border bg-slate-50 p-2 text-xs">{result ? JSON.stringify(result, null, 2) : "暂无结果"}</pre>
    </section>
  );
}
