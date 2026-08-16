-- Rangliste der abgeschlossenen Quests, sichtbar für ALLE Coachees (nicht
-- nur die Admin) — Nutzerinnen-Vorgabe 16.08.: "die Leute sollen halt
-- meine Coachees gegeneinander antreten können ... bei den Quest[s]".
-- RLS auf quest_fortschritt erlaubt jeder Coachee nur die eigenen Zeilen
-- (siehe 0070_quests.sql) — für die Rangliste braucht es eine aggregierte,
-- aber NICHT die Rohdaten (Notizen etc.) preisgebende Sicht auf alle
-- anderen. Analog zu admin_liste_probanden() (0035) eine security-definer-
-- Funktion, die absichtlich nur Name + Anzahl zurückgibt, keine
-- Detail-Inhalte. Bewusst ohne is_admin()-Gate — soll ja gerade von
-- Coachees untereinander eingesehen werden können (Einzel-Tenant-Modell:
-- ein Coach, eine geschlossene Gruppe Coachees, siehe is_admin()/0035).
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
  group by p.id, p.vorname
  order by quests_erledigt desc, quests_angenommen desc;
$$;
