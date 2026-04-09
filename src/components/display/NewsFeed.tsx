import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "@/lib/types";

function timeAgo(dateStr: string): string {
  var diff = Date.now() - new Date(dateStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return mins + "min atrás";
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h atrás";
  return Math.floor(hours / 24) + "d atrás";
}

interface NewsFeedProps {
  news: NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  var containerRef = useRef<HTMLDivElement>(null);
  var [scrollY, setScrollY] = useState(0);

  useEffect(function () {
    if (!news.length || !containerRef.current) return;

    var el = containerRef.current;
    var maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    // Slower scroll interval for TV performance
    var interval = setInterval(function () {
      setScrollY(function (prev) {
        var next = prev + 1;
        if (next >= maxScroll) return 0;
        return next;
      });
    }, 80);

    return function () { clearInterval(interval); };
  }, [news]);

  useEffect(function () {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  if (!news.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-[clamp(0.6rem,0.7vw,0.85rem)]">
        Configurar API de notícias
      </div>
    );
  }

  // Duplicate news for infinite scroll effect
  var allNews = news.concat(news);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden pr-1"
      style={{ scrollBehavior: "auto" }}
    >
      {allNews.map(function (item, i) {
        return (
          <div
            key={item.title + "-" + i}
            className="p-[0.8vw] bg-card rounded-lg border border-border"
            style={{ marginBottom: "0.8vh" }}
          >
            <p
              className="text-[clamp(0.6rem,0.72vw,0.85rem)] font-body leading-relaxed text-foreground/90"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.title}
            </p>
            <div className="flex items-center justify-between" style={{ marginTop: "0.5vh" }}>
              <span
                className="text-[clamp(0.5rem,0.6vw,0.7rem)] text-neon font-display font-medium"
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}
              >
                {item.source}
              </span>
              <span className="text-[clamp(0.5rem,0.6vw,0.7rem)] text-muted-foreground">
                {timeAgo(item.publishedAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
