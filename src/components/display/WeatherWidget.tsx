import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WeatherData } from "@/lib/types";

interface WeatherWidgetProps {
  weatherList: WeatherData[];
}

export function WeatherWidget({ weatherList }: WeatherWidgetProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (weatherList.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % weatherList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [weatherList.length]);

  if (!weatherList.length) return null;

  const weather = weatherList[index];

  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-1.5 border border-border overflow-hidden min-w-[200px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={weather.city}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">{weather.icon}</span>
          <span className="text-sm font-display font-bold">{weather.temp}°C</span>
          <span className="text-xs text-muted-foreground capitalize">{weather.description}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{weather.city}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
