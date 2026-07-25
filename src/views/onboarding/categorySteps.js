// Reihenfolge und Anzeige-Metadaten für den Onboarding-Kategorien-Screen —
// vom natürlichsten/alltäglichsten Tracking-Punkt zum unnatürlichsten/
// klinischsten: erst die Basis-Lebensgewohnheiten (Schlaf, Trinken, Essen,
// Training, sonstige Gewohnheiten), dann Supplemente, dann Medikamente, ganz
// zuletzt der Peptid-Plan. Jeder Schritt bekommt dieselbe "Jetzt
// einrichten?"-Gate-Seite und danach seine Felder direkt auf derselben
// Seite — auch Peptide, die früher in einen eigenen fünfstufigen
// Assistenten (ProtocolFormView) abgezweigt sind. Die Labels enden bewusst
// auf "-Plan" statt "-Protokoll" (Nutzer-Vorgabe) — das übergeordnete
// Hauptprotokoll bleibt weiterhin "Protokoll" genannt, nur die einzelnen
// Teilbereiche heißen Plan.
//
// Biomarker/Laborwerte sind hier bewusst KEIN Kategorie-Schritt mehr: sie
// beschreiben die Ausgangslage, keinen Plan, den man "einrichtet", und
// laufen deshalb als eigener Schritt vor den Kategorien (siehe
// OnboardingFlow → OnboardingLaborwerteView).
export const CATEGORY_STEPS = [
  { key: "schlaf", icon: "😴", label: "Schlafplan" },
  { key: "hydration", icon: "💧", label: "Hydrationsplan" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährungsplan" },
  { key: "training", icon: "🏋️", label: "Trainingsplan" },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheitenplan" },
  { key: "supplemente", icon: "💊", label: "Supplementplan" },
  { key: "medikamente", icon: "🩺", label: "Medikamentenplan" },
  { key: "peptide", icon: "🧬", label: "Peptid-Plan" },
];
