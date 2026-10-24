// Langzeit-Projekte mit Work-Sessions (24.10., Nutzerin: „Langzeitprojekte
// planen, aber immer wieder Work-Sessions in die tagesaktuellen To-dos der
// Matrix aufnehmen“). Ein Projekt hat Ziel, Start, Deadline und einen
// Rhythmus (Wochentage, Uhrzeit, Dauer). Die Sessions sind Matrix-Aufgaben
// mit art „projekt“ – so landen sie von selbst in Tagesplan, Tafel, Kalender.
import { addDays, toLocalISODate } from "./dates";

const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const tageZwischen = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 864e5);

export const sessionTitel = (projekt) => `Session: ${projekt.name}`;
export const istSession = (a, projektId) => a.art === "projekt" && a.projektId === projektId;

// Session-Tage im Zeitraum [ab, ab + tage), nicht nach der Deadline, ohne
// Tage, an denen schon eine Session dieses Projekts liegt.
export function sessionTermine(projekt, aufgaben = [], ab = new Date(), tage = 14) {
  if (!projekt?.sessionTage?.length) return [];
  const belegt = new Set(aufgaben.filter((a) => istSession(a, projekt.id) && a.geplantAm).map((a) => a.geplantAm));
  const termine = [];
  for (let i = 0; i < tage; i++) {
    const d = addDays(ab, i);
    const tag = toLocalISODate(d);
    if (projekt.start && tag < projekt.start) continue;
    if (projekt.deadline && tag > projekt.deadline) break;
    if (!projekt.sessionTage.includes(WOCHENTAG[d.getDay()]) || belegt.has(tag)) continue;
    termine.push(tag);
  }
  return termine;
}

// Neue Matrix-Aufgaben für die Termine.
export function sessionAufgaben(projekt, termine) {
  return termine.map((tag) => ({
    titel: sessionTitel(projekt),
    art: "projekt",
    projektId: projekt.id,
    wichtig: true,
    frist: projekt.deadline || null,
    geplantAm: tag,
    uhrzeit: projekt.sessionUhrzeit || null,
    dauerMin: projekt.sessionDauerMin || null,
    erinnerung: projekt.sessionUhrzeit ? "15" : "morgens",
  }));
}

// Stand eines Projekts: erledigte/geplante Sessions, Ziel, Wochen bis zur
// Deadline und ob man im Plan liegt (Anteil Sessions ≥ Anteil Zeit − 15 %).
export function projektStand(projekt, aufgaben = [], heute = new Date()) {
  const sessions = aufgaben.filter((a) => istSession(a, projekt.id));
  const fertig = sessions.filter((a) => a.erledigtAm).length;
  const geplant = sessions.filter((a) => !a.erledigtAm).length;
  const heuteStr = toLocalISODate(heute);
  const ziel = projekt.sessionsZiel || null;
  const restTage = projekt.deadline ? tageZwischen(heuteStr, projekt.deadline) : null;
  let imPlan = true;
  if (ziel && projekt.start && projekt.deadline) {
    const gesamt = Math.max(1, tageZwischen(projekt.start, projekt.deadline));
    const vergangen = Math.min(gesamt, Math.max(0, tageZwischen(projekt.start, heuteStr)));
    imPlan = fertig / ziel >= vergangen / gesamt - 0.15;
  }
  return { fertig, geplant, ziel, restTage, restWochen: restTage == null ? null : Math.max(0, Math.ceil(restTage / 7)), imPlan, anteil: ziel ? Math.min(1, fertig / ziel) : null };
}
