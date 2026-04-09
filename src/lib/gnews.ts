import type { NewsItem } from "@/lib/types";

const CORS_PROXIES = [
  (url: string) => url,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
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

function normalizeGNewsError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("request limit") || lower.includes("next reset")) {
    return "Limite diário da API de notícias atingido";
  }

  if (lower.includes("api key") || lower.includes("apikey")) {
    return "API de notícias inválida ou não configurada";
  }

  return message;
}

function extractErrorMessage(data: any) {
  if (Array.isArray(data?.errors) && typeof data.errors[0] === "string") {
    return normalizeGNewsError(data.errors[0]);
  }

  if (typeof data?.message === "string" && data.message) {
    return normalizeGNewsError(data.message);
  }

  return null;
}

export async function fetchTopHeadlines(apiKey: string, max = 10): Promise<NewsItem[]> {
  if (!apiKey) return [];

  const targetUrl = buildGNewsUrl(apiKey, max);
  let lastError: Error | null = null;

  for (const proxyFn of CORS_PROXIES) {
    try {
      const response = await fetch(proxyFn(targetUrl));
      const data = await response.json();
      const apiError = extractErrorMessage(data);

      if (apiError) {
        throw new Error(apiError);
      }

      if (!response.ok) {
        lastError = new Error("Falha ao acessar a API de notícias");
        continue;
      }

      const articles = Array.isArray(data?.articles) ? data.articles : [];

      return articles.map((article: any) => ({
        title: article.title,
        source: article.source?.name ?? "Unknown",
        publishedAt: article.publishedAt,
      }));
    } catch (error) {
      if (error instanceof Error && (
        error.message === "Limite diário da API de notícias atingido" ||
        error.message === "API de notícias inválida ou não configurada"
      )) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error("Falha ao acessar a API de notícias");
    }
  }

  throw lastError ?? new Error("Falha ao acessar a API de notícias");
}
