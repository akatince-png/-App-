import { describe, it, expect } from "vitest";
import { DENKPAUSEN_KATEGORIEN, zufaelligeDenkpauseAufgabe } from "./denkpausen";

describe("DENKPAUSEN_KATEGORIEN", () => {
  it("jede Kategorie hat mindestens 90 Aufgaben mit gültigem Schema", () => {
    expect(DENKPAUSEN_KATEGORIEN.length).toBeGreaterThanOrEqual(4);
    for (const kategorie of DENKPAUSEN_KATEGORIEN) {
      expect(kategorie.aufgaben.length).toBeGreaterThanOrEqual(90);
      for (const aufgabe of kategorie.aufgaben) {
        expect(typeof aufgabe.frage).toBe("string");
        expect(aufgabe.frage.length).toBeGreaterThan(0);
        expect(aufgabe.antworten).toHaveLength(4);
        aufgabe.antworten.forEach((a) => expect(typeof a).toBe("string"));
        expect(aufgabe.richtig).toBeGreaterThanOrEqual(0);
        expect(aufgabe.richtig).toBeLessThanOrEqual(3);
      }
    }
  });

  it("hat innerhalb jeder Kategorie keine doppelten Fragen", () => {
    for (const kategorie of DENKPAUSEN_KATEGORIEN) {
      const fragen = kategorie.aufgaben.map((a) => a.frage);
      expect(new Set(fragen).size).toBe(fragen.length);
    }
  });
});

describe("zufaelligeDenkpauseAufgabe", () => {
  it("liefert jedes Mal eine gültige Aufgabe aus dem Gesamtpool", () => {
    for (let i = 0; i < 20; i++) {
      const aufgabe = zufaelligeDenkpauseAufgabe();
      expect(typeof aufgabe.frage).toBe("string");
      expect(aufgabe.antworten).toHaveLength(4);
      expect(aufgabe.antworten[aufgabe.richtig]).toBeDefined();
    }
  });

  it("wiederholt sich bei aufeinanderfolgenden Aufrufen nicht sofort", () => {
    const gesehen = new Set();
    let wiederholungen = 0;
    for (let i = 0; i < 15; i++) {
      const aufgabe = zufaelligeDenkpauseAufgabe();
      if (gesehen.has(aufgabe.frage)) wiederholungen++;
      gesehen.add(aufgabe.frage);
    }
    // Bei einem Pool von >300 Aufgaben und einem 30er-Merk-Fenster sollten
    // 15 Aufrufe in Folge keine einzige Wiederholung zeigen.
    expect(wiederholungen).toBe(0);
  });
});
