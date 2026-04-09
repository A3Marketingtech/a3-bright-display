import { useState, useEffect, useCallback, useRef } from "react";
import type { MediaItem } from "@/lib/types";
import { getMediaPlaybackUrls } from "@/lib/media";

interface MediaCarouselProps {
  items: MediaItem[];
}

function getGoogleDriveEmbedUrl(rawUrl: string): string | null {
  try {
    var url = new URL(rawUrl.trim());
    var hosts = ["drive.google.com", "www.drive.google.com", "docs.google.com"];
    if (hosts.indexOf(url.hostname) === -1) return null;

    var paramId = url.searchParams.get("id");
    if (paramId) return "https://drive.google.com/file/d/" + paramId + "/preview";

    var match = url.pathname.match(/\/file\/d\/([^/]+)/) || url.pathname.match(/\/d\/([^/]+)/);
    if (match && match[1]) return "https://drive.google.com/file/d/" + match[1] + "/preview";

    return null;
  } catch (e) {
    return null;
  }
}

export function MediaCarousel({ items }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoSourceIndex, setVideoSourceIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(function () {
    if (items.length === 0) {
      setCurrent(0);
    } else if (current >= items.length) {
      setCurrent(items.length - 1);
    }
  }, [items.length, current]);

  var safeIndex = items.length > 0 ? Math.min(current, items.length - 1) : 0;
  var currentItem = items[safeIndex];

  var driveEmbedUrl = currentItem && currentItem.type === "video" ? getGoogleDriveEmbedUrl(currentItem.url) : null;
  var isDriveVideo = currentItem && currentItem.type === "video" && !!driveEmbedUrl;

  var videoSources = currentItem && currentItem.type === "video" && !isDriveVideo ? getMediaPlaybackUrls(currentItem.url, "video") : [];
  var currentVideoUrl = videoSources[Math.min(videoSourceIndex, Math.max(videoSources.length - 1, 0))];

  useEffect(function () {
    setVideoSourceIndex(0);
  }, [currentItem?.id, currentItem?.url]);

  var goToNext = useCallback(function () {
    if (items.length <= 1) return;
    // Simple fade transition without framer-motion
    setVisible(false);
    setTimeout(function () {
      setCurrent(function (prev) { return (prev + 1) % items.length; });
      setProgress(0);
      setVisible(true);
    }, 300);
  }, [items.length]);

  useEffect(function () {
    if (!currentItem) return;
    if (currentItem.type === "video" && !isDriveVideo) return;

    var duration = (currentItem.duration || (isDriveVideo ? 30 : 10)) * 1000;
    var step = 100; // Less frequent updates for TV performance

    progressRef.current = setInterval(function () {
      setProgress(function (prev) { return Math.min(prev + (step / duration) * 100, 100); });
    }, step);

    if (items.length > 1) {
      timerRef.current = setTimeout(goToNext, duration);
    }

    return function () {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, currentItem, goToNext, isDriveVideo, items.length]);

  var handleVideoEnd = useCallback(function () {
    goToNext();
  }, [goToNext]);

  var handleVideoTimeUpdate = useCallback(function () {
    var video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

  var handleVideoError = useCallback(function () {
    setVideoSourceIndex(function (prev) { return prev < videoSources.length - 1 ? prev + 1 : prev; });
  }, [videoSources.length]);

  if (!items.length) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "#000" }}>
        <div className="text-center">
          <p className="text-[clamp(1rem,2vw,2rem)] font-display font-bold text-muted-foreground mb-[0.5vh]">
            A<sup className="text-neon">3</sup> Marketing Display
          </p>
          <p className="text-[clamp(0.65rem,0.8vw,1rem)] text-muted-foreground">
            Adicione mídias pelo painel de gestão
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: "#000" }}>
      {/* Simple CSS opacity transition instead of framer-motion AnimatePresence */}
      <div
        key={currentItem.id}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          willChange: "opacity",
        }}
      >
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={currentItem.name}
            className="h-full w-full"
            style={{ objectFit: "contain", objectPosition: "center" }}
          />
        ) : isDriveVideo ? (
          <div className="flex h-full w-full items-center justify-center">
            <iframe
              src={driveEmbedUrl + "?autoplay=1&loop=1&controls=0&modestbranding=1"}
              className="h-full w-full"
              style={{ border: "none", pointerEvents: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            key={currentItem.id + "-" + videoSourceIndex}
            src={currentVideoUrl}
            className="h-full w-full"
            style={{ objectFit: "contain", objectPosition: "center" }}
            autoPlay
            muted
            playsInline
            loop={items.length === 1}
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            onTimeUpdate={handleVideoTimeUpdate}
          />
        )}
      </div>

      {currentItem.label && (
        <div
          className="absolute rounded-md"
          style={{
            bottom: "4vh",
            left: "1vw",
            backgroundColor: "rgba(10,10,10,0.7)",
            padding: "0.3vh 0.8vw",
          }}
        >
          <span className="text-[clamp(0.55rem,0.7vw,0.85rem)] font-body" style={{ color: "rgba(255,255,255,0.8)" }}>
            {currentItem.label}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          bottom: "2.5vh",
          left: "1vw",
          right: "1vw",
          height: "clamp(2px, 0.3vh, 4px)",
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="h-full rounded-full bg-neon"
          style={{ width: progress + "%", transition: "width 0.1s linear" }}
        />
      </div>

      {/* Dot indicators */}
      <div className="absolute flex" style={{ bottom: "0.8vh", left: "50%", transform: "translateX(-50%)", gap: "0.4vw" }}>
        {items.map(function (_, i) {
          return (
            <button
              key={i}
              onClick={function () { setCurrent(i); setProgress(0); }}
              className="rounded-full"
              style={{
                height: "clamp(4px, 0.5vh, 6px)",
                width: i === current ? "clamp(16px, 1.5vw, 24px)" : "clamp(6px, 0.5vw, 8px)",
                backgroundColor: i === current ? "hsl(96, 52%, 50%)" : "rgba(255,255,255,0.3)",
                transition: "all 0.2s ease",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
