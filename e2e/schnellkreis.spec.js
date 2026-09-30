import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// Kreis-Schnellmenü (30.09., Vorschau): „⚡ Schnell“ in der Leiste.
test("Kreis-Menü: gewählter Kreis wird groß, Getränk/Nickerchen/Pre-Workout direkt eintragen, Training öffnet die Auswahl", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(2026, 8, 30, 10, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1&spontan=1&startvariante=b#/tagesplan");
  const leiste = page.locator("[data-bottomnav]");
  await leiste.getByRole("button", { name: "Schnell" }).click();
  const kreis = page.locator("[data-schnell-kreis]");
  await expect(kreis.getByRole("button", { name: "Nickerchen" })).toBeVisible();
  await kreis.getByRole("button", { name: "Nickerchen" }).click();
  await expect(kreis.getByRole("button", { name: "Nickerchen" })).toHaveAttribute("aria-pressed", "true");
  await kreis.getByRole("button", { name: "20 Min." }).click();
  expect((await aufrufe(page, "spontanSpeichern"))[0][0]).toMatchObject({ art: "nickerchen", dauerMin: 20 });
  await expect(kreis).toHaveCount(0, { timeout: 3000 });

  await leiste.getByRole("button", { name: "Schnell" }).click();
  await kreis.getByRole("button", { name: "Pre-Workout & Co." }).click();
  await kreis.getByRole("button", { name: "Pre-Workout", exact: true }).click();
  expect((await aufrufe(page, "spontanSpeichern"))[1][0]).toMatchObject({ art: "einnahme", name: "Pre-Workout" });
  await expect(kreis).toHaveCount(0, { timeout: 3000 });

  await leiste.getByRole("button", { name: "Schnell" }).click();
  await kreis.getByRole("button", { name: "Getränk" }).click();
  await kreis.getByRole("button", { name: "+330 ml" }).click();
  expect((await aufrufe(page, "hydrationHinzufuegen"))[0][0]).toBe(330);

  await page.waitForTimeout(1300);
  await leiste.getByRole("button", { name: "Schnell" }).click();
  await kreis.getByRole("button", { name: "Training" }).click();
  await kreis.getByRole("button", { name: "▶ Training öffnen" }).click();
  await expect(page).toHaveURL(/#\/home/);
  await expect(page.locator("[data-training-auswahl]")).toBeVisible();
  expect(fehler).toEqual([]);
});

// Zu früh abhaken (30.09.): Rückfrage, dann erst speichern.
test("Tagesplan: vor der geplanten Zeit abhaken fragt „Schon erledigt?“", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 8, 30, 7, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1#/tagesplan");
  await page.getByRole("button", { name: "Elvanse erledigt" }).click();
  const frage = page.locator("[data-frueh-frage]");
  await expect(frage).toContainText("erst um 08:00 Uhr geplant");
  await frage.getByRole("button", { name: "Noch nicht" }).click();
  await expect(frage).toHaveCount(0);
  await page.getByRole("button", { name: "Elvanse erledigt" }).click();
  await page.locator("[data-frueh-frage]").getByRole("button", { name: "Ja, erledigt" }).click();
  await expect(page.locator("[data-frueh-frage]")).toHaveCount(0);
});
