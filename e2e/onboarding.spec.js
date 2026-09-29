import { test, expect } from "@playwright/test";
import { sammleKonsolenfehler } from "./helpers.js";

// Simuliert die Web-Speech-API (kein echtes Mikrofon im Testrunner
// verfügbar): `start()` liefert nach kurzer Verzögerung erst ein
// Zwischenergebnis (onZwischenergebnis, noch nicht bestätigt), danach ein
// fertiges Endergebnis (onErgebnis) — genau die zwei Stufen, die
// useDiktat.js (src/ui/useDiktat.js) unterscheidet. Bewusst als eigene
// Funktion statt Inline-Closure, damit sie unverändert per
// page.addInitScript() ins Browser-Context-JS injiziert werden kann (läuft
// dort, nicht in Node — kein Zugriff auf Variablen von hier draußen).
function fakeSpeechRecognitionEinrichten() {
  class FakeSpeechRecognition {
    start() {
      setTimeout(() => {
        const zwischen = [{ transcript: "Anton" }];
        zwischen.isFinal = false;
        this.onresult?.({ resultIndex: 0, results: [zwischen] });
      }, 30);
      setTimeout(() => {
        const fertig = [{ transcript: "Anton Diktiert" }];
        fertig.isFinal = true;
        this.onresult?.({ resultIndex: 0, results: [fertig] });
        this.onend?.();
      }, 90);
    }
    stop() {
      this.onend?.();
    }
  }
  window.SpeechRecognition = FakeSpeechRecognition;
  window.webkitSpeechRecognition = FakeSpeechRecognition;
}

test("Diktierfunktion ohne KI: Onboarding-Namensfeld lässt sich per Mikrofon befüllen (Web-Speech-API, kein AIService-Aufruf)", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  let kiAufgerufen = false;
  await page.route("**/functions/v1/**", (route) => {
    kiAufgerufen = true;
    route.abort();
  });
  await page.addInitScript(fakeSpeechRecognitionEinrichten);
  await page.goto("/e2e/harness/index.html?onboarding=1");

  // Vorstellung (Vorschau 26.09.) überspringen, danach steht das
  // Namensfeld direkt auf der "Du & Aka"-Seite.
  await page.getByRole("button", { name: "Überspringen", exact: true }).click();

  const namensfeld = page.getByPlaceholder("z. B. Anton Kaufmann");
  await expect(namensfeld).toBeVisible();
  await expect(namensfeld).toHaveValue("");

  await page.getByTitle("Diktieren (ohne KI)").click();

  // Zwischenergebnis wird sichtbar angezeigt, aber noch NICHT ins Feld
  // übernommen — erst das finale Ergebnis landet im Feld.
  await expect(page.getByText("Anton…")).toBeVisible();
  await expect(namensfeld).toHaveValue("");

  await expect(namensfeld).toHaveValue("Anton Diktiert");
  await expect(page.getByText("Anton…")).not.toBeVisible();

  expect(kiAufgerufen).toBe(false);
  expect(fehler).toEqual([]);
});

