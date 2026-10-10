import { describe, expect, it } from "vitest";
import { ANSICHTEN, ansichtName, ansichtenListe, befehlBereinigen, punktFinden } from "./akaBefehl";

describe("befehlBereinigen", () => {
  it("lässt nur bekannte Seiten zu", () => {
    expect(befehlBereinigen({ art: "oeffnen", ansicht: "denksport" })).toEqual({ art: "oeffnen", ansicht: "denksport" });
    expect(befehlBereinigen({ art: "oeffnen", ansicht: "gibtsnicht" })).toEqual({ art: "keine" });
  });
  it("prüft Mengen auf Plausibilität", () => {
    expect(befehlBereinigen({ art: "wasser", ml: "200" })).toEqual({ art: "wasser", ml: 200 });
    expect(befehlBereinigen({ art: "wasser", ml: 0 })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "wasser", ml: 50000 })).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "tageslicht", minuten: 20 })).toEqual({ art: "tageslicht", minuten: 20 });
  });
  it("abhaken braucht mindestens einen Namen", () => {
    expect(befehlBereinigen({ art: "abhaken", namen: ["Vitamin D3", ""] })).toEqual({ art: "abhaken", namen: ["Vitamin D3"] });
    expect(befehlBereinigen({ art: "abhaken", namen: [] })).toEqual({ art: "keine" });
  });
  it("Unbekanntes oder Kaputtes wird zu keine", () => {
    expect(befehlBereinigen(null)).toEqual({ art: "keine" });
    expect(befehlBereinigen({ art: "loeschen" })).toEqual({ art: "keine" });
  });
});

describe("punktFinden", () => {
  const items = [
    { name: "Vitamin D3", done: false },
    { name: "Frühstück", done: true },
    { name: "Frühstück", done: false, key: "zwei" },
    { name: "10 Minuten Spaziergang", done: false },
  ];
  it("findet exakt, ohne Groß-/Kleinschreibung", () => {
    expect(punktFinden(items, "vitamin d3").name).toBe("Vitamin D3");
  });
  it("findet über Teilwörter in beide Richtungen", () => {
    expect(punktFinden(items, "Vitamin D").name).toBe("Vitamin D3");
    expect(punktFinden(items, "Spaziergang").name).toBe("10 Minuten Spaziergang");
  });
  it("nimmt nur offene Punkte", () => {
    expect(punktFinden(items, "Frühstück").key).toBe("zwei");
    expect(punktFinden(items, "Yoga")).toBeNull();
  });
});

describe("Seitenliste", () => {
  it("hat eindeutige ids und lesbare Namen", () => {
    expect(new Set(ANSICHTEN.map((a) => a.id)).size).toBe(ANSICHTEN.length);
    expect(ansichtName("denksport")).toBe("Spiele");
    expect(ansichtenListe()).toContain("wochenuebersicht = Wochenübersicht (Wochenplan)");
  });
});
