import { test, expect } from "@playwright/test";

// Design 2.0 Abendmodus (29.09.): ab der Abendroutine wird die App dunkel,
// abschaltbar unter Mehr → Aussehen. Tagsüber bleibt alles hell.
test("abends dunkel, unter Mehr abschaltbar", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-28T21:45:00") });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1#/mehr");
  await expect(page.locator("html")).toHaveAttribute("data-dunkel", "1");
  const schalter = page.getByRole("switch", { name: "Abends dunkel" });
  await expect(schalter).toHaveAttribute("aria-checked", "true");
  await schalter.click();
  await expect(schalter).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("html")).not.toHaveAttribute("data-dunkel", "1");
  await schalter.click();
  await expect(page.locator("html")).toHaveAttribute("data-dunkel", "1");
});

test("tagsüber hell", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-28T12:00:00") });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1#/home");
  await expect(page.locator("[data-home-kopf]")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-dunkel", "1");
});
