-- Erweiterung des Dosierungsmodells:
--   - zusätzliche Intervall-Typen: rollierender On/Off-Zyklus & feste Wochentage
--   - mehrere Injektions-/Einnahmezeiten pro Tag statt nur einer festen Uhrzeit
--   - echter Zeitstempel (Datum + Uhrzeit) beim Bestätigen einer Dosis
--   - Foto pro Präparat (Fläschchen/Packung, z. B. um Hersteller zu unterscheiden)
--   - Onboarding-Flag, damit neue Konten direkt in den Frage-Assistenten laufen

-- ---------------------------------------------------------------------------
-- protocol_peptide
-- ---------------------------------------------------------------------------
-- Der alte check-Constraint auf intervall_mode wurde von Postgres automatisch
-- benannt; wir suchen ihn dynamisch statt den Namen zu raten, damit dieser
-- Migrationsschritt unabhängig von der genauen Namensvergabe funktioniert.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.protocol_peptide'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%intervall_mode%'
  loop
    execute format('alter table public.protocol_peptide drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.protocol_peptide
  add constraint protocol_peptide_intervall_mode_check
  check (intervall_mode in ('fixed', 'custom', 'cycle', 'weekdays'));

alter table public.protocol_peptide
  add column if not exists on_days integer,
  add column if not exists off_days integer,
  add column if not exists weekdays text[] not null default '{}',
  add column if not exists foto_path text;

alter table public.protocol_peptide
  add column if not exists uhrzeiten text[] not null default array['20:00'];

update public.protocol_peptide set uhrzeiten = array[uhrzeit::text] where uhrzeit is not null;

alter table public.protocol_peptide drop column if exists uhrzeit;

-- ---------------------------------------------------------------------------
-- hormones
-- ---------------------------------------------------------------------------
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.hormones'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%intervall_mode%'
  loop
    execute format('alter table public.hormones drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.hormones
  add constraint hormones_intervall_mode_check
  check (intervall_mode in ('fixed', 'custom', 'cycle', 'weekdays'));

alter table public.hormones
  add column if not exists on_days integer,
  add column if not exists off_days integer,
  add column if not exists weekdays text[] not null default '{}',
  add column if not exists foto_path text;

alter table public.hormones
  add column if not exists uhrzeiten text[] not null default array['20:00'];

update public.hormones set uhrzeiten = array[uhrzeit::text] where uhrzeit is not null;

alter table public.hormones drop column if exists uhrzeit;

-- ---------------------------------------------------------------------------
-- peptide_logs: mehrere Dosen pro Tag unterscheiden + echter Bestätigungs-Zeitstempel
-- ---------------------------------------------------------------------------
alter table public.peptide_logs
  add column if not exists uhrzeit text not null default '20:00',
  add column if not exists erledigt_at timestamptz;

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.peptide_logs'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%dose_date%'
      and pg_get_constraintdef(oid) not ilike '%uhrzeit%'
  loop
    execute format('alter table public.peptide_logs drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.peptide_logs
  add constraint peptide_logs_protocol_id_peptid_name_dose_date_uhrzeit_key
  unique (protocol_id, peptid_name, dose_date, uhrzeit);

-- ---------------------------------------------------------------------------
-- hormone_logs: dasselbe für Hormone
-- ---------------------------------------------------------------------------
alter table public.hormone_logs
  add column if not exists uhrzeit text not null default '20:00',
  add column if not exists erledigt_at timestamptz;

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.hormone_logs'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%dose_date%'
      and pg_get_constraintdef(oid) not ilike '%uhrzeit%'
  loop
    execute format('alter table public.hormone_logs drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.hormone_logs
  add constraint hormone_logs_user_id_hormone_name_dose_date_uhrzeit_key
  unique (user_id, hormone_name, dose_date, uhrzeit);

-- ---------------------------------------------------------------------------
-- supplement_logs: echter Bestätigungs-Zeitstempel (Tageszeit unterscheidet bereits)
-- ---------------------------------------------------------------------------
alter table public.supplement_logs
  add column if not exists erledigt_at timestamptz;

-- ---------------------------------------------------------------------------
-- profiles: Onboarding-Status, damit neue Konten direkt in den Assistenten laufen
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;
