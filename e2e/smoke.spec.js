import { test, expect } from "@playwright/test";

// Smoke-Tests gegen die echte App-Oberfläche (siehe e2e/harness/), ohne
// echtes Supabase/echte Auth. Ziel: nichts stürzt beim Navigieren ab, die
// wichtigsten Screens rendern etwas Sinnvolles. Keine tiefen
// Daten-Assertions — dafür bräuchte es echte Fixture-Daten je Screen.

// Netzwerk-Rauschen der Sandbox-Umgebung, keine App-Bugs — z. B. blockierte
// externe Verbindungen (net::ERR_TUNNEL_CONNECTION_FAILED), die hier beim
// Entwickeln der Testsuite nie auf einen konkreten, von der App selbst
// ausgelösten Request zurückgeführt werden konnten (kein fetch/<img>/<link>
// im Code, das dazu passen würde) — eher Browser-/Sandbox-eigener
// Hintergrund-Traffic. Ein echter App-Fehler äußert sich als JS-Exception
// (pageerror) oder ein React-/App-eigener console.error-Text, nicht als
// generischer net::-Fehler.
const IGNORIERTE_MUSTER = [/net::ERR_/];

function sammleKonsolenfehler(page) {
  const fehler = [];
  page.on("pageerror", (err) => fehler.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORIERTE_MUSTER.some((m) => m.test(text))) return;
    fehler.push(`console.error: ${text}`);
  });
  return fehler;
}

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

test("Tagebuch-Modal öffnet und lässt sich per Escape schließen (Barrierefreiheits-Regressionstest)", async ({ page }) => {
  await page.getByText("Tagebuch").click();
  const textarea = page.getByPlaceholder("Schreib frei drauflos, oder tippe auf das Mikrofon…");
  await expect(textarea).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(textarea).toBeHidden();
});
