import { programmStand } from "./kernprogramm";

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
export function kernStandMitProgramm(etappen, heute, teilnahme, programm) {
  if (programm && programm.aktiv === false) return { aktiv: false, etappe: null, aus: true };
  if (teilnahme?.status === "pausiert") return { aktiv: false, etappe: null, pausiert: true };
  if (teilnahme?.status === "beendet") return { aktiv: false, etappe: null, beendet: true };
  const stand = programmStand(etappen, heute);
  if (teilnahme?.status === "wartet" && !stand.aktiv && !stand.geplant) return { ...stand, wartet: true };
  return stand;
}

// Kurz-Zahlen je Programm für die Coach-Übersicht.
export function teilnahmenZaehlen(teilnahmen, programmId) {
  const z = { wartet: 0, laufend: 0, pausiert: 0, abgeschlossen: 0, beendet: 0 };
  (teilnahmen || []).filter((t) => t.programmId === programmId).forEach((t) => (z[t.status] = (z[t.status] || 0) + 1));
  return z;
}
