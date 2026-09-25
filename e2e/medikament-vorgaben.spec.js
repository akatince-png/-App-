import { test, expect } from "@playwright/test";

// Neues Medikament (25.09.): startet als ADHS-Medikation, Tablette, täglich;
// Wechsel zu Hormone (z. B. TRT) schlägt Injektion 1× pro Woche vor.
test("Medikament: ADHS-Vorgabe, Hormone passt die Vorschläge an", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/medikamente");
  const gedrueckt = (name) => page.getByRole("button", { name, exact: true }).first();
  await expect(gedrueckt("ADHS-Medikation")).toHaveAttribute("aria-pressed", "true");
  await expect(gedrueckt("Tablette (oral)")).toHaveAttribute("aria-pressed", "true");
  await gedrueckt("Hormone").click();
  await expect(gedrueckt("Injektion")).toHaveAttribute("aria-pressed", "true");
  await expect(gedrueckt("Gel / Creme")).toBeVisible();
  await gedrueckt("Gel / Creme").click();
  await gedrueckt("Blutdruck").click();
  await expect(gedrueckt("Gel / Creme")).toHaveAttribute("aria-pressed", "true");
});
