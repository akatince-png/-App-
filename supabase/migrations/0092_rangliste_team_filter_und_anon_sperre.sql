-- Datenbank-Review 23.09.2026: 0085_rangliste_optional.sql hat
-- quest_rangliste() per "create or replace" komplett neu geschrieben und
-- dabei den Team-Filter aus 0073_teams.sql verloren. Folge: jede Person —
-- sogar ohne Anmeldung, weil die Funktion SECURITY DEFINER ist und EXECUTE
-- standardmäßig auch für die Rolle "anon" gilt — sah Vornamen und Quest-
-- Zahlen ALLER Coachees mit rangliste_sichtbar = true, teamübergreifend.
-- Hier beide Regeln zusammengeführt: Team-Sichtbarkeit (0073) UND
-- Ausblenden-Möglichkeit (0085). Außerdem darf "anon" die Coachee-
-- bezogenen Funktionen nicht mehr aufrufen (is_admin() bleibt unberührt,
-- weil RLS-Policies sie auswerten).
create or replace function public.quest_rangliste()
returns table (
  user_id uuid,
  vorname text,
  quests_erledigt bigint,
  quests_angenommen bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.vorname,
    count(*) filter (where qf.erledigt) as quests_erledigt,
    count(*) filter (where qf.angenommen = true) as quests_angenommen
  from public.profiles p
  left join public.quest_fortschritt qf on qf.user_id = p.id
  where p.is_admin = false
    and p.rangliste_sichtbar = true
    and (
      public.is_admin(auth.uid())
      or p.id = auth.uid()
      or public.gleiches_team(auth.uid(), p.id)
    )
  group by p.id, p.vorname
  order by quests_erledigt desc, quests_angenommen desc;
$$;

revoke execute on function public.quest_rangliste() from anon, public;
revoke execute on function public.admin_liste_probanden() from anon, public;
revoke execute on function public.gleiches_team(uuid, uuid) from anon, public;
grant execute on function public.quest_rangliste() to authenticated;
grant execute on function public.admin_liste_probanden() to authenticated;
grant execute on function public.gleiches_team(uuid, uuid) to authenticated;
