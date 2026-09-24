-- Gruppenprotokolle (Nutzerinnen-Freigabe der Vorschau, 24.09.2026): ein
-- Team führt zusätzlich zu den eigenen Protokollen ein gemeinsames Protokoll
-- mit gemeinsamen Bausteinen (jede Person hakt selbst ab) und Gruppen-Quests
-- (Team-Ziel über alle Mitglieder). Anlegen/Beenden nur durch Admins (Coach).
--
-- Baustein-Arten:
--   morgenroutine / abendroutine / trinkziel / tageslicht / tagesraetsel —
--     zählen automatisch aus den vorhandenen Daten jeder Person
--   eigen — eigene Gruppen-Gewohnheit, abgehakt über gruppen_baustein_logs

create table if not exists public.gruppenprotokolle (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  ziel text,
  startdatum date not null default current_date,
  enddatum date,
  status text not null default 'active' check (status in ('active', 'archived')),
  erstellt_von uuid references auth.users(id) on delete set null,
  erstellt_am timestamptz not null default now()
);

create table if not exists public.gruppen_bausteine (
  id uuid primary key default gen_random_uuid(),
  gruppenprotokoll_id uuid not null references public.gruppenprotokolle(id) on delete cascade,
  art text not null check (art in ('morgenroutine', 'abendroutine', 'trinkziel', 'tageslicht', 'tagesraetsel', 'eigen')),
  name text not null,
  icon text,
  reihenfolge int not null default 0
);

create table if not exists public.gruppen_baustein_logs (
  id uuid primary key default gen_random_uuid(),
  baustein_id uuid not null references public.gruppen_bausteine(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  datum date not null,
  erstellt_am timestamptz not null default now(),
  unique (baustein_id, user_id, datum)
);

create table if not exists public.gruppen_quests (
  id uuid primary key default gen_random_uuid(),
  gruppenprotokoll_id uuid not null references public.gruppenprotokolle(id) on delete cascade,
  titel text not null,
  baustein_id uuid references public.gruppen_bausteine(id) on delete cascade,
  ziel_anzahl int not null check (ziel_anzahl > 0),
  belohnung text,
  erstellt_am timestamptz not null default now()
);

create index if not exists gruppenprotokolle_team_idx on public.gruppenprotokolle(team_id, status);
create index if not exists gruppen_bausteine_gp_idx on public.gruppen_bausteine(gruppenprotokoll_id);
create index if not exists gruppen_baustein_logs_idx on public.gruppen_baustein_logs(baustein_id, datum);
create index if not exists gruppen_quests_gp_idx on public.gruppen_quests(gruppenprotokoll_id);

-- Gehört die aktuelle Person zum Team dieses Gruppenprotokolls?
create or replace function public.ist_im_gruppenprotokoll(p_gp uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.gruppenprotokolle g
    join public.profiles p on p.team_id = g.team_id
    where g.id = p_gp and p.id = auth.uid()
  );
$$;
revoke execute on function public.ist_im_gruppenprotokoll(uuid) from anon, public;
grant execute on function public.ist_im_gruppenprotokoll(uuid) to authenticated;

alter table public.gruppenprotokolle enable row level security;
alter table public.gruppen_bausteine enable row level security;
alter table public.gruppen_baustein_logs enable row level security;
alter table public.gruppen_quests enable row level security;

create policy "gruppenprotokolle: admin alles" on public.gruppenprotokolle for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "gruppenprotokolle: team lesen" on public.gruppenprotokolle for select to authenticated
  using (public.ist_im_gruppenprotokoll(id));

create policy "gruppen_bausteine: admin alles" on public.gruppen_bausteine for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "gruppen_bausteine: team lesen" on public.gruppen_bausteine for select to authenticated
  using (public.ist_im_gruppenprotokoll(gruppenprotokoll_id));

create policy "gruppen_quests: admin alles" on public.gruppen_quests for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "gruppen_quests: team lesen" on public.gruppen_quests for select to authenticated
  using (public.ist_im_gruppenprotokoll(gruppenprotokoll_id));

-- Logs: eigene schreiben/löschen (nur für Bausteine des eigenen Teams),
-- lesen: selbst, Admin, eigenes Team.
create policy "gruppen_logs: admin alles" on public.gruppen_baustein_logs for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "gruppen_logs: lesen" on public.gruppen_baustein_logs for select to authenticated
  using (user_id = auth.uid() or public.gleiches_team(auth.uid(), user_id));
create policy "gruppen_logs: eigene anlegen" on public.gruppen_baustein_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.gruppen_bausteine b where b.id = baustein_id and public.ist_im_gruppenprotokoll(b.gruppenprotokoll_id))
  );
