import { DailyWeather } from "@/types/armari";

export function getWeatherConditionLabel(code: number): string {
  if (code === 0) return "Despejado y soleado";
  if (code === 1 || code === 2) return "Parcialmente soleado";
  if (code === 3) return "Nublado";
  if (code >= 45 && code <= 48) return "Niebla matinal";
  if (code >= 51 && code <= 67) return "Lluvia ligera a moderada";
  if (code >= 71 && code <= 77) return "Frío / Nieve";
  if (code >= 80 && code <= 82) return "Chubascos intermitentes";
  if (code >= 95) return "Tormenta";
  return "Templado";
}

export async function geocodeCity(
  cityName: string
): Promise<{ name: string; country: string; latitude: number; longitude: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=es&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const item = data.results[0];
    return {
      name: item.name,
      country: item.country || "",
      latitude: item.latitude,
      longitude: item.longitude,
    };
  } catch {
    return null;
  }
}

export async function fetchWeeklyWeather(
  latitude = 41.3888,
  longitude = 2.159
): Promise<DailyWeather[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();

    const dates: string[] = data.daily?.time || [];
    const maxTemps: number[] = data.daily?.temperature_2m_max || [];
    const minTemps: number[] = data.daily?.temperature_2m_min || [];
    const precip: number[] = data.daily?.precipitation_probability_max || [];
    const codes: number[] = data.daily?.weather_code || [];

    const formatter = new Intl.DateTimeFormat("es-ES", { weekday: "long" });

    return dates.slice(0, 7).map((dateStr, idx) => {
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const rawDay = formatter.format(dateObj);
      const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
      const code = codes[idx] ?? 1;
      return {
        date: dateStr,
        dayName,
        tempMax: Math.round(maxTemps[idx] ?? 20),
        tempMin: Math.round(minTemps[idx] ?? 12),
        precipitationProbability: Math.round(precip[idx] ?? 10),
        weatherCode: code,
        conditionText: getWeatherConditionLabel(code),
      };
    });
  } catch {
    // Fallback meteorológico de 7 días si no hay conexión
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      const iso = d.toISOString().split("T")[0];
      const rawDay = formatter.format(d);
      const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
      return {
        date: iso,
        dayName,
        tempMax: 21 - (idx % 3),
        tempMin: 13 - (idx % 2),
        precipitationProbability: idx === 3 ? 45 : 10,
        weatherCode: idx === 3 ? 61 : 1,
        conditionText: idx === 3 ? "Lluvia ligera a moderada" : "Parcialmente soleado",
      };
    });
  }
}
