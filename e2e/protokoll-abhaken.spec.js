import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Tagesprotokoll (24.09.): Abhaken auf der Startseite schreibt wie im
// Tagesplan einen "erledigt"-Eintrag (aenderungVermerken). Der Harness
// schreibt Aufrufe gemockter Funktionen in window.__mockAufrufe mit.
// Uhr fest auf 13:00, damit das Medikament (08:00, überfällig) "Jetzt dran" ist.
test("Startseite: Abhaken von Jetzt dran landet im Tagesprotokoll", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const mittag = new Date();
  mittag.setHours(13, 0, 0, 0);
  await page.clock.install({ time: mittag });
  await page.goto("/e2e/harness/index.html?beispiel=1#/home");
  await page.getByRole("button", { name: "Elvanse erledigt" }).first().click();
  const eintraege = await page.evaluate(() => (window.__mockAufrufe || []).filter((a) => a.name === "aenderungVermerken").map((a) => a.args[0]));
  expect(eintraege).toContainEqual(expect.objectContaining({ kategorie: "hormon", itemName: "Elvanse", aktion: "erledigt" }));
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
