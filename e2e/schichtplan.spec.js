import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Schichtarbeit (25.09.): Zeit-Varianten, Schichtplan, "Heute anders".
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);
const heuteIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const ohneNetz = (f) => f.filter((x) => !x.includes("Failed to fetch"));

test("Startseite zeigt die heutige Schicht und den Wechsel morgen; 'Heute anders' setzt nur heute", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/home");
  const karte = page.getByRole("region", { name: "Heute im Schichtplan" });
  await expect(karte).toContainText("HEUTE · 🌅 FRÜHSCHICHT");
  await expect(karte).toContainText("☀ Morgenroutine 04:30 · 🌙 Abendroutine 21:00");
  await expect(karte).toContainText("Morgen: 🌆 Spätschicht – Morgenroutine um 09:30");
  await karte.getByRole("button", { name: "Heute anders ›" }).click();
  await karte.getByRole("button", { name: "🌆 Spätschicht" }).click();
  expect(await aufrufe(page, "routineSchichtplanTagSetzen")).toEqual([[heuteIso(), { art: "variante", varianteId: "vs" }]]);
  const log = (await aufrufe(page, "aenderungVermerken")).at(-1)[0];
  expect(log).toMatchObject({ itemName: "Schichtplan", aktion: "geändert (nur dieser Tag)", detail: "Heute: Spätschicht statt Frühschicht" });
  expect(ohneNetz(fehler)).toEqual([]);
});

test("Ohne Varianten: keine Karte auf der Startseite, Einrichtung legt Früh/Spät/Frei mit einem Tipp an", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  await expect(page.getByRole("region", { name: "Heute im Schichtplan" })).toHaveCount(0);
  await page.goto("/e2e/harness/index.html?isAdmin=0#/schichtplan");
  await page.getByRole("button", { name: "Früh · Spät · Frei anlegen" }).click();
  const angelegt = await aufrufe(page, "routineVarianteSpeichern");
  expect(angelegt.map((a) => a[0].name)).toEqual(["Frühschicht", "Spätschicht", "Frei"]);
});

test("Schichtplan: Rhythmus wählen, einen Tag umschalten, speichern", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/schichtplan");
  await expect(page.getByRole("button", { name: "Frühschicht bearbeiten" })).toContainText("☀ 04:30 · 🌙 21:00");
  await page.getByRole("button", { name: "Wochenweise Früh ↔ Spät" }).click();
  const tage = page.locator("[data-plan-tag]");
  await expect(tage).toHaveCount(28);
  await expect(tage.nth(0)).toContainText("Früh");
  await expect(tage.nth(5)).toContainText("Frei");
  await expect(tage.nth(7)).toContainText("Spät");
  await tage.nth(8).click(); // Spät → Frei
  await expect(tage.nth(8)).toContainText("Frei");
  await page.getByRole("button", { name: "Plan speichern" }).click();
  const [[entwurf, von, bis]] = await aufrufe(page, "routineSchichtplanSpeichern");
  expect(entwurf).toHaveLength(28);
  expect(entwurf[8].varianteId).toBe("vx");
  expect(entwurf[0].datum).toBe(von);
  expect(entwurf[27].datum).toBe(bis);
  await expect(page.getByRole("status")).toContainText("Plan gespeichert");
  expect(ohneNetz(fehler)).toEqual([]);
});

test("Schritt nur für Frühschicht anlegen", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&schicht=1#/schichtplan");
  await page.getByRole("textbox", { name: "Neuer Schritt" }).fill("Brotdose packen");
  await page.getByRole("button", { name: "nur 🌅 Frühschicht" }).click();
  await page.getByRole("button", { name: "Schritt hinzufügen" }).click();
  expect(await aufrufe(page, "routineSchrittHinzufuegen")).toEqual([["morgen", "Brotdose packen", 5, { nurVarianten: ["vf"], gueltigAb: null }]]);
});
