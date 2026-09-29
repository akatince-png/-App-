import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Die Harness hat kein echtes Supabase – Ranglisten-Abfragen der Startseite
// scheitern dort mit "Failed to fetch" (wie in schichtplan.spec.js).
const ohneNetz = (f) => f.filter((x) => !x.includes("Failed to fetch"));

// Gemeinsam fokussieren / Body Doubling (27.09.): sehen, wer dabei ist,
// Ziel setzen, Runde läuft mit Ring, danach "Wie lief's?" mit Belohnung.
test("Gemeinsam fokussieren: Team sehen, starten, Zeit um, Ergebnis eintragen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const heute = new Date();
  await page.clock.install({ time: new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 10, 0) });
  await page.goto("/e2e/harness/index.html?fokus=1&isAdmin=0#/tagesplan");
  // Tagesplan (seit 29.09., vorher Startseite): Karte, weil Anna und Jonas gerade fokussieren.
  const karte = page.locator("[data-fokus-karte]");
  await expect(karte).toContainText("Jonas und Anna fokussieren gerade");
  await karte.click();

  await expect(page.getByText("👥 Gerade dabei")).toBeVisible();
  await expect(page.locator("[data-fokus-dabei]")).toHaveCount(2);
  await expect(page.locator("[data-fokus-dabei]").filter({ hasText: "Anna" })).toContainText("Bewerbung fertig schreiben");
  await expect(page.locator("[data-fokus-dabei]").filter({ hasText: "Jonas" })).toContainText("fokussiert still");
  await expect(page.getByText("🌟 Heute im Team geschafft")).toBeVisible();

  await page.getByPlaceholder("z. B. Steuerunterlagen sortieren").fill("Belege in einen Stapel");
  await page.getByRole("button", { name: "15 Min." }).click();
  await page.getByRole("button", { name: "▶ Los geht's (15 Min.)" }).click();
  const laeuft = page.locator("[data-fokus-laeuft]");
  await expect(laeuft).toContainText("Belege in einen Stapel");
  await expect(laeuft).toContainText(/1[45]:\d\d/);

  // Zeit vorspulen → "Wie lief's?"
  await page.clock.fastForward("15:30");
  const frage = page.locator("[data-fokus-frage]");
  await expect(frage).toContainText("Zeit um! Wie lief's?");
  await frage.getByRole("button", { name: "🌓 Ein Stück weit" }).click();
  await expect(page.locator("[data-fokus-fertig]")).toContainText("+1 Punkt");
  // Das eigene Ergebnis steht jetzt bei "Heute im Team geschafft".
  await expect(page.getByText("Belege in einen Stapel")).toBeVisible();
  expect(ohneNetz(fehler)).toEqual([]);
});

test("Gemeinsam fokussieren: ohne Team trotzdem allein nutzbar, Kachel auf der Startseite", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  await expect(page.locator("[data-fokus-karte]")).toHaveCount(0);
  // Schlichte Startseite (29.09.): Spielen → Gemeinsam fokussieren.
  await page.locator("[data-schnellknoepfe]").getByRole("button", { name: "Spielen", exact: true }).click();
  await page.locator("[data-spiele-auswahl]").getByRole("button", { name: /Gemeinsam fokussieren/ }).click();
  await expect(page.getByText("Woran arbeitest du?")).toBeVisible();
  await expect(page.getByText("👥 Gerade dabei")).toHaveCount(0);
  await page.getByRole("button", { name: "▶ Los geht's (25 Min.)" }).click();
  await expect(page.locator("[data-fokus-laeuft]")).toContainText("Deine Sache");
  expect(ohneNetz(fehler)).toEqual([]);
});
