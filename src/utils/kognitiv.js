import { toLocalISODate } from "./dates";

// Konzentrationstraining (25.09., Nutzerinnen-Wunsch "Ping-Pong-Ball mit den
// Augen verfolgen" u. Ä.): vier kurze Spiele, je 1–2 Minuten, mit
// mitwachsendem Level. Bewusst ohne Wirkversprechen: geübt wird die
// Aufgabe im Spiel – ob und wie viel davon im Alltag ankommt, ist offen
// (siehe Wissens-Basis). ADHS-Grundsätze: kurz, sofortige Rückmeldung,
// kein rotes "Falsch", Level passt sich an.
export const SPIELE = [
  { id: "ball", emoji: "🏓", name: "Bälle verfolgen", text: "Ein paar Bälle leuchten kurz auf – behalte sie mit den Augen, während alle durcheinanderfliegen.", uebt: "Aufmerksamkeit über Zeit halten" },
  { id: "stopp", emoji: "🚦", name: "Stopp-Spiel", text: "Grün: schnell tippen. Rot: nicht tippen.", uebt: "Kurz innehalten statt sofort reagieren" },
  { id: "zahlen", emoji: "🔢", name: "Zahlen merken", text: "Zahlen erscheinen nacheinander – danach tippst du sie ein.", uebt: "Arbeitsgedächtnis" },
  { id: "wechsel", emoji: "🔀", name: "Regel-Wechsel", text: "Blauer Rahmen: gerade oder ungerade? Oranger Rahmen: kleiner oder größer als 5?", uebt: "Zwischen Aufgaben umschalten" },
];
export const SPIEL = Object.fromEntries(SPIELE.map((s) => [s.id, s]));

const GRENZEN = { ball: [1, 10], stopp: [1, 8], zahlen: [3, 12], wechsel: [1, 8] };
// Start bewusst nicht ganz unten (Nutzerin 26.09.: "darf ruhig anspruchsvoller sein").
const START = { ball: 3, stopp: 3, zahlen: 5, wechsel: 3 };

// Level fürs nächste Mal: nach ≥ 80 % richtig eins hoch, unter 50 % eins
// runter, sonst gleich. Beim Zahlen-Merken ist das Level die Folgenlänge.
export function naechstesLevel(ergebnisse = [], spiel) {
  const [min, max] = GRENZEN[spiel] || [1, 10];
  const letzte = ergebnisse.filter((e) => e.spiel === spiel).sort((a, b) => String(a.erstelltAm).localeCompare(String(b.erstelltAm))).at(-1);
  if (!letzte) return START[spiel] ?? min;
  const quote = letzte.gesamt ? letzte.richtig / letzte.gesamt : 0;
  const delta = quote >= 0.8 ? 1 : quote < 0.5 ? -1 : 0;
  return Math.min(max, Math.max(min, letzte.level + delta));
}

// Bälle verfolgen: mehr Bälle, mehr Ziele und schneller mit dem Level.
export function ballParameter(level) {
  const l = Math.max(1, level);
  return { baelle: Math.min(12, 5 + l), ziele: Math.min(5, 2 + Math.floor((l - 1) / 2)), tempo: 0.18 + l * 0.035, dauerMs: 6000 + Math.min(4000, l * 400) };
}

// Stopp-Spiel: kürzere Anzeige und mehr Rot mit dem Level.
export function stoppParameter(level) {
  const l = Math.max(1, level);
  return { durchgaenge: 24, anzeigeMs: Math.max(450, 950 - l * 60), rotAnteil: Math.min(0.4, 0.2 + l * 0.025) };
}

// Ein Durchgang: { rot: bool, getippt: bool, ms: number|null }. Richtig =
// grün getippt oder rot nicht getippt. Reaktion = Ø der getippten Grünen.
export function stoppAuswerten(durchgaenge = []) {
  const richtig = durchgaenge.filter((d) => (d.rot ? !d.getippt : d.getippt)).length;
  const zeiten = durchgaenge.filter((d) => !d.rot && d.getippt && d.ms != null).map((d) => d.ms);
  const reaktionMs = zeiten.length ? Math.round(zeiten.reduce((a, b) => a + b, 0) / zeiten.length) : null;
  const zuFrueh = durchgaenge.filter((d) => d.rot && d.getippt).length;
  return { richtig, gesamt: durchgaenge.length, reaktionMs, zuFrueh };
}

export function zufallsZiffern(laenge, rnd = Math.random) {
  const z = [];
  while (z.length < laenge) {
    const n = Math.floor(rnd() * 10);
    if (z.at(-1) !== n) z.push(n);
  }
  return z;
}

// Regel-Wechsel: Zahl 1–9 ohne 5; Regel je Durchgang, wechselt mit dem
// Level häufiger (Level 1: ~25 %, ab Level 6: ~50 %).
export function wechselAufgaben(anzahl, level, rnd = Math.random) {
  const wechselChance = Math.min(0.5, 0.2 + level * 0.05);
  const liste = [];
  let regel = rnd() < 0.5 ? "paritaet" : "groesse";
  for (let i = 0; i < anzahl; i++) {
    if (i > 0 && rnd() < wechselChance) regel = regel === "paritaet" ? "groesse" : "paritaet";
    let zahl = 1 + Math.floor(rnd() * 8);
    if (zahl >= 5) zahl += 1;
    liste.push({ zahl, regel });
  }
  return liste;
}

export function wechselRichtig({ zahl, regel }, antwort) {
  if (regel === "paritaet") return antwort === (zahl % 2 === 0 ? "gerade" : "ungerade");
  return antwort === (zahl > 5 ? "groesser" : "kleiner");
}

// Tage mit mindestens einer Runde (für Punkte/Serie, wie Atemübung).
export function kognitivTage(ergebnisse = []) {
  return [...new Set(ergebnisse.map((e) => toLocalISODate(new Date(e.erstelltAm))))];
}

export function ergebnisSatz(spiel, e) {
  const quote = e.gesamt ? Math.round((e.richtig / e.gesamt) * 100) : 0;
  if (spiel === "zahlen") return `Längste gemerkte Folge: ${e.level} Ziffern.`;
  if (spiel === "stopp") return `${quote} % richtig${e.reaktionMs ? ` · Ø ${e.reaktionMs} ms bei Grün` : ""}.`;
  if (spiel === "wechsel") return `${quote} % richtig${e.reaktionMs ? ` · Ø ${(e.reaktionMs / 1000).toFixed(1).replace(".", ",")} s` : ""}.`;
  return `${e.richtig} von ${e.gesamt} Bällen gefunden.`;
}