// Erst-Onboarding nach AKA-Konzept (27.09., Nutzerinnen-Vorgabe nach
// eigenem Durchlauf): Vorstellung → Du & Aka (nur zwei Wege) → Ziel & Grund
// → Steckbrief → Startzeiten (Abend zuerst) → Startklar. Keine Bereichswahl,
// kein Routinen-Baukasten – die Schritte bringt das Programm.
test("Onboarding: kompletter Durchlauf von Willkommen bis zurück auf Home", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?onboarding=1");

  await expect(page.getByText("Viele Tabs im Kopf?")).toBeVisible();
  await page.getByRole("button", { name: "Überspringen", exact: true }).click();

  await page.getByPlaceholder("z. B. Anton Kaufmann").fill("E2E Testperson");
  // Nur noch zwei Wege, "frei erzählen" gibt es nicht mehr.
  await expect(page.getByRole("button", { name: /Ich erzähl Aka einfach frei/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "💬 Aka fragt mich Schritt für Schritt" })).toBeVisible();
  await page.getByRole("button", { name: "🙋 Ich klick mich selbst durch" }).click();

  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tagesstruktur aufbauen" }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();

  await expect(page.getByText("Womit willst du starten?")).toHaveCount(0);
  await expect(page.getByText("Kurzer Steckbrief")).toBeVisible();
  // Steckbrief zum Antippen (27.09.) statt Freitext.
  await expect(page.getByRole("button", { name: "2× pro Woche", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Krafttraining", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Etwas anderes? (optional)")).toBeVisible();
  // Standardwerte + Kalorienrechner (27.09.).
  await page.getByRole("button", { name: "Weiblich", exact: true }).click();
  await page.getByPlaceholder("170", { exact: true }).fill("170");
  await page.getByPlaceholder("70", { exact: true }).fill("70");
  await page.locator("[data-steckbrief-person]").locator("..").locator('input[type="date"]').fill("1990-05-01");
  await page.getByRole("button", { name: "Leicht aktiv", exact: true }).click();
  await expect(page.locator("[data-steckbrief-kalorien]")).toContainText("Grundumsatz ca.");
  await expect(page.locator("[data-steckbrief-kalorien]")).toContainText("Tagesbedarf ca.");
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();

  // Nur Startzeiten, Abend zuerst.
  await expect(page.getByText("Wann startest du?")).toBeVisible();
  const abend = page.getByText("🌙 Abendroutine beginnt um");
  const morgen = page.getByText("🌅 Morgenroutine beginnt um");
  expect((await abend.boundingBox()).y).toBeLessThan((await morgen.boundingBox()).y);
  await expect(page.locator('input[type="time"]').first()).toHaveValue("21:30");
  await expect(page.locator('input[type="time"]').nth(1)).toHaveValue("06:30");
  await expect(page.getByText("Morgen- & Abendroutine", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();

  await page.getByRole("button", { name: "Los geht's" }).last().click();
  // Danach einmal die Tour "So geht's weiter" (27.09.).
  await expect(page.getByText("Deine ersten 8 Wochen")).toBeVisible({ timeout: 10000 });
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Alles klar – zur Startseite" }).click();
  await expect(page.locator("[data-home-kopf]")).toBeVisible({ timeout: 10000 });

  expect(fehler).toEqual([]);
});

// Coachee im Kurz-Modus (24.09.): Willkommen → Name → Ziel & Grund →
// Steckbrief → Startklar (Profil & Laborwerte als "später").
test("Onboarding (Coachee, kurz): ohne Bereichswahl über den Steckbrief zum Abschluss", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?onboarding=1&isAdmin=0");
  await page.getByRole("button", { name: "Überspringen", exact: true }).click();
  await page.getByPlaceholder("z. B. Anton Kaufmann").fill("E2E Coachee");
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();
  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();
  await expect(page.getByText("Womit willst du starten?")).toHaveCount(0);
  const schliessen = page.getByRole("button", { name: "Schließen" });
  if (await schliessen.isVisible().catch(() => false)) await schliessen.click();
  await expect(page.getByText("Kurzer Steckbrief")).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).last().click();
  await expect(page.getByText("Wann startest du?")).toBeVisible();
  expect(fehler).toEqual([]);
});

