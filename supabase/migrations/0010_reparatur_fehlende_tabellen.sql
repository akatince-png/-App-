-- Reparatur-Migration: mehrere frühere Migrationen (Drinks, Ernährungsplan,
-- Routinen, Hydration, Medikamenten-Kategorie/Einnahmeart) wurden nie
-- ausgeführt — dieses Skript holt alles in einem Rutsch nach. Komplett
-- gefahrlos wiederholt ausführbar: nichts wird gelöscht, nur ergänzt, was
-- noch fehlt ("if not exists" überall).

-- ---- Drinks ----
create table if not exists public.drink_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  hinweis text not null default '',
  created_at timestamptz not null default now()
);
alter table public.drink_recipes enable row level security;
drop policy if exists "drink_recipes: eigene Zeilen" on public.drink_recipes;
create policy "drink_recipes: eigene Zeilen" on public.drink_recipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.drink_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.drink_recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  menge text not null default '',
  sort_order integer not null default 0
);
alter table public.drink_recipe_ingredients enable row level security;
drop policy if exists "drink_recipe_ingredients: eigene Zeilen" on public.drink_recipe_ingredients;
create policy "drink_recipe_ingredients: eigene Zeilen" on public.drink_recipe_ingredients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists drink_recipe_ingredients_recipe_idx on public.drink_recipe_ingredients (recipe_id);

create table if not exists public.drink_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.drink_recipes (id) on delete cascade,
  log_date date not null,
  erledigt boolean not null default true,
  erledigt_at timestamptz,
  unique (recipe_id, log_date)
);
alter table public.drink_logs enable row level security;
drop policy if exists "drink_logs: eigene Zeilen" on public.drink_logs;
create policy "drink_logs: eigene Zeilen" on public.drink_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Ernährungsplan (Mahlzeiten) ----
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  tageszeiten text[] not null default '{}',
  hinweis text not null default '',
  created_at timestamptz not null default now()
);
alter table public.meals enable row level security;
drop policy if exists "meals: eigene Zeilen" on public.meals;
create policy "meals: eigene Zeilen" on public.meals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  menge text not null default '',
  sort_order integer not null default 0
);
alter table public.meal_ingredients enable row level security;
drop policy if exists "meal_ingredients: eigene Zeilen" on public.meal_ingredients;
create policy "meal_ingredients: eigene Zeilen" on public.meal_ingredients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists meal_ingredients_meal_idx on public.meal_ingredients (meal_id);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  log_date date not null,
  tageszeit text not null,
  erledigt boolean not null default true,
  erledigt_at timestamptz,
  unique (meal_id, log_date, tageszeit)
);
alter table public.meal_logs enable row level security;
drop policy if exists "meal_logs: eigene Zeilen" on public.meal_logs;
create policy "meal_logs: eigene Zeilen" on public.meal_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Medikamente: Kategorie + Einnahmeart, Peptide: BAC-Wasser/Sprühstöße ----
alter table public.hormones add column if not exists kategorie text not null default 'Hormone';
alter table public.hormones add column if not exists einnahmeart text not null default 'Injektion';
alter table public.protocol_peptide add column if not exists bac_wasser_ml numeric;
alter table public.protocol_peptide add column if not exists spruehstoesse integer;

-- ---- Routinen ----
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '⭐',
  uhrzeit time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.routines enable row level security;
drop policy if exists "routines: eigene Zeilen" on public.routines;
create policy "routines: eigene Zeilen" on public.routines for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_peptide_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  protocol_peptide_id uuid not null references public.protocol_peptide (id) on delete cascade,
  unique (routine_id, protocol_peptide_id)
);
alter table public.routine_peptide_items enable row level security;
drop policy if exists "routine_peptide_items: eigene Zeilen" on public.routine_peptide_items;
create policy "routine_peptide_items: eigene Zeilen" on public.routine_peptide_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_hormon_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  hormone_id uuid not null references public.hormones (id) on delete cascade,
  unique (routine_id, hormone_id)
);
alter table public.routine_hormon_items enable row level security;
drop policy if exists "routine_hormon_items: eigene Zeilen" on public.routine_hormon_items;
create policy "routine_hormon_items: eigene Zeilen" on public.routine_hormon_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_supplement_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  unique (routine_id, supplement_id)
);
alter table public.routine_supplement_items enable row level security;
drop policy if exists "routine_supplement_items: eigene Zeilen" on public.routine_supplement_items;
create policy "routine_supplement_items: eigene Zeilen" on public.routine_supplement_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_meal_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  unique (routine_id, meal_id)
);
alter table public.routine_meal_items enable row level security;
drop policy if exists "routine_meal_items: eigene Zeilen" on public.routine_meal_items;
create policy "routine_meal_items: eigene Zeilen" on public.routine_meal_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  log_date date not null,
  erledigt_at timestamptz not null default now(),
  unique (routine_id, log_date)
);
alter table public.routine_logs enable row level security;
drop policy if exists "routine_logs: eigene Zeilen" on public.routine_logs;
create policy "routine_logs: eigene Zeilen" on public.routine_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Hydration ----
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  menge_ml integer not null default 0,
  elektrolyte boolean not null default false,
  durstgefuehl text,
  bemerkung text,
  unique (user_id, datum)
);
alter table public.hydration_logs enable row level security;
drop policy if exists "hydration_logs: eigene Zeilen" on public.hydration_logs;
create policy "hydration_logs: eigene Zeilen" on public.hydration_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.hydration_logs add column if not exists elektrolyte boolean not null default false;
alter table public.hydration_logs add column if not exists durstgefuehl text;
alter table public.hydration_logs add column if not exists bemerkung text;

create table if not exists public.hydration_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ziel_ml integer not null default 2500
);
alter table public.hydration_settings enable row level security;
drop policy if exists "hydration_settings: eigene Zeile" on public.hydration_settings;
create policy "hydration_settings: eigene Zeile" on public.hydration_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Response-System-Felder (falls beim letzten Versuch abgebrochen, weil
-- hydration_logs damals noch fehlte) ----
alter table public.hormone_logs add column if not exists vertraeglichkeit text;
alter table public.hormone_logs add column if not exists wirkung text;
alter table public.hormone_logs add column if not exists nebenwirkungen text[] not null default '{}';
alter table public.hormone_logs add column if not exists notizen text;

alter table public.supplement_logs add column if not exists wirkung text;
alter table public.supplement_logs add column if not exists nebenwirkungen text[] not null default '{}';
alter table public.supplement_logs add column if not exists notizen text;

alter table public.sleep_entries add column if not exists schlafqualitaet text;
alter table public.sleep_entries add column if not exists einschlafzeit text;
alter table public.sleep_entries add column if not exists durchgeschlafen boolean;
alter table public.sleep_entries add column if not exists erholt boolean;
alter table public.sleep_entries add column if not exists traeume text;
alter table public.sleep_entries add column if not exists bemerkungen text;
