export const ZIELE = [
  "Gewichtsabnahme",
  "Muskelaufbau",
  "Regeneration / Heilung",
  "Anti-Aging / Longevity",
  "Leistungssteigerung",
  "Körperkomposition",
  "Hautverbesserung",
  "Kognitive Funktion",
  "Sexuelle Gesundheit",
  "Anderes (bitte angeben)",
];

export const PEPTIDE_OPTIONEN = [
  "Semaglutid",
  "Tirzepatid",
  "Retatrutid",
  "BPC-157",
  "TB-500",
  "CJC-1295 (ohne DAC)",
  "CJC-1295 (mit DAC)",
  "Ipamorelin",
  "GHRP-2",
  "GHRP-6",
  "Hexarelin",
  "Sermorelin",
  "Tesamorelin",
  "MK-677 (Ibutamoren)",
  "AOD-9604",
  "Melanotan I",
  "Melanotan II",
  "PT-141 (Bremelanotide)",
  "GHK-Cu",
  "Thymosin Alpha-1",
  "Thymosin Beta-4 (TB4)",
  "Epithalon",
  "DSIP",
  "Selank",
  "Semax",
  "Kisspeptin-10",
  "IGF-1 LR3",
  "Follistatin 344",
  "MOTS-c",
  "Humanin",
  "Oxytocin",
  "KPV",
  "LL-37",
  "VIP",
  "Snap-8",
];

// Einnahmearten speziell für Peptide — Injektion ist der Standard, die meisten
// Peptide werden subkutan gespritzt; einige gibt es alternativ auch als
// Nasenspray oder zum Schlucken (z. B. BPC-157 oral).
export const EINNAHMEARTEN = ["Injektion", "Tablette (oral)", "Nasenspray"];

// Kategorien innerhalb von "Medikamente" — fasst Hormone/Off-Label mit
// anderen verschreibungspflichtigen/rezeptfreien Medikamenten zusammen.
export const MEDIKAMENTE_KATEGORIEN = ["Hormone", "Blutdruck", "Diabetes", "Cholesterin", "Schmerzmittel", "Sonstige"];

// Feste Intervall-Presets: mode ist immer "fixed", days die Anzahl Tage zwischen zwei Dosen.
export const INTERVALL_OPTIONEN = [
  { label: "Täglich", mode: "fixed", days: 1 },
  { label: "Jeden 2. Tag", mode: "fixed", days: 2 },
  { label: "2x pro Woche", mode: "fixed", days: 4 },
  { label: "1x pro Woche", mode: "fixed", days: 7 },
];

// Zusätzliche Intervall-Typen: individuelles festes Intervall, rollierender
// On/Off-Zyklus (z. B. "5 Tage on, 2 Tage off") und feste Wochentage.
export const INTERVALL_TYPEN = [
  ...INTERVALL_OPTIONEN,
  { label: "Individuell (alle X Tage)", mode: "custom" },
  { label: "Zyklus (on/off)", mode: "cycle" },
  { label: "Feste Wochentage", mode: "weekdays" },
];

export const STEP_TITLES = [
  "Ziel & Grund",
  "Peptide & Stack",
  "Dosierung & Intervall",
  "Notizen & Details",
  "Übersicht & Bestätigung",
];

export const NEBENWIRKUNGEN_OPTIONEN = [
  "Übelkeit",
  "Kopfschmerzen",
  "Müdigkeit",
  "Rötung an Einstichstelle",
  "Schwindel",
  "Verdauungsprobleme",
  "Schlafprobleme",
  "Appetitverlust",
];

export const STAERKE_OPTIONEN = ["Keine", "Leicht", "Mittel", "Stark"];

export const WEITERE_BIOMARKER = ["Testosteron", "Cortisol", "Östradiol", "SHBG", "Vitamin D", "CRP", "HbA1c"];

export const ENERGIELEVEL_OPTIONEN = ["😩", "😐", "🙂", "⚡"];

export const MESSWERT_DEFS = [
  { id: "gewicht", label: "Gewicht", unit: "kg", numeric: true },
  { id: "kfa", label: "KFA", unit: "%", numeric: true },
  { id: "taille", label: "Taille", unit: "cm", numeric: true, foto: "Taille" },
  { id: "armumfang", label: "Armumfang", unit: "cm", numeric: true, foto: "Arme" },
  { id: "blutdruck", label: "Blutdruck", unit: "", numeric: false },
  { id: "ruhepuls", label: "Ruhepuls", unit: "bpm", numeric: true },
  { id: "energie", label: "Energielevel", unit: "", numeric: false, emoji: true },
];

export const FOTO_KATEGORIEN = ["Taille", "Arme", "Ganzkörper", "Gesicht", "Haare", "Haut"];

export const TAGESZEITEN = ["Morgens", "Mittags", "Abends"];
export const HINWEISE = ["Zur Mahlzeit", "Nüchtern", "Vor dem Schlafen", "Vor dem Training", "Nach dem Training", "Sonstiges"];

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export const LEXIKON_KATEGORIEN = [
  "Peptide",
  "Supplemente",
  "Hormone",
  "Anti-Aging",
  "Muskelaufbau",
  "Haut & Haare",
  "Schlafgesundheit",
];

