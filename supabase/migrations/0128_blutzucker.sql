-- Blutzucker-Protokoll (11.10., Nutzerin: „morgens und abends und
-- zwischendurch Blutzucker messen und eintragen, soll sich protokollieren“).
-- Manuelle Einträge in mg/dl (Eingabe in mmol/l wird in der App umgerechnet);
-- CGM-Anbindung später. Neue Tabelle, deshalb ohne „drop policy“.
create table if not exists public.blutzucker_messungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  uhrzeit time,
  wert_mgdl integer not null check (wert_mgdl between 20 and 600),
  zeitpunkt text not null default 'zwischendurch' check (zeitpunkt in ('nuechtern', 'vor_essen', 'nach_essen', 'abends', 'zwischendurch')),
  notiz text check (notiz is null or char_length(notiz) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists blutzucker_messungen_user_idx on public.blutzucker_messungen (user_id, datum);

alter table public.blutzucker_messungen enable row level security;
create policy "blutzucker_messungen: eigene Zeilen" on public.blutzucker_messungen for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "blutzucker_messungen: admin voller Zugriff" on public.blutzucker_messungen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
