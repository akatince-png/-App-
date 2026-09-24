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

test("Echtes Routing: Navigation setzt den URL-Hash, Browser-Zurück/Vorwärts funktioniert (App-Bauplan-Punkt)", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });

  await expect(page).toHaveURL(/#\/home$/);

  await nav.getByRole("button", { name: "Tagesplan" }).click();
  await page.waitForTimeout(200); // Remount-Übergangsanimation (fadeInUp)
  await expect(page).toHaveURL(/#\/tagesplan$/);

  await nav.getByRole("button", { name: "Archiv" }).click();
  await expect(page).toHaveURL(/#\/archiv$/);

  // Browser-Zurück: zwei Schritte zurück zu Home, nicht nur einer — jeder
  // Klick oben hat einen echten Eintrag in der Browser-Historie erzeugt.
  await page.goBack();
  await expect(page).toHaveURL(/#\/tagesplan$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByText("Tagebuch")).toBeVisible();

  // Browser-Vorwärts: wieder zurück zum Tagesplan.
  await page.goForward();
  await expect(page).toHaveURL(/#\/tagesplan$/);

  expect(fehler).toEqual([]);
});

test("AkutModusGlobal öffnet sich nach Browser-Zurück/Vorwärts nicht von selbst wieder (Nachkontrolle)", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  const akutKnopf = page.getByRole("button", { name: "Akutmodus — grad nicht gut?" });

  // AkutModusGlobal ist auf Home bewusst ausgeblendet (eigener Akutmodus
  // dort) — auf Tagesplan öffnen und wieder verlassen, ohne ihn manuell zu
  // schließen: der Knopf sitzt außerhalb des key={view}-Remounts, sein
  // offen-State überlebt daher einen Sichtbarkeits-Wechsel von selbst aus.
  await nav.getByRole("button", { name: "Tagesplan" }).click();
  await page.waitForTimeout(200);
  await akutKnopf.click();
  await expect(page.getByText("💡 Was hilft mir jetzt?")).toBeVisible();

  await page.goBack(); // zurück auf Home, AkutModusGlobal wird unsichtbar
  await expect(page).toHaveURL(/#\/home$/);

  await page.goForward(); // wieder auf Tagesplan, AkutModusGlobal wieder sichtbar
  await expect(page).toHaveURL(/#\/tagesplan$/);
  await expect(page.getByText("💡 Was hilft mir jetzt?")).not.toBeVisible();
  await expect(akutKnopf).toBeVisible();

  expect(fehler).toEqual([]);
});

test("Tagebuch-Modal öffnet und lässt sich per Escape schließen (Barrierefreiheits-Regressionstest)", async ({ page }) => {
  await page.getByText("Tagebuch").click();
  const textarea = page.getByPlaceholder("Schreib frei drauflos, oder tippe auf das Mikrofon…");
  await expect(textarea).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(textarea).toBeHidden();
});

// Bug-Fix 24.09. (Nutzerinnen-Report): der gelbe 💡-Knopf im Gehirnfeld
// ließ Home abstürzen (getCoachName war nicht importiert).
test("Home: gelber Akut-Knopf öffnet die Hilfe ohne Absturz", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");
  await page.getByRole("button", { name: "Grad nicht gut?", exact: true }).click();
  await expect(page.getByText("Puh, da ist etwas schiefgelaufen")).toHaveCount(0);
  await expect(page.getByText("💡 Was hilft mir jetzt?")).toBeInViewport();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

// Neustart-Optionen (24.09.): "Fortschritt auf Null" zusätzlich zu
// "Alles löschen", beide erst nach Eintippen des Bestätigungsworts aktiv.
test("Mehr: beide Neustart-Knöpfe sind da und erst nach Bestätigungswort aktiv", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html#/mehr");
  const fortschritt = page.getByRole("button", { name: "Fortschritt auf Null setzen" });
  const alles = page.getByRole("button", { name: "Wirklich alles zurücksetzen" });
  await expect(fortschritt).toBeDisabled();
  await expect(alles).toBeDisabled();
  await page.getByPlaceholder("NEU STARTEN").fill("neu starten");
  await expect(fortschritt).toBeEnabled();
  await expect(alles).toBeDisabled();
  // zweite Sicherheitsstufe: erst ein "Bist du dir sicher?"-Fenster
  await fortschritt.click();
  await expect(page.getByRole("dialog", { name: "Wirklich zurücksetzen?" })).toBeVisible();
  await page.getByRole("button", { name: "Nein, abbrechen" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});

// Profilbild (24.09.): Karte im Profil mit Hinweis, wer das Foto sieht.
test("Profil: Profilbild-Karte mit Hinweis und Foto-Knopf", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html#/profil");
  await expect(page.getByText("Profilbild", { exact: true })).toBeVisible();
  await expect(page.getByText("die Mitglieder deines Teams", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "📷 Foto hinzufügen" })).toBeVisible();
  await expect(page.getByLabel("Profilbild auswählen")).toBeAttached();
  expect(fehler.filter((f) => !f.includes("fetch"))).toEqual([]);
});