export const LEXIKON_BEISPIELE = {
  Peptide: [
    "Was ist BPC-157?",
    "Wofür wird Semaglutid genutzt?",
    "Unterschied zwischen CJC-1295 und Ipamorelin?",
    "Wie wird ein Peptid normalerweise gelagert?",
  ],
  Supplemente: [
    "Wofür ist Magnesium gut?",
    "Sollte man Vitamin D mit Fett einnehmen?",
    "Was macht Omega-3 im Körper?",
    "Wie unterscheiden sich Kreatin-Formen?",
  ],
  Hormone: [
    "Was ist Testosteron-Ersatztherapie (TRT)?",
    "Was bedeutet ein niedriger SHBG-Wert?",
    "Wofür steht Cortisol im Körper?",
    "Was ist der Unterschied zwischen Peptiden und Steroiden?",
  ],
  "Anti-Aging": [
    "Was beeinflusst biologische Alterung?",
    "Welche Rolle spielt NAD+ beim Altern?",
    "Was ist zelluläre Seneszenz?",
    "Wie hängen Entzündungswerte mit Alterung zusammen?",
  ],
  Muskelaufbau: [
    "Was ist Proteinbiosynthese?",
    "Wie wirkt IGF-1 auf Muskelwachstum?",
    "Was ist progressive Overload?",
    "Wie viel Eiweiß braucht der Muskelaufbau ungefähr?",
  ],
  "Haut & Haare": [
    "Was macht GHK-Cu für die Haut?",
    "Was fördert Kollagenbildung?",
    "Welche Rolle spielt Biotin für Haare?",
    "Was ist der Unterschied zwischen Anagen- und Telogenphase?",
  ],
  Schlafgesundheit: [
    "Warum ist Tiefschlaf wichtig?",
    "Wie beeinflusst Melatonin den Schlaf?",
    "Was ist Schlafhygiene?",
    "Wie wirkt sich Schlafmangel auf Hormone aus?",
  ],
};

export const PIE_COLORS = ["#0FB8A3", "#5B9BF0", "#F5A623", "#F2596A", "#9B7EDE", "#4FBF8F"];

// Kacheln sind in Gruppen ("Tiers") organisiert, damit das Dashboard nicht
// wie eine flache Liste wirkt: ganz oben die zwei zentralen Einstiegspunkte
// (Tagesplan zum Abhaken, Protokolle zum Nachschauen der Details), darunter
// die einzelnen Protokoll-Tools, dann Auswertung/Austausch, unten Verwaltung.
// HomeView rendert jede Gruppe mit eigenem Abstand und optionaler Überschrift.
//
// Farben bewusst auf 4 harmonische Familien reduziert (statt einer Kachel
// pro Regenbogenfarbe): Smaragd (Marke/Substanzen), Schiefer-Blau (klinisch/
// Analyse), warmes Terracotta (Ernährung/Energie), Pflaume (ruhig/Referenz).
const F_EMERALD = ["#14917A", "#0A5F4F"];
const F_SLATE = ["#5B7DAE", "#3A5A87"];
const F_WARM = ["#C98A4A", "#A96B2E"];
const F_PLUM = ["#9B85B8", "#786198"];

export const DASHBOARD_TIERS = [
  {
    id: "haupt",
    kacheln: [
      { id: "tagesplan", label: "Tagesplan", desc: "Alles auf einen Blick", icon: "🗓️", grad: F_EMERALD },
      { id: "routinen", label: "Routinen", desc: "Mehrere Einträge bündeln", icon: "⭐", grad: F_WARM },
      { id: "protokolle", label: "Protokolle", desc: "Details zum Nachschauen", icon: "📋", grad: F_SLATE },
    ],
  },
  {
    id: "tracker",
    title: "Protokolle",
    kacheln: [
      // Grundlagen zuerst (Schlaf, Trinken, Ernährung, Training) — bevor
      // Substanzen dazukommen, sollten diese Basics im Griff sein.
      { id: "schlaf", label: "Schlaf", desc: "Routine & Auswertung", icon: "😴", grad: F_PLUM },
      { id: "hydration", label: "Hydration", desc: "Trinkmenge tracken", icon: "💧", grad: F_EMERALD },
      { id: "ernaehrung", label: "Ernährungsplan", desc: "Kalorien & Mahlzeiten", icon: "🥗", grad: F_WARM },
      { id: "training", label: "Training", desc: "Kraft, Cardio & mehr", icon: "🏋️", grad: F_WARM },
      // Danach Substanzen, aufsteigend nach Eingriffstiefe.
      { id: "supplemente", label: "Supplemente", desc: "Wochenplan & Rezepte", icon: "🌿", grad: F_WARM },
      { id: "medikamente", label: "Medikamente", desc: "Hormone, Blutdruck & mehr", icon: "💊", grad: F_SLATE },
      { id: "peptide", label: "Peptide", desc: "Dein Peptid-Protokoll", icon: "🧬", grad: F_EMERALD },
      // Monitoring/Referenz am Ende.
      { id: "blutzucker", label: "Blutzucker / CGM", desc: "Messwerte im Verlauf", icon: "🩸", grad: F_SLATE },
      { id: "profil", label: "Profil & Biomarker", desc: "Check-ins, Laborwerte", icon: "🩺", grad: F_PLUM },
    ],
  },
  {
    id: "auswertung",
    title: "Auswertung",
    kacheln: [
      { id: "statistik", label: "Statistik", desc: "Verlauf & Trends", icon: "📊", grad: F_SLATE },
      { id: "community", label: "Community", desc: "Anonyme Insights", icon: "🌍", grad: F_EMERALD },
    ],
  },
  {
    id: "verwaltung",
    title: "Verwaltung",
    kacheln: [
      { id: "archiv", label: "Archiv", desc: "Alte Protokolle & Werte", icon: "🗂️", grad: F_WARM },
      { id: "lexikon", label: "Lexikon", desc: "Fragen zu Peptiden", icon: "📚", grad: F_PLUM },
      { id: "mehr", label: "Mehr", desc: "Datenschutz & Einstellungen", icon: "⚙️", grad: ["#8A9089", "#6B716A"] },
    ],
  },
];
