-- Getränke-Rezepte: mehrere Zutaten zu einem benannten Drink kombinieren
-- (z. B. Pre-Workout, After-Workout, Elektrolyt-Drink) inkl. Zeit-/Anlass-Hinweis
-- und täglichem Bestätigen — analog zu supplements/supplement_logs.

create table public.drink_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  hinweis text not null default '',
  created_at timestamptz not null default now()
);

alter table public.drink_recipes enable row level security;
create policy "drink_recipes: eigene Zeilen" on public.drink_recipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.drink_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.drink_recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  menge text not null default '',
  sort_order integer not null default 0
);

alter table public.drink_recipe_ingredients enable row level security;
create policy "drink_recipe_ingredients: eigene Zeilen" on public.drink_recipe_ingredients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index drink_recipe_ingredients_recipe_idx on public.drink_recipe_ingredients (recipe_id);

create table public.drink_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.drink_recipes (id) on delete cascade,
  log_date date not null,
  erledigt boolean not null default true,
  erledigt_at timestamptz,
  unique (recipe_id, log_date)
);

alter table public.drink_logs enable row level security;
create policy "drink_logs: eigene Zeilen" on public.drink_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
