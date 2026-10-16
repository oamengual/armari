export type GarmentCategory =
  | "top"
  | "bottom"
  | "full_body"
  | "outerwear"
  | "shoes"
  | "accessory";

export interface Garment {
  id: string;
  user_id?: string;
  name: string;
  category: GarmentCategory;
  subcategory: string;
  color_primary: string;
  color_hex: string;
  colors_secondary: string[];
  pattern: string;
  fabric: string;
  seasons: string[];
  occasions: string[];
  warmth_level: number; // 1 (muy fresco) a 5 (abrigo intenso)
  brand?: string;
  price?: number;
  image_url: string;
  is_dirty: boolean;
  is_favorite: boolean;
  wear_count: number;
  last_worn_at?: string | null;
  notes?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  city: string;
  latitude: number;
  longitude: number;
  style_preferences: string[];
  favorite_colors: string[];
  avoid_colors: string[];
  min_days_between_wears: number;
}

export interface Outfit {
  id: string;
  user_id?: string;
  title: string;
  occasion: string;
  season: string;
  garment_ids: string[];
  stylist_note: string;
  weather_summary?: string;
  is_favorite: boolean;
  is_ai_generated: boolean;
  created_at: string;
}

export interface DayPlan {
  id: string;
  planned_date: string; // YYYY-MM-DD
  day_label?: string;
  occasion: string;
  user_note?: string;
  outfit_id?: string | null;
  garment_ids: string[];
  title: string;
  stylist_note: string;
  temp_min: number;
  temp_max: number;
  weather_condition: string;
  weather_code?: number;
  is_worn: boolean;
}

export interface DailyWeather {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  conditionText: string;
}

export interface TripDailyLook {
  day: number;
  date?: string;
  activity: string;
  title: string;
  garment_ids: string[];
  stylist_note: string;
}

export interface TripPlan {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  days_count: number;
  luggage_type: string;
  activities: string[];
  capsule_garment_ids: string[];
  checked_garment_ids: string[];
  daily_looks: TripDailyLook[];
  stylist_summary: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  top: "Parte Superior",
  bottom: "Parte Inferior",
  full_body: "Cuerpo Entero",
  outerwear: "Abrigos y Chaquetas",
  shoes: "Calzado",
  accessory: "Accesorios",
};

export const SUBCATEGORIES_BY_CATEGORY: Record<GarmentCategory, string[]> = {
  top: ["Camiseta", "Camisa", "Blusa", "Jersey", "Sudadera", "Top / Lencero", "Polo", "Cárdigan"],
  bottom: ["Vaquero / Jeans", "Pantalón de vestir", "Pantalón chino", "Falda midi", "Falda corta", "Pantalón corto / Bermudas", "Pantalón deportivo"],
  full_body: ["Vestido corto", "Vestido midi", "Vestido largo", "Mono / Jumpsuit"],
  outerwear: ["Blazer / Americana", "Abrigo de lana", "Gabardina / Trench", "Cazadora vaquera", "Cazadora de cuero", "Plumífero", "Chaqueta ligera"],
  shoes: ["Zapatillas blancas", "Zapatillas deportivas", "Mocasines", "Botines", "Botas", "Zapatos de vestir", "Sandalias", "Tacones"],
  accessory: ["Bolso", "Cinturón", "Bufanda / Pañuelo", "Gafas de sol", "Gorra / Sombrero", "Joyería / Reloj"],
};

export const OCCASIONS_LIST = [
  "Oficina / Trabajo",
  "Casual / Diario",
  "Cita / Cena",
  "Evento / Formal",
  "Deporte / Activo",
  "Fin de Semana / Relax",
  "Viaje",
];

export const SEASONS_LIST = [
  "Primavera / Otoño",
  "Verano",
  "Invierno",
  "Todo el año",
];

export const STYLE_TAGS = [
  "Minimalista Editorial",
  "Casual Chic",
  "Clásico / Atemporal",
  "Sastrería Relajada",
  "Urbano Contemporáneo",
  "Mediterráneo / Natural",
  "Bohemio Sofisticado",
];
