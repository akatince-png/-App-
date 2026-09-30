import { describe, expect, it } from "vitest";
import { istZuFrueh } from "./fruehAbhaken";

describe("istZuFrueh", () => {
  const jetzt = new Date(2026, 8, 30, 7, 30);
  it("fragt nur, wenn mehr als 15 Min. vor der Zeit oder an einem späteren Tag", () => {
    expect(istZuFrueh({ uhrzeit: "08:00" }, "2026-09-30", jetzt)).toBe(true);
    expect(istZuFrueh({ uhrzeit: "07:40" }, "2026-09-30", jetzt)).toBe(false);
    expect(istZuFrueh({ uhrzeit: "06:00" }, "2026-10-01", jetzt)).toBe(true);
    expect(istZuFrueh({ uhrzeit: "23:00" }, "2026-09-29", jetzt)).toBe(false);
    expect(istZuFrueh({ uhrzeit: "08:00", done: true }, "2026-09-30", jetzt)).toBe(false);
    expect(istZuFrueh({}, "2026-09-30", jetzt)).toBe(false);
  });
});
