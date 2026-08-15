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

// Einnahmearten für Peptide & Medikamente — Injektion ist der Standard, die
// meisten Peptide werden subkutan gespritzt; viele Präparate (Peptide wie
// Medikamente) gibt es aber auch als Tablette, Kapsel, Pulver, Tropfen oder
// Nasenspray.
export const EINNAHMEARTEN = ["Injektion", "Tablette (oral)", "Kapsel", "Pulver", "Tropfen", "Nasenspray"];

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

export const VERTRAEGLICHKEIT_OPTIONEN = ["Gut", "Mittel", "Schlecht"];
export const WIRKUNG_OPTIONEN = ["Ja", "Etwas", "Nein"];
export const DURSTGEFUEHL_OPTIONEN = ["Kein Durst", "Leicht", "Stark"];
export const SCHLAFQUALITAET_OPTIONEN = ["Sehr gut", "Gut", "Mittel", "Schlecht"];

// Kategorisierte Laborwerte, damit auch ausgefallene Werte dokumentiert werden
// können, ohne dass die Liste als eine lange, unübersichtliche Wand aus
// Eingabefeldern wirkt (ProfilTab zeigt jede Kategorie einklappbar an).
export const LABORWERTE_KATEGORIEN = [
  { kategorie: "Blutbild", werte: ["Hämoglobin", "Hämatokrit", "Erythrozyten", "Leukozyten", "Thrombozyten", "MCV", "MCH", "MCHC", "RDW"] },
  { kategorie: "Elektrolyte", werte: ["Natrium", "Kalium", "Calcium", "Magnesium", "Chlorid", "Phosphat"] },
  { kategorie: "Nierenwerte", werte: ["Kreatinin", "Harnstoff", "eGFR", "Cystatin C", "Harnsäure"] },
  { kategorie: "Leberwerte", werte: ["ALT (GPT)", "AST (GOT)", "GGT", "Bilirubin gesamt", "Alkalische Phosphatase", "Albumin"] },
  { kategorie: "Lipidprofil", werte: ["Gesamtcholesterin", "LDL-Cholesterin", "HDL-Cholesterin", "Triglyceride", "Lipoprotein(a)", "ApoB"] },
  { kategorie: "Blutzucker & Stoffwechsel", werte: ["Nüchternglukose", "HbA1c", "Insulin (nüchtern)", "HOMA-IR", "C-Peptid"] },
  { kategorie: "Schilddrüse", werte: ["TSH", "fT3", "fT4", "Anti-TPO", "Anti-TG"] },
  { kategorie: "Hormone", werte: ["Testosteron", "Testosteron frei", "Östradiol", "Progesteron", "SHBG", "Cortisol", "DHEA-S", "LH", "FSH", "Prolaktin", "IGF-1"] },
  { kategorie: "Vitamine", werte: ["Vitamin D", "Vitamin B12", "Folsäure", "Vitamin B6", "Vitamin B1", "Vitamin A", "Vitamin E", "Vitamin K"] },
  { kategorie: "Mineralstoffe & Spurenelemente", werte: ["Eisen", "Ferritin", "Transferrin", "Transferrinsättigung", "Zink", "Selen", "Kupfer", "Jod"] },
  { kategorie: "Entzündung & Immunsystem", werte: ["CRP", "hs-CRP", "BSG", "Homocystein", "Fibrinogen", "IL-6", "IgA", "IgG", "IgM"] },
  { kategorie: "Gerinnung", werte: ["Quick / INR", "PTT", "D-Dimere"] },
  { kategorie: "Herz", werte: ["Troponin", "NT-proBNP", "CK", "CK-MB"] },
];

export const LABORWERTE_ALLE = LABORWERTE_KATEGORIEN.flatMap((k) => k.werte);

export const TRAININGSARTEN = ["Krafttraining", "Cardio", "Bodyweight", "Sonstiges"];
export const TRAINING_ENERGIELEVEL_OPTIONEN = ["Niedrig", "Mittel", "Hoch"];
export const SCHMERZEN_OPTIONEN = ["Keine", "Leicht", "Stark"];

export const CARDIO_ARTEN = ["Laufen", "Fahrradfahren", "Springseilspringen", "Sonstiges Cardio"];
export const CARDIO_MODI_STRECKE = ["Strecke", "Intervall", "Sprints"];
export const CARDIO_MODI_SPRUNGSEIL = ["Dauer", "Intervall"];

