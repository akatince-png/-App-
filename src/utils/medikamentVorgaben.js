// Vorausgefüllte Werte je Medikamenten-Kategorie (25.09., Nutzerin: die App
// managt das ganze Leben mit ADHS, nicht nur das ADHS). Ein neues
// Medikament startet mit ADHS-Medikation (Tablette, täglich 08:00) statt
// wie früher mit "Hormone / Injektion / 1× pro Woche" aus der Peptid-Zeit.
// Wer eine andere Kategorie wählt (z. B. Hormone für eine Testosteron-
// Ersatztherapie), bekommt dort typische Werte vorgeschlagen — aber nur
// für Felder, die man noch nicht selbst geändert hat.
export const START_KATEGORIE = "ADHS-Medikation";

export const VORGABEN = {
  "ADHS-Medikation": { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["08:00"] },
  // TRT: Injektion (Enantat/Cypionat) meist 1–2× pro Woche; Gel/Creme täglich.
  Hormone: { einnahmeart: "Injektion", intervallDays: 7, uhrzeiten: ["08:00"] },
  Peptid: { einnahmeart: "Injektion", intervallDays: 1, uhrzeiten: ["20:00"] },
  Cannabis: { einnahmeart: "Blüte (Verdampfen)", intervallDays: 1, uhrzeiten: ["21:00"] },
  Blutdruck: { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["08:00"] },
  Diabetes: { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["08:00"] },
  Cholesterin: { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["20:00"] },
  Schmerzmittel: { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["08:00"] },
  Sonstige: { einnahmeart: "Tablette (oral)", intervallDays: 1, uhrzeiten: ["08:00"] },
};

export function vorgabenFuer(kategorie) {
  return VORGABEN[kategorie] || VORGABEN.Sonstige;
}

// Startwerte für ein neues Medikament (Kategorie, Einnahmeart, täglich …).
export function neuesMedikamentStart() {
  const v = vorgabenFuer(START_KATEGORIE);
  return { kategorie: START_KATEGORIE, einnahmeart: v.einnahmeart, intervallTyp: "fixed", intervallDays: v.intervallDays, uhrzeiten: [...v.uhrzeiten] };
}

const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Kategorie wechseln: Felder, die noch auf der Vorgabe der alten Kategorie
// stehen, bekommen die Vorgabe der neuen; selbst Geändertes bleibt.
// `m` = { kategorie, einnahmeart, intervallTyp, intervallDays, uhrzeiten, … }
export function kategorieWechseln(m, neueKategorie) {
  const alt = vorgabenFuer(m.kategorie);
  const neu = vorgabenFuer(neueKategorie);
  const erg = { ...m, kategorie: neueKategorie };
  if (m.einnahmeart === alt.einnahmeart) erg.einnahmeart = neu.einnahmeart;
  if ((m.intervallTyp || "fixed") === "fixed" && Number(m.intervallDays) === alt.intervallDays) erg.intervallDays = neu.intervallDays;
  if (gleich(m.uhrzeiten, alt.uhrzeiten)) erg.uhrzeiten = [...neu.uhrzeiten];
  return erg;
}
