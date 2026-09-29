import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// "‹ Zurück" (27.09., Nutzerinnen-Wunsch): eine Seite zurück statt immer zur Startseite.
test("Zurück-Knopf geht eine Seite zurück, nicht zur Startseite", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html#/home");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await nav.getByRole("button", { name: "Pläne" }).click();
  await expect(page.getByRole("heading", { name: "Deine Pläne" })).toBeVisible();
  // Direkt nach der Startseite gibt es nur ⌂ (zurück wäre dasselbe).
  await expect(page.getByRole("button", { name: "Eine Seite zurück" })).toHaveCount(0);
  await page.getByRole("button", { name: /Gewohnheiten/ }).first().click();
  const zurueck = page.getByRole("button", { name: "Eine Seite zurück" });
  await expect(zurueck).toBeVisible();
  await zurueck.click();
  await expect(page.getByRole("heading", { name: "Deine Pläne" })).toBeVisible();
  await expect(page).toHaveURL(/#\/(wochenuebersicht|plaene|tageslicht|[a-z-]+)$/);
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
