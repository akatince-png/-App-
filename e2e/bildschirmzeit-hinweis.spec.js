import { test, expect } from "@playwright/test";

// Hinweis (27.09., Nutzerinnen-Wunsch): wo man die echte Bildschirmzeit im Handy findet.
test("Bildschirmzeit: Hinweis, wo man die echte Zahl im Handy findet", async ({ page }) => {
  await page.goto("/e2e/harness/index.html#/bildschirmzeit");
  await expect(page.getByText(/Nachschauen statt schätzen: iPhone → Einstellungen → Bildschirmzeit/).first()).toBeVisible();
});
