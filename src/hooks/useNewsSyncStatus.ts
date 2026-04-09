import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsSyncStatus {
  lastFetchAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  todayRequestCount: number;
  cachedArticleCount: number;
  loading: boolean;
}

export function useNewsSyncStatus() {
  const [status, setStatus] = useState<NewsSyncStatus>({
    lastFetchAt: null,
    lastStatus: null,
    lastError: null,
    todayRequestCount: 0,
    cachedArticleCount: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      // Last fetch log entry
      const { data: lastLog } = await supabase
        .from("news_fetch_log")
        .select("fetched_at, status, error_message")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();

      // Today's request count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("news_fetch_log")
        .select("id", { count: "exact", head: true })
        .gte("fetched_at", todayStart.toISOString());

      // Cached article count
      const { count: articleCount } = await supabase
        .from("news_cache")
        .select("id", { count: "exact", head: true });

      setStatus({
        lastFetchAt: lastLog?.fetched_at ?? null,
        lastStatus: lastLog?.status ?? null,
        lastError: lastLog?.error_message ?? null,
        todayRequestCount: todayCount ?? 0,
        cachedArticleCount: articleCount ?? 0,
        loading: false,
      });
    } catch {
      setStatus((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...status, refresh };
}
