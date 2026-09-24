import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Team-Seite, Team-Liga und Coach-Ansicht (24.09.). Die Server-Funktionen
// (0095_team_statistik.sql) werden hier per Netzwerk-Mock beantwortet.
const heute = new Date();
const tag = (d) => {
  const x = new Date(heute);
  x.setDate(x.getDate() - d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const MITGLIEDER = [
  { user_id: "e2e-test-user", vorname: "Aka", profilbild_pfad: null, team_id: "e2e-team-1", privat: false, punkte_zeitraum: 30, punkte_gesamt: 140, aktive_tage: [tag(0), tag(1)], letzte_aktivitaet: tag(0) },
  { user_id: "e2e-lena", vorname: "Lena", profilbild_pfad: null, team_id: "e2e-team-1", privat: false, punkte_zeitraum: 40, punkte_gesamt: 420, aktive_tage: [tag(0)], letzte_aktivitaet: tag(0) },
  { user_id: "e2e-mira", vorname: "Mira", profilbild_pfad: null, team_id: "e2e-team-1", privat: false, punkte_zeitraum: 2, punkte_gesamt: 20, aktive_tage: [tag(3)], letzte_aktivitaet: tag(3) },
  { user_id: "e2e-jonas", vorname: "Jonas", profilbild_pfad: null, team_id: "e2e-team-1", privat: true, punkte_zeitraum: null, punkte_gesamt: null, aktive_tage: null, letzte_aktivitaet: null },
];
const LIGA = [
  { team_id: "t2", team_name: "Team Morgenstern", mitglieder: 3, schnitt: 40, schnitt_vorher: 30, aktive_tage_schnitt: 3, raetsel_tage: 1, initialen: ["A", "B", "C"], ist_mein_team: false },
  { team_id: "e2e-team-1", team_name: "Team Sonnenaufgang", mitglieder: 4, schnitt: 24, schnitt_vorher: 10, aktive_tage_schnitt: 2, raetsel_tage: 0, initialen: ["A", "L", "M", "J"], ist_mein_team: true },
];

async function mocks(page) {
  await page.route("**/rest/v1/rpc/team_mitglieder_statistik*", (r) => r.fulfill({ json: MITGLIEDER }));
  await page.route("**/rest/v1/rpc/team_liga*", (r) => r.fulfill({ json: LIGA }));
  await page.route("**/rest/v1/rpc/team_neuigkeiten*", (r) =>
    r.fulfill({ json: [{ user_id: "e2e-lena", vorname: "Lena", profilbild_pfad: null, art: "routine_morgen", tag: tag(0), zeitpunkt: heute.toISOString() }] })
  );
}

test("Team-Seite: Wochenziel, Mitglieder, Motivieren für Stille, privat, Neuigkeiten", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html?team=1#/team");
  await expect(page.getByText("Wochenziel als Team")).toBeVisible();
  // 3 sichtbare Personen × 50 = 150 (Privat zählt nicht), 72 Punkte zusammen.
  await expect(page.getByText("/ 150 Punkte")).toBeVisible();
  await expect(page.getByText("Du", { exact: true })).toBeVisible();
  await expect(page.getByText("seit 3 Tagen ruhig")).toBeVisible();
  await expect(page.getByText("🙈 privat", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "💬 Motivieren" }).click();
  await expect(page.getByPlaceholder("Ein paar liebe Worte an Mira …")).toBeVisible();
  await expect(page.getByText("hat die Morgenroutine geschafft", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Team-Liga: Teams nach Ø, eigenes Team markiert, Highlights", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html?team=1#/team");
  await page.getByRole("button", { name: "🏆 Team-Liga" }).click();
  await expect(page.getByText("Team Morgenstern").first()).toBeVisible();
  await expect(page.getByText("euer Team")).toBeVisible();
  await expect(page.getByText("Größter Sprung", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Monat" }).click();
  await expect(page.getByText("40 Ø")).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Team-Seite ohne Team: freundlicher Hinweis, Liga trotzdem erreichbar", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html#/team");
  await expect(page.getByText("Team Morgenstern").first()).toBeVisible();
  await page.getByRole("button", { name: "Mein Team" }).click();
  await expect(page.getByText("noch keinem Team zugeordnet", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