export const KRAFTUEBUNGEN = [
  // Brust
  "Bankdrücken", "Schrägbankdrücken", "Negativbankdrücken", "Kurzhantel-Bankdrücken",
  "Butterfly", "Fliegende (Kurzhantel)", "Dips", "Cable Crossover", "Liegestütze",
  // Rücken
  "Klimmzüge", "Latzug", "Rudern vorgebeugt", "Kurzhantelrudern", "Kabelzug sitzend",
  "T-Bar-Rudern", "Kreuzheben", "Rumänisches Kreuzheben", "Sumo-Kreuzheben",
  "Good Mornings", "Hyperextensions", "Klimmzüge eng", "Klimmzüge weit",
  // Schulter
  "Schulterdrücken", "Kurzhantel-Schulterdrücken", "Seitheben", "Frontheben",
  "Reverse Butterfly", "Aufrechtes Rudern", "Arnold Press", "Shrugs (Nackenheben)",
  // Arme
  "Bizepscurls", "Hammercurls", "Konzentrationscurls", "Kabelcurls", "SZ-Curls",
  "Trizepsdrücken", "French Press", "Trizeps-Kickback", "Enges Bankdrücken",
  "Trizepsdrücken am Kabel",
  // Beine
  "Kniebeuge", "Frontkniebeuge", "Beinpresse", "Ausfallschritte", "Bulgarian Split Squat",
  "Beinstrecker", "Beinbeuger", "Wadenheben stehend", "Wadenheben sitzend",
  "Hip Thrust", "Kreuzheben gestreckte Beine", "Goblet Squat", "Step-ups",
  // Bauch/Core
  "Crunches", "Sit-ups", "Beinheben hängend", "Plank", "Russian Twist",
  "Cable Crunch", "Ab Wheel Rollout",
  // Ganzkörper
  "Kettlebell Swing", "Farmer's Walk", "Clean and Press", "Snatch",
];

export const BODYWEIGHT_UEBUNGEN = [
  "Liegestütze", "Diamant-Liegestütze", "Archer Push-ups", "Klimmzüge", "Chin-ups",
  "Muscle-up", "Dips", "Ring Dips", "Pistol Squat", "Air Squats", "Ausfallschritte",
  "Plank", "Side Plank", "L-Sit", "Handstand", "Handstand-Liegestütze",
  "Wandliegestütze (Handstand)", "Burpees", "Mountain Climbers", "Beinheben hängend",
  "Superman", "Hollow Body Hold", "Jumping Jacks", "Bear Crawl", "Australian Pull-ups",
  "Skater Jumps", "Box Jumps", "Wall Sit", "Glute Bridge", "Nordic Curls",
];

export const ENERGIELEVEL_OPTIONEN = ["😩", "😐", "🙂", "⚡"];

export const MESSWERT_DEFS = [
  { id: "gewicht", label: "Gewicht", unit: "kg", numeric: true },
  { id: "kfa", label: "KFA", unit: "%", numeric: true },
  { id: "taille", label: "Taille", unit: "cm", numeric: true, foto: "Taille" },
  { id: "armumfang", label: "Armumfang", unit: "cm", numeric: true, foto: "Arme" },
  { id: "blutdruck", label: "Blutdruck", unit: "", numeric: false },
  { id: "ruhepuls", label: "Ruhepuls", unit: "bpm", numeric: true },
  { id: "bmi", label: "BMI", unit: "", numeric: true },
  { id: "koerperwasser", label: "Körperwasser", unit: "%", numeric: true },
  { id: "muskelanteil", label: "Muskelanteil", unit: "%", numeric: true },
  { id: "knochenanteil", label: "Knochenanteil", unit: "%", numeric: true },
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
  "ADHS & Lebensrahmenbedingungen",
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
  "ADHS & Lebensrahmenbedingungen": [
    "Was ist das ADHS-Paradoxon?",
    "Was bedeutet Person-Environment-Fit?",
    "Welche Schutzfaktoren zeigt die Forschung bei ADHS?",
    "Warum lehnt das ADHS-Gehirn manche Struktur ab, andere nicht?",
  ],
};

