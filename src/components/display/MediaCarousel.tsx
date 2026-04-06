import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaItem } from "@/lib/types";

interface MediaCarouselProps {
  items: MediaItem[];
}

export function MediaCarousel({ items }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = items[current];

  const goToNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrent((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, [items.length]);

  // Auto-advance for images
  useEffect(() => {
    if (!currentItem || currentItem.type === "video") return;

    const duration = (currentItem.duration || 10) * 1000;
    const step = 50;

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + (step / duration) * 100, 100));
    }, step);

    timerRef.current = setTimeout(goToNext, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, currentItem, goToNext]);

  // Video ended handler
  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Video progress
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

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
          ) : (
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              onTimeUpdate={handleVideoTimeUpdate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Media label */}
      <div className="absolute bottom-14 left-4 bg-background/70 backdrop-blur-sm rounded-md px-3 py-1">
        <span className="text-xs font-body text-foreground/80">{currentItem.name}</span>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-4 right-4 h-1 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>

      {/* Navigation dots */}
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
