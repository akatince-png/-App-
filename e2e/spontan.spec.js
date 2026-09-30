import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

// Spontan starten (30.09., Nutzerin): Knöpfe „Training“ und „Workflow“ auf
// der Startseite; Geplantes vorziehen oder spontan loslegen.
test("Training-Knopf: heutiges Training vorziehen, Plan starten, spontan Kettlebell", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.clock.setFixedTime(new Date(2026, 8, 30, 10, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&spontan=1#/home");
  await page.getByRole("button", { name: "Training starten" }).click();
  const a = page.locator("[data-training-auswahl]");
  await expect(a).toContainText("VORZIEHEN");
  await expect(a).toContainText("Laufen");
  await expect(a.getByRole("button", { name: /30-Min-Ganzkörper/ })).toBeVisible();
  await a.getByRole("button", { name: /Wiederholungen/ }).click();
  await page.getByLabel("Was machst du?").fill("Kettlebell-Swings");
  await page.getByRole("button", { name: "▶ Los geht's" }).click();
  const [[e]] = await aufrufe(page, "trainingHinzufuegen");
  expect(e).toMatchObject({ art: "Krafttraining", uebungen: [expect.objectContaining({ name: "Kettlebell-Swings", saetze: "3", wiederholungen: "15" })] });
  expect(fehler).toEqual([]);
});

test("Workflow-Knopf: geplanten Workflow vorziehen oder Spontan-Workflow mit offenem Ende", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 8, 30, 10, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&spontan=1#/home");
  await page.getByRole("button", { name: "Workflow starten" }).click();
  const a = page.locator("[data-workflow-auswahl]");
  await expect(a).toContainText("Deep Work");
  await expect(a).toContainText("geplant 14:00 Uhr");
  await a.getByRole("button", { name: /Spontan-Workflow/ }).click();
  await expect(page).toHaveURL(/#\/workflow$/);
  const k = page.locator("[data-spontan-workflow]");
  await k.getByRole("button", { name: "25 Min." }).click();
  await k.getByRole("button", { name: "Offenes Ende" }).click();
  await k.getByRole("button", { name: "▶ Jetzt starten" }).click();
  await expect(page.getByText("Offenes Ende · 25 Min. Arbeit / 5 Min. Pause")).toBeVisible();
  await expect(page.getByText(/Runde 1$/)).toBeVisible();
  await page.clock.runFor(120_000);
  await page.getByRole("button", { name: "✓ Fertig für heute" }).click();
  const v = await aufrufe(page, "aenderungVermerken");
  expect(v.at(-1)[0]).toMatchObject({ kategorie: "workflow", aktion: "erledigt" });
});

test("Workflow-Knopf: geplanten Workflow vorziehen startet ihn sofort", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 8, 30, 10, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&spontan=1#/home");
  await page.getByRole("button", { name: "Workflow starten" }).click();
  await page.locator("[data-workflow-auswahl]").getByRole("button", { name: /geplant 14:00/ }).click();
  await expect(page.getByText("Deep Work")).toBeVisible();
  await expect(page.getByText(/Runde 1\//)).toBeVisible();
});
