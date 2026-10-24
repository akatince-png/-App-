-- Langzeit-Projekte mit Work-Sessions (24.10., Nutzerin: „Langzeitprojekte
-- planen, aber immer wieder Work-Sessions in die tagesaktuellen To-dos der
-- Matrix aufnehmen“). Ziel, Zeitraum und Session-Rhythmus je Projekt; die
-- Sessions selbst sind Matrix-Aufgaben (art = 'projekt', projekt_id).
alter table public.projekte add column if not exists ziel text;
alter table public.projekte add column if not exists start date;
alter table public.projekte add column if not exists deadline date;
alter table public.projekte add column if not exists session_tage text[] not null default '{}';
alter table public.projekte add column if not exists session_uhrzeit time;
alter table public.projekte add column if not exists session_dauer_min integer;
alter table public.projekte add column if not exists sessions_ziel integer;