// Nutzerinnen-Vorgabe (15.09.): "Neues Protokoll" bei einem bereits
// bestehenden, fertig eingerichteten Konto (Standard-Harness-Zustand, kein
// ?onboarding=1) fragt zuerst per NeuesProtokollBestaetigenView.jsx nach
// ("möchte ich erstmal gefragt werden ... das soll nicht einfach blind
// passieren") und läuft danach NICHT mehr den kompletten Erst-Onboarding-
// Fragebogen nochmal durch (Name erneut abfragen, Quick-Win-Feier für den
// "ersten Schritt") — aber "Ziel & Grund" bleibt bewusst ein Pflicht-
// Schritt (jedes Protokoll bekommt sein eigenes Ziel oder ausdrücklich
// keins), nur die Profildaten stecken hinter einem optionalen Ja/Nein-
// Zwischenschirm (OnboardingWerteAktualisierenView.jsx).
test("Neues Protokoll (bestehendes Konto): fragt vor dem Archivieren nach, zeigt den Stand des alten Protokolls", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  // Seit Design 2.0 (29.09.) sitzt „Neues Protokoll“ oben unter Mehr.
  await page.goto("/e2e/harness/index.html#/mehr");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();

  // Bestätigungs-Screen zeigt Name, Startdatum und Anzahl aktiver Bereiche
  // des BISHERIGEN Protokolls (aus mockAppData.js: "E2E-Testprotokoll",
  // seit 2026-01-01, zwei aktive Teilprotokolle) — informiert VOR jeder
  // Archivierung, statt blind zu archivieren.
  await expect(page.getByText("Neues Protokoll beginnen?")).toBeVisible();
  await expect(page.getByText("E2E-Testprotokoll", { exact: true })).toBeVisible();
  await expect(page.getByText("seit 2026-01-01", { exact: false })).toBeVisible();
  await expect(page.getByText("2 Bereiche aktiv", { exact: true })).toBeVisible();

  // "Abbrechen": kein Archivieren, keine Weiterleitung ins Formular —
  // bleibt auf Home.
  await page.getByRole("button", { name: "Abbrechen, beim aktuellen Protokoll bleiben" }).click();
  await expect(page.locator("[data-home-kopf]")).toBeVisible();
  await expect(page.getByPlaceholder("z. B. Sommer 2026")).not.toBeVisible();

  expect(fehler).toEqual([]);
});

