// Reihenfolge bewusst: erst ADHS-spezifische Ziele (die eigentliche
// Zielgruppe der App), danach die allgemeinen Gesundheits-/Biohacking-Ziele
// — zwei inhaltliche Gruppen in einer Liste, ohne das per Überschrift extra
// zu benennen (Nutzerinnen-Vorgabe).
export const ZIELE = [
  "Fokus & Konzentration",
  "Prokrastination überwinden",
  "Tagesstruktur aufbauen",
  "Reizüberflutung reduzieren",
  "Zeitgefühl verbessern",
  "Impulskontrolle stärken",
  "Weniger Overwhelm",
  "Motivation im Alltag",
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

// Bewusst sehr umfangreich (Nutzerinnen-Vorgabe, 13.08.: "die vorhandene
// Liste um hundert weitere mögliche Peptide erweitern") — deckt neben den
// gängigen Biohacking-Peptiden auch verwandte Peptid-Hormone ab, die in
// diesem Kontext häufig mit auftauchen (GnRH-Analoga, Somatostatin-Analoga,
// körpereigene Peptid-Hormone). Vorschläge sind Hilfe, keine Pflicht/
// Empfehlung — was davon sinnvoll/legal ist, entscheidet die Person bzw.
// ärztliche Rücksprache, die App bewertet das nicht.
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
  // Weitere Wachstumshormon-Sekretagoga/-Releasing-Peptide
  "Alexamorelin",
  "Examorelin",
  "Tabimorelin",
  "Capromorelin",
  "HGH Fragment 176-191",
  "GHRP-1",
  "PEG-MGF",
  "MGF (Mechano Growth Factor)",
  "IGF-1 DES",
  // GLP-1/GIP/Glukagon-Analoga (Stoffwechsel)
  "Liraglutid",
  "Exenatid",
  "Lixisenatid",
  "Dulaglutid",
  "Cagrilintid",
  "Survodutid",
  "Mazdutid",
  "Pramlintid",
  // Heilung/Regeneration
  "Larazotid",
  "ARA-290 (Cibinetide)",
  "Thymosin Beta-4 Fragment",
  "GHK",
  "Copper-Tripeptid-1",
  // Kognitiv/neuroprotektiv
  "Dihexa",
  "Cerebrolysin",
  "P21",
  "Cortagin",
  // Langlebigkeit/Zellgesundheit
  "SS-31 (Elamipretid)",
  "FOXO4-DRI",
  "GDF-11",
  // Immunmodulation
  "Thymalin",
  "Thymogen",
  "Thymopentin",
  // Haut/Kosmetik-Peptide
  "Matrixyl (Palmitoyl-Pentapeptid-4)",
  "Argireline (Acetyl-Hexapeptid-8)",
  "Syn-Ake",
  "Eyeseryl",
  // Sexuelle Gesundheit
  "Kisspeptin-54",
  // Muskelaufbau/Leistung
  "ACE-031",
  "Follistatin 315",
  "Laminin-411",
  // Körpereigene Peptid-Hormone/Neuropeptide (häufig im Forschungskontext genannt)
  "Cortistatin-14",
  "Ghrelin",
  "Obestatin",
  "Adropin",
  "Irisin",
  "Apelin-13",
  "Angiotensin (1-7)",
  "Bradykinin",
  "Substanz P",
  "Neuropeptid Y",
  "Orexin A",
  "Orexin B",
  "PACAP-38",
  "Galanin",
  "Motilin",
  "Sekretin",
  "Urocortin",
  "CRH (Corticotropin-Releasing Hormone)",
  "ACTH (Adrenocorticotropes Hormon)",
  "Calcitonin",
  "Glukagon",
  "Amylin",
  "Relaxin",
  "Vasopressin",
  "Desmopressin",
  // GnRH-Analoga
  "Gonadorelin",
  "Triptorelin",
  "Leuprorelin",
  "Goserelin",
  "Buserelin",
  "Nafarelin",
  "Cetrorelix",
  "Ganirelix",
  // Somatostatin-Analoga
  "Octreotid",
  "Lanreotid",
  "Pasireotid",
  // Knochenstoffwechsel
  "Teriparatid",
  "Abaloparatid",
  // Magen-Darm
  "Linaclotid",
  "Plecanatid",
  // Sonstige
  "Icatibant",
  "Ecallantid",
];

