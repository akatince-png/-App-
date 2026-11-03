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

describe("Injektionen in den Routinen (03.11.)", () => {
  const HORMONE = [
    { key: "h1", kategorie: "hormon", name: "HGH (Wachstumshormon), subkutan", raw: { name: "HGH (Wachstumshormon), subkutan", einnahmeart: "Injektion" }, uhrzeit: "22:25", done: false },
    { key: "h2", kategorie: "hormon", name: "Testosteron (250 mg/ml), subkutan", raw: { name: "Testosteron (250 mg/ml), subkutan", einnahmeart: "Injektion" }, uhrzeit: "06:35", done: false },
    { key: "s5", kategorie: "supplement", name: "NAC (mittags)", raw: { id: "n", name: "NAC (mittags)" }, uhrzeit: "13:00", done: false },
    { key: "s6", kategorie: "supplement", name: "NAC (abends)", raw: { id: "n2", name: "NAC (abends)" }, uhrzeit: "21:55", done: false },
  ];
  it("verknüpft „HGH spritzen“ abends mit der HGH-Gabe", () => {
    expect(verknuepfteItems({ routine: "abend", name: "💉 HGH spritzen (2 I.E.)" }, HORMONE).map((x) => x.key)).toEqual(["h1"]);
  });
  it("verknüpft den Spritztag morgens mit den Morgen-Injektionen", () => {
    expect(verknuepfteItems({ routine: "morgen", name: "💉 Spritztag: Testosteron + Retatrutid" }, HORMONE).map((x) => x.key)).toEqual(["h2"]);
  });
  it("nimmt abends nur die Abend-Supplemente, nicht die vom Mittag", () => {
    expect(verknuepfteItems({ routine: "abend", name: "💊 Dosette Abend: Magnesium + NAC" }, HORMONE).map((x) => x.key)).toEqual(["s6"]);
  });
  it("erkennt Spritztag-Schritte als nur-wenn-fällig", async () => {
    const { nurWennFaellig } = await import("./routineVerknuepfung");
    expect(nurWennFaellig({ name: "💉 Spritztag: Testosteron + Retatrutid" })).toBe(true);
    expect(nurWennFaellig({ name: "🚿 Duschen & Anziehen" })).toBe(false);
  });
});
