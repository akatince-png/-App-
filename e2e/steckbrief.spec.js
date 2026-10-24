import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Steckbrief im Profil (24.10., Vorlage Lernplattform-Profil): Bild/Name,
// Erfolge (Punkte · Abzeichen · Level), Fortschritt-Balken, Abzeichen.
test("Profil: Steckbrief zeigt Erfolge, Fortschritt und Abzeichen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.route("**/rest/v1/rpc/person_spielstand*", (r) =>
    r.fulfill({ json: [{ punkte_gesamt: 193, punkte_7_tage: 47, aktive_tage_7: 5, serie: 3, abzeichen: 2 }] })
  );
  await page.route("**/rest/v1/errungenschaften*", (r) =>
    r.fulfill({
      json: [
        { badge_key: "global_streak_7", erreicht_am: "2026-10-01T08:00:00Z" },
        { badge_key: "global_punkte_100", erreicht_am: "2026-09-28T08:00:00Z" },
      ],
    })
  );
  await page.goto("/e2e/harness/index.html#/profil");
  const steckbrief = page.locator("[data-steckbrief]").locator("..");
  await expect(steckbrief.getByText("Erfolge", { exact: true })).toBeVisible();
  await expect(steckbrief.getByText("193", { exact: true })).toBeVisible();
  await expect(steckbrief.getByText("Level", { exact: true })).toBeVisible();
  await expect(steckbrief.getByText("5 von 7")).toBeVisible();
  await expect(steckbrief.getByText("🔥 3 Tage am Stück")).toBeVisible();
  await expect(steckbrief.getByText("7 Tage am Stück (gesamt)")).toBeVisible();
  // Foto ändern bleibt als eigene Karte erhalten.
  await expect(page.getByRole("button", { name: "📷 Foto hinzufügen" })).toBeVisible();
  if (process.env.AKA_VORSCHAU) await steckbrief.screenshot({ path: "docs/steckbrief-vorschau.png" });
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