// Einnahmearten für Peptide & Medikamente — Injektion ist der Standard, die
// meisten Peptide werden subkutan gespritzt; viele Präparate (Peptide wie
// Medikamente) gibt es aber auch als Tablette, Kapsel, Pulver, Tropfen oder
// Nasenspray.
export const EINNAHMEARTEN = ["Injektion", "Tablette (oral)", "Kapsel", "Pulver", "Tropfen", "Nasenspray"];

// Kategorien innerhalb von "Medikamente" — fasst Hormone/Off-Label mit
// anderen verschreibungspflichtigen/rezeptfreien Medikamenten zusammen.
// "Peptid" seit 13.08. mit dabei (Nutzerinnen-Vorgabe: Peptide als eigener
// Reiter neben Medikamente sei nicht sinnvoll, gehört als Kategorie dort
// rein) — siehe Migration 0042, die bestehende Peptid-Einträge nach
// hormones/hormone_logs kopiert.
export const MEDIKAMENTE_KATEGORIEN = ["Hormone", "Peptid", "Blutdruck", "Diabetes", "Cholesterin", "Schmerzmittel", "Sonstige"];

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

// Bewusst sehr feingliedrig (Basisübung / Variante), statt nur die
// Basisübung zu listen — Nutzerinnen-Vorgabe (13.08.): beim Tippen von
// Kürzeln wie "BA" sollen möglichst alle gängigen Ausführungsvarianten
// (Gerät, Winkel, Griff) als eigene Vorschläge auftauchen, ähnlich wie in
// professionellen Trainings-Apps (Strong, Fitbod u. Ä.), nicht nur eine
// generische "Bankdrücken"-Option.
export const KRAFTUEBUNGEN = [
  // Brust
  "Bankdrücken / Flachbank (Langhantel)", "Bankdrücken / Flachbank (Kurzhantel)",
  "Bankdrücken / Flachbank (Multipresse)", "Bankdrücken / Schrägbank (Langhantel)",
  "Bankdrücken / Schrägbank (Kurzhantel)", "Bankdrücken / Schrägbank (Multipresse)",
  "Bankdrücken / Negativbank (Langhantel)", "Bankdrücken / Negativbank (Kurzhantel)",
  "Bankdrücken / Enger Griff", "Butterfly / Maschine", "Fliegende / Kurzhantel Flachbank",
  "Fliegende / Kurzhantel Schrägbank", "Cable Crossover / Von oben", "Cable Crossover / Von unten",
  "Cable Crossover / Mittig", "Dips / Brust-Variante", "Liegestütze / Standard",
  "Liegestütze / Schräg (Beine erhöht)", "Liegestütze / Breiter Griff",
  "Liegestütze / Enger Griff (Diamant)", "Pec Deck", "Bankdrücken / Reverse-Grip (Untergriff)",
  "Landmine Press", "Svend Press", "Pullover / Kurzhantel", "Liegestütze / Klatsch (Plyometrisch)",
  // Rücken
  "Klimmzüge / Weiter Griff", "Klimmzüge / Enger Griff", "Klimmzüge / Neutraler Griff",
  "Klimmzüge / Kinn zur Stange (Chin-ups)", "Klimmzüge / Unterstützt (Maschine/Band)",
  "Latzug / Weiter Griff", "Latzug / Enger Griff", "Latzug / Neutraler Griff",
  "Latzug / Hinter dem Nacken", "Rudern / Langhantel vorgebeugt", "Rudern / Kurzhantel einarmig",
  "Rudern / T-Bar", "Rudern / Kabel sitzend (enger Griff)", "Rudern / Kabel sitzend (weiter Griff)",
  "Rudern / Maschine", "Rudern / Meadows", "Kreuzheben / Klassisch", "Kreuzheben / Sumo",
  "Kreuzheben / Rumänisch", "Kreuzheben / Gestreckte Beine", "Kreuzheben / Trap Bar",
  "Kreuzheben / Deficit", "Good Mornings", "Hyperextensions",
  "Shrugs (Nackenheben) / Langhantel", "Shrugs (Nackenheben) / Kurzhantel",
  "Klimmzüge / Mit Zusatzgewicht", "Latzug / Einarmig am Kabel", "Rudern / Landmine",
  "Rudern / Pendlay", "Kreuzheben / Snatch-Grip", "Reverse Hyperextensions",
  // Schulter
  "Schulterdrücken / Stehend (Langhantel)", "Schulterdrücken / Sitzend (Langhantel)",
  "Schulterdrücken / Stehend (Kurzhantel)", "Schulterdrücken / Sitzend (Kurzhantel)",
  "Schulterdrücken / Maschine", "Schulterdrücken / Arnold Press", "Seitheben / Kurzhantel",
  "Seitheben / Kabel", "Seitheben / Maschine", "Frontheben / Kurzhantel", "Frontheben / Langhantel",
  "Frontheben / Kabel", "Reverse Butterfly / Maschine", "Face Pulls / Kabel",
  "Aufrechtes Rudern / Langhantel", "Aufrechtes Rudern / Kabel",
  "Schulterdrücken / Landmine", "Cuban Press", "Bus Drivers", "Lu Raises", "Y-Raises",
  // Arme (Bizeps)
  "Bizepscurls / Langhantel", "Bizepscurls / SZ-Stange", "Bizepscurls / Kurzhantel",
  "Bizepscurls / Kabel", "Bizepscurls / Schrägbank (Kurzhantel)", "Hammercurls / Kurzhantel",
  "Hammercurls / Kabel (Seil)", "Konzentrationscurls", "Scott-Curls / Kurzhantel",
  "Scott-Curls / SZ-Stange", "Scott-Curls / Maschine (Preacher Curls)", "21er-Curls",
  "Reverse Curls / Langhantel", "Zottman Curls", "Cross-Body Hammercurls", "Drag Curls",
  // Arme (Trizeps)
  "French Press / Langhantel", "French Press / Kurzhantel", "French Press / SZ-Stange",
  "French Press / Kabel", "Trizepsdrücken am Kabel / Stange", "Trizepsdrücken am Kabel / Seil",
  "Trizeps-Kickback / Kurzhantel", "Trizeps-Kickback / Kabel", "Enges Bankdrücken",
  "Overhead Extension / Kurzhantel", "Overhead Extension / Kabel", "Dips / Trizeps-Variante",
  "Skull Crushers / Langhantel", "Skull Crushers / Kurzhantel", "JM Press", "Trizepsdips an Bank",
  // Beine
  "Kniebeuge / Langhantel (High-Bar)", "Kniebeuge / Langhantel (Low-Bar)", "Kniebeuge / Front",
  "Kniebeuge / Goblet", "Kniebeuge / Zercher", "Kniebeuge / Box", "Kniebeuge / Hack",
  "Kniebeuge / Smith Machine", "Kniebeuge / Bulgarian Split Squat", "Beinpresse / 45 Grad",
  "Beinpresse / Liegend", "Beinstrecker", "Beinbeuger / Liegend", "Beinbeuger / Sitzend",
  "Ausfallschritte / Stehend", "Ausfallschritte / Gehend", "Ausfallschritte / Rückwärts",
  "Wadenheben / Stehend", "Wadenheben / Sitzend", "Wadenheben / Eselwadenheben (Donkey Calf Raise)",
  "Hip Thrust / Langhantel", "Hip Thrust / Maschine", "Step-ups", "Sissy Squats",
  "Kniebeuge / Pause Squat", "Kniebeuge / Safety-Bar", "Beinpresse / Einbeinig",
  "Wadenheben / Beinpresse", "Cossack Squat", "Glute Ham Raise",
  // Bauch/Core
  "Crunches / Klassisch", "Crunches / Kabel (Cable Crunch)", "Crunches / Maschine", "Sit-ups",
  "Beinheben / Hängend", "Beinheben / Liegend", "Plank / Standard", "Plank / Seitlich (Side Plank)",
  "Russian Twist", "Ab Wheel Rollout", "Hollow Body Hold", "Dragon Flag",
  "Woodchoppers / Kabel", "Pallof Press", "Toes to Bar", "Beinheben / Captain's Chair",
  // Ganzkörper / Kettlebell (bewusst ausführlich — Nutzerinnen-Vorgabe, 13.08.:
  // will Kettlebell-Übungen gezielt und möglicherweise auch als eigene
  // wöchentliche Einheiten einsetzen)
  "Kettlebell Swing / Einarmig", "Kettlebell Swing / Beidarmig", "Kettlebell Swing / American (über Kopf)",
  "Kettlebell Goblet Squat", "Kettlebell Front Squat / Doppelt", "Kettlebell Turkish Get-up",
  "Kettlebell Clean", "Kettlebell Clean and Press", "Kettlebell Snatch", "Kettlebell Windmill",
  "Kettlebell Halo", "Kettlebell Figure 8", "Kettlebell Renegade Row", "Kettlebell Thruster",
  "Kettlebell Push Press", "Kettlebell Overhead Press / Einarmig", "Kettlebell Rudern / Einarmig",
  "Kettlebell Kreuzheben / Beidarmig", "Kettlebell Kreuzheben / Einarmig",
  "Kettlebell Ausfallschritte / Vorne gehalten", "Kettlebell Suitcase Carry",
  "Kettlebell High Pull", "Kettlebell Around the World", "Kettlebell Sit-up mit Press",
  "Kettlebell Floor Press", "Kettlebell Bottoms-Up Press", "Kettlebell Einbeiniges Kreuzheben",
  "Farmer's Walk / Kurzhantel", "Farmer's Walk / Kettlebell",
];

