"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Garment,
  GarmentCategory,
  Outfit,
  DayPlan,
  DailyWeather,
  UserProfile,
  TripPlan,
  CATEGORY_LABELS,
  OCCASIONS_LIST,
  STYLE_TAGS,
} from "@/types/armari";
import { DEMO_GARMENTS, DEMO_OUTFITS, DEMO_PROFILE } from "@/lib/demo-data";
import { fetchWeeklyWeather, geocodeCity } from "@/lib/weather";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { OutfitMoodboard } from "@/components/OutfitMoodboard";
import { AddGarmentModal } from "@/components/AddGarmentModal";
import { AuthModal } from "@/components/AuthModal";
import {
  Sparkles,
  Shirt,
  Calendar,
  Luggage,
  BarChart3,
  Plus,
  CloudSun,
  Droplets,
  Heart,
  Trash2,
  Check,
  RefreshCw,
  MapPin,
  User,
  LogOut,
  Search,
  SlidersHorizontal,
  WashingMachine,
  Wand2,
  BookmarkCheck,
  TrendingDown,
  Clock,
  Layers,
} from "lucide-react";

type ActiveTab = "stylist" | "wardrobe" | "planner" | "trips" | "stats";

const STORAGE_KEYS = {
  GARMENTS: "armari_garments_v1",
  OUTFITS: "armari_outfits_v1",
  PLANS: "armari_weekly_plans_v1",
  PROFILE: "armari_profile_v1",
  TRIPS: "armari_trips_v1",
};

