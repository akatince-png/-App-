// Reihenfolge und Anzeige-Metadaten für den Onboarding-Kategorien-Screen
// (einfache/schnelle Bereiche zuerst, dosierungslastige zuletzt). Die
// eigentlichen Formularfelder pro Kategorie unterscheiden sich zu stark,
// um sie generisch zu beschreiben — die leben direkt in
// OnboardingCategoriesView.jsx.
export const CATEGORY_STEPS = [
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheiten" },
  { key: "schlaf", icon: "😴", label: "Schlaf" },
  { key: "hydration", icon: "💧", label: "Hydration" },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährung" },
  { key: "training", icon: "🏋️", label: "Training" },
  { key: "supplemente", icon: "💊", label: "Supplemente" },
  { key: "medikamente", icon: "🩺", label: "Medikamente" },
];
