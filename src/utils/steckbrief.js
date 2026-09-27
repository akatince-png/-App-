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

export function steckbriefZeilen(s) {
  if (!s) return [];
  const z = [];
  if (s.supplementeJa === false) z.push("💊 Supplemente: keine");
  else if (s.supplementeJa) z.push(`💊 Supplemente: ${s.supplementeWelche || "ja"}`);
  if (s.sportErfahrung) z.push(`🏋️ Erfahrung: ${s.sportErfahrung}`);
  if (s.sportMenge) z.push(`📅 Sport: ${s.sportMenge}`);
  if (s.sportBeschreibung) z.push(`🏃 Arten: ${s.sportBeschreibung}`);
  return z;
}
