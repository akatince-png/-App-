-- Teams: die Admin kann Coachees in Gruppen zusammenfassen — Nutzerinnen-
-- Vorgabe 16.08.: "dass sich Coachees untereinander oder von mir in Teams
-- zusammengesetzt werden und dann nur diese Teams die Dinge voneinander
-- sehen können ... dass man sich untereinander auch Motivation gibt und
-- ... Push Nachrichten senden kann". Ersetzt/ergänzt die bisherige
-- "alle Coachees sehen alle" Quest-Rangliste (0072) um eine Team-Scope:
-- gehört eine Coachee zu einem Team, sieht sie nur noch ihre Team-Kolleg:innen
-- in der Rangliste, nicht mehr den gesamten Bestand.
--
-- V1-Umfang: EIN Team pro Coachee (kein Mehrfach-Mitgliedschaften nötig für
-- eine überschaubare Coaching-Gruppe) — deshalb team_id direkt als Spalte
-- auf profiles statt einer eigenen n:m-Tabelle, analog is_admin/steckbrief.

-- Nachgezogen: quest_fortschritt.angenommen (aus 0070_quests.sql) wurde
-- erst NACH dem ursprünglichen Deploy dieser Tabelle ergänzt (siehe
-- UEBERGABEPROTOKOLL.md Teil 7) — quest_rangliste() unten braucht die
-- Spalte, deshalb hier zur Sicherheit nochmal mit "if not exists"
-- nachgeholt, statt sich auf den Stand von 0070 zu verlassen.
alter table public.quest_fortschritt add column if not exists angenommen boolean;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  erstellt_am timestamptz not null default now()
);

-- Muss VOR den teams-Policies unten stehen — die "eigenes Team lesen"-
-- Policy referenziert profiles.team_id in ihrer USING-Klausel, das scheitert
-- beim Anlegen der Policy, wenn die Spalte noch nicht existiert.
alter table public.profiles add column if not exists team_id uuid references public.teams (id) on delete set null;

alter table public.teams enable row level security;

-- Jede Coachee darf den Namen des eigenen Teams lesen (z. B. für die
-- Anzeige "Team Sonnenschein"), aber nicht anlegen/ändern — das bleibt der
-- Admin vorbehalten. "Eigenes Team" wird über profiles.team_id geprüft.
create policy "teams: eigenes Team lesen" on public.teams
  for select using (id in (select team_id from public.profiles where id = auth.uid()));

create policy "teams: admin voller Zugriff" on public.teams
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- admin_liste_probanden() (0035) erweitert um team_id, damit AdminTeamsView.jsx
-- ohne Zusatzabfrage weiß, wer schon in welchem Team ist. "create or replace"
-- reicht hier nicht, weil sich die Rückgabespalten ändern — deshalb vorher
-- explizit gedroppt.
drop function if exists public.admin_liste_probanden();
create or replace function public.admin_liste_probanden()
returns table (
  id uuid,
  email text,
  vorname text,
  erstellt_am timestamptz,
  onboarding_complete boolean,
  is_admin boolean,
  team_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email, p.vorname, u.created_at, p.onboarding_complete, p.is_admin, p.team_id
  from auth.users u
  join public.profiles p on p.id = u.id
  where public.is_admin(auth.uid())
  order by u.created_at desc;
$$;

-- Hilfsfunktion für RLS-Checks weiter unten (Peer-Nachrichten) und in der
-- API: sind zwei Personen im selben (nicht-null) Team? security definer,
-- weil eine normale RLS-Policy sonst nicht ohne Weiteres quer über zwei
-- profiles-Zeilen zweier verschiedener Nutzer:innen lesen dürfte.
create or replace function public.gleiches_team(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles pa
    join public.profiles pb on pa.team_id = pb.team_id
    where pa.id = a and pb.id = b and pa.team_id is not null
  );
$$;

-- Rangliste jetzt team-bewusst: Admin sieht weiterhin alle Coachees (wie
-- bisher), eine Coachee mit Team sieht nur ihre Team-Kolleg:innen, eine
-- Coachee ohne Team sieht nur sich selbst (kein Rundum-Vergleich ohne
-- Team-Zuordnung — "nur diese Teams die Dinge voneinander sehen können").
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
    and (
      public.is_admin(auth.uid())
      or p.id = auth.uid()
      or public.gleiches_team(auth.uid(), p.id)
    )
  group by p.id, p.vorname
  order by quests_erledigt desc, quests_angenommen desc;
$$;

-- team_nachrichten: 1:1-Motivationsnachrichten zwischen Team-Kolleg:innen
-- (nicht an die Admin gerichtet — dafür gibt's schon coachee_nachrichten).
-- Push-Zustellung läuft über eine eigene Edge Function (send-team-push),
-- die vor dem Senden serverseitig per gleiches_team() prüft.
create table public.team_nachrichten (
  id uuid primary key default gen_random_uuid(),
  absender_id uuid not null references auth.users (id) on delete cascade,
  empfaenger_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  gelesen boolean not null default false,
  erstellt_am timestamptz not null default now()
);

create index team_nachrichten_empfaenger_idx on public.team_nachrichten (empfaenger_id, erstellt_am);
create index team_nachrichten_absender_idx on public.team_nachrichten (absender_id, erstellt_am);

alter table public.team_nachrichten enable row level security;

create policy "team_nachrichten: an Team-Kolleg:in senden" on public.team_nachrichten
  for insert with check (auth.uid() = absender_id and public.gleiches_team(auth.uid(), empfaenger_id));

create policy "team_nachrichten: eigene Zeilen lesen" on public.team_nachrichten
  for select using (auth.uid() = absender_id or auth.uid() = empfaenger_id);

create policy "team_nachrichten: als gelesen markieren" on public.team_nachrichten
  for update using (auth.uid() = empfaenger_id) with check (auth.uid() = empfaenger_id);

create policy "team_nachrichten: admin voller Zugriff" on public.team_nachrichten
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
