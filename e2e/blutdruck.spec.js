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
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByText("Bitte den oberen Wert eintragen")).toBeVisible();
  await page.getByLabel("Oberer Wert (systolisch)").fill("80");
  await page.getByLabel("Unterer Wert (diastolisch)").fill("120");
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.getByText("Der obere Wert ist normalerweise größer")).toBeVisible();
  await page.getByLabel("Oberer Wert (systolisch)").fill("125");
  await page.getByLabel("Unterer Wert (diastolisch)").fill("82");
  await page.getByLabel("Puls").fill("70");
  await page.getByRole("button", { name: "Eintragen" }).click();
  await expect(page.locator("[data-blutdruck-gespeichert]")).toContainText("125/82 · Puls 70");
});
