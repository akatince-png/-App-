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

// Matrix ausbauen (07.10.): „Was ist es?“ beim Anlegen, Termin mit Tag + Uhrzeit,
// Fristen bis Monat/Jahr.
test("Matrix: Termin mit Tag und Uhrzeit anlegen, Fristen bis Jahresende", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  await expect(page.getByRole("group", { name: "Bis wann?" }).getByRole("button", { name: "Dieses Jahr" })).toBeVisible();
  await page.getByRole("group", { name: "Was ist es?" }).getByRole("button", { name: /Termin/ }).click();
  await page.getByLabel("Neue Aufgabe").fill("Zahnarzt");
  await page.getByLabel("Termin-Tag").fill("2026-10-02");
  await page.getByLabel("Termin-Uhrzeit").fill("15:30");
  await page.getByRole("button", { name: "＋ Dazu" }).click();
  const [[neu]] = await aufrufe(page, "matrixAufgabeSpeichern");
  expect(neu).toMatchObject({ titel: "Zahnarzt", art: "termin", geplantAm: "2026-10-02", uhrzeit: "15:30", frist: "2026-10-02" });
});

// Uhrzeit sichtbar + Erinnerung (24.10., Nutzerin: auf dem iPad war die
// Uhrzeit nur ein leeres Kästchen, Erinnerungen fehlten).
test("Matrix-Karte: Uhrzeit setzen; Erinnerung erst mit Uhrzeit möglich", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 8, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  await page.getByRole("button", { name: /Ordner sortieren/ }).click();
  const erinnern = page.getByRole("group", { name: "Erinnerung" });
  await expect(erinnern.getByRole("button", { name: "15 Min. vorher" })).toBeDisabled();
  await expect(erinnern.getByRole("button", { name: "Morgens um 8" })).toBeEnabled();
  await page.locator("[data-matrix-uhrzeit]").fill("10:00");
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ id: "m3", uhrzeit: "10:00" });
});

test("Matrix-Karte mit Uhrzeit: Zeitraum sichtbar, Erinnerung „15 Min. vorher“", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 8, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1&matrixzeit=1#/matrix");
  await page.getByRole("button", { name: /Ordner sortieren/ }).click();
  await expect(page.getByText("10:00–10:30 Uhr")).toBeVisible();
  await page.getByRole("group", { name: "Erinnerung" }).getByRole("button", { name: "15 Min. vorher" }).click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ id: "m3", uhrzeit: "10:00", erinnerung: "15" });
});

test("Kalender: Matrix-Aufgabe mit Uhrzeit erscheint als Block, abhaken möglich", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 8, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1&matrixzeit=1&kal=tag#/kalender");
  const block = page.locator('[data-block="matrix"]');
  await expect(block).toContainText("Ordner sortieren");
  await block.click();
  await page.locator("[data-block-details]").locator("..").getByRole("button", { name: "✓ Erledigt" }).click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ id: "m3" });
});

// Deadline immer abfragen (24.10.): erst nach einer Wahl lässt sich die
// Aufgabe anlegen – „Ohne Deadline“ ist eine bewusste Wahl, Datum frei wählbar.
test("Matrix: Deadline wird immer abgefragt", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  const dazu = page.getByRole("button", { name: "＋ Dazu" });
  await page.getByLabel("Neue Aufgabe").fill("Keller aufräumen");
  await expect(dazu).toBeDisabled();
  await expect(page.getByText("Bitte wählen", { exact: false })).toBeVisible();
  const frist = page.getByRole("group", { name: "Bis wann?" });
  await frist.getByRole("button", { name: "Ohne Deadline" }).click();
  await dazu.click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ titel: "Keller aufräumen", frist: null });

  await page.getByLabel("Neue Aufgabe").fill("Steuer abgeben");
  await expect(dazu).toBeDisabled();
  await frist.getByRole("button", { name: "📅 Datum" }).click();
  await expect(dazu).toBeDisabled();
  await page.getByLabel("Deadline-Datum").fill("2026-11-15");
  await dazu.click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ titel: "Steuer abgeben", frist: "2026-11-15" });
});

// ⭐ MIT (24.10.): in der Matrix-Karte markieren, höchstens drei am Tag.
test("Matrix: Aufgabe als MIT markieren", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  await page.getByRole("button", { name: /Steuerberater fragen/ }).click();
  await page.locator("[data-matrix-mit]").click();
  expect((await aufrufe(page, "matrixAufgabeSpeichern")).at(-1)[0]).toMatchObject({ id: "m4", mitAm: "2026-09-30" });
});

// Langzeit-Projekte (24.10.): Plan anlegen, Sessions der nächsten 2 Wochen
// als Matrix-Aufgaben einplanen, Überblick bei „Alle“.
test("Projekt: Plan anlegen und speichern", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 26, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1#/matrix");
  await page.getByRole("button", { name: "Steuer 2025", exact: true }).click();
  const editor = page.locator("[data-projekt-editor]");
  await editor.getByLabel("Projektziel").fill("Erklärung abgegeben");
  await editor.getByLabel("Projekt-Deadline").fill("2026-12-20");
  await editor.getByRole("group", { name: "Session-Tage" }).getByRole("button", { name: "Mo" }).click();
  await editor.getByRole("group", { name: "Session-Tage" }).getByRole("button", { name: "Do" }).click();
  await editor.getByLabel("Session-Uhrzeit").fill("18:00");
  await editor.getByRole("button", { name: "Plan speichern" }).click();
  const [[id, plan]] = await aufrufe(page, "projektPlanSpeichern");
  expect(id).toBe("p-steuer");
  expect(plan).toMatchObject({ ziel: "Erklärung abgegeben", deadline: "2026-12-20", sessionTage: ["Mo", "Do"], sessionUhrzeit: "18:00", sessionDauerMin: 45, sessionsZiel: 16 });
});

test("Projekt: nächste 2 Wochen einplanen, Überblick bei „Alle“", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 26, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&matrix=1&projektplan=1#/matrix");
  await expect(page.locator("[data-projekte-ueberblick]")).toBeVisible();
  await page.locator("[data-projekt-balken]").first().click();
  await page.locator("[data-projekt-einplanen]").click();
  const sessions = (await aufrufe(page, "matrixAufgabeSpeichern")).map((a) => a[0]).filter((a) => a.art === "projekt");
  expect(sessions.map((a) => a.geplantAm)).toEqual(["2026-10-26", "2026-10-29", "2026-11-02", "2026-11-05"]);
  expect(sessions[0]).toMatchObject({ titel: "Session: Steuer 2025", projektId: "p-steuer", uhrzeit: "18:00", dauerMin: 45, erinnerung: "15" });
});
