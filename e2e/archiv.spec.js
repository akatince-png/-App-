import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Alle 8 Reiter im Archiv-Hub (PlanView.jsx) durchklicken.
const ARCHIV_LABELS = ["Protokolle", "Archiv", "Statistik", "Erfolge", "Tagebuch", "Profil", "Blutzucker", "Community"];

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/harness/index.html");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Archiv" }).click();
});

for (const label of ARCHIV_LABELS) {
  test(`Archiv-Reiter "${label}" rendert ohne Konsolenfehler`, async ({ page }) => {
    const fehler = sammleKonsolenfehler(page);
    // "Archiv" existiert doppelt (Seitenleiste + Reiter selbst) — der
    // Reiter steht im Content-Bereich, also nach dem Seitenleisten-<nav>
    // im DOM, .last() greift zuverlässig ihn statt den Seitenleisten-Knopf.
    await page.getByRole("button", { name: label, exact: true }).last().click();
    await page.waitForTimeout(150);
    expect(fehler).toEqual([]);
  });
}
