import { test, expect } from "@playwright/test";

// Hilfe-Hinweis (28.09.): nur bei eindeutigen Aussagen, in jedem Freitextfeld.
test("Coachee: eindeutige Aussage im Chat zeigt ruhig die Hilfsnummern, Alltagssprache nicht", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/coach-chat");
  const feld = page.locator("textarea, input[type=text]").last();
  await feld.waitFor();
  await feld.fill("Ich sterbe vor Hunger, das Training bringt mich um");
  await page.waitForTimeout(900);
  await expect(page.locator("[data-hilfe-hinweis]")).toHaveCount(0);
  await feld.fill("Ich will nicht mehr leben");
  const hinweis = page.locator("[data-hilfe-hinweis]");
  await expect(hinweis).toBeVisible();
  await expect(hinweis).toContainText("0800 111 0 111");
  await expect(hinweis.getByRole("link", { name: /112/ })).toHaveAttribute("href", "tel:112");
  await hinweis.getByRole("button", { name: "Schließen" }).click();
  await expect(hinweis).toHaveCount(0);
});

test("Coach-Ansicht: kein Hinweis beim Admin", async ({ page }) => {
  await page.goto("/e2e/harness/index.html#/coach-chat");
  const feld = page.locator("textarea, input[type=text]").last();
  await feld.waitFor();
  await feld.fill("Notiz: Suizidgedanken angesprochen");
  await page.waitForTimeout(900);
  await expect(page.locator("[data-hilfe-hinweis]")).toHaveCount(0);
});
