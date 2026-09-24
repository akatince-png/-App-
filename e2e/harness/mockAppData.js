// Automatischer Mock für useAppData() (~150 Felder aus ~30 Daten-Hooks) —
// für einen echten, handgeschriebenen Mock müsste jeder Hook einzeln
// gelesen werden. Stattdessen ein Proxy, der für jeden angefragten
// Feldnamen anhand des Namens rät, ob es sich um eine Funktion oder um
// Daten handelt, und einen plausiblen leeren/neutralen Wert liefert.
//
// WICHTIG (aus der ersten Version dieses Harness, siehe UEBERGABEPROTOKOLL.md
// Teil 80): jeder Wert MUSS pro Schlüssel gecacht werden (Map unten) — sonst
// liefert jeder Zugriff eine neue Array-/Funktions-Referenz, und
// Komponenten mit `useEffect([irgendeinAppDataFeld])` laufen in eine
// Endlosschleife ("Maximum update depth exceeded"), weil React die
// Dependency bei jedem Render als "verändert" sieht.
//
// Das ist bewusst ein Kompromiss für einen SMOKE-Test (nichts stürzt ab,
// Navigation funktioniert) — kein Ersatz für echte Rendering-Assertions
// mit konkreten Daten. Fehlt ein Muster unten, wirft die betroffene Stelle
// beim Testlauf einen Konsolenfehler ("... is not a function" o. Ä.) statt
// still falsch zu funktionieren — dann hier ergänzen.

// Bug-Fix (13.09., beim Ausbau auf den Onboarding-Flow): eine reine
// Namens-Heuristik per Regex verfehlte immer wieder einzelne, unvorher-
// sehbare Verb-Endungen (z. B. "hauptprotokollErstellen", "hilfeAnfordern",
// "coachVerlaufLaden") — jede Lücke bedeutete einen "... is not a function"-
// Absturz an einer zufälligen Stelle. Robuster: die komplette Liste der
// echten Aktions-Funktionen direkt aus dem Code extrahiert
// (`grep -ohE "const [a-zA-Z]+ = useCallback" src/data/*.js src/views/**/*.jsx`),
// statt zu raten. Die Regex-Heuristik danach bleibt als Rückfallebene für
// Felder, die dabei nicht erfasst wurden (z. B. neuere, seither
// hinzugekommene Funktionen).
const BEKANNTE_FUNKTIONEN = new Set([
  "addCustomMesswert", "addCustomPreparat", "addPeptidRow", "aenderungEntfernen", "aenderungVermerken",
  "allesZuruecksetzen", "gruppenBausteinUmschalten", "gruppenprotokolleNeuLaden", "fortschrittZuruecksetzen", "atemuebungAbschliessen", "atemuebungEntfernen", "atemuebungHinzufuegen",
  "ausnahmeEntfernen", "ausnahmeSetzen", "blutwertEntfernen", "coachNachrichtSpeichern", "coachVerlaufLaden",
  "coachWissenEntfernen", "coachWissenHinzufuegen", "completeOnboarding", "confirmAlleTageszeit",
  "durchlaufSpeichern", "gewichtEntfernen", "gewichtHinzufuegen", "gewohnheitAkutFavoritUmschalten",
  "gewohnheitEntfernen", "gewohnheitHinzufuegen", "gewohnheitZielAktualisieren", "handleBlutwertFoto",
  "hauptprotokollErstellen", "hauptprotokollLoeschen", "hauptprotokollUmbenennen", "hilfeAnfordern", "hormonEntfernen", "hormonHinzufuegen",
  "hydrationCheckinSpeichern", "hydrationHinzufuegen", "hydrationZielSetzen", "hydrationZielZuruecksetzen",
  "lexikonFragen", "lexikonSchnellFragen", "load", "loadArchived", "mahlzeitAendern", "mahlzeitEntfernen",
  "mahlzeitHinzufuegen", "nachrichtSenden", "programmEntfernen", "programmHinzufuegen", "projektEntfernen",
  "projektHinzufuegen", "protokollArchivieren", "protokollLoeschen", "pushAktivieren", "pushDeaktivieren",
  "pushTestSenden", "questFortschrittSpeichern", "removeCustomMesswert", "removePeptidRow", "resetOnboarding",
  "rezeptEntfernen", "rezeptHinzufuegen", "saveHormonFeedback", "saveSupplementFeedback", "schlafHinzufuegen",
  "schrittEntfernen", "schrittHinzufuegen", "schrittVerschieben", "setBelohnungPufferMin", "setBiomarkerWert",
  "setCategoryZiel", "setDauer", "setDose", "setDoseBatch", "setEinnahmeart", "setErinnerung", "setHormonDose",
  "setHormonDoseBatch", "setHormonEinnahmeart", "setHormonFoto", "setHormonKategorie", "setMahlzeitFoto",
  "setNotizen", "setPeptidFoto", "setPersonal", "setStartdatum", "setSteckbrief", "setSupplementFoto",
  "skipHormonFeedback", "skipSupplementFeedback", "spotifyAbspielen", "spotifyAnlassEntfernen",
  "spotifyAnlassSetzen", "spotifyAutoPlayTokenErzeugen", "spotifyFortsetzen", "spotifyLautstaerke",
  "spotifyPausieren", "spotifyPlaylistHinzufuegen", "spotifyPlaylistLoeschen", "spotifyVerbindungNeuLaden",
  "spotifyVerbindungTrennen", "starteTraining", "supplementAendern", "supplementEntfernen",
  "supplementHinzufuegen", "tageslichtHinzufuegen", "tageslichtZielSetzen", "tageslichtZielZuruecksetzen",
  "teamNachrichtGelesen", "teamNachrichtSenden", "teilprotokollSpeichern", "templateBearbeiten",
  "templateEntfernen", "templateSpeichern", "toggleDatenteilung", "toggleGewohnheitErledigt",
  "toggleHormonErledigt", "toggleMahlzeitErledigt", "toggleMesswert", "togglePeptid", "toggleRezeptErledigt",
  "toggleSchrittErledigt", "toggleSupplementErledigt", "toggleZiel", "trainingAbschliessen",
  "trainingEntfernen", "trainingErledigtSetzen", "trainingFeedbackSpeichern", "trainingHinzufuegen",
  "uebungAnfordern", "uebungsBildEntfernen", "uebungsBildHochladen", "verknuepfeMitHauptprotokoll",
  "versionFesthalten", "versionLoeschen", "wochenplanBearbeiten", "wochenplanEntfernen",
  "wochenplanErinnerungUmschalten", "wochenplanErinnerungenAlleSetzen", "wochenplanHinzufuegen",
  "wochenplanMahlzeitEntfernen", "wochenplanMahlzeitSetzen", "wochenprotokollSnapshotErzeugen",
  "workflowPlanEntfernen", "workflowPlanHinzufuegen", "workflowPresetAendern", "workflowPresetHinzufuegen",
  "workflowPresetLoeschen", "zeitblockBearbeiten", "zeitblockEntfernen", "zeitblockHinzufuegen",
  "zeitrahmenSetzen", "zuruecksetzen", "zutatAendern", "zutatEntfernen", "neueZutat",
]);

