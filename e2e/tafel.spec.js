import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// Tafel fürs Tablet (24.10.): To-dos, Heute, nächste Tage; abhaken und neue
// Aufgabe direkt hier.
test("Tafel: drei Spalten, Aufgabe abhaken und neu anlegen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 12));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1&matrixzeit=1&alltag=1#/tafel");
  const todos = page.locator("[data-tafel-todos]");
  await expect(todos.locator('[data-tafel-quadrant="jetzt"]')).toContainText("Antrag abschicken");
  await expect(page.locator("[data-tafel-heute]")).toContainText("Ordner sortieren");
  await expect(page.locator("[data-tafel-woche]")).toBeVisible();

  await todos.getByRole("button", { name: "Antrag abschicken erledigt" }).click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ id: "m1" });
  await todos.getByLabel("Neue Aufgabe").fill("Zahnarzt anrufen");
  await todos.getByRole("button", { name: "＋" }).click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ titel: "Zahnarzt anrufen", wichtig: true });
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Kalender: Link zur Tafel", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/kalender");
  await page.locator("[data-tafel-link]").click();
  await expect(page.locator("[data-tafel]")).toBeVisible();
});
