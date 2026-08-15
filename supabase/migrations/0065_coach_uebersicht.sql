-- Nutzerin-Vorgabe 15.08.: eine grafische "Coach-Übersicht" über ALLE
-- Coachees gleichzeitig (nicht nur einzeln über "Verwalten als"), inkl.
-- Protokoll-Fortschritt und echter Zwei-Wege-Nachrichten direkt aus dieser
-- Übersicht heraus.
--
-- Bisher lief Coach -> Coachee nur indirekt über admin_notizen (zugestellt
-- über den KI-Assistenten-Chat, siehe 0036) — der Assistent ist für
-- Coachees im Coach-verwalteten Modell aber inzwischen ausgeblendet (siehe
-- 0045_coachee_modell.sql, KiChat.jsx), diese Nachrichten kamen also
-- vermutlich nie sichtbar an. coachee_nachrichten (0045) läuft bisher nur
-- Coachee -> Coach. Statt eines zweiten, ebenso unsicheren Zustellwegs:
-- coachee_nachrichten um eine Richtung erweitern (absender-Spalte) und
-- direkt auf der Startseite der Coachee anzeigen (garantiert sichtbar,
-- kein indirekter Umweg).
alter table public.coachee_nachrichten add column if not exists absender text not null default 'coachee';
alter table public.coachee_nachrichten drop constraint if exists coachee_nachrichten_absender_check;
alter table public.coachee_nachrichten add constraint coachee_nachrichten_absender_check check (absender in ('coachee', 'coach'));

-- Coachees dürfen weiterhin nur als "coachee" schreiben (nicht sich selbst
-- als "coach" ausgeben) — ersetzt die alte Insert-Policy um diese Prüfung.
drop policy if exists "coachee_nachrichten: eigene Zeilen anlegen" on public.coachee_nachrichten;
create policy "coachee_nachrichten: eigene Zeilen anlegen" on public.coachee_nachrichten
  for insert with check (auth.uid() = user_id and absender = 'coachee');

-- admin_liste_probanden() liefert bisher nur Name/E-Mail/Onboarding-Status
-- (0035) — für die Coach-Übersicht zusätzlich: aktives Protokoll
-- (Startdatum/Dauer, für den Fortschrittsring) und Anzahl ungelesener
-- Coachee-Nachrichten (für ein Badge). Return-Typ ändert sich, daher erst
-- droppen statt "create or replace".
drop function if exists public.admin_liste_probanden();
create function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean,
  protokoll_startdatum date,
  protokoll_dauer_wochen integer,
  ungelesene_nachrichten integer
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
    pr.startdatum,
    pr.dauer_wochen,
    coalesce(nq.anzahl, 0)::integer
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
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;
