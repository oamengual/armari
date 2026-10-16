import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { Garment } from "@/types/armari";

function buildFallbackTripCapsule(
  garments: Garment[],
  destination: string,
  daysCount: number,
  luggageType: string,
  activities: string[]
) {
  const clean = garments.filter((g) => !g.is_dirty);
  const tops = clean.filter((g) => g.category === "top" || g.category === "full_body").slice(0, Math.min(4, daysCount));
  const bottoms = clean.filter((g) => g.category === "bottom").slice(0, 2);
  const outers = clean.filter((g) => g.category === "outerwear").slice(0, 2);
  const shoes = clean.filter((g) => g.category === "shoes").slice(0, 2);
  const accessories = clean.filter((g) => g.category === "accessory").slice(0, 1);

  const capsule = [...outers, ...tops, ...bottoms, ...shoes, ...accessories];
  const capsuleIds = Array.from(new Set(capsule.map((g) => g.id)));

  const daily_looks = Array.from({ length: daysCount }).map((_, idx) => {
    const top = tops[idx % Math.max(1, tops.length)];
    const bottom = bottoms[idx % Math.max(1, bottoms.length)];
    const outer = outers[idx % Math.max(1, outers.length)];
    const shoe = shoes[idx % Math.max(1, shoes.length)];
    const acc = accessories[0];
    const act = activities[idx % Math.max(1, activities.length)] || "Exploración urbana";

    const lookIds: string[] = [];
    if (outer && idx % 2 === 0) lookIds.push(outer.id);
    if (top) lookIds.push(top.id);
    if (bottom) lookIds.push(bottom.id);
    if (shoe) lookIds.push(shoe.id);
    if (acc) lookIds.push(acc.id);

    return {
      day: idx + 1,
      activity: act,
      title: `Día ${idx + 1} en ${destination} · ${act}`,
      garment_ids: lookIds,
      stylist_note: `Combinación ligera y versátil usando la base cápsula de tu ${luggageType.toLowerCase()}.`,
    };
  });

  return {
    capsule_garment_ids: capsuleIds,
    stylist_summary: `Maleta cápsula optimizada para ${daysCount} días en ${destination} (${luggageType}). Con solo ${capsuleIds.length} prendas versátiles en tonos coordinados resuelves todos los planes sin sobrecargar el equipaje.`,
    daily_looks,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      garments = [],
      destination = "Roma",
      daysCount = 4,
      luggageType = "Maleta de cabina",
      activities = ["Turismo urbano", "Cena especial"],
      weatherHint = "Templado 15°C - 21°C",
    }: {
      garments: Garment[];
      destination: string;
      daysCount: number;
      luggageType: string;
      activities: string[];
      weatherHint?: string;
    } = body;

    const cleanGarments = garments.filter((g) => !g.is_dirty);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("TuClaveDeGeminiAqui")) {
      return NextResponse.json({
        aiMode: "fallback",
        ...buildFallbackTripCapsule(cleanGarments, destination, daysCount, luggageType, activities),
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

    const prompt = `Eres un estilista experto en maletas cápsula de viaje (Travel Capsule Wardrobe).
El usuario viaja a ${destination} durante ${daysCount} días con equipaje tipo "${luggageType}".
Actividades previstas: ${activities.join(", ")}.
Clima estimado en destino: ${weatherHint}.

Selecciona una maleta cápsula compacta donde todas las prendas combinen entre sí usando EXCLUSIVAMENTE IDs de este inventario:
${JSON.stringify(inventory, null, 2)}

Y genera el outfit para cada uno de los ${daysCount} días del viaje usando únicamente las prendas que has metido en capsule_garment_ids.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            capsule_garment_ids: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            stylist_summary: { type: Type.STRING },
            daily_looks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  activity: { type: Type.STRING },
                  title: { type: Type.STRING },
                  garment_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stylist_note: { type: Type.STRING },
                },
                required: ["day", "activity", "title", "garment_ids", "stylist_note"],
              },
            },
          },
          required: ["capsule_garment_ids", "stylist_summary", "daily_looks"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({
      aiMode: "gemini",
      ...parsed,
    });
  } catch (error) {
    console.error("Error in trip packer AI:", error);
    return NextResponse.json(
      { error: "No se pudo generar la maleta cápsula." },
      { status: 500 }
    );
  }
}
