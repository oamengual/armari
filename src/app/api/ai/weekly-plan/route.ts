import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { Garment, DailyWeather, UserProfile } from "@/types/armari";

interface DayRequestItem {
  date: string;
  dayName: string;
  occasion: string;
  userNote?: string;
  weather: DailyWeather;
}

function generateSmartWeeklyFallback(
  garments: Garment[],
  days: DayRequestItem[],
  minDaysBetweenWears: number
) {
  const clean = garments.filter((g) => !g.is_dirty);
  const tops = clean.filter((g) => g.category === "top" || g.category === "full_body");
  const bottoms = clean.filter((g) => g.category === "bottom");
  const outers = clean.filter((g) => g.category === "outerwear");
  const shoes = clean.filter((g) => g.category === "shoes");
  const accessories = clean.filter((g) => g.category === "accessory");

  const recentTopIds: string[] = [];

  return days.map((day, idx) => {
    // Evitar repetir la parte superior usada en los últimos X días
    const availableTops = tops.filter((t) => !recentTopIds.slice(-Math.max(1, minDaysBetweenWears - 1)).includes(t.id));
    const chosenTop = (availableTops.length > 0 ? availableTops : tops)[idx % Math.max(1, (availableTops.length || tops.length))];
    if (chosenTop) recentTopIds.push(chosenTop.id);

    const chosenBottom = bottoms[idx % Math.max(1, bottoms.length)];
    const chosenShoe = shoes[idx % Math.max(1, shoes.length)];
    const needOuter = day.weather.tempMax <= 20 || day.weather.precipitationProbability >= 35 || day.occasion.includes("Oficina");
    const chosenOuter = outers[idx % Math.max(1, outers.length)];
    const chosenAcc = accessories[idx % Math.max(1, accessories.length)];

    const ids: string[] = [];
    if (needOuter && chosenOuter) ids.push(chosenOuter.id);
    if (chosenTop) ids.push(chosenTop.id);
    if (chosenTop?.category !== "full_body" && chosenBottom) ids.push(chosenBottom.id);
    if (chosenShoe) ids.push(chosenShoe.id);
    if (chosenAcc && idx % 2 === 0) ids.push(chosenAcc.id);

    return {
      planned_date: day.date,
      occasion: day.occasion,
      title: `Look ${day.dayName}: ${day.occasion.split("/")[0].trim()}`,
      garment_ids: ids,
      stylist_note: `Pensado para ${day.weather.tempMin}°-${day.weather.tempMax}°C (${day.weather.conditionText}). ${
        day.userNote ? `Nota: ${day.userNote}. ` : ""
      }Respeta la rotación sin repetir prendas superiores consecutivas.`,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      garments = [],
      days = [],
      globalNote = "",
      profile,
    }: {
      garments: Garment[];
      days: DayRequestItem[];
      globalNote?: string;
      profile?: UserProfile;
    } = body;

    const cleanGarments = garments.filter((g) => !g.is_dirty);
    const minDays = profile?.min_days_between_wears ?? 3;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("TuClaveDeGeminiAqui")) {
      return NextResponse.json({
        aiMode: "fallback",
        plans: generateSmartWeeklyFallback(cleanGarments, days, minDays),
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const inventory = cleanGarments.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      subcategory: g.subcategory,
      color: g.color_primary,
      warmth: g.warmth_level,
      occasions: g.occasions,
    }));

    const prompt = `Eres un estilista personal experto en planificación semanal de armario inteligente.
Planifica los 7 días de la semana para el usuario combinando EXCLUSIVAMENTE las prendas limpias de su inventario:
${JSON.stringify(inventory, null, 2)}

Calendario y meteorología de los 7 días:
${JSON.stringify(days, null, 2)}

Preferencias del usuario:
- Estilo: ${profile?.style_preferences?.join(", ") || "Minimalista Editorial"}
- Colores favoritos: ${profile?.favorite_colors?.join(", ") || "Neutros"}
- Regla de no repetición: No repetir la misma prenda principal (especialmente tops/camisas) en un margen de ${minDays} días, salvo que el armario tenga muy pocas prendas.
- Nota global de la semana: "${globalNote || "Semana equilibrada y cómoda"}"

Devuelve exactamente un plan por cada fecha recibida en 'days', usando solo garment_ids válidos del inventario.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  planned_date: { type: Type.STRING },
                  occasion: { type: Type.STRING },
                  title: { type: Type.STRING },
                  garment_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stylist_note: { type: Type.STRING },
                },
                required: ["planned_date", "occasion", "title", "garment_ids", "stylist_note"],
              },
            },
          },
          required: ["plans"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({
      aiMode: "gemini",
      plans: parsed.plans || generateSmartWeeklyFallback(cleanGarments, days, minDays),
    });
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    return NextResponse.json(
      { error: "Error al generar la planificación semanal con IA." },
      { status: 500 }
    );
  }
}
