import { describe, expect, it } from "vitest";
import { brauchtHilfeHinweis } from "./hilfeHinweis";

describe("Hilfe-Hinweis", () => {
  it("erkennt eindeutige Aussagen", () => {
    for (const t of ["Ich habe Suizidgedanken", "ich will nicht mehr leben", "Ich möchte mir das Leben nehmen", "manchmal will ich einfach sterben", "ich will mich umbringen", "Ich ritze mich wieder"]) {
      expect(brauchtHilfeHinweis(t), t).toBe(true);
    }
  });
  it("löst bei Alltagssprache nicht aus", () => {
    for (const t of ["Ich sterbe vor Hunger", "Das Training bringt mich um", "Totmüde heute", "Leben ist schön", "Ich will nicht sterben, nur schlafen", "Ich will mehr leben statt arbeiten", ""]) {
      expect(brauchtHilfeHinweis(t), t).toBe(false);
    }
  });
});
