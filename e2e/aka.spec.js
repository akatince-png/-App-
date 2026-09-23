import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Aka ist EIN Assistent für die ganze App (ui/Aka.jsx, 23.09.): auf jeder
// Seite genau ein Aka-Knopf — früher hatten Bereichsseiten eigene Chats,
// andere Seiten gar keinen oder den universellen.
const SEITEN = ["home", "tagesplan", "supplemente", "training", "morgenroutine", "routinen", "mehr", "erfolge", "lexikon"];

test("Aka ist auf jeder Seite genau einmal da", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  for (const seite of SEITEN) {
    await page.goto(`/e2e/harness/index.html#/${seite}`);
    await expect(page.getByRole("button", { name: "Aka fragen" }), seite).toHaveCount(1);
  }
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Coachees sehen Aka auf keiner Seite", async ({ page }) => {
  for (const seite of ["home", "supplemente", "mehr"]) {
    await page.goto(`/e2e/harness/index.html?isAdmin=0#/${seite}`);
    await page.waitForTimeout(400);
    await expect(page.getByRole("button", { name: "Aka fragen" }), seite).toHaveCount(0);
  }
});
