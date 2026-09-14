import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Kompletter Onboarding-Durchlauf, ein Screen nach dem anderen: Willkommen
// (3 Folien) → Hauptprotokoll anlegen → Intro (Name) → Ziele → Profil →
// Laborwerte → Routinen → Kategorien ("Alles überspringen") → Abschluss →
// zurück auf Home. Nutzt ?onboarding=1 (siehe e2e/harness/TestApp.jsx), um
// einen frischen, noch nicht eingerichteten Account zu simulieren.
//
// Bewusste Grenze: befüllt nur die Felder, die zum Weiterkommen nötig sind
// (Protokollname, Vorname) — testet NICHT jede einzelne der 8 Kategorien im
// Detail mit echten Werten (Ziel/Grund, Messwerte, ...). Das wäre ein enorm
// fragiles Unterfangen (bricht bei jeder Text-/Feld-Änderung) für einen
// Nutzen, der über "stürzt nicht ab" kaum hinausgeht — echte inhaltliche
// Prüfung je Kategorie passiert in den kategorie-spezifischen Tests
// (plaene.spec.js) an bereits eingerichteten (gemockten) Daten.
test("Onboarding: kompletter Durchlauf von Willkommen bis zurück auf Home", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?onboarding=1");

  // Willkommen: 3 Folien, "Weiter" zweimal, dann "Los".
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Los geht's", exact: true }).click();

  // Hauptprotokoll anlegen: Name ist Pflicht, Startdatum ist vorbelegt.
  await expect(page.getByText("Wie soll dein Protokoll heißen?")).toBeVisible();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("E2E-Test-Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  // Intro: erst die 3-Wege-Frage ("begleitet" vs. "allein"), dann Name.
  await expect(page.getByText("Ich bin", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Nein, ich mach's selbst" }).click();
  await page.getByPlaceholder("z. B. Anton Kaufmann").fill("E2E Testperson");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  // Ziele/Profil/Laborwerte/Routinen: je ein einfaches "Weiter", keine
  // Pflichtfelder auf diesen vier Screens (siehe Kommentar oben). Jeder
  // Schritt wird über seine eindeutige Überschrift bestätigt, bevor
  // geklickt wird.
  //
  // Laborwerte/Routinen betten KiChat (Coach-Chat, autoStart) ein — der
  // öffnet sich automatisch als Vollbild-Modal und verdeckt bewusst den
  // Rest des Screens (echtes Modal-Verhalten, siehe KiChat.jsx). Ein
  // Bug-Fund hier (14.09.): das Modal war vorher fälschlich nur
  // TEILWEISE abgedunkelt/abgeschnitten statt den ganzen Bildschirm zu
  // decken (position:fixed griff wegen einer transformierenden Vorfahren-
  // Animation nicht auf den echten Viewport) — der "Weiter"-Button
  // schaute darunter sichtbar, aber unklickbar hervor. Jetzt per
  // createPortal behoben; entsprechend schließt der Test das Modal zuerst
  // ganz normal über "Schließen", wie eine echte Nutzerin es auch tun
  // müsste.
  for (const titel of ["Ziel & Grund", "Dein Profil & Ausgangslage", "Deine Laborwerte", "Morgen- & Abendroutine"]) {
    await expect(page.getByText(titel, { exact: true })).toBeVisible();
    const schliessenKnopf = page.getByRole("button", { name: "Schließen" });
    if (await schliessenKnopf.isVisible().catch(() => false)) await schliessenKnopf.click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
  }

  // Kategorien: "Alles überspringen" führt direkt zum Abschluss-Screen,
  // ohne jede der 8 Kategorien einzeln durchzuklicken. Ist ein <div
  // onClick>, kein <button> — daher getByText statt getByRole("button").
  await page.getByText("Alles überspringen").click();

  // Abschluss-Screen → zurück auf Home.
  await page.getByRole("button").last().click();
  await expect(page.getByText("Tagebuch")).toBeVisible({ timeout: 10000 });

  expect(fehler).toEqual([]);
});
