// Aufgaben-Matrix nach Eisenhower (30.09., Nutzerin: „im Workflow-Bereich
// eine Matrix für die vielen Aufgaben eines Projekts, grün/gelb/rot … und
// das soll sich automatisch im Alltag widerspiegeln“). Die Farbe entsteht
// von selbst aus „wichtig?“ und „bis wann?“; wer ein Feld selbst wählt,
// behält es (quadrantManuell) – die App schiebt nie eigenmächtig zurück.
// Bewusst einfache Regeln statt KI: funktioniert ohne KI-Einwilligung.
import { addDays, toLocalISODate } from "./dates";

export const QUADRANTEN = [
  { id: "jetzt", icon: "🔴", titel: "JETZT", text: "wichtig + dringend", farbe: "#E04F3E", bg: "#FDE3DF", schrift: "#B42318" },
  { id: "planen", icon: "🟢", titel: "PLANEN", text: "wichtig, noch Zeit", farbe: "#2E9C6E", bg: "#DDF3E9", schrift: "#1F7A55" },
  { id: "kurz", icon: "🟡", titel: "KURZ HALTEN", text: "eilig, nicht so wichtig", farbe: "#E0A21B", bg: "#FFF1CC", schrift: "#8A5A00" },
  { id: "spaeter", icon: "⚪", titel: "SPÄTER / WEG", text: "weder noch", farbe: "#8A90A6", bg: "#E7E9F0", schrift: "#4A5170" },
];
export const QUADRANT = Object.fromEntries(QUADRANTEN.map((q) => [q.id, q]));

// Dringend = Frist heute, morgen oder übermorgen (oder schon vorbei).
export const DRINGEND_TAGE = 2;

export function istDringend(aufgabe, heute = new Date()) {
  if (!aufgabe?.frist) return false;
  return aufgabe.frist <= toLocalISODate(addDays(heute, DRINGEND_TAGE));
}

// wichtig: true | false | null (null = nicht angegeben → gilt als wichtig,
// damit neue Aufgaben nicht aus Versehen im grauen Feld verschwinden).
export function quadrantVon(aufgabe, heute = new Date()) {
  if (aufgabe?.quadrantManuell && QUADRANT[aufgabe.quadrantManuell]) return aufgabe.quadrantManuell;
  const wichtig = aufgabe?.wichtig !== false;
  const dringend = istDringend(aufgabe, heute);
  if (wichtig) return dringend ? "jetzt" : "planen";
  return dringend ? "kurz" : "spaeter";
}

// „Warum steht das hier?“ in einem Satz.
export function warum(aufgabe, heute = new Date()) {
  if (aufgabe?.quadrantManuell) return "Von dir selbst hierher gelegt.";
  const teile = [aufgabe?.wichtig === false ? "nicht so wichtig" : "wichtig"];
  teile.push(istDringend(aufgabe, heute) ? `dringend (Frist ${fristText(aufgabe.frist, heute)})` : aufgabe?.frist ? `noch Zeit (Frist ${fristText(aufgabe.frist, heute)})` : "ohne Frist");
  return teile.join(", ") + ".";
}

export function fristText(frist, heute = new Date()) {
  if (!frist) return "";
  const h = toLocalISODate(heute);
  if (frist < h) return "überfällig";
  if (frist === h) return "heute";
  if (frist === toLocalISODate(addDays(heute, 1))) return "morgen";
  const [j, m, t] = frist.split("-");
  return `${Number(t)}.${Number(m)}.${j === String(heute.getFullYear()) ? "" : j}`;
}

// Offene Aufgaben je Feld, innerhalb eines Felds: früheste Frist zuerst,
// dann kürzeste Dauer (kleine Schritte zuerst sichtbar).
export function nachQuadrant(aufgaben = [], heute = new Date()) {
  const aus = Object.fromEntries(QUADRANTEN.map((q) => [q.id, []]));
  for (const a of aufgaben) if (!a.erledigtAm) aus[quadrantVon(a, heute)].push(a);
  const sort = (x, y) => (x.frist || "9999").localeCompare(y.frist || "9999") || (x.dauerMin || 999) - (y.dauerMin || 999);
  Object.values(aus).forEach((l) => l.sort(sort));
  return aus;
}

// Was erscheint im Alltag (Tagesplan)? Nur Rot und das an diesem Tag
// eingeplante Grün – Gelb und Grau bleiben in der Matrix.
// Was ist es? (07.10., Nutzerin: „beim Anlegen ein kleines Fenster: Termin,
// Projekt, Aufgabe …“). Termine haben Datum und Uhrzeit.
export const ARTEN = [
  { id: "aufgabe", icon: "📝", label: "Aufgabe" },
  { id: "termin", icon: "📅", label: "Termin" },
  { id: "anruf", icon: "📞", label: "Anruf" },
  { id: "erledigung", icon: "🛒", label: "Erledigung" },
  { id: "projekt", icon: "🗂️", label: "Projekt-Schritt" },
  { id: "idee", icon: "💡", label: "Idee" },
];
export const ART = Object.fromEntries(ARTEN.map((a) => [a.id, a]));

export function alltagAusMatrix(aufgaben = [], datum = new Date()) {
  const tag = toLocalISODate(datum);
  return aufgaben
    .filter((a) => !a.erledigtAm || toLocalISODate(new Date(a.erledigtAm)) === tag)
    .map((a) => ({ ...a, quadrant: quadrantVon(a, datum) }))
    // Alles, was für heute eingeplant ist (auch Termine), plus Rot.
    .filter((a) => a.quadrant === "jetzt" || a.geplantAm === tag)
    .sort((x, y) => {
      // Mit Uhrzeit zuerst, nach Uhrzeit (07.10.); danach wie bisher.
      if ((x.uhrzeit || "") !== (y.uhrzeit || "")) return (x.uhrzeit || "99").localeCompare(y.uhrzeit || "99");
      return x.quadrant === y.quadrant ? (x.frist || "9999").localeCompare(y.frist || "9999") : x.quadrant === "jetzt" ? -1 : 1;
    });
}

// Zu viele rote Aufgaben gleichzeitig (Überlastung, Punkt 34 im Konzept).
export const JETZT_GRENZE = 3;

// Verschieben: +1 Tag einplanen und mitzählen; ab 3× fragt die App
// freundlich nach (kleiner machen, neu planen, streichen).
export const VERSCHOBEN_HINWEIS = 3;
