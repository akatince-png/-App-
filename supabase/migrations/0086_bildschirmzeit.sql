-- Bildschirmzeit: neuer Lebensbereich (Nutzerinnen-Vorgabe, 15.09.), wie
-- viel Zeit am Tag mit dem Telefon verbracht wird (v. a. Freizeit-
-- Scrollen) — gleicher Aufbau wie Tageslicht (0033_tageslicht.sql), nur
-- ist das Tagesziel hier bewusst eine OBERGRENZE, kein Mindestwert: man
-- möchte darunter BLEIBEN, nicht sie erreichen. Automatisches Auslesen der
-- echten Bildschirmzeit vom Telefon ist aus einer Browser-/PWA-App heraus
-- technisch nicht möglich (weder iOS noch Android geben Web-Apps Zugriff
-- auf Screen-Time-Daten) — deshalb bewusst manuelles Eintragen, wie bei
-- jeder anderen Kategorie auch.
create table public.bildschirmzeit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  minuten integer not null default 0,
  unique (user_id, datum)
);

alter table public.bildschirmzeit_logs enable row level security;
create policy "bildschirmzeit_logs: eigene Zeilen" on public.bildschirmzeit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.bildschirmzeit_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ziel_minuten integer not null default 60
);

alter table public.bildschirmzeit_settings enable row level security;
create policy "bildschirmzeit_settings: eigene Zeile" on public.bildschirmzeit_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
