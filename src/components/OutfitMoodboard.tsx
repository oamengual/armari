"use client";

import React from "react";
import { Garment } from "@/types/armari";
import { RefreshCw, Sparkles, Shirt } from "lucide-react";

interface OutfitMoodboardProps {
  garments: Garment[];
  title?: string;
  occasion?: string;
  stylistNote?: string;
  weatherBadge?: string;
  compact?: boolean;
  onSwapGarment?: (garment: Garment) => void;
}

export function OutfitMoodboard({
  garments,
  title,
  occasion,
  stylistNote,
  weatherBadge,
  compact = false,
  onSwapGarment,
}: OutfitMoodboardProps) {
  const outerwear = garments.find((g) => g.category === "outerwear");
  const top = garments.find((g) => g.category === "top" || g.category === "full_body");
  const bottom = garments.find((g) => g.category === "bottom");
  const shoes = garments.find((g) => g.category === "shoes");
  const accessory = garments.find((g) => g.category === "accessory");

  // Si hay prendas adicionales que no encajan en el slot único, las mostramos también
  const rest = garments.filter(
    (g) =>
      g.id !== outerwear?.id &&
      g.id !== top?.id &&
      g.id !== bottom?.id &&
      g.id !== shoes?.id &&
      g.id !== accessory?.id
  );

  return (
    <div className="bg-editorial-canvas border border-editorial-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Cabecera Editorial del Look */}
      {(title || occasion || weatherBadge) && (
        <div className="px-5 pt-4 pb-3 border-b border-editorial-border/70 flex flex-wrap items-center justify-between gap-2 bg-editorial-bg/40">
          <div>
            {occasion && (
              <span className="text-[11px] uppercase tracking-[0.18em] text-editorial-muted font-medium block">
                {occasion}
              </span>
            )}
            {title && (
              <h3 className="font-serif text-xl md:text-2xl text-editorial-ink leading-tight">
                {title}
              </h3>
            )}
          </div>
          {weatherBadge && (
            <span className="text-xs px-3 py-1 rounded-full bg-editorial-sand text-editorial-ink border border-editorial-border">
              {weatherBadge}
            </span>
          )}
        </div>
      )}

      {/* Lienzo Moodboard Revista */}
      <div
        className={`relative bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F5] to-[#F4F0E8] ${
          compact ? "p-4 min-h-[250px]" : "p-6 min-h-[360px]"
        } flex flex-col justify-between`}
      >
        {/* Marca de agua sutil estilo revista */}
        <div className="pointer-events-none select-none absolute top-3 right-4 font-serif italic text-xs tracking-widest text-editorial-muted/40">
          ARMARI · LOOKBOOK
        </div>

        {garments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-editorial-muted text-sm">
            <Shirt className="w-8 h-8 mb-2 stroke-1" />
            <span>Selecciona prendas para componer el collage</span>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 items-center my-auto">
            {/* Columna Izquierda: Parte Superior + Parte Inferior */}
            <div className="col-span-7 flex flex-col items-center space-y-2">
              {top && (
                <MoodboardItem
                  garment={top}
                  compact={compact}
                  sizeClass={compact ? "h-28" : "h-40"}
                  onSwap={onSwapGarment}
                />
              )}
              {bottom && (
                <MoodboardItem
                  garment={bottom}
                  compact={compact}
                  sizeClass={compact ? "h-32" : "h-44"}
                  onSwap={onSwapGarment}
                />
              )}
            </div>

            {/* Columna Derecha: Abrigo / Chaqueta + Accesorios + Calzado */}
            <div className="col-span-5 flex flex-col items-center justify-between space-y-3">
              {outerwear && (
                <MoodboardItem
                  garment={outerwear}
                  compact={compact}
                  sizeClass={compact ? "h-28" : "h-40"}
                  onSwap={onSwapGarment}
                />
              )}
              {accessory && (
                <MoodboardItem
                  garment={accessory}
                  compact={compact}
                  sizeClass={compact ? "h-20" : "h-28"}
                  onSwap={onSwapGarment}
                />
              )}
              {shoes && (
                <MoodboardItem
                  garment={shoes}
                  compact={compact}
                  sizeClass={compact ? "h-20" : "h-28"}
                  onSwap={onSwapGarment}
                />
              )}
              {rest.map((extra) => (
                <MoodboardItem
                  key={extra.id}
                  garment={extra}
                  compact={compact}
                  sizeClass="h-20"
                  onSwap={onSwapGarment}
                />
              ))}
            </div>
          </div>
        )}

        {/* Etiquetas inferiores de las prendas que componen el look */}
        <div className="mt-4 pt-3 border-t border-editorial-border/60 flex flex-wrap gap-1.5">
          {garments.map((g) => (
            <div
              key={g.id}
              className="inline-flex items-center gap-1.5 text-[11px] bg-white/90 border border-editorial-border px-2.5 py-1 rounded-full text-editorial-ink"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                style={{ backgroundColor: g.color_hex || "#141413" }}
              />
              <span className="truncate max-w-[140px]">{g.name}</span>
              {onSwapGarment && (
                <button
                  type="button"
                  onClick={() => onSwapGarment(g)}
                  title="Cambiar solo esta prenda por otra de tu armario"
                  className="ml-0.5 text-editorial-muted hover:text-editorial-ink transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nota del Estilista IA */}
      {stylistNote && (
        <div className="px-5 py-3.5 bg-editorial-sand/60 border-t border-editorial-border text-xs md:text-sm text-editorial-ink/90 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-editorial-gold shrink-0 mt-0.5" />
          <p>{stylistNote}</p>
        </div>
      )}
    </div>
  );
}

function MoodboardItem({
  garment,
  sizeClass,
  compact,
  onSwap,
}: {
  garment: Garment;
  sizeClass: string;
  compact?: boolean;
  onSwap?: (garment: Garment) => void;
}) {
  return (
    <div className="group relative flex flex-col items-center justify-center w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={garment.image_url}
        alt={garment.name}
        className={`${sizeClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm`}
      />
      {onSwap && !compact && (
        <button
          type="button"
          onClick={() => onSwap(garment)}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 bg-editorial-ink/85 text-white text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Cambiar
        </button>
      )}
    </div>
  );
}
