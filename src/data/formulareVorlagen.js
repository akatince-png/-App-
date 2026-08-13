// Digitale, ausfüllbare Fassung der 10 Coaching-Formulare aus der AKA
// ADHS-Coaching-Praxisakademie (Teil C). Nur für die Admin/Coachin selbst
// gedacht (Pilotgespräche, eigene Dokumentation) — hat nichts mit der
// Coachee-Nutzung der App zu tun und schreibt nirgends in coach_wissen.
// Jedes Formular ist ein Schema aus Abschnitten mit Feldern, gerendert von
// AdminFormulareView.jsx über einen generischen Feld-Renderer.
//
// Feldtypen:
// - text/date: einzeilige Eingabe
// - textarea: mehrzeilige Eingabe
// - checkbox: einzelnes Ja/Nein
// - checkboxGroup: mehrere ankreuzbare Optionen (+ optional "Sonstiges"-Text)
// - radio: genau eine Option (Pills)
// - skala: Zahlenskala 1..max (Pills)
// - raster: Tabelle. `zeilen` als Array = feste Zeilenbeschriftung in
//   Spalte 1, restliche Spalten frei ausfüllbar. `zeilen` als Zahl = N frei
//   ausfüllbare Zeilen über alle Spalten (für Tabellen ohne feste Einträge).
// - static: reiner Referenztext ohne Eingabe

