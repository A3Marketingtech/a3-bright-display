import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaItem } from "@/lib/types";
import { getMediaPlaybackUrls } from "@/lib/media";

interface MediaCarouselProps {
  items: MediaItem[];
}

function getGoogleDriveEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    const hosts = ["drive.google.com", "www.drive.google.com", "docs.google.com"];
    if (!hosts.includes(url.hostname)) return null;

    const paramId = url.searchParams.get("id");
    if (paramId) return `https://drive.google.com/file/d/${paramId}/preview`;

    const match = url.pathname.match(/\/file\/d\/([^/]+)/) || url.pathname.match(/\/d\/([^/]+)/);
    if (match?.[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;

    return null;
  } catch {
    return null;
  }
}

export function MediaCarousel({ items }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoSourceIndex, setVideoSourceIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setCurrent(0);
    } else if (current >= items.length) {
      setCurrent(items.length - 1);
    }
  }, [items.length, current]);

  const safeIndex = items.length > 0 ? Math.min(current, items.length - 1) : 0;
  const currentItem = items[safeIndex];

  const driveEmbedUrl = currentItem?.type === "video" ? getGoogleDriveEmbedUrl(currentItem.url) : null;
  const isDriveVideo = currentItem?.type === "video" && !!driveEmbedUrl;

  const videoSources = currentItem?.type === "video" && !isDriveVideo ? getMediaPlaybackUrls(currentItem.url, "video") : [];
  const currentVideoUrl = videoSources[Math.min(videoSourceIndex, Math.max(videoSources.length - 1, 0))];

  useEffect(() => {
    setVideoSourceIndex(0);
  }, [currentItem?.id, currentItem?.url]);

  const goToNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrent((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, [items.length]);

  // Auto-advance for images and Drive videos (iframe has no ended event)
  useEffect(() => {
    if (!currentItem) return;
    if (currentItem.type === "video" && !isDriveVideo) return;

    const duration = (currentItem.duration || (isDriveVideo ? 30 : 10)) * 1000;
    const step = 50;

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + (step / duration) * 100, 100));
    }, step);

    if (items.length > 1) {
      timerRef.current = setTimeout(goToNext, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, currentItem, goToNext, isDriveVideo, items.length]);

  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoSourceIndex((prev) => (prev < videoSources.length - 1 ? prev + 1 : prev));
  }, [videoSources.length]);

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full bg-card rounded-xl border border-border">
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-muted-foreground mb-2">
            A<sup className="text-neon">3</sup> Marketing Display
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione mídias pelo painel de gestão
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden bg-card border border-border">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {currentItem.type === "image" ? (
            <img
              src={currentItem.url}
              alt={currentItem.name}
              className="w-full h-full object-cover"
            />
          ) : isDriveVideo ? (
            <iframe
              src={`${driveEmbedUrl}?autoplay=1&loop=1&controls=0&modestbranding=1`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ pointerEvents: "none" }}
            />
          ) : (
            <video
              ref={videoRef}
              key={`${currentItem.id}-${videoSourceIndex}`}
              src={currentVideoUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              loop={items.length === 1}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              onTimeUpdate={handleVideoTimeUpdate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {currentItem.label && (
        <div className="absolute bottom-14 left-4 bg-background/70 backdrop-blur-sm rounded-md px-3 py-1">
          <span className="text-xs font-body text-foreground/80">{currentItem.label}</span>
        </div>
      )}

      <div className="absolute bottom-8 left-4 right-4 h-1 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i);
              setProgress(0);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? "bg-neon w-5" : "bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}