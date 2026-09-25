import { describe, expect, it } from "vitest";
import { essenAuswerten, lebensmittelFinden, makroZiele, mahlzeitWerte, tagesTipp, teilLesen, verhaeltnis } from "./essenRechner";

describe("Essen aus einem Satz", () => {
  it("zwei Scheiben Vollkornbrot, drei Bananen und fünf Eier", () => {
    const r = essenAuswerten("zwei Scheiben Vollkornbrot, drei Bananen und fünf Eier");
    expect(r.unbekannt).toEqual([]);
    expect(r.posten.map((p) => [p.lebensmittel.name, p.gramm])).toEqual([
      ["Vollkornbrot", 90],
      ["Banane", 360],
      ["Ei", 275],
    ]);
    expect(r.posten[0].annahme).toBe("2 Scheibe(n) à 45 g = 90 g");
    expect(r.summe.eiweiss).toBeGreaterThan(45);
    expect(r.summe.eiweiss).toBeLessThan(52);
  });
  it("Gramm, Löffel, halbe Mengen, Unbekanntes", () => {
    expect(teilLesen("200g Skyr")).toMatchObject({ gramm: 200 });
    expect(teilLesen("1 EL Leinöl")).toMatchObject({ gramm: 13.5 });
    expect(teilLesen("eine halbe Avocado")).toMatchObject({ gramm: 75 });
    expect(teilLesen("anderthalb Bananen").gramm).toBe(180);
    expect(essenAuswerten("Kaiserschmarrn").unbekannt).toEqual(["Kaiserschmarrn"]);
  });
  it("findet Lebensmittel auch im Plural und in Wortgruppen", () => {
    expect(lebensmittelFinden("Walnüsse").name).toBe("Walnüsse");
    expect(lebensmittelFinden("gebratener Lachs").name).toBe("Lachs");
    expect(lebensmittelFinden("Hähnchenbrust").name).toBe("Hähnchenbrust");
  });
});

describe("Ziele und Bilanz", () => {
  it("Gramm aus g/kg und Kalorienziel, Kohlenhydrate = Rest", () => {
    const z = makroZiele({ eiweissGProKg: 1.8 }, 82, 2100);
    expect(z).toMatchObject({ eiweiss: 148, fett: 70, kh: 220 });
  });
  it("Verhältnis, Mahlzeit aus Zutaten, Tipp", () => {
    expect(verhaeltnis(7000, 1000)).toBe(7);
    expect(mahlzeitWerte([{ name: "Haferflocken", mengeGramm: 50 }, { name: "Milch", mengeGramm: 200 }]).summe.eiweiss).toBeGreaterThan(12);
    expect(tagesTipp({ eiweiss: 100, epaDha: 0, omega3: 0 }, { eiweiss: 140, omega3Mg: 250 }, { eiweiss: ["Skyr/Quark"] })).toMatch(/Noch 40 g Eiweiß offen – z. B. 150 g Skyr/);
  });
});

describe("Trend-Lebensmittel, tierische Fette, Einlagen", () => {
  it("kennt Superfoods und Fette", () => {
    for (const [text, name] of [
      ["2 EL Chiasamen", "Chiasamen"],
      ["eine Handvoll Alfalfa Sprossen", "Alfalfa-Sprossen"],
      ["150 g Amaranth", "Amaranth gekocht"],
      ["1 EL Rindertalg", "Rindertalg"],
      ["1 TL Ghee", "Ghee"],
      ["1 EL Schmalz", "Schweineschmalz"],
      ["Kimchi", "Kimchi"],
      ["1 TL Spirulina", "Spirulina"],
    ])
      expect(teilLesen(text).lebensmittel?.name, text).toBe(name);
  });
  it("Sardinen: in Wasser, in Olivenöl, mit Öl", () => {
    const wasser = teilLesen("1 Dose Sardinen in Wasser");
    const olive = teilLesen("1 Dose Sardinen in Olivenöl");
    const mitOel = teilLesen("1 Dose Sardinen in Olivenöl mit Öl");
    expect(wasser.gramm).toBe(90);
    expect(wasser.werte.fett).toBeLessThan(olive.werte.fett);
    expect(olive.werte.fett).toBeLessThan(mitOel.werte.fett);
    // Olivenöl statt Sojaöl: weniger Omega-6
    expect(olive.werte.omega6).toBeLessThan(teilLesen("1 Dose Sardinen").werte.omega6);
    expect(olive.annahme).toMatch(/in Olivenöl, abgetropft/);
    expect(essenAuswerten("Sardinen mit Öl und Brot").posten.map((p) => p.lebensmittel.name)).toEqual(["Sardinen", "Roggenbrot"]);
  });
});
