// Reihenfolge und Anzeige-Metadaten für den Onboarding-Kategorien-Screen —
// vom natürlichsten/alltäglichsten Tracking-Punkt zum unnatürlichsten/
// klinischsten: erst die Basis-Lebensgewohnheiten (Schlaf, Trinken, Essen,
// Training, sonstige Gewohnheiten), dann Supplemente, ganz zuletzt
// Medikamente (Peptide sind seit der Datenzusammenlegung, 13.08., Teil
// davon — kein eigener Schritt mehr). Jeder Schritt bekommt dieselbe "Jetzt
// einrichten?"-Gate-Seite und danach seine Felder direkt auf derselben
// Seite. Die Labels enden bewusst auf "-Plan" statt "-Protokoll"
// (Nutzer-Vorgabe) — das übergeordnete Hauptprotokoll bleibt weiterhin
// "Protokoll" genannt, nur die einzelnen Teilbereiche heißen Plan.
//
// Biomarker/Laborwerte sind hier bewusst KEIN Kategorie-Schritt mehr: sie
// beschreiben die Ausgangslage, keinen Plan, den man "einrichtet", und
// laufen deshalb als eigener Schritt vor den Kategorien (siehe
// OnboardingFlow → OnboardingLaborwerteView).
export const CATEGORY_STEPS = [
  { key: "schlaf", icon: "😴", label: "Schlafplan" },
  { key: "hydration", icon: "💧", label: "Hydrationsplan" },
  { key: "tageslicht", icon: "☀️", label: "Tageslichtplan" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährungsplan" },
  { key: "training", icon: "🏋️", label: "Trainingsplan" },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheitenplan" },
  { key: "supplemente", icon: "💊", label: "Supplementplan" },
  { key: "medikamente", icon: "🩺", label: "Medikamentenplan" },
];
