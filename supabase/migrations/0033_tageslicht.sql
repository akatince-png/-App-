-- Tageslicht: neuer Lebensbereich, der trackt/plant, wie viel Zeit am Tag im
-- Freien/Tageslicht verbracht wird — gleicher Aufbau wie Hydration
-- (0008_hydration.sql): ein Log-Eintrag pro Tag mit laufender Gesamtzeit
-- statt vieler Einzelzeilen, plus ein Tagesziel als eigene Einstellung.
create table public.tageslicht_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  minuten integer not null default 0,
  unique (user_id, datum)
);

alter table public.tageslicht_logs enable row level security;
create policy "tageslicht_logs: eigene Zeilen" on public.tageslicht_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.tageslicht_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ziel_minuten integer not null default 30
);

alter table public.tageslicht_settings enable row level security;
create policy "tageslicht_settings: eigene Zeile" on public.tageslicht_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
