-- Kurzfassung der Routinen (24.10., Nutzerin: „diese Notfallversion gerne
-- überall integrieren“). Markierte Schritte bilden die ⚡ Kurzfassung; beim
-- Start der Routine wählt man „Ganz“ oder „Kurz“, der Tag zählt in beiden
-- Fällen.
alter table public.routine_schritte add column if not exists kurz boolean not null default false;
