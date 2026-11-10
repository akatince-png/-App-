import { toLocalISODate } from "./dates";
import { alltagAmTag, minuten } from "./kalender";

// Kurze Termin-Erinnerung nach der Morgen- und der Abendroutine (10.11.2026,
// Nutzer: „nach der Morgenroutine als auch nach der Abendroutine immer an die
// Termine am Folgetag einmal kurz erinnern … hey, denk dran, morgen 19 Uhr
// das und das“). Reine Logik, angezeigt von `ui/TermineMorgenHinweis.jsx`.
//
// Was zählt als Termin?
// - Kalender „Mein Alltag“: alle einmaligen Einträge (datum gesetzt) – das
//   sind echte Termine, Fristen, Dienste. Wöchentlich wiederkehrende nur aus
//   dem Bereich „Termin“; Gewohnheits-artige Wochenpunkte (z. B. Dosetten
//   stellen) würden die Erinnerung sonst jeden Tag zumüllen.
// - Matrix-Aufgaben der Art „Termin“ mit Tag + Uhrzeit.
// - Einträge mit `erinnerung: false` bleiben draußen (z. B. rückwirkend
//   eingetragene Dokumentation).

const plusTage = (date, n) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

export function termineAmTag(date, { alltagEintraege = [], matrixAufgaben = [] } = {}) {
  const tag = toLocalISODate(date);
  const liste = [];
  for (const e of alltagEintraege) {
    if (e.erinnerung === false) continue;
    if (!e.datum && e.bereich !== "termin") continue;
    if (!alltagAmTag(e, date)) continue;
    liste.push({ key: `a-${e.id}`, zeit: e.start || "", ende: e.ende || "", titel: e.titel, wichtig: /❗|wichtig|frist/i.test(`${e.titel} ${e.notiz || ""}`) });
  }
  for (const a of matrixAufgaben) {
    if (a.art !== "termin" || a.geplantAm !== tag || a.erledigtAm) continue;
    liste.push({ key: `m-${a.id}`, zeit: a.uhrzeit || "", ende: "", titel: a.titel, wichtig: false });
  }
  return liste.sort((x, y) => (minuten(x.zeit) ?? 9999) - (minuten(y.zeit) ?? 9999));
}

// Welche Routine wurde gerade abgeschlossen und braucht noch einen Hinweis?
// Nur Durchläufe von heute, die vor höchstens `fensterMin` Minuten fertig
// wurden – so taucht der Hinweis nicht Stunden später beim App-Öffnen auf.
export function offenerRoutineHinweis(durchlaeufe = [], { jetzt = new Date(), gezeigt = new Set(), fensterMin = 90 } = {}) {
  const heute = toLocalISODate(jetzt);
  for (const d of durchlaeufe) {
    if (d.datum !== heute || !d.abgeschlossenUm) continue;
    if (d.routine !== "morgen" && d.routine !== "abend") continue;
    const schluessel = `${heute}|${d.routine}`;
    if (gezeigt.has(schluessel)) continue;
    const vor = (jetzt.getTime() - new Date(d.abgeschlossenUm).getTime()) / 60000;
    if (vor < 0 || vor > fensterMin) continue;
    return { routine: d.routine, schluessel };
  }
  return null;
}

// Inhalt der Karte. Nach der Abendroutine: nur morgen. Nach der Morgen-
// routine: ebenfalls morgen (so gewünscht), dazu die restlichen Termine von
// heute, weil die am Morgen sonst untergehen würden.
export function hinweisInhalt(routine, daten, jetzt = new Date()) {
  const morgen = termineAmTag(plusTage(jetzt, 1), daten);
  let heute = [];
  if (routine === "morgen") {
    const nunMin = jetzt.getHours() * 60 + jetzt.getMinutes();
    heute = termineAmTag(jetzt, daten).filter((t) => (minuten(t.zeit) ?? 0) >= nunMin);
  }
  return { morgen, heute };
}

// Ein-Satz-Fassung, z. B. für Vorlesen oder eine Push-Nachricht.
export function hinweisSatz(liste) {
  if (!liste.length) return "Morgen stehen keine Termine an.";
  return `Denk dran, morgen: ${liste.map((t) => `${t.zeit ? `${t.zeit.replace(/^0/, "")} Uhr ` : ""}${t.titel}`).join(", ")}.`;
}
