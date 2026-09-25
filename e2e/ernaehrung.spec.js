import { test, expect } from "@playwright/test";

// Ernährung (25.09.): Essen per Satz → Rechnung zum Bestätigen, Ziele.
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0");
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("button", { name: "Pläne" }).click();
  await page.getByRole("button", { name: "Ernährung", exact: true }).click();
});

test("Satz eingeben → Gramm und Werte anzeigen → bestätigen speichert", async ({ page }) => {
  const karte = page.getByRole("region", { name: "Was hast du gegessen?" });
  await karte.getByRole("textbox", { name: "Was hast du gegessen?" }).fill("zwei Scheiben Vollkornbrot, drei Bananen und fünf Eier");
  await karte.getByRole("button", { name: "Ausrechnen" }).click();
  await expect(karte.getByText("2 Scheibe(n) à 45 g = 90 g")).toBeVisible();
  await expect(karte.getByText("5 Stück à 55 g = 275 g")).toBeVisible();
  await karte.getByLabel("Gramm Banane").fill("240");
  await karte.getByRole("button", { name: "Passt – speichern" }).click();
  const [[e]] = await aufrufe(page, "essenSpeichern");
  expect(e.posten.map((p) => [p.name, p.gramm])).toEqual([
    ["Vollkornbrot", 90],
    ["Banane", 240],
    ["Ei", 275],
  ]);
  expect(e.summe.eiweiss).toBeGreaterThan(40);
  expect(e.text).toBe("zwei Scheiben Vollkornbrot, drei Bananen und fünf Eier");
});

test("Ernährungsziel: Eiweiß g/kg wählen, Werte vor dem Speichern sehen", async ({ page }) => {
  await page.getByRole("button", { name: /Mein Ernährungsziel/ }).click();
  await page.getByRole("group", { name: "EIWEISS PRO KG KÖRPERGEWICHT" }).getByRole("button", { name: "1,8 g" }).click();
  await page.getByRole("group", { name: "BEVORZUGTE EIWEISSQUELLEN" }).getByRole("button", { name: "Skyr/Quark" }).click();
  await expect(page.locator("[data-makro-ziele]")).toContainText("Omega-3 ≥ 250 mg");
  await page.getByRole("button", { name: "Passt – so speichern" }).click();
  const [[kat, wert]] = await aufrufe(page, "setCategoryZiel");
  expect(kat).toBe("ernaehrung");
  expect(wert).toMatchObject({ eiweissGProKg: 1.8, fettProzent: 30, omega3Mg: 250, omega6zu3Max: 5, quellen: { eiweiss: ["Skyr/Quark"] } });
});
