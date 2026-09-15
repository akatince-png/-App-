import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Alle 11 Reiter unter "Alle Pläne" (PlaeneView.jsx) durchklicken — die 10
// Kategorien aus PLAENE_TABS plus Wochenübersicht. Ziel: jede Kategorie-
// Ansicht rendert ohne Absturz mit den (leeren) Mock-Daten.
const PLAENE_LABELS = [
  "Morgen",
  "Abend",
  "Schlaf",
  "Hydration",
  "Tageslicht",
  "Bildschirmzeit",
  "Ernährung",
  "Training",
  "Supplemente",
  "Medikamente",
  "Wochenübersicht",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/harness/index.html");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Pläne" }).click();
});

for (const label of PLAENE_LABELS) {
  test(`Pläne-Reiter "${label}" rendert ohne Konsolenfehler`, async ({ page }) => {
    const fehler = sammleKonsolenfehler(page);
    // Der Reiter-Button steht in der "Pläne"-Karte, könnte aber mit
    // gleichnamigem Text an anderer Stelle der Seite kollidieren — daher
    // exact und auf die Karte mit den anderen Reitern beschränkt.
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(150); // fadeInUp-Remount, siehe AuthenticatedApp.jsx/PlaeneView.jsx
    expect(fehler).toEqual([]);
  });
}
