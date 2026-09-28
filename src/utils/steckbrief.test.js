import { describe, expect, it, vi, afterEach } from "vitest";
import { kalorienInfo, steckbriefZeilen } from "./steckbrief";

afterEach(() => vi.useRealTimers());

describe("Steckbrief: Kalorien + Coach-Zeilen", () => {
  it("rechnet Grundumsatz und Tagesbedarf", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27));
    const k = kalorienInfo({ geschlecht: "Weiblich", geburtsdatum: "1990-05-01", groesse: 170, gewicht: 70, aktivitaet: "Leicht aktiv" });
    // 10*70 + 6.25*170 - 5*36 - 161 = 1421.5
    expect(k.alter).toBe(36);
    expect(k.grundumsatz).toBe(1422);
    expect(k.bedarf).toBe(1960);
  });

  it("ohne Aktivität kein Tagesbedarf, ohne Werte nichts", () => {
    expect(kalorienInfo({ geschlecht: "Männlich", geburtsdatum: "1990-01-01", groesse: 180, gewicht: 80 }).bedarf).toBeNull();
    expect(kalorienInfo({}).grundumsatz).toBeNull();
  });

  it("zeigt Profil, Geburt und Kalorien für den Coach", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27));
    const z = steckbriefZeilen({ aktivitaet: "Mäßig aktiv", supplementeJa: false }, { geschlecht: "Weiblich", geburtsdatum: "1990-05-01", groesse: 170, gewicht: 70 });
    expect(z[0]).toBe("👤 Weiblich, 36 J., 170 cm, 70 kg");
    expect(z[1]).toBe("🎂 Geboren: 01.05.1990");
    expect(z[2]).toMatch(/Grundumsatz ca\. 1422 kcal · Tagesbedarf ca\. 2200 kcal \(Mäßig aktiv\)/);
    expect(z).toContain("💊 Supplemente: keine");
    expect(steckbriefZeilen(null)).toEqual([]);
  });
});
