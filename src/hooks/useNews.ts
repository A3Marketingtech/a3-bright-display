import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface UseNewsResult {
  news: NewsItem[];
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
}

export function useNews(): UseNewsResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFromCache = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("news_cache")
        .select("title, source, published_at")
        .order("published_at", { ascending: false })
        .limit(20);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        setNews([]);
        setError("As notícias estão temporariamente indisponíveis. Tente novamente mais tarde.");
      } else {
        setNews(
          data.map((row) => ({
            title: row.title,
            source: row.source,
            publishedAt: row.published_at ?? new Date().toISOString(),
          }))
        );
        setError(null);
        setLastUpdated(new Date());
      }
    } catch {
      // Keep existing news on error, only show message if empty
      if (news.length === 0) {
        setError("As notícias estão temporariamente indisponíveis. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromCache();
    const interval = setInterval(fetchFromCache, 60000); // refresh from cache every minute
    return () => clearInterval(interval);
  }, [fetchFromCache]);

  return { news, error, loading, lastUpdated };
}
