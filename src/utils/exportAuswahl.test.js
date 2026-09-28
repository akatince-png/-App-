import { describe, expect, it } from "vitest";
import { VORLAGEN, alltagItems, imExport, standardAuswahl } from "./exportAuswahl";

describe("Export-Auswahl", () => {
  it("Standard = nur Gesundheit: Medikation ja, Arbeit/Hobby nein", () => {
    const a = standardAuswahl();
    expect(imExport("hormon", a)).toBe(true);
    expect(imExport("morgenroutine", a)).toBe(true);
    expect(imExport("alltag:arbeit", a)).toBe(false);
    expect(imExport("zeitblock", a)).toBe(false);
    expect(imExport("irgendwas", a)).toBe(false);
  });
  it("Komplett enthält Alltag", () => {
    const a = { bereiche: new Set(VORLAGEN.komplett.bereiche), teile: new Set() };
    expect(imExport("alltag:hobby", a)).toBe(true);
    expect(imExport("alltag:eigen", a)).toBe(true);
  });
  it("Kalender-Einträge werden zu Tagesplan-Zeilen", () => {
    const mo = new Date(2026, 8, 28);
    const items = alltagItems(mo, [{ id: 1, bereich: "arbeit", titel: "Arbeit", start: "08:30", ende: "16:30", wochentage: ["Mo"] }, { id: 2, bereich: "hobby", titel: "Gitarre", start: "19:00", ende: "", wochentage: ["Di"] }], [], { "1|2026-09-28": true });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kategorie: "alltag:arbeit", uhrzeit: "08:30", name: "💼 Arbeit", done: true });
  });
});
