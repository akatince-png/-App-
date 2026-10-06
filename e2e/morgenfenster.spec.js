import { test, expect } from "@playwright/test";

// Morgenfenster (06.10., Nutzerin wählte Entwurf C): morgens groß „Einmal
// strecken – und los“, nicht wegtippbar; „Heute nicht“ fragt nach dem Grund.
// Am Ende der Morgenroutine: AKA-Gehirn in der Sonne „Aufgeladen!“.
test("Morgenfenster: Starten führt in die Routine, am Ende „Aufgeladen“", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 7, 7, 10) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=1&morgen=1#/home");
  const fenster = page.locator("[data-morgenfenster]");
  await expect(fenster).toBeVisible();
  await expect(fenster).toContainText("Einmal strecken – und los.");
  await fenster.locator("[data-morgenfenster-start]").click();
  await expect(fenster).toHaveCount(0);
  const abJetzt = page.getByRole("button", { name: "Ab jetzt" });
  if (await abJetzt.isVisible()) await abJetzt.click();
  for (let i = 0; i < 6; i++) {
    const weiter = page.getByRole("button", { name: /^(Schritt fertig|Schon geatmet – weiter)$/ }).first();
    if (!(await weiter.isVisible().catch(() => false))) break;
    await weiter.click();
  }
  await expect(page.locator("[data-aufgeladen]")).toContainText("Aufgeladen! ⚡");
});

test("Morgenfenster: „Heute nicht“ verlangt einen Grund und schließt dann", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 7, 7, 10) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=1&morgen=1#/home");
  const fenster = page.locator("[data-morgenfenster]");
  await fenster.getByRole("button", { name: "Heute nicht" }).click();
  const auslassen = fenster.locator("[data-morgenfenster-nicht]");
  await expect(auslassen).toBeDisabled();
  await fenster.getByRole("button", { name: "Verschlafen" }).click();
  await auslassen.click();
  await expect(fenster).toHaveCount(0);
  await expect(page.locator("[data-home-kopf]")).toBeVisible();
});
