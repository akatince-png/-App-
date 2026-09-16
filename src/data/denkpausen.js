import { MATHE_AUFGABEN } from "./denkpausenMathe";
import { WORTSPIELE_AUFGABEN } from "./denkpausenWortspiele";
import { RAETSEL_AUFGABEN } from "./denkpausenRaetsel";
import { WISSEN_AUFGABEN } from "./denkpausenWissen";

// "Denkpause" (Nutzerinnen-Vorgabe 16.09.): kurze, freiwillige Multiple-
// Choice-Denksportaufgaben als "Anlasser" vor einer Handlung — z. B. statt
// aufs Handy zu scrollen (BildschirmzeitView) oder als kurzer Übergang
// zwischen zwei Tagesplan-Punkten (TagesplanView). Bewusst OHNE Backend/
// Migration: rein clientseitiger, sitzungsweiter Pool-Pick, nichts wird
// gespeichert oder ausgewertet — siehe DenkpauseNudge.jsx für die UI-Regeln
// (nie blockierend, immer überspringbar).
export const DENKPAUSEN_KATEGORIEN = [
  { id: "mathe", label: "Mathe", aufgaben: MATHE_AUFGABEN },
  { id: "wortspiele", label: "Wortspiele", aufgaben: WORTSPIELE_AUFGABEN },
  { id: "raetsel", label: "Rätsel", aufgaben: RAETSEL_AUFGABEN },
  { id: "wissen", label: "Allgemeinwissen", aufgaben: WISSEN_AUFGABEN },
];

const ALLE_AUFGABEN = DENKPAUSEN_KATEGORIEN.flatMap((k) => k.aufgaben.map((a) => ({ ...a, kategorie: k.id })));

// Modulweiter (nicht React-State) Kurzzeit-Speicher der zuletzt gezeigten
// Fragen — verhindert direkte Wiederholungen innerhalb einer Sitzung, ohne
// dafür einen Hook/Context/Backend zu brauchen. Bewusst nicht persistiert:
// eine Denkpause ist ein flüchtiger Moment, kein Fortschritt, den man
// nachverfolgen müsste.
let zuletztGezeigt = [];

export function zufaelligeDenkpauseAufgabe() {
  const kandidaten = ALLE_AUFGABEN.filter((a) => !zuletztGezeigt.includes(a.frage));
  const pool = kandidaten.length > 0 ? kandidaten : ALLE_AUFGABEN;
  const aufgabe = pool[Math.floor(Math.random() * pool.length)];
  zuletztGezeigt = [aufgabe.frage, ...zuletztGezeigt].slice(0, 30);
  return aufgabe;
}
