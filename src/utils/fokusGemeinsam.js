// Gemeinsam fokussieren / Body Doubling (27.09.): reine Logik ohne React.
// Wer ist gerade dabei, welche Runde steht an, wie steht meine Sitzung?
import { toLocalISODate } from "./dates";

export const DAUER_OPTIONEN = [15, 25, 50];
export const ERGEBNISSE = [
  { key: "geschafft", label: "Geschafft", emoji: "✅" },
  { key: "teilweise", label: "Ein Stück weit", emoji: "🌓" },
  { key: "nicht", label: "Heute nicht", emoji: "🌱" },
];

const ms = (iso) => new Date(iso).getTime();
export const sitzungEnde = (s) => ms(s.startUm) + s.dauerMinuten * 60000;

// Läuft noch: gestartet, nicht beendet, geplante Zeit noch nicht um
// (plus 5 Min. Kulanz – wer kurz drüber ist, gilt noch als dabei).
export function laeuft(s, jetzt = Date.now()) {
  return !!s && !s.beendetUm && ms(s.startUm) <= jetzt && jetzt < sitzungEnde(s) + 5 * 60000;
}

// Meine offene Sitzung (noch ohne Ergebnis, höchstens 12 Std. alt): läuft
// entweder noch oder wartet auf "Wie lief's?".
export function meineOffene(sitzungen, userId, jetzt = Date.now()) {
  return (sitzungen || [])
    .filter((s) => s.userId === userId && !s.ergebnis && jetzt - ms(s.startUm) < 12 * 3600000)
    .sort((a, b) => ms(b.startUm) - ms(a.startUm))[0] || null;
}

// Wer aus dem Team fokussiert gerade (ohne mich)?
export function gradeDabei(sitzungen, userId, jetzt = Date.now()) {
  const proPerson = new Map();
  for (const s of sitzungen || []) {
    if (s.userId === userId || !laeuft(s, jetzt)) continue;
    const alt = proPerson.get(s.userId);
    if (!alt || ms(s.startUm) > ms(alt.startUm)) proPerson.set(s.userId, s);
  }
  return [...proPerson.values()].sort((a, b) => ms(a.startUm) - ms(b.startUm));
}

// Runde "dran": 15 Min. vorher bis zum Ende; sonst die nächste kommende.
export function aktuelleRunde(runden, jetzt = Date.now()) {
  return (runden || []).find((r) => jetzt >= ms(r.startUm) - 15 * 60000 && jetzt <= ms(r.startUm) + r.dauerMinuten * 60000) || null;
}
export function naechsteRunde(runden, jetzt = Date.now()) {
  return (runden || []).filter((r) => ms(r.startUm) > jetzt).sort((a, b) => ms(a.startUm) - ms(b.startUm))[0] || null;
}

// Heute geteilte Erfolge (für "Heute geschafft" im Team).
export function heuteErledigt(sitzungen, heuteIso) {
  return (sitzungen || [])
    .filter((s) => s.ergebnis && s.teilen && toLocalISODate(new Date(s.startUm)) === heuteIso)
    .sort((a, b) => ms(b.startUm) - ms(a.startUm));
}

export const restMinuten = (s, jetzt = Date.now()) => Math.max(0, Math.ceil((sitzungEnde(s) - jetzt) / 60000));
