import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { Garment, UserProfile, DailyWeather } from "@/types/armari";

function buildSmartFallbackOutfits(
  garments: Garment[],
  occasion: string,
  weather?: DailyWeather,
  userNote?: string
) {
  const cleanGarments = garments.filter((g) => !g.is_dirty);
  const tops = cleanGarments.filter((g) => g.category === "top" || g.category === "full_body");
  const bottoms = cleanGarments.filter((g) => g.category === "bottom");
  const outers = cleanGarments.filter((g) => g.category === "outerwear");
  const shoes = cleanGarments.filter((g) => g.category === "shoes");
  const accessories = cleanGarments.filter((g) => g.category === "accessory");

  const needOuterwear =
    (weather && weather.tempMax <= 21) ||
    (weather && weather.precipitationProbability >= 35) ||
    occasion.includes("Oficina") ||
    occasion.includes("Cena");

  const suggestions = [0, 1].map((idx) => {
    const selectedIds: string[] = [];
    const top = tops[idx % Math.max(1, tops.length)];
    const bottom = bottoms[idx % Math.max(1, bottoms.length)];
    const outer = outers[idx % Math.max(1, outers.length)];
    const shoe = shoes[idx % Math.max(1, shoes.length)];
    const acc = accessories[idx % Math.max(1, accessories.length)];

    if (needOuterwear && outer) selectedIds.push(outer.id);
    if (top) selectedIds.push(top.id);
    if (top?.category !== "full_body" && bottom) selectedIds.push(bottom.id);
    if (shoe) selectedIds.push(shoe.id);
    if (acc && idx === 0) selectedIds.push(acc.id);

    const tempInfo = weather ? `${weather.tempMin}°C - ${weather.tempMax}°C (${weather.conditionText})` : "Clima templado";

    return {
      title:
        idx === 0
          ? `Silueta Editorial · ${occasion}`
          : `Alternativa Versátil · ${occasion}`,
      occasion,
      garment_ids: selectedIds,
      stylist_note: `Combinación pensada para ${occasion.toLowerCase()} con previsión de ${tempInfo}. ${
        userNote ? `Adaptado a tu nota: "${userNote}". ` : ""
      }Equilibra texturas neutras y prioriza prendas limpias con menor rotación reciente.`,
    };
  });

  return suggestions;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      garments = [],
      occasion = "Oficina / Trabajo",
      weather,
      userNote = "",
      profile,
    }: {
      garments: Garment[];
      occasion: string;
      weather?: DailyWeather;
      userNote?: string;
      profile?: UserProfile;
    } = body;

    const cleanGarments = garments.filter((g) => !g.is_dirty);
    if (cleanGarments.length < 2) {
      return NextResponse.json(
        { error: "Necesitas al menos 2 prendas limpias en tu armario para generar un outfit." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("TuClaveDeGeminiAqui")) {
      return NextResponse.json({
        aiMode: "fallback",
        outfits: buildSmartFallbackOutfits(cleanGarments, occasion, weather, userNote),
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const inventorySummary = cleanGarments.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      subcategory: g.subcategory,
      color: g.color_primary,
      fabric: g.fabric,
      warmth: g.warmth_level,
      occasions: g.occasions,
      last_worn_at: g.last_worn_at,
      wear_count: g.wear_count,
    }));

    const prompt = `Eres un estilista personal de alta gama con estética Minimalista Editorial.
Crea 2 propuestas de outfits distintos para HOY usando EXCLUSIVAMENTE los IDs de prendas disponibles en este inventario:
${JSON.stringify(inventorySummary, null, 2)}

Contexto del día:
- Ocasión principal: ${occasion}
- Clima de hoy: ${weather ? `${weather.conditionText}, mín ${weather.tempMin}°C / máx ${weather.tempMax}°C, lluvia ${weather.precipitationProbability}%` : "Templado 19°C"}
- Nota especial del usuario: "${userNote || "Sin nota adicional"}"
- Preferencias de estilo del usuario: ${profile?.style_preferences?.join(", ") || "Minimalista Editorial"}
- Colores favoritos: ${profile?.favorite_colors?.join(", ") || "Neutros"}
- Regla de rotación: Evitar prendas usadas en los últimos ${profile?.min_days_between_wears ?? 3} días si hay alternativas.

Reglas obligatorias:
1. Cada outfit debe ser coherente (ej. 1 top + 1 bottom + 1 shoes, o 1 full_body + 1 shoes, añadiendo outerwear si refresca o la ocasión lo pide, y opcionalmente 1 accessory).
2. Usa únicamente IDs que existan exactamente en la lista proporcionada.
3. Escribe en español una explicación editorial cálida y útil en stylist_note explicando por qué funcionan los colores, tejidos y proporciones.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  occasion: { type: Type.STRING },
                  garment_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stylist_note: { type: Type.STRING },
                },
                required: ["title", "occasion", "garment_ids", "stylist_note"],
              },
            },
          },
          required: ["outfits"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({
      aiMode: "gemini",
      outfits: parsed.outfits || buildSmartFallbackOutfits(cleanGarments, occasion, weather, userNote),
    });
  } catch (error) {
    console.error("Error in AI stylist:", error);
    return NextResponse.json(
      { error: "No se pudieron generar las sugerencias de outfit." },
      { status: 500 }
    );
  }
}
