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
//
// Schlafplan ist seit 16.09. (Nutzerinnen-Vorgabe: "Schlafplan mit der
// Morgen- und Abendroutine gleich zusammentun, die hängen ja alle
// unmittelbar miteinander zusammen") ebenfalls KEIN eigener Kategorie-
// Schritt mehr — die Bettzeit/Aufwachzeit-Einrichtung läuft jetzt direkt
// auf der Morgen-/Abendroutine-Seite (OnboardingRoutinenView.jsx), eine
// Onboarding-Seite weniger.
export const CATEGORY_STEPS = [
  { key: "hydration", icon: "💧", label: "Hydrationsplan" },
  { key: "tageslicht", icon: "☀️", label: "Tageslichtplan" },
  { key: "bildschirmzeit", icon: "📱", label: "Bildschirmzeitplan" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährungsplan" },
  { key: "training", icon: "🏋️", label: "Trainingsplan" },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheitenplan" },
  { key: "supplemente", icon: "💊", label: "Supplementplan" },
  { key: "medikamente", icon: "🩺", label: "Medikamentenplan" },
];

// Laborwerte und Morgen-/Abendroutine zählen als die ersten beiden Schritte
// derselben durchnummerierten "Protokoll"-Schrittfolge wie die 8
// Kategorien-Pläne oben — Nutzerinnen-Vorgabe (16.09.): "Blutwerte, Morgen-
// und Abendroutine ... gehören auch in die gleiche Reihenfolge" wie die
// Kategorie-Schritte, statt wie bisher optisch wie eigenständige, schlichte
// Seiten ohne den nummerierten Fortschrittsbalken (Stepper) davor zu wirken.
// Siehe OnboardingLaborwerteView.jsx (Schritt 1) und
// OnboardingRoutinenView.jsx (Schritt 2).
export const PROTOKOLL_SCHRITT_OFFSET = 2;
export const PROTOKOLL_SCHRITTE_GESAMT = CATEGORY_STEPS.length + PROTOKOLL_SCHRITT_OFFSET;
