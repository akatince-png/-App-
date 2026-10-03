// Ampel für den Tag (03.10., Nutzerin: „Farbpalette bzw. Ampelidee sehr gut.
// Abend- und Morgenroutine sind immer ein absolut strenger Fall – nicht
// diskutabel. Dementsprechend kannst du die anderen Sachen staffeln.“).
// Erste Staffelung, Nutzerin passt sie bei Bedarf an:
//   pflicht  (rot)   – Morgen- und Abendroutine; Matrix-Aufgaben „JETZT“
//   wichtig  (grün)  – die Bausteine des Coachings (Bewegung, Wasser, Licht,
//                      Essen, Schlaf, Supplemente, Medikation, Atem, Gewohnheiten)
//                      und Matrix „PLANEN“ – alle gleichrangig
//   flexibel (gelb)  – Zeitblöcke, Workflows, Mein-Alltag-Termine; Matrix „KURZ“
//   spaeter  (grau)  – Matrix „SPÄTER“
export const STUFEN = {
  pflicht: { id: "pflicht", label: "Pflicht", farbe: "#E04F3E", rang: 0 },
  wichtig: { id: "wichtig", label: "Wichtig", farbe: "#2E9C6E", rang: 1 },
  flexibel: { id: "flexibel", label: "Flexibel", farbe: "#E0A21B", rang: 2 },
  spaeter: { id: "spaeter", label: "Später", farbe: "#8A90A6", rang: 3 },
};

const AUS_MATRIX = {
  jetzt: "pflicht",
  planen: "wichtig",
  kurz: "flexibel",
  spaeter: "spaeter",
};

export function stufeVon(item) {
  if (!item) return STUFEN.wichtig;
  if (item.kategorie === "morgenroutine" || item.kategorie === "abendroutine")
    return STUFEN.pflicht;
  if (item.quadrant && AUS_MATRIX[item.quadrant])
    return STUFEN[AUS_MATRIX[item.quadrant]];
  if (["zeitblock", "workflow", "alltag"].includes(item.kategorie))
    return STUFEN.flexibel;
  return STUFEN.wichtig;
}

// Reihenfolge: erst nach Ampel, dann nach Uhrzeit (ohne Uhrzeit zuletzt).
export function nachPrioritaet(items) {
  return [...items].sort(
    (a, b) =>
      stufeVon(a).rang - stufeVon(b).rang ||
      (a.uhrzeit || "99").localeCompare(b.uhrzeit || "99"),
  );
}
