-- Spielstand EINER Person für den Steckbrief (24.10., Nutzerinnen-Wunsch:
-- Profil im Stil „Bild, Name, Punkte · Abzeichen · Level, Fortschritt,
-- Abzeichen“ – für den Coachee selbst und für den Coach in der
-- Coach-Übersicht). Punkte aus denselben Ereignissen wie Rangliste und
-- Team-Statistik (_punkte_ereignisse). Nur die Person selbst oder ein
-- Admin bekommt eine Zeile.
create or replace function public.person_spielstand(p_person uuid)
returns table(punkte_gesamt integer, punkte_7_tage integer, aktive_tage_7 integer, serie integer, abzeichen integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  with erlaubt as (
    select 1 where p_person = auth.uid() or public.is_admin(auth.uid())
  ),
  ev as (
    select e.tag from erlaubt cross join lateral public._punkte_ereignisse(p_person) e
  ),
  tage as (
    select distinct tag from ev
  ),
  luecken as (
    -- Serie: zusammenhängende Tage bis heute (oder gestern, wenn heute noch nichts war).
    select tag, tag - (row_number() over (order by tag))::int as gruppe from tage
  ),
  letzte_gruppe as (
    select gruppe, max(tag) as ende, count(*)::int as laenge from luecken group by gruppe order by max(tag) desc limit 1
  )
  select
    (select count(*) from ev)::int,
    (select count(*) from ev where tag > current_date - 7)::int,
    (select count(*) from tage where tag > current_date - 7)::int,
    coalesce((select laenge from letzte_gruppe where ende >= current_date - 1), 0),
    (select count(*) from public.errungenschaften z where z.user_id = p_person)::int
  from erlaubt;
$$;

grant execute on function public.person_spielstand(uuid) to authenticated;
