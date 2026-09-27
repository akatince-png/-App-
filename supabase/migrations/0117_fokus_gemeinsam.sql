-- Gemeinsam fokussieren / Body Doubling (27.09., Nutzerinnen-Wunsch nach dem
-- Marktvergleich): Ziel setzen -> 25/50 Min. still arbeiten, während man sieht,
-- wer aus dem Team gerade auch dabei ist -> Ergebnis teilen. Ohne Kamera.
-- Der Coach kann feste Runden planen (fokus_runden), jede Person kann aber
-- auch jederzeit allein starten (fokus_sitzungen ohne runde_id).
create table if not exists public.fokus_runden (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams (id) on delete cascade, -- null = alle Coachees
  erstellt_von uuid references auth.users (id) on delete set null,
  titel text,
  dauer_minuten int not null default 25 check (dauer_minuten between 5 and 120),
  start_um timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists fokus_runden_start_idx on public.fokus_runden (start_um);
alter table public.fokus_runden enable row level security;
drop policy if exists "fokus_runden: eigenes Team lesen" on public.fokus_runden;
create policy "fokus_runden: eigenes Team lesen" on public.fokus_runden for select
  using (team_id is null or exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = fokus_runden.team_id));
drop policy if exists "fokus_runden: admin voller Zugriff" on public.fokus_runden;
create policy "fokus_runden: admin voller Zugriff" on public.fokus_runden for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.fokus_sitzungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  runde_id uuid references public.fokus_runden (id) on delete set null,
  ziel text,
  dauer_minuten int not null default 25 check (dauer_minuten between 1 and 180),
  start_um timestamptz not null default now(),
  beendet_um timestamptz,
  ergebnis text check (ergebnis in ('geschafft', 'teilweise', 'nicht')),
  teilen boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists fokus_sitzungen_user_idx on public.fokus_sitzungen (user_id, start_um);
create index if not exists fokus_sitzungen_start_idx on public.fokus_sitzungen (start_um);
alter table public.fokus_sitzungen enable row level security;
drop policy if exists "fokus_sitzungen: eigene Zeilen" on public.fokus_sitzungen;
create policy "fokus_sitzungen: eigene Zeilen" on public.fokus_sitzungen for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Andere sehen eine Sitzung nur, wenn sie geteilt ist und man im selben Team ist.
drop policy if exists "fokus_sitzungen: Team sieht geteilte" on public.fokus_sitzungen;
create policy "fokus_sitzungen: Team sieht geteilte" on public.fokus_sitzungen for select
  using (teilen and public.gleiches_team(auth.uid(), user_id));
drop policy if exists "fokus_sitzungen: admin lesen" on public.fokus_sitzungen;
create policy "fokus_sitzungen: admin lesen" on public.fokus_sitzungen for select using (public.is_admin(auth.uid()));

-- Punkte: 1 je Tag mit mindestens einer abgeschlossenen Fokus-Sitzung
-- (wie Konzentrationstraining), egal ob geschafft, teilweise oder nicht –
-- Dranbleiben zählt, nicht Perfektion.
create or replace function public._punkte_ereignisse(p_user uuid)
 returns table(tag date)
 language sql
 stable security definer
 set search_path to 'public'
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
  union all select datum from public.tagebuch_eintraege where user_id = p_user
  union all select distinct (erstellt_am at time zone (select tz from zone))::date from public.kognitiv_ergebnisse where user_id = p_user
  union all select distinct (start_um at time zone (select tz from zone))::date from public.fokus_sitzungen where user_id = p_user and ergebnis is not null;
$function$;
revoke execute on function public._punkte_ereignisse(uuid) from anon, public, authenticated;
