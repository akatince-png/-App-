import { MATHE_AUFGABEN } from "./denkpausenMathe";
import { WORTSPIELE_AUFGABEN } from "./denkpausenWortspiele";
import { RAETSEL_AUFGABEN } from "./denkpausenRaetsel";
import { WISSEN_AUFGABEN } from "./denkpausenWissen";
import { MATHE_AUFGABEN_2 } from "./denkpausenMathe2";
import { WORTSPIELE_AUFGABEN_2 } from "./denkpausenWortspiele2";
import { RAETSEL_AUFGABEN_2 } from "./denkpausenRaetsel2";
import { WISSEN_AUFGABEN_2 } from "./denkpausenWissen2";

// "Denkpause" (Nutzerinnen-Vorgabe 16.09.): kurze, freiwillige Multiple-
// Choice-Denksportaufgaben als "Anlasser" vor einer Handlung — z. B. statt
// aufs Handy zu scrollen (BildschirmzeitView) oder als kurzer Übergang
// zwischen zwei Tagesplan-Punkten (TagesplanView). Bewusst OHNE Backend/
// Migration: rein clientseitiger, sitzungsweiter Pool-Pick, nichts wird
// gespeichert oder ausgewertet — siehe DenkpauseNudge.jsx für die UI-Regeln
// (nie blockierend, immer überspringbar).
// Je 200 Aufgaben pro Kategorie (Teil 1 + Teil 2, Nutzerinnen-Wunsch 23.09.).
export const DENKPAUSEN_KATEGORIEN = [
  { id: "mathe", label: "Mathe", aufgaben: [...MATHE_AUFGABEN, ...MATHE_AUFGABEN_2] },
  { id: "wortspiele", label: "Wortspiele", aufgaben: [...WORTSPIELE_AUFGABEN, ...WORTSPIELE_AUFGABEN_2] },
  { id: "raetsel", label: "Rätsel", aufgaben: [...RAETSEL_AUFGABEN, ...RAETSEL_AUFGABEN_2] },
  { id: "wissen", label: "Allgemeinwissen", aufgaben: [...WISSEN_AUFGABEN, ...WISSEN_AUFGABEN_2] },
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

// Denksport-Seite (DenksportView.jsx, 23.09.): eine Runde aus `anzahl`
// verschiedenen Aufgaben einer Kategorie (oder "gemischt"), möglichst ohne
// die zuletzt gesehenen zu wiederholen.
let zuletztInRunden = [];

export function denksportRunde(kategorieId, anzahl = 5) {
  const quelle = kategorieId === "gemischt" ? ALLE_AUFGABEN : ALLE_AUFGABEN.filter((a) => a.kategorie === kategorieId);
  const frisch = quelle.filter((a) => !zuletztInRunden.includes(a.frage));
  const pool = frisch.length >= anzahl ? [...frisch] : [...quelle];
  const runde = [];
  while (runde.length < anzahl && pool.length > 0) {
    runde.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  zuletztInRunden = [...runde.map((a) => a.frage), ...zuletztInRunden].slice(0, 150);
  return runde;
}