// Lebensrahmenbedingungen-Fragebogen ("Der Passungs-Check") — aus dem
// Curriculum "Das ADHS-Paradoxon" (Coaching-Ergänzung zu den Protokollen,
// erhebt die lebensweltliche statt der gesundheitlichen Passung). Jeder
// Abschnitt entspricht einem Lebensbereich aus Teil 3 des Curriculums.
export const PASSUNGSCHECK_ABSCHNITTE = [
  {
    id: "beziehung",
    titel: "Beziehung & Partnerschaft",
    fragen: [
      { id: "dauer", frage: "Lebst du aktuell in einer Beziehung? Wie lange schon?" },
      { id: "qualitaet", frage: "Wie würdest du die Qualität dieser Beziehung beschreiben — trägt sie dich, oder kostet sie dich Kraft?" },
      { id: "single", frage: "Falls Single: Ist das gerade eine bewusste Entscheidung oder ein unerfülltes Bedürfnis?" },
      { id: "rechtfertigung", frage: "Gibt es Menschen in deinem Leben (Partner:in, Familie), bei denen du dich für dein ADHS rechtfertigen musst?" },
    ],
  },
  {
    id: "arbeit",
    titel: "Arbeit & Beruf",
    fragen: [
      { id: "aktuell", frage: "Was arbeitest du aktuell? Seit wann?" },
      { id: "zufriedenheit", frage: "Macht dich diese Arbeit zufrieden — nicht nur finanziell, sondern inhaltlich?" },
      { id: "passform", frage: "Passt die Arbeitsform (Struktur, Tempo, Reizlevel, Autonomie) zu dir, oder kämpfst du ständig dagegen an?" },
      { id: "geldEgal", frage: "Wenn Geld keine Rolle spielen würde: Würdest du denselben Job machen?" },
    ],
  },
  {
    id: "zufriedenheit",
    titel: "Zufriedenheit & Wohlbefinden",
    fragen: [
      { id: "skala", frage: "Auf einer Skala von 1–10: Wie zufrieden bist du aktuell mit deinem Leben insgesamt?" },
      { id: "lebendig", frage: "Was war der letzte Moment, in dem du dich richtig lebendig gefühlt hast? Wie lange ist das her?" },
      { id: "schlechtGehen", frage: "Woran merkst du, wenn es dir schlecht geht — und was tust du dann meistens?" },
    ],
  },
  {
    id: "ziele",
    titel: "Ziele & Visionen",
    fragen: [
      { id: "wichtigsteZiele", frage: "Was sind deine wichtigsten Ziele für die nächsten 1–3 Jahre?" },
      { id: "verschoben", frage: "Gibt es ein Ziel, das du seit Jahren vor dir herschiebst? Warum?" },
      { id: "nichtScheitern", frage: "Was würdest du tun, wenn du wüsstest, dass du nicht scheitern kannst?" },
    ],
  },
  {
    id: "hobbys",
    titel: "Hobbys & Freizeit",
    fragen: [
      { id: "aktuelleHobbys", frage: "Welche Hobbys hast du aktuell aktiv?" },
      { id: "aufgegeben", frage: "Gibt es etwas, das du früher geliebt hast und irgendwann aufgegeben hast? Was war der Grund?" },
      { id: "erholung", frage: "Wie viel deiner freien Zeit fühlt sich wie echte Erholung an — und wie viel wie „Zeit totschlagen\"?" },
    ],
  },
  {
    id: "reisen",
    titel: "Reisen & Erlebnisse",
    fragen: [
      { id: "reisewunsch", frage: "Möchtest du reisen? Wohin, und was hält dich bisher davon ab?" },
      { id: "letztesAbenteuer", frage: "Was war das letzte echte Abenteuer/die letzte neue Erfahrung in deinem Leben?" },
    ],
  },
  {
    id: "wohnraum",
    titel: "Wohnraum & Lebensumfeld",
    fragen: [
      { id: "rueckzugsort", frage: "Wie ist deine Wohnung/dein Zuhause aktuell gestaltet — fühlt es sich wie ein Rückzugsort an oder eher wie ein weiterer Stressfaktor (Unordnung, Reizüberflutung)?" },
      { id: "festeOrte", frage: "Hast du feste, sichtbare Orte für die Dinge, die du täglich brauchst — oder suchst du ständig?" },
      { id: "veraendern", frage: "Was würdest du an deinem Wohnraum verändern, wenn Geld keine Rolle spielt?" },
    ],
  },
  {
    id: "finanzen",
    titel: "Finanzen",
    fragen: [
      { id: "reichtGeld", frage: "Reicht dein Geld am Monatsende in der Regel, oder ist es eng?" },
      { id: "ueberblick", frage: "Hast du einen Überblick über deine Finanzen, oder ist das ein Bereich, den du eher vermeidest?" },
      { id: "stress", frage: "Bereiten dir Finanzen aktuell Stress? (Bei akuten Schulden/Zahlungsproblemen: an eine Schuldnerberatung verweisen.)" },
    ],
  },
  {
    id: "sozial",
    titel: "Sozialer Kreis",
    fragen: [
      { id: "engsteMenschen", frage: "Wer sind die 3–5 Menschen, mit denen du die meiste Zeit verbringst?" },
      { id: "erschoepfend", frage: "Gibt es Menschen in deinem Umfeld, nach deren Kontakt du dich regelmäßig erschöpft statt aufgetankt fühlst?" },
      { id: "reduziert", frage: "Hast du in der Vergangenheit bewusst Kontakt zu jemandem reduziert oder beendet, weil er/sie dir nicht gutgetan hat? Wie war das für dich?" },
      { id: "verstanden", frage: "Fühlst du dich von den Menschen um dich herum mit deinem ADHS verstanden oder eher belächelt/kritisiert?" },
    ],
  },
  {
    id: "verbindungProtokolle",
    titel: "Verbindung zu den Protokollen",
    fragen: [
      { id: "einfluss", frage: "Welcher der oben genannten Lebensbereiche beeinflusst nach deinem Gefühl am stärksten, wie gut deine Schlaf-/Bewegungs-/Ernährungsroutinen aktuell funktionieren?" },
    ],
  },
];

