import { KATEGORIE_META, ROUTINE_META } from "../../utils/dayItems";

// Auswahl "Womit willst du starten?" im kürzeren Onboarding (24.09.),
// siehe OnboardingBereicheView.jsx.
export const MAX_BEREICHE = 3;

export const START_BEREICHE = [
  { key: "routinen", icon: "🌅", label: "Routinen & Schlaf", text: "Morgen, Abend, Bettzeit", meta: ROUTINE_META.morgenroutine },
  { key: "medikamente", icon: "🩺", label: "Medikamente", text: "Pünktlich erinnert", meta: KATEGORIE_META.hormon },
  { key: "hydration", icon: "💧", label: "Wasser", text: "Trinkziel & Erinnerung", meta: KATEGORIE_META.hydration },
  { key: "supplemente", icon: "💊", label: "Supplemente", text: "Vitamine & Co.", meta: KATEGORIE_META.supplement },
  { key: "ernaehrung", icon: "🍽️", label: "Ernährung", text: "Mahlzeiten planen", meta: KATEGORIE_META.mahlzeit },
  { key: "training", icon: "🏋️", label: "Training", text: "Wochenplan", meta: KATEGORIE_META.training },
  { key: "gewohnheiten", icon: "🌱", label: "Gewohnheiten", text: "Kleine tägliche Schritte", meta: KATEGORIE_META.gewohnheit },
  { key: "tageslicht", icon: "☀️", label: "Tageslicht", text: "Raus ans Licht", meta: KATEGORIE_META.tageslicht },
  { key: "bildschirmzeit", icon: "📱", label: "Bildschirmzeit", text: "Handyzeit im Blick", meta: KATEGORIE_META.bildschirmzeit },
];

// Vorschläge passend zu den gewählten Zielen (Ziel & Grund) — nur ein
// Hinweis, nichts wird ohne Antippen ausgewählt… außer beim ersten Öffnen:
// die zwei stärksten Vorschläge sind vorausgewählt, damit man nicht vor
// einer leeren Seite sitzt.
const ZIEL_ZU_BEREICHEN = {
  "Tagesstruktur aufbauen": ["routinen", "gewohnheiten"],
  "Zeitgefühl verbessern": ["routinen"],
  "Prokrastination überwinden": ["routinen", "gewohnheiten"],
  "Weniger Overwhelm": ["routinen"],
  "Motivation im Alltag": ["gewohnheiten"],
  "Fokus & Konzentration": ["routinen", "bildschirmzeit"],
  "Kognitive Funktion": ["hydration", "supplemente"],
  "Reizüberflutung reduzieren": ["bildschirmzeit"],
  "Impulskontrolle stärken": ["bildschirmzeit"],
  Gewichtsabnahme: ["ernaehrung", "training"],
  Körperkomposition: ["ernaehrung", "training"],
  Muskelaufbau: ["training", "supplemente"],
  Leistungssteigerung: ["training", "supplemente"],
  "Regeneration / Heilung": ["medikamente", "supplemente"],
  "Anti-Aging / Longevity": ["supplemente"],
  Hautverbesserung: ["hydration"],
};

export function vorschlaegeAusZielen(ziele) {
  const punkte = {};
  (ziele || []).forEach((z) => (ZIEL_ZU_BEREICHEN[z] || []).forEach((k, i) => (punkte[k] = (punkte[k] || 0) + (i === 0 ? 2 : 1))));
  const sortiert = Object.keys(punkte).sort((a, b) => punkte[b] - punkte[a]);
  return (sortiert.length > 0 ? sortiert : ["routinen", "medikamente"]).slice(0, 2);
}
