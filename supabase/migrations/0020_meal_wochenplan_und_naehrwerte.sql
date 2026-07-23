-- Wochenplan für Mahlzeiten: welche Mahlzeit an welchem Wochentag ansteht.
-- Bewusst KEIN Unique-Key auf (user_id, wochentag) wie bei
-- training_wochenplan — anders als beim Training sind hier beliebig viele
-- Mahlzeiten pro Tag normal (1 bis 6+, je nach Nutzer), nicht die
-- Ausnahme. `meals.tageszeiten` bleibt als Anzeige-Vorbelegung erhalten,
-- ist aber nicht mehr die Quelle für "an welchem Tag" — das übernimmt
-- diese Tabelle vollständig.
create table if not exists public.meal_wochenplan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wochentag text not null check (wochentag in ('Mo','Di','Mi','Do','Fr','Sa','So')),
  meal_id uuid not null references public.meals (id) on delete cascade,
  tageszeit text,
  uhrzeit time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, wochentag, meal_id, tageszeit)
);

alter table public.meal_wochenplan enable row level security;

drop policy if exists "meal_wochenplan: eigene Zeilen" on public.meal_wochenplan;
create policy "meal_wochenplan: eigene Zeilen" on public.meal_wochenplan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists meal_wochenplan_user_wochentag_idx
  on public.meal_wochenplan (user_id, wochentag);

-- Optionale Gramm-/Kalorienangabe pro Zutat — beide Felder bleiben
-- nullable, damit Freitext-Zutaten (z. B. "eine Handvoll") weiter ohne
-- Zahlen funktionieren. Kalorien werden nirgends gespeichert, sondern
-- überall live aus menge_gramm/100 * kcal_pro_100g berechnet.
alter table public.meal_ingredients
  add column if not exists menge_gramm numeric,
  add column if not exists kcal_pro_100g numeric;
