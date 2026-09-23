import { describe, expect, it } from "vitest";
import { DENKPAUSEN_KATEGORIEN } from "./denkpausen";

describe("Denkpausen-Katalog", () => {
  it("hat 200 Aufgaben je Kategorie", () => {
    expect(DENKPAUSEN_KATEGORIEN.map((k) => [k.id, k.aufgaben.length])).toEqual([
      ["mathe", 200],
      ["wortspiele", 200],
      ["raetsel", 200],
      ["wissen", 200],
    ]);
  });

  it("jede Aufgabe ist eindeutig und gültig", () => {
    const fragen = new Set();
    for (const k of DENKPAUSEN_KATEGORIEN) {
      for (const a of k.aufgaben) {
        const schluessel = a.frage.trim().toLowerCase();
        expect(fragen.has(schluessel), a.frage).toBe(false);
        fragen.add(schluessel);
        expect(a.antworten).toHaveLength(4);
        expect(new Set(a.antworten.map((x) => x.trim().toLowerCase())).size, a.frage).toBe(4);
        expect(a.richtig >= 0 && a.richtig < 4, a.frage).toBe(true);
      }
    }
  });
});

describe("denksportRunde", () => {
  it("liefert 5 verschiedene Aufgaben der gewählten Kategorie und wiederholt sie nicht sofort", async () => {
    const { denksportRunde } = await import("./denkpausen");
    const r1 = denksportRunde("raetsel");
    const r2 = denksportRunde("raetsel");
    expect(r1).toHaveLength(5);
    expect(new Set(r1.map((a) => a.frage)).size).toBe(5);
    expect(r1.every((a) => a.kategorie === "raetsel")).toBe(true);
    expect(r2.some((a) => r1.map((x) => x.frage).includes(a.frage))).toBe(false);
    expect(new Set(denksportRunde("gemischt", 20).map((a) => a.kategorie)).size).toBeGreaterThan(1);
  });
});
