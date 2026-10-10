import { test, expect } from "@playwright/test";

// Aka wie Siri (10.10.): „Starte meine Morgenroutine“ – Aka merkt sich den
// Wunsch (utils/routineStart.js) und öffnet die Startseite, die die
// Routine sofort startet. Der KI-Teil selbst läuft im Harness nicht.
test("Aka-Übergabe: Startseite startet die gewünschte Morgenroutine", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("aka-routine-start", "morgen"));
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=1#/home");
  const abJetzt = page.getByRole("button", { name: "Ab jetzt" });
  const weiter = page.getByRole("button", { name: /^(Schritt fertig|Schon geatmet – weiter)$/ }).first();
  await expect(abJetzt.or(weiter)).toBeVisible();
  // Nur einmal: nach dem Abholen ist der Wunsch weg.
  expect(await page.evaluate(() => sessionStorage.getItem("aka-routine-start"))).toBeNull();
});

test("Aka-Übergabe: Ereignis startet die Abendroutine auf offener Startseite", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1#/home");
  await expect(page.locator("[data-home-kopf]")).toBeVisible();
  await page.evaluate(() => {
    sessionStorage.setItem("aka-routine-start", "abend");
    window.dispatchEvent(new Event("aka-routine-starten"));
  });
  const abJetzt = page.getByRole("button", { name: "Ab jetzt" });
  const weiter = page.getByRole("button", { name: /^(Schritt fertig|Schon geatmet – weiter)$/ }).first();
  await expect(abJetzt.or(weiter)).toBeVisible();
});
