// Level aus den Gesamtpunkten (UX-Review 23.09.: sichtbarer Spielstand auf
// Home). Stufen an denselben Schwellen wie die Punkte-Abzeichen
// (PUNKTE_SCHWELLEN in errungenschaften.js), damit Level-Aufstieg und
// Abzeichen zusammenfallen; danach alle 1000 Punkte ein weiteres Level.
import { PUNKTE_SCHWELLEN } from "./errungenschaften";

const STUFEN = [0, ...PUNKTE_SCHWELLEN];
const NACH_LETZTER_STUFE = 1000;

export function levelAusPunkten(punkte) {
  const p = Math.max(0, Math.floor(punkte || 0));
  const letzte = STUFEN[STUFEN.length - 1];
  if (p >= letzte) {
    const extra = Math.floor((p - letzte) / NACH_LETZTER_STUFE);
    const start = letzte + extra * NACH_LETZTER_STUFE;
    return { level: STUFEN.length + extra, start, ziel: start + NACH_LETZTER_STUFE, punkte: p };
  }
  const index = STUFEN.findIndex((s, i) => p >= s && p < STUFEN[i + 1]);
  return { level: index + 1, start: STUFEN[index], ziel: STUFEN[index + 1], punkte: p };
}

export function levelFortschritt({ start, ziel, punkte }) {
  return ziel > start ? Math.min(1, (punkte - start) / (ziel - start)) : 1;
}