test("Neues Protokoll (bestehendes Konto): nach Bestätigung überspringt Name & Quick-Win, fragt aber weiterhin nach Ziel & Grund", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  // Seit Design 2.0 (29.09.) sitzt „Neues Protokoll“ oben unter Mehr.
  await page.goto("/e2e/harness/index.html#/mehr");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();
  await expect(page.getByText("Neues Protokoll beginnen?")).toBeVisible();
  await page.getByRole("button", { name: "Ja, archivieren und neu beginnen" }).click();

  await expect(page.getByPlaceholder("z. B. Sommer 2026")).toBeVisible();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("Zweites Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  // Weder die Quick-Win-Feier noch die Namensabfrage dürfen hier auftauchen
  // — beide sind nur für ein wirklich erstes Onboarding sinnvoll.
  await expect(page.getByText("Erster Schritt geschafft!", { exact: false })).not.toBeVisible();
  await expect(page.getByText("Stell dich vor", { exact: false })).not.toBeVisible();

  // Neu (16.09.): direkt nach dem Protokollnamen kommt die Frage "allein
  // oder mit Aka" — vorher fehlte diese Nachfrage bei "Neues Protokoll"
  // komplett, siehe OnboardingKiWahlView.jsx.
  await expect(page.getByText("Wie soll's laufen?", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Mit Aka", exact: true }).click();

  // "Ziel & Grund" kommt trotzdem direkt als nächstes — jedes neue
  // Protokoll bekommt sein eigenes Ziel (oder ausdrücklich keins).
  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  // Danach der Ja/Nein-Zwischenschirm — fragt nur noch nach Profildaten,
  // nicht mehr nach dem Ziel (das war gerade schon dran).
  await expect(page.getByText("Fast geschafft 🎉")).toBeVisible();
  await page.getByRole("button", { name: "Nein, weiter geht's" }).click();

  // "Nein" überspringt Profil komplett, landet direkt bei den Laborwerten
  // (KiChat-Modal dort schließen, wie im vollen Durchlauf).
  await expect(page.getByText("Dein Profil & Ausgangslage", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Deine Laborwerte", { exact: true })).toBeVisible();
  const schliessenKnopf = page.getByRole("button", { name: "Schließen" });
  if (await schliessenKnopf.isVisible().catch(() => false)) await schliessenKnopf.click();

  expect(fehler).toEqual([]);
});

test("Neues Protokoll (bestehendes Konto): „Ja, kurz aktualisieren“ führt noch durch Profil & Ausgangslage", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  // Seit Design 2.0 (29.09.) sitzt „Neues Protokoll“ oben unter Mehr.
  await page.goto("/e2e/harness/index.html#/mehr");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();
  await page.getByRole("button", { name: "Ja, archivieren und neu beginnen" }).click();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("Drittes Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByText("Wie soll's laufen?", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Mit Aka", exact: true }).click();
  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Ja, kurz aktualisieren" }).click();

  await expect(page.getByText("Dein Profil & Ausgangslage", { exact: true })).toBeVisible();

  expect(fehler).toEqual([]);
});

// Nutzerinnen-Vorgabe (16.09.): "ich möchte selbst ausführen angeklickt ...
// und trotzdem poppt immer die KI auf" — die neue "Wie soll's laufen?"-Frage
// (OnboardingKiWahlView.jsx) muss die Wahl "Alleine" auch wirklich
// durchsetzen: kein automatisch geöffnetes KiChat-Modal mehr, weder bei
// Laborwerte noch beim ersten Kategorie-Schritt (Hydration hat sonst IMMER
// effectiveModus="jetzt" + <KiChat autoStart>, unabhängig vom
// Kategorie-Gate). "Schließen" ist der eindeutige Beleg für ein offenes
// KiChat-Vollbild-Modal (siehe KiChat.jsx) — dessen Abwesenheit beweist,
// dass getKiAktiv() jetzt false ist.
test("Neues Protokoll (bestehendes Konto): „Alleine, ohne Aka“ unterdrückt das automatische KI-Popup auf den folgenden Seiten", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  // Seit Design 2.0 (29.09.) sitzt „Neues Protokoll“ oben unter Mehr.
  await page.goto("/e2e/harness/index.html#/mehr");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();
  await page.getByRole("button", { name: "Ja, archivieren und neu beginnen" }).click();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("Viertes Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  await expect(page.getByText("Wie soll's laufen?", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Alleine, ohne Aka", exact: true }).click();

  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByText("Fast geschafft 🎉")).toBeVisible();
  await page.getByRole("button", { name: "Nein, weiter geht's" }).click();

  await expect(page.getByText("Deine Laborwerte", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Schließen" })).not.toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  await expect(page.getByText("Morgen- & Abendroutine", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  // Kategorien: der Standard-Harness-Zustand (bestehendes Konto, kein
  // ?onboarding=1) hat schon eine abgeschlossene "hydration"-teilprotokolle-
  // Zeile (siehe mockAppData.js) — das Zwischenspeichern-Feature (siehe
  // OnboardingCategoriesView.jsx) steigt deshalb direkt beim zweiten
  // Kategorie-Schritt (Tageslicht) wieder ein, nicht bei Hydration. Auch
  // Tageslicht hätte hier sonst automatisch das KiChat-Modal geöffnet,
  // sobald "Jetzt einrichten" angetippt wird.
  await expect(page.getByText("Tageslichtplan einrichten?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jetzt einrichten" }).click();
  await expect(page.getByRole("button", { name: "Schließen" })).not.toBeVisible();

  expect(fehler).toEqual([]);
});

// Vorstellung vor dem Start (Vorschau 26.09.): zehn Seiten im App-Look,
// Tabs zum Antippen, Abend vor Morgen, echtes Gehirn mit Körper.
test("Vorstellung: Tabs antippen, alle Seiten durchblättern, danach geht es zum Namen", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?onboarding=1&isAdmin=0");
  await expect(page.getByText("Viele Tabs im Kopf?")).toBeVisible();
  await page.getByRole("button", { name: "🔥 Hyperfokus" }).click();
  await page.getByRole("button", { name: "😴 Zu spät ins Bett" }).click();
  await expect(page.getByText("2 davon kennst du.")).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByText("Ein guter Morgen beginnt am Abend davor.")).toBeVisible();
  await expect(page.getByText("① Heute Abend")).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.locator('svg[aria-label^="Dein Gehirn"]')).toBeVisible();
  await expect(page.getByLabel(/^Körper:/)).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByText("Erst stellen wir dich ein.")).toBeVisible();
  await page.getByRole("button", { name: "Los geht's", exact: true }).click();
  await expect(page.getByPlaceholder("z. B. Anton Kaufmann")).toBeVisible();
  expect(fehler).toEqual([]);
});
