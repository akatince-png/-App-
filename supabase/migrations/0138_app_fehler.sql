-- Eigene Fehler-Erfassung (27.10., Nutzerin: „die App hat immer wieder
-- Probleme und verschwindet“). Jeder vom Auffangnetz gefangene Absturz wird
-- gespeichert; lesen dürfen nur Admins. (eingespielt)
create table if not exists public.app_fehler (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  nachricht text,
  stack text,
  komponenten text,
  adresse text,
  geraet text
);
create index if not exists app_fehler_zeit_idx on public.app_fehler (created_at desc);
alter table public.app_fehler enable row level security;
create policy "app_fehler: eigene eintragen" on public.app_fehler for insert with check (auth.uid() = user_id);
create policy "app_fehler: admin lesen" on public.app_fehler for select using (public.is_admin(auth.uid()));