export default function ArmariApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stylist");

  // Estado principal de datos
  const [garments, setGarments] = useState<Garment[]>(DEMO_GARMENTS);
  const [outfits, setOutfits] = useState<Outfit[]>(DEMO_OUTFITS);
  const [weeklyPlans, setWeeklyPlans] = useState<DayPlan[]>([]);
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEMO_PROFILE);
  const [weatherDays, setWeatherDays] = useState<DailyWeather[]>([]);

  // Usuario de Supabase Auth
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filtros en "Mi Armario"
  const [categoryFilter, setCategoryFilter] = useState<GarmentCategory | "all">("all");
  const [laundryFilter, setLaundryFilter] = useState<"all" | "clean" | "dirty">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado del Estilista de Hoy
  const [todayOccasion, setTodayOccasion] = useState(OCCASIONS_LIST[0]);
  const [todayNote, setTodayNote] = useState("");
  const [isGeneratingToday, setIsGeneratingToday] = useState(false);
  const [todaySuggestions, setTodaySuggestions] = useState<
    Array<{
      title: string;
      occasion: string;
      garment_ids: string[];
      stylist_note: string;
    }>
  >([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Creador Manual de Outfits
  const [isManualCreatorOpen, setIsManualCreatorOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualOccasion, setManualOccasion] = useState(OCCASIONS_LIST[1]);
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([]);

  // Estado del Planificador Semanal (7 días)
  const [dayOccasions, setDayOccasions] = useState<Record<string, string>>({});
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [weeklyGlobalNote, setWeeklyGlobalNote] = useState("");
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);

  // Estado de Maleta de Viaje
  const [tripDestination, setTripDestination] = useState("Roma");
  const [tripDays, setTripDays] = useState(4);
  const [tripLuggage, setTripLuggage] = useState("Maleta de cabina");
  const [tripActivities, setTripActivities] = useState("Turismo urbano, Cenas, Museos");
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripPlan | null>(null);

  // Ciudad buscada en el perfil
  const [cityInput, setCityInput] = useState(DEMO_PROFILE.city);
  const [isUpdatingCity, setIsUpdatingCity] = useState(false);

  // 1. Cargar datos iniciales (LocalStorage + Supabase si está configurado + Clima Open-Meteo)
  useEffect(() => {
    try {
      const savedGarments = localStorage.getItem(STORAGE_KEYS.GARMENTS);
      if (savedGarments) setGarments(JSON.parse(savedGarments));

      const savedOutfits = localStorage.getItem(STORAGE_KEYS.OUTFITS);
      if (savedOutfits) setOutfits(JSON.parse(savedOutfits));

      const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (savedPlans) setWeeklyPlans(JSON.parse(savedPlans));

      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setCityInput(parsedProfile.city);
      }

      const savedTrips = localStorage.getItem(STORAGE_KEYS.TRIPS);
      if (savedTrips) {
        const parsedTrips = JSON.parse(savedTrips);
        setTrips(parsedTrips);
        if (parsedTrips.length > 0) setActiveTrip(parsedTrips[0]);
      }
    } catch (e) {
      console.warn("Error loading local storage:", e);
    }

    loadSupabaseSession();
  }, []);

  // Cargar pronóstico meteorológico cuando cambia la latitud/longitud del perfil
  useEffect(() => {
    fetchWeeklyWeather(profile.latitude, profile.longitude).then((days) => {
      setWeatherDays(days);
      setDayOccasions((prev) => {
        const next = { ...prev };
        days.forEach((d, idx) => {
          if (!next[d.date]) {
            next[d.date] = idx >= 5 ? "Fin de Semana / Relax" : "Oficina / Trabajo";
          }
        });
        return next;
      });
    });
  }, [profile.latitude, profile.longitude]);

  // Inicializar sugerencia del día por defecto cuando están listas las prendas
  useEffect(() => {
    if (todaySuggestions.length === 0 && garments.length > 0) {
      setTodaySuggestions([
        {
          title: DEMO_OUTFITS[0].title,
          occasion: DEMO_OUTFITS[0].occasion,
          garment_ids: DEMO_OUTFITS[0].garment_ids,
          stylist_note: DEMO_OUTFITS[0].stylist_note,
        },
        {
          title: DEMO_OUTFITS[1].title,
          occasion: DEMO_OUTFITS[1].occasion,
          garment_ids: DEMO_OUTFITS[1].garment_ids,
          stylist_note: DEMO_OUTFITS[1].stylist_note,
        },
      ]);
    }
  }, [garments, todaySuggestions.length]);

  const loadSupabaseSession = async () => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email || null);

      const { data: dbGarments } = await supabase
        .from("garments")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbGarments && dbGarments.length > 0) {
        setGarments(dbGarments as Garment[]);
      }

      const { data: dbOutfits } = await supabase
        .from("outfits")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbOutfits && dbOutfits.length > 0) {
        setOutfits(dbOutfits as Outfit[]);
      }
    }
  };

  // Helpers de persistencia dual (Local + Supabase)
  const persistGarments = (next: Garment[]) => {
    setGarments(next);
    try {
      localStorage.setItem(STORAGE_KEYS.GARMENTS, JSON.stringify(next));
    } catch (e) {
      console.warn("Storage quota warning:", e);
    }
  };

  const persistOutfits = (next: Outfit[]) => {
    setOutfits(next);
    try {
      localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistWeeklyPlans = (next: DayPlan[]) => {
    setWeeklyPlans(next);
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistProfile = (next: UserProfile) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  // Guardar nueva prenda (con subida opcional a Supabase Storage)
  const handleAddGarment = async (
    newGarmentData: Omit<Garment, "id" | "created_at">,
    fileBlob?: Blob
  ) => {
    let finalImageUrl = newGarmentData.image_url;
    const supabase = createClient();

    if (supabase && userId && fileBlob) {
      const filePath = `${userId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("garments")
        .upload(filePath, fileBlob, { contentType: "image/png" });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from("garments")
          .getPublicUrl(filePath);
        if (pubData?.publicUrl) finalImageUrl = pubData.publicUrl;
      }
    }

    const created: Garment = {
      ...newGarmentData,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`,
      image_url: finalImageUrl,
      created_at: new Date().toISOString(),
    };

    if (supabase && userId) {
      await supabase.from("garments").insert({
        ...created,
        user_id: userId,
      });
    }

    persistGarments([created, ...garments]);
  };

  // Alternar estado "En lavadora / Sucio"
  const toggleDirty = async (id: string) => {
    const target = garments.find((g) => g.id === id);
    if (!target) return;
    const nextDirty = !target.is_dirty;

    const updated = garments.map((g) =>
      g.id === id ? { ...g, is_dirty: nextDirty } : g
    );
    persistGarments(updated);

    const supabase = createClient();
    if (supabase && userId) {
      await supabase.from("garments").update({ is_dirty: nextDirty }).eq("id", id);
    }
  };

  // Registrar que un conjunto se ha usado hoy (+1 uso a cada prenda)
  const markGarmentsAsWorn = async (garmentIds: string[]) => {
    const todayIso = new Date().toISOString().split("T")[0];
    const updated = garments.map((g) =>
      garmentIds.includes(g.id)
        ? {
            ...g,
            wear_count: (g.wear_count || 0) + 1,
            last_worn_at: todayIso,
          }
        : g
    );
    persistGarments(updated);
  };

  const deleteGarment = async (id: string) => {
    persistGarments(garments.filter((g) => g.id !== id));
    const supabase = createClient();
    if (supabase && userId) {
      await supabase.from("garments").delete().eq("id", id);
    }
  };

  // Intercambiar una sola prenda de un outfit por otra de la misma categoría (Swap)
  const handleSwapSingleGarment = (
    currentOutfitGarmentIds: string[],
    garmentToReplace: Garment,
    onUpdateIds: (newIds: string[]) => void
  ) => {
    const alternatives = garments.filter(
      (g) =>
        !g.is_dirty &&
        g.category === garmentToReplace.category &&
        g.id !== garmentToReplace.id
    );
    if (alternatives.length === 0) return;
    const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
    const nextIds = currentOutfitGarmentIds.map((id) =>
      id === garmentToReplace.id ? randomAlt.id : id
    );
    onUpdateIds(nextIds);
  };

  // Generar sugerencias para HOY con IA
  const handleGenerateTodayOutfits = async () => {
    setIsGeneratingToday(true);
    try {
      const res = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garments,
          occasion: todayOccasion,
          weather: weatherDays[0],
          userNote: todayNote,
          profile,
        }),
      });
      const data = await res.json();
      if (data.outfits && data.outfits.length > 0) {
        setTodaySuggestions(data.outfits);
        setActiveSuggestionIdx(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingToday(false);
    }
  };

  // Guardar un outfit en Favoritos
  const handleSaveOutfitToFavorites = async (item: {
    title: string;
    occasion: string;
    garment_ids: string[];
    stylist_note: string;
  }) => {
    const todayW = weatherDays[0];
    const newOutfit: Outfit = {
      id: `outfit-${Date.now()}`,
      title: item.title,
      occasion: item.occasion,
      season: "Todo el año",
      garment_ids: item.garment_ids,
      stylist_note: item.stylist_note,
      weather_summary: todayW ? `${todayW.tempMax}°C · ${todayW.conditionText}` : undefined,
      is_favorite: true,
      is_ai_generated: true,
      created_at: new Date().toISOString(),
    };
    persistOutfits([newOutfit, ...outfits]);
  };

  // Generar Planificación Semanal completa (7 días) con IA
  const handleGenerateWeeklyPlan = async () => {
    if (weatherDays.length === 0) return;
    setIsGeneratingWeek(true);
    try {
      const daysPayload = weatherDays.map((w) => ({
        date: w.date,
        dayName: w.dayName,
        occasion: dayOccasions[w.date] || "Oficina / Trabajo",
        userNote: dayNotes[w.date] || "",
        weather: w,
      }));

      const res = await fetch("/api/ai/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garments,
          days: daysPayload,
          globalNote: weeklyGlobalNote,
          profile,
        }),
      });
      const data = await res.json();
      if (data.plans && Array.isArray(data.plans)) {
        const mappedPlans: DayPlan[] = data.plans.map(
          (
            p: {
              planned_date: string;
              occasion: string;
              title: string;
              garment_ids: string[];
              stylist_note: string;
            },
            idx: number
          ) => {
            const w = weatherDays[idx] || weatherDays[0];
            return {
              id: `plan-${p.planned_date}`,
              planned_date: p.planned_date,
              day_label: w?.dayName,
              occasion: p.occasion,
              user_note: dayNotes[p.planned_date] || "",
              garment_ids: p.garment_ids,
              title: p.title,
              stylist_note: p.stylist_note,
              temp_min: w?.tempMin ?? 14,
              temp_max: w?.tempMax ?? 21,
              weather_condition: w?.conditionText ?? "Templado",
              is_worn: false,
            };
          }
        );
        persistWeeklyPlans(mappedPlans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  // Generar Maleta Cápsula de Viaje con IA
  const handleGenerateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingTrip(true);
    try {
      // Consultar clima real del destino si existe en Open-Meteo
      let weatherHint = "Templado 15°C - 22°C";
      const geo = await geocodeCity(tripDestination);
      if (geo) {
        const destWeather = await fetchWeeklyWeather(geo.latitude, geo.longitude);
        if (destWeather.length > 0) {
          weatherHint = `${destWeather[0].conditionText}, mín ${destWeather[0].tempMin}°C / máx ${destWeather[0].tempMax}°C`;
        }
      }

      const acts = tripActivities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/ai/trip-packer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garments,
          destination: tripDestination,
          daysCount: tripDays,
          luggageType: tripLuggage,
          activities: acts.length > 0 ? acts : ["Turismo", "Cena"],
          weatherHint,
        }),
      });
      const data = await res.json();
      if (data.capsule_garment_ids) {
        const today = new Date();
        const end = new Date(today);
        end.setDate(today.getDate() + tripDays);

        const createdTrip: TripPlan = {
          id: `trip-${Date.now()}`,
          destination: tripDestination,
          start_date: today.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
          days_count: tripDays,
          luggage_type: tripLuggage,
          activities: acts,
          capsule_garment_ids: data.capsule_garment_ids,
          checked_garment_ids: [],
          daily_looks: data.daily_looks || [],
          stylist_summary: data.stylist_summary || "",
          created_at: new Date().toISOString(),
        };

        const nextTrips = [createdTrip, ...trips];
        setTrips(nextTrips);
        setActiveTrip(createdTrip);
        localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(nextTrips));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  // Actualizar ciudad y coordenadas para el clima Open-Meteo
  const handleUpdateCity = async () => {
    if (!cityInput.trim()) return;
    setIsUpdatingCity(true);
    try {
      const geo = await geocodeCity(cityInput.trim());
      if (geo) {
        const nextProfile: UserProfile = {
          ...profile,
          city: geo.name,
          latitude: geo.latitude,
          longitude: geo.longitude,
        };
        persistProfile(nextProfile);
        setCityInput(geo.name);
      }
    } finally {
      setIsUpdatingCity(false);
    }
  };

  // Prendas filtradas en la galería
  const filteredGarments = useMemo(() => {
    return garments.filter((g) => {
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (laundryFilter === "clean" && g.is_dirty) return false;
      if (laundryFilter === "dirty" && !g.is_dirty) return false;
      if (
        searchQuery.trim() &&
        !g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.color_primary.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [garments, categoryFilter, laundryFilter, searchQuery]);

  // Métricas de Estadísticas y Sostenibilidad
  const stats = useMemo(() => {
    const totalValue = garments.reduce((acc, g) => acc + (g.price || 0), 0);
    const totalWears = garments.reduce((acc, g) => acc + (g.wear_count || 0), 0);
    const cleanCount = garments.filter((g) => !g.is_dirty).length;
    const dirtyCount = garments.filter((g) => g.is_dirty).length;

    const withCpu = garments
      .filter((g) => g.price && g.price > 0)
      .map((g) => ({
        ...g,
        cpu: (g.price || 0) / Math.max(1, g.wear_count),
      }))
      .sort((a, b) => a.cpu - b.cpu);

    const leastWorn = [...garments].sort((a, b) => a.wear_count - b.wear_count).slice(0, 4);

    return {
      totalValue,
      totalWears,
      cleanCount,
      dirtyCount,
      bestCpu: withCpu.slice(0, 4),
      leastWorn,
    };
  }, [garments]);

  const todayWeather = weatherDays[0];
  const currentSuggestion = todaySuggestions[activeSuggestionIdx] || todaySuggestions[0];
  const currentSuggestionGarments = useMemo(() => {
    if (!currentSuggestion) return [];
    return currentSuggestion.garment_ids
      .map((id) => garments.find((g) => g.id === id))
      .filter((g): g is Garment => Boolean(g));
  }, [currentSuggestion, garments]);

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-12">
      {/* BARRA SUPERIOR EDITORIAL */}
      <header className="sticky top-0 z-30 bg-editorial-bg/90 backdrop-blur-md border-b border-editorial-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.18em] font-semibold text-editorial-ink">
              ARMARI
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-editorial-sand text-editorial-muted border border-editorial-border">
              Atelier & Estilista IA
            </span>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-editorial-canvas p-1 rounded-full border border-editorial-border">
            <NavTabButton
              active={activeTab === "stylist"}
              onClick={() => setActiveTab("stylist")}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="Estilista Hoy"
            />
            <NavTabButton
              active={activeTab === "wardrobe"}
              onClick={() => setActiveTab("wardrobe")}
              icon={<Shirt className="w-3.5 h-3.5" />}
              label={`Mi Armario (${garments.length})`}
            />
            <NavTabButton
              active={activeTab === "planner"}
              onClick={() => setActiveTab("planner")}
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Semana IA"
            />
            <NavTabButton
              active={activeTab === "trips"}
              onClick={() => setActiveTab("trips")}
              icon={<Luggage className="w-3.5 h-3.5" />}
              label="Maleta Viaje"
            />
            <NavTabButton
              active={activeTab === "stats"}
              onClick={() => setActiveTab("stats")}
              icon={<BarChart3 className="w-3.5 h-3.5" />}
              label="Estadísticas"
            />
          </nav>

          {/* Clima + Perfil + Añadir Prenda */}
          <div className="flex items-center gap-2">
            {todayWeather && (
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-editorial-canvas border border-editorial-border text-xs text-editorial-ink hover:border-editorial-ink/40 transition-colors"
                title="Cambiar ciudad y preferencias de estilo"
              >
                <CloudSun className="w-3.5 h-3.5 text-editorial-gold" />
                <span className="font-medium">{profile.city}</span>
                <span className="text-editorial-muted">
                  {todayWeather.tempMax}°C
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-wider hover:bg-black transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Subir Prenda
            </button>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 rounded-full bg-editorial-canvas border border-editorial-border text-editorial-ink hover:bg-editorial-sand transition-colors"
              title={userEmail ? `Conectado como ${userEmail}` : "Iniciar sesión / Cuenta"}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel desplegable de Preferencias de Estilo, Clima y Regla de Rotación */}
        {isProfileOpen && (
          <div className="border-t border-editorial-border bg-editorial-canvas px-4 sm:px-6 py-5 shadow-lg">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-1.5">
                  Ciudad para el Pronóstico Real (Open-Meteo)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-3.5 h-3.5 text-editorial-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Barcelona, Madrid, Valencia..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateCity}
                    disabled={isUpdatingCity}
                    className="px-3.5 py-2 rounded-xl bg-editorial-ink text-white text-xs uppercase tracking-wider"
                  >
                    {isUpdatingCity ? "..." : "Actualizar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-1.5">
                  Regla de no repetir prenda (Rotación mínima)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={profile.min_days_between_wears}
                    onChange={(e) =>
                      persistProfile({
                        ...profile,
                        min_days_between_wears: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-editorial-ink"
                  />
                  <span className="text-xs font-semibold text-editorial-ink min-w-[70px]">
                    {profile.min_days_between_wears} días
                  </span>
                </div>
                <p className="text-[11px] text-editorial-muted mt-1">
                  La IA evitará sugerir prendas usadas en los últimos {profile.min_days_between_wears} días.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-1.5">
                  Tus Estilos de Referencia
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_TAGS.map((tag) => {
                    const active = profile.style_preferences.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const exists = profile.style_preferences.includes(tag);
                          const next = exists
                            ? profile.style_preferences.filter((t) => t !== tag)
                            : [...profile.style_preferences, tag];
                          if (next.length > 0) {
                            persistProfile({ ...profile, style_preferences: next });
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          active
                            ? "bg-editorial-ink text-white border-editorial-ink"
                            : "bg-editorial-bg text-editorial-muted border-editorial-border"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ===============================================================
            PESTAÑA 1: ESTILISTA DE HOY & OUTFITS FAVORITOS
           =============================================================== */}
        {activeTab === "stylist" && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Panel de Control del Estilista (Izquierda) */}
              <div className="lg:col-span-5 bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-5 shadow-xs">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                    Asesoramiento Diario con IA
                  </span>
                  <h1 className="font-serif text-3xl text-editorial-ink mt-1">
                    ¿Qué nos ponemos hoy?
                  </h1>
                </div>

                {/* Resumen Climático de Hoy */}
                {todayWeather && (
                  <div className="p-4 rounded-2xl bg-editorial-sand/60 border border-editorial-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-editorial-border">
                        <CloudSun className="w-5 h-5 text-editorial-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-editorial-ink">
                          {profile.city} · {todayWeather.conditionText}
                        </p>
                        <p className="text-[11px] text-editorial-muted">
                          Mín {todayWeather.tempMin}°C / Máx {todayWeather.tempMax}°C
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-editorial-muted">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      <span>{todayWeather.precipitationProbability}% lluvia</span>
                    </div>
                  </div>
                )}

                {/* Selector de Ocasión */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-2">
                    Ocasión principal de hoy
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS_LIST.map((occ) => (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setTodayOccasion(occ)}
                        className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
                          todayOccasion === occ
                            ? "bg-editorial-ink text-white border-editorial-ink"
                            : "bg-editorial-bg text-editorial-muted border-editorial-border hover:border-editorial-ink/40"
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nota libre para Gemini */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1.5">
                    Nota libre para tu estilista IA (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={todayNote}
                    onChange={(e) => setTodayNote(e.target.value)}
                    placeholder="Ej. Hoy tengo reunión importante pero luego voy a cenar y quiero ir cómodo..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-editorial-bg border border-editorial-border text-xs focus:outline-none focus:border-editorial-ink"
                  />
                </div>

                <div className="text-[11px] text-editorial-muted flex items-center justify-between pt-1">
                  <span>Prendas limpias disponibles: {stats.cleanCount}</span>
                  <span>Rotación: {profile.min_days_between_wears} días</span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTodayOutfits}
                  disabled={isGeneratingToday}
                  className="w-full py-3.5 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm"
                >
                  {isGeneratingToday ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Combinando tu armario con IA...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" /> Sugerir Outfits para Hoy
                    </>
                  )}
                </button>
              </div>

              {/* Collage Moodboard Sugerido (Derecha) */}
              <div className="lg:col-span-7 space-y-4">
                {todaySuggestions.length > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {todaySuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSuggestionIdx(idx)}
                          className={`text-xs px-4 py-1.5 rounded-full border transition-all ${
                            activeSuggestionIdx === idx
                              ? "bg-editorial-ink text-white border-editorial-ink"
                              : "bg-white text-editorial-muted border-editorial-border"
                          }`}
                        >
                          Propuesta {idx + 1}
                        </button>
                      ))}
                    </div>

                    {currentSuggestion && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveOutfitToFavorites(currentSuggestion)}
                          className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-editorial-border text-editorial-ink hover:bg-editorial-sand flex items-center gap-1.5"
                        >
                          <Heart className="w-3.5 h-3.5 text-editorial-terracotta" /> Guardar Favorito
                        </button>
                        <button
                          type="button"
                          onClick={() => markGarmentsAsWorn(currentSuggestion.garment_ids)}
                          className="text-xs px-3.5 py-1.5 rounded-full bg-editorial-sage text-white flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Lo llevo puesto hoy
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentSuggestion && (
                  <OutfitMoodboard
                    garments={currentSuggestionGarments}
                    title={currentSuggestion.title}
                    occasion={currentSuggestion.occasion}
                    stylistNote={currentSuggestion.stylist_note}
                    weatherBadge={
                      todayWeather
                        ? `${todayWeather.tempMin}°-${todayWeather.tempMax}°C · ${todayWeather.conditionText}`
                        : undefined
                    }
                    onSwapGarment={(garmentToSwap) =>
                      handleSwapSingleGarment(
                        currentSuggestion.garment_ids,
                        garmentToSwap,
                        (newIds) => {
                          const updated = todaySuggestions.map((s, i) =>
                            i === activeSuggestionIdx ? { ...s, garment_ids: newIds } : s
                          );
                          setTodaySuggestions(updated);
                        }
                      )
                    }
                  />
                )}
              </div>
            </div>

            {/* SECCIÓN DE OUTFITS FAVORITOS Y CREADOR MANUAL */}
            <div className="pt-6 border-t border-editorial-border space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                    Lookbook Personal
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-editorial-ink">
                    Outfits Guardados y Favoritos ({outfits.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualCreatorOpen(!isManualCreatorOpen)}
                  className="px-4 py-2.5 rounded-full bg-editorial-canvas border border-editorial-border text-xs uppercase tracking-wider text-editorial-ink hover:border-editorial-ink flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Crear Outfit Manualmente
                </button>
              </div>

              {/* Creador manual desplegable */}
              {isManualCreatorOpen && (
                <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-4">
                  <h3 className="font-serif text-xl text-editorial-ink">
                    Diseñar nuevo conjunto manual
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Nombre del look (ej. Viernes Casual Oficina)"
                      className="px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                    />
                    <select
                      value={manualOccasion}
                      onChange={(e) => setManualOccasion(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                    >
                      {OCCASIONS_LIST.map((occ) => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-editorial-muted">
                    Toca las prendas de tu armario que quieras incluir en el collage ({manualSelectedIds.length} seleccionadas):
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1">
                    {garments.map((g) => {
                      const selected = manualSelectedIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() =>
                            setManualSelectedIds(
                              selected
                                ? manualSelectedIds.filter((id) => id !== g.id)
                                : [...manualSelectedIds, g.id]
                            )
                          }
                          className={`cursor-pointer p-2 rounded-xl border text-center transition-all ${
                            selected
                              ? "border-editorial-ink bg-editorial-sand/70 ring-1 ring-editorial-ink"
                              : "border-editorial-border bg-white"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={g.image_url}
                            alt={g.name}
                            className="h-16 mx-auto object-contain mb-1"
                          />
                          <p className="text-[10px] truncate text-editorial-ink">{g.name}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsManualCreatorOpen(false)}
                      className="px-4 py-2 rounded-full text-xs text-editorial-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={manualSelectedIds.length < 2}
                      onClick={() => {
                        const created: Outfit = {
                          id: `outfit-manual-${Date.now()}`,
                          title: manualTitle.trim() || `Conjunto ${manualOccasion}`,
                          occasion: manualOccasion,
                          season: "Todo el año",
                          garment_ids: manualSelectedIds,
                          stylist_note: "Conjunto diseñado a medida en tu atelier personal.",
                          is_favorite: true,
                          is_ai_generated: false,
                          created_at: new Date().toISOString(),
                        };
                        persistOutfits([created, ...outfits]);
                        setManualSelectedIds([]);
                        setManualTitle("");
                        setIsManualCreatorOpen(false);
                      }}
                      className="px-5 py-2 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-wider disabled:opacity-40"
                    >
                      Guardar Outfit
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de Outfits Favoritos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outfits.map((outfit) => {
                  const outfitGarments = outfit.garment_ids
                    .map((id) => garments.find((g) => g.id === id))
                    .filter((g): g is Garment => Boolean(g));
                  return (
                    <div key={outfit.id} className="relative">
                      <OutfitMoodboard
                        garments={outfitGarments}
                        title={outfit.title}
                        occasion={outfit.occasion}
                        stylistNote={outfit.stylist_note}
                        weatherBadge={outfit.weather_summary}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() =>
                          persistOutfits(outfits.filter((o) => o.id !== outfit.id))
                        }
                        title="Eliminar de favoritos"
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-white text-editorial-muted hover:text-editorial-terracotta border border-editorial-border"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            PESTAÑA 2: MI ARMARIO (GALERÍA, LAVANDERÍA Y SUBIDA IA)
           =============================================================== */}
        {activeTab === "wardrobe" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                  Inventario Digital sin Fondo
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-editorial-ink">
                  Mi Armario ({garments.length} prendas)
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Añadir Prenda con IA
              </button>
            </div>

            {/* Barra de Filtros y Lavandería */}
            <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Categorías */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                      categoryFilter === "all"
                        ? "bg-editorial-ink text-white border-editorial-ink"
                        : "bg-editorial-bg text-editorial-muted border-editorial-border"
                    }`}
                  >
                    Todas ({garments.length})
                  </button>
                  {(Object.entries(CATEGORY_LABELS) as [GarmentCategory, string][]).map(
                    ([catKey, catLabel]) => (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategoryFilter(catKey)}
                        className={`text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                          categoryFilter === catKey
                            ? "bg-editorial-ink text-white border-editorial-ink"
                            : "bg-editorial-bg text-editorial-muted border-editorial-border"
                        }`}
                      >
                        {catLabel}
                      </button>
                    )
                  )}
                </div>

                {/* Buscador y Estado de Lavadora */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 text-editorial-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar color, prenda..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-editorial-bg border border-editorial-border text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setLaundryFilter(
                        laundryFilter === "all"
                          ? "clean"
                          : laundryFilter === "clean"
                          ? "dirty"
                          : "all"
                      )
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 whitespace-nowrap ${
                      laundryFilter === "dirty"
                        ? "bg-editorial-terracotta text-white border-editorial-terracotta"
                        : laundryFilter === "clean"
                        ? "bg-editorial-sage text-white border-editorial-sage"
                        : "bg-editorial-bg text-editorial-ink border-editorial-border"
                    }`}
                  >
                    <WashingMachine className="w-3.5 h-3.5" />
                    {laundryFilter === "all"
                      ? `Lavandería (${stats.dirtyCount} sucias)`
                      : laundryFilter === "clean"
                      ? "Solo Limpias"
                      : "En Lavadora"}
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Editorial de Prendas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredGarments.map((garment) => (
                <div
                  key={garment.id}
                  className={`group bg-editorial-canvas border rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between ${
                    garment.is_dirty
                      ? "border-editorial-terracotta/50 opacity-80"
                      : "border-editorial-border"
                  }`}
                >
                  <div>
                    {/* Lienzo de la prenda sin fondo */}
                    <div className="relative h-52 bg-gradient-to-b from-white to-[#F6F3EC] p-4 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={garment.image_url}
                        alt={garment.name}
                        className="max-h-44 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Badge estado Lavandería */}
                      <button
                        type="button"
                        onClick={() => toggleDirty(garment.id)}
                        title={
                          garment.is_dirty
                            ? "Marcar como limpia y disponible"
                            : "Enviar a la lavadora (no sugerir hasta lavar)"
                        }
                        className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border transition-all ${
                          garment.is_dirty
                            ? "bg-editorial-terracotta text-white border-editorial-terracotta"
                            : "bg-white/90 text-editorial-sage border-editorial-border hover:border-editorial-sage"
                        }`}
                      >
                        <WashingMachine className="w-3 h-3" />
                        {garment.is_dirty ? "En lavadora" : "Limpia"}
                      </button>

                      {/* Eliminar prenda */}
                      <button
                        type="button"
                        onClick={() => deleteGarment(garment.id)}
                        title="Eliminar prenda"
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-editorial-muted hover:text-editorial-terracotta border border-editorial-border"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Metadatos de la prenda */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-editorial-muted">
                        <span>{garment.subcategory}</span>
                        {garment.brand && <span className="truncate">{garment.brand}</span>}
                      </div>
                      <h3 className="font-serif text-lg text-editorial-ink leading-snug truncate">
                        {garment.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-editorial-muted">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: garment.color_hex }}
                        />
                        <span>{garment.color_primary}</span>
                        <span>·</span>
                        <span>{garment.fabric}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie con contador de usos y coste por uso */}
                  <div className="px-4 py-2.5 bg-editorial-bg/60 border-t border-editorial-border/70 flex items-center justify-between text-[11px] text-editorial-muted">
                    <span>{garment.wear_count} usos</span>
                    {garment.price ? (
                      <span className="font-medium text-editorial-ink">
                        {(garment.price / Math.max(1, garment.wear_count)).toFixed(1)}€ / uso
                      </span>
                    ) : (
                      <span>Abrigo {garment.warmth_level}/5</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===============================================================
            PESTAÑA 3: PLANIFICADOR SEMANAL IA (7 DÍAS + CLIMA + OCASIÓN)
           =============================================================== */}
        {activeTab === "planner" && (
          <div className="space-y-8">
            <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                    Calendario Inteligente · {profile.city}
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl text-editorial-ink mt-1">
                    Planificador Semanal con IA
                  </h1>
                  <p className="text-xs text-editorial-muted mt-1 max-w-2xl">
                    Configura la actividad de cada día y deja que Gemini 2.5 Flash combine tu armario cruzando la previsión meteorológica real de los próximos 7 días sin repetir prendas consecutivas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateWeeklyPlan}
                  disabled={isGeneratingWeek}
                  className="px-6 py-3 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm"
                >
                  {isGeneratingWeek ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Planificando los 7 días...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" /> Generar Semana Completa con IA
                    </>
                  )}
                </button>
              </div>

              {/* Nota global para la semana */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={weeklyGlobalNote}
                    onChange={(e) => setWeeklyGlobalNote(e.target.value)}
                    placeholder="Nota global para la IA (ej. Esta semana quiero priorizar tonos neutros y calzado muy cómodo)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                  />
                </div>
                <div className="flex items-center justify-end text-xs text-editorial-muted gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Sin repetir prendas en {profile.min_days_between_wears} días</span>
                </div>
              </div>

              {/* Configurador rápido de los 7 días (Clima + Ocasión) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
                {weatherDays.map((w) => (
                  <div
                    key={w.date}
                    className="p-3 rounded-2xl bg-editorial-bg border border-editorial-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-sm text-editorial-ink">
                        {w.dayName}
                      </span>
                      <span className="text-[11px] font-medium text-editorial-muted">
                        {w.tempMin}°/{w.tempMax}°
                      </span>
                    </div>
                    <p className="text-[10px] text-editorial-muted truncate" title={w.conditionText}>
                      {w.conditionText}
                    </p>
                    <select
                      value={dayOccasions[w.date] || OCCASIONS_LIST[0]}
                      onChange={(e) =>
                        setDayOccasions({ ...dayOccasions, [w.date]: e.target.value })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-editorial-border text-[11px]"
                    >
                      {OCCASIONS_LIST.map((occ) => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={dayNotes[w.date] || ""}
                      onChange={(e) =>
                        setDayNotes({ ...dayNotes, [w.date]: e.target.value })
                      }
                      placeholder="Nota del día..."
                      className="w-full px-2 py-1 rounded-lg bg-white border border-editorial-border text-[10px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado de los 7 días planificados */}
            {weeklyPlans.length === 0 ? (
              <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-12 text-center space-y-3">
                <Calendar className="w-10 h-10 text-editorial-muted mx-auto stroke-1" />
                <h3 className="font-serif text-2xl text-editorial-ink">
                  Tu semana está lista para planificarse
                </h3>
                <p className="text-xs text-editorial-muted max-w-md mx-auto">
                  Pulsa el botón superior «Generar Semana Completa con IA» y crearemos los 7 conjuntos combinando tu ropa según el clima de {profile.city}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weeklyPlans.map((plan) => {
                  const planGarments = plan.garment_ids
                    .map((id) => garments.find((g) => g.id === id))
                    .filter((g): g is Garment => Boolean(g));
                  return (
                    <div key={plan.planned_date} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-editorial-ink">
                            {plan.day_label || plan.planned_date}
                          </span>
                          <span className="text-xs text-editorial-muted ml-2">
                            ({plan.planned_date})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = weeklyPlans.map((p) =>
                              p.planned_date === plan.planned_date
                                ? { ...p, is_worn: !p.is_worn }
                                : p
                            );
                            persistWeeklyPlans(next);
                            if (!plan.is_worn) {
                              markGarmentsAsWorn(plan.garment_ids);
                            }
                          }}
                          className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                            plan.is_worn
                              ? "bg-editorial-sage text-white border-editorial-sage"
                              : "bg-white text-editorial-ink border-editorial-border hover:border-editorial-ink"
                          }`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          {plan.is_worn ? "Usado (+1 uso registrado)" : "Confirmar uso"}
                        </button>
                      </div>

                      <OutfitMoodboard
                        garments={planGarments}
                        title={plan.title}
                        occasion={plan.occasion}
                        stylistNote={plan.stylist_note}
                        weatherBadge={`${plan.temp_min}°-${plan.temp_max}°C · ${plan.weather_condition}`}
                        compact
                        onSwapGarment={(garmentToSwap) =>
                          handleSwapSingleGarment(
                            plan.garment_ids,
                            garmentToSwap,
                            (newIds) => {
                              const next = weeklyPlans.map((p) =>
                                p.planned_date === plan.planned_date
                                  ? { ...p, garment_ids: newIds }
                                  : p
                              );
                              persistWeeklyPlans(next);
                            }
                          )
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===============================================================
            PESTAÑA 4: MODO MALETA DE VIAJE (ARMARIO CÁPSULA IA)
           =============================================================== */}
        {activeTab === "trips" && (
          <div className="space-y-8">
            <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6">
              <div className="mb-5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                  Travel Capsule Wardrobe
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-editorial-ink mt-1">
                  Maleta Inteligente de Viaje
                </h1>
                <p className="text-xs text-editorial-muted mt-1">
                  Dinos a dónde viajas y cuántos días. La IA seleccionará el mínimo número de prendas de tu armario que combinen todas entre sí y armará los looks diarios del viaje.
                </p>
              </div>

              <form
                onSubmit={handleGenerateTrip}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
              >
                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                    Destino
                  </label>
                  <input
                    type="text"
                    required
                    value={tripDestination}
                    onChange={(e) => setTripDestination(e.target.value)}
                    placeholder="Roma, París, Tokio..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                    Duración (Días)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={14}
                    value={tripDays}
                    onChange={(e) => setTripDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                    Tipo de Equipaje
                  </label>
                  <select
                    value={tripLuggage}
                    onChange={(e) => setTripLuggage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                  >
                    <option value="Mochila ligera">Mochila ligera</option>
                    <option value="Maleta de cabina">Maleta de cabina</option>
                    <option value="Maleta facturada">Maleta facturada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                    Planes / Actividades
                  </label>
                  <input
                    type="text"
                    value={tripActivities}
                    onChange={(e) => setTripActivities(e.target.value)}
                    placeholder="Turismo, Cena, Reunión..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-editorial-bg border border-editorial-border text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingTrip}
                  className="py-2.5 px-5 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all h-[40px]"
                >
                  {isGeneratingTrip ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creando...
                    </>
                  ) : (
                    <>
                      <Luggage className="w-3.5 h-3.5" /> Armar Maleta IA
                    </>
                  )}
                </button>
              </form>
            </div>

            {activeTrip && (
              <div className="space-y-6">
                {/* Checklist de prendas cápsula para meter en la maleta */}
                <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-widest text-editorial-muted">
                        Checklist de Equipaje · {activeTrip.luggage_type}
                      </span>
                      <h2 className="font-serif text-2xl text-editorial-ink">
                        Cápsula para {activeTrip.destination} ({activeTrip.capsule_garment_ids.length} prendas para {activeTrip.days_count} días)
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-editorial-muted bg-editorial-sand/60 p-3.5 rounded-xl border border-editorial-border">
                    {activeTrip.stylist_summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {activeTrip.capsule_garment_ids.map((id) => {
                      const g = garments.find((item) => item.id === id);
                      if (!g) return null;
                      const checked = activeTrip.checked_garment_ids.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            const nextChecked = checked
                              ? activeTrip.checked_garment_ids.filter((cid) => cid !== g.id)
                              : [...activeTrip.checked_garment_ids, g.id];
                            const updatedTrip = {
                              ...activeTrip,
                              checked_garment_ids: nextChecked,
                            };
                            setActiveTrip(updatedTrip);
                          }}
                          className={`cursor-pointer p-3 rounded-2xl border text-center transition-all ${
                            checked
                              ? "bg-editorial-sage/10 border-editorial-sage"
                              : "bg-white border-editorial-border"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={g.image_url}
                            alt={g.name}
                            className="h-20 mx-auto object-contain mb-2"
                          />
                          <p className="text-xs font-medium text-editorial-ink truncate">
                            {g.name}
                          </p>
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-editorial-muted">
                            {checked ? "✓ En la maleta" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Outfits diarios del viaje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTrip.daily_looks.map((look) => {
                    const lookGarments = look.garment_ids
                      .map((id) => garments.find((g) => g.id === id))
                      .filter((g): g is Garment => Boolean(g));
                    return (
                      <OutfitMoodboard
                        key={look.day}
                        garments={lookGarments}
                        title={look.title}
                        occasion={`Día ${look.day} · ${look.activity}`}
                        stylistNote={look.stylist_note}
                        compact
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===============================================================
            PESTAÑA 5: ESTADÍSTICAS Y SOSTENIBILIDAD DEL ARMARIO
           =============================================================== */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-editorial-muted block">
                Analítica & Moda Consciente
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-editorial-ink mt-1">
                Estadísticas y Amortización de tu Armario
              </h1>
            </div>

            {/* KPIs Superiores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-editorial-muted flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Total Prendas
                </span>
                <p className="font-serif text-3xl text-editorial-ink mt-2">
                  {garments.length}
                </p>
                <p className="text-xs text-editorial-muted mt-1">
                  {stats.cleanCount} limpias · {stats.dirtyCount} en lavadora
                </p>
              </div>

              <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-editorial-muted flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-editorial-sage" /> Valor Estimado
                </span>
                <p className="font-serif text-3xl text-editorial-ink mt-2">
                  {stats.totalValue.toFixed(0)}€
                </p>
                <p className="text-xs text-editorial-muted mt-1">
                  Coste medio:{" "}
                  {(stats.totalValue / Math.max(1, stats.totalWears)).toFixed(2)}€ por uso
                </p>
              </div>

              <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-editorial-muted flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Usos Registrados
                </span>
                <p className="font-serif text-3xl text-editorial-ink mt-2">
                  {stats.totalWears}
                </p>
                <p className="text-xs text-editorial-muted mt-1">
                  Rotación activa sostenible
                </p>
              </div>

              <div className="bg-editorial-canvas border border-editorial-border rounded-2xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-editorial-muted flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-editorial-terracotta" /> Outfits Guardados
                </span>
                <p className="font-serif text-3xl text-editorial-ink mt-2">
                  {outfits.length}
                </p>
                <p className="text-xs text-editorial-muted mt-1">
                  Combinaciones listas en 1 toque
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ranking Mejor Coste Por Uso */}
              <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-4">
                <h2 className="font-serif text-2xl text-editorial-ink">
                  Prendas Más Amortizadas (Menor Coste por Uso)
                </h2>
                <div className="space-y-3">
                  {stats.bestCpu.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-editorial-bg border border-editorial-border"
                    >
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.image_url}
                          alt={g.name}
                          className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-editorial-border"
                        />
                        <div>
                          <p className="text-xs font-semibold text-editorial-ink">{g.name}</p>
                          <p className="text-[11px] text-editorial-muted">
                            Precio: {g.price}€ · {g.wear_count} usos
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-editorial-sage/15 text-editorial-sage">
                        {g.cpu.toFixed(2)}€ / uso
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prendas con Menos Rotación (Para rescatar con IA) */}
              <div className="bg-editorial-canvas border border-editorial-border rounded-3xl p-6 space-y-4">
                <h2 className="font-serif text-2xl text-editorial-ink flex items-center gap-2">
                  <Clock className="w-5 h-5 text-editorial-gold" /> Prendas con Menor Uso
                </h2>
                <div className="space-y-3">
                  {stats.leastWorn.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-editorial-bg border border-editorial-border"
                    >
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.image_url}
                          alt={g.name}
                          className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-editorial-border"
                        />
                        <div>
                          <p className="text-xs font-semibold text-editorial-ink">{g.name}</p>
                          <p className="text-[11px] text-editorial-muted">
                            Último uso: {g.last_worn_at || "Aún sin estrenar"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-editorial-sand text-editorial-ink">
                        {g.wear_count} usos
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE-FIRST (PWA) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-editorial-canvas/95 backdrop-blur-md border-t border-editorial-border px-3 py-2 flex items-center justify-around">
        <MobileNavButton
          active={activeTab === "stylist"}
          onClick={() => setActiveTab("stylist")}
          icon={<Sparkles className="w-5 h-5" />}
          label="Hoy IA"
        />
        <MobileNavButton
          active={activeTab === "wardrobe"}
          onClick={() => setActiveTab("wardrobe")}
          icon={<Shirt className="w-5 h-5" />}
          label="Armario"
        />

        {/* Botón Central Destacado: Cámara / Subir Prenda */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="-mt-6 w-13 h-13 rounded-full bg-editorial-ink text-white shadow-lg flex items-center justify-center border-4 border-editorial-bg"
          aria-label="Añadir prenda"
        >
          <Plus className="w-6 h-6" />
        </button>

        <MobileNavButton
          active={activeTab === "planner"}
          onClick={() => setActiveTab("planner")}
          icon={<Calendar className="w-5 h-5" />}
          label="Semana"
        />
        <MobileNavButton
          active={activeTab === "trips"}
          onClick={() => setActiveTab("trips")}
          icon={<Luggage className="w-5 h-5" />}
          label="Viajes"
        />
      </nav>

      {/* MODALES */}
      <AddGarmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddGarment}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadSupabaseSession}
      />
    </div>
  );
}

function NavTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${
        active
          ? "bg-editorial-ink text-white font-medium shadow-xs"
          : "text-editorial-muted hover:text-editorial-ink"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] transition-colors ${
        active ? "text-editorial-ink font-semibold" : "text-editorial-muted"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
