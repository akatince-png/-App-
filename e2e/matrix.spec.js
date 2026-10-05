import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// Aufgaben-Matrix (30.09., Vorschau): im Workflow-Bereich, Farbe von selbst,
// Rot und heute eingeplantes Grün erscheinen im Tagesplan.
test("Matrix: vom Workflow-Kasten erreichbar, Aufgaben in vier Farbfeldern, neue Aufgabe landet von selbst richtig", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/routinen");
  await page.locator("[data-matrix-oeffnen]").click();
  await expect(page).toHaveURL(/#\/matrix$/);
  await expect(page.locator('[data-quadrant="jetzt"]')).toContainText("Antrag abschicken");
  await expect(page.locator('[data-quadrant="jetzt"]')).toContainText("Belege fotografieren");
  await expect(page.locator('[data-quadrant="planen"]')).toContainText("Ordner sortieren");
  await expect(page.locator('[data-quadrant="kurz"]')).toContainText("Mail an Vermieter");
  await expect(page.locator('[data-quadrant="spaeter"]')).toContainText("Alte Quittungen scannen");

  await page.getByLabel("Neue Aufgabe").fill("Steuerportal öffnen");
  await page.getByRole("button", { name: "Heute" }).first().click();
  await expect(page.locator("[data-matrix-vorschau]")).toHaveAttribute("data-matrix-vorschau", "jetzt");
  await page.getByRole("button", { name: "＋ Dazu" }).click();
  const [[neu]] = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(neu).toMatchObject({ titel: "Steuerportal öffnen", wichtig: true, frist: "2026-09-30" });

  // Karte öffnen: mehrfach verschoben → freundlicher Hinweis, Feld selbst wählen bleibt.
  await page.getByRole("button", { name: /Ordner sortieren/ }).click();
  await expect(page.locator("[data-matrix-verschoben]")).toContainText("3× verschoben");
  await page.getByRole("group", { name: "Feld wählen" }).getByRole("button", { name: /JETZT/ }).click();
  const liste = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(liste.at(-1)[0]).toMatchObject({ id: "m3", quadrantManuell: "jetzt" });
  expect(fehler).toEqual([]);
});

test("Tagesplan: nur Rot und heute eingeplantes Grün aus der Matrix", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/tagesplan");
  const k = page.locator("[data-matrix-heute]");
  await expect(k).toContainText("Antrag abschicken");
  await expect(k).toContainText("Schuhkarton mit Belegen holen");
  await expect(k).toContainText("Ordner sortieren");
  await expect(k).not.toContainText("Mail an Vermieter");
  await expect(k).not.toContainText("Steuerberater fragen");
  await k.getByRole("button", { name: "Antrag abschicken erledigt" }).click();
  const [[a]] = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(a.id).toBe("m1");
  expect(a.erledigtAm).toBeTruthy();
});

// 05.10. (Nutzerin): Aufgaben von Feld zu Feld verschieben – antippen, dann „hierher“.
test("Matrix: Aufgabe antippen und per „hierher“ in ein anderes Feld verschieben", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  await page.locator('[data-quadrant="kurz"]').getByRole("button", { name: /Mail an Vermieter/ }).click();
  await expect(page.locator('[data-matrix-hierher="kurz"]')).toHaveCount(0);
  await page.locator('[data-matrix-hierher="planen"]').click();
  const liste = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(liste.at(-1)[0]).toMatchObject({ titel: "Mail an Vermieter", quadrantManuell: "planen" });
});

// 05.10. (Nutzerin): Spontan-Workflow mit einer Aufgabe aus der Matrix, danach „erledigt?“.
test("Workflow: Aufgabe aus der Matrix wählen, starten, danach als erledigt abhaken", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/workflow");
  const box = page.locator("[data-spontan-workflow]");
  await box.locator("[data-matrix-wahl]").getByRole("button", { name: /Antrag abschicken/ }).click();
  await box.getByRole("button", { name: "▶ „Antrag abschicken“ starten" }).click();
  await page.getByRole("button", { name: "✓ Fertig für heute" }).click();
  await expect(page.locator("[data-matrix-erledigt-frage]")).toContainText("Antrag abschicken");
  await page.getByRole("button", { name: "✓ Ja, erledigt" }).click();
  const liste = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(liste.at(-1)[0]).toMatchObject({ id: "m1" });
  expect(liste.at(-1)[0].erledigtAm).toBeTruthy();
});
