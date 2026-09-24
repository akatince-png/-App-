import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Denksport-Seite (24.09., Nutzerinnen-Entscheidung): alle sehen das
// Tagesrätsel, das freie Training mit Kategorie-Auswahl nur das Admin-Konto.
test("Denksport: Coachees sehen nur das Tagesrätsel", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?isAdmin=0#/denksport");
  await expect(page.getByText("Kurz das Gehirn aufwecken", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jetzt lösen" })).toBeVisible();
  await expect(page.getByText("Freies Training")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Allgemeinwissen/ })).toHaveCount(0);
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Denksport: Admin-Konto spielt frei eine Runde Rätsel", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");
  await page.getByRole("button", { name: /Denksport/ }).first().click();
  await expect(page.getByText("Freies Training")).toBeVisible();
  await page.getByRole("button", { name: /^🧩 Rätsel/ }).click();
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`Frage ${i} von 5`)).toBeVisible();
    await page.getByRole("group", { name: "Antworten" }).getByRole("button").first().click();
    await page.getByRole("button", { name: i < 5 ? "Weiter" : "Zur Auswertung" }).click();
  }
  await page.getByRole("button", { name: /Juhu, weiter/ }).click();
  await expect(page.getByRole("button", { name: "Noch eine Runde Rätsel" })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

// Tagesrätsel (24.09.): feste Tagesaufgabe mit 5 gemischten Fragen —
// als Tages-Quest und unter "Als Nächstes" auf Home, startet direkt.
test("Tagesrätsel: von Home aus starten und 5 Fragen lösen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");
  await expect(page.getByText("Tagesrätsel").first()).toBeVisible();
  await page.getByRole("button", { name: /Tagesrätsel/ }).first().click();
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`Frage ${i} von 5`)).toBeVisible();
    await page.getByRole("group", { name: "Antworten" }).getByRole("button").first().click();
    await page.getByRole("button", { name: i < 5 ? "Weiter" : "Zur Auswertung" }).click();
  }
  await expect(page.getByText("Tagesrätsel geschafft! 🧩")).toBeVisible();
  await page.getByRole("button", { name: /Juhu, weiter/ }).click();
  await expect(page.getByRole("button", { name: "Zurück zur Startseite" })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
