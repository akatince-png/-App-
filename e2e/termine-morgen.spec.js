import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Termin-Erinnerung nach Morgen-/Abendroutine (10.11.2026).
test("Nach der Abendroutine: kurze Karte mit den Terminen von morgen, einmal pro Tag", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.clock.setFixedTime(new Date(2026, 10, 15, 21, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&termine=abend");
  const karte = page.getByTestId("termine-morgen-hinweis");
  await expect(karte).toBeVisible();
  await expect(karte).toContainText("Hey, denk dran");
  await expect(karte).toContainText("13:15–14:45");
  await expect(karte).toContainText("Hilfeplangespräch");
  await expect(karte).not.toContainText("Doku alt");
  await karte.getByRole("button", { name: "Alles klar" }).click();
  await expect(karte).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1800);
  await expect(page.getByTestId("termine-morgen-hinweis")).toHaveCount(0);
  expect(fehler).toEqual([]);
});

test("Nach der Morgenroutine erscheint die Karte ebenfalls", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 15, 7, 30));
  await page.goto("/e2e/harness/index.html?isAdmin=0&termine=morgen");
  await expect(page.getByTestId("termine-morgen-hinweis")).toContainText("Morgen");
  await expect(page.getByTestId("termine-morgen-hinweis")).toContainText("Hilfeplangespräch");
});
