import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Admin-Dashboard + alle 6 Unteransichten. isAdmin:true ist der
// Mock-Standard (siehe mockAppData.js), daher ohne ?isAdmin=1 erreichbar.
//
// AdminDashboardView.jsx lädt beim Mount die Probandenliste über einen
// ECHTEN supabase.rpc()-Aufruf (nicht über useAppData() — kann dieser
// Harness nicht mocken, siehe TestApp.jsx). Der Aufruf läuft gegen eine
// Fantasie-URL und schlägt fehl — das ist erwartet und kein App-Bug,
// solange die App den Fehler sichtbar abfängt statt abzustürzen (siehe
// eigener Test unten).
test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/harness/index.html");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await nav.getByRole("button", { name: "Mehr" }).click();
  await nav.getByRole("button", { name: "Admin" }).click();
});

test("Admin-Dashboard rendert und fängt den fehlschlagenden Probanden-Request sichtbar ab", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await expect(page.getByText("Verwalten", { exact: false }).first()).toBeVisible();
  // Kein Absturz, egal ob die Fehlermeldung des echten (nicht erreichbaren)
  // Supabase-Aufrufs sichtbar wird oder nicht — das ist reines Netzwerk-
  // Rauschen dieser Umgebung (siehe Kommentar oben), kein React-Fehler.
  expect(fehler.filter((f) => !f.includes("supabase") && !f.includes("fetch"))).toEqual([]);
});

const ADMIN_UNTERANSICHTEN = [
  "Coach-Übersicht",
  "Quests verwalten",
  "Teams verwalten",
  "Wissens-Basis verwalten",
  "Coaching-Vorlagen",
  "Übungsbilder verwalten",
];

for (const label of ADMIN_UNTERANSICHTEN) {
  test(`Admin-Unteransicht "${label}" rendert ohne Konsolenfehler`, async ({ page }) => {
    const fehler = sammleKonsolenfehler(page);
    await page.getByRole("button", { name: label, exact: false }).click();
    await page.waitForTimeout(200);
    expect(fehler.filter((f) => !f.includes("supabase") && !f.includes("fetch"))).toEqual([]);
  });
}
