import { useState, useEffect } from "react";
import type { NewsItem } from "@/lib/types";
import { fetchTopHeadlines } from "@/lib/gnews";

export function useNews(apiKey: string) {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!apiKey) {
      setNews([]);
      return;
    }

    const fetchNews = async () => {
      try {
        const articles = await fetchTopHeadlines(apiKey, 10);
        setNews(articles);
      } catch (e) {
        console.error("News fetch error:", e);
        setNews([]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // 5 min
    return () => clearInterval(interval);
  }, [apiKey]);

  return news;
}

