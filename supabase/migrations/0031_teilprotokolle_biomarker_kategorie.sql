-- Der Biomarker-Plan (CATEGORY_STEPS in categorySteps.js) fehlte in der
-- ursprünglichen Kategorie-Check-Constraint von teilprotokolle (0027) —
-- jede Zuordnung eines Hauptprotokolls zum Biomarker-Bereich (Onboarding
-- wie auch "Neues Protokoll") schlug dadurch mit
-- "teilprotokolle_kategorie_check" fehl.
alter table public.teilprotokolle drop constraint teilprotokolle_kategorie_check;
alter table public.teilprotokolle add constraint teilprotokolle_kategorie_check
  check (kategorie in ('schlaf', 'hydration', 'ernaehrung', 'training', 'gewohnheiten', 'supplemente', 'medikamente', 'peptide', 'biomarker'));
