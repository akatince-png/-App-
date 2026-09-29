import { test, expect } from "@playwright/test";

// Atem-Routine + Kontext-Tagebuch (25.09.).
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Atem: Übungen mit 'wofür', geführter Start fragt Stimmung, feste Zeit anlegen", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/atemuebungen");
  for (const n of ["Seufzer-Atmung", "Box-Atmung", "Gleichmäßig atmen", "Energie-Atmung", "Ruhig werden"]) {
    await expect(page.getByRole("button", { name: `${n} starten` })).toBeVisible();
  }
  await page.getByRole("button", { name: "+ Feste Zeit hinzufügen" }).click();
  await page.getByRole("button", { name: "Zeit speichern" }).click();
  expect(await aufrufe(page, "atemZeitSpeichern")).toEqual([[{ uhrzeit: "12:30", uebungKey: "seufzer", dauerMinuten: 3 }]]);
  await page.getByRole("button", { name: "Energie-Atmung starten" }).click();
  await expect(page.getByRole("group", { name: "Stimmung vorher" })).toBeVisible();
  await expect(page.getByText("nie im Wasser oder am Steuer")).toBeVisible();
});

// Seit 29.09. (schlichte Startseite) als Hinweis oben im Tagesplan.
test("Atem: feste Zeit steht als Atem-Pause oben im Tagesplan und startet die Übung", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 7, 5));
  await page.goto("/e2e/harness/index.html?isAdmin=0&atem=1#/tagesplan");
  const pause = page.locator("[data-atem-pause]").first();
  await expect(pause).toContainText("🌬️ Atem-Pause");
  await expect(pause).toContainText("Energie-Atmung · 2 Min.");
  await pause.click();
  await expect(page).toHaveURL(/#\/atemuebungen/);
  await expect(page.getByRole("group", { name: "Stimmung vorher" })).toBeVisible();
});

// 25.09.: "Wie war dein Tag?" ist keine Startseiten-Karte mehr (kommt in
// der Abendroutine); Zwischenereignisse über den gelben 💡-Knopf.
test("Moment festhalten: gelber Knopf → Gefühl, Stärke, Auslöser, wer dabei, privat", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 20, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  await expect(page.getByRole("region", { name: "Wie war dein Tag?" })).toHaveCount(0);
  await page.getByRole("button", { name: "Grad nicht gut?" }).click();
  await page.getByRole("button", { name: /Moment festhalten/ }).click();
  const f = page.getByRole("region", { name: "Moment festhalten" });
  await f.getByRole("button", { name: "⚡ impulsiv" }).click();
  await f.getByRole("button", { name: "4", exact: true }).click();
  await f.getByLabel("Auslöser", { exact: true }).fill("Streit wegen Termin");
  await f.getByRole("button", { name: "Freunde" }).click();
  await f.getByRole("button", { name: "Festhalten" }).click();
  const [[m]] = await aufrufe(page, "momentSpeichern");
  expect(m).toMatchObject({ gefuehle: ["⚡ impulsiv"], staerke: 4, ausloeser: "Streit wegen Termin", personen: ["Freunde"], notizTeilen: false });
  await page.getByRole("button", { name: "🌬️ Jetzt eine Atemübung" }).click();
  await expect(page.getByText("Zurück zur Übersicht")).toBeVisible();
});

test("Tagebuch: keine Startseiten-Karte; Seite zeigt Muster ab 14 Einträgen", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 11, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&tagebuch=1#/home");
  await expect(page.getByRole("region", { name: "Wie war dein Tag?" })).toHaveCount(0);
  await page.goto("/e2e/harness/index.html?isAdmin=0&tagebuch=1#/tagebuch");
  await expect(page.locator('[data-muster="draussen30"]')).toContainText("gut");
  await expect(page.locator('[data-muster="essen:viel Zucker"]')).toBeVisible();
  await expect(page.getByText("Größter Unterschied")).toBeVisible();
});

// Atem-Schritt in der Morgenroutine (29.09., Nutzerin: „wenn ich draufklicke,
// in den Bereich geführt werden, wo die Atemübungen durchgeführt werden …
// fest eingestellte zweiminütige Atemübung“): „Mitmachen“ startet die feste
// Guten-Morgen-Atmung (2 Min.), danach ist der Schritt automatisch abgehakt.
test("Atem-Schritt der Morgenroutine: Mitmachen führt die 2-Minuten-Übung und hakt den Schritt ab", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 8, 29, 6, 40) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=1&atemschritt=1#/routinen");
  await page.locator("[data-atem-mitmachen]").first().click();
  await expect(page).toHaveURL(/#\/atemuebungen/);
  await expect(page.getByRole("heading", { name: /Guten-Morgen-Atmung/ })).toBeVisible();
  await expect(page.locator("[data-atem-routine-hinweis]")).toContainText("Morgenroutine");
  await expect(page.getByText("4 Sek. ein · 2 halten · 4 aus")).toBeVisible();
  await page.getByRole("group", { name: "Stimmung vorher" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "▶ Start" }).click();
  await page.clock.runFor(2 * 60 * 1000 + 15000);
  await page.getByRole("group", { name: "Stimmung nachher" }).getByRole("button").last().click();
  await expect(page.getByRole("status")).toContainText("Im Protokoll vermerkt");
  expect(await aufrufe(page, "routineSchrittErledigtUmschalten")).toEqual([["ks3", "2026-09-29"]]);
  const [[, dauerSek]] = await aufrufe(page, "atemuebungAbschliessen");
  expect(dauerSek).toBeGreaterThanOrEqual(115);
  await page.getByRole("button", { name: /Weiter mit der Morgenroutine/ }).click();
  await expect(page).toHaveURL(/#\/home/);
});
