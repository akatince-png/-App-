import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Kalender-Abo (24.10.): in „Mein Alltag“ einrichten, Apple-Link (webcal)
// und eigene Bereiche abwählbar.
test("Mein Alltag: Kalender-Abo einrichten", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const token = "a".repeat(64);
  let zeile = null;
  await page.route("**/rest/v1/kalender_abos*", async (r) => {
    const m = r.request().method();
    if (m === "POST") {
      zeile = { token, ohne_bereiche: [], abgerufen_am: null };
      return r.fulfill({ json: zeile });
    }
    if (m === "GET") return r.fulfill({ json: zeile });
    return r.fulfill({ json: zeile });
  });
  await page.goto("/e2e/harness/index.html?isAdmin=0#/kalender");
  await page.locator("[data-kalender-abo]").click();
  await page.getByRole("button", { name: "Kalender-Abo einrichten" }).click();
  const apple = page.locator("[data-kalender-abo-apple]");
  await expect(apple).toBeVisible();
  await expect(apple).toHaveAttribute("href", new RegExp(`^webcal://.*/functions/v1/kalender-abo\\?t=${token}$`));
  await expect(page.getByText("Medikamente, Supplemente, Werte und Notizen bleiben in der App", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
