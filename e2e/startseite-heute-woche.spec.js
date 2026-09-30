import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// Startseite (30.09.): Tagesplan zum Abhaken, Wochen-Kalender, Ereignisse.
test("Startseite: Heute abhaken (mit Rückfrage bei zu früh), Woche mit spontanen Ereignissen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(2026, 8, 30, 6, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1&ereignisse=1&startvariante=b#/home");
  const heute = page.locator("[data-heute-plan]");
  await expect(heute).toBeVisible();
  await expect(heute.locator("[data-plastik-symbol]").first()).toBeVisible();
  // Elvanse ist um 08:00 geplant – um 06:00 fragt die App nach.
  await heute.getByRole("button", { name: "Elvanse erledigt" }).click();
  await expect(heute.locator("[data-frueh-frage]")).toBeVisible();
  await heute.getByRole("button", { name: "Noch nicht" }).click();
  await expect(heute.locator("[data-frueh-frage]")).toHaveCount(0);
  await heute.getByRole("button", { name: "Elvanse erledigt" }).click();
  await heute.getByRole("button", { name: "Ja, erledigt" }).click();
  expect((await aufrufe(page, "toggleHormonErledigt")).length).toBe(1);

  const woche = page.locator("[data-woche-karte]");
  await expect(woche).toContainText("Deine Woche");
  await expect(woche).toContainText("330 ml Kaffee");
  await expect(woche).toContainText("Nickerchen 20 Min.");
  await woche.getByRole("button", { name: "Kalender ›" }).click();
  await expect(page).toHaveURL(/#\/kalender/);
  await expect(page.locator('[data-block="ereignis"]').first()).toBeVisible();
  expect(fehler).toEqual([]);
});

test("Kreis: Getränk mit Art und Uhrzeit, Nickerchen von–bis", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(2026, 8, 30, 15, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1&startvariante=b#/home");
  const leiste = page.locator("[data-bottomnav]");
  const kreis = page.locator("[data-schnell-kreis]");
  await leiste.getByRole("button", { name: "Schnell" }).click();
  await kreis.getByRole("button", { name: "Getränk" }).click();
  await kreis.getByRole("button", { name: "Kaffee" }).click();
  await kreis.getByRole("button", { name: "+200 ml" }).click();
  expect((await aufrufe(page, "spontanSpeichern"))[0][0]).toMatchObject({ art: "getraenk", mengeMl: 200, name: "Kaffee" });
  await expect(kreis).toHaveCount(0, { timeout: 3000 });

  await leiste.getByRole("button", { name: "Schnell" }).click();
  await kreis.getByRole("button", { name: "Nickerchen" }).click();
  await kreis.getByLabel("Nickerchen von").fill("13:40");
  await kreis.getByLabel("Nickerchen bis").fill("14:05");
  await kreis.getByRole("button", { name: "Dazu" }).click();
  expect((await aufrufe(page, "spontanSpeichern"))[1][0]).toMatchObject({ art: "nickerchen", dauerMin: 25, uhrzeit: "13:40" });
});
