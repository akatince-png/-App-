// Reihenfolge und Anzeige-Metadaten für den Onboarding-Kategorien-Screen —
// vom natürlichsten/alltäglichsten Tracking-Punkt zum unnatürlichsten/
// klinischsten: erst die Basis-Lebensgewohnheiten (Schlaf, Trinken, Essen,
// Training, sonstige Gewohnheiten), dann Supplemente, dann Medikamente. Das
// Peptid-Protokoll (klinischster Punkt) läuft danach separat über
// ProtocolFormView (siehe OnboardingFlow.jsx), ganz am Ende des gesamten
// Einrichtungs-Ablaufs. Die eigentlichen Formularfelder pro Kategorie
// unterscheiden sich zu stark, um sie generisch zu beschreiben — die leben
// direkt in OnboardingCategoriesView.jsx.
export const CATEGORY_STEPS = [
  { key: "schlaf", icon: "😴", label: "Schlaf" },
  { key: "hydration", icon: "💧", label: "Hydration" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährung" },
  { key: "training", icon: "🏋️", label: "Training" },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheiten" },
  { key: "supplemente", icon: "💊", label: "Supplemente" },
  { key: "medikamente", icon: "🩺", label: "Medikamente" },
];
