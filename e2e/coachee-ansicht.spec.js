import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Admin-Konto kann unter "Mehr" in die Coachee-Ansicht wechseln (23.09.)
// und von dort auch wieder zurück.
test("Admin schaltet auf Coachee-Ansicht und zurück", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await nav.getByRole("button", { name: "Mehr" }).click();
  await expect(nav.getByRole("button", { name: "Admin" })).toBeVisible();

  await page.getByRole("button", { name: /Als Coachee nutzen/ }).click();
  await expect(page.getByRole("button", { name: /Zurück zur Admin-Ansicht/ })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Admin-Dashboard" })).toHaveCount(0);

  await page.getByRole("button", { name: /Zurück zur Admin-Ansicht/ }).click();
  await expect(nav.getByRole("button", { name: "Admin" })).toBeVisible();
  expect(fehler).toEqual([]);
});

test("Normale Coachees sehen keinen Ansicht-Umschalter", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Mehr" }).click();
  await expect(page.getByText("Sprache", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Als Coachee nutzen/ })).toHaveCount(0);
});
