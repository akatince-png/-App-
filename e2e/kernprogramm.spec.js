import { test, expect } from "@playwright/test";

// AKA-Kernprogramm in 4-Wochen-Etappen (25.09.).
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Startseite: Woche 2 zeigt Bewegung, Sportart wählen öffnet die Übersicht und speichert den Plan", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 29, 9, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=2#/home");
  const karte = page.getByRole("button", { name: "AKA-Kernprogramm öffnen" });
  await expect(karte).toContainText("WOCHE 2 VON 4");
  await expect(karte).toContainText("Diese Woche: Bewegung");
  await expect(karte).toContainText("Sportart wählen");
  await karte.click();
  await expect(page.getByText("ALLE PFLICHT-BAUSTEINE 🔒")).toBeVisible();
  await page.getByRole("group", { name: "Sportart" }).getByRole("button", { name: "🥊 Kampfsport" }).click();
  for (const t of ["Mo", "Mi", "Fr"]) await page.getByRole("group", { name: "Tage" }).getByRole("button", { name: t, exact: true }).click();
  await page.getByLabel("Uhrzeit Sport").fill("18:30");
  await page.getByRole("button", { name: "Speichern" }).click();
  const plan = await aufrufe(page, "wochenplanHinzufuegen");
  expect(plan.map(([e]) => e.wochentag)).toEqual(["Mo", "Mi", "Fr"]);
  expect(plan[0][0]).toMatchObject({ name: "Kampfsport", uhrzeit: "18:30", arten: ["Sonstiges"] });
});

test("Vor dem Start: Karte zeigt das Startdatum; ohne Etappe keine Karte", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0#/home");
  await expect(page.getByRole("button", { name: "AKA-Kernprogramm öffnen" })).toHaveCount(0);
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=0#/home");
  await expect(page.getByText(/Startet am/)).toBeVisible();
});

test("Woche 3: Top 3 → erster Schritt → 15 Min. → 'Hast du angefangen?'", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 6, 8, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=3#/home");
  const karte = page.getByRole("region", { name: "Deine Top 3 für heute" });
  await karte.getByLabel("Top 1").fill("Steuerunterlagen sortieren");
  await karte.getByLabel("Erster kleiner Schritt").fill("Ordner auf den Tisch");
  await karte.getByRole("button", { name: "▶ 15 Min. daran arbeiten" }).click();
  await karte.getByRole("button", { name: "Früher aufhören ›" }).click();
  await expect(karte.getByText("Hast du angefangen?")).toBeVisible();
  await karte.getByRole("button", { name: "✅ Ja" }).click();
  const speichern = await aufrufe(page, "kernTop3Speichern");
  expect(speichern.at(-1)[1]).toMatchObject({ angefangen: true, ersterSchritt: "Ordner auf den Tisch" });
  await expect(page.getByRole("status").filter({ hasText: "Angefangen" })).toBeVisible();
});

test("Erhaltung: Karte 'Dranbleiben' und sonntags Wochen-Check", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 1, 18, 0));
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=erhaltung#/home");
  await expect(page.getByRole("button", { name: "AKA-Kernprogramm öffnen" })).toContainText("Dranbleiben");
  const check = page.getByRole("region", { name: "Wochen-Check" });
  await expect(check).toBeVisible();
  await check.getByRole("button", { name: "gut", exact: true }).click();
  await check.getByRole("button", { name: "Fertig" }).click();
  const [[ws, felder]] = await aufrufe(page, "kernWochenCheckSpeichern");
  expect(ws).toBe("2026-10-26");
  expect(felder).toMatchObject({ stimmung: 4 });
});

// Messwoche (26.09.): Woche 1 misst; ab 3 Messungen Vorschlag übernehmen.
test("Messwoche: Auswertung zeigt Ø-Zeiten und übernimmt den Vorschlag", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&kern=1&mess=1#/coaching");
  await expect(page.getByText(/Deine Messwoche · Tag 1 von 7/)).toBeVisible();
  await expect(page.getByText("3 von 3 Messungen ✓")).toBeVisible();
  await page.getByRole("button", { name: "✓ 4 Min. übernehmen" }).click();
  const aufrufe = await page.evaluate(() => (window.__mockAufrufe || []).filter((a) => a.name === "routineSchrittAendern").map((a) => a.args));
  expect(aufrufe[0]).toEqual(["ks2", { dauerMin: 4 }]);
});
