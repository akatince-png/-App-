-- Änderungsprotokoll: Audit-Log für Anpassungen an laufenden Plänen (Dosis
-- geändert, Item hinzugefügt/entfernt, ...). item_name ist bewusst
-- denormalisiert (Text-Snapshot), weil das zugrunde liegende Item später
-- gelöscht sein kann und der Log trotzdem lesbar bleiben soll — kein
-- Fremdschlüssel auf die einzelnen Kategorie-Tabellen. Kein Update/Delete-
-- Recht: Korrekturen entstehen durch einen neuen Eintrag, nicht durch
-- nachträgliches Verändern des Logs.
create table if not exists aenderungsprotokoll (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kategorie text not null check (kategorie in ('peptid', 'hormon', 'supplement', 'training', 'gewohnheit', 'hydration', 'mahlzeit')),
  item_name text not null,
  aktion text not null check (aktion in ('hinzugefügt', 'geändert', 'entfernt')),
  detail text not null default '',
  grund text,
  created_at timestamptz not null default now()
);

create index if not exists aenderungsprotokoll_user_created_idx
  on aenderungsprotokoll (user_id, created_at desc);

alter table aenderungsprotokoll enable row level security;

drop policy if exists "aenderungsprotokoll_select_own" on aenderungsprotokoll;
create policy "aenderungsprotokoll_select_own" on aenderungsprotokoll
  for select using (auth.uid() = user_id);

drop policy if exists "aenderungsprotokoll_insert_own" on aenderungsprotokoll;
create policy "aenderungsprotokoll_insert_own" on aenderungsprotokoll
  for insert with check (auth.uid() = user_id);
