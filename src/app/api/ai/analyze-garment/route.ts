import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType = "image/png", fileName = "" } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("TuClaveDeGeminiAqui")) {
      // Respuesta heurística inteligente de respaldo si aún no ha pegado la GEMINI_API_KEY
      const lower = fileName.toLowerCase();
      const isShoe = lower.includes("zap") || lower.includes("boot") || lower.includes("sneaker");
      const isBottom = lower.includes("pant") || lower.includes("jean") || lower.includes("falda");
      const isOuter = lower.includes("abrigo") || lower.includes("chaqueta") || lower.includes("blazer");

      return NextResponse.json({
        aiMode: "fallback",
        analysis: {
          name: isShoe
            ? "Calzado Editorial"
            : isBottom
            ? "Pantalón Corte Recto"
            : isOuter
            ? "Chaqueta Estructurada"
            : "Prenda Esencial Armario",
          category: isShoe ? "shoes" : isBottom ? "bottom" : isOuter ? "outerwear" : "top",
          subcategory: isShoe
            ? "Zapatillas blancas"
            : isBottom
            ? "Pantalón de vestir"
            : isOuter
            ? "Blazer / Americana"
            : "Camisa",
          color_primary: "Negro Carbón",
          color_hex: "#232220",
          colors_secondary: ["Blanco Roto"],
          pattern: "Liso",
          fabric: "Algodón Orgánico",
          seasons: ["Primavera / Otoño", "Todo el año"],
          occasions: ["Oficina / Trabajo", "Casual / Diario"],
          warmth_level: 3,
          notes: "Catalogado automático (Configura GEMINI_API_KEY para visión IA en vivo).",
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: `Eres un estilista editorial de moda experto. Analiza la prenda de ropa en esta imagen y devuelve sus atributos exactos en español para catalogarla en un armario inteligente.
              - category debe ser exactamente uno de: "top", "bottom", "full_body", "outerwear", "shoes", "accessory".
              - seasons puede incluir: "Primavera / Otoño", "Verano", "Invierno", "Todo el año".
              - occasions puede incluir: "Oficina / Trabajo", "Casual / Diario", "Cita / Cena", "Evento / Formal", "Deporte / Activo", "Fin de Semana / Relax", "Viaje".
              - warmth_level de 1 (muy fresco/verano) a 5 (abrigo intenso invierno).
              - color_hex debe ser el código hexadecimal real del color dominante de la prenda.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre editorial descriptivo y corto en español (ej. Camisa Popelín Azul Celeste)" },
            category: { type: Type.STRING, enum: ["top", "bottom", "full_body", "outerwear", "shoes", "accessory"] },
            subcategory: { type: Type.STRING, description: "Subcategoría en español (ej. Camisa, Jersey, Vaquero / Jeans, Blazer / Americana, Mocasines)" },
            color_primary: { type: Type.STRING, description: "Nombre del color principal en español" },
            color_hex: { type: Type.STRING, description: "Color hexadecimal principal ej. #2A3439" },
            colors_secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
            pattern: { type: Type.STRING, description: "Liso, Rayas, Cuadros, Estampado, Punto, Denim" },
            fabric: { type: Type.STRING, description: "Tejido estimado en español (ej. Algodón, Lana Merino, Lino, Piel, Denim)" },
            seasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            occasions: { type: Type.ARRAY, items: { type: Type.STRING } },
            warmth_level: { type: Type.INTEGER },
            notes: { type: Type.STRING, description: "Consejo breve de cómo combinar esta prenda" },
          },
          required: [
            "name",
            "category",
            "subcategory",
            "color_primary",
            "color_hex",
            "pattern",
            "fabric",
            "seasons",
            "occasions",
            "warmth_level",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({
      aiMode: "gemini",
      analysis: parsed,
    });
  } catch (error) {
    console.error("Error analyzing garment:", error);
    return NextResponse.json(
      { error: "No se pudo analizar la imagen con IA." },
      { status: 500 }
    );
  }
}
