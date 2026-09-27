import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Einrichtungs-Checkliste pro Person (27.09.): Coach sieht auf einen Blick,
// was fehlt, übernimmt Vorlagen per Tipp, legt den Start fest und springt
// per "Einrichten" direkt in die passende Seite der Person.
const PERSONEN = [{ id: "p-lea", email: "lea@x.de", vorname: "Lea", onboarding_complete: true, is_admin: false, team_id: null, ungelesene_nachrichten: 0 }];

async function mocks(page) {
  const db = { routinen: [], wasser: null, licht: null, erinnerungen: {}, teilnahme: null, team_id: null };
  const leer = (r) => r.fulfill({ status: 200, headers: { "content-range": "*/0", "content-type": "application/json" }, body: "[]" });
  await page.route("**/rest/v1/**", leer);
  await page.route("**/rest/v1/rpc/admin_liste_probanden*", (r) => r.fulfill({ json: PERSONEN }));
  await page.route("**/rest/v1/teams*", (r) => r.fulfill({ json: [{ id: "t1", name: "Sonne", erstellt_am: "2026-09-01" }] }));
  const lesen = (r, wert) => r.fulfill({ json: wert });
  await page.route("**/rest/v1/profiles*", async (r) => {
    if (r.request().method() === "PATCH") {
      const body = r.request().postDataJSON();
      if (body.erinnerungen) db.erinnerungen = body.erinnerungen;
      if ("team_id" in body) db.team_id = body.team_id;
      return r.fulfill({ status: 204, body: "" });
    }
    return lesen(r, [{ vorname: "Lea", zeitzone: "Europe/Berlin", onboarding_complete: true, erinnerungen: db.erinnerungen, category_ziele: {}, team_id: db.team_id }]);
  });
  await page.route("**/rest/v1/routine_einstellungen*", async (r) => {
    if (r.request().method() === "POST") {
      const row = r.request().postDataJSON();
      db.routinen = [...db.routinen.filter((x) => x.routine !== row.routine), { routine: row.routine, start_zeit: row.start_zeit, end_zeit: row.end_zeit }];
      return r.fulfill({ status: 201, body: "" });
    }
    return lesen(r, db.routinen);
  });
  await page.route("**/rest/v1/hydration_settings*", async (r) => {
    if (r.request().method() === "POST") {
      db.wasser = r.request().postDataJSON().ziel_ml;
      return r.fulfill({ status: 201, body: "" });
    }
    return lesen(r, db.wasser ? [{ ziel_ml: db.wasser }] : []);
  });
  await page.route("**/rest/v1/tageslicht_settings*", async (r) => {
    if (r.request().method() === "POST") {
      db.licht = r.request().postDataJSON().ziel_minuten;
      return r.fulfill({ status: 201, body: "" });
    }
    return lesen(r, db.licht ? [{ ziel_minuten: db.licht }] : []);
  });
  await page.route("**/rest/v1/programm_teilnahmen*", async (r) => {
    if (r.request().method() === "POST") {
      const row = r.request().postDataJSON();
      db.teilnahme = { status: row.status, start: row.start };
      return r.fulfill({ status: 201, body: "" });
    }
    return lesen(r, db.teilnahme ? [db.teilnahme] : []);
  });
  await page.route("**/rest/v1/coaching_etappen*", (r) => r.fulfill({ status: 201, body: "" }));
  return db;
}

test("Einrichtungs-Checkliste: Vorlagen, Start festlegen, bereit – und Direkt-Sprung", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const db = await mocks(page);
  await page.goto("/e2e/harness/index.html#/admin");
  await page.getByRole("button", { name: "🧭 Einrichten" }).click();
  const liste = page.locator("[data-einrichtung]");
  await expect(liste).toContainText("Noch nicht startklar");
  await expect(liste).toContainText("offen: Abendroutine, Morgenroutine, Programmstart");
  // Abend steht vor Morgen.
  const keys = await liste.locator("[data-schritt]").evaluateAll((els) => els.map((e) => e.getAttribute("data-schritt")));
  expect(keys.indexOf("abendroutine")).toBeLessThan(keys.indexOf("morgenroutine"));

  await liste.getByRole("button", { name: "Übliches übernehmen" }).click();
  await expect(liste.locator('[data-schritt="abendroutine"]')).toContainText("ab 21:30 Uhr");
  await expect(liste.locator('[data-schritt="morgenroutine"]')).toContainText("ab 06:30 Uhr");
  await expect(liste.locator('[data-schritt="wasser"]')).toContainText("2,5 l am Tag");
  expect(db.erinnerungen.abendroutine).toMatchObject({ aktiv: true, vorlaufMinuten: 15 });

  await liste.getByRole("combobox", { name: "Team wählen" }).selectOption("t1");
  await expect.poll(() => db.team_id).toBe("t1");

  await liste.getByRole("button", { name: "▶ Start festlegen" }).click();
  await expect(liste).toContainText("Bereit zum Start");
  expect(db.teilnahme.status).toBe("laufend");

  // Direkt-Sprung in die Abendroutine der Person, zurück landet wieder hier.
  await liste.locator('[data-schritt="abendroutine"]').getByRole("button", { name: "Ändern" }).click();
  await expect(page.getByText("Du verwaltest gerade: Lea")).toBeVisible();
  await expect(page).toHaveURL(/#\/abendroutine/);
  await page.getByRole("button", { name: "Zurück zum Dashboard" }).click();
  await expect(page.locator("[data-einrichtung]")).toContainText("Bereit zum Start");
  expect(fehler.filter((f) => !f.includes("fetch") && !f.includes("Failed to load"))).toEqual([]);
});
