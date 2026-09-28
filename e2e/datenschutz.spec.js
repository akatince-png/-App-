import { test, expect } from "@playwright/test";

// Datenschutz / App-Store-Vorbereitung (28.09.): Einwilligung beim ersten
// Start, KI-Schalter, Datenschutzerklärung, Konto löschen.
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Einwilligung: Datenschutz Pflicht, KI freiwillig", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&einwilligung=0");
  await expect(page.locator("[data-einwilligung]")).toBeVisible();
  const weiter = page.getByRole("button", { name: "Weiter" });
  await expect(weiter).toBeDisabled();
  await page.getByRole("button", { name: "Datenschutzerklärung" }).click();
  await expect(page.locator("[data-einwilligung-text]")).toContainText("Wer ist verantwortlich?");
  await page.locator("[data-einwilligung-datenschutz]").check();
  await weiter.click();
  expect((await aufrufe(page, "einwilligungSetzen"))[0][0]).toEqual({ datenschutz: true, ki: false });
});

test("Admins sehen den Einwilligungs-Schritt nicht", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?einwilligung=0");
  await expect(page.locator("[data-einwilligung]")).toHaveCount(0);
});

test("Mehr: KI-Schalter, Datenschutzerklärung, Konto löschen mit Bestätigung", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/mehr");
  const karte = page.locator("[data-datenschutz-karte]");
  await expect(karte).toContainText("Datenschutz-Einwilligung vom");
  const schalter = karte.getByRole("switch", { name: "KI-Funktionen erlauben" });
  await expect(schalter).toHaveAttribute("aria-checked", "true");
  await schalter.click();
  expect((await aufrufe(page, "einwilligungSetzen"))[0][0]).toEqual({ ki: false });

  const loeschen = karte.getByRole("button", { name: "Konto endgültig löschen" });
  await expect(loeschen).toBeDisabled();
  await karte.getByPlaceholder(/LÖSCHEN/).fill("löschen");
  await expect(loeschen).toBeEnabled();

  await karte.getByRole("link", { name: "Datenschutzerklärung" }).click();
  await expect(page.locator('[data-rechtstext="datenschutz"]')).toContainText("Deine Rechte");
});

test("KI aus: Aka-Anfrage wird mit Hinweis abgelehnt, nichts geht raus", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&ki=0");
  const meldung = await page.evaluate(async () => {
    const { sendeAnfrage } = await import("/src/services/aiProviders.js");
    try {
      await sendeAnfrage({ messages: [{ role: "user", content: "Hallo" }] });
      return "gesendet";
    } catch (e) {
      return e.message;
    }
  });
  expect(meldung).toContain("KI-Funktionen sind ausgeschaltet");
});
