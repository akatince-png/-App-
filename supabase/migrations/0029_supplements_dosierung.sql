-- Supplemente bekommen dasselbe Dosierungs-/Intervallmodell wie Medikamente
-- (hormones, siehe 0003_dosing_upgrade.sql) und Peptide: statt nur einer
-- groben Tageszeit-Liste ("Morgens"/"Mittags"/"Abends") jetzt echte
-- Wochentage, konkrete Uhrzeiten, Intervall-Modus und ein optionales eigenes
-- Startdatum. Nur so lassen sich Erinnerungen sinnvoll timen — eine
-- Erinnerung ohne Uhrzeit kann nicht ausgelöst werden.
--
-- Die bestehende Spalte `tageszeiten` bleibt absichtlich erhalten: ältere
-- Einträge (vor dieser Migration) sind darüber weiterhin im Tagesplan
-- sichtbar, und der Tagesplan fällt auf sie zurück, wenn keine konkreten
-- Uhrzeiten hinterlegt sind (siehe dayItems.js).
alter table public.supplements
  add column if not exists menge text not null default '',
  add column if not exists intervall_mode text not null default 'fixed',
  add column if not exists intervall_days integer default 1,
  add column if not exists custom_days integer,
  add column if not exists on_days integer,
  add column if not exists off_days integer,
  add column if not exists weekdays text[] not null default '{}',
  add column if not exists uhrzeiten text[] not null default '{}',
  add column if not exists eigener_start date;

-- Idempotent: Constraint erst entfernen, dann neu setzen, damit ein zweiter
-- Lauf der Migration nicht an einem bereits existierenden Constraint scheitert.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.supplements'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%intervall_mode%'
  loop
    execute format('alter table public.supplements drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.supplements
  add constraint supplements_intervall_mode_check
  check (intervall_mode in ('fixed', 'custom', 'cycle', 'weekdays'));
