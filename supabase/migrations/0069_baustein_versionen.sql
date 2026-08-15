-- Versionierung der Protokoll-Bausteine (Nutzerinnen-Vorgabe, 15.08.):
-- wird ein Baustein (Schlaf, Training, Ernährung, ...) inhaltlich verändert,
-- soll die alte Einstellung als Version erhalten bleiben, sichtbar im
-- Archiv, statt einfach überschrieben zu werden. Bewusst als eigenständige
-- Snapshot-Tabelle statt echter Versionierung jeder einzelnen Quelltabelle
-- (protocols, routines, meals, training_wochenplan, ...) — die haben alle
-- unterschiedliche Datenmodelle, ein einheitliches Versionsmodell über alle
-- hinweg wäre ein deutlich größerer Umbau. snapshot ist deshalb ein reiner
-- JSON-Schnappschuss der zum Zeitpunkt geltenden Werte für diese Kategorie
-- (siehe useBausteinVersionen.js für den Aufbau je Kategorie), manuell
-- ausgelöst über "Version festhalten" (kein automatisches Diffing).
create table if not exists public.baustein_versionen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hauptprotokoll_id uuid not null references public.hauptprotokolle (id) on delete cascade,
  kategorie text not null,
  notiz text not null default '',
  snapshot jsonb not null,
  erstellt_am timestamptz not null default now()
);

alter table public.baustein_versionen enable row level security;

drop policy if exists "baustein_versionen: eigene Zeilen" on public.baustein_versionen;
create policy "baustein_versionen: eigene Zeilen" on public.baustein_versionen for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin-Zugriff (gleiches Muster wie 0035_admin_dashboard.sql) — ohne das
-- könnte ein Admin im "Verwalten als"-Modus keine Versionen für eine
-- Coachee anlegen/lesen, weil auth.uid() dabei weiterhin die Admin-ID ist.
drop policy if exists "baustein_versionen: admin voller Zugriff" on public.baustein_versionen;
create policy "baustein_versionen: admin voller Zugriff" on public.baustein_versionen for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index if not exists baustein_versionen_hauptprotokoll_idx on public.baustein_versionen (hauptprotokoll_id, kategorie);
