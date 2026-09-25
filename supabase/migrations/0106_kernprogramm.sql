-- AKA-Kernprogramm in 4-Wochen-Etappen (25.09., Nutzerinnen-Freigabe der
-- Vorschau): Etappe 1 = Einführung (Pflicht-Bausteine kommen wochenweise
-- dazu), danach Erhaltungs-Etappen zu je 4 Wochen, jede endet mit einem
-- Coach-Gespräch. Details: src/utils/kernprogramm.js.
--
-- - coaching_etappen: nur der Coach (Admin) legt an/ändert, die Person liest.
-- - kern_pausen: nur der Coach pausiert einen Pflicht-Baustein, mit Begründung.
-- - routine_schritte.kern_key: Pflicht-Baustein in der Morgen-/Abendroutine
--   (in der App nicht löschbar, Zeit/Dauer/Name frei einstellbar).
-- - wochen_checks: Sonntags-Check in der Erhaltung (ein wackelnder Baustein,
--   was gestört hat, eine kleine Änderung, Stimmung der Woche).
-- - tages_top3: Morgen-Startblock (Top 3, erster Schritt, 15 Min., "angefangen?").
-- - meal_logs.eiweiss: Frage im Moment des Abhakens.

create table if not exists public.coaching_etappen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nummer int not null,
  art text not null check (art in ('einfuehrung', 'erhaltung')),
  start date not null,
  ende date not null,
  status text not null default 'laufend' check (status in ('laufend', 'abgeschlossen', 'beendet')),
  gespraech_am date,
  gespraech_notiz text,
  erstellt_von uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, nummer)
);
alter table public.coaching_etappen enable row level security;
drop policy if exists "coaching_etappen: eigene lesen" on public.coaching_etappen;
create policy "coaching_etappen: eigene lesen" on public.coaching_etappen for select using (auth.uid() = user_id);
drop policy if exists "coaching_etappen: admin voller Zugriff" on public.coaching_etappen;
create policy "coaching_etappen: admin voller Zugriff" on public.coaching_etappen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.kern_pausen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kern_key text not null,
  von date not null default current_date,
  bis date not null,
  begruendung text not null check (length(trim(begruendung)) > 0),
  erstellt_von uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists kern_pausen_user_idx on public.kern_pausen (user_id);
alter table public.kern_pausen enable row level security;
drop policy if exists "kern_pausen: eigene lesen" on public.kern_pausen;
create policy "kern_pausen: eigene lesen" on public.kern_pausen for select using (auth.uid() = user_id);
drop policy if exists "kern_pausen: admin voller Zugriff" on public.kern_pausen;
create policy "kern_pausen: admin voller Zugriff" on public.kern_pausen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

alter table public.routine_schritte add column if not exists kern_key text;
create unique index if not exists routine_schritte_kern_idx on public.routine_schritte (user_id, kern_key) where kern_key is not null;

create table if not exists public.wochen_checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  woche_start date not null,
  kern_key text,
  stoerung text[] not null default '{}',
  aenderung text,
  stimmung int check (stimmung between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, woche_start)
);
alter table public.wochen_checks enable row level security;
drop policy if exists "wochen_checks: eigene Zeilen" on public.wochen_checks;
create policy "wochen_checks: eigene Zeilen" on public.wochen_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "wochen_checks: admin lesen" on public.wochen_checks;
create policy "wochen_checks: admin lesen" on public.wochen_checks for select using (public.is_admin(auth.uid()));

create table if not exists public.tages_top3 (
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  punkte text[] not null default '{}',
  erster_schritt text,
  angefangen boolean,
  created_at timestamptz not null default now(),
  primary key (user_id, datum)
);
alter table public.tages_top3 enable row level security;
drop policy if exists "tages_top3: eigene Zeilen" on public.tages_top3;
create policy "tages_top3: eigene Zeilen" on public.tages_top3 for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tages_top3: admin lesen" on public.tages_top3;
create policy "tages_top3: admin lesen" on public.tages_top3 for select using (public.is_admin(auth.uid()));

alter table public.meal_logs add column if not exists eiweiss boolean;
