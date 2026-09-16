-- Gleicher Bug wie schon in 0067 (damals "tageslicht"): Bildschirmzeit
-- (0086_bildschirmzeit.sql, Teil 107) und Atemübungen (0076_atemuebungen.sql)
-- wurden als neue Lebensbereiche/Kategorien eingeführt, aber der
-- kategorie-Check von teilprotokolle wurde dabei jeweils nicht erweitert.
-- Der Onboarding-Kategorien-Schritt "bildschirmzeit" ruft
-- teilprotokollSpeichern(hauptprotokollId, "bildschirmzeit", ...) auf
-- (OnboardingCategoriesView.jsx), MehrTab.jsx bietet "Atemübungen" als
-- an-/abschaltbaren Baustein über dieselbe Funktion an
-- (BAUSTEINE_KATEGORIEN) — beide scheiterten seitdem mit
-- "new row for relation teilprotokolle violates check constraint
-- teilprotokolle_kategorie_check" (von der Nutzerin am 16.09. beim
-- Bildschirmzeit-Onboarding-Schritt gemeldet).
alter table public.teilprotokolle drop constraint if exists teilprotokolle_kategorie_check;
alter table public.teilprotokolle add constraint teilprotokolle_kategorie_check
  check (kategorie in ('schlaf', 'hydration', 'tageslicht', 'bildschirmzeit', 'ernaehrung', 'training', 'gewohnheiten', 'supplemente', 'medikamente', 'peptide', 'atemuebungen'));
