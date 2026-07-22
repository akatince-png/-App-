-- Ernährungsplan: Mahlzeiten mit Zutaten (analog zu supplements + drink_recipes)
-- und tagesbezogenem Bestätigen (analog zu supplement_logs).

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  tageszeiten text[] not null default '{}',
  hinweis text not null default '',
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;
create policy "meals: eigene Zeilen" on public.meals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  menge text not null default '',
  sort_order integer not null default 0
);

alter table public.meal_ingredients enable row level security;
create policy "meal_ingredients: eigene Zeilen" on public.meal_ingredients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index meal_ingredients_meal_idx on public.meal_ingredients (meal_id);

create table public.meal_logs (
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
create policy "meal_logs: eigene Zeilen" on public.meal_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Medikamente: "Hormone" wird zu einer umfassenderen Medikamenten-Verwaltung
-- mit Kategorien (Hormone, Blutdruck, Diabetes, Cholesterin, Schmerzmittel,
-- Sonstige). Die Tabelle heißt weiterhin "hormones" (kein Rename, um alle
-- bestehenden Referenzen/Policies nicht anfassen zu müssen), bekommt aber
-- ein Kategorie-Feld dazu.
alter table public.hormones
  add column kategorie text not null default 'Hormone'
  check (kategorie in ('Hormone', 'Blutdruck', 'Diabetes', 'Cholesterin', 'Schmerzmittel', 'Sonstige'));
