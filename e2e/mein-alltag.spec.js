import { test, expect } from "@playwright/test";

// Kalender „Mein Alltag“ (28.09.).
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Kalender ist für alle da, auch ohne Programm (seit 28.09.)", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/kalender");
  await expect(page.locator('[data-kalender="woche"]')).toBeVisible();
});

test("Woche, Tag, Monat; Eintrag mit eigenem Bereich anlegen; Alltags-Eintrag abhaken", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&alltag=1#/kalender");
  await expect(page.locator('[data-kalender="woche"]')).toBeVisible();
  await expect(page.getByText("Kita abholen").first()).toBeVisible();
  await expect(page.getByText("Sauna").first()).toBeVisible();

  await page.getByRole("button", { name: /\+ Eintrag/ }).click();
  await page.getByRole("button", { name: "🛁 Me-Time" }).click();
  await page.getByPlaceholder(/Staubsaugen/).fill("Lesen");
  await page.getByRole("button", { name: "So", exact: true }).click();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  const gespeichert = await aufrufe(page, "alltagSpeichern");
  expect(gespeichert.at(-1)[0]).toMatchObject({ bereich: "metime", titel: "Lesen", start: "10:00", ende: "10:45", wochentage: ["Mi", "So"] });

  await page.getByRole("button", { name: /\+ Eintrag/ }).click();
  await page.getByRole("button", { name: "+ Eigener Bereich" }).click();
  await page.getByPlaceholder(/Kinder, Ehrenamt/).fill("Ehrenamt");
  await page.getByRole("button", { name: "Symbol 🙏" }).click();
  await page.getByRole("button", { name: "Bereich anlegen" }).click();
  expect((await aufrufe(page, "alltagBereichAnlegen")).at(-1)[0]).toEqual({ name: "Ehrenamt", icon: "🙏" });
  await page.getByRole("button", { name: "Schließen" }).click();

  await page.getByRole("button", { name: "Tag", exact: true }).click();
  await page.locator('[data-block="alltag"]').filter({ hasText: "Arbeit" }).click();
  await expect(page.locator("[data-block-details]")).toContainText("08:30–16:30");
  await page.getByRole("button", { name: "✓ Erledigt" }).click();
  expect((await aufrufe(page, "alltagAbhaken")).at(-1)).toEqual([1, "2026-10-28"]);

  await page.getByRole("button", { name: "Monat", exact: true }).click();
  await expect(page.getByText("Oktober 2026")).toBeVisible();
});

test("Pläne: Einstieg „Mein Alltag“", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/hydration");
  await expect(page.getByText("Mein Alltag (Kalender)")).toBeVisible();
});
