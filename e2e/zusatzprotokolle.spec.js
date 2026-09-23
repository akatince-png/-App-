import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Parallele Zusatzprotokolle (Nutzerinnen-Wunsch 23.09.): "Neues Protokoll"
// bietet neben "archivieren und neu beginnen" jetzt auch "parallel starten"
// an, ohne das laufende Hauptprotokoll anzufassen.

test("Neues Protokoll: parallel starten führt zum Zusatzprotokoll-Formular und danach zu den Plänen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();
  await expect(page.getByText("Neues Protokoll beginnen?")).toBeVisible();
  // Beide Wege stehen zur Wahl, der folgenlose zuerst.
  await expect(page.getByRole("button", { name: "Ja, archivieren und neu beginnen" })).toBeVisible();
  await page.getByRole("button", { name: "Zusatzprotokoll parallel starten" }).click();

  await expect(page.getByText("Zusatzprotokoll parallel starten")).toBeVisible();
  await expect(page.getByText("E2E-Testprotokoll", { exact: false })).toBeVisible();
  const starten = page.getByRole("button", { name: "Starten & Einträge hinzufügen" });
  await expect(starten).toBeDisabled();
  await page.getByPlaceholder("z. B. Magnesium abends testen").fill("Magnesium-Test");
  await starten.click();

  // Landet direkt bei den Supplementen, um Einträge anzulegen.
  await expect(page).toHaveURL(/#\/supplemente$/);
  expect(fehler).toEqual([]);
});

test("Pläne zeigen im Admin-Modus die Zusatzprotokolle-Karte", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Pläne" }).click();
  await expect(page.getByText("Zusatzprotokolle", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Parallel starten" })).toBeVisible();
  expect(fehler).toEqual([]);
});

test("Pläne zeigen Coachees keine Zusatzprotokolle-Karte", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Pläne" }).click();
  await expect(page.getByText("Deine aktiven Systeme")).toBeVisible();
  await expect(page.getByText("Zusatzprotokolle", { exact: true })).not.toBeVisible();
});
