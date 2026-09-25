import { describe, expect, it } from "vitest";
import { autoWerte, autoZeilen, tagebuchMuster } from "./tagebuch";

describe("autoWerte", () => {
  it("sammelt die Tageswerte aus den App-Daten", () => {
    const a = autoWerte("2026-09-25", {
      schlafEintraege: [{ datum: "2026-09-25", stunden: 7.5 }],
      tageslichtEintraege: [{ datum: "2026-09-25", minuten: 55 }],
      hydrationEintraege: [{ datum: "2026-09-25", mengeMl: 1200 }, { datum: "2026-09-25", mengeMl: 700 }, { datum: "2026-09-24", mengeMl: 500 }],
      trainingNachDatum: new Map([["2026-09-25", [{ erledigt: true }]]]),
      mahlzeitErledigt: { "2026-09-25__m1__Morgens": true, "2026-09-25__m2__Mittags": false, "2026-09-24__m1__Morgens": true },
      hormonErledigt: { "2026-09-25__Elvanse__08:00": true },
      atemuebungLogs: [{ erstelltAm: new Date(2026, 8, 25, 12).toISOString() }],
      bildschirmzeitEintraege: [{ datum: "2026-09-25", minuten: 130 }],
    });
    expect(a).toEqual({ schlafStunden: 7.5, draussenMin: 55, wasserMl: 1900, bildschirmMin: 130, training: true, mahlzeiten: 1, medikament: true, atem: 1 });
    expect(autoZeilen(a)).toContain("📱 Bildschirm 2:10 h");
  });
});

describe("tagebuchMuster", () => {
  const tag = (i, stimmung, draussen, extra = {}) => ({ datum: `2026-09-${String(i).padStart(2, "0")}`, stimmung, orte: [], personen: [], essen: [], tagesart: [], koerper: [], auto: { draussenMin: draussen }, ...extra });
  it("zu wenige Einträge = noch nicht bereit", () => {
    expect(tagebuchMuster([tag(1, 4, 40)]).bereit).toBe(false);
  });
  it("findet deutliche Unterschiede zwischen guten und schweren Tagen", () => {
    const eintraege = [
      ...[1, 2, 3, 4, 5, 6].map((i) => tag(i, 4, 50, { essen: ["ausgewogen"] })),
      ...[7, 8, 9, 10].map((i) => tag(i, 2, 10, { essen: ["viel Zucker"] })),
      ...[11, 12, 13, 14].map((i) => tag(i, 3, 20)),
    ];
    const m = tagebuchMuster(eintraege);
    expect(m).toMatchObject({ bereit: true, gut: 6, schwer: 4 });
    const draussen = m.muster.find((x) => x.key === "draussen30");
    expect(draussen).toMatchObject({ gut: 6, gutVon: 6, schwer: 0, schwerVon: 4, richtung: "gut" });
    expect(m.muster.find((x) => x.key === "essen:viel Zucker")).toMatchObject({ richtung: "schwer", schwer: 4 });
  });
});
