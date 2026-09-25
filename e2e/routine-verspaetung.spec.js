import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Verspätete Morgenroutine als Muster (25.09.): Karte "Passt deine Zeit
// noch?" mit drei Wegen — jeder wird protokolliert.
const aufrufe = (page, name) => page.evaluate((n) => (window.__mockAufrufe || []).filter((a) => a.name === n).map((a) => a.args), name);

test("Karte erscheint bei 3 späten Tagen; 'Passt so' wird protokolliert und gibt eine Woche Ruhe", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?isAdmin=0&spaet=1#/home");
  const karte = page.getByRole("region", { name: "Passt deine Morgenroutine-Zeit noch?" });
  await expect(karte).toBeVisible();
  await expect(karte).toContainText("meist gegen 08:45 statt um 06:00");
  await karte.getByRole("button", { name: /Nein, passt so/ }).click();
  await expect(page.getByRole("status")).toContainText("06:00 bleibt");
  const log = await aufrufe(page, "aenderungVermerken");
  expect(log.at(-1)[0]).toMatchObject({ kategorie: "morgenroutine", itemName: "Zeit-Hinweis", aktion: "geändert" });
  expect(log.at(-1)[0].detail).toContain("Passt so");
  expect(fehler.filter((f) => !f.includes("Failed to fetch"))).toEqual([]);
});

test("Umstellen verschiebt Start und Ende gleich weit", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?isAdmin=0&spaet=1#/home");
  await page.getByRole("button", { name: "Auf 08:45 umstellen" }).click();
  await expect(page.getByRole("status")).toContainText("startet jetzt um 08:45");
  expect(await aufrufe(page, "routineZeitrahmenSetzen")).toEqual([["morgen", "08:45", "11:45"]]);
  const log = await aufrufe(page, "aenderungVermerken");
  expect(log.at(-1)[0].detail).toBe("Startzeit 06:00 → 08:45, Ende 09:00 → 11:45 (nach 3 späten Tagen)");
});

test("Mit Coach besprechen öffnet den Chat mit vorbereitetem Satz (nicht gesendet)", async ({ page }) => {
  await page.route("**/rest/v1/coachee_nachrichten*", (r) => r.fulfill({ json: [] }));
  await page.goto("/e2e/harness/index.html?isAdmin=0&spaet=1#/home");
  await page.getByRole("button", { name: /Mit meinem Coach besprechen/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat: Dein Coach" });
  await expect(chat).toBeVisible();
  await expect(chat.getByRole("textbox")).toHaveValue(/Meine Morgenroutine klappt meist erst gegen 08:45 statt um 06:00/);
  await expect(chat.locator("[data-chat-nachricht]")).toHaveCount(0);
});

test("Admin im eigenen Konto: Karte ohne Coach-Knopf", async ({ page }) => {
  await page.goto("/e2e/harness/index.html?spaet=1#/home");
  await expect(page.getByRole("region", { name: /Passt deine Morgenroutine-Zeit/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mit meinem Coach besprechen/ })).toHaveCount(0);
});
