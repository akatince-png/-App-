-- Programme als eigenständige Module (26.09., Nutzerinnen-Vorgabe):
-- "Das Acht-Wochen-Programm soll als eigenständiges Programm hinterlegt
-- sein, das ich für alle aktivieren und deaktivieren kann ... für jeden
-- erstmal aktiviert, der das erste Mal auf die App kommt ... später
-- mehrere Programme, stufenweise für jeden einzelnen aktivieren und
-- individuell einstellen." Start ist individuell (legt der Coach fest).
--
-- - programme: Katalog. `aktiv` = für alle an/aus, `fuer_neue` = neue
--   Personen bekommen es automatisch (Status "wartet", bis der Coach den
--   Start festlegt). Nur der Coach (Admin) ändert, alle lesen.
-- - programm_teilnahmen: wer welches Programm hat, Status, Start,
--   individuelle Einstellungen. Person liest die eigenen, Coach alles.
-- - Das erste Programm "einstellung" (AKA-Einstellungsphase) ist das
--   bisherige Kernprogramm; dessen Etappen bleiben in coaching_etappen.
-- - profiles.vorstellung_tabs: was jemand in der Vorstellung als
--   "offene Tabs" angetippt hat (fürs Erstgespräch).

create table if not exists public.programme (
  id text primary key,
  name text not null,
  emoji text not null default '🧭',
  beschreibung text,
  wochen int,
  reihenfolge int not null default 0,
  aktiv boolean not null default true,
  fuer_neue boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.programme enable row level security;
drop policy if exists "programme: alle lesen" on public.programme;
create policy "programme: alle lesen" on public.programme for select using (auth.uid() is not null);
drop policy if exists "programme: admin voller Zugriff" on public.programme;
create policy "programme: admin voller Zugriff" on public.programme for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.programme (id, name, emoji, beschreibung, wochen, reihenfolge, aktiv, fuer_neue)
values ('einstellung', 'AKA-Einstellungsphase', '🧭', 'Kennenlernen, erst messen, dann Schritt für Schritt: Abend + Morgen, Bewegung, Essen + Planen, Feinschliff.', 8, 0, true, true)
on conflict (id) do nothing;

create table if not exists public.programm_teilnahmen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  programm_id text not null references public.programme (id) on delete cascade,
  status text not null default 'wartet' check (status in ('wartet', 'laufend', 'pausiert', 'abgeschlossen', 'beendet')),
  start date,
  einstellungen jsonb not null default '{}'::jsonb,
  notiz text,
  erstellt_von uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, programm_id)
);
create index if not exists programm_teilnahmen_user_idx on public.programm_teilnahmen (user_id);
alter table public.programm_teilnahmen enable row level security;
drop policy if exists "programm_teilnahmen: eigene lesen" on public.programm_teilnahmen;
create policy "programm_teilnahmen: eigene lesen" on public.programm_teilnahmen for select using (auth.uid() = user_id);
drop policy if exists "programm_teilnahmen: admin voller Zugriff" on public.programm_teilnahmen;
create policy "programm_teilnahmen: admin voller Zugriff" on public.programm_teilnahmen for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Neue Person → alle aktiven "für neue"-Programme mit Status "wartet".
create or replace function public.programme_fuer_neue_zuweisen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.programm_teilnahmen (user_id, programm_id, status)
  select new.id, p.id, 'wartet' from public.programme p where p.aktiv and p.fuer_neue
  on conflict (user_id, programm_id) do nothing;
  return new;
end;
$$;
drop trigger if exists profiles_programme_zuweisen on public.profiles;
create trigger profiles_programme_zuweisen after insert on public.profiles for each row execute function public.programme_fuer_neue_zuweisen();

-- Bestehende Personen: Einstellungsphase nachtragen. Wer schon eine
-- Etappe hat, läuft (Start = erste Etappe), alle anderen warten.
insert into public.programm_teilnahmen (user_id, programm_id, status, start)
select p.id, 'einstellung',
  case when e.start is null then 'wartet' else 'laufend' end,
  e.start
from public.profiles p
left join lateral (select min(start) as start from public.coaching_etappen ce where ce.user_id = p.id) e on true
on conflict (user_id, programm_id) do nothing;

alter table public.profiles add column if not exists vorstellung_tabs text[];
