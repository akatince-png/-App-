import { describe, it, expect } from "vitest";
import { einrichtungsSchritte, einrichtungsStand } from "./einrichtung";

describe("Einrichtungs-Checkliste", () => {
  it("leeres Konto: nichts fertig, nicht bereit, Abend vor Morgen", () => {
    const s = einrichtungsSchritte({});
    const keys = s.map((x) => x.key);
    expect(keys.indexOf("abendroutine")).toBeLessThan(keys.indexOf("morgenroutine"));
    const st = einrichtungsStand(s);
    expect(st.bereit).toBe(false);
    expect(st.offenPflicht).toEqual(["Abendroutine", "Morgenroutine", "Programmstart"]);
  });
  it("bereit, sobald Abend, Morgen und Start stehen – Optionales zählt nicht", () => {
    const f = {
      routinen: { abend: { start: "21:30:00" }, morgen: { start: "06:30" } },
      teilnahme: { status: "laufend", start: "2026-09-28" },
      wasserMl: 2500,
      erinnerungen: { morgenroutine: { aktiv: true }, abendroutine: true },
    };
    const s = einrichtungsSchritte(f);
    const st = einrichtungsStand(s);
    expect(st.bereit).toBe(true);
    expect(s.find((x) => x.key === "abendroutine").detail).toBe("ab 21:30 Uhr");
    expect(s.find((x) => x.key === "wasser").detail).toBe("2,5 l am Tag");
    expect(s.find((x) => x.key === "erinnerungen").fertig).toBe(true);
    expect(s.find((x) => x.key === "programm").detail).toContain("28.09.2026");
    expect(s.find((x) => x.key === "medikation").stufe).toBe("optional");
  });
  it("wartender Start ist noch nicht fertig", () => {
    const s = einrichtungsSchritte({ teilnahme: { status: "wartet", start: null } });
    expect(s.find((x) => x.key === "programm").fertig).toBe(false);
  });
});

describe("Steckbrief in der Checkliste", () => {
  it("zeigt die angetippten Angaben lesbar an", () => {
    const s = einrichtungsSchritte({ onboardingFertig: true, steckbrief: { supplementeJa: true, supplementeWelche: "Vitamin D3, Magnesium", sportMenge: "2× pro Woche", sportBeschreibung: "Laufen, Yoga" } });
    const d = s.find((x) => x.key === "steckbrief").detail;
    expect(d).toContain("💊 Supplemente: Vitamin D3, Magnesium");
    expect(d).toContain("📅 Sport: 2× pro Woche");
    expect(d).toContain("🏃 Arten: Laufen, Yoga");
  });
});
