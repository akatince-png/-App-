-- Ernährung (25.09., Nutzerinnen-Vorgabe): frei eingegebenes Essen ("zwei
-- Scheiben Vollkornbrot, drei Bananen") mit berechneten ca.-Werten. posten
-- = Aufschlüsselung (Lebensmittel, angenommene Gramm, Werte je Posten).
-- Ziele (Eiweiß g/kg, Fett %, Omega-3, Omega-6:3, Quellen) liegen wie das
-- Kalorienziel in profiles.category_ziele.ernaehrung.
create table if not exists public.essen_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  uhrzeit time,
  text text not null,
  posten jsonb not null default '[]',
  kcal numeric not null default 0,
  eiweiss numeric not null default 0,
  fett numeric not null default 0,
  kh numeric not null default 0,
  zucker numeric not null default 0,
  ballast numeric not null default 0,
  omega3 numeric not null default 0,
  epa_dha numeric not null default 0,
  omega6 numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists essen_eintraege_user_datum_idx on public.essen_eintraege (user_id, datum);
alter table public.essen_eintraege enable row level security;
drop policy if exists "essen_eintraege: eigene Zeilen" on public.essen_eintraege;
create policy "essen_eintraege: eigene Zeilen" on public.essen_eintraege for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "essen_eintraege: admin voller Zugriff" on public.essen_eintraege;
create policy "essen_eintraege: admin voller Zugriff" on public.essen_eintraege for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
