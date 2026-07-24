-- Hauptprotokoll: neue übergeordnete Ebene über allen Bereichen (Schlaf,
-- Ernährung, Training, Supplemente, Medikamente, Peptid-Protokoll, Hydration,
-- Gewohnheiten). Ein Nutzer legt zuerst ein benanntes Hauptprotokoll an
-- (z. B. "Sommer 2026", "Muskelaufbau") und richtet danach die einzelnen
-- Teilprotokolle darunter ein — jedes mit eigenem Aktiv-Status, optional
-- eigenem, vom Hauptprotokoll abweichendem Startdatum, und eigener Laufzeit.
-- Nur ein Hauptprotokoll ist je Nutzer gleichzeitig "active"; ein neues
-- archiviert das vorherige (siehe useHauptprotokollData.hauptprotokollErstellen).
create table if not exists public.hauptprotokolle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  beschreibung text not null default '',
  startdatum date not null default current_date,
  status text not null default 'active' check (status in ('active', 'archived')),
  erstellt_am timestamptz not null default now(),
  archiviert_am timestamptz
);

alter table public.hauptprotokolle enable row level security;

drop policy if exists "hauptprotokolle: eigene Zeilen" on public.hauptprotokolle;
create policy "hauptprotokolle: eigene Zeilen" on public.hauptprotokolle for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists hauptprotokolle_user_status_idx on public.hauptprotokolle (user_id, status);

-- Teilprotokoll: eine Zeile je (Hauptprotokoll, Kategorie) — ersetzt nicht
-- die bereichsspezifischen Detaildaten (die bleiben in category_ziele,
-- hydration_settings usw.), sondern hält nur die neue, bereichsübergreifende
-- Zuordnung: gehört zu welchem Hauptprotokoll, aktiv oder nicht, eigenes
-- Startdatum (falls abweichend vom Hauptprotokoll), eigene Laufzeit.
create table if not exists public.teilprotokolle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hauptprotokoll_id uuid not null references public.hauptprotokolle (id) on delete cascade,
  kategorie text not null check (kategorie in ('schlaf', 'hydration', 'ernaehrung', 'training', 'gewohnheiten', 'supplemente', 'medikamente', 'peptide')),
  aktiv boolean not null default true,
  eigenes_startdatum date,
  laufzeit_wochen integer,
  erstellt_am timestamptz not null default now(),
  unique (hauptprotokoll_id, kategorie)
);

alter table public.teilprotokolle enable row level security;

drop policy if exists "teilprotokolle: eigene Zeilen" on public.teilprotokolle;
create policy "teilprotokolle: eigene Zeilen" on public.teilprotokolle for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists teilprotokolle_hauptprotokoll_idx on public.teilprotokolle (hauptprotokoll_id);

-- Zuordnung einzelner dokumentierter Einträge zu ihrem Hauptprotokoll —
-- vorerst für die Bereiche mit eigener "Katalog"-Tabelle (Medikamente,
-- Supplemente, Mahlzeiten, Gewohnheiten). Bewusst nullable: bestehende,
-- vor dieser Migration angelegte Einträge bleiben unverändert (kein
-- rückwirkendes Zuordnen), neue Einträge werden ab jetzt verknüpft.
-- Peptid-Protokolle (Tabelle protocols) folgen in einem eigenen,
-- vorsichtigeren Schritt, da dort mehrere Stellen im Code eng mit dem
-- bisherigen "ein aktives Protokoll"-Modell verzahnt sind.
alter table public.hormones add column if not exists hauptprotokoll_id uuid references public.hauptprotokolle (id) on delete set null;
alter table public.supplements add column if not exists hauptprotokoll_id uuid references public.hauptprotokolle (id) on delete set null;
alter table public.meals add column if not exists hauptprotokoll_id uuid references public.hauptprotokolle (id) on delete set null;
alter table public.routines add column if not exists hauptprotokoll_id uuid references public.hauptprotokolle (id) on delete set null;