create policy "gruppen_logs: eigene löschen" on public.gruppen_baustein_logs for delete to authenticated
  using (user_id = auth.uid());

-- Wer hat an welchem Tag welchen Baustein geschafft (nur "geschafft",
-- keine Details). Für Admins und Mitglieder des Teams.
create or replace function public.gruppenprotokoll_status(p_gp uuid, p_von date, p_bis date)
returns table (user_id uuid, vorname text, profilbild_pfad text, privat boolean, baustein_id uuid, datum date)
language sql
security definer
set search_path = public
stable
as $$
  with gp as (
    select g.* from public.gruppenprotokolle g
    where g.id = p_gp and (public.is_admin(auth.uid()) or public.ist_im_gruppenprotokoll(g.id))
  ),
  m as (
    select p.id, p.vorname, p.profilbild_pfad, coalesce(nullif(p.zeitzone, ''), 'Europe/Berlin') as tz,
      (p.rangliste_sichtbar = false and p.id <> auth.uid() and not public.is_admin(auth.uid())) as privat
    from public.profiles p join gp on p.team_id = gp.team_id
  ),
  b as (select gb.* from public.gruppen_bausteine gb join gp on gb.gruppenprotokoll_id = gp.id),
  treffer as (
    select m.id as uid, b.id as bid, r.datum
    from b join m on true
    join public.routine_durchlaeufe r on r.user_id = m.id and r.abgeschlossen_um is not null
      and r.routine = case b.art when 'morgenroutine' then 'morgen' when 'abendroutine' then 'abend' end
    where b.art in ('morgenroutine', 'abendroutine')
    union
    select m.id, b.id, h.datum
    from b join m on true
    join public.hydration_logs h on h.user_id = m.id
    left join public.hydration_settings s on s.user_id = m.id
    where b.art = 'trinkziel'
    group by m.id, b.id, h.datum, s.ziel_ml
    having sum(h.menge_ml) >= coalesce(s.ziel_ml, 2500)
    union
    select m.id, b.id, t.datum
    from b join m on true
    join public.tageslicht_logs t on t.user_id = m.id
    left join public.tageslicht_settings s on s.user_id = m.id
    where b.art = 'tageslicht'
    group by m.id, b.id, t.datum, s.ziel_minuten
    having sum(t.minuten) >= coalesce(s.ziel_minuten, 30)
    union
    select m.id, b.id, (d.erstellt_am at time zone m.tz)::date
    from b join m on true
    join public.denkpause_ergebnisse d on d.user_id = m.id
    where b.art = 'tagesraetsel'
    group by m.id, b.id, (d.erstellt_am at time zone m.tz)::date
    having count(*) >= 5
    union
    select l.user_id, l.baustein_id, l.datum
    from public.gruppen_baustein_logs l join b on b.id = l.baustein_id join m on m.id = l.user_id
    where b.art = 'eigen'
  )
  select m.id, case when m.privat then null else m.vorname end, case when m.privat then null else m.profilbild_pfad end, m.privat, t.bid, t.datum
  from treffer t join m on m.id = t.uid
  where t.datum between p_von and p_bis
  union all
  -- Mitglieder ohne Treffer trotzdem liefern (baustein_id/datum null),
  -- damit die Seite alle Personen kennt.
  select m.id, case when m.privat then null else m.vorname end, case when m.privat then null else m.profilbild_pfad end, m.privat, null, null
  from m;
$$;
revoke execute on function public.gruppenprotokoll_status(uuid, date, date) from anon, public;
grant execute on function public.gruppenprotokoll_status(uuid, date, date) to authenticated;

-- Punkte: eigene Gruppen-Gewohnheiten zählen wie jeder erledigte Eintrag
-- (1 Punkt je Tag und Baustein) — Team-Seite/Liga rechnen damit.
create or replace function public._punkte_ereignisse(p_user uuid)
returns table (tag date)
language sql
security definer
set search_path = public
stable
as $$
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
  union all select datum from public.gruppen_baustein_logs where user_id = p_user;
$$;
revoke execute on function public._punkte_ereignisse(uuid) from anon, public, authenticated;
