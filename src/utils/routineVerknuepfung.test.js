import { describe, expect, it } from "vitest";
import { schritteDurchItems, verknuepfteItems } from "./routineVerknuepfung";

const ITEMS = [
  { key: "m1", kategorie: "mahlzeit", name: "Rührei mit Lachs", raw: { name: "Rührei mit Lachs" }, uhrzeit: "06:45", done: false },
  { key: "s1", kategorie: "supplement", name: "Vitamin D3", raw: { id: "d3", name: "Vitamin D3" }, uhrzeit: "06:50", done: false },
  { key: "s2", kategorie: "supplement", name: "Omega-3", raw: { id: "o3", name: "Omega-3" }, uhrzeit: "06:50", done: false },
  { key: "s3", kategorie: "supplement", name: "Shaker", raw: { id: "sh", name: "Shaker", getraenkMl: 1500 }, uhrzeit: "06:05", done: false },
  { key: "s4", kategorie: "supplement", name: "Magnesium", raw: { id: "mg", name: "Magnesium" }, uhrzeit: "21:00", done: false },
  { key: "m2", kategorie: "mahlzeit", name: "Mittagessen", raw: { name: "Mittagessen" }, uhrzeit: "12:30", done: false },
];
const FRUEHSTUECK = { id: "f", routine: "morgen", name: "🍳 Eiweißreiches Frühstück + Dosette Morgen" };
const SHAKER = { id: "sh", routine: "morgen", name: "🥤 Shaker aus dem Kühlschrank" };

describe("Routine ↔ Tagespunkte (28.10.)", () => {
  it("verknüpft Frühstück + Dosette mit Morgenmahlzeit und Morgensupplementen, nicht mit Shaker oder Abend", () => {
    expect(verknuepfteItems(FRUEHSTUECK, ITEMS).map((x) => x.key).sort()).toEqual(["m1", "s1", "s2"]);
  });
  it("verknüpft den Shaker-Schritt mit dem Shaker", () => {
    expect(verknuepfteItems(SHAKER, ITEMS).map((x) => x.key)).toEqual(["s3"]);
  });
  it("hakt einen Schritt erst ab, wenn alle verknüpften Punkte erledigt sind", () => {
    expect(schritteDurchItems([FRUEHSTUECK], ITEMS, new Set(["m1"]))).toEqual([]);
    expect(schritteDurchItems([FRUEHSTUECK], ITEMS, new Set(["m1", "s1", "s2"])).map((x) => x.id)).toEqual(["f"]);
    expect(schritteDurchItems([SHAKER], ITEMS, new Set(["s3"])).map((x) => x.id)).toEqual(["sh"]);
  });
  it("lässt Schritte ohne Bezug in Ruhe", () => {
    expect(verknuepfteItems({ routine: "morgen", name: "🚿 Duschen & Anziehen" }, ITEMS)).toEqual([]);
  });
});
