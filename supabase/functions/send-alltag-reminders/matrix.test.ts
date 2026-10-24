import { describe, expect, it } from "vitest";
import { erinnerungsZeit, matrixText } from "./matrix";

const heute = "2026-10-25";

describe("Matrix-Erinnerungen (24.10.)", () => {
  it("zur Uhrzeit, 15 Min. und 1 Std. vorher", () => {
    const a = { geplant_am: heute, uhrzeit: "10:00:00" };
    expect(erinnerungsZeit({ ...a, erinnerung: "zeit" }, heute)).toBe("10:00");
    expect(erinnerungsZeit({ ...a, erinnerung: "15" }, heute)).toBe("09:45");
    expect(erinnerungsZeit({ ...a, erinnerung: "60" }, heute)).toBe("09:00");
  });
  it("morgens um 8 – auch nur mit Frist", () => {
    expect(erinnerungsZeit({ geplant_am: heute, erinnerung: "morgens" }, heute)).toBe("08:00");
    expect(erinnerungsZeit({ frist: heute, erinnerung: "morgens" }, heute)).toBe("08:00");
  });
  it("nicht: anderer Tag, erledigt, ohne Erinnerung, ohne Uhrzeit, vor Mitternacht", () => {
    expect(erinnerungsZeit({ geplant_am: "2026-10-26", uhrzeit: "10:00", erinnerung: "zeit" }, heute)).toBeNull();
    expect(erinnerungsZeit({ geplant_am: heute, uhrzeit: "10:00", erinnerung: "zeit", erledigt_am: "x" }, heute)).toBeNull();
    expect(erinnerungsZeit({ geplant_am: heute, uhrzeit: "10:00" }, heute)).toBeNull();
    expect(erinnerungsZeit({ geplant_am: heute, erinnerung: "zeit" }, heute)).toBeNull();
    expect(erinnerungsZeit({ geplant_am: heute, uhrzeit: "00:30", erinnerung: "60" }, heute)).toBeNull();
  });
  it("Text", () => {
    expect(matrixText({ titel: "Schuldenberatung anrufen", uhrzeit: "10:00:00", erinnerung: "15" })).toBe("Schuldenberatung anrufen · 10:00 Uhr in 15 Min.");
  });
});
