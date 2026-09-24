-- Team-Seite, Team-Liga und Coach-Ansicht (Nutzerinnen-Freigabe der Vorschau,
-- 24.09.2026). Punkte werden in der App sonst nur auf dem eigenen Gerät aus
-- den eigenen Logs berechnet (utils/errungenschaften.js) — für das Team
-- braucht es eine Server-Funktion, die NUR Summen herausgibt (keine
-- Medikamente, keine Gesundheitsdetails).
--
-- Zählweise wie in errungenschaften.js: 1 Punkt je erledigtem Eintrag
-- (Medikamente, Supplemente, Mahlzeiten, Gewohnheiten, Training, Schlaf-
-- eintrag, Atemübung, richtige Tagesrätsel-Antwort), je Tag mit erreichtem
-- Wasser-/Tageslicht-Ziel, je abgeschlossener Routine pro Tag, dazu 1
-- Bonuspunkt je geschafftem Tagesrätsel (≥ 5 Antworten).

-- Intern: alle Punkte-Ereignisse einer Person (ein Punkt je Zeile).
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
    having count(*) >= 5;
$$;

revoke execute on function public._punkte_ereignisse(uuid) from anon, public, authenticated;

-- Mitglieder-Statistik: für Admins alle Personen in einem Team, sonst nur
-- das eigene Team (inkl. sich selbst). Wer die Rangliste ausgeblendet hat
-- (rangliste_sichtbar = false), erscheint für andere nur als "privat"
-- (Zahlen = null).
create or replace function public.team_mitglieder_statistik(p_von date, p_bis date)
returns table (
  user_id uuid,
  vorname text,
  profilbild_pfad text,
  team_id uuid,
  privat boolean,
  punkte_zeitraum int,
  punkte_gesamt int,
  aktive_tage date[],
  letzte_aktivitaet date
)
language sql
security definer
set search_path = public
stable
as $$
  with sichtbar as (
    select p.*
    from public.profiles p
    where p.team_id is not null
      and (public.is_admin(auth.uid()) or p.id = auth.uid() or public.gleiches_team(auth.uid(), p.id))
  ),
  ev as (
    select s.id as uid, e.tag
    from sichtbar s
    cross join lateral public._punkte_ereignisse(s.id) e
  )
  select
    s.id,
    s.vorname,
    s.profilbild_pfad,
    s.team_id,
    (s.rangliste_sichtbar = false and s.id <> auth.uid() and not public.is_admin(auth.uid())) as privat,
    case when s.rangliste_sichtbar = false and s.id <> auth.uid() and not public.is_admin(auth.uid()) then null
      else (select count(*) from ev where ev.uid = s.id and ev.tag between p_von and p_bis)::int end,
    case when s.rangliste_sichtbar = false and s.id <> auth.uid() and not public.is_admin(auth.uid()) then null
      else (select count(*) from ev where ev.uid = s.id)::int end,
    case when s.rangliste_sichtbar = false and s.id <> auth.uid() and not public.is_admin(auth.uid()) then null
      else (select array_agg(distinct ev.tag order by ev.tag desc) from ev where ev.uid = s.id and ev.tag >= current_date - 400) end,
    case when s.rangliste_sichtbar = false and s.id <> auth.uid() and not public.is_admin(auth.uid()) then null
      else (select max(ev.tag) from ev where ev.uid = s.id) end
  from sichtbar s
  order by s.team_id, s.vorname;
$$;

revoke execute on function public.team_mitglieder_statistik(date, date) from anon, public;
grant execute on function public.team_mitglieder_statistik(date, date) to authenticated;

-- Team-Liga: nur Team-Summen (Ø Punkte pro Person im Zeitraum und im
-- gleich langen Zeitraum davor, Ø aktive Tage, geschaffte Tagesrätsel) und
-- Anfangsbuchstaben — keine Einzelwerte fremder Personen.
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
  ist_mein_team boolean
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
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = t.id)
  from public.teams t
  where auth.uid() is not null
  order by 4 desc;
$$;

revoke execute on function public.team_liga(date, date) from anon, public;
grant execute on function public.team_liga(date, date) to authenticated;

-- Team-Neuigkeiten: kleine Erfolge der eigenen Team-Mitglieder der letzten
-- Tage (Routine geschafft, Tagesrätsel gelöst, Training erledigt) — keine
-- Gesundheitsdetails, keine Privat-Personen.
create or replace function public.team_neuigkeiten(p_tage int default 3)
returns table (user_id uuid, vorname text, profilbild_pfad text, art text, tag date, zeitpunkt timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  with m as (
    select p.id, p.vorname, p.profilbild_pfad, coalesce(nullif(p.zeitzone, ''), 'Europe/Berlin') as tz
    from public.profiles p
    where p.team_id is not null
      and (p.id = auth.uid() or public.gleiches_team(auth.uid(), p.id))
      and (p.rangliste_sichtbar or p.id = auth.uid())
  )
  select * from (
    -- je Person/Routine/Tag nur ein Eintrag (mehrfach abgeschlossen → einmal)
    select m.id, m.vorname, m.profilbild_pfad, 'routine_' || r.routine, r.datum, max(r.abgeschlossen_um)
    from public.routine_durchlaeufe r join m on m.id = r.user_id
    where r.abgeschlossen_um is not null and r.datum >= current_date - p_tage
    group by m.id, m.vorname, m.profilbild_pfad, r.routine, r.datum
    union all
    select m.id, m.vorname, m.profilbild_pfad, 'training', t.datum, max(t.created_at)
    from public.training_sessions t join m on m.id = t.user_id
    where t.erledigt and t.datum >= current_date - p_tage and t.datum <= current_date
    group by m.id, m.vorname, m.profilbild_pfad, t.datum
    union all
    select m.id, m.vorname, m.profilbild_pfad, 'tagesraetsel', (d.erstellt_am at time zone m.tz)::date, max(d.erstellt_am)
    from public.denkpause_ergebnisse d join m on m.id = d.user_id
    where d.erstellt_am >= now() - make_interval(days => p_tage + 1)
    group by m.id, m.vorname, m.profilbild_pfad, (d.erstellt_am at time zone m.tz)::date
    having count(*) >= 5
  ) x
  order by 6 desc
  limit 15;
$$;

revoke execute on function public.team_neuigkeiten(int) from anon, public;
grant execute on function public.team_neuigkeiten(int) to authenticated;
