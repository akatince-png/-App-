-- Training-Wochenplan: bisher höchstens eine Zuweisung pro Wochentag
-- (unique user_id+wochentag). Der Onboarding-Trainingsschritt braucht aber
-- mehrere Einheiten pro Tag zu unterschiedlichen Uhrzeiten, kombinierbare
-- Trainingsarten in einer Einheit (z. B. Kraft + Cardio) sowie optionales
-- Aufwärmen/Cool-down mit Dauer und Kurzbeschreibung — deshalb die
-- Unique-Beschränkung aufheben und die alte "eine Art pro Tag"-Spalte durch
-- ein Array ersetzen. "art"/"template_id" bleiben nullable stehen, damit
-- bereits gespeicherte Zeilen gültig bleiben; neue Zeilen befüllen nur noch
-- "arten".
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.training_wochenplan'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%wochentag%'
  loop
    execute format('alter table public.training_wochenplan drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.training_wochenplan alter column art drop not null;

alter table public.training_wochenplan add column if not exists arten jsonb not null default '[]'::jsonb;
alter table public.training_wochenplan add column if not exists saetze text;
alter table public.training_wochenplan add column if not exists wiederholungen text;
alter table public.training_wochenplan add column if not exists uebungen text;
alter table public.training_wochenplan add column if not exists warmup_aktiv boolean not null default false;
alter table public.training_wochenplan add column if not exists warmup_dauer_min integer;
alter table public.training_wochenplan add column if not exists warmup_beschreibung text;
alter table public.training_wochenplan add column if not exists cooldown_aktiv boolean not null default false;
alter table public.training_wochenplan add column if not exists cooldown_dauer_min integer;
alter table public.training_wochenplan add column if not exists cooldown_beschreibung text;

update public.training_wochenplan set arten = to_jsonb(array[art]) where art is not null and arten = '[]'::jsonb;
