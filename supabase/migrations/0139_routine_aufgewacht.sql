-- Aufwachzeit getrennt vom Routine-Beginn (07.11., Nutzerin: „Wecker auf 7 Uhr,
-- ich beginne aber erst um 9 – die realen Zeiten sollen dokumentiert werden“).
-- Je Schritt stehen Start/Ende zusätzlich im JSON `schritte` (startUm, endeUm, platz).
alter table public.routine_durchlaeufe add column if not exists aufgewacht_um timestamptz;
