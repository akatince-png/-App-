import { programmStand } from "./kernprogramm";
import { plusTage } from "./schichtplan";

// Programme als eigenständige Module (26.09.): Katalog (`programme`) und
// Teilnahmen je Person (`programm_teilnahmen`), siehe Migration 0112.
// Das erste Programm "einstellung" ist das AKA-Kernprogramm; dessen
// Etappen liegen weiter in coaching_etappen.

export const EINSTELLUNG = "einstellung";

export const STATUS_TEXT = {
  wartet: "wartet auf Start",
  laufend: "läuft",
  pausiert: "pausiert",
  abgeschlossen: "abgeschlossen",
  beendet: "beendet",
};

export const zeileZuProgramm = (r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji || "🧭",
  beschreibung: r.beschreibung || "",
  wochen: r.wochen || null,
  reihenfolge: r.reihenfolge || 0,
  aktiv: r.aktiv !== false,
  fuerNeue: !!r.fuer_neue,
});

export const zeileZuTeilnahme = (r) => ({
  id: r.id,
  userId: r.user_id,
  programmId: r.programm_id,
  status: r.status || "wartet",
  start: r.start || null,
  einstellungen: r.einstellungen || {},
  notiz: r.notiz || "",
});

// Stand des Kernprogramms unter Berücksichtigung des Programm-Moduls:
// - Programm für alle ausgeschaltet → nichts anzeigen (`aus`).
// - Teilnahme pausiert/beendet → nichts anzeigen (`pausiert`/`beendet`).
// - Teilnahme wartet und noch keine Etappe → `wartet` (Coach legt Start fest).
// - Sonst wie bisher aus den Etappen. Ohne Teilnahme-Zeile (ältere Daten)
//   gilt ebenfalls das bisherige Verhalten.
// Persönliche Einstellungen (`einstellungen.ausgelassen`) blenden
// einzelne Bausteine für diese Person aus.
export function kernStandMitProgramm(etappen, heute, teilnahme, programm) {
  if (programm && programm.aktiv === false) return { aktiv: false, etappe: null, aus: true };
  if (teilnahme?.status === "pausiert") return { aktiv: false, etappe: null, pausiert: true };
  if (teilnahme?.status === "beendet") return { aktiv: false, etappe: null, beendet: true };
  const stand = programmStand(etappen, heute);
  const ausgelassen = teilnahme?.einstellungen?.ausgelassen || [];
  if (ausgelassen.length) stand.ausgelassen = ausgelassen;
  if (teilnahme?.status === "wartet" && !stand.aktiv && !stand.geplant) return { ...stand, wartet: true };
  return stand;
}

export const tageZwischen = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

// Woche wiederholen (26.09., Nutzerin): Die Wiederholung beginnt am Tag nach
// dem Ende der laufenden Woche – egal, an welchem Wochentag die Person
// gestartet ist. Das Ende der Etappe (und alles danach) rückt sofort um 7
// Tage nach hinten (in der Datenbank); der Beginn der laufenden Etappe erst
// ab dem Wiederholungstag. Diese aufgeschobene Verschiebung steht in
// `einstellungen.verschiebungen` = [{ etappeId, ab, tage, woche }].
export function etappenVerschieben(etappen, verschiebungen, heute) {
  if (!verschiebungen?.length) return etappen || [];
  return (etappen || []).map((e) => {
    const extra = verschiebungen.filter((v) => v.etappeId === e.id && v.ab <= heute).reduce((sum, v) => sum + (v.tage || 0), 0);
    return extra ? { ...e, start: plusTage(e.start, extra) } : e;
  });
}

// Tag, an dem die Wiederholung der laufenden Woche beginnt.
export const wiederholungAb = (stand) => (stand?.aktiv ? plusTage(stand.etappe.start, stand.woche * 7) : null);

// Welche Etappen-Zeilen ändern sich, wenn ab `ab` alles um `tage` Tage
// nach hinten rückt? art "pause": auch der Beginn der laufenden Etappe
// rückt sofort mit; art "wiederholung": nur das Ende (Beginn aufgeschoben).
export function etappenAenderungen(etappen, ab, tage, art) {
  const out = [];
  for (const e of etappen || []) {
    if (e.start >= ab) out.push({ id: e.id, start: plusTage(e.start, tage), ende: plusTage(e.ende, tage) });
    else if (ab <= plusTage(e.ende, 1)) out.push({ id: e.id, start: art === "pause" ? plusTage(e.start, tage) : e.start, ende: plusTage(e.ende, tage) });
  }
  return out;
}

// Wie viele Wochen wurden für diese Person wiederholt?
export const wiederholteWochen = (teilnahme) => (teilnahme?.einstellungen?.verschiebungen || []).length;

// Kurz-Zahlen je Programm für die Coach-Übersicht.
export function teilnahmenZaehlen(teilnahmen, programmId) {
  const z = { wartet: 0, laufend: 0, pausiert: 0, abgeschlossen: 0, beendet: 0 };
  (teilnahmen || []).filter((t) => t.programmId === programmId).forEach((t) => (z[t.status] = (z[t.status] || 0) + 1));
  return z;
}
