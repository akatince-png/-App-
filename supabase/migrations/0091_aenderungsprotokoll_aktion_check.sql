-- Gleicher Bug-Typ wie 0067/0088/0089, diesmal beim `aktion`-Check statt
-- `kategorie`: die Constraint aus Migration 0019 erlaubte von Anfang an nur
-- ('hinzugefügt', 'geändert', 'entfernt') — seitdem sind aber mehrere
-- weitere Aktions-Werte im Code dazugekommen, allen voran "erledigt", das
-- flächendeckend beim Abhaken/Bestätigen verwendet wird (Supplemente,
-- Medikamente, Mahlzeiten, Gewohnheiten). Wie bei 0089 scheitert das nicht
-- sichtbar (useAenderungsprotokoll.js fängt den Insert-Fehler nur mit
-- console.error ab) — jede "erledigt"-Bestätigung fehlt seitdem lautlos im
-- Tagesverlauf (Archiv → Protokolle). Live entdeckt beim Testen des
-- Supplemente-Abhakens (17.09.).
--
-- Vollständige Liste der Code-Fundstellen (grep -rhoE 'aktion: "[^"]*"'
-- src/): "erledigt", "ausgefallen", "Version festgehalten",
-- "Ausnahme zurückgenommen", plus die drei ursprünglichen.
alter table public.aenderungsprotokoll drop constraint if exists aenderungsprotokoll_aktion_check;
alter table public.aenderungsprotokoll add constraint aenderungsprotokoll_aktion_check
  check (aktion in ('hinzugefügt', 'geändert', 'entfernt', 'erledigt', 'ausgefallen', 'Version festgehalten', 'Ausnahme zurückgenommen'));
