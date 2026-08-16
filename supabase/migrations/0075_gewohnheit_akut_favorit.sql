-- Akut-Übung markieren (Teil 18, Nutzerinnen-Vorgabe 16.08.): eine oder
-- mehrere bestehende Gewohnheiten (z. B. "Isometrisches Training",
-- "Atemübung") lassen sich als persönliche Anker-Übung fürs neue
-- Akutmodus-Feature markieren — die App schlägt sie dann in schwierigen
-- Momenten aktiv vor, statt nur eine allgemeine KI-Antwort zu geben.
alter table public.routines add column if not exists akut_favorit boolean not null default false;
