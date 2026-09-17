-- Nutzerinnen-Vorgabe (17.09., Konsistenz-Check über alle Kategorien):
-- Projekte (Wochenübersicht -> Projekte & Zeitblöcke) bekommen jetzt einen
-- "Verlauf"-Link wie andere benannte, wiederverwendete Einträge (analog zu
-- z.B. Supplementen). Gleicher CHECK-Constraint-Bug wie schon in
-- 0067/0088/0089/0090/0091 — hier der dafür nötige neue Kategorie-Wert
-- ergänzt, BEVOR der zugehörige App-Code ihn zum ersten Mal benutzt.
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_kategorie_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_kategorie_check
  check (kategorie in ('peptid', 'hormon', 'supplement', 'training', 'gewohnheit', 'hydration', 'mahlzeit', 'tageslicht', 'bildschirmzeit', 'workflow', 'notfallmodus', 'protokoll', 'zeitblock', 'morgenroutine', 'abendroutine', 'schlaf', 'projekt'));
