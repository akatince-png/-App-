-- Gleicher Bug wie 0067/0088/0089, dritte unabhängige Fundstelle: die
-- Medikamente-Kategorien-Auswahl (MEDIKAMENTE_KATEGORIEN in constants.js,
-- direkt als Auswahl-Pills in MedikamenteView.jsx gerendert) enthält
-- "ADHS-Medikation" und "Cannabis" (Cannabis kam mit eigenen Feldern in
-- 0082_cannabis_felder.sql dazu) — der kategorie-Check der hormones-
-- Tabelle (zuletzt in 0042_peptide_zu_medikamente.sql erweitert) wurde
-- dabei nie mit aktualisiert. Jede Medikament-Neuanlage mit der Kategorie
-- "ADHS-Medikation" oder "Cannabis" scheitert seitdem beim Speichern —
-- bei einer ADHS-Coaching-App potenziell der am häufigsten gewählte
-- Wert überhaupt.
alter table public.hormones drop constraint if exists hormones_kategorie_check;
alter table public.hormones add constraint hormones_kategorie_check
  check (kategorie in ('ADHS-Medikation', 'Hormone', 'Peptid', 'Cannabis', 'Blutdruck', 'Diabetes', 'Cholesterin', 'Schmerzmittel', 'Sonstige'));
