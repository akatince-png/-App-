import { describe, it, expect } from "vitest";
import {
  describeInterval,
  activeDoseDays,
  faelltAnTag,
  coerceDoseFeldWert,
  spaltenTeilmenge,
  buildDosePlan,
} from "./schedule";
import { toLocalISODate } from "./dates";

describe("describeInterval", () => {
  it("liefert '?' ohne Eingabe", () => {
    expect(describeInterval(null)).toBe("?");
  });
  it("beschreibt ein festes Intervall über intervallDays", () => {
    expect(describeInterval({ intervallDays: 2 })).toBe("Jeden 2. Tag");
    expect(describeInterval({ intervallDays: 2 }, "en")).toBe("Every 2nd day");
  });
  it("beschreibt ein individuelles Intervall (custom)", () => {
    expect(describeInterval({ intervallTyp: "custom", customDays: 5 })).toBe("Alle 5 Tage");
    expect(describeInterval({ intervallTyp: "custom", customDays: 5 }, "en")).toBe("Every 5 days");
  });
  it("beschreibt einen on/off-Zyklus", () => {
    expect(describeInterval({ intervallTyp: "cycle", onDays: 5, offDays: 2 })).toBe("5 Tage on / 2 Tage off");
  });
  it("beschreibt feste Wochentage, oder fordert zur Auswahl auf, wenn leer", () => {
    expect(describeInterval({ intervallTyp: "weekdays", weekdays: ["Mo", "Mi"] })).toBe("Mo, Mi");
    expect(describeInterval({ intervallTyp: "weekdays", weekdays: ["Mo", "Mi"] }, "en")).toBe("Mon, Wed");
    expect(describeInterval({ intervallTyp: "weekdays", weekdays: [] })).toBe("Wochentage wählen");
  });
});

describe("activeDoseDays", () => {
  const start = "2026-01-01"; // ein Donnerstag

  it("fixed: erzeugt Termine im festen Abstand", () => {
    const dates = activeDoseDays({ intervallDays: 2 }, start, 7);
    expect(dates.map(toLocalISODate)).toEqual(["2026-01-01", "2026-01-03", "2026-01-05", "2026-01-07"]);
  });

  it("custom: erzeugt Termine im individuellen Abstand", () => {
    const dates = activeDoseDays({ intervallTyp: "custom", customDays: 3 }, start, 10);
    expect(dates.map(toLocalISODate)).toEqual(["2026-01-01", "2026-01-04", "2026-01-07", "2026-01-10"]);
  });

  it("cycle: wechselt zwischen on- und off-Phasen", () => {
    const dates = activeDoseDays({ intervallTyp: "cycle", onDays: 2, offDays: 1 }, start, 6);
    // Zyklus 01/02 an, 03 aus, 04/05 an, 06 aus
    expect(dates.map(toLocalISODate)).toEqual(["2026-01-01", "2026-01-02", "2026-01-04", "2026-01-05"]);
  });

  it("weekdays: nur an den gewählten Wochentagen", () => {
    const dates = activeDoseDays({ intervallTyp: "weekdays", weekdays: ["Do"] }, start, 14);
    expect(dates.map(toLocalISODate)).toEqual(["2026-01-01", "2026-01-08"]);
  });

  it("respektiert einen eigenen Startzeitpunkt (eigenerStart) statt des Protokoll-Starts", () => {
    const dates = activeDoseDays({ intervallDays: 5, eigenerStart: "2026-02-01" }, start, 6);
    // totalDays zählt ab eigenerStart, nicht ab dem übergebenen Protokoll-start.
    expect(dates.map(toLocalISODate)).toEqual(["2026-02-01", "2026-02-06"]);
  });
});

