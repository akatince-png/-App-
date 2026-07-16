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
  "BPC-157",
  "TB-500",
  "CJC-1295 (ohne DAC)",
  "Ipamorelin",
  "GHRP-6",
  "AOD-9604",
];

export const EINNAHMEARTEN = ["Injektion", "Tablette", "Pulver", "Shake", "Tropfen", "Sonstiges"];

export const INTERVALL_OPTIONEN = [
  { label: "Täglich", days: 1 },
  { label: "Jeden 2. Tag", days: 2 },
  { label: "2x pro Woche", days: 4 },
  { label: "1x pro Woche", days: 7 },
  { label: "Individuell", days: "custom" },
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
export const HINWEISE = ["Zur Mahlzeit", "Nüchtern", "Vor dem Schlafen", "Sonstiges"];

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

export const DASHBOARD_KACHELN = [
  { id: "plan", label: "Protokoll", desc: "Heute & Kalender", icon: "💉", grad: ["#0FB8A3", "#0A9384"] },
  { id: "supplemente", label: "Supplemente", desc: "Wochenplan", icon: "💊", grad: ["#4FA3D1", "#2E7BAA"] },
  { id: "statistik", label: "Statistik", desc: "Verlauf & Trends", icon: "📊", grad: ["#5B9BF0", "#3B6FD1"] },
  { id: "profil", label: "Profil & Biomarker", desc: "Check-ins, Laborwerte", icon: "🧬", grad: ["#9B7EDE", "#6E4FBF"] },
  { id: "community", label: "Community", desc: "Anonyme Insights", icon: "🌍", grad: ["#4FBF8F", "#2F9E71"] },
  { id: "archiv", label: "Archiv", desc: "Alte Protokolle & Werte", icon: "🗂️", grad: ["#F5A623", "#D98A0F"] },
  { id: "lexikon", label: "Lexikon", desc: "Fragen zu Peptiden", icon: "📚", grad: ["#E0708C", "#C24A6B"] },
  { id: "mehr", label: "Mehr", desc: "Datenschutz & Einstellungen", icon: "⚙️", grad: ["#7C8B87", "#5A6864"] },
];
