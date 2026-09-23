import { describe, expect, it } from "vitest";
import { baueTagesQuests } from "./tagesQuests";

const item = (hour, done, kategorie = "supplement") => ({ hour, done, kategorie });

describe("baueTagesQuests", () => {
  it("baut Etappenziele aus dem Tag", () => {
    const q = baueTagesQuests({ items: [item("08", true), item("09", false), item("20", false), item("13", false)], hydrationHeuteMl: 500, hydrationZielMl: 2000 });
    expect(q.map((x) => x.key)).toEqual(["erster", "halbzeit", "morgen", "trinken"]);
    expect(q[0].geschafft).toBe(true);
    expect(q[1]).toMatchObject({ aktuell: 1, ziel: 2, geschafft: false });
    expect(q[2]).toMatchObject({ aktuell: 1, ziel: 2 });
    expect(q[3]).toMatchObject({ aktuell: 500, ziel: 2000, geschafft: false });
  });
  it("ignoriert Zeitblöcke und liefert ohne Plan nur das Trinkziel", () => {
    expect(baueTagesQuests({ items: [item("08", false, "zeitblock")], hydrationZielMl: 0 })).toEqual([]);
    expect(baueTagesQuests({ items: [], hydrationHeuteMl: 2500, hydrationZielMl: 2000 })[0]).toMatchObject({ key: "trinken", geschafft: true, aktuell: 2000 });
  });
});
