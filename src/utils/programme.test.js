import { describe, it, expect } from "vitest";
import { etappenAenderungen, etappenVerschieben, kernStandMitProgramm, teilnahmenZaehlen, wiederholungAb, zeileZuTeilnahme } from "./programme";
import { faelligeBausteine } from "./kernprogramm";

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

describe("Woche wiederholen + Pause", () => {
  // Start Mo 28.09., Etappe 1 bis 25.10.
  const E = [
    { id: "e1", nummer: 1, art: "einfuehrung", start: "2026-09-28", ende: "2026-10-25", status: "laufend" },
    { id: "e2", nummer: 2, art: "erhaltung", start: "2026-10-26", ende: "2026-11-22", status: "laufend" },
  ];
  it("Wiederholung beginnt am Tag nach dem Ende der laufenden Woche", () => {
    const stand = kernStandMitProgramm(E, "2026-10-07", null, null); // Mi, Woche 2
    expect(wiederholungAb(stand)).toBe("2026-10-12");
  });
  it("auch bei Start mitten in der Woche (Do)", () => {
    const e = [{ id: "x", nummer: 1, art: "einfuehrung", start: "2026-10-01", ende: "2026-10-28", status: "laufend" }];
    expect(wiederholungAb(kernStandMitProgramm(e, "2026-10-03", null, null))).toBe("2026-10-08");
  });
  it("Datenbank: Ende und spätere Etappen rücken sofort, Beginn erst ab dem Wiederholungstag", () => {
    const a = etappenAenderungen(E, "2026-10-12", 7, "wiederholung");
    expect(a).toEqual([
      { id: "e1", start: "2026-09-28", ende: "2026-11-01" },
      { id: "e2", start: "2026-11-02", ende: "2026-11-29" },
    ]);
    const nachDb = E.map((e) => ({ ...e, ...a.find((x) => x.id === e.id) }));
    const v = [{ etappeId: "e1", ab: "2026-10-12", tage: 7, woche: 2 }];
    // vor dem Wiederholungstag: noch Woche 2 (letzter Tag)
    expect(kernStandMitProgramm(etappenVerschieben(nachDb, v, "2026-10-11"), "2026-10-11", null, null).woche).toBe(2);
    // ab dem Wiederholungstag: wieder Woche 2, danach Woche 3
    expect(kernStandMitProgramm(etappenVerschieben(nachDb, v, "2026-10-12"), "2026-10-12", null, null).woche).toBe(2);
    expect(kernStandMitProgramm(etappenVerschieben(nachDb, v, "2026-10-19"), "2026-10-19", null, null).woche).toBe(3);
  });
  it("Pause: nach dem Fortsetzen geht es in derselben Woche weiter", () => {
    // Pause ab 05.10. (Woche 2 beginnt), fortgesetzt am 12.10.
    const a = etappenAenderungen(E, "2026-10-12", 7, "pause");
    const nachDb = E.map((e) => ({ ...e, ...a.find((x) => x.id === e.id) }));
    expect(nachDb[0]).toMatchObject({ start: "2026-10-05", ende: "2026-11-01" });
    expect(kernStandMitProgramm(nachDb, "2026-10-12", null, null).woche).toBe(2);
  });
  it("ausgelassene Bausteine fehlen in den fälligen Bausteinen", () => {
    const stand = kernStandMitProgramm(E, "2026-10-07", { status: "laufend", einstellungen: { ausgelassen: ["licht"] } }, null);
    expect(faelligeBausteine(stand).map((b) => b.key)).not.toContain("licht");
    expect(faelligeBausteine(stand).map((b) => b.key)).toContain("wasser");
  });
});
