-- Automatisch erzeugtes "Erste-Woche-Protokoll" — ein einmaliges,
-- optisch hochwertiges 4-Seiten-Dokument als Belohnung nach der ersten
-- Protokoll-Woche. Als Snapshot gespeichert (jsonb, wie
-- checkins.values/blutwerte_archiv.werte/profiles.category_ziele) statt
-- live neu berechnet, damit es wie eine feste "Urkunde" wirkt und nicht
-- nachträglich wackelt, wenn alte Einträge bearbeitet werden.
create table if not exists public.wochenprotokoll_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  protocol_id uuid references public.protocols (id) on delete cascade,
  wochen_nummer integer not null default 1,
  erstellt_am timestamptz not null default now(),
  daten jsonb not null,
  unique (user_id, protocol_id, wochen_nummer)
);

alter table public.wochenprotokoll_snapshots enable row level security;

drop policy if exists "wochenprotokoll_snapshots_select_own" on public.wochenprotokoll_snapshots;
create policy "wochenprotokoll_snapshots_select_own" on public.wochenprotokoll_snapshots
  for select using (auth.uid() = user_id);

drop policy if exists "wochenprotokoll_snapshots_insert_own" on public.wochenprotokoll_snapshots;
create policy "wochenprotokoll_snapshots_insert_own" on public.wochenprotokoll_snapshots
  for insert with check (auth.uid() = user_id);
-- Bewusst kein Update/Delete — Urkunden-Charakter, Korrekturen entstehen
-- durch einen neuen Wochen-Snapshot, nicht durch nachträgliches Ändern.
