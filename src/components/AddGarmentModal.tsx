"use client";

import React, { useState, useRef } from "react";
import {
  Garment,
  GarmentCategory,
  CATEGORY_LABELS,
  SUBCATEGORIES_BY_CATEGORY,
  OCCASIONS_LIST,
  SEASONS_LIST,
} from "@/types/armari";
import {
  Camera,
  Upload,
  Sparkles,
  Scissors,
  Check,
  X,
  Loader2,
  Wand2,
} from "lucide-react";

interface AddGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (garment: Omit<Garment, "id" | "created_at">, fileBlob?: Blob) => Promise<void>;
}

async function compressImageToDataUrl(
  sourceBlob: Blob,
  maxSize = 900
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceBlob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/png", 0.92);
      canvas.toBlob(
        (outBlob) => {
          resolve({ dataUrl, blob: outBlob || sourceBlob });
        },
        "image/png",
        0.92
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

export function AddGarmentModal({ isOpen, onClose, onSave }: AddGarmentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [useCutout, setUseCutout] = useState<boolean>(true);

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgressText, setBgProgressText] = useState("");
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiStatusBanner, setAiStatusBanner] = useState<string | null>(null);

  // Campos del formulario (rellenados automáticamente por Gemini Vision)
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GarmentCategory>("top");
  const [subcategory, setSubcategory] = useState("Camisa");
  const [colorPrimary, setColorPrimary] = useState("Blanco Roto");
  const [colorHex, setColorHex] = useState("#F5F3EE");
  const [pattern, setPattern] = useState("Liso");
  const [fabric, setFabric] = useState("Algodón");
  const [seasons, setSeasons] = useState<string[]>(["Primavera / Otoño", "Todo el año"]);
  const [occasions, setOccasions] = useState<string[]>(["Oficina / Trabajo", "Casual / Diario"]);
  const [warmthLevel, setWarmthLevel] = useState<number>(3);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<string>("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiStatusBanner(null);

    try {
      const { dataUrl: compressedOriginal, blob: compressedBlob } =
        await compressImageToDataUrl(file, 950);
      setOriginalPreview(compressedOriginal);
      setProcessedPreview(compressedOriginal);
      setProcessedBlob(compressedBlob);

      // 1. Lanzar en paralelo la catalogación IA con Gemini 2.5 Flash
      runAiAnalysis(compressedOriginal, file.name);

      // 2. Ejecutar el recorte de fondo gratuito en el navegador (@imgly/background-removal)
      setIsRemovingBg(true);
      setBgProgressText("Descargando modelo IA de recorte en navegador...");
      try {
        const bgModule = await import("@imgly/background-removal");
        const removeBackground = bgModule.removeBackground || bgModule.default;
        const cutoutBlob = await removeBackground(compressedBlob, {
          progress: (key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.round((current / total) * 100);
              setBgProgressText(`Recortando fondo (${pct}%)...`);
            } else {
              setBgProgressText(`Procesando ${key}...`);
            }
          },
        });
        const { dataUrl: cutoutDataUrl, blob: finalCutoutBlob } =
          await compressImageToDataUrl(cutoutBlob, 900);
        setProcessedPreview(cutoutDataUrl);
        setProcessedBlob(finalCutoutBlob);
        setUseCutout(true);
      } catch (bgErr) {
        console.warn("Background removal fallback to original image:", bgErr);
        setBgProgressText("Foto original lista (recorte omitido en este dispositivo)");
      } finally {
        setIsRemovingBg(false);
      }
    } catch (err) {
      console.error("Error reading image:", err);
    }
  };

  const runAiAnalysis = async (base64DataUrl: string, fileName: string) => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64DataUrl,
          mimeType: "image/png",
          fileName,
        }),
      });
      if (!res.ok) throw new Error("Failed AI analysis");
      const data = await res.json();
      const info = data.analysis;
      if (info) {
        if (info.name) setName(info.name);
        if (info.category) setCategory(info.category as GarmentCategory);
        if (info.subcategory) setSubcategory(info.subcategory);
        if (info.color_primary) setColorPrimary(info.color_primary);
        if (info.color_hex) setColorHex(info.color_hex);
        if (info.pattern) setPattern(info.pattern);
        if (info.fabric) setFabric(info.fabric);
        if (Array.isArray(info.seasons) && info.seasons.length > 0) setSeasons(info.seasons);
        if (Array.isArray(info.occasions) && info.occasions.length > 0) setOccasions(info.occasions);
        if (typeof info.warmth_level === "number") setWarmthLevel(info.warmth_level);
        if (info.notes) setNotes(info.notes);

        setAiStatusBanner(
          data.aiMode === "gemini"
            ? "✨ Prenda analizada y catalogada automáticamente con Gemini 2.5 Flash"
            : "✨ Prenda pre-clasificada (Añade tu GEMINI_API_KEY para visión IA en tiempo real)"
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const toggleItemInList = (list: string[], item: string, setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = useCutout && processedPreview ? processedPreview : originalPreview;
    if (!finalImage) return;

    setIsSaving(true);
    try {
      await onSave(
        {
          name: name.trim() || `${subcategory} ${colorPrimary}`,
          category,
          subcategory,
          color_primary: colorPrimary,
          color_hex: colorHex,
          colors_secondary: [],
          pattern,
          fabric,
          seasons,
          occasions,
          warmth_level: warmthLevel,
          brand: brand.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          image_url: finalImage,
          is_dirty: false,
          is_favorite: false,
          wear_count: 0,
          last_worn_at: null,
          notes: notes.trim() || undefined,
        },
        useCutout && processedBlob ? processedBlob : undefined
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const activePreview = useCutout && processedPreview ? processedPreview : originalPreview;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-editorial-bg w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-editorial-border shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-editorial-bg/95 backdrop-blur-xs px-6 py-4 border-b border-editorial-border flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
              Digitalización IA
            </span>
            <h2 className="font-serif text-2xl text-editorial-ink">
              Añadir prenda a tu armario
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-editorial-sand text-editorial-muted hover:text-editorial-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Zona de Captura / Foto */}
          {!activePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-editorial-border hover:border-editorial-ink/50 rounded-2xl p-8 text-center cursor-pointer bg-editorial-canvas transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-editorial-sand mx-auto flex items-center justify-center mb-3">
                <Camera className="w-6 h-6 text-editorial-ink" />
              </div>
              <p className="font-serif text-xl text-editorial-ink mb-1">
                Haz una foto a tu prenda o súbela de la galería
              </p>
              <p className="text-xs text-editorial-muted max-w-md mx-auto">
                Recortaremos el fondo automáticamente en tu navegador y Gemini 2.5 Flash detectará categoría, color, tejido y clima ideal.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest">
                <Upload className="w-3.5 h-3.5" /> Seleccionar o Hacer Foto
              </div>
            </div>
          ) : (
            <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-4">
              <div className="relative h-64 flex items-center justify-center bg-[radial-gradient(#E6E1D6_1px,transparent_1px)] [background-size:16px_16px] rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreview}
                  alt="Previsualización de prenda"
                  className="max-h-56 w-auto object-contain drop-shadow-md transition-all"
                />

                {isRemovingBg && (
                  <div className="absolute inset-0 bg-editorial-bg/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-editorial-ink mb-2" />
                    <p className="text-xs font-medium text-editorial-ink">{bgProgressText}</p>
                    <p className="text-[11px] text-editorial-muted mt-1">
                      100% privado y gratuito en tu navegador (@imgly/background-removal)
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUseCutout(true)}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition-colors ${
                      useCutout
                        ? "bg-editorial-ink text-white border-editorial-ink"
                        : "bg-editorial-bg text-editorial-muted border-editorial-border"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" /> Sin fondo (Editorial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCutout(false)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      !useCutout
                        ? "bg-editorial-ink text-white border-editorial-ink"
                        : "bg-editorial-bg text-editorial-muted border-editorial-border"
                    }`}
                  >
                    Foto original
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-editorial-muted hover:text-editorial-ink underline"
                >
                  Cambiar foto
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Estado de Análisis IA */}
          {isAnalyzingAi && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-editorial-sand border border-editorial-border text-xs text-editorial-ink">
              <Wand2 className="w-4 h-4 animate-pulse text-editorial-gold" />
              <span>Gemini 2.5 Flash está analizando el color, tejido y temporada de la prenda...</span>
            </div>
          )}

          {aiStatusBanner && !isAnalyzingAi && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-editorial-sage/10 border border-editorial-sage/30 text-xs text-editorial-sage">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{aiStatusBanner}</span>
            </div>
          )}

          {/* Atributos de la Prenda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Nombre de la prenda
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Camisa Popelín Oversize Blanca"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm focus:outline-none focus:border-editorial-ink"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as GarmentCategory;
                  setCategory(newCat);
                  setSubcategory(SUBCATEGORIES_BY_CATEGORY[newCat][0]);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Subcategoría
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
              >
                {SUBCATEGORIES_BY_CATEGORY[category].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Color Principal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-editorial-border cursor-pointer bg-white p-0.5"
                />
                <input
                  type="text"
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Tejido / Material
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="Algodón, Lana, Lino, Denim..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Marca (Opcional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Zara, COS, Massimo Dutti..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Precio € (Para Coste por Uso)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="59.95"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
              />
            </div>
          </div>

          {/* Nivel de Abrigo */}
          <div>
            <div className="flex justify-between text-xs uppercase tracking-wider text-editorial-muted mb-1.5">
              <span>Nivel de Abrigo Térmico</span>
              <span className="font-semibold text-editorial-ink">{warmthLevel} / 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={warmthLevel}
              onChange={(e) => setWarmthLevel(Number(e.target.value))}
              className="w-full accent-editorial-ink"
            />
            <div className="flex justify-between text-[11px] text-editorial-muted">
              <span>1 · Ola de calor</span>
              <span>3 · Entretiempo</span>
              <span>5 · Frío intenso</span>
            </div>
          </div>

          {/* Temporadas */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-2">
              Temporadas Ideales
            </label>
            <div className="flex flex-wrap gap-2">
              {SEASONS_LIST.map((s) => {
                const active = seasons.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleItemInList(seasons, s, setSeasons)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      active
                        ? "bg-editorial-ink text-white border-editorial-ink"
                        : "bg-white text-editorial-muted border-editorial-border"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ocasiones */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-2">
              Ocasiones de Uso
            </label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS_LIST.map((occ) => {
                const active = occasions.includes(occ);
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleItemInList(occasions, occ, setOccasions)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      active
                        ? "bg-editorial-ink text-white border-editorial-ink"
                        : "bg-white text-editorial-muted border-editorial-border"
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-editorial-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-editorial-border text-xs uppercase tracking-wider text-editorial-muted hover:text-editorial-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!activePreview || isSaving}
              className="px-6 py-2.5 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-40 hover:bg-black transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Guardar en mi Armario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
