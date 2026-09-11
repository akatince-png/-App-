-- Schließt die letzte Lücke der Peptid→Medikamente-Zusammenlegung aus
-- Migration 0042 (13.08.): protocol_peptide kennt "Bac-Wasser-Menge" (ml)
-- und "Sprühstöße" (Nasenspray) als peptid-spezifische Dosierungsdetails
-- (siehe 0007_einnahmeform_details.sql), hormones hatte diese beiden
-- Spalten bisher nicht übernommen. Bug-Report/Code-Check (11.09.): das
-- Onboarding legte Peptide bis jetzt weiterhin in protocol_peptide statt
-- in hormones an — dadurch tauchten im Onboarding eingetragene Peptide nie
-- im Tagesplan/Home/Wochenübersicht auf (buildDayItems() liest seit der
-- Zusammenlegung nur noch hormones/hormone_logs). Diese Spalten werden
-- gebraucht, damit das Onboarding jetzt komplett auf hormones umgestellt
-- werden kann, ohne dass Nutzerinnen mit Injektions-/Nasenspray-Peptiden
-- Dosierungsdetails verlieren.
alter table public.hormones
  add column if not exists bac_wasser_ml numeric,
  add column if not exists spruehstoesse integer;
