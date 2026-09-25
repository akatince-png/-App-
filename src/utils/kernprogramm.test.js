import { describe, expect, it } from "vitest";
import { faelligeBausteine, kernBilanz, naechsteEtappeVorschlag, programmStand, schwaechsterBaustein, wackelnZweiWochen, wochenCheckWoche } from "./kernprogramm";
import { naechstesMalHinweis, sollWiederholungen } from "./trainingSaetze";

const e1 = { id: "e1", nummer: 1, art: "einfuehrung", start: "2026-09-28", ende: "2026-10-25", status: "laufend" };
const e2 = { id: "e2", nummer: 2, art: "erhaltung", start: "2026-10-26", ende: "2026-11-22", status: "laufend" };

describe("programmStand", () => {
  it("vor dem Start: noch nicht aktiv, aber geplant", () => {
    const s = programmStand([e1], "2026-09-25");
    expect(s.aktiv).toBe(false);
    expect(s.geplant.nummer).toBe(1);
    expect(faelligeBausteine(s)).toEqual([]);
  });
  it("Einführung: Bausteine kommen wochenweise dazu", () => {
    expect(faelligeBausteine(programmStand([e1], "2026-09-28")).map((b) => b.key)).toEqual(["wasser", "licht", "atem_morgen", "tagebuch", "schlafenszeit"]);
    const w2 = programmStand([e1], "2026-10-05");
    expect(w2).toMatchObject({ woche: 2, einfuehrungWoche: 2, erhaltung: false });
    expect(faelligeBausteine(w2).map((b) => b.key)).toContain("sport");
    expect(faelligeBausteine(programmStand([e1], "2026-10-19")).length).toBe(14);
  });
  it("Gespräch fällig am Ende, Erhaltung danach", () => {
    expect(programmStand([e1], "2026-10-24").gespraechFaellig).toBe(true);
    expect(programmStand([e1, e2], "2026-10-24").gespraechFaellig).toBe(false);
    const s = programmStand([e1, e2], "2026-11-02");
    expect(s).toMatchObject({ woche: 2, gesamtWoche: 6, erhaltung: true, einfuehrungWoche: 4 });
  });
});

describe("kernBilanz", () => {
  it("zählt je Baustein erledigte Tage, heute nur wenn schon erledigt", () => {
    const schritte = [{ id: "s1", kernKey: "wasser", routine: "morgen" }];
    const schrittErledigt = { "2026-09-28__s1": true, "2026-09-30__s1": true };
    const b = kernBilanz({ etappen: [e1], schritte, schrittErledigt, durchlaeufe: [{ routine: "morgen", datum: "2026-10-01" }] }, "2026-09-28", "2026-10-02", "2026-10-02");
    expect(b.find((x) => x.key === "wasser")).toMatchObject({ erledigt: 3, von: 4 });
  });
  it("pausierte Tage zählen nicht", () => {
    const b = kernBilanz({ etappen: [e1], pausen: [{ kernKey: "licht", von: "2026-09-28", bis: "2026-10-30", begruendung: "x" }] }, "2026-09-28", "2026-10-02", "2026-10-02");
    expect(b.find((x) => x.key === "licht")).toMatchObject({ von: 0 });
  });
  it("Sport: Ziel aus dem Wochenplan, mindestens 2", () => {
    const b = kernBilanz({ etappen: [e1], trainings: [{ datum: "2026-10-06", erledigt: true }], trainingWochenplan: [1, 2, 3] }, "2026-10-05", "2026-10-11", "2026-10-12");
    expect(b.find((x) => x.key === "sport")).toMatchObject({ erledigt: 1, von: 3 });
  });
});

describe("Wackeln + Wochen-Check", () => {
  it("schwächster Baustein und zwei Wochen hintereinander", () => {
    const jetzt = [
      { key: "a", erledigt: 2, von: 7 },
      { key: "b", erledigt: 6, von: 7 },
    ];
    expect(schwaechsterBaustein(jetzt).key).toBe("a");
    expect(wackelnZweiWochen(jetzt, [{ key: "a", erledigt: 3, von: 7 }]).map((x) => x.key)).toEqual(["a"]);
    expect(wackelnZweiWochen(jetzt, [{ key: "a", erledigt: 6, von: 7 }])).toEqual([]);
  });
  it("Check nur in der Erhaltung, sonntags bzw. Mo/Di nachholbar", () => {
    const stand = programmStand([e1, e2], "2026-11-01");
    expect(wochenCheckWoche(stand, "2026-11-01", [])).toBe("2026-10-26");
    expect(wochenCheckWoche(programmStand([e1, e2], "2026-11-02"), "2026-11-02", [])).toBe("2026-10-26");
    expect(wochenCheckWoche(stand, "2026-11-01", [{ wocheStart: "2026-10-26" }])).toBe(null);
    expect(wochenCheckWoche(programmStand([e1], "2026-10-04"), "2026-10-04", [])).toBe(null);
  });
  it("nächste Etappe schließt direkt an", () => {
    expect(naechsteEtappeVorschlag([e1], "2026-10-24")).toMatchObject({ nummer: 2, art: "erhaltung", start: "2026-10-26", ende: "2026-11-22" });
    expect(naechsteEtappeVorschlag([], "2026-09-25")).toMatchObject({ nummer: 1, art: "einfuehrung", start: "2026-09-28" });
  });
});

describe("Satz-Ergebnisse", () => {
  it("liest Soll und gibt einen Hinweis", () => {
    expect(sollWiederholungen("8-12")).toBe(12);
    expect(sollWiederholungen("")).toBe(null);
    expect(naechstesMalHinweis([{ wdh: 10 }, { wdh: 10 }], "10")).toMatch(/etwas mehr/);
    expect(naechstesMalHinweis([{ wdh: 10 }, { wdh: 8 }], "10")).toMatch(/18 von 20/);
  });
});

describe("Kernprogramm: Eiweißziel ab Woche 3", () => {
  it("zählt Tage mit mind. 90 % des Eiweißziels", () => {
    const ernaehrungAm = (t) => ({ mahlzeiten: 3, eiweiss: t === "2026-10-13" ? 140 : 100 });
    const b = kernBilanz({ etappen: [e1], ernaehrungAm, eiweissZiel: 148 }, "2026-10-12", "2026-10-14", "2026-10-15");
    expect(b.find((x) => x.key === "makros")).toMatchObject({ erledigt: 1, von: 3 });
    expect(b.find((x) => x.key === "mahlzeiten")).toMatchObject({ erledigt: 3, von: 3 });
  });
});
