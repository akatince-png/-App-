import { toLocalISODate } from "./dates";

// Tagesrätsel (Nutzerinnen-Wunsch 24.09.): jeden Tag 5 gemischte
// Denksport-Fragen als feste Tagesaufgabe — wie das Trinkziel. Gezählt wird
// jede beantwortete Frage (richtig oder nicht, aus Denksport oder
// Denkpause), gespeichert wie bisher in denkpause_ergebnisse. Ein Tag mit
// mindestens 5 Antworten gilt als geschafft und bringt im Punktesystem
// einen Bonuspunkt (siehe KATEGORIEN "tagesraetsel" in errungenschaften.js).
export const TAGESRAETSEL_ZIEL = 5;

function tagVon(roh) {
  if (!roh) return null;
  const d = new Date(roh);
  return Number.isNaN(d.getTime()) ? null : toLocalISODate(d);
}

// Anzahl heute beantworteter Fragen.
export function tagesraetselHeute(ergebnisse, heute = new Date()) {
  const tag = toLocalISODate(heute);
  return (ergebnisse || []).filter((e) => tagVon(e.erstelltAm) === tag).length;
}

// Alle Tage (YYYY-MM-DD), an denen das Tagesrätsel geschafft wurde.
export function tageMitTagesraetsel(ergebnisse) {
  const zaehler = {};
  for (const e of ergebnisse || []) {
    const tag = tagVon(e.erstelltAm);
    if (tag) zaehler[tag] = (zaehler[tag] || 0) + 1;
  }
  return Object.keys(zaehler).filter((tag) => zaehler[tag] >= TAGESRAETSEL_ZIEL);
}
