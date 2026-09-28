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

test("selbst eintragen: mehrere Tage auf einmal, dann einzelnen Tag ändern", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 29, 12, 0)); // Di
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/kalender");
  await page.locator("[data-dienstplan-link]").click();
  await page.getByRole("button", { name: "✍️ Selbst eintragen" }).click();
  const sammel = page.locator("[data-dienstplan-sammel]");
  await sammel.getByRole("button", { name: "Mo–Fr" }).click();
  await sammel.getByLabel("Sammel von").fill("06:00");
  await sammel.getByLabel("Sammel bis").fill("14:00");
  await sammel.getByRole("button", { name: "Für 5 Tage eintragen" }).click();
  await sammel.getByRole("button", { name: "Sa + So" }).click();
  await sammel.getByRole("button", { name: "Frei" }).click();
  await sammel.getByRole("button", { name: "Für 2 Tage eintragen" }).click();
  // Einzelnen Tag ändern: Mittwoch Spätdienst.
  const mi = page.locator('[data-dienstplan-tag="2026-09-30"]');
  await mi.getByLabel("Dienst von").fill("14:00");
  await mi.getByLabel("Dienst bis").fill("22:00");
  await expect(mi).toContainText("Spätschicht");
  await page.getByRole("button", { name: "Übernehmen" }).click();
  await expect(page.getByText("Dienstplan übernommen")).toBeVisible();
  const [[tage]] = await aufrufe(page, "routineSchichtplanSpeichern");
  expect(tage.map((t) => t.varianteId)).toEqual(["vf", "vf", "vs", "vf", "vf", "vx", "vx"]);
});

test("geht auch ohne Foto (manuell) und vom Kalender aus", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 29, 12, 0)); // Di
  await page.goto("/e2e/harness/index.html?isAdmin=0#/kalender");
  await page.locator("[data-dienstplan-link]").click();
  await page.getByRole("button", { name: "✍️ Selbst eintragen" }).click();
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

test("geteilter Dienst: zwei Einsätze an einem Tag, per Hand und aus dem Foto", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 29, 12, 0)); // Di
  await page.addInitScript(() => {
    window.__ocrMock = ["11:00-14:00 17:00-21:00", "F", "", "", "", "", ""];
  });
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/dienstplan-foto");
  await page.locator("[data-dienstplan-datei]").setInputFiles({ name: "plan.png", mimeType: "image/png", buffer: PNG });
  const bild = page.locator("[data-dienstplan-bild]");
  const box = await bild.boundingBox();
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + Math.min(box.height - 2, 40), { steps: 3 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Zeiten lesen" }).click();

  // Aus dem Foto: Montag mit zwei Einsätzen und 3 Std. Pause.
  const mo = page.locator('[data-dienstplan-tag="2026-09-28"]');
  await expect(mo).toContainText("Pause 3 Std.");
  await expect(mo).toContainText("neu: Geteilter Dienst 11:00–21:00");
  // Nachkorrigieren per Hand: Dienstag (gelesen „F“) wird Doppelschicht 06–14 + 14–22.
  const di = page.locator('[data-dienstplan-tag="2026-09-29"]');
  await di.getByRole("button", { name: /weiterer Einsatz/ }).click();
  await di.getByLabel("Dienst von 2").fill("14:00");
  await di.getByLabel("Dienst bis 2").fill("22:00");
  // Mittwoch war nicht lesbar: per Hand Pflege mit unbezahlter Pause.
  const mi = page.locator('[data-dienstplan-tag="2026-09-30"]');
  await mi.getByRole("button", { name: "Dienst", exact: true }).click();
  await mi.getByLabel("Dienst von", { exact: true }).fill("07:00");
  await mi.getByLabel("Dienst bis", { exact: true }).fill("11:00");
  await mi.getByRole("button", { name: /weiterer Einsatz/ }).click();
  await expect(page.getByRole("button", { name: "Übernehmen" })).toBeDisabled();
  await mi.getByLabel("Dienst von 2").fill("14:00");
  await mi.getByLabel("Dienst bis 2").fill("18:00");
  await page.getByRole("button", { name: "Übernehmen" }).click();
  await expect(page.getByText("Dienstplan übernommen")).toBeVisible();

  const neu = (await aufrufe(page, "routineVarianteSpeichern")).map((a) => a[0].name);
  expect(neu).toEqual(["Geteilter Dienst 11:00–21:00", "Geteilter Dienst 06:00–22:00", "Geteilter Dienst 07:00–18:00"]);
  const kalender = (await aufrufe(page, "alltagSpeichern")).map((a) => [a[0].datum, a[0].titel, a[0].start, a[0].ende]);
  expect(kalender).toEqual([
    ["2026-09-28", "Dienst (1. Einsatz)", "11:00", "14:00"],
    ["2026-09-28", "Dienst (2. Einsatz)", "17:00", "21:00"],
    ["2026-09-29", "Dienst (1. Einsatz)", "06:00", "14:00"],
    ["2026-09-29", "Dienst (2. Einsatz)", "14:00", "22:00"],
    ["2026-09-30", "Dienst (1. Einsatz)", "07:00", "11:00"],
    ["2026-09-30", "Dienst (2. Einsatz)", "14:00", "18:00"],
  ]);
});
