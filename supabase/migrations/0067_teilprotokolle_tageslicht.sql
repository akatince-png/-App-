-- Der Onboarding-Kategorien-Schritt "tageslicht" ruft seit Migration 0027
-- teilprotokollSpeichern(hauptprotokollId, "tageslicht", ...) auf, aber der
-- ursprüngliche kategorie-Check von teilprotokolle enthielt "tageslicht"
-- nie — jedes Speichern des Tageslicht-Bausteins schlug seitdem still
-- fehl (Fehler landete nur in der Konsole, kein sichtbarer Effekt für die
-- Nutzerin). Fällt jetzt auf, weil die neue Bausteine-Übersicht
-- (PlaeneView.jsx) den Aktiv-Zustand aller Kategorien inkl. Tageslicht
-- lesen und schreiben will.
alter table public.teilprotokolle drop constraint if exists teilprotokolle_kategorie_check;
alter table public.teilprotokolle add constraint teilprotokolle_kategorie_check
  check (kategorie in ('schlaf', 'hydration', 'tageslicht', 'ernaehrung', 'training', 'gewohnheiten', 'supplemente', 'medikamente', 'peptide'));
