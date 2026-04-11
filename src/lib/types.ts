export interface MediaItem {
  id: string;
  name: string;
  label?: string;
  url: string;
  type: "image" | "video";
  source: "local" | "url" | "drive";
  duration: number;
  order: number;
  categories?: string[]; // array of category IDs
  advertiserId?: string; // linked advertiser
}

export interface AppSettings {
  city: string;
  cities: string[];
  weatherApiKey: string;
  newsApiKey: string;
  driveFolderId: string;
  password: string;
}

export interface Driver {
  id: string;
  name: string;
  login: string;
  password: string;
  vehicle: string;
  vehiclePhoto?: string;
  vin: string;
  categoryId: string;
}

export interface VehicleCategory {
  id: string;
  name: string;
  description: string;
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

export interface Advertiser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  contractStart: string; // ISO date
  contractEnd: string;   // ISO date
  autoRenew: boolean;
}

export type SyncStatus = "online" | "saving" | "error";