export const PASSUNGSCHECK_AUSWERTUNG_FELDER = [
  { id: "staerksterBereich", label: "Stärkster Lebensbereich (funktioniert bereits gut)" },
  { id: "groessterLeidensdruck", label: "Bereich mit dem größten Leidensdruck" },
  { id: "groessteHebelwirkung", label: "Bereich mit der wahrscheinlich größten Hebelwirkung auf alles andere" },
];

// Registry der Coaching-Fragebögen (aktuell einer, bewusst als Liste
// angelegt — weitere Fragebögen können hier einfach ergänzt werden, ohne
// Datenmodell oder View anzufassen; siehe useFragebogenData.js).
export const FRAGEBOGEN_TYPEN = [
  {
    id: "passungscheck",
    titel: "Der Passungs-Check",
    untertitel: "Wie gut passt dein Leben zu deinem ADHS-Gehirn?",
    beschreibung:
      "Der Lebensrahmenbedingungen-Fragebogen aus dem Curriculum „Das ADHS-Paradoxon\" — Beziehung, Arbeit, Wohnraum, Finanzen, sozialer Kreis und mehr. Ergänzt die gesundheitlichen Protokolle um die lebensweltliche Passung.",
    abschnitte: PASSUNGSCHECK_ABSCHNITTE,
    auswertungFelder: PASSUNGSCHECK_AUSWERTUNG_FELDER,
  },
];

export const PIE_COLORS = ["#0FB8A3", "#5B9BF0", "#F5A623", "#F2596A", "#9B7EDE", "#4FBF8F"];

// Farben bewusst auf 4 harmonische Familien reduziert (statt einer Kachel
// pro Regenbogenfarbe): Smaragd (Marke/Substanzen), Schiefer-Blau (klinisch/
// Analyse), warmes Terracotta (Ernährung/Energie), Pflaume (ruhig/Referenz).
export const F_EMERALD = ["#14917A", "#0A5F4F"];
export const F_SLATE = ["#5B7DAE", "#3A5A87"];
export const F_WARM = ["#C98A4A", "#A96B2E"];
export const F_PLUM = ["#9B85B8", "#786198"];

// Metadaten für die 7 Reiter im "Alle Pläne"-Hub (PlaeneView.jsx) — alles,
// was aktiv mit Zeiten/Zielen geplant wird (Grundlagen zuerst, dann
// Substanzen aufsteigend nach Eingriffstiefe). Ersetzt die frühere
// DASHBOARD_TIERS-"tracker"-Gruppe, jetzt als Reiter statt Dashboard-Kacheln.
export const PLAENE_TABS = [
  { id: "schlaf", label: "Schlaf", icon: "moon", grad: F_PLUM },
  { id: "hydration", label: "Hydration", icon: "droplet", grad: F_EMERALD },
  { id: "ernaehrung", label: "Ernährung", icon: "utensils", grad: F_WARM },
  { id: "training", label: "Training", icon: "dumbbell", grad: F_WARM },
  { id: "supplemente", label: "Supplemente", icon: "capsule", grad: F_WARM },
  { id: "medikamente", label: "Medikamente", icon: "cross", grad: F_SLATE },
  { id: "peptide", label: "Peptide", icon: "dna", grad: F_EMERALD },
  { id: "wochenuebersicht", label: "Wochenübersicht", icon: "calendarWeek", grad: F_SLATE },
];
