-- Matrix ausbauen (07.10.2026, Wunschliste der Nutzerin: „Beim Anlegen ein
-- kleines Auswahlfenster: Termin, Projekt, Aufgabe …“ und Termine mit
-- Uhrzeit im Tagesplan). Am 07.10. per Supabase-SQL eingespielt
-- (Dauerfreigabe Datenbank, CLAUDE.md).
alter table public.matrix_aufgaben add column if not exists art text not null default 'aufgabe';
alter table public.matrix_aufgaben add column if not exists uhrzeit time;
