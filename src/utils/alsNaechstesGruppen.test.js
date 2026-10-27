import { describe, it, expect } from "vitest";
import { gruppiereFuerAlsNaechstes } from "./alsNaechstesGruppen";

// 27.10.: Startseite stürzte ab („e._ids.length“), weil der Shaker als
// Getränk über den Tag nicht gebündelt wird und kein _ids hat.
describe("gruppiereFuerAlsNaechstes", () => {
  it("bündelt gleichzeitige Supplemente und lässt den Shaker einzeln", () => {
    const items = [
      { key: "s1", kategorie: "supplement", refId: "a", name: "Shaker", uhrzeit: "06:02", raw: { getraenkMl: 1500 } },
      { key: "s2", kategorie: "supplement", refId: "b", name: "Jod", uhrzeit: "06:40", raw: {} },
      { key: "s3", kategorie: "supplement", refId: "c", name: "Zink", uhrzeit: "06:40", raw: {} },
      { key: "h1", kategorie: "hormon", name: "HGH", uhrzeit: "22:25", raw: { einnahmeart: "Injektion" } },
    ];
    const r = gruppiereFuerAlsNaechstes(items);
    expect(r.map((x) => x.name)).toEqual(["Shaker", "Morgensupplemente · 2", "HGH"]);
  });
});
