-- Geführte Morgen-/Abendroutine (Phase 1, Nutzerinnen-Vorgabe 13.08.):
-- ein Ablauf-Screen, der Schritt für Schritt durch selbst konfigurierte
-- Schritte (Name + geplante Dauer) führt, mit Countdown je Schritt und
-- akustischem Hinweis kurz vor Ende — gegen das ADHS-typische
-- Zeitgefühl-Problem ("wir verlieren uns beim Zähneputzen in der Zeit").
--
-- routine_schritte: die Konfiguration (was gehört zur Morgen-/Abendroutine,
-- in welcher Reihenfolge, wie lange geplant) — frei benennbar, nicht an
-- bestehende Kategorien gebunden (z. B. "Duschen", "Kosmetik", "Toilette"
-- sind kein eigener Tracker in der App, aber ein Schritt in der Routine).
create table public.routine_schritte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null check (routine in ('morgen', 'abend')),
  reihenfolge integer not null,
  name text not null,
  dauer_min integer not null default 5,
  created_at timestamptz not null default now()
);

alter table public.routine_schritte enable row level security;
create policy "routine_schritte: eigene Zeilen" on public.routine_schritte for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- routine_durchlaeufe: ein abgeschlossener (oder abgebrochener) Durchlauf —
-- geplante vs. tatsächlich gebrauchte Zeit je Schritt, damit die
-- Aufwach- bis Tagesstart-Zeit hinterher nachvollziehbar ist.
create table public.routine_durchlaeufe (
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
create policy "routine_durchlaeufe: eigene Zeilen" on public.routine_durchlaeufe for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
