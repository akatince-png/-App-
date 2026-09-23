import { describe, expect, it } from "vitest";
import { pflanzenStufe, weltPflanzen } from "./welt";

describe("pflanzenStufe", () => {
  it("wächst an den Tagesschwellen", () => {
    expect(pflanzenStufe(0).symbol).toBe("🌰");
    expect(pflanzenStufe(1).symbol).toBe("🌱");
    expect(pflanzenStufe(6)).toMatchObject({ symbol: "🌿", nochTage: 1 });
    expect(pflanzenStufe(14).symbol).toBe("🌳");
    expect(pflanzenStufe(99)).toMatchObject({ symbol: "🌸", naechste: null, nochTage: 0 });
  });
});

describe("weltPflanzen", () => {
  it("zeigt nur Bereiche mit Punkten, größte zuerst, ohne Serie wartend statt welk", () => {
    const welt = weltPflanzen([
      { key: "schlaf", punkte: 0, streak: 0 },
      { key: "hydration", punkte: 4, streak: 0 },
      { key: "training", punkte: 9, streak: 2 },
    ]);
    expect(welt.map((p) => p.key)).toEqual(["training", "hydration"]);
    expect(welt[1]).toMatchObject({ wartet: true });
    expect(welt[1].stufe.symbol).toBe("🌿");
  });
});
