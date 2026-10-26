-- Termine rückmelden (26.10., Nutzerin: „Termin wahrgenommen, bis wann hat
-- er gedauert … oder abgesagt/ausgefallen – kleinteilig dokumentieren“).
-- Eine Zeile in alltag_erledigt = Rückmeldung zu diesem Tag.
alter table public.alltag_erledigt
  add column if not exists status text not null default 'wahrgenommen',
  add column if not exists ende time,
  add column if not exists notiz text;

alter table public.alltag_erledigt add constraint alltag_erledigt_status_check check (status in ('wahrgenommen', 'ausgefallen'));
