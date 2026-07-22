-- Hydration: täglicher Trink-Tracker. Ein Eintrag pro Tag mit laufender
-- Gesamtmenge (statt vieler Einzel-Log-Zeilen pro Schluck) — passend zum
-- "Schnell-Button antippen" Nutzungsmuster, ohne die Historie mit unzähligen
-- Kleinstzeilen zu überfrachten.
create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  menge_ml integer not null default 0,
  unique (user_id, datum)
);

alter table public.hydration_logs enable row level security;
create policy "hydration_logs: eigene Zeilen" on public.hydration_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tagesziel ist eine Einstellung pro Nutzer, kein Tages-Log-Eintrag.
create table public.hydration_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ziel_ml integer not null default 2500
);

alter table public.hydration_settings enable row level security;
create policy "hydration_settings: eigene Zeile" on public.hydration_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
