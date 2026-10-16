import { Garment, Outfit, UserProfile } from "@/types/armari";

// Generador de siluetas SVG editoriales en formato Data URI transparente
// Permiten ver cómo quedan las prendas recortadas sin fondo en el moodboard desde el primer segundo
function createSvgGarmentDataUrl(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  email: "editorial@armari.app",
  full_name: "Mi Armario Cápsula",
  city: "Barcelona",
  latitude: 41.3888,
  longitude: 2.159,
  style_preferences: ["Minimalista Editorial", "Sastrería Relajada", "Mediterráneo / Natural"],
  favorite_colors: ["Blanco Roto", "Negro Carbón", "Piedra / Beige", "Azul Marino", "Verde Salvia"],
  avoid_colors: ["Neón"],
  min_days_between_wears: 3,
};

export const DEMO_GARMENTS: Garment[] = [
  {
    id: "g-top-shirt-white",
    name: "Camisa Popelín Oversize",
    category: "top",
    subcategory: "Camisa",
    color_primary: "Blanco Roto",
    color_hex: "#F6F4EF",
    colors_secondary: ["Blanco"],
    pattern: "Liso",
    fabric: "Algodón Orgánico",
    seasons: ["Todo el año", "Primavera / Otoño"],
    occasions: ["Oficina / Trabajo", "Casual / Diario", "Cita / Cena"],
    warmth_level: 2,
    brand: "Massimo Dutti",
    price: 59.95,
    is_dirty: false,
    is_favorite: true,
    wear_count: 14,
    last_worn_at: "2026-10-10",
    created_at: "2026-09-01T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.1"/>
        </filter>
        <g filter="url(#s)">
          <path d="M135 55 L165 40 L200 68 L235 40 L265 55 L345 115 L315 170 L275 140 L280 355 C240 365 160 365 120 355 L125 140 L85 170 L55 115 Z" fill="#F6F4EF" stroke="#D8D2C5" stroke-width="3"/>
          <path d="M165 40 L200 92 L235 40 L220 32 L200 52 L180 32 Z" fill="#EAE5D9" stroke="#C8C0B0" stroke-width="2.5"/>
          <line x1="200" y1="92" x2="200" y2="360" stroke="#DCD6C8" stroke-width="3"/>
          <circle cx="200" cy="135" r="3.5" fill="#BEB6A6"/>
          <circle cx="200" cy="180" r="3.5" fill="#BEB6A6"/>
          <circle cx="200" cy="225" r="3.5" fill="#BEB6A6"/>
          <circle cx="200" cy="270" r="3.5" fill="#BEB6A6"/>
          <rect x="220" y="145" width="38" height="44" rx="3" fill="#F2EFE8" stroke="#D5CFC2" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-top-knit-sand",
    name: "Jersey Punto Merino Arena",
    category: "top",
    subcategory: "Jersey",
    color_primary: "Beige / Arena",
    color_hex: "#D6C7B2",
    colors_secondary: ["Crema"],
    pattern: "Punto Acanalado",
    fabric: "Lana Merino",
    seasons: ["Primavera / Otoño", "Invierno"],
    occasions: ["Oficina / Trabajo", "Casual / Diario", "Fin de Semana / Relax"],
    warmth_level: 4,
    brand: "COS",
    price: 89.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 9,
    last_worn_at: "2026-10-12",
    created_at: "2026-09-05T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.12"/>
        </filter>
        <g filter="url(#s)">
          <path d="M138 58 C165 76 235 76 262 58 L345 140 L312 295 L278 288 L290 155 L272 135 L274 345 L126 345 L128 135 L110 155 L122 288 L88 295 L55 140 Z" fill="#D6C7B2" stroke="#B8A68E" stroke-width="3"/>
          <path d="M138 58 C165 82 235 82 262 58 C252 46 235 44 200 44 C165 44 148 46 138 58 Z" fill="#C9B89F" stroke="#B09D84" stroke-width="2.5"/>
          <rect x="126" y="325" width="148" height="22" fill="#C9B89F" stroke="#B09D84" stroke-width="2"/>
          <line x1="160" y1="85" x2="160" y2="325" stroke="#C5B49B" stroke-width="2" stroke-dasharray="6 6"/>
          <line x1="200" y1="88" x2="200" y2="325" stroke="#C5B49B" stroke-width="2" stroke-dasharray="6 6"/>
          <line x1="240" y1="85" x2="240" y2="325" stroke="#C5B49B" stroke-width="2" stroke-dasharray="6 6"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-top-tee-black",
    name: "Camiseta Heavyweight Negra",
    category: "top",
    subcategory: "Camiseta",
    color_primary: "Negro Carbón",
    color_hex: "#1C1B1A",
    colors_secondary: [],
    pattern: "Liso",
    fabric: "Algodón 240g",
    seasons: ["Todo el año", "Verano", "Primavera / Otoño"],
    occasions: ["Casual / Diario", "Fin de Semana / Relax", "Viaje"],
    warmth_level: 1,
    brand: "Uniqlo U",
    price: 19.9,
    is_dirty: false,
    is_favorite: false,
    wear_count: 22,
    last_worn_at: "2026-10-11",
    created_at: "2026-08-20T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.16"/>
        </filter>
        <g filter="url(#s)">
          <path d="M135 52 C165 72 235 72 265 52 L348 112 L316 175 L272 148 L275 352 L125 352 L128 148 L84 175 L52 112 Z" fill="#232220" stroke="#3A3835" stroke-width="3"/>
          <path d="M145 52 C170 76 230 76 255 52 C240 42 160 42 145 52 Z" fill="#181716" stroke="#3A3835" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-top-striped-breton",
    name: "Jersey Marinero Rayas",
    category: "top",
    subcategory: "Jersey",
    color_primary: "Marino y Crudo",
    color_hex: "#1F2A38",
    colors_secondary: ["Blanco Roto"],
    pattern: "Rayas",
    fabric: "Algodón Grueso",
    seasons: ["Primavera / Otoño", "Todo el año"],
    occasions: ["Casual / Diario", "Fin de Semana / Relax", "Viaje"],
    warmth_level: 3,
    brand: "Sezane",
    price: 95.0,
    is_dirty: true, // En lavadora para demostrar el filtro de lavandería
    is_favorite: true,
    wear_count: 11,
    last_worn_at: "2026-10-15",
    created_at: "2026-09-10T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" fill="none">
        <defs>
          <pattern id="stripes" width="40" height="28" patternUnits="userSpaceOnUse">
            <rect width="40" height="16" fill="#F4F1EA"/>
            <rect y="16" width="40" height="12" fill="#1F2A38"/>
          </pattern>
        </defs>
        <path d="M135 55 C165 72 235 72 265 55 L345 125 L312 265 L278 258 L286 142 L272 130 L274 345 L126 345 L128 130 L114 142 L122 258 L88 265 L55 125 Z" fill="url(#stripes)" stroke="#C8C1B4" stroke-width="3"/>
      </svg>
    `),
  },
  {
    id: "g-outer-blazer-charcoal",
    name: "Blazer Sastrería Lana Fría",
    category: "outerwear",
    subcategory: "Blazer / Americana",
    color_primary: "Gris Antracita",
    color_hex: "#363532",
    colors_secondary: ["Negro"],
    pattern: "Liso",
    fabric: "Lana Fría",
    seasons: ["Primavera / Otoño", "Invierno", "Todo el año"],
    occasions: ["Oficina / Trabajo", "Cita / Cena", "Evento / Formal"],
    warmth_level: 3,
    brand: "Arket",
    price: 179.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 16,
    last_worn_at: "2026-10-09",
    created_at: "2026-08-15T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#141413" flood-opacity="0.18"/>
        </filter>
        <g filter="url(#s)">
          <path d="M140 42 L172 32 L200 165 L228 32 L260 42 L342 95 L322 315 L284 310 L292 145 L278 135 L284 378 L204 378 L200 210 L196 378 L116 378 L122 135 L108 145 L116 310 L78 315 L58 95 Z" fill="#363532" stroke="#22211F" stroke-width="3"/>
          <path d="M168 34 L145 108 L166 112 L200 185 L172 32 Z" fill="#2A2927" stroke="#1E1D1B" stroke-width="2"/>
          <path d="M232 34 L255 108 L234 112 L200 185 L228 32 Z" fill="#2A2927" stroke="#1E1D1B" stroke-width="2"/>
          <circle cx="192" cy="235" r="5" fill="#181716"/>
          <circle cx="192" cy="278" r="5" fill="#181716"/>
          <rect x="132" y="275" width="42" height="10" rx="2" fill="#282725"/>
          <rect x="226" y="275" width="42" height="10" rx="2" fill="#282725"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-outer-trench-camel",
    name: "Gabardina Clásica Camel",
    category: "outerwear",
    subcategory: "Gabardina / Trench",
    color_primary: "Camel / Tostado",
    color_hex: "#C2A37E",
    colors_secondary: ["Beige"],
    pattern: "Liso",
    fabric: "Algodón Impermeable",
    seasons: ["Primavera / Otoño", "Invierno"],
    occasions: ["Oficina / Trabajo", "Casual / Diario", "Cita / Cena", "Viaje"],
    warmth_level: 4,
    brand: "Zara Studio",
    price: 129.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 8,
    last_worn_at: "2026-10-08",
    created_at: "2026-09-12T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#141413" flood-opacity="0.14"/>
        </filter>
        <g filter="url(#s)">
          <path d="M138 38 L170 28 L200 130 L230 28 L262 38 L340 92 L318 320 L282 312 L290 140 L276 130 L292 415 L108 415 L124 130 L110 140 L118 312 L82 320 L60 92 Z" fill="#C2A37E" stroke="#A3835D" stroke-width="3"/>
          <path d="M165 30 L132 115 L200 155 L268 115 L235 30" fill="#B5956F" stroke="#9C7C56" stroke-width="2.5"/>
          <rect x="118" y="232" width="164" height="18" rx="4" fill="#AD8C66" stroke="#94744F" stroke-width="2"/>
          <circle cx="178" cy="185" r="5" fill="#6E5233"/>
          <circle cx="222" cy="185" r="5" fill="#6E5233"/>
          <circle cx="178" cy="275" r="5" fill="#6E5233"/>
          <circle cx="222" cy="275" r="5" fill="#6E5233"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-bottom-trousers-pleated",
    name: "Pantalón Pinzas Wide-Leg",
    category: "bottom",
    subcategory: "Pantalón de vestir",
    color_primary: "Negro Carbón",
    color_hex: "#1E1D1B",
    colors_secondary: [],
    pattern: "Liso",
    fabric: "Tencel / Lana",
    seasons: ["Todo el año", "Primavera / Otoño", "Invierno"],
    occasions: ["Oficina / Trabajo", "Cita / Cena", "Evento / Formal"],
    warmth_level: 3,
    brand: "COS",
    price: 115.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 18,
    last_worn_at: "2026-10-10",
    created_at: "2026-08-10T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.15"/>
        </filter>
        <g filter="url(#s)">
          <path d="M125 35 L275 35 L302 420 L214 420 L200 155 L186 420 L98 420 Z" fill="#21201E" stroke="#383633" stroke-width="3"/>
          <rect x="125" y="35" width="150" height="22" fill="#181715" stroke="#383633" stroke-width="2"/>
          <line x1="162" y1="60" x2="152" y2="395" stroke="#33312E" stroke-width="2"/>
          <line x1="238" y1="60" x2="248" y2="395" stroke="#33312E" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-bottom-jeans-blue",
    name: "Jeans Rectos Lavado Medio",
    category: "bottom",
    subcategory: "Vaquero / Jeans",
    color_primary: "Azul Denim",
    color_hex: "#4A6680",
    colors_secondary: ["Azul"],
    pattern: "Denim",
    fabric: "Denim 100% Algodón",
    seasons: ["Todo el año", "Primavera / Otoño", "Invierno"],
    occasions: ["Casual / Diario", "Fin de Semana / Relax", "Viaje", "Oficina / Trabajo"],
    warmth_level: 3,
    brand: "Levi's 501",
    price: 110.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 27,
    last_worn_at: "2026-10-12",
    created_at: "2026-07-18T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.14"/>
        </filter>
        <g filter="url(#s)">
          <path d="M128 35 L272 35 L288 420 L212 420 L200 160 L188 420 L112 420 Z" fill="#4A6680" stroke="#354C63" stroke-width="3"/>
          <rect x="128" y="35" width="144" height="22" fill="#3F5973" stroke="#354C63" stroke-width="2"/>
          <path d="M128 92 Q158 96 170 60" stroke="#D4A359" stroke-width="2" fill="none"/>
          <path d="M272 92 Q242 96 230 60" stroke="#D4A359" stroke-width="2" fill="none"/>
          <line x1="200" y1="57" x2="200" y2="145" stroke="#D4A359" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-bottom-chino-stone",
    name: "Pantalón Chino Lino-Algodón Piedra",
    category: "bottom",
    subcategory: "Pantalón chino",
    color_primary: "Piedra / Crudo",
    color_hex: "#E5DEC9",
    colors_secondary: ["Beige"],
    pattern: "Liso",
    fabric: "Algodón y Lino",
    seasons: ["Primavera / Otoño", "Verano", "Todo el año"],
    occasions: ["Oficina / Trabajo", "Casual / Diario", "Cita / Cena", "Viaje"],
    warmth_level: 2,
    brand: "Massimo Dutti",
    price: 69.95,
    is_dirty: false,
    is_favorite: false,
    wear_count: 10,
    last_worn_at: "2026-10-07",
    created_at: "2026-08-25T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.1"/>
        </filter>
        <g filter="url(#s)">
          <path d="M130 35 L270 35 L284 415 L212 415 L200 158 L188 415 L116 415 Z" fill="#E5DEC9" stroke="#C7BFA8" stroke-width="3"/>
          <rect x="130" y="35" width="140" height="22" fill="#DAD1B9" stroke="#C7BFA8" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-shoes-loafers-black",
    name: "Mocasines Piel Sebago",
    category: "shoes",
    subcategory: "Mocasines",
    color_primary: "Negro Carbón",
    color_hex: "#181716",
    colors_secondary: [],
    pattern: "Liso",
    fabric: "Piel Flor",
    seasons: ["Todo el año", "Primavera / Otoño", "Invierno"],
    occasions: ["Oficina / Trabajo", "Cita / Cena", "Evento / Formal"],
    warmth_level: 3,
    brand: "Sebago",
    price: 165.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 20,
    last_worn_at: "2026-10-10",
    created_at: "2026-07-05T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#141413" flood-opacity="0.16"/>
        </filter>
        <g filter="url(#s)">
          <path d="M55 165 C55 125 95 105 150 105 L235 120 C295 128 345 142 350 172 C352 188 335 198 300 198 L75 198 C60 198 55 182 55 165 Z" fill="#1F1E1C" stroke="#363430" stroke-width="3"/>
          <rect x="52" y="190" width="298" height="18" rx="6" fill="#121110"/>
          <path d="M145 112 L225 125 L220 148 L140 135 Z" fill="#2D2B28" stroke="#423F3A" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-shoes-sneakers-white",
    name: "Zapatillas Minimalistas Piel Blanca",
    category: "shoes",
    subcategory: "Zapatillas blancas",
    color_primary: "Blanco Roto",
    color_hex: "#F5F3EE",
    colors_secondary: ["Gris Piedra"],
    pattern: "Liso",
    fabric: "Piel Vegana / Caucho",
    seasons: ["Todo el año", "Primavera / Otoño", "Verano"],
    occasions: ["Casual / Diario", "Oficina / Trabajo", "Viaje", "Fin de Semana / Relax"],
    warmth_level: 2,
    brand: "Veja",
    price: 140.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 31,
    last_worn_at: "2026-10-12",
    created_at: "2026-06-15T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#141413" flood-opacity="0.12"/>
        </filter>
        <g filter="url(#s)">
          <path d="M52 162 C52 115 95 95 142 98 L242 125 C302 132 345 145 352 172 L352 192 L52 192 Z" fill="#F8F6F1" stroke="#D8D2C7" stroke-width="3"/>
          <rect x="48" y="186" width="308" height="22" rx="7" fill="#E8E1D3" stroke="#CFC6B4" stroke-width="2"/>
          <path d="M165 135 L192 172 L225 128" stroke="#4A6B53" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: "g-acc-tote-leather",
    name: "Bolso Tote Piel Grano",
    category: "accessory",
    subcategory: "Bolso",
    color_primary: "Marrón Espresso",
    color_hex: "#4A3525",
    colors_secondary: [],
    pattern: "Liso",
    fabric: "Piel Vacuno",
    seasons: ["Todo el año"],
    occasions: ["Oficina / Trabajo", "Casual / Diario", "Viaje", "Cita / Cena"],
    warmth_level: 1,
    brand: "Polène",
    price: 380.0,
    is_dirty: false,
    is_favorite: true,
    wear_count: 25,
    last_worn_at: "2026-10-12",
    created_at: "2026-06-01T10:00:00Z",
    image_url: createSvgGarmentDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 380" fill="none">
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#141413" flood-opacity="0.16"/>
        </filter>
        <g filter="url(#s)">
          <path d="M130 140 C130 62 230 62 230 140" stroke="#4A3525" stroke-width="12" stroke-linecap="round"/>
          <path d="M72 135 L288 135 L268 330 C266 342 254 350 240 350 L120 350 C106 350 94 342 92 330 Z" fill="#59402E" stroke="#3D2B1E" stroke-width="3"/>
          <path d="M90 155 Q180 185 270 155" stroke="#453021" stroke-width="2.5" fill="none"/>
        </g>
      </svg>
    `),
  },
];

