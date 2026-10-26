-- Aufgaben und Termine mit echter Start-/Endzeit dokumentieren (26.10.,
-- Nutzerin: „dokumentieren, wann ich den Termin oder Workflow gestartet und
-- beendet habe, egal ob es sich nach der geplanten Zeit richtet“).
alter table public.matrix_aufgaben
  add column if not exists gestartet_am timestamptz,
  add column if not exists ausgefallen boolean not null default false;
alter table public.alltag_erledigt add column if not exists start time;
