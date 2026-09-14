-- Quest-Rangliste optional machen (App-Bauplan-Punkt, ADHS-Perspektive):
-- Vergleich mit anderen motiviert manche, wirkt bei anderen (gerade in
-- schlechten Phasen, Stichwort Rejection Sensitive Dysphoria) demotivierend
-- oder beschämend. Bisher zwangsweise für alle Coachees sichtbar und
-- selbst Teil der Rangliste — jetzt pro Coachee abschaltbar, in beide
-- Richtungen: wer sich ausblendet, sieht die Karte selbst nicht mehr UND
-- taucht auch bei den anderen nicht mehr auf.
alter table public.profiles
  add column if not exists rangliste_sichtbar boolean not null default true;

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
  group by p.id, p.vorname
  order by quests_erledigt desc, quests_angenommen desc;
$$;
