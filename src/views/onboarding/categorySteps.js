// Reihenfolge und Anzeige-Metadaten für den Onboarding-Kategorien-Screen —
// vom natürlichsten/alltäglichsten Tracking-Punkt zum unnatürlichsten/
// klinischsten: erst die Basis-Lebensgewohnheiten (Schlaf, Trinken, Essen,
// Training, sonstige Gewohnheiten), dann Supplemente, dann Medikamente, dann
// das Peptid-Protokoll, ganz zuletzt die Biomarker (Laborwerte werden meist
// erst nachträglich verfügbar/nachgetragen). Jeder Schritt bekommt dieselbe
// "Jetzt einrichten?"-Gate-Seite; nur was hinter "Jetzt einrichten"
// passiert, unterscheidet sich (bei Peptiden das bestehende mehrstufige
// ProtocolFormView, bei Biomarkern die geteilte LaborwerteFelder-Komponente,
// statt einfacher Felder). Die Labels enden bewusst auf "-Plan" statt
// "-Protokoll" (Nutzer-Vorgabe) — das übergeordnete Hauptprotokoll bleibt
// weiterhin "Protokoll" genannt, nur die einzelnen Teilbereiche heißen Plan.
export const CATEGORY_STEPS = [
  { key: "schlaf", icon: "😴", label: "Schlafplan" },
  { key: "hydration", icon: "💧", label: "Hydrationsplan" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährungsplan" },
  { key: "training", icon: "🏋️", label: "Trainingsplan" },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheitenplan" },
  { key: "supplemente", icon: "💊", label: "Supplementplan" },
  { key: "medikamente", icon: "🩺", label: "Medikamentenplan" },
  { key: "peptide", icon: "🧬", label: "Peptid-Plan" },
  { key: "biomarker", icon: "🩸", label: "Biomarker-Plan" },
];
