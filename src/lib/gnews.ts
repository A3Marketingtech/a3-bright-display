import type { NewsItem } from "@/lib/types";

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

function buildGNewsUrl(apiKey: string, max: number) {
  const params = new URLSearchParams({
    lang: "en",
    country: "us",
    max: String(max),
    apikey: apiKey,
  });

  return `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
}

export async function fetchTopHeadlines(apiKey: string, max = 10): Promise<NewsItem[]> {
  if (!apiKey) return [];

  const targetUrl = buildGNewsUrl(apiKey, max);

  for (const proxyFn of CORS_PROXIES) {
    try {
      const response = await fetch(proxyFn(targetUrl));
      if (!response.ok) continue;

      const data = await response.json();
      const articles = Array.isArray(data?.articles) ? data.articles : [];

      return articles.map((article: any) => ({
        title: article.title,
        source: article.source?.name ?? "Unknown",
        publishedAt: article.publishedAt,
      }));
    } catch {
      continue;
    }
  }

  throw new Error("All CORS proxies failed for GNews API");
}
