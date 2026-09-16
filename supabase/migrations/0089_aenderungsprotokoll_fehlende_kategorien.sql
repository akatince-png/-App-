-- Gleicher Bug wie 0067 (Tageslicht) und 0088 (Bildschirmzeit/Atemübungen),
-- nur an einer zweiten, unabhängigen Stelle gefunden (Nutzerinnen-Bitte,
-- 16.09.: "check auch bitte gleich den Rest ... oder andere Bereiche wie
-- diesen, ob da Bugs sind"): der kategorie-Check von aenderungsprotokoll
-- (Migration 0019, "Tagesverlauf"/Änderungs-Log) wurde seit dessen
-- Erstellung nie erweitert, obwohl seitdem mehrere neue Kategorien und
-- Aufrufstellen dazugekommen sind. Betroffen (Code-Fundstellen):
--   - "workflow"       — GewohnheitenView.jsx, TagesEintragBearbeiten.jsx,
--                        useUniversellerCoach.js (Workout-Flow anlegen/
--                        Ausnahme setzen)
--   - "notfallmodus"   — HomeView.jsx (Notfallmodus an/aus)
--   - "protokoll"      — MehrTab.jsx (Baustein an/ausschalten, "Version
--                        festhalten")
--   - "tageslicht"     — useZielMitKorrektur.js über TageslichtView.jsx
--                        (Ziel korrigieren)
--   - "bildschirmzeit" — useZielMitKorrektur.js über BildschirmzeitView.jsx
--                        (Ziel korrigieren)
--   - "zeitblock"      — dayItems.js (vorsorglich mit aufgenommen, falls
--                        ein Zeitblock/Termin je über aenderungVermerken
--                        läuft)
-- Anders als beim teilprotokolle-Bug scheitert das hier bisher NICHT
-- sichtbar: useAenderungsprotokoll.js fängt den Fehler ab und loggt ihn
-- nur in die Konsole (`console.error`, kein Wurf, kein UI-Fehler) — die
-- betroffenen Änderungen fehlen seitdem einfach lautlos im Tagesverlauf
-- (Archiv → Protokolle), ohne dass es auffällt.
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_kategorie_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_kategorie_check
  check (kategorie in ('peptid', 'hormon', 'supplement', 'training', 'gewohnheit', 'hydration', 'mahlzeit', 'tageslicht', 'bildschirmzeit', 'workflow', 'notfallmodus', 'protokoll', 'zeitblock'));
