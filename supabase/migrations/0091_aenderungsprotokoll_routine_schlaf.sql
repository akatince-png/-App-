-- Nutzerinnen-Vorgabe (17.09.): "Alle Veränderungen sollen immer im
-- Tagesverlauf mit auftauchen" — Morgen-/Abendroutine (Schritte
-- hinzufügen/entfernen/verschieben, Zeitrahmen ändern, Schritt bestätigen)
-- und der Schlafplan (Bettzeit/Aufwachzeit, siehe SchlafplanCard.jsx)
-- riefen bisher an keiner Stelle aenderungVermerken() auf. Gleicher
-- CHECK-Constraint-Bug wie schon in 0067/0088/0089/0090 — hier die dafür
-- nötigen drei neuen Kategorie-Werte ergänzt, BEVOR der zugehörige App-Code
-- sie zum ersten Mal benutzt (anders als bei den vorherigen Funden, wo der
-- Code schon lief und lautlos/sichtbar scheiterte).
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_kategorie_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_kategorie_check
  check (kategorie in ('peptid', 'hormon', 'supplement', 'training', 'gewohnheit', 'hydration', 'mahlzeit', 'tageslicht', 'bildschirmzeit', 'workflow', 'notfallmodus', 'protokoll', 'zeitblock', 'morgenroutine', 'abendroutine', 'schlaf'));
