-- Workflow-Presets zogen bisher rein lokal in localStorage
-- (intervallMusikStorage.js) — der Tagesplan liest aber ausschließlich aus
-- Supabase (buildDayItems), ein rein lokales Preset kann dort also nie
-- auftauchen. Nutzerin-Vorgabe 15.08.: "ich möchte die Workflows auch in
-- meinen Tagesplan mit einarbeiten können, Tage und Uhrzeiten zuordnen,
-- auf eine bestimmte Zeit oder einen Zeitraum oder unbestimmte Zeit
-- festlegen" — dafür müssen die Presets serverseitig liegen, plus eine
-- zweite Tabelle für die eigentliche Zeitplanung.

create table if not exists public.workflow_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  arbeit_min integer not null default 25,
  pause_min integer not null default 5,
  gesamt_min integer not null default 100,
  modus text not null default 'durchgehend',
  created_at timestamptz not null default now()
);

alter table public.workflow_presets enable row level security;
drop policy if exists "workflow_presets: eigene Zeilen" on public.workflow_presets;
create policy "workflow_presets: eigene Zeilen" on public.workflow_presets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Zeitplanung eines Presets: entweder feste Wochentage (wiederkehrend, wie
-- training_wochenplan) und/oder ein Gültigkeits-Zeitraum. Beide Felder sind
-- unabhängig kombinierbar:
--   - nur wochentage gesetzt, gueltig_von/gueltig_bis leer  -> für immer an
--     diesen Wochentagen ("unbestimmte Zeit")
--   - zusätzlich gueltig_von gesetzt, gueltig_bis leer      -> ab diesem
--     Datum, dann unbegrenzt weiter
--   - beide gueltig_von UND gueltig_bis gesetzt             -> nur in
--     diesem Zeitraum ("bestimmter Zeitraum")
-- uhrzeit ist optional (leer = ohne feste Uhrzeit, sortiert sich im
-- Tagesplan wie andere Einträge ohne Uhrzeit ans Ende).
create table if not exists public.workflow_plaene (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preset_id uuid not null references public.workflow_presets (id) on delete cascade,
  wochentage text[] not null default '{}',
  uhrzeit text,
  gueltig_von date,
  gueltig_bis date,
  aktiv boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.workflow_plaene enable row level security;
drop policy if exists "workflow_plaene: eigene Zeilen" on public.workflow_plaene;
create policy "workflow_plaene: eigene Zeilen" on public.workflow_plaene for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
