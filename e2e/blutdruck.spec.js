import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Blutdruck-Protokoll (11.10.) im Bereich „Blutzucker & Blutdruck“.
test("Blutdruck: Liste und Durchschnitt", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?blutdruck=1#/blutzucker");
  await expect(page.locator("[data-blutdruck]")).toBeVisible();
  await expect(page.locator("[data-blutdruck-eintrag]")).toHaveCount(2);
  // Neueste zuerst.
  await expect(page.locator("[data-blutdruck-eintrag]").first()).toContainText("130/84");
  await expect(page.locator("[data-blutdruck-schnitt]")).toContainText("125/82");
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Blutdruck: Eingabe wird geprüft und eingetragen", async ({ page }) => {
  await page.goto("/e2e/harness/index.html#/blutzucker");
  await page.getByRole("button", { name: "Blutdruck eintragen" }).click();
  await expect(page.getByText("Bitte den oberen Wert eintragen")).toBeVisible();
  await page.getByLabel("Oberer Wert (systolisch)").fill("80");
  await page.getByLabel("Unterer Wert (diastolisch)").fill("120");
  await page.getByRole("button", { name: "Blutdruck eintragen" }).click();
  await expect(page.getByText("Der obere Wert ist normalerweise größer")).toBeVisible();
  await page.getByLabel("Oberer Wert (systolisch)").fill("125");
  await page.getByLabel("Unterer Wert (diastolisch)").fill("82");
  await page.getByLabel("Puls").fill("70");
  await page.getByRole("button", { name: "Blutdruck eintragen" }).click();
  await expect(page.locator("[data-blutdruck-gespeichert]")).toContainText("125/82 · Puls 70");
});

// Blutzucker-Protokoll (11.10.) im selben Bereich.
test("Blutzucker: Liste, Durchschnitt nüchtern und mmol/l", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?blutdruck=1#/blutzucker");
  await expect(page.locator("[data-blutzucker-eintrag]")).toHaveCount(2);
  await expect(page.locator("[data-blutzucker-eintrag]").first()).toContainText("138 mg/dl");
  await expect(page.locator("[data-blutzucker-schnitt]")).toContainText("92 mg/dl");
  await page.getByRole("group", { name: "Einheit" }).getByRole("button", { name: "mmol/l" }).click();
  await expect(page.locator("[data-blutzucker-eintrag]").first()).toContainText("7,7 mmol/l");
});

test("Blutzucker: Eingabe mit Zeitpunkt", async ({ page }) => {
  await page.goto("/e2e/harness/index.html#/blutzucker");
  await page.getByRole("button", { name: "Blutzucker eintragen" }).click();
  await expect(page.getByText("Bitte den Wert eintragen")).toBeVisible();
  await page.getByLabel("Blutzuckerwert").fill("104");
  await page.getByRole("group", { name: "Zeitpunkt der Messung" }).getByRole("button", { name: "Vor dem Essen" }).click();
  await page.getByRole("button", { name: "Blutzucker eintragen" }).click();
  await expect(page.locator("[data-blutzucker-gespeichert]")).toContainText("104 mg/dl · Vor dem Essen");
});
