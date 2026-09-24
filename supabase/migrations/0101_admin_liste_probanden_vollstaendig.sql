-- Coach-Übersicht (Admin-Livetest 24.09.): Seit 0073 hatten alle späteren
-- Neufassungen von admin_liste_probanden() die Spalten aus 0065 verloren
-- (protokoll_startdatum, protokoll_dauer_wochen, ungelesene_nachrichten).
-- Folge: Die Coach-Übersicht zeigte bei allen "Kein aktives Protokoll", und
-- der rote "neu"-Hinweis für ungelesene Nachrichten erschien nie.
-- Wieder vollständig, dazu für den Überblick "wer braucht Aufmerksamkeit":
-- letzte_aktivitaet und punkte_7_tage (aus _punkte_ereignisse, nur Summen).
drop function if exists public.admin_liste_probanden();

create function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean,
  team_id uuid,
  onboarding_modus text,
  profilbild_pfad text,
  protokoll_startdatum date,
  protokoll_dauer_wochen integer,
  ungelesene_nachrichten integer,
  letzte_aktivitaet date,
  punkte_7_tage integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id,
    u.email,
    p.vorname,
    u.created_at,
    p.onboarding_complete,
    p.is_admin,
    p.team_id,
    p.onboarding_modus,
    p.profilbild_pfad,
    pr.startdatum,
    pr.dauer_wochen,
    coalesce(nq.anzahl, 0)::integer,
    ev.letzte,
    coalesce(ev.woche, 0)::integer
  from auth.users u
  join public.profiles p on p.id = u.id
  left join lateral (
    select startdatum, dauer_wochen from public.protocols
    where user_id = u.id and status = 'active'
    order by created_at desc
    limit 1
  ) pr on true
  left join lateral (
    select count(*) as anzahl from public.coachee_nachrichten
    where user_id = u.id and absender = 'coachee' and gelesen = false
  ) nq on true
  left join lateral (
    select max(e.tag) as letzte, count(*) filter (where e.tag > current_date - 7) as woche
    from public._punkte_ereignisse(u.id) e
    where e.tag <= current_date
  ) ev on true
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;

revoke execute on function public.admin_liste_probanden() from anon, public;
grant execute on function public.admin_liste_probanden() to authenticated;
