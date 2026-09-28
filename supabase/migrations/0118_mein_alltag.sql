-- Kalender „Mein Alltag“ (28.09., Vorschau von der Nutzerin freigegeben):
-- Tag / Woche als Stundenplan / Monat mit allem aus der App plus Alltags-
-- Einträgen (Arbeit, Haushalt, Hobby, Me-Time, Termine, Freunde & Familie,
-- eigene Bereiche). Freischaltung nach der Einstellungsphase als eigenes
-- Programm "alltag". Nur neue Tabellen, nichts Bestehendes wird geändert.

-- Eigene Bereiche je Person (die festen Bereiche stehen im Code).
create table if not exists public.alltag_bereiche (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default '⭐',
  farbe_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists alltag_bereiche_user_idx on public.alltag_bereiche (user_id);
alter table public.alltag_bereiche enable row level security;
drop policy if exists "alltag_bereiche: eigene Zeilen" on public.alltag_bereiche;
create policy "alltag_bereiche: eigene Zeilen" on public.alltag_bereiche for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "alltag_bereiche: admin voller Zugriff" on public.alltag_bereiche;
create policy "alltag_bereiche: admin voller Zugriff" on public.alltag_bereiche for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Einträge: wöchentlich (wochentage) oder einmalig (datum).
create table if not exists public.alltag_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bereich text not null default 'termin', -- fester Schlüssel oder 'eigen'
  bereich_id uuid references public.alltag_bereiche (id) on delete set null,
  titel text not null check (char_length(titel) between 1 and 80),
  start_zeit time not null,
  end_zeit time,
  wochentage text[] not null default '{}',
  datum date,
  erinnerung boolean not null default true,
  notiz text,
  created_at timestamptz not null default now(),
  check (datum is not null or cardinality(wochentage) > 0)
);
create index if not exists alltag_eintraege_user_idx on public.alltag_eintraege (user_id);
alter table public.alltag_eintraege enable row level security;
drop policy if exists "alltag_eintraege: eigene Zeilen" on public.alltag_eintraege;
create policy "alltag_eintraege: eigene Zeilen" on public.alltag_eintraege for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "alltag_eintraege: admin voller Zugriff" on public.alltag_eintraege;
create policy "alltag_eintraege: admin voller Zugriff" on public.alltag_eintraege for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Abgehakt je Tag.
create table if not exists public.alltag_erledigt (
  user_id uuid not null references auth.users (id) on delete cascade,
  eintrag_id uuid not null references public.alltag_eintraege (id) on delete cascade,
  datum date not null,
  created_at timestamptz not null default now(),
  primary key (eintrag_id, datum)
);
create index if not exists alltag_erledigt_user_idx on public.alltag_erledigt (user_id, datum);
alter table public.alltag_erledigt enable row level security;
drop policy if exists "alltag_erledigt: eigene Zeilen" on public.alltag_erledigt;
create policy "alltag_erledigt: eigene Zeilen" on public.alltag_erledigt for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "alltag_erledigt: admin voller Zugriff" on public.alltag_erledigt;
create policy "alltag_erledigt: admin voller Zugriff" on public.alltag_erledigt for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Programm im Katalog: nicht automatisch für Neue, der Coach schaltet frei.
insert into public.programme (id, name, emoji, beschreibung, wochen, reihenfolge, aktiv, fuer_neue)
values ('alltag', 'Mein Alltag', '🗓️', 'Kalender mit Stundenplan, Woche und Monat: Arbeit, Haushalt, Hobbys, Me-Time, Termine und alles aus AKA an einem Ort. Nach der Einstellungsphase.', null, 1, true, false)
on conflict (id) do nothing;
