import { useState, useEffect } from "react";
import type { NewsItem } from "@/lib/types";
import { fetchTopHeadlines } from "@/lib/gnews";

interface UseNewsResult {
  news: NewsItem[];
  error: string | null;
}

export function useNews(apiKey: string): UseNewsResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setNews([]);
      setError("Configurar API de notícias");
      return;
    }

    let active = true;

    const fetchNews = async () => {
      try {
        const articles = await fetchTopHeadlines(apiKey, 10);
        if (!active) return;

        setNews(articles);
        setError(articles.length ? null : "Sem artigos disponíveis");
      } catch (e) {
        if (!active) return;

        setNews([]);
        setError(e instanceof Error ? e.message : "Falha ao carregar notícias");
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [apiKey]);

  return { news, error };
}
