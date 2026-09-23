import { describe, expect, it } from "vitest";
import { tagIstGeschafft } from "./useTagGeschafftFeier";

describe("tagIstGeschafft", () => {
  it("ist erst geschafft, wenn alle abhakbaren Punkte erledigt sind", () => {
    expect(tagIstGeschafft([{ kategorie: "supplement", done: true }, { kategorie: "mahlzeit", done: false }]).geschafft).toBe(false);
    expect(tagIstGeschafft([{ kategorie: "supplement", done: true }, { kategorie: "mahlzeit", done: true }])).toEqual({ geschafft: true, anzahl: 2 });
  });
  it("ignoriert Zeitblöcke/Workflows und feiert keinen leeren Tag", () => {
    expect(tagIstGeschafft([{ kategorie: "supplement", done: true }, { kategorie: "zeitblock", done: false }]).geschafft).toBe(true);
    expect(tagIstGeschafft([]).geschafft).toBe(false);
    expect(tagIstGeschafft([{ kategorie: "zeitblock", done: false }]).geschafft).toBe(false);
  });
});