// "i"-Flag ist hier Pflicht, nicht Kosmetik: camelCase-Komposita wie
// "spotifyVerbindungTrennen" oder "pushAktivieren" haben den Wortanfang
// großgeschrieben — ohne /i verfehlte diese Heuristik genau solche Fälle
// (beim ersten Testlauf gefunden: spotifyVerbindungTrennen wurde als Daten-
// statt Funktionsfeld erkannt, `onClick={spotifyVerbindungTrennen}` bekam
// dadurch ein Array statt eine Funktion — React-Fehler "Expected onClick
// listener to be a function").
const FUNKTIONS_PRAEFIXE = /^(set|toggle|add|save|skip|complete|clear|reset|update|create|delete|open|close|handle|on|confirm|verknuepfe|load)[A-ZÄÖÜ]/;
const FUNKTIONS_SUFFIXE =
  /(hinzufuegen|entfernen|speichern|loeschen|erzeugen|erstellen|setzen|aktualisieren|markieren|bestaetigen|pruefen|vermerken|archivieren|abschliessen|neuLaden|laden|fragen|anfordern|aktivieren|deaktivieren|trennen|kopieren|starten|stoppen|verbinden|anlegen|einladen|umschalten|zuruecksetzen|verwerfen|uebernehmen|ueberarbeiten)$/i;

