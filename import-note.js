const MAX_PAGE_BYTES = 8 * 1024 * 1024;
const MAX_ASSET_BYTES = 8 * 1024 * 1024;
const MAX_ASSETS = 14;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function normalizeImageUrl(rawUrl, baseUrl) {
  if (!rawUrl) return null;
  let url = rawUrl
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .trim()
    .replace(/^["']|["']$/g, "");

  try {
    url = decodeURIComponent(url);
  } catch {
    // Keep the original URL if it contains non-encoded percent fragments.
  }

  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("/")) url = new URL(url, baseUrl).toString();
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

function extractMediaUrls(html, baseUrl) {
  const candidates = [];
  const metaPatterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|image)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|image)["']/gi,
  ];

  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) candidates.push(match[1]);
  }

  for (const match of html.matchAll(/https?:\\?\/\\?\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"'\s<>]*)?/gi)) {
    candidates.push(match[0]);
  }

  for (const match of html.matchAll(/(?:src|data-src)=["']([^"']+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/gi)) {
    candidates.push(match[1]);
  }

  const seen = new Set();
  const blocked = ["avatar", "icon", "logo", "emoji", "sprite", "favicon"];
  const result = [];

  for (const raw of candidates) {
    const url = normalizeImageUrl(raw, baseUrl);
    if (!url) continue;
    const lower = url.toLowerCase();
    if (blocked.some((word) => lower.includes(word))) continue;
    const key = lower.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(url);
    if (result.length >= MAX_ASSETS) break;
  }

  return result;
}

function extensionFor(contentType, url) {
  const pathname = new URL(url).pathname.toLowerCase();
  const ext = pathname.match(/\.(jpg|jpeg|png|webp|gif)$/)?.[0];
  if (ext) return ext;
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

async function fetchLimited(url, limitBytes) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) throw new Error(`请求失败：${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > limitBytes) throw new Error("内容过大，已停止导入");

  return {
    buffer,
    contentType: response.headers.get("content-type") || "",
    url: response.url,
  };
}

export async function OPTIONS() {
  return json({});
}

export async function POST(request) {
  try {
    const body = await request.json();
    const noteUrl = String(body.url || "").trim();
    if (!/^https?:\/\//i.test(noteUrl)) {
      return json({ error: "请输入有效的小红书笔记链接" }, 422);
    }

    const page = await fetchLimited(noteUrl, MAX_PAGE_BYTES);
    const mediaUrls = extractMediaUrls(page.buffer.toString("utf8"), page.url);
    if (!mediaUrls.length) {
      return json({ error: "没有提取到图片或 GIF。可能需要登录、被风控，或页面只在 App 内完整展示。" }, 422);
    }

    const assets = [];
    for (const [index, mediaUrl] of mediaUrls.entries()) {
      try {
        const media = await fetchLimited(mediaUrl, MAX_ASSET_BYTES);
        if (!media.contentType.startsWith("image/")) continue;
        const base64 = media.buffer.toString("base64");
        const type = media.contentType.split(";")[0] || "image/jpeg";
        const ext = extensionFor(type, media.url);
        assets.push({
          name: `note-${String(index + 1).padStart(2, "0")}${ext}`,
          url: `data:${type};base64,${base64}`,
          sourceUrl: media.url,
          type,
        });
      } catch {
        // Skip blocked or oversized images and keep importing the rest.
      }
    }

    if (!assets.length) {
      return json({ error: "找到了图片地址，但下载失败。可能是防盗链或需要登录 Cookie。" }, 422);
    }

    return json({ assets, sourceUrl: page.url });
  } catch (error) {
    return json({ error: error.message || "链接识别失败" }, 422);
  }
}
