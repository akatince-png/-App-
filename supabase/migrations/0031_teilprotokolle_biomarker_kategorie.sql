-- Der Biomarker-Plan (CATEGORY_STEPS in categorySteps.js) fehlte in der
-- ursprünglichen Kategorie-Check-Constraint von teilprotokolle (0027) —
-- jede Zuordnung eines Hauptprotokolls zum Biomarker-Bereich (Onboarding
-- wie auch "Neues Protokoll") schlug dadurch mit
-- "teilprotokolle_kategorie_check" fehl.
--
-- "bildschirmzeit" und "tageslicht" stehen zusätzlich in der Liste: In der
-- Produktions-DB existierten bereits Zeilen mit diesen Kategorien (Reste
-- einer älteren Version von categorySteps.js, die im aktuellen Code nicht
-- mehr vorkommen) — die Constraint muss auch bestehende Daten weiter
-- zulassen, nicht nur die heutigen neun CATEGORY_STEPS-Keys.
alter table public.teilprotokolle drop constraint if exists teilprotokolle_kategorie_check;
alter table public.teilprotokolle add constraint teilprotokolle_kategorie_check
  check (kategorie in ('schlaf', 'hydration', 'ernaehrung', 'training', 'gewohnheiten', 'supplemente', 'medikamente', 'peptide', 'biomarker', 'bildschirmzeit', 'tageslicht'));
