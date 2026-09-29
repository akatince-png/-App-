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

// iPad quer (29.09., Nutzerin: „am iPad immer noch ohne Leiste“): auf
// Touch-Geräten auch ab 1024 px die Leiste unten statt der Seitenleiste;
// die früheren Kacheln unten auf Home stehen jetzt oben unter Mehr.
test.describe("iPad quer", () => {
  test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true });
  test("Leiste unten statt Seitenleiste, Kacheln unter Mehr", async ({ page }) => {
    await page.goto("/e2e/harness/index.html?beispiel=1#/home");
    await expect(page.locator("[data-bottomnav]")).toBeVisible();
    await expect(page.locator(".mp-app-sidebar")).toBeHidden();
    await expect(page.locator(".mp-ordner-grid")).toHaveCount(0);
    await page.locator("[data-bottomnav]").getByRole("button", { name: "Mehr" }).click();
    const schnell = page.locator("[data-mehr-schnellzugriff]");
    for (const name of [/Alle Pläne/, /Archiv/, /Tagebuch/, /Neues Protokoll/]) await expect(schnell.getByRole("button", { name })).toBeVisible();
    await schnell.getByRole("button", { name: /Alle Pläne/ }).click();
    await expect(page).toHaveURL(/#\/schlaf/);
  });
});

// iPad mit Pencil/Trackpad (29.09., Foto der Nutzerin: Seitenleiste trotz
// Umstellung): meldet „pointer: fine“, hat aber einen Touchscreen.
test.describe("iPad mit feinem Zeiger", () => {
  test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: false });
  test("trotzdem Leiste unten, keine Seitenleiste", async ({ page }) => {
    await page.goto("/e2e/harness/index.html?beispiel=1#/home");
    await expect(page.locator("html")).toHaveAttribute("data-touch", "1");
    await expect(page.locator("[data-bottomnav]")).toBeVisible();
    await expect(page.locator(".mp-app-sidebar")).toBeHidden();
  });
});
