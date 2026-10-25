import { describe, it, expect } from "vitest";
import { buildDayItems, istSpontanTraining } from "./dayItems";

// 25.10. (Nutzerin): ein spontan gestartetes, nicht beendetes Training darf
// nicht als offener Punkt stehen bleiben oder das geplante Training ersetzen.
describe("Spontan-Training im Tagesplan", () => {
  const tag = new Date(2026, 9, 25, 12, 0);
  const spontan = { id: "s", datum: "2026-10-25", uhrzeit: "01:48", art: "Bodyweight", name: "Spontan: Intervall", erledigt: false };
  it("erkennt Spontan-Trainings", () => {
    expect(istSpontanTraining(spontan)).toBe(true);
    expect(istSpontanTraining({ name: "Spontan: Intervall", templateId: "x" })).toBe(false);
    expect(istSpontanTraining({ name: "Ganzkörper" })).toBe(false);
  });
  it("offen: nicht im Plan; beendet: als erledigt im Plan", () => {
    const offen = buildDayItems(tag, { trainingEintraege: [spontan] }).filter((i) => i.kategorie === "training");
    expect(offen).toEqual([]);
    const fertig = buildDayItems(tag, { trainingEintraege: [{ ...spontan, erledigt: true }] }).filter((i) => i.kategorie === "training");
    expect(fertig).toHaveLength(1);
    expect(fertig[0].done).toBe(true);
  });
  it("ein nicht beendetes Spontan-Training verdrängt das geplante Training nicht", () => {
    const geplant = { id: "w", wochentag: "So", arten: ["Krafttraining"], name: "Ganzkörper", uhrzeit: "18:00" };
    const items = buildDayItems(tag, { trainingEintraege: [spontan], trainingWochenplan: [geplant] }).filter((i) => i.kategorie === "training");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.refId !== "s")).toBe(true);
  });
});
