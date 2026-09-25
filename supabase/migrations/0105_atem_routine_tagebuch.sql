-- Atem-Routine + Kontext-Tagebuch (25.09., Nutzerinnen-Freigabe der Vorschau).
--
-- 1) Atem: feste Tageszeiten (atem_zeiten), Stimmung vorher/nachher und
--    Bibliotheks-Schlüssel an den Logs, Gruppen-Sessions (vom Coach
--    geplant, alle atmen im selben Takt ab start_um) mit Teilnahmen.
-- 2) Tagebuch: einmal am Tag Stimmung, Ort, Personen, Essen, Tagesart,
--    Körper, freie Notiz + automatische Tageswerte (auto). Freie Notizen
--    sind standardmäßig PRIVAT: keine Admin-Policy auf der Tabelle, der
--    Coach liest nur über admin_tagebuch(), das die Notiz ohne Freigabe
--    (notiz_teilen) weglässt.

alter table public.atemuebung_logs add column if not exists gefuehl_vorher text;
alter table public.atemuebung_logs add column if not exists uebung_key text;
alter table public.atemuebung_logs add column if not exists session_id uuid;

create table if not exists public.atem_zeiten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  uhrzeit time not null,
  uebung_key text not null,
  dauer_minuten int not null default 3,
  aktiv boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists atem_zeiten_user_idx on public.atem_zeiten (user_id);
alter table public.atem_zeiten enable row level security;
drop policy if exists "atem_zeiten: eigene Zeilen" on public.atem_zeiten;
create policy "atem_zeiten: eigene Zeilen" on public.atem_zeiten for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "atem_zeiten: admin voller Zugriff" on public.atem_zeiten;
create policy "atem_zeiten: admin voller Zugriff" on public.atem_zeiten for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.atem_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  erstellt_von uuid references auth.users (id) on delete set null,
  uebung_key text not null,
  dauer_minuten int not null default 10,
  start_um timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists atem_sessions_team_idx on public.atem_sessions (team_id, start_um);
alter table public.atem_sessions enable row level security;
drop policy if exists "atem_sessions: eigenes Team lesen" on public.atem_sessions;
create policy "atem_sessions: eigenes Team lesen" on public.atem_sessions for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = atem_sessions.team_id));
drop policy if exists "atem_sessions: admin voller Zugriff" on public.atem_sessions;
create policy "atem_sessions: admin voller Zugriff" on public.atem_sessions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.atem_session_teilnahmen (
  session_id uuid not null references public.atem_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  beigetreten_um timestamptz not null default now(),
  gefuehl_vorher text,
  gefuehl_nachher text,
  primary key (session_id, user_id)
);
alter table public.atem_session_teilnahmen enable row level security;
drop policy if exists "atem_teilnahmen: Team lesen" on public.atem_session_teilnahmen;
create policy "atem_teilnahmen: Team lesen" on public.atem_session_teilnahmen for select
  using (exists (select 1 from public.atem_sessions s join public.profiles p on p.team_id = s.team_id where s.id = atem_session_teilnahmen.session_id and p.id = auth.uid()));
drop policy if exists "atem_teilnahmen: eigene schreiben" on public.atem_session_teilnahmen;
create policy "atem_teilnahmen: eigene schreiben" on public.atem_session_teilnahmen for insert with check (auth.uid() = user_id);
drop policy if exists "atem_teilnahmen: eigene aendern" on public.atem_session_teilnahmen;
create policy "atem_teilnahmen: eigene aendern" on public.atem_session_teilnahmen for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "atem_teilnahmen: admin voller Zugriff" on public.atem_session_teilnahmen;
create policy "atem_teilnahmen: admin voller Zugriff" on public.atem_session_teilnahmen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.tagebuch_eintraege (
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  stimmung smallint not null check (stimmung between 1 and 5),
  orte text[] not null default '{}',
  personen text[] not null default '{}',
  essen text[] not null default '{}',
  tagesart text[] not null default '{}',
  koerper text[] not null default '{}',
  notiz text,
  notiz_teilen boolean not null default false,
  auto jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, datum)
);
alter table public.tagebuch_eintraege enable row level security;
drop policy if exists "tagebuch: eigene Zeilen" on public.tagebuch_eintraege;
create policy "tagebuch: eigene Zeilen" on public.tagebuch_eintraege for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.admin_tagebuch(p_user uuid, p_tage int default 60)
returns table (datum date, stimmung smallint, orte text[], personen text[], essen text[], tagesart text[], koerper text[], notiz text, notiz_geteilt boolean, auto jsonb)
language sql stable security definer set search_path = public as $$
  select t.datum, t.stimmung, t.orte, t.personen, t.essen, t.tagesart, t.koerper,
         case when t.notiz_teilen then t.notiz else null end,
         t.notiz_teilen, t.auto
  from public.tagebuch_eintraege t
  where public.is_admin(auth.uid()) and t.user_id = p_user and t.datum > current_date - p_tage
  order by t.datum;
$$;
revoke execute on function public.admin_tagebuch(uuid, int) from anon, public;
grant execute on function public.admin_tagebuch(uuid, int) to authenticated;

-- Tagesprotokoll: neue Kategorien.
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_kategorie_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_kategorie_check check (kategorie = any (array[
  'peptid','hormon','supplement','training','gewohnheit','hydration','mahlzeit','tageslicht','bildschirmzeit','workflow',
  'notfallmodus','protokoll','zeitblock','morgenroutine','abendroutine','schlaf','projekt','atemuebung','tagebuch']));

-- Ein Tagebuch-Eintrag zählt als Aktivität (Punkt), wie jede andere Erledigung.
create or replace function public._punkte_ereignisse(p_user uuid)
 returns table(tag date)
 language sql stable security definer set search_path to 'public'
as $function$
  with zone as (
    select coalesce(nullif(p.zeitzone, ''), 'Europe/Berlin') as tz from public.profiles p where p.id = p_user
  )
  select dose_date from public.hormone_logs where user_id = p_user and erledigt
  union all select log_date from public.supplement_logs where user_id = p_user and erledigt
  union all select log_date from public.meal_logs where user_id = p_user and erledigt
  union all select log_date from public.routine_logs where user_id = p_user
  union all select datum from public.training_sessions where user_id = p_user and erledigt
  union all select datum from public.sleep_entries where user_id = p_user
  union all select datum from (select datum, routine from public.routine_durchlaeufe where user_id = p_user and abgeschlossen_um is not null group by datum, routine) r
  union all
    select h.datum from public.hydration_logs h
    left join public.hydration_settings s on s.user_id = h.user_id
    where h.user_id = p_user
    group by h.datum, s.ziel_ml
    having sum(h.menge_ml) >= coalesce(s.ziel_ml, 2500)
  union all
    select t.datum from public.tageslicht_logs t
    left join public.tageslicht_settings s on s.user_id = t.user_id
    where t.user_id = p_user
    group by t.datum, s.ziel_minuten
    having sum(t.minuten) >= coalesce(s.ziel_minuten, 30)
  union all select (erstellt_am at time zone (select tz from zone))::date from public.atemuebung_logs where user_id = p_user
  union all select (erstellt_am at time zone (select tz from zone))::date from public.denkpause_ergebnisse where user_id = p_user and richtig
  union all
    select (erstellt_am at time zone (select tz from zone))::date as tag from public.denkpause_ergebnisse
    where user_id = p_user
    group by 1
    having count(*) >= 5
  union all select datum from public.gruppen_baustein_logs where user_id = p_user
  union all select datum from public.tagebuch_eintraege where user_id = p_user;
$function$;