export const DEMO_OUTFITS: Outfit[] = [
  {
    id: "outfit-editorial-1",
    title: "Sastrería Relajada de Otoño",
    occasion: "Oficina / Trabajo",
    season: "Primavera / Otoño",
    garment_ids: [
      "g-outer-blazer-charcoal",
      "g-top-shirt-white",
      "g-bottom-trousers-pleated",
      "g-shoes-loafers-black",
      "g-acc-tote-leather",
    ],
    stylist_note:
      "Un equilibrio impecable entre estructura y fluidez. La camisa de popelín blanco roto ilumina el rostro bajo el blazer antracita, mientras el pantalón de pinzas wide-leg y los mocasines de piel aportan autoridad sin rigidez.",
    weather_summary: "19°C · Parcialmente nublado",
    is_favorite: true,
    is_ai_generated: true,
    created_at: "2026-10-15T09:00:00Z",
  },
  {
    id: "outfit-editorial-2",
    title: "Cápsula Luminosa Fin de Semana",
    occasion: "Casual / Diario",
    season: "Primavera / Otoño",
    garment_ids: [
      "g-outer-trench-camel",
      "g-top-knit-sand",
      "g-bottom-jeans-blue",
      "g-shoes-sneakers-white",
    ],
    stylist_note:
      "Tonos cálidos de arena y camel combinados con el azul clásico del denim recto. Las zapatillas blancas limpian visualmente el conjunto y lo hacen ideal para caminar todo el día con comodidad.",
    weather_summary: "17°C · Brisa suave",
    is_favorite: true,
    is_ai_generated: true,
    created_at: "2026-10-14T11:30:00Z",
  },
];
