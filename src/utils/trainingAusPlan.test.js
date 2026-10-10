import { describe, expect, it } from "vitest";
import { trainingAusPlan } from "./trainingAusPlan";

describe("trainingAusPlan", () => {
  it("baut den Eintrag aus dem Wochenplan", () => {
    const e = trainingAusPlan({ datum: "2026-10-10", uhrzeit: "18:00", arten: ["Cardio", "Krafttraining"], name: "Ganzkörper", uebungenListe: [{ name: "Kniebeuge" }], warmup: { aktiv: true, dauerMin: 5 }, cooldown: { aktiv: true } });
    expect(e).toMatchObject({ datum: "2026-10-10", uhrzeit: "18:00", art: "Krafttraining", name: "Ganzkörper", bemerkungen: "Warm-up 5 Min. · Cool-down", erledigt: false });
    expect(e.uebungen).toHaveLength(1);
  });
  it("kann direkt als erledigt angelegt werden", () => {
    expect(trainingAusPlan({ datum: "2026-10-10", arten: [] }, { erledigt: true })).toMatchObject({ art: "", erledigt: true, uhrzeit: "" });
  });
});
