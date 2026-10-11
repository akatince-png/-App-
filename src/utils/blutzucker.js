// Blutzucker-Protokoll (11.10.): reine Hilfen für Eingabe und Übersicht.
// Gespeichert wird immer in mg/dl; mmol/l wird umgerechnet (1 mmol/l ≈ 18 mg/dl).
// Bewusst keine Bewertung der Werte (Lifestyle-App, Einordnung beim Arzt).

export const ZEITPUNKTE = [
  { id: "nuechtern", label: "Morgens nüchtern" },
  { id: "vor_essen", label: "Vor dem Essen" },
  { id: "nach_essen", label: "Nach dem Essen" },
  { id: "abends", label: "Abends" },
  { id: "zwischendurch", label: "Zwischendurch" },
];
export const ZEITPUNKT_IDS = ZEITPUNKTE.map((z) => z.id);
export const zeitpunktLabel = (id) => ZEITPUNKTE.find((z) => z.id === id)?.label || "Zwischendurch";

export const MMOL_FAKTOR = 18.016;
export const GRENZEN_MGDL = [20, 600];

// Vorschlag nach Uhrzeit: früh → nüchtern, spät → abends, sonst zwischendurch.
export function zeitpunktVorschlag(datum = new Date()) {
  const h = datum.getHours();
  if (h >= 4 && h < 10) return "nuechtern";
  if (h >= 19 || h < 4) return "abends";
  return "zwischendurch";
}

const zahl = (x) => {
  const t = String(x ?? "").trim().replace(",", ".");
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? n : null;
};

// Prüft die Eingabe in der gewählten Einheit; liefert mg/dl.
export function messungPruefen({ wert, einheit = "mgdl", zeitpunkt }) {
  const n = zahl(wert);
  if (n === null) return { ok: false, fehler: einheit === "mmol" ? "Bitte den Wert eintragen (z. B. 5,4)." : "Bitte den Wert eintragen (z. B. 95)." };
  const mgdl = Math.round(einheit === "mmol" ? n * MMOL_FAKTOR : n);
  if (mgdl < GRENZEN_MGDL[0] || mgdl > GRENZEN_MGDL[1]) {
    return { ok: false, fehler: einheit === "mmol" ? "Der Wert sieht ungewöhnlich aus – bitte kurz prüfen (mmol/l?)." : "Der Wert sieht ungewöhnlich aus – bitte kurz prüfen (mg/dl?)." };
  }
  return { ok: true, werte: { wertMgdl: mgdl, zeitpunkt: ZEITPUNKT_IDS.includes(zeitpunkt) ? zeitpunkt : "zwischendurch" } };
}

export const inMmol = (mgdl) => Math.round((mgdl / MMOL_FAKTOR) * 10) / 10;
export const wertText = (mgdl, einheit = "mgdl") => (einheit === "mmol" ? `${String(inMmol(mgdl)).replace(".", ",")} mmol/l` : `${mgdl} mg/dl`);

// Durchschnitt der letzten `tage` Tage (inkl. heute), optional nur ein Zeitpunkt.
export function durchschnitt(messungen, tage, { zeitpunkt = null, heute = new Date() } = {}) {
  const grenze = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - (tage - 1)).toLocaleDateString("sv-SE");
  const auswahl = (messungen || []).filter((m) => m.datum >= grenze && (!zeitpunkt || m.zeitpunkt === zeitpunkt));
  if (!auswahl.length) return null;
  return { anzahl: auswahl.length, wertMgdl: Math.round(auswahl.reduce((s, m) => s + m.wertMgdl, 0) / auswahl.length) };
}
