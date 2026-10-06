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

test("Abendfenster: Starten führt in die Abendroutine, am Ende „Gute Nacht“ mit Sternen", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 7, 21, 40) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1&abend=1#/home");
  const fenster = page.locator("[data-morgenfenster]");
  await expect(fenster).toContainText("Ein guter Morgen beginnt am Abend davor.");
  await fenster.locator("[data-morgenfenster-start]").click();
  for (let i = 0; i < 8; i++) {
    const weiter = page.getByRole("button", { name: /^(Schritt fertig|Schon geatmet – weiter|Heute überspringen)$/ }).first();
    if (!(await weiter.isVisible().catch(() => false))) break;
    await weiter.click();
  }
  await expect(page.locator("[data-gute-nacht]")).toContainText("Gute Nacht 🌙");
});

// „Als Nächstes“ (06.10.): nach „Aufgeladen“ kündigt ein Fenster die nächste
// Tätigkeit an; Abhaken springt zum folgenden Punkt.
test("Als Nächstes: nach der Morgenroutine kommt die nächste Tätigkeit", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 7, 7, 10) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1&morgen=1#/home");
  await page.locator("[data-morgenfenster-start]").click();
  const abJetzt = page.getByRole("button", { name: "Ab jetzt" });
  if (await abJetzt.isVisible()) await abJetzt.click();
  for (let i = 0; i < 6; i++) {
    const w = page.getByRole("button", { name: /^(Schritt fertig|Schon geatmet – weiter)$/ }).first();
    if (!(await w.isVisible().catch(() => false))) break;
    await w.click();
  }
  await page.getByRole("button", { name: "Los in den Tag" }).click();
  const fenster = page.locator("[data-naechster-schritt]");
  await expect(fenster).toContainText("ALS NÄCHSTES");
  // Im Harness speichert Abhaken nichts (Mock) – hier nur: Knopf da, Liste „Danach“ da.
  await expect(fenster.locator('[data-naechster-knopf="erledigt"]')).toBeVisible();
  await expect(fenster.locator("[data-naechster-danach]")).toContainText("Wäsche machen");
  await fenster.getByRole("button", { name: "Später" }).click();
  await expect(fenster).toHaveCount(0);
});

test("Workflow aus „Als Nächstes“: Seite zeigt „Steht jetzt an“ und startet erst auf Tipp", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("mp-workflow-start", "anstehend:wp1"));
  await page.goto("/e2e/harness/index.html?isAdmin=0&spontan=1#/workflow");
  const karte = page.locator("[data-workflow-anstehend]").locator("..");
  await expect(karte).toContainText("Deep Work");
  await expect(karte).toContainText("50 Min. Arbeit · 10 Min. Pause");
  await karte.getByRole("button", { name: "▶ Jetzt starten" }).click();
  await expect(page.locator("[data-workflow-anstehend]")).toHaveCount(0);
});
