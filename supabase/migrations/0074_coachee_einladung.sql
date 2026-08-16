-- Einladungssystem statt offener Selbstregistrierung + wählbarer
-- Onboarding-Umfang je Coachee — Nutzerinnen-Vorgabe 16.08.: "erstell
-- bitte die Möglichkeit, dass ich jemandem einen Link schicke ... und
-- eventuell das klassische [lange] Onboarding wieder einschalten kann,
-- nicht nur das kurze". Hintergrund: sie will verschiedene Coaching-
-- Modelle anbieten (mancher Coachee führt sich selbst per vollem
-- Onboarding, andere werden komplett von ihr geleitet).
--
-- onboarding_modus steuert in OnboardingFlow.jsx, ob eine Coachee (nicht
-- die Admin — die sieht im "Verwalten"-Modus ohnehin immer die volle
-- Einrichtung) beim eigenen Durchlauf nur den kurzen Steckbrief sieht
-- ('kurz', bisheriges Verhalten, bleibt Standard) oder die volle
-- Kategorie-Einrichtung ('lang').
alter table public.profiles add column if not exists onboarding_modus text not null default 'kurz' check (onboarding_modus in ('kurz', 'lang'));

-- admin_liste_probanden() (0035, zuletzt erweitert in 0073) liefert jetzt
-- zusätzlich onboarding_modus, damit AdminDashboardView.jsx ihn pro
-- Coachee anzeigen/umschalten kann, ohne eine Zusatzabfrage zu brauchen.
drop function if exists public.admin_liste_probanden();
create or replace function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean,
  team_id uuid,
  onboarding_modus text
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email, p.vorname, u.created_at, p.onboarding_complete, p.is_admin, p.team_id, p.onboarding_modus
  from auth.users u
  join public.profiles p on p.id = u.id
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;
