import Image from "next/image";
import Link from "next/link";
import { trendData } from "@/lib/trend-data";
import { TrendScrapePanel } from "@/components/TrendScrapePanel";

function bubble(tag: string) {
  return (
    <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
      #{tag}
    </span>
  );
}

function isWithin14Days(publishedAt?: string) {
  if (!publishedAt) return false;
  const then = new Date(publishedAt);
  if (isNaN(then.getTime())) return false;
  return Date.now() - then.getTime() <= 14 * 24 * 3600 * 1000;
}

function formatRelativeDay(publishedAt?: string) {
  if (!publishedAt) return "未知";
  const date = new Date(publishedAt);
  if (isNaN(date.getTime())) return "未知";
  const diff = Math.round((Date.now() - date.getTime()) / (24 * 3600 * 1000));
  return diff <= 0 ? "今天" : `${diff} 天前`;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white py-6 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">热点趋势洞察平台</h1>
            <p className="text-sm text-slate-500">覆盖抖音 / 小红书 / Instagram / TikTok 的高赞视频、热榜热搜</p>
          </div>
          <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" href="/api/trends">
            API 测试：获取趋势数据 JSON
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {trendData.map((platform) => (
            <section key={platform.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-800">{platform.name}</h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {platform.hotSearch.map((term) => bubble(term))}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-600">TOP 榜单（仅展示近 14 天）</h3>
              <ul className="space-y-2">
                {platform.highLikeVideos
                  .filter((video) => isWithin14Days(video.publishedAt))
                  .sort((a, b) => b.likes - a.likes)
                  .map((video, index) => (
                    <li
                      key={video.id}
                      className={`rounded-lg border p-3 ${
                        index === 0
                          ? "border-yellow-400 bg-yellow-50"
                          : index === 1
                          ? "border-slate-300 bg-slate-50"
                          : index === 2
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold">{index + 1} 名</span>
                        <span>{formatRelativeDay(video.publishedAt)}</span>
                      </div>

                      {video.thumbnailUrl ? (
                        <a href={video.playUrl || video.url} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        </a>
                      ) : null}

                      <a href={video.playUrl || video.url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="mt-2 text-sm font-medium text-slate-900">{video.title}</div>
                        <div className="mt-1 text-xs text-slate-500">作者：{video.author}</div>
                      </a>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>👍 {video.likes.toLocaleString()}</span>
                        <span>💬 {video.comments.toLocaleString()}</span>
                        <span>🔁 {video.shares.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">{video.tags.map((t) => bubble(t))}</div>

                      <a
                        href={video.playUrl || video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        ▶️ 播放
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        <TrendScrapePanel />
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        数据示例为静态模版；可接入真实平台 API（或爬取/合作接口）实现自动更新
      </footer>
    </div>
  );
}