// Felder, die eine feste, von der Namens-Heuristik abweichende Bedeutung
// haben (Flags, die über Weiterleitung/Sichtbarkeit entscheiden) — werden
// VOR der generischen Heuristik geprüft. `overrides` erlaubt Tests, z. B.
// onboardingComplete gezielt auf false zu setzen (siehe e2e/harness/TestApp.jsx),
// um den Onboarding-Flow statt der Hauptansicht zu erreichen.
function explizit(userId, overrides) {
  // ?onboarding=1 (siehe TestApp.jsx) simuliert einen wirklich frischen
  // Account (overrides.onboardingComplete === false) — der hat naturgemäß
  // noch KEIN aktives Hauptprotokoll. Der Fake unten gilt deshalb nur für
  // den normalen "schon eingerichtetes Konto"-Harness-Zustand, sonst würde
  // z. B. HauptprotokollErstellenView.jsx im echten Erst-Onboarding
  // fälschlich "Weiter mit diesem Protokoll" statt des leeren Namensfelds
  // anbieten (gibtBestehendesAnGeboten prüft genau dieses Feld).
  const istFrischesOnboarding = overrides?.onboardingComplete === false;
  return {
    userId,
    loading: false,
    onboardingComplete: true,
    isAdmin: true,
    belohnungPufferMin: 10,
    // Profilbild (24.09.): einzelner Pfad oder keiner — der Array-Fallback
    // wäre truthy und würde als Storage-Pfad benutzt.
    profilbildPfad: null,
    // Team (24.09.): standardmäßig keins — der Array-Fallback wäre truthy.
    team: null,
    gruppenprotokolle: [],
    eigeneGruppenLogs: [],
    // Punkte teilen (24.09.): Startzustand aus, wie bei echten Konten.
    ranglisteSichtbar: false,
    // Zähler je Gewohnheit (Gewohnheiten-Seite) liefern Zahlen, keine
    // {ok}-Antwort wie die übrigen Aktions-Funktionen.
    gesamtTage: () => 0,
    aktuelleSerie: () => 0,
    // Ein voll eingerichtetes Testkonto (Standard-Harness-Zustand) hätte in
    // echt immer ein aktives Hauptprotokoll — ohne diesen Mock würde die
    // generische siehtAusWieId()-Heuristik `null` liefern und z. B.
    // NeuesProtokollBestaetigenView.jsx (fragt vor "Neues Protokoll" nach
    // Bestätigung + zeigt den Stand des alten Protokolls) sofort automatisch
    // weiterspringen, statt sich testen zu lassen.
    aktivesHauptprotokoll: istFrischesOnboarding
      ? null
      : { id: "e2e-hauptprotokoll-1", name: "E2E-Testprotokoll", startdatum: "2026-01-01", status: "active" },
    teilprotokolle: istFrischesOnboarding
      ? []
      : [
          { hauptprotokoll_id: "e2e-hauptprotokoll-1", kategorie: "schlaf", aktiv: true, aktiviert_am: "2026-01-01T00:00:00.000Z" },
          { hauptprotokoll_id: "e2e-hauptprotokoll-1", kategorie: "hydration", aktiv: true, aktiviert_am: "2026-01-01T00:00:00.000Z" },
        ],
    ...overrides,
  };
}

function siehtAusWieFunktion(key) {
  return BEKANNTE_FUNKTIONEN.has(key) || FUNKTIONS_PRAEFIXE.test(key) || FUNKTIONS_SUFFIXE.test(key);
}

function siehtAusWieId(key) {
  // "aktives Hauptprotokoll" (neutrum-Singular-Adjektivendung "-es") meint
  // GENAU EIN Objekt oder eben keins — anders als "aktivE Nachrichten"
  // (Plural-Endung "-e"), das eine Liste meint. Gleicher Bug wie bei den
  // Id-Feldern: ein Array-Fallback wäre truthy und würde vorgaukeln, es
  // gäbe schon ein aktives Protokoll, obwohl ein frischer Onboarding-Nutzer
  // (den dieser Harness u. a. simuliert) noch keins hat.
  // "datum"-Endung (z. B. "startdatum"): ein einzelner ISO-Datumsstring oder
  // eben keiner — Aufrufer wie `startdatum ? parseLocalISODate(startdatum) :
  // fallback` (WochenuebersichtView.jsx) erwarten bei "nicht vorhanden"
  // einen falsy-Wert, nicht ein truthy-Array, das dann als String behandelt
  // würde (Absturz bei `.split()`, siehe dates.js).
  return /Id$/.test(key) || /^aktives[A-ZÄÖÜ]/.test(key) || /datum$/i.test(key);
}

function siehtAusWieZahl(key) {
  // Bug-Fix (15.09., beim Einbau von Bildschirmzeit gefunden): "Minuten"
  // ausgeschrieben (z. B. "tageslichtZielMinuten", "bildschirmzeitHeuteMinuten")
  // endete bisher auf keines der Muster ("Min$" trifft nur die Abkürzung,
  // nicht "...Minuten") und fiel dadurch fälschlich in den generischen
  // Array-Fallback — leere Zahlenfelder wirkten dadurch in der Oberfläche
  // leer statt 0, obwohl der echte Hook nie ein Array liefert.
  return /(Min|Minuten|Ml|Prozent|Punkte|Tage|Anzahl|Ziel|Dauer)$/.test(key);
}