describe("faelltAnTag", () => {
  it("ohne Startdatum gilt ein Eintrag als dauerhaft aktiv", () => {
    expect(faelltAnTag({ intervallDays: 3 }, new Date(2026, 0, 1), null)).toBe(true);
  });

  it("vor dem Startdatum fällt nichts an", () => {
    expect(faelltAnTag({ intervallDays: 1 }, new Date(2025, 11, 31), "2026-01-01")).toBe(false);
  });

  it("fixed: stimmt mit activeDoseDays für denselben Zeitraum überein", () => {
    const d = { intervallDays: 3 };
    const start = "2026-01-01";
    const erwartet = new Set(activeDoseDays(d, start, 14).map(toLocalISODate));
    for (let n = 0; n < 14; n++) {
      const tag = new Date(2026, 0, 1 + n);
      expect(faelltAnTag(d, tag, start)).toBe(erwartet.has(toLocalISODate(tag)));
    }
  });

  it("weekdays: ignoriert das Startdatum, prüft nur den Wochentag", () => {
    expect(faelltAnTag({ intervallTyp: "weekdays", weekdays: ["Mo"] }, new Date(2026, 0, 5), null)).toBe(true); // Montag
    expect(faelltAnTag({ intervallTyp: "weekdays", weekdays: ["Mo"] }, new Date(2026, 0, 6), null)).toBe(false); // Dienstag
  });

  it("cycle: stimmt mit activeDoseDays für denselben Zeitraum überein", () => {
    const d = { intervallTyp: "cycle", onDays: 2, offDays: 1 };
    const start = "2026-01-01";
    const erwartet = new Set(activeDoseDays(d, start, 9).map(toLocalISODate));
    for (let n = 0; n < 9; n++) {
      const tag = new Date(2026, 0, 1 + n);
      expect(faelltAnTag(d, tag, start)).toBe(erwartet.has(toLocalISODate(tag)));
    }
  });
});

describe("coerceDoseFeldWert", () => {
  const numerisch = new Set(["customDays", "onDays"]);

  it("wandelt numerische Felder zu Number, leer wird null", () => {
    expect(coerceDoseFeldWert("customDays", "5", numerisch)).toBe(5);
    expect(coerceDoseFeldWert("customDays", "", numerisch)).toBeNull();
  });

  it("eigenerStart wird bei leerem String zu null, sonst unverändert übernommen", () => {
    expect(coerceDoseFeldWert("eigenerStart", "", numerisch)).toBeNull();
    expect(coerceDoseFeldWert("eigenerStart", "2026-01-01", numerisch)).toBe("2026-01-01");
  });

  it("alle anderen Felder bleiben unverändert", () => {
    expect(coerceDoseFeldWert("weekdays", ["Mo", "Di"], numerisch)).toEqual(["Mo", "Di"]);
  });
});

describe("spaltenTeilmenge", () => {
  it("übernimmt nur bekannte Felder in die Spalten-Zuordnung", () => {
    expect(spaltenTeilmenge(["menge", "bacWasser", "unbekanntesFeld"])).toEqual({
      menge: "menge",
      bacWasser: "bac_wasser_ml",
    });
  });
});

describe("buildDosePlan", () => {
  it("baut einen sortierten Plan über mehrere Namen/Uhrzeiten hinweg", () => {
    const dosierungMap = {
      A: { intervallDays: 7, uhrzeiten: ["08:00"] },
      B: { intervallDays: 7, uhrzeiten: ["07:00"] },
    };
    const plan = buildDosePlan(["A", "B"], dosierungMap, "2026-01-01", "1", (name, d, date, uhrzeit) => ({
      name,
      date,
      uhrzeit,
    }));
    expect(plan).toHaveLength(2);
    // Gleicher Tag, B (07:00) muss vor A (08:00) stehen (Uhrzeit-Sortierung).
    expect(plan[0].name).toBe("B");
    expect(plan[1].name).toBe("A");
  });

  it("überspringt Namen ohne Dosierungseintrag", () => {
    const plan = buildDosePlan(["Fehlt"], {}, "2026-01-01", "1", (name) => ({ name }));
    expect(plan).toEqual([]);
  });
});
