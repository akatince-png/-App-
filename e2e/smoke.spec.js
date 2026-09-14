import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Smoke-Tests gegen die echte App-Oberfläche (siehe e2e/harness/), ohne
// echtes Supabase/echte Auth. Ziel: nichts stürzt beim Navigieren ab, die
// wichtigsten Screens rendern etwas Sinnvolles. Keine tiefen
// Daten-Assertions — dafür bräuchte es echte Fixture-Daten je Screen.

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/harness/index.html");
});

test("Home lädt ohne Konsolenfehler", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await expect(page.getByText("Tagebuch")).toBeVisible();
  expect(fehler).toEqual([]);
});

test("Navigation über die Seitenleiste: Archiv, Mehr, Admin, zurück zu Home", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });

  await nav.getByRole("button", { name: "Archiv" }).click();
  await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();

  await nav.getByRole("button", { name: "Mehr" }).click();
  await nav.getByRole("button", { name: "Admin" }).click();
  await expect(page.getByText("Admin", { exact: false }).first()).toBeVisible();

  await nav.getByRole("button", { name: "Home" }).click();
  await expect(page.getByText("Tagebuch")).toBeVisible();

  expect(fehler).toEqual([]);
});

test("Tagesplan ist über die Seitenleiste erreichbar", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Tagesplan" }).click();
  await page.waitForTimeout(200); // Remount-Übergangsanimation (fadeInUp), siehe AuthenticatedApp.jsx
  expect(fehler).toEqual([]);
});

test("Tagebuch-Modal öffnet und lässt sich per Escape schließen (Barrierefreiheits-Regressionstest)", async ({ page }) => {
  await page.getByText("Tagebuch").click();
  const textarea = page.getByPlaceholder("Schreib frei drauflos, oder tippe auf das Mikrofon…");
  await expect(textarea).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(textarea).toBeHidden();
});
