import { test, expect } from "@playwright/test";

// Video-Nachweis (27.09.): Countdown 5-4-3-2-1, Aufnahme mit (simulierter)
// Kamera, senden → Upload in den eigenen Ordner + Eintrag für den Coach.
test.use({
  permissions: ["camera"],
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? "/opt/pw-browsers/chromium" : undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test("Gruppenprotokoll: Video-Nachweis mit Countdown aufnehmen und an den Coach senden", async ({ page }) => {
  const gesendet = { upload: [], eintrag: [] };
  await page.route("**/storage/v1/object/nachweise/**", (r) => {
    gesendet.upload.push(r.request().url());
    return r.fulfill({ json: { Key: "nachweise/x" } });
  });
  await page.route("**/rest/v1/video_nachweise*", (r) => {
    gesendet.eintrag.push(r.request().postDataJSON());
    return r.fulfill({ status: 201, json: [] });
  });
  await page.goto("/e2e/harness/index.html?team=1&gruppe=1#/team");
  await page.getByRole("button", { name: "🎥 Nachweis" }).first().click();
  const dlg = page.getByRole("dialog", { name: "Video-Nachweis aufnehmen" });
  await expect(dlg).toContainText("Nur dein Coach sieht das Video");
  await dlg.getByRole("button", { name: "▶ Countdown starten" }).click();
  await expect(dlg.getByText("5", { exact: true })).toBeVisible();
  await expect(dlg.getByText("Geh in Position – gleich geht's los")).toBeVisible();
  await expect(dlg.getByRole("button", { name: "⏹ Fertig" })).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(1500);
  await dlg.getByRole("button", { name: "⏹ Fertig" }).click();
  await dlg.getByRole("button", { name: "An Coach senden" }).click();
  await expect(dlg).toHaveCount(0, { timeout: 8000 });
  expect(gesendet.upload[0]).toContain("/nachweise/e2e-test-user/");
  expect(gesendet.eintrag[0]).toMatchObject({ user_id: "e2e-test-user", art: "gruppe", titel: "21 Tage Morgenroutine: Morgenroutine abschließen" });
  await expect(page.getByRole("button", { name: "🎥 ✓ gesendet" })).toBeVisible();
});
