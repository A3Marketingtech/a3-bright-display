import { useState, useEffect, useRef } from "react";
import type { WeatherData } from "@/lib/types";

const WEATHER_EMOJIS: Record<string, string> = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
  "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

export function useWeather(cities: string[], apiKey: string) {
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const citiesKey = cities.join(",");

  useEffect(() => {
    if (!cities.length || !apiKey) return;

    const fetchAll = async () => {
      const results: WeatherData[] = [];
      for (const city of cities) {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=en&appid=${apiKey}`
          );
          const data = await res.json();
          if (data.main) {
            results.push({
              temp: Math.round(data.main.temp),
              description: data.weather[0].description,
              icon: WEATHER_EMOJIS[data.weather[0].icon] || "🌤️",
              city: data.name,
            });
          }
        } catch (e) {
          console.error(`Weather fetch error for ${city}:`, e);
        }
      }
      setWeatherList(results);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 600000);
    return () => clearInterval(interval);
  }, [citiesKey, apiKey]);

  return weatherList;
}
