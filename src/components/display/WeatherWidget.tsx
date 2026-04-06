import type { WeatherData } from "@/lib/types";

interface WeatherWidgetProps {
  weather: WeatherData | null;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-1.5 border border-border">
      <span className="text-lg">{weather.icon}</span>
      <span className="text-sm font-display font-bold">{weather.temp}°C</span>
      <span className="text-xs text-muted-foreground capitalize">{weather.description}</span>
      <span className="text-xs text-muted-foreground">•</span>
      <span className="text-xs text-muted-foreground">{weather.city}</span>
    </div>
  );
}
