import type { NewsItem } from "@/lib/types";

const GNEWS_BASE_URL = "https://gnews.io/api/v4/top-headlines?lang=pt&country=br";
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";

function buildGNewsUrl(apiKey: string, max: number) {
  const params = new URLSearchParams({
    lang: "pt",
    country: "br",
    max: String(max),
    apikey: apiKey,
  });

  return `${GNEWS_BASE_URL}&${params.toString()}`;
}

export async function fetchTopHeadlines(apiKey: string, max = 10): Promise<NewsItem[]> {
  if (!apiKey) return [];

  const targetUrl = buildGNewsUrl(apiKey, max);
  const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(targetUrl)}`);

  if (!response.ok) {
    throw new Error(`GNews request failed with status ${response.status}`);
  }

  const data = await response.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];

  return articles.map((article: any) => ({
    title: article.title,
    source: article.source?.name ?? "Desconhecido",
    publishedAt: article.publishedAt,
  }));
}
