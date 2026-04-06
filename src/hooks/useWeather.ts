import { useState, useEffect } from "react";
import type { WeatherData } from "@/lib/types";

const WEATHER_EMOJIS: Record<string, string> = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
  "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

export function useWeather(city: string, apiKey: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!city || !apiKey) return;

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=pt_br&appid=${apiKey}`
        );
        const data = await res.json();
        if (data.main) {
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: WEATHER_EMOJIS[data.weather[0].icon] || "🌤️",
            city: data.name,
          });
        }
      } catch (e) {
        console.error("Weather fetch error:", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 min
    return () => clearInterval(interval);
  }, [city, apiKey]);

  return weather;
}
