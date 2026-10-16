-- =============================================================================
-- ARMARI - ESQUEMA DE BASE DE DATOS Y STORAGE (SUPABASE POSTGRESQL)
-- Instrucciones: Selecciona TODO este texto (Cmd+A), pégalo en el "SQL Editor"
-- de Supabase y pulsa "Run" (sin tener ningún texto seleccionado con el ratón).
-- =============================================================================

-- 1. Tabla de Perfiles de Usuario (Preferencias de Estilo y Clima)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  city text default 'Barcelona',
  latitude double precision default 41.3888,
  longitude double precision default 2.1590,
  style_preferences text[] default array['Minimalista', 'Editorial', 'Casual Elegante'],
  favorite_colors text[] default array['Negro', 'Blanco Roto', 'Beige', 'Azul Marino'],
  avoid_colors text[] default array[]::text[],
  min_days_between_wears integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Prendas del Armario (Garments)
create table if not exists public.garments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null check (category in ('top', 'bottom', 'full_body', 'outerwear', 'shoes', 'accessory')),
  subcategory text not null,
  color_primary text not null,
  color_hex text default '#141413',
  colors_secondary text[] default array[]::text[],
  pattern text default 'Liso',
  fabric text default 'Algodón',
  seasons text[] default array['Todo el año'],
  occasions text[] default array['Casual'],
  warmth_level integer default 3 check (warmth_level between 1 and 5),
  brand text,
  price numeric(10, 2),
  image_url text not null,
  is_dirty boolean default false not null,
  is_favorite boolean default false not null,
  wear_count integer default 0 not null,
  last_worn_at date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Outfits (Conjuntos creados por IA o por el usuario)
create table if not exists public.outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  occasion text not null default 'Casual',
  season text default 'Todo el año',
  garment_ids uuid[] not null default array[]::uuid[],
  stylist_note text,
  weather_summary text,
  is_favorite boolean default false not null,
  is_ai_generated boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Planificación Semanal / Calendario
create table if not exists public.calendar_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  planned_date date not null,
  occasion text not null default 'Oficina / Trabajo',
  user_note text,
  outfit_id uuid references public.outfits on delete set null,
  garment_ids uuid[] not null default array[]::uuid[],
  title text,
  stylist_note text,
  temp_min numeric(4, 1),
  temp_max numeric(4, 1),
  weather_condition text,
  is_worn boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, planned_date)
);

-- 5. Tabla de Maletas de Viaje (Armario Cápsula IA)
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  days_count integer not null default 4,
  luggage_type text not null default 'Maleta de cabina',
  activities text[] default array['Turismo', 'Cena'],
  capsule_garment_ids uuid[] not null default array[]::uuid[],
  checked_garment_ids uuid[] not null default array[]::uuid[],
  daily_looks jsonb not null default '[]'::jsonb,
  stylist_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- SEGURIDAD ROW LEVEL SECURITY (RLS) - Idempotente (se puede ejecutar varias veces)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.garments enable row level security;
alter table public.outfits enable row level security;
alter table public.calendar_plans enable row level security;
alter table public.trips enable row level security;

-- Políticas para profiles
drop policy if exists "Usuarios pueden ver su propio perfil" on public.profiles;
create policy "Usuarios pueden ver su propio perfil" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Usuarios pueden insertar su propio perfil" on public.profiles;
create policy "Usuarios pueden insertar su propio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Usuarios pueden actualizar su propio perfil" on public.profiles;
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Políticas para garments
drop policy if exists "Usuarios gestionan sus propias prendas" on public.garments;
create policy "Usuarios gestionan sus propias prendas" on public.garments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para outfits
drop policy if exists "Usuarios gestionan sus propios outfits" on public.outfits;
create policy "Usuarios gestionan sus propios outfits" on public.outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para calendar_plans
drop policy if exists "Usuarios gestionan su propio calendario" on public.calendar_plans;
create policy "Usuarios gestionan su propio calendario" on public.calendar_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Políticas para trips
drop policy if exists "Usuarios gestionan sus propios viajes" on public.trips;
create policy "Usuarios gestionan sus propios viajes" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger automático para crear el perfil cuando un usuario se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- STORAGE BUCKET PARA FOTOS DE PRENDAS ("garments")
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('garments', 'garments', true)
on conflict (id) do nothing;

drop policy if exists "Imágenes de prendas visibles públicamente" on storage.objects;
create policy "Imágenes de prendas visibles públicamente"
  on storage.objects for select
  using ( bucket_id = 'garments' );

drop policy if exists "Usuarios autenticados pueden subir fotos a su carpeta" on storage.objects;
create policy "Usuarios autenticados pueden subir fotos a su carpeta"
  on storage.objects for insert
  with check (
    bucket_id = 'garments'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Usuarios pueden borrar sus propias fotos" on storage.objects;
create policy "Usuarios pueden borrar sus propias fotos"
  on storage.objects for delete
  using (
    bucket_id = 'garments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