export const BODYWEIGHT_UEBUNGEN = [
  "Liegestütze / Standard", "Liegestütze / Schräg (Beine erhöht)", "Liegestütze / Diamant",
  "Liegestütze / Archer", "Liegestütze / Breiter Griff", "Liegestütze / Ein Arm",
  "Liegestütze / Pike (Schulter)", "Liegestütze / Decline (Beine erhöht)",
  "Klimmzüge / Weiter Griff", "Klimmzüge / Enger Griff", "Klimmzüge / Neutraler Griff",
  "Klimmzüge / Kinn zur Stange (Chin-ups)", "Muscle-up", "Dips / Bank", "Dips / Barren",
  "Ring Dips", "Pistol Squat", "Air Squats", "Ausfallschritte / Gehend",
  "Ausfallschritte / Rückwärts", "Bulgarian Split Squat", "Plank / Standard",
  "Plank / Seitlich (Side Plank)", "L-Sit", "Handstand / Freistehend",
  "Handstand-Liegestütze / Wandgestützt", "Burpees", "Mountain Climbers",
  "Beinheben / Hängend", "Superman", "Hollow Body Hold", "Jumping Jacks", "Bear Crawl",
  "Australian Pull-ups (Inverted Rows)", "Skater Jumps", "Box Jumps", "Wall Sit",
  "Glute Bridge", "Nordic Curls", "Dragon Flag", "Pike Push-ups", "Clap Push-ups",
  "Klimmzüge / Archer", "Klimmzüge / Typewriter", "Klimmzüge / Commando",
  "Cossack Squat", "Shrimp Squat", "Broad Jumps", "Tuck Jumps", "Reverse Plank",
  "Bird Dog", "Toes to Bar",
];

// Kombinierter Katalog für Felder, in denen mehrere Übungen zusammen in
// einem Feld eingetragen werden (siehe WochenplanEditor.jsx) — deckt sowohl
// Kraft- als auch Bodyweight-Übungen ab, da eine Trainingseinheit mehrere
// Arten gleichzeitig kombinieren kann.
export const ALLE_UEBUNGEN = [...new Set([...KRAFTUEBUNGEN, ...BODYWEIGHT_UEBUNGEN])];

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
  { id: "tageslicht", label: "Tageslicht", icon: "sun", grad: F_WARM },
  { id: "ernaehrung", label: "Ernährung", icon: "utensils", grad: F_WARM },
  { id: "training", label: "Training", icon: "dumbbell", grad: F_WARM },
  { id: "supplemente", label: "Supplemente", icon: "capsule", grad: F_WARM },
  { id: "medikamente", label: "Medikamente", icon: "cross", grad: F_SLATE },
  { id: "wochenuebersicht", label: "Wochenübersicht", icon: "calendarWeek", grad: F_SLATE },
];
