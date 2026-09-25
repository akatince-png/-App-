import { test, expect } from "@playwright/test";

// Atem-Routine + Kontext-Tagebuch (25.09.).
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Atem: Übungen mit 'wofür', geführter Start fragt Stimmung, feste Zeit anlegen", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/atemuebungen");
  for (const n of ["Seufzer-Atmung", "Box-Atmung", "Gleichmäßig atmen", "Energie-Atmung", "Ruhig werden"]) {
    await expect(page.getByRole("button", { name: `${n} starten` })).toBeVisible();
  }
  await page.getByRole("button", { name: "+ Feste Zeit hinzufügen" }).click();
  await page.getByRole("button", { name: "Zeit speichern" }).click();
  expect(await aufrufe(page, "atemZeitSpeichern")).toEqual([[{ uhrzeit: "12:30", uebungKey: "seufzer", dauerMinuten: 3 }]]);
  await page.getByRole("button", { name: "Energie-Atmung starten" }).click();
  await expect(page.getByRole("group", { name: "Stimmung vorher" })).toBeVisible();
  await expect(page.getByText("nie im Wasser oder am Steuer")).toBeVisible();
});

test("Atem: feste Zeit steht auf der Startseite unter 'Als Nächstes'", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 7, 5));
  await page.goto("/e2e/harness/index.html?isAdmin=0&atem=1#/home");
  await expect(page.getByText("🌬️ Atem-Pause").first()).toBeVisible();
  await expect(page.getByText("Energie-Atmung · 2 Min.").first()).toBeVisible();
});

test("Tagebuch: Abend-Karte ab 17 Uhr, speichert Stimmung und Ort, Notiz standardmäßig privat", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 20, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  const karte = page.getByRole("region", { name: "Wie war dein Tag?" });
  await expect(karte).toBeVisible();
  await karte.getByRole("button", { name: "gut", exact: true }).click();
  await karte.getByRole("button", { name: "🌳 Natur / draußen" }).click();
  await karte.getByRole("button", { name: "Freunde" }).click();
  await karte.getByRole("button", { name: "Fertig" }).click();
  const [[e]] = await aufrufe(page, "tagebuchSpeichern");
  expect(e).toMatchObject({ datum: "2026-09-25", stimmung: 4, orte: ["🌳 Natur / draußen"], personen: ["Freunde"], notizTeilen: false });
  await expect(page.getByRole("status")).toContainText("Danke");
});

test("Tagebuch: vor 17 Uhr keine Karte; Seite zeigt Muster ab 14 Einträgen", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 11, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&tagebuch=1#/home");
  await expect(page.getByRole("region", { name: "Wie war dein Tag?" })).toHaveCount(0);
  await page.goto("/e2e/harness/index.html?isAdmin=0&tagebuch=1#/tagebuch");
  await expect(page.locator('[data-muster="draussen30"]')).toContainText("gut");
  await expect(page.locator('[data-muster="essen:viel Zucker"]')).toBeVisible();
  await expect(page.getByText("Größter Unterschied")).toBeVisible();
});
