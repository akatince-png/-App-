-- Team-Neuigkeiten im "Verwalten als"-Modus (Admin-Livetest 24.09.): die
-- Funktion sah bisher immer aus Sicht von auth.uid() — eine Admin ohne Team
-- bekam beim Verwalten einer Person deren Team-Feed leer. Neuer optionaler
-- Parameter p_fuer: nur für Admins wirksam, sonst gilt weiter auth.uid().
drop function if exists public.team_neuigkeiten(int);

create or replace function public.team_neuigkeiten(p_tage int default 3, p_fuer uuid default null)
returns table (user_id uuid, vorname text, profilbild_pfad text, art text, tag date, zeitpunkt timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  with ich as (
    select case when p_fuer is not null and public.is_admin(auth.uid()) then p_fuer else auth.uid() end as id
  ),
  m as (
    select p.id, p.vorname, p.profilbild_pfad, coalesce(nullif(p.zeitzone, ''), 'Europe/Berlin') as tz
    from public.profiles p, ich
    where p.team_id is not null
      and (p.id = ich.id or public.gleiches_team(ich.id, p.id))
      and (p.rangliste_sichtbar or p.id = ich.id)
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

revoke execute on function public.team_neuigkeiten(int, uuid) from anon, public;
grant execute on function public.team_neuigkeiten(int, uuid) to authenticated;
