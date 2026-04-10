import { useState, useEffect } from "react";
import type { WeatherData } from "@/lib/types";

interface WeatherWidgetProps {
  weatherList: WeatherData[];
}

export function WeatherWidget({ weatherList }: WeatherWidgetProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(function () {
    if (weatherList.length <= 1) return;
    var interval = setInterval(function () {
      setVisible(false);
      setTimeout(function () {
        setIndex(function (i) { return (i + 1) % weatherList.length; });
        setVisible(true);
      }, 200);
    }, 5000);
    return function () { clearInterval(interval); };
  }, [weatherList.length]);

  if (!weatherList.length) return null;

  var weather = weatherList[index % weatherList.length];

  return (
    <div className="flex items-center gap-[0.5vw] bg-card/80 backdrop-blur-sm rounded-full px-[1vw] py-[0.4vh] border border-border overflow-hidden min-w-[clamp(200px,16vw,300px)] leading-none">
      <div
        className="flex items-center gap-[0.5vw] leading-none"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        <span className="text-[clamp(0.9rem,1.1vw,1.5rem)]">{weather.icon}</span>
        <span className="text-[clamp(0.7rem,0.9vw,1.05rem)] font-display font-bold">{weather.temp}°C</span>
        <span className="text-[clamp(0.65rem,0.85vw,1rem)] text-muted-foreground">{weather.city}</span>
        <span className="text-[clamp(0.65rem,0.85vw,1rem)] text-muted-foreground">•</span>
        <span className="text-[clamp(0.65rem,0.85vw,1rem)] text-muted-foreground capitalize">{weather.description}</span>
      </div>
    </div>
  );
}
