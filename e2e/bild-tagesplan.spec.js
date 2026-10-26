import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Bild-Tagesplan + Timer-Ring (27.09., nach dem Marktvergleich mit Tiimo).
test("Bild-Tagesplan: Bilder, Dauer, Jetzt-Linie, Timer läuft in der Listenansicht weiter", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const heute = new Date();
  await page.clock.install({ time: new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 9, 40) });
  await page.goto("/e2e/harness/index.html?beispiel=1#/tagesplan");
  const plan = page.locator("[data-bild-tagesplan]");
  await expect(plan).toBeVisible();
  const waesche = page.locator('[data-bild-block^="g-"]').filter({ hasText: "Wäsche machen" });
  // Seit 30.09. Bereichs-Symbol als plastische Kugel statt Emoji.
  await expect(waesche.locator('[data-plastik-symbol="gewohnheit"]')).toBeVisible();
  await expect(waesche).toContainText("30 Min");
  // 9:40 liegt in "Wäsche 9:30–10:00" → dort steht die Jetzt-Linie.
  await expect(waesche.getByText("jetzt", { exact: true })).toBeVisible();
  await expect(page.locator('[data-bild-block="routine-morgen"]')).toContainText("Morgenroutine");
  await expect(page.getByText("Irgendwann heute")).toBeVisible();
  // Timer starten → Ring im Block und "läuft gerade" oben.
  await waesche.getByRole("button", { name: "Timer für Wäsche machen starten" }).click();
  await expect(page.locator("[data-fokus-timer]")).toContainText("Wäsche machen");
  await expect(page.locator("[data-fokus-timer]")).toContainText("noch 30 Min");
  // Liste bleibt erreichbar; dort steht der laufende Timer oben bei den
  // Tageshinweisen (seit 29.09. nicht mehr auf der schlichten Startseite).
  await page.getByRole("button", { name: "Liste", exact: true }).click();
  await expect(plan).toHaveCount(0);
  await expect(page.locator("[data-fokus-timer]")).toContainText("LÄUFT GERADE");
  await page.locator("[data-fokus-timer]").getByRole("button", { name: "✓ Fertig" }).click();
  await expect(page.locator("[data-fokus-timer]")).toHaveCount(0);
  expect(fehler).toEqual([]);
});

// Aufklappen (25.10., Nutzerin): Routine zeigt ihre Schritte und lässt sich
// direkt bearbeiten; gleichzeitige Supplemente stehen als eine Gabe da.
test("Bild-Tagesplan: Routine aufklappen und bearbeiten, Supplemente gebündelt", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const heute = new Date();
  await page.clock.install({ time: new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 9, 40) });
  await page.goto("/e2e/harness/index.html?beispiel=1#/tagesplan");
  const morgen = page.locator('[data-bild-block="routine-morgen"]');
  await morgen.locator("[data-bild-aufklappen]").click();
  await expect(morgen.locator("[data-bild-routine]")).toBeVisible();
  await morgen.locator("[data-routine-bearbeiten]").click();
  await expect(morgen.getByRole("button", { name: "✓ Fertig mit Bearbeiten" })).toBeVisible();
  const gruppen = page.locator('[data-bild-block^="gruppe-"]');
  if ((await gruppen.count()) > 0) {
    const g = gruppen.first();
    await g.locator("[data-bild-aufklappen]").click();
    await expect(g.locator("[data-bild-gruppe]")).toBeVisible();
  }
  expect(fehler).toEqual([]);
});

// Termine aus „Mein Alltag“ im Bild-Tagesplan (26.10., Nutzerin): rückmelden
// als wahrgenommen oder abgesagt/ausgefallen.
test("Bild-Tagesplan: Termin als ausgefallen rückmelden", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.clock.install({ time: new Date(2026, 9, 28, 18, 0) });
  await page.goto("/e2e/harness/index.html?isAdmin=0&alltag=1#/tagesplan");
  const termin = page.locator('[data-bild-block^="alltag-"]').first();
  await expect(termin).toBeVisible();
  await termin.locator("[data-termin-wie]").click();
  await termin.getByRole("button", { name: "✕ Abgesagt / ausgefallen" }).click();
  await termin.getByLabel("Notiz zum Termin").fill("abgesagt");
  await termin.locator("[data-rueckmeldung-speichern]").click();
  const [, , r] = (await page.evaluate(() => (window.__mockAufrufe || []).filter((a) => a.name === "alltagRueckmelden").map((a) => a.args))).at(-1);
  expect(r).toEqual({ status: "ausgefallen", ende: null, notiz: "abgesagt" });
  expect(fehler).toEqual([]);
});
