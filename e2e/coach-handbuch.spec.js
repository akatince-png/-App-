import { test, expect } from "@playwright/test";

// Coach-Handbuch (28.09.): im Coach-Bereich erreichbar, Kapitel aufklappbar.
test("Coach-Handbuch: vom Dashboard erreichbar, Inhalt springt zum Kapitel", async ({ page }) => {
  await page.goto("/e2e/harness/index.html#/admin");
  await page.getByRole("button", { name: "📖 Handbuch" }).click();
  await expect(page.getByText("Alles, was du als Coach tust")).toBeVisible();
  await expect(page.locator("[data-kapitel]")).toHaveCount(15);
  await expect(page.getByRole("cell", { name: "Person allein" })).toBeVisible();
  await page.getByRole("button", { name: /Das Erstgespräch/ }).first().click();
  await expect(page.getByText(/Jede Änderung, die du speicherst, erscheint/)).toBeVisible();
  await expect(page.getByText(/112|Telefonseelsorge/i)).toHaveCount(0);
});

test("Coach-Handbuch: Coachee sieht es nicht", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/admin-handbuch");
  await expect(page.getByText("Alles, was du als Coach tust")).toHaveCount(0);
});
