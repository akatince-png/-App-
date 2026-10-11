// Blutdruck-Protokoll (11.10.): reine Hilfen für Eingabe und Übersicht.
// Bewusst keine Bewertung („zu hoch“ o. ä.) – AKA ist eine Lifestyle-App,
// die Einordnung gehört zum Arzt. Nur Zahlen und Durchschnitte.

export const GRENZEN = { systolisch: [50, 260], diastolisch: [30, 180], puls: [25, 250] };

const ganzeZahl = (x) => {
  const n = Number(String(x ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && String(x ?? "").trim() !== "" ? Math.round(n) : null;
};

// Prüft die Eingabe; gibt { ok, werte } oder { ok: false, fehler } zurück.
export function messungPruefen({ systolisch, diastolisch, puls }) {
  const sys = ganzeZahl(systolisch);
  const dia = ganzeZahl(diastolisch);
  const p = ganzeZahl(puls);
  const imBereich = (wert, [min, max]) => wert !== null && wert >= min && wert <= max;
  if (!imBereich(sys, GRENZEN.systolisch)) return { ok: false, fehler: "Bitte den oberen Wert eintragen (z. B. 120)." };
  if (!imBereich(dia, GRENZEN.diastolisch)) return { ok: false, fehler: "Bitte den unteren Wert eintragen (z. B. 80)." };
  if (sys <= dia) return { ok: false, fehler: "Der obere Wert ist normalerweise größer als der untere – bitte kurz prüfen." };
  if (p !== null && !imBereich(p, GRENZEN.puls)) return { ok: false, fehler: "Der Puls sieht ungewöhnlich aus – bitte kurz prüfen." };
  return { ok: true, werte: { systolisch: sys, diastolisch: dia, puls: p } };
}

// Durchschnitt der Messungen der letzten `tage` Tage (inkl. heute).
export function durchschnitt(messungen, tage, heute = new Date()) {
  const grenze = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - (tage - 1)).toLocaleDateString("sv-SE");
  const auswahl = (messungen || []).filter((m) => m.datum >= grenze);
  if (!auswahl.length) return null;
  const mittel = (feld) => {
    const l = auswahl.map((m) => m[feld]).filter((v) => typeof v === "number");
    return l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null;
  };
  return { anzahl: auswahl.length, systolisch: mittel("systolisch"), diastolisch: mittel("diastolisch"), puls: mittel("puls") };
}

// Neueste zuerst (Datum, dann Uhrzeit).
export const neuesteZuerst = (messungen) =>
  [...(messungen || [])].sort((a, b) => (b.datum + (b.uhrzeit || "")).localeCompare(a.datum + (a.uhrzeit || "")));
