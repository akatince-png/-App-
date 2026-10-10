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

// Siri-Kurzbefehl (10.10.): akaapp…/?aka=<Satz> öffnet Aka und schickt den
// Satz ab; danach ist er aus der Adresse verschwunden.
test("Siri-Kurzbefehl: Satz aus der Adresse landet bei Aka", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?aka=Hab%20200%20ml%20Wasser%20getrunken#/home");
  await expect(page.getByText("Hab 200 ml Wasser getrunken").first()).toBeVisible();
  expect(page.url()).not.toContain("aka=");
});

test("Siri-Kurzbefehl: Coachees ohne Aka bekommen nichts", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&aka=Hallo#/home");
  await page.waitForTimeout(600);
  await expect(page.getByText("Hallo", { exact: true })).toHaveCount(0);
});
