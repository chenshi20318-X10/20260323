export interface VideoItem {
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
  score?: number;
}

export interface PlatformTrend {
  id: "douyin" | "xiaohongshu" | "instagram" | "tiktok";
  name: string;
  hotSearch: string[];
  highLikeVideos: VideoItem[];
}

export const trendData: PlatformTrend[] = [
  {
    id: "douyin",
    name: "抖音",
    hotSearch: ["#追光者", "#健身挑战", "#甜品制作"],
    highLikeVideos: [
      {
        id: "dy1",
        title: "5分钟打造夏日清爽甜品",
        author: "小厨房达人",
        likes: 192345,
        comments: 4180,
        shares: 3020,
        url: "https://www.douyin.com/video/1",
        playUrl: "https://www.douyin.com/video/1",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=抖音+1",
        tags: ["美食", "夏日", "甜品"],
        publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "dy2",
        title: "一周高效身材计划（不饿肚子版）",
        author: "健身狂人",
        likes: 173900,
        comments: 6150,
        shares: 4980,
        url: "https://www.douyin.com/video/2",
        playUrl: "https://www.douyin.com/video/2",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=抖音+2",
        tags: ["健身", "生活方式", "塑形"],
        publishedAt: new Date(Date.now() - 16 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    hotSearch: ["#旅行攻略", "#穿搭技巧", "#护肤心得"],
    highLikeVideos: [
      {
        id: "xhs1",
        title: "北欧小众民宿&咖啡店清单",
        author: "旅行笔记",
        likes: 134210,
        comments: 2217,
        shares: 1723,
        url: "https://www.xiaohongshu.com/video/1",
        playUrl: "https://www.xiaohongshu.com/video/1",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=小红书+1",
        tags: ["旅行", "生活方式", "日常"],
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "xhs2",
        title: "4套春季通勤穿搭推荐",
        author: "时尚小姐",
        likes: 159876,
        comments: 4320,
        shares: 2810,
        url: "https://www.xiaohongshu.com/video/2",
        playUrl: "https://www.xiaohongshu.com/video/2",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=小红书+2",
        tags: ["穿搭", "职场", "时尚"],
        publishedAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    hotSearch: ["#wellness", "#travelgram", "#foodie"],
    highLikeVideos: [
      {
        id: "ig1",
        title: "Day in the life: NYC café owner",
        author: "jane_doe",
        likes: 225000,
        comments: 10850,
        shares: 4700,
        url: "https://www.instagram.com/reel/1",
        playUrl: "https://www.instagram.com/reel/1",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=IG+1",
        tags: ["travel", "coffee", "entrepreneur"],
        publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "ig2",
        title: "5 HIIT moves for busy mornings",
        author: "fitwithsam",
        likes: 138900,
        comments: 9450,
        shares: 5200,
        url: "https://www.instagram.com/reel/2",
        playUrl: "https://www.instagram.com/reel/2",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=IG+2",
        tags: ["fitness", "wellness", "quickworkout"],
        publishedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    hotSearch: ["#DanceChallenge", "#Foodhacks", "#LifeHacks"],
    highLikeVideos: [
      {
        id: "tt1",
        title: "Super easy 2-ingredient dessert",
        author: "@chefemily",
        likes: 345500,
        comments: 22100,
        shares: 17000,
        url: "https://www.tiktok.com/@chefemily/video/1",
        playUrl: "https://www.tiktok.com/@chefemily/video/1",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=TikTok+1",
        tags: ["food", "easyrecipes", "viral"],
        publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "tt2",
        title: "30-second home office desk makeover",
        author: "@homeideas",
        likes: 237000,
        comments: 13000,
        shares: 8900,
        url: "https://www.tiktok.com/@homeideas/video/2",
        playUrl: "https://www.tiktok.com/@homeideas/video/2",
        thumbnailUrl: "https://via.placeholder.com/440x248.png?text=TikTok+2",
        tags: ["diy", "homeoffice", "decor"],
        publishedAt: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
];
