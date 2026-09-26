import { describe, it, expect } from "vitest";
import { kernStandMitProgramm, teilnahmenZaehlen, zeileZuTeilnahme } from "./programme";

const HEUTE = "2026-10-05";
const ETAPPE = [{ id: "e1", nummer: 1, art: "einfuehrung", start: "2026-09-28", ende: "2026-10-25", status: "laufend" }];

describe("kernStandMitProgramm", () => {
  it("läuft wie bisher, wenn die Teilnahme läuft", () => {
    const s = kernStandMitProgramm(ETAPPE, HEUTE, { status: "laufend" }, { aktiv: true });
    expect(s.aktiv).toBe(true);
    expect(s.woche).toBe(2);
  });
  it("zeigt nichts, wenn das Programm für alle ausgeschaltet ist", () => {
    expect(kernStandMitProgramm(ETAPPE, HEUTE, { status: "laufend" }, { aktiv: false })).toMatchObject({ aktiv: false, aus: true });
  });
  it("zeigt nichts bei Pause oder Ende", () => {
    expect(kernStandMitProgramm(ETAPPE, HEUTE, { status: "pausiert" }, { aktiv: true })).toMatchObject({ aktiv: false, pausiert: true });
    expect(kernStandMitProgramm(ETAPPE, HEUTE, { status: "beendet" }, { aktiv: true })).toMatchObject({ aktiv: false, beendet: true });
  });
  it("wartet auf den Start, solange keine Etappe da ist", () => {
    expect(kernStandMitProgramm([], HEUTE, { status: "wartet" }, { aktiv: true })).toMatchObject({ aktiv: false, wartet: true });
  });
  it("ohne Teilnahme-Zeile gilt das bisherige Verhalten", () => {
    expect(kernStandMitProgramm(ETAPPE, HEUTE, null, null).aktiv).toBe(true);
    expect(kernStandMitProgramm([], HEUTE, null, null).wartet).toBeUndefined();
  });
});

describe("teilnahmenZaehlen", () => {
  it("zählt je Status nur das gewählte Programm", () => {
    const t = [
      { user_id: "a", programm_id: "einstellung", status: "wartet" },
      { user_id: "b", programm_id: "einstellung", status: "laufend" },
      { user_id: "c", programm_id: "einstellung", status: "laufend" },
      { user_id: "d", programm_id: "training", status: "laufend" },
    ].map(zeileZuTeilnahme);
    expect(teilnahmenZaehlen(t, "einstellung")).toMatchObject({ wartet: 1, laufend: 2 });
  });
});