export const FORMULARE = [
  {
    id: "erstkontakt",
    kurzTitel: "1. Erstkontakt-Bogen",
    titel: "Formular 1: Erstkontakt-Bogen",
    sections: [
      {
        titel: "Kontaktdaten",
        felder: [
          { key: "datum", label: "Datum", typ: "date" },
          { key: "name", label: "Name", typ: "text" },
          { key: "email", label: "E-Mail", typ: "text" },
          { key: "telefon", label: "Telefon (optional)", typ: "text" },
          { key: "alter", label: "Alter", typ: "text" },
        ],
      },
      {
        titel: "Vorab-Information",
        felder: [
          { key: "wieGehoert", label: "Wie hast du von AKA-Coaching gehört?", typ: "radio", optionen: ["Instagram", "Empfehlung", "Webseite", "Sonstiges"] },
          { key: "wieGehoertSonstiges", label: "Sonstiges, und zwar:", typ: "text" },
          { key: "adhsDiagnose", label: "Hast du eine ADHS-Diagnose?", typ: "radio", optionen: ["Ja (Facharzt bekannt)", "Ja (Selbstdiagnose/in Abklärung)", "Nein, aber Verdacht", "Nein"] },
          { key: "facharzt", label: "Facharzt (falls bekannt)", typ: "text" },
          { key: "diagnoseJahr", label: "Jahr der Diagnose", typ: "text" },
          { key: "weitereDiagnosen", label: "Weitere Diagnosen (bitte nur benennen, keine Details)", typ: "checkboxGroup", optionen: ["Depression", "Angststörung", "Suchterkrankung", "Schlafstörung", "Tic/Tourette", "Keine weiteren"], mitAndere: true },
          { key: "medikamenteAktuell", label: "Nimmst du aktuell Medikamente (für ADHS oder andere)?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "medikamenteWelche", label: "Welche (bitte nur Art angeben, keine Dosis)", typ: "textarea" },
        ],
      },
      {
        titel: "Rollenklärung (zu besprechen)",
        felder: [
          {
            key: "rollenklaerung",
            label: "Ich erkläre hiermit:",
            typ: "checkboxGroup",
            optionen: [
              "Das AKA-Coaching ist KEINE medizinische, psychotherapeutische oder heilkundliche Behandlung.",
              "Ich bin Coach, kein Arzt oder Psychotherapeut.",
              "Ich stelle keine Diagnosen und verschreibe keine Medikamente.",
              "Bei gesundheitlichen oder psychischen Beschwerden verweise ich an Fachärzte oder Psychotherapeuten.",
              "Alle Angaben werden vertraulich und DSGVO-konform behandelt.",
            ],
          },
        ],
      },
      {
        titel: "Unterschriften",
        felder: [
          { key: "unterschriftCoachee", label: "Unterschrift Coachee", typ: "text" },
          { key: "datumCoachee", label: "Datum", typ: "date" },
          { key: "unterschriftCoach", label: "Unterschrift Coach", typ: "text" },
          { key: "datumCoach", label: "Datum", typ: "date" },
        ],
      },
      {
        titel: "Nächster Schritt",
        felder: [
          { key: "terminIntake", label: "Termin für Intake-Gespräch", typ: "text" },
          { key: "format", label: "Ort/Format", typ: "radio", optionen: ["Telefon", "Video", "Präsenz"] },
        ],
      },
    ],
  },

  {
    id: "intake",
    kurzTitel: "2. Intake-Bogen",
    titel: "Formular 2: Intake-Bogen",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "datum", label: "Datum", typ: "date" },
          { key: "sitzungNr", label: "Sitzung #", typ: "text" },
          { key: "dauer", label: "Dauer (Min.)", typ: "text" },
        ],
      },
      {
        titel: "Lebenssituation",
        felder: [
          { key: "beruf", label: "Berufliche Situation", typ: "textarea" },
          { key: "familie", label: "Familiäre Situation (Partnerschaft, Kinder, Haushalt)", typ: "textarea" },
          { key: "struktur", label: "Tägliche Struktur (Arbeitszeiten, Schlafenszeiten, Mahlzeiten)", typ: "textarea" },
        ],
      },
      {
        titel: "ADHS-Alltag",
        felder: [
          { key: "symptom1", label: "Belastendstes Symptom 1", typ: "text" },
          { key: "symptom2", label: "Belastendstes Symptom 2", typ: "text" },
          { key: "symptom3", label: "Belastendstes Symptom 3", typ: "text" },
          { key: "ressourcen", label: "In welchen Lebensbereichen funktioniert es gut? (Ressourcen)", typ: "textarea" },
          { key: "schonVersucht", label: "Was hast du schon versucht, um deine Routinen zu verbessern?", typ: "textarea" },
          { key: "hatFunktioniert", label: "Was hat funktioniert?", typ: "textarea" },
          { key: "hatNichtFunktioniert", label: "Was hat nicht funktioniert?", typ: "textarea" },
        ],
      },
      {
        titel: "Ziele & Erwartungen",
        felder: [
          { key: "ziel1", label: "Ziel 1", typ: "text" },
          { key: "ziel2", label: "Ziel 2", typ: "text" },
          { key: "ziel3", label: "Ziel 3", typ: "text" },
          { key: "motivation", label: "Wie motiviert bist du, an deinen Routinen zu arbeiten?", typ: "skala", max: 10 },
          { key: "erfolg4Wochen", label: "Was wäre ein Erfolg für dich nach 4 Wochen?", typ: "textarea" },
        ],
      },
      {
        titel: "Coaching-Rahmen",
        felder: [
          { key: "abstand", label: "Bevorzugter Sitzungsabstand", typ: "radio", optionen: ["wöchentlich", "14-tägig", "flexibel"] },
          { key: "format", label: "Bevorzugtes Format", typ: "radio", optionen: ["Video", "Telefon", "Präsenz"] },
          { key: "zeitfenster", label: "Verfügbare Zeitfenster", typ: "text" },
          { key: "einwilligung", label: "Einwilligung zur Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO) erteilt", typ: "checkbox" },
          { key: "unterschrift", label: "Unterschrift", typ: "text" },
        ],
      },
    ],
  },

  {
    id: "routinenprofil",
    kurzTitel: "3. ADHS-Routinen-Profil",
    titel: "Formular 3: ADHS-Routinen-Profil",
    sections: [
      { titel: "Kopf", felder: [{ key: "coachee", label: "Coachee", typ: "text" }, { key: "datum", label: "Datum", typ: "date" }] },
      {
        titel: "Protokoll 1: Schlaf",
        felder: [
          { key: "schlaf", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Einschlafzeit", "Aufstehzeit", "Schlafroutine abends", "Schlafqualität", "Bildschirmnutzung"] },
          { key: "schlafNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 2: Hydration",
        felder: [
          { key: "hydration", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Trinkmenge/Tag", "Trinkroutine", "Koffein-Konsum", "Koffein-Timing"] },
          { key: "hydrationNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 3: Tageslicht",
        felder: [
          { key: "tageslicht", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Morgens Licht", "Zeit im Freien", "Blaulicht-Filter", "Licht am Abend"] },
          { key: "tageslichtNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 4: Ernährung",
        felder: [
          { key: "ernaehrung", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Regelmäßige Mahlzeiten", "Protein-Aufnahme", "Blutzuckerstabilität", "Zucker-Verzicht"] },
          { key: "ernaehrungNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 5: Training",
        felder: [
          { key: "training", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Bewegung/Tag", "Trainingsfrequenz", "Konsistenz"] },
          { key: "trainingNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 6: Gewohnheiten",
        felder: [
          { key: "gewohnheiten", typ: "raster", spalten: ["Aspekt", "Status (1-5)", "Was läuft?", "Was fehlt?"], zeilen: ["Morgenroutine", "Abendroutine", "Task-Management", "Erinnerungssysteme"] },
          { key: "gewohnheitenNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 7: Supplemente",
        felder: [
          { key: "supplemente", typ: "raster", spalten: ["Supplement", "Einnahme?", "Timing", "Status (1-5)"], zeilen: ["Omega-3", "Magnesium", "Vitamin D", "Eisen", "Zink", "Sonstige"] },
          { key: "supplementeHinweis", typ: "static", text: "Wichtig: Der Coach verschreibt oder empfiehlt keine Supplemente. Alle Fragen an den behandelnden Arzt richten." },
          { key: "supplementeNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Protokoll 8: Medikamente / Hormone",
        felder: [
          { key: "medikamente", typ: "raster", spalten: ["Medikament", "Einnahme?", "Timing", "Nebenwirkungen?"], zeilen: 3 },
          { key: "medikamenteHinweis", typ: "static", text: "Wichtig: Der Coach verschreibt oder empfiehlt keine Medikamente. Alle medikamentösen Fragen an den Facharzt verweisen." },
          { key: "medikamenteNotizen", label: "Notizen", typ: "textarea" },
        ],
      },
      {
        titel: "Übergreifende Auswertung",
        felder: [
          { key: "staerkstesProtokoll", label: "Stärkstes Protokoll (funktioniert am besten)", typ: "text" },
          { key: "schwaechstesProtokoll", label: "Schwächstes Protokoll (größter Hebel für Verbesserung)", typ: "text" },
          { key: "prioritaet1", label: "Priorität 1 für die nächsten Wochen", typ: "text" },
          { key: "prioritaet2", label: "Priorität 2 für die nächsten Wochen", typ: "text" },
        ],
      },
    ],
  },

  {
    id: "sitzungsprotokoll",
    kurzTitel: "4. Sitzungsprotokoll (GROW)",
    titel: "Formular 4: Sitzungsprotokoll (GROW-Struktur)",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "coachee", label: "Coachee", typ: "text" },
          { key: "sitzungNr", label: "Sitzung #", typ: "text" },
          { key: "datum", label: "Datum", typ: "date" },
          { key: "dauer", label: "Dauer (Min.)", typ: "text" },
          { key: "format", label: "Format", typ: "radio", optionen: ["Video", "Telefon", "Präsenz"] },
        ],
      },
      {
        titel: "G — Goal (Sitzungsziel)",
        felder: [
          { key: "zielHeute", label: "Was will der/die Coachee heute erreichen?", typ: "textarea" },
          { key: "zielKonkret", label: "Konkret und messbar formuliert", typ: "textarea" },
        ],
      },
      {
        titel: "R — Reality (Aktueller Stand)",
        felder: [
          { key: "umgesetzt", label: "Was wurde seit der letzten Sitzung umgesetzt?", typ: "textarea" },
          { key: "hatFunktioniert", label: "Was hat funktioniert?", typ: "textarea" },
          { key: "hatNichtFunktioniert", label: "Was hat nicht funktioniert? Warum?", typ: "textarea" },
          { key: "zufriedenheit", label: "Zufriedenheit mit Fortschritt seit letzter Sitzung", typ: "skala", max: 10 },
        ],
      },
      {
        titel: "O — Options (Möglichkeiten)",
        felder: [
          { key: "option1", label: "Option 1", typ: "text" },
          { key: "option2", label: "Option 2", typ: "text" },
          { key: "option3", label: "Option 3", typ: "text" },
          { key: "gewaehlteOption", label: "Welche Option wurde gewählt? Warum?", typ: "textarea" },
        ],
      },
      {
        titel: "W — Will (Verpflichtung)",
        felder: [
          { key: "aufgabe1", label: "Aufgabe 1", typ: "textarea" },
          { key: "bisWann1", label: "Bis wann (Aufgabe 1)", typ: "text" },
          { key: "wennDann1", label: "Wenn-Dann (Aufgabe 1)", typ: "text" },
          { key: "aufgabe2", label: "Aufgabe 2", typ: "textarea" },
          { key: "bisWann2", label: "Bis wann (Aufgabe 2)", typ: "text" },
        ],
      },
      {
        titel: "AKA-App-Integration",
        felder: [
          { key: "protokolle", label: "Welche Protokolle in der App werden angepasst?", typ: "checkboxGroup", optionen: ["Schlaf", "Hydration", "Tageslicht", "Ernährung", "Training", "Gewohnheiten", "Supplemente", "Medikamente"] },
          { key: "akaEingesetzt", label: "Wird Aka (KI) eingesetzt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "akaWofuer", label: "Wenn ja, wofür?", typ: "text" },
        ],
      },
      {
        titel: "Coach-Notizen",
        felder: [
          { key: "beobachtungen", label: "Beobachtungen (Stimmung, Energie, Widerstände)", typ: "textarea" },
          { key: "redFlags", label: "Red Flags erkannt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "weiterverweisung", label: "Weiterverweisung erfolgt?", typ: "radio", optionen: ["Ja", "Nein"] },
        ],
      },
      {
        titel: "Nächste Sitzung",
        felder: [
          { key: "naechsteSitzungDatum", label: "Datum", typ: "date" },
          { key: "naechsteSitzungFokus", label: "Fokus", typ: "text" },
        ],
      },
    ],
  },

  {
    id: "wochenplan",
    kurzTitel: "5. Wochenplan / Experiment-Plan",
    titel: "Formular 5: Wochenplan / Experiment-Plan",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "coachee", label: "Coachee", typ: "text" },
          { key: "vonDatum", label: "Woche vom", typ: "date" },
          { key: "bisDatum", label: "bis", typ: "date" },
        ],
      },
      {
        titel: "Fokus diese Woche",
        felder: [{ key: "hauptziel", label: "Hauptziel dieser Woche (1 Satz)", typ: "text" }],
      },
      {
        titel: "Experiment",
        felder: [
          { key: "experiment", label: "Was wird diese Woche ausprobiert?", typ: "textarea" },
          { key: "hypothese", label: "Hypothese: „Wenn ich ... mache, dann erwarte ich ...“", typ: "textarea" },
        ],
      },
      {
        titel: "Tägliche Routinen (Mo–So ankreuzen)",
        felder: [
          { key: "routinenRaster", typ: "raster", spalten: ["Routine", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], zeilen: ["Morgenroutine", "Abendroutine", "Trinkziel", "Bewegung", "Supplemente", "Medikamente", "Spezifische Aufgabe"] },
          { key: "spezifischeAufgabe", label: "Spezifische Aufgabe, und zwar:", typ: "text" },
        ],
      },
      {
        titel: "Wenn-Dann-Plan",
        felder: [
          { key: "wennDann1", label: "Wenn-Dann 1", typ: "text" },
          { key: "wennDann2", label: "Wenn-Dann 2", typ: "text" },
        ],
      },
      {
        titel: "Aka-App-Integration",
        felder: [
          { key: "erinnerungFuer", label: "Aka-Erinnerung aktiviert für", typ: "text" },
          { key: "checkinZeit", label: "Daily-Check-in-Zeit", typ: "text" },
        ],
      },
      {
        titel: "Wochen-Reflexion (am Sonntag)",
        felder: [
          { key: "hatFunktioniert", label: "Was hat funktioniert?", typ: "textarea" },
          { key: "hatNichtFunktioniert", label: "Was hat nicht funktioniert?", typ: "textarea" },
          { key: "wieLief", label: "Wie lief die Woche?", typ: "skala", max: 10 },
          { key: "aendern", label: "Was ändere ich nächste Woche?", typ: "textarea" },
        ],
      },
    ],
  },

  {
    id: "redflag",
    kurzTitel: "6. Red-Flag-Checkliste",
    titel: "Formular 6: Red-Flag-Checkliste",
    sections: [
      {
        titel: "Psychische Krisen",
        felder: [
          {
            key: "psychischeKrisen",
            typ: "checkboxGroup",
            optionen: [
              "Suizidale Gedanken oder Äußerungen → SOFORT: Notruf 112 oder Telefonseelsorge 0800/1110111",
              "Selbstverletzendes Verhalten → Weiterverweisung Psychotherapeut/Facharzt",
              "Hinweise auf psychotische Symptome → SOFORT: Facharzt/Notaufnahme",
              "Schwere depressive Symptome → Weiterverweisung Psychotherapeut/Facharzt",
              "Akute Panikattacken → Weiterverweisung Psychotherapeut",
            ],
          },
        ],
      },
      {
        titel: "Sucht und Abhängigkeit",
        felder: [
          {
            key: "suchtAbhaengigkeit",
            typ: "checkboxGroup",
            optionen: [
              "Alkohol- oder Drogenmissbrauch → Weiterverweisung Suchtberatung",
              "Hinweise auf Medikamentenmissbrauch → Weiterverweisung an verschreibenden Arzt",
            ],
          },
        ],
      },
      {
        titel: "Medizinische Symptome",
        felder: [
          {
            key: "medizinischeSymptome",
            typ: "checkboxGroup",
            optionen: [
              "Unerklärliche körperliche Beschwerden → Weiterverweisung Hausarzt",
              "Verdacht auf Medikamentenwechselwirkungen → Weiterverweisung Arzt/Apotheke",
              "Schwere Schlafstörungen (Tage ohne Schlaf) → Weiterverweisung Arzt",
            ],
          },
        ],
      },
      {
        titel: "Coaching-Grenzen",
        felder: [
          {
            key: "coachingGrenzen",
            typ: "checkboxGroup",
            optionen: [
              "Coachee möchte Diagnose → „Ich stelle keine Diagnosen.“",
              "Coachee möchte Medikamentenempfehlung → „Ich verschreibe nichts.“",
              "Coachee möchte Therapie → „Ich verweise weiter.“",
              "Coachee minderjährig → Einwilligung der Eltern erforderlich",
              "Akute Lebenskrise → Fachstelle prüfen",
            ],
          },
        ],
      },
      {
        titel: "Vorgehen bei Red Flags",
        felder: [
          {
            key: "vorgehen",
            typ: "static",
            text:
              "1. NICHT behandeln. Du bist kein Arzt/Therapeut.\n2. Offen ansprechen: „Ich sehe, dass dich das belastet. Das übersteigt meine Kompetenz.“\n3. Konkrete Weiterverweisung: Name, Adresse, Telefonnummer.\n4. Notizen im Sitzungsprotokoll (Datum, Beobachtung, Weiterverweisung).\n5. Follow-up: 1–2 Tage später nachfragen.",
          },
          { key: "notizen", label: "Notizen zu diesem Fall", typ: "textarea" },
        ],
      },
      {
        titel: "Kontakte",
        felder: [
          {
            key: "kontakte",
            typ: "static",
            text: "Telefonseelsorge: 0800/1110111 oder 0800/1110222\nNotruf: 112\nADHS Anlaufstellen: adhs-deutschland.de/wichtige-anlaufstellen",
          },
        ],
      },
    ],
  },

  {
    id: "selbstreflexion",
    kurzTitel: "7. Coach-Selbstreflexion",
    titel: "Formular 7: Coach-Selbstreflexion",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "coach", label: "Coach", typ: "text" },
          { key: "sitzungNr", label: "Sitzung #", typ: "text" },
          { key: "datum", label: "Datum", typ: "date" },
        ],
      },
      {
        titel: "Selbstwahrnehmung",
        felder: [
          { key: "gefuehlt", label: "Wie habe ich mich gefühlt?", typ: "radio", optionen: ["Wohl", "Angespannt", "Überfordert", "Gelangweilt", "Sonstiges"] },
          { key: "gefuehltSonstiges", label: "Sonstiges, und zwar:", typ: "text" },
          { key: "wasWarSchwer", label: "Was war schwer?", typ: "textarea" },
          { key: "wasWarLeicht", label: "Was war leicht?", typ: "textarea" },
        ],
      },
      {
        titel: "Haltungs-Check",
        felder: [
          { key: "ressourcenorientiert", label: "Ressourcenorientiert (Stärken-Fokus)", typ: "skala", max: 5 },
          { key: "loesungsorientiert", label: "Lösungsorientiert (Zukunft-Fokus)", typ: "skala", max: 5 },
          { key: "nichtWertend", label: "Nicht-wertend", typ: "skala", max: 5 },
          { key: "prozessbegleitung", label: "Prozessbegleitung (nicht Ergebnis-Vorgabe)", typ: "skala", max: 5 },
        ],
      },
      {
        titel: "Methoden-Reflexion",
        felder: [
          { key: "fragetechniken", label: "Eingesetzte Fragetechniken", typ: "checkboxGroup", optionen: ["Offene Fragen", "Skalierungsfragen", "Wunderfrage", "Ausnahmefragen", "Zirkuläre Fragen", "Paraphrasieren"] },
          { key: "wirksamsteFrage", label: "Wirksamste Frage", typ: "text" },
          { key: "wenigHilfreicheFrage", label: "Wenig hilfreiche Frage", typ: "text" },
          { key: "zuVielGesprochen", label: "Wo habe ich zu viel gesprochen?", typ: "textarea" },
          { key: "geratenBewertet", label: "Wo habe ich geraten oder bewertet?", typ: "textarea" },
        ],
      },
      {
        titel: "Grenzen",
        felder: [
          { key: "kompetenzgrenze", label: "Kompetenzgrenze gespürt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "kompetenzgrenzeText", label: "Wenn ja, welche?", typ: "text" },
          { key: "redFlagErkannt", label: "Red Flag erkannt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "weiterverweisung", label: "Weiterverweisung erfolgt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "heilkundlichAgiert", label: "Habe ich heilkundlich/therapeutisch agiert?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "heilkundlichText", label: "Wenn ja, wie?", typ: "text" },
        ],
      },
      {
        titel: "Lernfelder",
        felder: [
          { key: "gelernt", label: "Was habe ich gelernt?", typ: "textarea" },
          { key: "naechstesMalAnders", label: "Was mache ich beim nächsten Mal anders?", typ: "textarea" },
        ],
      },
      {
        titel: "5 Kompetenzklassen (DBVC)",
        felder: [{ key: "kompetenzklassen", typ: "raster", spalten: ["Kompetenzklasse", "Diese Sitzung (1-5)", "Notiz"], zeilen: ["Persönlichkeitskompetenz", "Sozial-kommunikativ", "Sachkompetenz", "Methodenkompetenz", "Feldkompetenz"] }],
      },
      {
        titel: "Nächste Schritte",
        felder: [
          { key: "brauche", label: "Was brauche ich?", typ: "checkboxGroup", optionen: ["Supervision", "Weiterbildung", "Übung", "Austausch mit Coaches"] },
          { key: "konkret", label: "Konkret", typ: "textarea" },
        ],
      },
    ],
  },

  {
    id: "beobachterbogen",
    kurzTitel: "8. Beobachterbogen",
    titel: "Formular 8: Beobachterbogen (für Rollenspiel/Pilot)",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "beobachter", label: "Beobachter", typ: "text" },
          { key: "datum", label: "Datum", typ: "date" },
          { key: "sitzung", label: "Sitzung", typ: "text" },
        ],
      },
      {
        titel: "Gesamteindruck",
        felder: [
          { key: "struktur", label: "Struktur (War der Ablauf klar?)", typ: "skala", max: 5 },
          { key: "zuhoeren", label: "Zuhören (Hat der Coach zugehört?)", typ: "skala", max: 5 },
          { key: "fragen", label: "Fragen (Waren die Fragen hilfreich?)", typ: "skala", max: 5 },
          { key: "waerme", label: "Wärme (Fühlte ich mich sicher?)", typ: "skala", max: 5 },
          { key: "klarheit", label: "Klarheit (Wusste ich, was passiert?)", typ: "skala", max: 5 },
          { key: "abschluss", label: "Abschluss (War der Wochenplan klar?)", typ: "skala", max: 5 },
        ],
      },
      {
        titel: "Was war gut? (Top 3)",
        felder: [
          { key: "gut1", label: "1.", typ: "text" },
          { key: "gut2", label: "2.", typ: "text" },
          { key: "gut3", label: "3.", typ: "text" },
        ],
      },
      {
        titel: "Was fehlte? (Top 3)",
        felder: [
          { key: "fehlte1", label: "1.", typ: "text" },
          { key: "fehlte2", label: "2.", typ: "text" },
          { key: "fehlte3", label: "3.", typ: "text" },
        ],
      },
      {
        titel: "Hat der Coach...",
        felder: [
          { key: "ratschlaege", label: "...Ratschläge gegeben?", typ: "radio", optionen: ["Ja", "Nein", "Unsicher"] },
          { key: "eigeneErfahrungen", label: "...eigene Erfahrungen geteilt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "bewertet", label: "...bewertet?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "guteFragen", label: "...gute Fragen gestellt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "zeitEingeteilt", label: "...die Zeit gut eingeteilt?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "rolleKlar", label: "...die Rolle klar gemacht?", typ: "radio", optionen: ["Ja", "Nein"] },
        ],
      },
      {
        titel: "Freitext",
        felder: [
          { key: "freitext", label: "Wie hast du dich im Gespräch gefühlt?", typ: "textarea" },
          { key: "wiederkommen", label: "Würdest du wieder kommen?", typ: "radio", optionen: ["Ja", "Nein", "Vielleicht"] },
        ],
      },
    ],
  },

  {
    id: "einwilligung",
    kurzTitel: "9. Einwilligung Pilotgespräch",
    titel: "Formular 9: Einwilligungstext für Pilotgespräche",
    sections: [
      {
        titel: "Einwilligungserklärung — Kostenloses Pilot-Coaching",
        felder: [
          { key: "name", label: "Ich, (Name)", typ: "text" },
          {
            key: "punkte",
            label: "Ich verstehe und bestätige:",
            typ: "checkboxGroup",
            optionen: [
              "Das Coaching ist KEINE medizinische, psychotherapeutische oder heilkundliche Behandlung.",
              "Der Coach ist KEIN Arzt oder Psychotherapeut und stellt keine Diagnosen und verschreibt keine Medikamente.",
              "Bei gesundheitlichen oder psychischen Beschwerden werde ich an eine Fachperson verwiesen.",
              "Alle Angaben werden vertraulich und DSGVO-konform behandelt.",
              "Meine Daten werden nur zum Zwecke des Pilot-Coachings verarbeitet und nach Abschluss gelöscht.",
              "Ich kann die Einwilligung jederzeit widerrufen.",
              "Das Gespräch wird nicht aufgenommen, es sei denn, ich gebe ausdrücklich meine Zustimmung.",
              "Ich gebe mein Feedback nach dem Gespräch ehrlich und konstruktiv.",
            ],
          },
        ],
      },
      {
        titel: "Unterschriften",
        felder: [
          { key: "datum", label: "Datum", typ: "date" },
          { key: "unterschriftCoachee", label: "Unterschrift Coachee", typ: "text" },
          { key: "unterschriftCoach", label: "Unterschrift Coach", typ: "text" },
        ],
      },
    ],
  },

  {
    id: "feedbackbogen",
    kurzTitel: "10. Feedbackbogen Pilotperson",
    titel: "Formular 10: Feedbackbogen für Pilotpersonen",
    sections: [
      {
        titel: "Kopf",
        felder: [
          { key: "datum", label: "Datum", typ: "date" },
          { key: "pilotNr", label: "Pilot #", typ: "text" },
        ],
      },
      {
        titel: "Bewertung",
        felder: [
          { key: "gesamteindruck", label: "Gesamteindruck", typ: "skala", max: 5 },
          { key: "verstanden", label: "Ich fühlte mich verstanden", typ: "skala", max: 5 },
          { key: "fragenHilfreich", label: "Die Fragen waren hilfreich", typ: "skala", max: 5 },
          { key: "wochenplanKlar", label: "Der Wochenplan ist klar", typ: "skala", max: 5 },
          { key: "rolleKlar", label: "Die Rolle war klar (kein Arzt)", typ: "skala", max: 5 },
          { key: "weiterempfehlen", label: "Ich würde es weiterempfehlen", typ: "skala", max: 5 },
        ],
      },
      {
        titel: "Freitext",
        felder: [
          { key: "amHilfreichsten", label: "Was war am hilfreichsten?", typ: "textarea" },
          { key: "fehlteOderSchwach", label: "Was fehlte oder war schwach?", typ: "textarea" },
        ],
      },
      {
        titel: "Hat der Coach...",
        felder: [
          { key: "zuVielGeredet", label: "...zu viel geredet?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "ratschlaegeGegeben", label: "...Ratschläge gegeben?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "zugehoert", label: "...zugehört?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "strukturKlar", label: "...die Struktur klar gemacht?", typ: "radio", optionen: ["Ja", "Nein"] },
          { key: "sicherGewirkt", label: "...sicher gewirkt?", typ: "radio", optionen: ["Ja", "Nein"] },
        ],
      },
      {
        titel: "Weiterempfehlung",
        felder: [
          { key: "wuerdeEmpfehlen", label: "Würdest du es weiterempfehlen?", typ: "radio", optionen: ["Ja, unbedingt", "Ja, mit Verbesserungen", "Unsicher", "Nein"] },
          { key: "ratAnCoach", label: "Was würdest du dem Coach raten?", typ: "textarea" },
        ],
      },
    ],
  },
];
