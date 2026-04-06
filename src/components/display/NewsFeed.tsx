import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

interface NewsFeedProps {
  news: NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!news.length || !containerRef.current) return;

    const el = containerRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const interval = setInterval(() => {
      setScrollY((prev) => {
        const next = prev + 1;
        if (next >= maxScroll) return 0;
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [news]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  if (!news.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        Configurar API de notícias
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden space-y-3 pr-1"
      style={{ scrollBehavior: "auto" }}
    >
      {[...news, ...news].map((item, i) => (
        <div
          key={`${item.title}-${i}`}
          className="p-3 bg-card rounded-lg border border-border hover:border-neon/20 transition-colors"
        >
          <p className="text-xs font-body leading-relaxed line-clamp-3 text-foreground/90">
            {item.title}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-neon font-display font-medium truncate max-w-[60%]">
              {item.source}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(item.publishedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