function siehtAusWieBoolean(key) {
  return /^(ist|hat|kann|darf)[A-ZÄÖÜ]/.test(key) || /(Aktiv|Verfuegbar|Erledigt|Abgeschlossen|Sichtbar)$/.test(key);
}

// Rückgabewert für gemockte "Erstellen/Speichern"-Funktionen: viele prüfen
// `result.ok` und lesen danach `result.irgendeinName.id` (z. B.
// `result.hauptprotokoll.id` in HauptprotokollErstellenView.jsx) — welcher
// Name das genau ist, unterscheidet sich pro Aufrufstelle. Ein simples
// `{ ok: true }` würde bei jedem verschachtelten Zugriff scheitern
// ("Cannot read properties of undefined"). Deshalb selbst ein Proxy: `ok`
// ist echt `true`, jedes andere Feld liefert wieder ein Objekt mit einer
// `id` — deckt `result.eintrag.id`, `result.hauptprotokoll.id` usw. generisch
// ab, ohne jede Aufrufstelle einzeln zu kennen.
function baueErfolgsErgebnis() {
  return new Proxy(
    { ok: true },
    {
      get(target, key) {
        if (key in target) return target[key];
        if (key === "id") return "e2e-mock-id";
        if (typeof key !== "string") return undefined;
        return { id: "e2e-mock-id" };
      },
    }
  );
}

export function baueMockAppData(userId, overrides) {
  const cache = new Map();
  const basis = explizit(userId, overrides);

  return new Proxy(basis, {
    get(target, key) {
      if (typeof key !== "string") return target[key];
      if (key in target) return target[key];
      if (cache.has(key)) return cache.get(key);

      let wert;
      if (key === "routineSchrittZeit") {
        // Bug-Fix (16.09., beim Bau der Routine-Schritte-Liste gefunden):
        // eine synchrone ABFRAGE-Funktion (liefert direkt einen String,
        // kein Promise wie jede "echte" Aktion) — passt weder zur
        // generischen Funktions-Heuristik unten (die IMMER ein Promise
        // liefert, hier hätte das rendernde `{zeit && ...}` ein Promise-
        // Objekt statt eines Strings bekommen) noch zu den übrigen
        // Mustern. War bisher unbemerkt, weil kein Test `routineSchritte`
        // je mit echten Einträgen füllte — RoutineHeuteChecklist.jsx nutzt
        // dieselbe Funktion genauso und wäre ebenso betroffen gewesen.
        wert = () => "";
      } else if (siehtAusWieFunktion(key)) {
        // Aufrufe mitschreiben (24.09.), damit Tests prüfen können, ob z. B.
        // aenderungVermerken() beim Abhaken wirklich aufgerufen wird.
        wert = (...args) => {
          if (typeof window !== "undefined") (window.__mockAufrufe ||= []).push({ name: key, args });
          return Promise.resolve(baueErfolgsErgebnis());
        };
      } else if (siehtAusWieId(key)) {
        // Bug-Fix (beim ersten Testlauf gefunden): ein generischer
        // Array-/Objekt-Fallback ist zwar leer, aber TRUTHY — jede
        // `if (irgendeineId)`-Weiche in der App hielt so ein nicht wirklich
        // vorhandenes Protokoll/Hauptprotokoll/... fälschlich für
        // "vorhanden" und lief dadurch in Code-Pfade, die echte, hier gar
        // nicht gemockte Werte erwarten (z. B. protocolId truthy ->
        // wochenprotokollFaellig() liest startdatum als String, bekam aber
        // einen Array-Fallback, Absturz bei `.split()`). Id-Felder daher
        // explizit `null` (falsy) statt in den generischen Array-Fallback
        // unten zu fallen.
        wert = null;
      } else if (siehtAusWieBoolean(key)) {
        wert = false;
      } else if (siehtAusWieZahl(key)) {
        wert = 0;
      } else if (/(Map|NachDatum|NachSchluessel)$/.test(key)) {
        // Echte JS-Map — Aufrufer nutzen hier .get(key), nicht
        // Objekt-Zugriff (z. B. trainingNachDatum in dayItems.js).
        wert = new Map();
      } else if (/(Erledigt|Dosierung)$/.test(key)) {
        wert = {};
      } else {
        // Genereller Fallback: Arrays sind das mit Abstand häufigste
        // Feld-Muster (Listen von Einträgen) und werden meist direkt ohne
        // "|| []"-Absicherung durchgereicht (.map/.filter/.forEach) —
        // ein leeres Array bricht dort nichts ab.
        wert = [];
      }
      cache.set(key, wert);
      return wert;
    },
  });
}
