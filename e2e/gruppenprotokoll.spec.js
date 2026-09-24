import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Gruppenprotokolle (24.09.): Team-Seite, Startseite, Admin-Formular.
test("Team-Seite zeigt das Gruppenprotokoll mit Quest, Heute und letzten Tagen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.route("**/rest/v1/rpc/team_*", (r) => r.fulfill({ json: [] }));
  await page.goto("/e2e/harness/index.html?team=1&gruppe=1#/team");
  await expect(page.getByText("📋 Gruppenprotokoll")).toBeVisible();
  await expect(page.getByText("21 Tage Morgenroutine")).toBeVisible();
  await expect(page.getByText("Tag 4 von 21")).toBeVisible();
  await expect(page.getByText("🎯 Gemeinsam 10× Morgenroutine: 3 / 10", { exact: false })).toBeVisible();
  await expect(page.getByText("dein Beitrag: 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "10 Min. frische Luft erledigt" })).toBeVisible();
  await expect(page.getByText("Die letzten Tage")).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Startseite: offene Gruppen-Gewohnheit unter Als Nächstes und Gruppen-Quest-Karte", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?team=1&gruppe=1");
  await expect(page.getByText("🌱 10 Min. frische Luft").first()).toBeVisible();
  await expect(page.getByText("🎯 Gruppen-Quest")).toBeVisible();
  await expect(page.getByText("3 / 10 – dein Beitrag: 1", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Admin → Teams: Gruppenprotokoll-Formular mit Bausteinen und Quest", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.route("**/rest/v1/rpc/admin_liste_probanden*", (r) => r.fulfill({ json: [] }));
  await page.route("**/rest/v1/rpc/team_mitglieder_statistik*", (r) => r.fulfill({ json: [] }));
  await page.route("**/rest/v1/teams*", (r) => r.fulfill({ json: [{ id: "t1", name: "Team Sonne", erstellt_am: new Date().toISOString() }] }));
  await page.route("**/rest/v1/gruppenprotokolle*", (r) => r.fulfill({ json: [] }));
  await page.goto("/e2e/harness/index.html#/admin-teams");
  await page.getByRole("button", { name: "+ Gruppenprotokoll" }).click();
  await expect(page.getByText("+ Neues Gruppenprotokoll")).toBeVisible();
  const starten = page.getByRole("button", { name: "Gruppenprotokoll starten" });
  await expect(starten).toBeDisabled();
  await page.getByPlaceholder("z. B. 21 Tage Morgenroutine").fill("Testprotokoll");
  await expect(starten).toBeEnabled();
  await page.getByPlaceholder("z. B. Gemeinsam 40× Morgenroutine").fill("Gemeinsam 20×");
  await expect(starten).toBeDisabled(); // Quest ohne Zielzahl
  await page.getByPlaceholder("Ziel, z. B. 40").fill("20");
  await expect(starten).toBeEnabled();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
