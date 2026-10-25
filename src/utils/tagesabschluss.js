// Tagesabschluss am Abend (25.10., Nutzerin): erst „Was hast du heute
// geschafft?“ – Liegengebliebenes auf morgen schieben oder in den Pool
// legen –, danach erst „Was planst du für morgen?“ (⭐ MITs, höchstens 3)
// und auf Wunsch 1–2 freiwillige Aufgaben, die nie MIT sind.
// Projekte stehen nur einmal zur Wahl, nicht jede einzelne Session.
import { addDays, toLocalISODate } from "./dates";
import { QUADRANTEN, quadrantVon } from "./matrix";
import { istSession, sessionAufgaben } from "./projekt";

export const FREIWILLIG_GRENZE = 2;

// Nach Mitternacht (bis 4 Uhr) gehört der Abschluss noch zum Vortag.
export function abschlussTag(jetzt = new Date()) {
  return jetzt.getHours() < 4 ? addDays(jetzt, -1) : jetzt;
}
const RANG = Object.fromEntries(QUADRANTEN.map((q, i) => [q.id, i]));

const iso = (d) => (typeof d === "string" ? d : toLocalISODate(d));

// Was war heute dran und ist noch offen? Eingeplant, ⭐ oder Frist heute –
// auch Liegengebliebenes von früheren Tagen.
export function heuteFaellig(aufgaben = [], heute = new Date()) {
  const tag = iso(heute);
  return aufgaben
    .filter((a) => !a.erledigtAm && ((a.geplantAm && a.geplantAm <= tag) || (a.mitAm && a.mitAm <= tag) || a.frist === tag))
    .sort((x, y) => (x.uhrzeit || "99").localeCompare(y.uhrzeit || "99"));
}

// Heute schon abgehakt (zum Anzeigen mit ✓).
export function heuteGeschafft(aufgaben = [], heute = new Date()) {
  const tag = iso(heute);
  return aufgaben.filter((a) => a.erledigtAm && toLocalISODate(new Date(a.erledigtAm)) === tag);
}

export const alsGeschafft = (a, jetzt = new Date()) => ({ ...a, erledigtAm: jetzt.toISOString() });
export const aufMorgen = (a, heute = new Date()) => ({ ...a, geplantAm: toLocalISODate(addDays(heute, 1)), mitAm: null, verschoben: (a.verschoben || 0) + 1 });
export const inDenPool = (a) => ({ ...a, geplantAm: null, uhrzeit: null, mitAm: null, verschoben: (a.verschoben || 0) + 1 });

const projektAktiv = (p, tag) => (p.sessionTage || []).length > 0 && (!p.deadline || p.deadline >= tag) && (!p.start || p.start <= tag);

// Zur Wahl für einen Tag: offene Aufgaben nach Priorität; Sessions eines
// Projekts zusammengefasst zu einem Eintrag (bevorzugt die Session genau an
// diesem Tag); laufende Projekte auch ohne offene Session.
export function kandidatenFuer(aufgaben = [], projekte = [], datum = new Date()) {
  const tag = iso(datum);
  const offen = aufgaben.filter((a) => !a.erledigtAm);
  const liste = offen
    .filter((a) => a.art !== "projekt" || !a.projektId)
    .map((a) => ({ key: a.id, titel: a.titel, aufgabe: a, quadrant: quadrantVon(a, datum) }));
  const nachProjekt = new Map();
  for (const a of offen.filter((x) => x.art === "projekt" && x.projektId)) {
    const bisher = nachProjekt.get(a.projektId);
    if (!bisher || a.geplantAm === tag || (bisher.geplantAm !== tag && (a.geplantAm || "9") < (bisher.geplantAm || "9"))) nachProjekt.set(a.projektId, a);
  }
  const projektIds = new Set([...nachProjekt.keys(), ...projekte.filter((p) => projektAktiv(p, tag)).map((p) => p.id)]);
  for (const id of projektIds) {
    const projekt = projekte.find((p) => p.id === id) || null;
    const session = nachProjekt.get(id) || null;
    const name = projekt?.name || session?.titel?.replace(/^Session:\s*/, "") || "Projekt";
    const amTag = session && session.geplantAm === tag ? session : null;
    liste.push({ key: `projekt-${id}`, titel: `Session: ${name}`, projekt, projektId: id, aufgabe: amTag, quadrant: session ? quadrantVon(session, datum) : "planen" });
  }
  return liste.sort((x, y) => RANG[x.quadrant] - RANG[y.quadrant] || (x.aufgabe?.frist || "9999").localeCompare(y.aufgabe?.frist || "9999") || x.titel.localeCompare(y.titel));
}

// Die Matrix-Aufgabe, die für einen Kandidaten an diesem Tag gespeichert wird:
// bestehende Aufgabe, die Projekt-Session des Tages oder eine neue Session.
export function aufgabeFuerTag(kandidat, datum = new Date()) {
  const tag = iso(datum);
  if (kandidat.aufgabe) return kandidat.aufgabe;
  if (kandidat.projekt) return sessionAufgaben(kandidat.projekt, [tag])[0];
  return { titel: kandidat.titel, art: "projekt", projektId: kandidat.projektId, wichtig: true, geplantAm: tag };
}

// Ist ein Kandidat an diesem Tag als ⭐ bzw. freiwillig gewählt?
export function stand(kandidat, aufgaben = [], datum = new Date()) {
  const tag = iso(datum);
  const passend = kandidat.projektId
    ? aufgaben.filter((a) => istSession(a, kandidat.projektId) && !a.erledigtAm && (a.mitAm === tag || a.geplantAm === tag))
    : aufgaben.filter((a) => a.id === kandidat.key && !a.erledigtAm);
  if (passend.some((a) => a.mitAm === tag)) return "mit";
  if (passend.some((a) => a.geplantAm === tag)) return "geplant";
  return null;
}
