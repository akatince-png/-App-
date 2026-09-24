import { describe, it, expect, vi } from "vitest";
import { istNachladeFehler, einmalNeuLaden, ladeMitWiederholung } from "./nachladeFehler";

function speicher() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

describe("nachladeFehler", () => {
  it("erkennt fehlgeschlagene Nachlade-Vorgänge", () => {
    expect(istNachladeFehler(new TypeError("Failed to fetch dynamically imported module: https://x/assets/PlaeneView-1.js"))).toBe(true);
    expect(istNachladeFehler(new TypeError("Importing a module script failed."))).toBe(true);
    expect(istNachladeFehler(new TypeError("Cannot read properties of undefined"))).toBe(false);
  });

  it("lädt höchstens einmal in 30 Sekunden neu", () => {
    const s = speicher();
    const neu = vi.fn();
    expect(einmalNeuLaden(100000, s, neu)).toBe(true);
    expect(einmalNeuLaden(110000, s, neu)).toBe(false);
    expect(einmalNeuLaden(140001, s, neu)).toBe(true);
    expect(neu).toHaveBeenCalledTimes(2);
  });
});

describe("ladeMitWiederholung", () => {
  const sofort = () => Promise.resolve();
  it("wiederholt nach einem Fehler und liefert dann das Modul", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module")).mockResolvedValueOnce({ default: "Ansicht" });
    await expect(ladeMitWiederholung(f, 3, sofort)()).resolves.toEqual({ default: "Ansicht" });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("behandelt ein leeres Modul wie einen Fehler und meldet am Ende einen Nachlade-Fehler", async () => {
    const f = vi.fn().mockResolvedValue(undefined);
    const fehler = await ladeMitWiederholung(f, 3, sofort)().catch((e) => e);
    expect(f).toHaveBeenCalledTimes(3);
    expect(istNachladeFehler(fehler)).toBe(true);
  });
});
