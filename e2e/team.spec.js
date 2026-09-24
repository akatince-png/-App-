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
  { team_id: "t2", team_name: "Team Morgenstern", mitglieder: 3, schnitt: 40, schnitt_vorher: 30, aktive_tage_schnitt: 3, raetsel_tage: 1, initialen: ["A", "B", "C"], ist_mein_team: false, punkte_summe: 120 },
  { team_id: "e2e-team-1", team_name: "Team Sonnenaufgang", mitglieder: 4, schnitt: 24, schnitt_vorher: 10, aktive_tage_schnitt: 2, raetsel_tage: 0, initialen: ["A", "L", "M", "J"], ist_mein_team: true, punkte_summe: 96 },
];

const PERSONEN = [
  { user_id: "e2e-lena", teilt: true, vorname: "Lena", profilbild_pfad: null, team_name: "Team Sonnenaufgang", punkte: 40, aktive_tage: [tag(0), tag(1)] },
  { user_id: "e2e-test-user", teilt: true, vorname: "Aka", profilbild_pfad: null, team_name: "Team Sonnenaufgang", punkte: 30, aktive_tage: [tag(0)] },
  { user_id: "e2e-tom", teilt: true, vorname: "Tom", profilbild_pfad: null, team_name: null, punkte: 55, aktive_tage: [tag(0)] },
  { user_id: "e2e-jonas", teilt: false, vorname: null, profilbild_pfad: null, team_name: null, punkte: null, aktive_tage: null },
];

async function mocks(page) {
  await page.route("**/rest/v1/rpc/rangliste_personen*", (r) => r.fulfill({ json: PERSONEN }));
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
  // Wochenziel fürs ganze Team (auch wer nicht teilt): 4 Personen × 50 = 200,
  // Summe aus der Team-Rangliste (96).
  await expect(page.getByText("/ 200 Punkte")).toBeVisible();
  await expect(page.getByText(/^96\s*\/ 200 Punkte$/)).toBeVisible();
  await expect(page.getByText("Du", { exact: true })).toBeVisible();
  await expect(page.getByText("seit 3 Tagen ruhig")).toBeVisible();
  await expect(page.getByText("🙈 privat", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "💬 Motivieren" }).click();
  await expect(page.getByPlaceholder("Ein paar liebe Worte an Mira …")).toBeVisible();
  await expect(page.getByText("hat die Morgenroutine geschafft", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Rangliste Teams: nach Ø, Gesamtpunkte, eigenes Team markiert, Highlights", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html?team=1#/team");
  await page.getByRole("button", { name: "🏆 Rangliste" }).click();
  await page.getByRole("button", { name: "👥 Teams" }).click();
  await expect(page.getByText("Team Morgenstern").first()).toBeVisible();
  await expect(page.getByText("3 Personen · 120 Punkte gesamt")).toBeVisible();
  await expect(page.getByText("euer Team")).toBeVisible();
  await expect(page.getByText("Größter Sprung", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Monat" }).click();
  await expect(page.getByText("Ø pro Person").first()).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Rangliste Personen: nach Punkten, ich markiert, Nicht-Teilende gezählt, Freischalten-Hinweis", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html?team=1#/team");
  await page.getByRole("button", { name: "🏆 Rangliste" }).click();
  const zeilen = page.getByText(/^(Tom|Lena|Du)$/);
  await expect(zeilen).toHaveText(["Tom", "Lena", "Du"]);
  await expect(page.getByText("ohne Team", { exact: false })).toBeVisible();
  await expect(page.getByText("1 weitere Person teilt ihre Punkte nicht.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jetzt freischalten ›" })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

test("Rangliste Personen: wer teilt, sieht keinen Freischalten-Hinweis", async ({ page }) => {
  await mocks(page);
  await page.goto("/e2e/harness/index.html?team=1&teilt=1#/team");
  await page.getByRole("button", { name: "🏆 Rangliste" }).click();
  await expect(page.getByText("Tom", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jetzt freischalten ›" })).toHaveCount(0);
});

test("Team-Seite ohne Team: Rangliste direkt, Hinweis unter Mein Team", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await mocks(page);
  await page.goto("/e2e/harness/index.html#/team");
  await expect(page.getByText("Tom", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "👥 Teams" }).click();
  await expect(page.getByText("Team Morgenstern").first()).toBeVisible();
  await page.getByRole("button", { name: "Mein Team" }).click();
  await expect(page.getByText("noch keinem Team zugeordnet", { exact: false })).toBeVisible();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
