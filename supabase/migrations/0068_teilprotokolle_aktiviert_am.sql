-- Hält fest, seit wann ein Baustein zuletzt aktiviert ist — damit sich in
-- der neuen "Bausteine dieses Protokolls"-Übersicht (PlaeneView.jsx) zeigen
-- lässt, in welcher Woche des Protokolls welcher Baustein dazukam (z. B.
-- "Woche 1 nur Schlaf, Woche 2 + Hydration, Woche 3 + Medikamente" —
-- Nutzerinnen-Vorgabe, 15.08.). Wird von useHauptprotokollData.
-- teilprotokollSpeichern nur beim Übergang inaktiv→aktiv aktualisiert, nicht
-- bei jedem Speichern — ein Baustein, der einmal aktiv war und wieder
-- deaktiviert wird, behält sein letztes Aktivierungsdatum, bis er erneut
-- aktiviert wird.
alter table public.teilprotokolle add column if not exists aktiviert_am timestamptz not null default now();
