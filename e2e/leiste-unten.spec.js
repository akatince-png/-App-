import { test, expect } from "@playwright/test";

// Design 2.0 (28.09.): feste Leiste unten – Heute · Plan · Aka · Fortschritt · Mehr.
test("Leiste unten führt zu den Hauptbereichen, Aka öffnet den Coach-Chat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/e2e/harness/index.html?isAdmin=0&beispiel=1#/home");
  const leiste = page.locator("[data-bottomnav]");
  await expect(leiste).toBeVisible();
  await expect(leiste.getByRole("button", { name: "Heute" })).toHaveAttribute("aria-current", "page");
  await leiste.getByRole("button", { name: "Plan" }).click();
  await expect(page).toHaveURL(/#\/tagesplan/);
  await expect(leiste.getByRole("button", { name: "Plan" })).toHaveAttribute("aria-current", "page");
  await leiste.getByRole("button", { name: "Mehr" }).click();
  await expect(page).toHaveURL(/#\/mehr/);
  await leiste.getByRole("button", { name: "Chat mit deinem Coach" }).click();
  await expect(page).toHaveURL(/#\/coach-chat/);
  await leiste.getByRole("button", { name: "Heute" }).click();
  await expect(page.locator("[data-spielen]")).toContainText("Tagesrätsel");
});

test("keine Leiste im Onboarding", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&onboarding=1");
  await page.waitForTimeout(800);
  await expect(page.locator("[data-bottomnav]")).toHaveCount(0);
});
