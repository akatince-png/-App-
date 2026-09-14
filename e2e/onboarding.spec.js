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
  // AIService-Aufrufe müssten (falls die Diktierfunktion fälschlich doch die
  // KI anspräche) über Supabase Edge Functions laufen — schlägt jeder
  // fetch-Versuch dorthin fehl, wäre das ein handfester Test-Fehlschlag
  // statt eines stillen Fallbacks.
  let kiAufgerufen = false;
  await page.route("**/functions/v1/**", (route) => {
    kiAufgerufen = true;
    route.abort();
  });
  await page.addInitScript(fakeSpeechRecognitionEinrichten);
  await page.goto("/e2e/harness/index.html?onboarding=1");

  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Los geht's", exact: true }).click();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("E2E-Test-Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter geht's" }).last().click();
  await page.getByRole("button", { name: "Nein, ich mach's selbst" }).click();

  const namensfeld = page.getByPlaceholder("z. B. Anton Kaufmann");
  await expect(namensfeld).toBeVisible();
  await expect(namensfeld).toHaveValue("");

  await page.getByTitle("Diktieren (ohne KI)").click();

  // Zwischenergebnis: kursiv/blass unterhalb des Felds sichtbar, noch NICHT
  // im eigentlichen Feldwert (siehe DiktatVorschau in ui/primitives.jsx).
  await expect(page.getByText("Anton…")).toBeVisible();
  await expect(namensfeld).toHaveValue("");

  // Endergebnis: landet im echten Feldwert, Zwischenvorschau verschwindet
  // wieder (Aufnahme endet automatisch, siehe FakeSpeechRecognition oben).
  await expect(namensfeld).toHaveValue("Anton Diktiert");
  await expect(page.getByText("Anton…")).not.toBeVisible();

  expect(kiAufgerufen).toBe(false);
  expect(fehler).toEqual([]);
});

// Kompletter Onboarding-Durchlauf, ein Screen nach dem anderen: Willkommen
// (3 Folien) → Hauptprotokoll anlegen → Quick-Win-Zwischenscreen → Intro
// (Name) → Ziele → Profil → Laborwerte → Routinen → Kategorien ("Alles
// überspringen") → Abschluss → zurück auf Home. Nutzt ?onboarding=1 (siehe
// e2e/harness/TestApp.jsx), um einen frischen, noch nicht eingerichteten
// Account zu simulieren.
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

  // Quick-Win-Zwischenscreen (App-Bauplan-Punkt): erste Bestätigung schon
  // direkt nach dem ersten kleinen Schritt, bevor der lange Fragebogen-Teil
  // losgeht. Zwei gleich beschriftete "Weiter geht's"-Knöpfe (Pfeil-
  // Navigation oben, Haupt-Button unten) — .last() wie beim Abschluss-
  // Screen weiter unten.
  await expect(page.getByText("Erster Schritt geschafft!", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Weiter geht's" }).last().click();

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
