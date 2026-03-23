import { chromium, Browser, Page } from "playwright";

export interface ScrapedVideo {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  url: string;
  playUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  publishedAt?: string;
}

function isWithinDays(date?: string, days = 14) {
  if (!date) return true;
  const then = new Date(date);
  if (isNaN(then.getTime())) return true;
  const diff = Date.now() - then.getTime();
  return diff >= 0 && diff <= days * 24 * 3600 * 1000;
}

function normalizePlatformUrl(platform: "douyin" | "xiaohongshu" | "instagram" | "tiktok", href: string) {
  if (!href) return href;
  let url = href.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//.test(url)) {
    if (url.startsWith("/")) {
      if (platform === "douyin") url = `https://www.douyin.com${url}`;
      if (platform === "xiaohongshu") url = `https://www.xiaohongshu.com${url}`;
      if (platform === "instagram") url = `https://www.instagram.com${url}`;
      if (platform === "tiktok") url = `https://www.tiktok.com${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  if (platform === "douyin") {
    const m = url.match(/(?:video\/)(\d+)/);
    if (m) url = `https://www.douyin.com/video/${m[1]}`;
  }

  if (platform === "xiaohongshu") {
    const m = url.match(/explore\/([^\/?#]+)/);
    const n = url.match(/note\/(\w+)/);
    if (n) {
      url = `https://www.xiaohongshu.com/note/${n[1]}`;
    } else if (m) {
      url = `https://www.xiaohongshu.com/explore/${m[1]}`;
    }
  }

  if (platform === "instagram") {
    const m = url.match(/(?:reel|p|tv)\/([^\/?#]+)/);
    if (m) url = `https://www.instagram.com/reel/${m[1]}/`;
  }

  if (platform === "tiktok") {
    const m = url.match(/(?:video\/)(\d+)/);
    if (m) url = `https://www.tiktok.com/video/${m[1]}`;
  }

  return url;
}

function extractVideoId(platform: "douyin" | "xiaohongshu" | "instagram" | "tiktok", url: string) {
  if (!url) return url;
  if (platform === "douyin") {
    const m = url.match(/video\/([0-9]+)/);
    return m ? m[1] : url;
  }
  if (platform === "xiaohongshu") {
    const m = url.match(/note\/([0-9a-zA-Z]+)/);
    return m ? m[1] : url;
  }
  if (platform === "instagram") {
    const m = url.match(/reel\/([^\/]+)/);
    return m ? m[1] : url;
  }
  if (platform === "tiktok") {
    const m = url.match(/video\/([0-9]+)/);
    return m ? m[1] : url;
  }
  return url;
}

export async function scrapePlatformTrend(platform: "douyin" | "xiaohongshu" | "instagram" | "tiktok", keyword = "热榜") {
  let targetUrl = "";
  switch (platform) {
    case "douyin":
      targetUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`;
      break;
    case "xiaohongshu":
      targetUrl = `https://www.xiaohongshu.com/search_result/${encodeURIComponent(keyword)}`;
      break;
    case "instagram":
      targetUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/`;
      break;
    case "tiktok":
      targetUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`;
      break;
  }

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    // 按平台区分 DOM 选择器，更接近真实结构。请按最新页面改动实时调整。
    const platformSelectors: Record<string, { item: string; title: string; author: string; likes: string; comments: string; shares: string; tags: string; link: string; thumbnail?: string; publish?: string; hostPrefix?: string }> = {
      douyin: {
        item: "div[class*='search-result-item']",
        title: "h3, .text, .video-title",
        author: ".user-name, .author",
        likes: ".like-count, .digg-count",
        comments: ".comment-count",
        shares: ".share-count",
        tags: ".tag",
        link: "a",
        thumbnail: "img, .cover-img",
        publish: ".publish-time, .create-time, time",
        hostPrefix: "https://www.douyin.com",
      },
      xiaohongshu: {
        item: "div.note-item",
        title: ".title, .note-title",
        author: ".name, .avatar-name",
        likes: ".like-count",
        comments: ".comment-count",
        shares: ".share-count",
        tags: ".tag-text",
        link: "a",
        thumbnail: "img, .cover-img",
        publish: ".note-time, time",
        hostPrefix: "https://www.xiaohongshu.com",
      },
      instagram: {
        item: "article, div._aabd",
        title: "h1, h2, span",
        author: "a[href*='/']",
        likes: "button span",
        comments: "ul li",
        shares: "",
        tags: "a[href*='#']",
        link: "a",
        thumbnail: "img",
        publish: "time",
        hostPrefix: "https://www.instagram.com",
      },
      tiktok: {
        item: "div.tiktok-1f2n97y-DivItemContainer",
        title: "h3, .video-feed-item__text",
        author: ".tiktok-1soki6-DivAuthorName",
        likes: ".video-count, .like-count",
        comments: ".comment-count",
        shares: ".share-count",
        tags: "a[href*='#'], .tag",
        link: "a",
        thumbnail: "img",
        publish: "time",
        hostPrefix: "https://www.tiktok.com",
      }
    };

    const sel = platformSelectors[platform];
    const items = await page.$$eval(sel.item, (nodes, context) => {
      return nodes
        .slice(0, 10)
        .map((node) => {
          const query = (s: string | undefined) => (s ? node.querySelector(s) : null);
          const text = (el: Element | null) => el?.textContent?.trim() || "未知";

          const title = text(query(context.title));
          const author = text(query(context.author));
          const likes = Number((query(context.likes) as HTMLElement)?.innerText.replace(/\D/g, "") || 0);
          const comments = Number((query(context.comments) as HTMLElement)?.innerText.replace(/\D/g, "") || 0);
          const shares = context.shares ? Number((query(context.shares) as HTMLElement)?.innerText.replace(/\D/g, "") || 0) : 0;
          let href = (query(context.link) as HTMLAnchorElement)?.href || window.location.href;
          const publishedText = text(query(context.publish) || query("time") || query(".time"));

          if (context.fixHttps && /^\/\//.test(href)) href = "https:" + href;
          if (context.hostPrefix && href.startsWith("/")) href = context.hostPrefix + href;

          const publishedAt = publishedText ? new Date(publishedText).toISOString() : undefined;

          const thumbEl = query(context.thumbnail || "img");
          const thumb = (thumbEl as HTMLImageElement)?.src || (thumbEl as HTMLImageElement)?.getAttribute("data-src") || "";
          const resolvedThumb = thumb && !/^https?:/.test(thumb) ? (context.hostPrefix || "") + thumb : thumb;
          const linkUrl = href;

          return {
            id: href,
            title,
            author,
            likes,
            comments,
            shares,
            url: href,
            playUrl: linkUrl,
            thumbnailUrl: resolvedThumb,
            tags: context.tags
              ? Array.from(node.querySelectorAll(context.tags))
                  .map((el) => el.textContent?.trim() || "")
                  .filter((t) => t)
              : [],
            publishedAt,
          };
        })
        .filter((item) => item.title !== "未知");
    }, { ...sel, hostPrefix: sel.hostPrefix || "", fixHttps: platform === "douyin" || platform === "tiktok" });

    const normalizedItems = items.map((item) => {
      const normalizedUrl = normalizePlatformUrl(platform, item.url || item.id || "");
      const videoId = extractVideoId(platform, normalizedUrl);
      return {
        ...item,
        id: videoId || item.id,
        url: normalizedUrl,
      };
    });

    const recent = normalizedItems
      .map((item) => ({ ...item, publishedAt: item.publishedAt ? item.publishedAt : new Date().toISOString() }))
      .filter((item) => isWithinDays(item.publishedAt, 14))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    return recent as ScrapedVideo[];
  } catch (err) {
    console.error("scrapePlatformTrend error", err);
    throw err;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}
