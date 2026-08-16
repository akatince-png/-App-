-- Nachholen der Migrationen 0041 (routine_schritte, routine_durchlaeufe)
-- und 0044 (routine_einstellungen) — waren in der echten Datenbank nie
-- angelegt worden, obwohl im Übergabeprotokoll als "deployt" notiert.
-- Gemeldeter Fehler in der App (16.08.): "Could not find the table
-- 'public.routine_schritte' in the schema cache" beim Versuch, einen
-- Morgen-/Abendroutine-Schritt anzulegen. Gleiches Muster wie der fehlende
-- profiles.erinnerungen-Spalten-Bug vom selben Tag (siehe
-- UEBERGABEPROTOKOLL.md, Teil 5) — vermutlich beim manuellen Durchklicken
-- der Migrationen einzelne übersprungen. Mit "if not exists" / "drop
-- policy if exists" geschrieben, damit ein zweifaches Ausführen nichts
-- kaputt macht, falls einzelne Teile doch schon existieren.

create table if not exists public.routine_schritte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null check (routine in ('morgen', 'abend')),
  reihenfolge integer not null,
  name text not null,
  dauer_min integer not null default 5,
  created_at timestamptz not null default now()
);

alter table public.routine_schritte enable row level security;
drop policy if exists "routine_schritte: eigene Zeilen" on public.routine_schritte;
create policy "routine_schritte: eigene Zeilen" on public.routine_schritte for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_durchlaeufe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null check (routine in ('morgen', 'abend')),
  datum date not null,
  schritte jsonb not null default '[]',
  gestartet_um timestamptz not null default now(),
  abgeschlossen_um timestamptz,
  created_at timestamptz not null default now()
);

alter table public.routine_durchlaeufe enable row level security;
drop policy if exists "routine_durchlaeufe: eigene Zeilen" on public.routine_durchlaeufe;
create policy "routine_durchlaeufe: eigene Zeilen" on public.routine_durchlaeufe for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_einstellungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null check (routine in ('morgen', 'abend')),
  start_zeit time,
  end_zeit time,
  created_at timestamptz not null default now(),
  unique (user_id, routine)
);

alter table public.routine_einstellungen enable row level security;
drop policy if exists "routine_einstellungen: eigene Zeilen" on public.routine_einstellungen;
create policy "routine_einstellungen: eigene Zeilen" on public.routine_einstellungen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
