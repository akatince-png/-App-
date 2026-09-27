import { berechneAlter, berechneGrundumsatz } from "./kalorien";

// Steckbrief (27.09., Nutzerinnen-Wunsch: "dieses ganze Getippe ist heute
// nicht mehr angebracht"): Auswahl zum Antippen statt Freitext, nur für
// Besonderes eine kleine Zeile. Reine Namen, keine Wirkversprechen.
export const SUPPLEMENTE = [
  "Vitamin D3", "Vitamin K2", "Magnesium", "Omega-3", "Kreatin", "Zink", "Eisen", "Vitamin B12", "B-Komplex",
  "Vitamin C", "Folsäure", "Selen", "Jod", "Kalzium", "Kalium", "Multivitamin", "Vitamin A", "Vitamin E",
  "Elektrolyte", "Proteinpulver", "Kollagen", "Probiotika", "Coenzym Q10", "Kurkuma", "L-Tyrosin", "L-Theanin",
  "Glycin", "Taurin", "Melatonin", "5-HTP", "GABA", "Ashwagandha", "Rhodiola", "Ginkgo", "Safran", "Lion's Mane",
  "NAC", "Inositol", "Phosphatidylserin", "Acetyl-L-Carnitin", "Citicolin", "Koffein-Tabletten", "Spirulina",
  "Mariendistel", "Bierhefe",
];

export const SPORT_MENGE = ["Gar nicht", "Selten", "1× pro Woche", "2× pro Woche", "3× pro Woche", "4× oder öfter", "Täglich"];

export const SPORT_ARTEN = [
  "Spazieren", "Krafttraining", "Laufen", "Radfahren", "Schwimmen", "Yoga", "Pilates", "Wandern", "Fitnesskurse",
  "HIIT", "Tanzen", "Kampfsport", "Mannschaftssport", "Klettern", "Tennis/Padel", "Reiten", "Zuhause-Workout",
];

export const umschalten = (liste, wert) => ((liste || []).includes(wert) ? liste.filter((x) => x !== wert) : [...(liste || []), wert]);

// Lesbarer Text aus Auswahl + eigener Zeile (für Coach-Ansicht und alte Felder).
export const alsText = (liste, anderes) => [...(liste || []), ...(anderes && anderes.trim() ? [anderes.trim()] : [])].join(", ");

export function steckbriefZeilen(s, person = null) {
  const z = [];
  const k = person ? kalorienInfo({ ...person, aktivitaet: s?.aktivitaet }) : null;
  if (person) {
    const teile = [person.geschlecht, k?.alter ? `${k.alter} J.` : null, Number(person.groesse) ? `${person.groesse} cm` : null, Number(person.gewicht) ? `${person.gewicht} kg` : null].filter(Boolean);
    if (teile.length) z.push(`👤 ${teile.join(", ")}`);
    const geburt = [person.geburtsdatum ? datumDe(person.geburtsdatum) : null, s?.geburtszeit ? `${s.geburtszeit} Uhr` : null, s?.geburtsort || null].filter(Boolean);
    if (geburt.length) z.push(`🎂 Geboren: ${geburt.join(", ")}`);
    if (k?.grundumsatz) z.push(`🔥 Grundumsatz ca. ${k.grundumsatz} kcal${k.bedarf ? ` · Tagesbedarf ca. ${k.bedarf} kcal (${s.aktivitaet})` : ""}`);
  }
  if (!s) return z;
  if (s.supplementeJa === false) z.push("💊 Supplemente: keine");
  else if (s.supplementeJa) z.push(`💊 Supplemente: ${s.supplementeWelche || "ja"}`);
  if (s.sportErfahrung) z.push(`🏋️ Erfahrung: ${s.sportErfahrung}`);
  if (s.sportMenge) z.push(`📅 Sport: ${s.sportMenge}`);
  if (s.sportBeschreibung) z.push(`🏃 Arten: ${s.sportBeschreibung}`);
  return z;
}

// Alltag für den Kalorienbedarf (Aktivitätsfaktor × Grundumsatz). Sport
// zählt hier mit, Werte sind grobe Richtwerte.
export const AKTIVITAET = [
  ["Meist sitzend", 1.2],
  ["Leicht aktiv", 1.375],
  ["Mäßig aktiv", 1.55],
  ["Sehr aktiv", 1.725],
];

const datumDe = (iso) => {
  const [j, m, t] = String(iso).split("-");
  return t && m && j ? `${t}.${m}.${j}` : iso;
};

// Grundumsatz (Mifflin-St-Jeor) + Tagesbedarf, sobald die Werte da sind.
export function kalorienInfo({ geschlecht, geburtsdatum, groesse, gewicht, aktivitaet }) {
  const alter = berechneAlter(geburtsdatum);
  const grundumsatz = berechneGrundumsatz({ geschlecht, geburtsdatum, groesse, gewicht });
  const faktor = AKTIVITAET.find(([n]) => n === aktivitaet)?.[1];
  const bedarf = grundumsatz && faktor ? Math.round((grundumsatz * faktor) / 10) * 10 : null;
  return { alter, grundumsatz, bedarf };
}
