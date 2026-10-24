-- Kalender-Abo (24.10., Nutzerin: Tagesplan, Termine und To-dos auf dem
-- Tablet sehen, „ohne dass ich immer die App öffnen muss“). Echte Widgets
-- gehen als Web-App nicht; stattdessen ein geheimer Abo-Link (iCalendar),
-- den der Apple-/Google-Kalender abonniert – dann zeigen dessen Widgets den
-- AKA-Plan. Die Edge Function `kalender-abo` liest per Token (ohne Login).
-- Bewusst KEINE Gesundheitsdaten (Medikamente, Supplemente, Werte), keine
-- Notizen; einzelne eigene Bereiche lassen sich ausnehmen (ohne_bereiche).
-- „Link sperren“ = neues Token, „Abo beenden“ = Zeile löschen.
create table if not exists public.kalender_abos (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  ohne_bereiche uuid[] not null default '{}',
  erstellt_am timestamptz not null default now(),
  abgerufen_am timestamptz
);

alter table public.kalender_abos enable row level security;

drop policy if exists kalender_abos_eigen_lesen on public.kalender_abos;
create policy kalender_abos_eigen_lesen on public.kalender_abos for select using (auth.uid() = user_id);
drop policy if exists kalender_abos_eigen_anlegen on public.kalender_abos;
create policy kalender_abos_eigen_anlegen on public.kalender_abos for insert with check (auth.uid() = user_id);
drop policy if exists kalender_abos_eigen_aendern on public.kalender_abos;
create policy kalender_abos_eigen_aendern on public.kalender_abos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists kalender_abos_eigen_loeschen on public.kalender_abos;
create policy kalender_abos_eigen_loeschen on public.kalender_abos for delete using (auth.uid() = user_id);

-- Neues Token ziehen („Link sperren“): alter Link funktioniert sofort nicht mehr.
create or replace function public.kalender_abo_neues_token()
returns text
language sql
security invoker
set search_path to 'public'
as $$
  update public.kalender_abos
     set token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), abgerufen_am = null
   where user_id = auth.uid()
  returning token;
$$;
grant execute on function public.kalender_abo_neues_token() to authenticated;
