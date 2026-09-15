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
// (Protokollname, Vorname) — testet NICHT jede einzelne der 9 Kategorien im
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

// Nutzerinnen-Vorgabe (15.09.): Bildschirmzeit muss auch als eigener
// Kategorie-Schritt im Erst-Onboarding abgefragt werden (nicht nur über
// "Mehr" nachträglich erreichbar) — mit den vier von ihr konkret genannten
// Reflexionsfragen (üblicher Verbrauch, Haupttätigkeit, Reduzieren
// vorstellbar, künftiges Limit). Fährt denselben Weg wie der komplette
// Onboarding-Test oben bis zu den Kategorien, klickt dort Schlaf/Hydration/
// Tageslicht bewusst weg (unterschiedliche Skip-Wege: Schlaf/Tageslicht
// haben noch die "Jetzt/Später einrichten"-Gate-Seite, Hydration nicht —
// siehe effectiveModus in OnboardingCategoriesView.jsx), um beim vierten
// Schritt (Bildschirmzeit) anzukommen.
test("Onboarding-Kategorien: Bildschirmzeit fragt üblichen Verbrauch, Haupttätigkeit, Reduzieren-Vorstellung und Limit ab", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html?onboarding=1");

  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Los geht's", exact: true }).click();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("E2E-Test-Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter geht's" }).last().click();
  await page.getByRole("button", { name: "Nein, ich mach's selbst" }).click();
  await page.getByPlaceholder("z. B. Anton Kaufmann").fill("E2E Testperson");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();

  for (const titel of ["Ziel & Grund", "Dein Profil & Ausgangslage", "Deine Laborwerte", "Morgen- & Abendroutine"]) {
    await expect(page.getByText(titel, { exact: true })).toBeVisible();
    const schliessenKnopf = page.getByRole("button", { name: "Schließen" });
    if (await schliessenKnopf.isVisible().catch(() => false)) await schliessenKnopf.click();
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
  }

  // Schlaf: hat noch die Gate-Seite ("Jetzt/Später einrichten").
  await expect(page.getByText("Schlafplan einrichten?")).toBeVisible();
  await page.getByRole("button", { name: "Später einrichten" }).click();

  // Hydration: KEINE Gate-Seite (effectiveModus fest auf "jetzt"), startet
  // direkt im KiChat-Vollbild-Modal — erst schließen, dann überspringen.
  const hydrationSchliessen = page.getByRole("button", { name: "Schließen" });
  if (await hydrationSchliessen.isVisible().catch(() => false)) await hydrationSchliessen.click();
  await page.getByRole("button", { name: "Doch überspringen" }).click();

  // Tageslicht: wieder mit Gate-Seite.
  await expect(page.getByText("Tageslichtplan einrichten?")).toBeVisible();
  await page.getByRole("button", { name: "Später einrichten" }).click();

  // Bildschirmzeit: Gate-Seite, dann "Jetzt einrichten".
  await expect(page.getByText("Bildschirmzeitplan einrichten?")).toBeVisible();
  await page.getByRole("button", { name: "Jetzt einrichten" }).click();

  const bildschirmzeitSchliessen = page.getByRole("button", { name: "Schließen" });
  if (await bildschirmzeitSchliessen.isVisible().catch(() => false)) await bildschirmzeitSchliessen.click();

  // Die drei Ist-Zustand-Reflexionsfragen und das Limit-Feld müssen alle
  // sichtbar sein — genau die Fragen aus der Nutzerinnen-Vorgabe.
  await expect(page.getByText("Wie viel Bildschirmzeit hast Du üblicherweise am Tag?", { exact: true })).toBeVisible();
  await expect(page.getByText("Was machst Du am meisten am Telefon?", { exact: true })).toBeVisible();
  await expect(page.getByText("Kannst Du Dir vorstellen, das zu reduzieren?", { exact: true })).toBeVisible();
  await expect(page.getByText("Tageslimit in Minuten (Obergrenze, nicht Ziel zum Erreichen)", { exact: true })).toBeVisible();

  await page.getByPlaceholder("z. B. 60").fill("45");
  await page.getByRole("button", { name: "Speichern & weiter", exact: true }).click();

  // Danach kommt Ernährung — bestätigt, dass der neue Schritt sauber ins
  // bestehende Karussell einreiht, statt es zu unterbrechen.
  await expect(page.getByText("Ernährungsplan einrichten?")).toBeVisible();

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
  await page.goto("/e2e/harness/index.html");

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
  await expect(page.getByText("Tagebuch")).toBeVisible();
  await expect(page.getByPlaceholder("z. B. Sommer 2026")).not.toBeVisible();

  expect(fehler).toEqual([]);
});

test("Neues Protokoll (bestehendes Konto): nach Bestätigung überspringt Name & Quick-Win, fragt aber weiterhin nach Ziel & Grund", async ({ page }) => {
  const fehler = sammleKonsolenfehler(page);
  await page.goto("/e2e/harness/index.html");

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
  await page.goto("/e2e/harness/index.html");

  await page.getByRole("button", { name: "Neues Protokoll" }).click();
  await page.getByRole("button", { name: "Ja, archivieren und neu beginnen" }).click();
  await page.getByPlaceholder("z. B. Sommer 2026").fill("Drittes Protokoll");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByText("Ziel & Grund", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Ja, kurz aktualisieren" }).click();

  await expect(page.getByText("Dein Profil & Ausgangslage", { exact: true })).toBeVisible();

  expect(fehler).toEqual([]);
});
