import { test, expect } from "@playwright/test";

// Druck/PDF mit Auswahl und Vorschau (28.09.): Standard „Nur Gesundheit“,
// Alltag nur, wenn gewählt.
test("Export: Auswahl → Vorschau; Gesundheit ohne Arbeit, Komplett mit Arbeit", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&alltag=1#/wochenuebersicht");
  await page.getByRole("button", { name: /Druck \/ PDF zusammenstellen/ }).click();
  await expect(page.locator('[data-export="auswahl"]')).toBeVisible();
  await page.getByRole("button", { name: /Vorschau ansehen/ }).click();
  const vorschau = page.locator("[data-export-vorschau]");
  await expect(vorschau).toContainText("Gesundheitsprotokoll");
  await expect(vorschau).toContainText("Krafttraining");
  await expect(vorschau).not.toContainText("Arbeit");
  await expect(vorschau).not.toContainText("Gitarre");

  await page.getByRole("button", { name: "‹ Auswahl ändern" }).click();
  await page.getByRole("button", { name: "🗓️ Kompletter Wochenplan" }).click();
  await page.getByRole("button", { name: /Vorschau ansehen/ }).click();
  await expect(vorschau).toContainText("Wochenplan");
  await expect(vorschau).toContainText("Arbeit");

  await page.getByRole("button", { name: "‹ Auswahl ändern" }).click();
  await page.locator('[data-export-gruppe="alltag"]').getByRole("button", { name: /Arbeit/ }).click();
  await page.getByRole("button", { name: /Vorschau ansehen/ }).click();
  await expect(vorschau).not.toContainText("💼 Arbeit");
  await expect(vorschau).toContainText("Gitarre");
});

test("Wochenplan zeigt Kalender-Einträge", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&alltag=1#/wochenuebersicht");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await expect(page.getByText("💼 Arbeit").first()).toBeVisible();
});
