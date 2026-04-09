export interface MediaItem {
  id: string;
  name: string;
  label?: string; // user-defined display label
  url: string;
  type: "image" | "video";
  source: "local" | "url" | "drive";
  duration: number; // seconds, for images only
  order: number;
}

export interface AppSettings {
  city: string;
  cities: string[];
  weatherApiKey: string;
  newsApiKey: string;
  driveFolderId: string;
  password: string;
}

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
}

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
}

export type SyncStatus = "online" | "saving" | "error";
