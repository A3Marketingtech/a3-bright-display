import { useState, useEffect } from "react";
import type { NewsItem } from "@/lib/types";

export function useNews(apiKey: string) {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!apiKey) return;

    const fetchNews = async () => {
      try {
        const res = await fetch(
          `https://gnews.io/api/v4/top-headlines?lang=pt&country=br&max=10&apikey=${apiKey}`
        );
        const data = await res.json();
        if (data.articles) {
          setNews(
            data.articles.map((a: any) => ({
              title: a.title,
              source: a.source.name,
              publishedAt: a.publishedAt,
            }))
          );
        }
      } catch (e) {
        console.error("News fetch error:", e);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // 5 min
    return () => clearInterval(interval);
  }, [apiKey]);

  return news;
}
