import { describe, expect, it } from "vitest";
import { alltagAmTag, bloeckeFuerTag, monatsRaster, spaltenVerteilen } from "./kalender";

const mo = new Date(2026, 8, 28); // Montag

describe("Kalender Mein Alltag", () => {
  it("Alltags-Einträge gelten wöchentlich oder einmalig", () => {
    expect(alltagAmTag({ wochentage: ["Mo", "Mi"] }, mo)).toBe(true);
    expect(alltagAmTag({ wochentage: ["Sa"] }, mo)).toBe(false);
    expect(alltagAmTag({ datum: "2026-09-28" }, mo)).toBe(true);
  });

  it("Tag: Routinen, Tagesplan und Alltag als Blöcke, sortiert", () => {
    const b = bloeckeFuerTag(mo, {
      routineEinstellungen: { morgen: { startZeit: "06:30", endZeit: "07:30" }, abend: { startZeit: "21:30", endZeit: "22:30" } },
      items: [{ key: "m1", kategorie: "mahlzeit", uhrzeit: "12:30", name: "Mittagessen" }],
      alltagEintraege: [{ id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:00", ende: "16:30", wochentage: ["Mo"] }],
    });
    expect(b.map((x) => [x.titel, x.start, x.ende])).toEqual([
      ["Morgenroutine", 390, 450],
      ["Arbeit", 480, 990],
      ["Mittagessen", 750, 780],
      ["Abendroutine", 1290, 1350],
    ]);
  });

  it("Überlappungen nebeneinander", () => {
    const s = spaltenVerteilen([
      { key: "a", start: 480, ende: 990 },
      { key: "b", start: 750, ende: 780 },
      { key: "c", start: 1000, ende: 1060 },
    ]);
    expect(s.map((x) => [x.key, x.spalte, x.spalten])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ]);
  });

  it("Monatsraster beginnt am Montag", () => {
    const r = monatsRaster(2026, 8); // September 2026, 1. = Dienstag
    expect(r[0][0]).toBeNull();
    expect(r[0][1].getDate()).toBe(1);
    expect(r.every((w) => w.length === 7)).toBe(true);
  });
});

describe("Aka-Antwort für den Kalender prüfen", () => {
  it("übernimmt gültige Einträge, ergänzt Endzeit, verwirft Unvollständiges", async () => {
    const { alltagEintraegeBereinigen } = await import("./kalender");
    const r = alltagEintraegeBereinigen([
      { bereich: "haushalt", titel: "Staubsaugen", start: "10:00", wochentage: ["Sa"] },
      { bereich: "quatsch", titel: "Zahnarzt", start: "15:00", ende: "16:00", datum: "2026-10-30", wochentage: ["Mo"] },
      { bereich: "hobby", titel: "", start: "18:00", wochentage: ["Di"] },
      { bereich: "hobby", titel: "Gitarre", start: "18 Uhr", wochentage: ["Di"] },
    ]);
    expect(r).toEqual([
      { bereich: "haushalt", titel: "Staubsaugen", start: "10:00", ende: "11:00", wochentage: ["Sa"], datum: null, erinnerung: true },
      { bereich: "termin", titel: "Zahnarzt", start: "15:00", ende: "16:00", wochentage: [], datum: "2026-10-30", erinnerung: true },
    ]);
  });
});

describe("Mein Alltag im Gehirn", () => {
  it("abgehakte Einträge laden Fokus & Planung bzw. Ruhe & Gefühl, 1 Punkt je Tag", async () => {
    const { berechneErrungenschaften } = await import("./errungenschaften");
    const { berechneGehirnZeitraum } = await import("./gehirn");
    const quellen = {
      alltagEintraege: [
        { id: "a1", bereich: "haushalt", bereichId: null },
        { id: "a2", bereich: "metime", bereichId: null },
        { id: "a3", bereich: "eigen", bereichId: "b1" },
      ],
      alltagErledigt: { "a1|2026-10-27": true, "a3|2026-10-28": true, "a2|2026-10-28": true, "a2|2026-10-26": false },
    };
    const e = berechneErrungenschaften(quellen);
    const plan = e.kategorien.find((k) => k.key === "alltagPlanung");
    const ausgleich = e.kategorien.find((k) => k.key === "alltagAusgleich");
    expect(plan.tageListe.sort()).toEqual(["2026-10-27", "2026-10-28"]);
    expect(ausgleich.tageListe).toEqual(["2026-10-28"]);
    // 1 Punkt je Tag mit irgendeinem abgehakten Eintrag: 27. und 28. = 2.
    expect(plan.punkte + ausgleich.punkte).toBe(2);
    const g = berechneGehirnZeitraum({ widgets: [], kategorien: e.kategorien, tage: 7, heute: new Date(2026, 9, 28) });
    expect(g.regionen.find((r) => r.key === "fokus").ladung).toBeGreaterThan(0);
    expect(g.regionen.find((r) => r.key === "ruhe").ladung).toBeGreaterThan(0);
  });
});

describe("Überschneidungen", () => {
  it("Wäsche in der Arbeitszeit wird erkannt, Supplement und kurzer Spaziergang nicht", async () => {
    const { konflikte, konflikteFuerEintrag, bloeckeFuerTag } = await import("./kalender");
    const bl = [
      { key: "arbeit", start: 510, ende: 990, art: "arbeit", titel: "Arbeit" },
      { key: "waesche", start: 570, ende: 600, art: "gewohnheit", titel: "Wäsche" },
      { key: "spazier", start: 750, ende: 760, art: "gewohnheit", titel: "Spaziergang" },
      { key: "d3", start: 480, ende: 490, art: "supplement", titel: "D3" },
    ];
    const k = konflikte(bl);
    expect(k.get("waesche").map((x) => x.titel)).toEqual(["Arbeit"]);
    expect(k.has("spazier")).toBe(false);
    expect(k.has("d3")).toBe(false);

    const eintraege = [{ id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:30", ende: "16:30", wochentage: ["Mo", "Di"] }];
    const fuer = (d) => bloeckeFuerTag(d, { alltagEintraege: eintraege });
    const mo = new Date(2026, 8, 28);
    expect(konflikteFuerEintrag({ bereich: "haushalt", titel: "Wäsche", start: "09:30", ende: "10:00", wochentage: ["Di"] }, fuer, mo).map((t) => [t.titel, t.tag])).toEqual([["Arbeit", "Di"]]);
    expect(konflikteFuerEintrag({ bereich: "haushalt", titel: "Wäsche", start: "18:00", ende: "18:30", wochentage: ["Di"] }, fuer, mo)).toEqual([]);
    expect(konflikteFuerEintrag({ id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:30", ende: "16:30", wochentage: ["Mo"] }, fuer, mo)).toEqual([]);
  });
});
