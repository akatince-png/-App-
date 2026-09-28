import { test, expect } from "@playwright/test";

// Dienstplan abfotografieren (28.09.): Foto → Zeile markieren → Texterkennung
// auf dem Gerät (hier per window.__ocrMock) → prüfen → Schichtplan + Kalender.
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// 1×1-PNG als „Foto“.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test("Foto, Zeile markieren, Zeiten prüfen und übernehmen", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 1, 12, 0)); // Do, 01.10.2026
  await page.addInitScript(() => {
    window.__ocrMock = ["F", "S", "14:00-22:00", "X", "7.30 – 16.00", "frei", "K"];
  });
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/schichtplan");
  await page.locator("[data-dienstplan-link]").click();
  await expect(page.locator('[data-dienstplan-foto="start"]')).toBeVisible();
  await expect(page.locator("[data-dienstplan-start]")).toHaveValue("2026-09-28");
  await page.getByRole("button", { name: "Eine Woche später" }).click();
  await expect(page.locator("[data-dienstplan-start]")).toHaveValue("2026-10-05");

  await page.locator("[data-dienstplan-datei]").setInputFiles({ name: "plan.png", mimeType: "image/png", buffer: PNG });
  const bild = page.locator("[data-dienstplan-bild]");
  await expect(bild).toBeVisible();
  const box = await bild.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 5, box.y + Math.min(box.height - 2, 40), { steps: 4 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Zeiten lesen" }).click();

  const tabelle = page.locator("[data-dienstplan-tabelle]");
  await expect(tabelle).toBeVisible();
  await expect(page.locator('[data-dienstplan-tag="2026-10-05"]')).toContainText("Frühschicht");
  await expect(page.locator('[data-dienstplan-tag="2026-10-06"]')).toContainText("Spätschicht");
  await expect(page.locator('[data-dienstplan-tag="2026-10-09"]')).toContainText("neu: Frühdienst 07:30–16:00");
  // Korrektur: Sonntag doch Frei statt Krank.
  await page.locator('[data-dienstplan-tag="2026-10-11"]').getByRole("button", { name: "Frei" }).click();
  await page.getByRole("button", { name: "Übernehmen" }).click();

  await expect(page.getByText("Dienstplan übernommen")).toBeVisible();
  expect((await aufrufe(page, "routineVarianteSpeichern"))[0][0]).toMatchObject({ name: "Frühdienst 07:30–16:00", arbeitVon: "07:30", arbeitBis: "16:00" });
  const [[tage, von, bis]] = await aufrufe(page, "routineSchichtplanSpeichern");
  expect([von, bis]).toEqual(["2026-10-05", "2026-10-11"]);
  expect(tage.map((t) => t.varianteId || t.art)).toEqual(["vf", "vs", "vs", "vx", "e2e-mock-id", "vx", "vx"]);
  const kalender = (await aufrufe(page, "alltagSpeichern")).map((a) => a[0]);
  expect(kalender).toHaveLength(4);
  expect(kalender[0]).toMatchObject({ bereich: "arbeit", titel: "Dienst", datum: "2026-10-05", start: "06:00", ende: "14:00" });
});

test("geht auch ohne Foto (manuell) und vom Kalender aus", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 29, 12, 0)); // Di
  await page.goto("/e2e/harness/index.html?isAdmin=0#/kalender");
  await page.locator("[data-dienstplan-link]").click();
  await page.getByRole("button", { name: "✍️ Ohne Foto eintragen" }).click();
  const mo = page.locator('[data-dienstplan-tag="2026-09-28"]');
  await mo.getByRole("button", { name: "Dienst" }).click();
  await mo.getByLabel("Dienst von").fill("08:00");
  await expect(page.getByRole("button", { name: "Übernehmen" })).toBeDisabled();
  await mo.getByLabel("Dienst bis").fill("16:30");
  await page.getByRole("button", { name: "Übernehmen" }).click();
  await expect(page.getByText("Dienstplan übernommen")).toBeVisible();
  const [[tage]] = await aufrufe(page, "routineSchichtplanSpeichern");
  expect(tage).toHaveLength(1);
});
