import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Bild-Tagesplan + Timer-Ring (27.09., nach dem Marktvergleich mit Tiimo).
test("Bild-Tagesplan: Bilder, Dauer, Jetzt-Linie, Timer läuft in der Listenansicht weiter", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const heute = new Date();
  await page.clock.install({ time: new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 9, 40) });
  await page.goto("/e2e/harness/index.html?beispiel=1#/tagesplan");
  const plan = page.locator("[data-bild-tagesplan]");
  await expect(plan).toBeVisible();
  const waesche = page.locator('[data-bild-block^="g-"]').filter({ hasText: "Wäsche machen" });
  await expect(waesche).toContainText("🧺");
  await expect(waesche).toContainText("30 Min");
  // 9:40 liegt in "Wäsche 9:30–10:00" → dort steht die Jetzt-Linie.
  await expect(waesche.getByText("jetzt", { exact: true })).toBeVisible();
  await expect(page.locator('[data-bild-block="routine-morgen"]')).toContainText("Morgenroutine");
  await expect(page.getByText("Irgendwann heute")).toBeVisible();
  // Timer starten → Ring im Block und "läuft gerade" oben.
  await waesche.getByRole("button", { name: "Timer für Wäsche machen starten" }).click();
  await expect(page.locator("[data-fokus-timer]")).toContainText("Wäsche machen");
  await expect(page.locator("[data-fokus-timer]")).toContainText("noch 30 Min");
  // Liste bleibt erreichbar; dort steht der laufende Timer oben bei den
  // Tageshinweisen (seit 29.09. nicht mehr auf der schlichten Startseite).
  await page.getByRole("button", { name: "☰ Liste" }).click();
  await expect(plan).toHaveCount(0);
  await expect(page.locator("[data-fokus-timer]")).toContainText("LÄUFT GERADE");
  await page.locator("[data-fokus-timer]").getByRole("button", { name: "✓ Fertig" }).click();
  await expect(page.locator("[data-fokus-timer]")).toHaveCount(0);
  expect(fehler).toEqual([]);
});
