-- Einzeltag-Ausnahmen für wiederkehrende Pläne ("nur heute anders, Rest
-- bleibt wie geplant") — Nutzerin-Vorgabe, 12.09.: aus der Wochen-/
-- Monatsübersicht heraus soll sich ein einzelner Tages-Eintrag bearbeiten
-- lassen, ohne dass das automatisch die ganze wiederkehrende Regel
-- (Supplement-Uhrzeit, Gewohnheit, Workflow, ...) für immer ändert.
--
-- EINE gemeinsame Tabelle für alle fünf betroffenen Kategorien (statt
-- sieben einzelner Ausnahme-Spalten/-Tabellen) — Training und Zeitblöcke
-- brauchen das nicht, die haben schon echte, eigenständige Tages-Zeilen in
-- der DB (kein "eine Regel, täglich neu berechnet"-Muster wie bei den
-- übrigen fünf Kategorien) und lassen sich dort direkt bearbeiten.
--
-- `ref_id` verweist je nach Kategorie auf eine andere Tabelle (kein
-- Foreign Key möglich, da die Zieltabelle variiert):
--   hormon      -> hormones.id
--   supplement  -> supplements.id
--   mahlzeit    -> meal_wochenplan.id (die konkrete Wochentag-Zuweisung,
--                  nicht meals.id — eine Mahlzeit kann an mehreren Tagen
--                  zu unterschiedlichen Zeiten geplant sein)
--   gewohnheit  -> routines.id
--   workflow    -> workflow_plaene.id
--
-- Nur gesetzte Felder gelten als überschrieben — bleibt z. B. `name` leer,
-- zeigt der Tagesplan weiterhin den Namen aus der Regel.
create table if not exists public.tagesplan_ausnahmen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kategorie text not null check (kategorie in ('hormon', 'supplement', 'mahlzeit', 'gewohnheit', 'workflow')),
  ref_id uuid not null,
  datum date not null,
  uhrzeit text,
  name text,
  detail text,
  entfaellt boolean not null default false,
  grund text,
  erstellt_am timestamptz not null default now(),
  unique (user_id, kategorie, ref_id, datum)
);

alter table public.tagesplan_ausnahmen enable row level security;
drop policy if exists "tagesplan_ausnahmen: eigene Zeilen" on public.tagesplan_ausnahmen;
create policy "tagesplan_ausnahmen: eigene Zeilen" on public.tagesplan_ausnahmen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
