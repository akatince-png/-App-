-- Rangliste aller Coachees + Teilen-Freigabe (Nutzerinnen-Freigabe der
-- Vorschau, 24.09.2026):
--   * Jede Person entscheidet selbst, ob ihre Punkte geteilt werden
--     (profiles.rangliste_sichtbar) — Startzustand jetzt AUS.
--   * Personen-Rangliste über alle Coachees: nur wer teilt, erscheint mit
--     Vorname/Bild/Team/Punkten; ansehen dürfen alle angemeldeten Personen.
--   * Team-Ergebnisse sind immer sichtbar (Summen verraten keine Einzelwerte):
--     team_liga liefert zusätzlich die Gesamtpunkte je Team.

alter table public.profiles alter column rangliste_sichtbar set default false;

-- Bestehende Konten: aus, außer den vier Dauertest-Konten (Team-Vergleich
-- bis 24.10. läuft mit geteilten Punkten weiter).
update public.profiles p
set rangliste_sichtbar = (u.email in (
  'claude.dauertest@example.com', 'claude.dauertest2@example.com',
  'claude.dauertest3@example.com', 'claude.dauertest4@example.com'))
from auth.users u
where u.id = p.id;

-- Personen-Rangliste. Nicht teilende Personen kommen nur als Zeile ohne
-- Namen/Zahlen mit (teilt = false), damit die App "x weitere teilen nicht"
-- anzeigen kann. Admin-Konten zählen nur mit, wenn sie selbst teilen.
create or replace function public.rangliste_personen(p_von date, p_bis date)
returns table (
  user_id uuid,
  teilt boolean,
  vorname text,
  profilbild_pfad text,
  team_name text,
  punkte int,
  aktive_tage date[]
)
language sql
security definer
set search_path = public
stable
as $$
  with m as (
    select p.id, p.vorname, p.profilbild_pfad, p.team_id, p.rangliste_sichtbar as teilt
    from public.profiles p
    where auth.uid() is not null
      and (not p.is_admin or p.rangliste_sichtbar)
  ),
  ev as (
    select m.id as uid, e.tag
    from m
    cross join lateral public._punkte_ereignisse(m.id) e
    where m.teilt
  )
  select
    m.id,
    m.teilt,
    case when m.teilt then m.vorname end,
    case when m.teilt then m.profilbild_pfad end,
    case when m.teilt then (select t.name from public.teams t where t.id = m.team_id) end,
    case when m.teilt then (select count(*) from ev where ev.uid = m.id and ev.tag between p_von and p_bis)::int end,
    case when m.teilt then (select array_agg(distinct ev.tag order by ev.tag desc) from ev where ev.uid = m.id and ev.tag >= current_date - 400) end
  from m;
$$;

revoke execute on function public.rangliste_personen(date, date) from anon, public;
grant execute on function public.rangliste_personen(date, date) to authenticated;

-- Team-Liga: zusätzlich die Gesamtpunkte je Team im Zeitraum (punkte_summe).
drop function if exists public.team_liga(date, date);

create or replace function public.team_liga(p_von date, p_bis date)
returns table (
  team_id uuid,
  team_name text,
  mitglieder int,
  schnitt numeric,
  schnitt_vorher numeric,
  aktive_tage_schnitt numeric,
  raetsel_tage int,
  initialen text[],
  ist_mein_team boolean,
  punkte_summe int
)
language sql
security definer
set search_path = public
stable
as $$
  with mitglieder as (
    select p.id, p.team_id, left(coalesce(nullif(p.vorname, ''), '?'), 1) as initial, p.zeitzone
    from public.profiles p
    where p.team_id is not null
  ),
  ev as (
    select m.id as uid, m.team_id, e.tag
    from mitglieder m
    cross join lateral public._punkte_ereignisse(m.id) e
  ),
  raetsel as (
    select m.team_id, count(*) as tage from (
      select d.user_id, (d.erstellt_am at time zone coalesce(nullif(mm.zeitzone, ''), 'Europe/Berlin'))::date as tag
      from public.denkpause_ergebnisse d join mitglieder mm on mm.id = d.user_id
      group by 1, 2 having count(*) >= 5
    ) r join mitglieder m on m.id = r.user_id
    where r.tag between p_von and p_bis
    group by m.team_id
  )
  select
    t.id,
    t.name,
    (select count(*) from mitglieder m where m.team_id = t.id)::int,
    round(coalesce((select count(*) from ev where ev.team_id = t.id and ev.tag between p_von and p_bis), 0)::numeric
      / greatest(1, (select count(*) from mitglieder m where m.team_id = t.id)), 1),
    round(coalesce((select count(*) from ev where ev.team_id = t.id and ev.tag between p_von - (p_bis - p_von + 1) and p_von - 1), 0)::numeric
      / greatest(1, (select count(*) from mitglieder m where m.team_id = t.id)), 1),
    round(coalesce((select count(distinct (ev.uid, ev.tag)) from ev where ev.team_id = t.id and ev.tag between p_von and p_bis), 0)::numeric
      / greatest(1, (select count(*) from mitglieder m where m.team_id = t.id)), 1),
    coalesce((select r.tage from raetsel r where r.team_id = t.id), 0)::int,
    (select array_agg(m.initial) from mitglieder m where m.team_id = t.id),
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = t.id),
    coalesce((select count(*) from ev where ev.team_id = t.id and ev.tag between p_von and p_bis), 0)::int
  from public.teams t
  where auth.uid() is not null
  order by 4 desc;
$$;

revoke execute on function public.team_liga(date, date) from anon, public;
grant execute on function public.team_liga(date, date) to authenticated;
