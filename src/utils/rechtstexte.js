// Datenschutzerklärung + Impressum (28.09., Vorbereitung App-Store-Antrag).
// EINE Quelle für die Ansicht in der App und die öffentlichen Seiten
// public/datenschutz.html + public/impressum.html (erzeugt von
// scripts/rechtstexte-html.mjs, läuft vor jedem Build).
// Wichtig: Entwurf nach bestem Wissen, keine Rechtsberatung – die Nutzerin
// lässt die Texte fachlich prüfen (siehe UEBERGABEPROTOKOLL, Go-Live A1).
// Bei jeder inhaltlichen Änderung DATENSCHUTZ_VERSION erhöhen.

export const DATENSCHUTZ_VERSION = "2026-09-28";

// Angaben der Verantwortlichen – von der Nutzerin einzutragen.
export const BETREIBER = {
  name: "[Vor- und Nachname bzw. Firma]",
  anschrift: "[Straße Hausnummer, PLZ Ort]",
  email: "[E-Mail-Adresse für Datenschutz-Anfragen]",
  telefon: "",
  zusatz: "", // z. B. Rechtsform, USt-IdNr., Berufsbezeichnung – falls vorhanden
  aufsicht: "[Zuständige Datenschutz-Aufsichtsbehörde des Bundeslandes]",
};

export const OEFFENTLICHE_URL = "https://akaapp.vercel.app";

export const DATENSCHUTZ = [
  {
    titel: "1. Wer ist verantwortlich?",
    absaetze: [
      `${BETREIBER.name}, ${BETREIBER.anschrift}. E-Mail: ${BETREIBER.email}${BETREIBER.telefon ? `, Telefon: ${BETREIBER.telefon}` : ""}.`,
      "Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte schreib einfach an diese E-Mail-Adresse.",
    ],
  },
  {
    titel: "2. Worum es in AKA geht",
    absaetze: [
      "AKA ist eine Lifestyle-App für den Alltag mit ADHS: Routinen, Planen, Erinnern, Tracken und Coaching. AKA ist keine Therapie, keine Diagnose und kein Medizinprodukt und ersetzt keine ärztliche Behandlung. Die App richtet sich an Erwachsene.",
    ],
  },
  {
    titel: "3. Welche Daten wir verarbeiten",
    liste: [
      "Konto: E-Mail-Adresse, Vorname, Passwort (nur verschlüsselt gespeichert), Profilbild (freiwillig).",
      "Steckbrief (freiwillig): Geschlecht, Geburtsdatum, Größe, Gewicht, Alltags-Aktivität.",
      "Gesundheits- und Alltagsdaten, die du einträgst: z. B. Medikation, Supplemente, Hormone, Schlaf, Wasser, Tageslicht, Bildschirmzeit, Ernährung, Training, Atemübungen, Gewicht, Laborwerte, Stimmung und Tagebuch, Routinen, Kalender-Einträge und Dienstplan.",
      "Fotos, die du bewusst hochlädst: z. B. von Präparaten, Nährwerttabellen, Laborwerten oder Mahlzeiten und Video-Nachweise fürs Training.",
      "Coaching und Community: Nachrichten mit deinem Coach, Team-Zugehörigkeit, Punkte und Ranglisten (nur, wenn du die Rangliste einschaltest).",
      "Technisch Notwendiges: Geräte-Kennung für Erinnerungen (Push), Zeitzone, Protokolle zur Fehlersuche.",
    ],
  },
  {
    titel: "4. Wofür und auf welcher Grundlage",
    liste: [
      "Die App bereitstellen, deine Einträge speichern und dich erinnern: Vertrag (Art. 6 Abs. 1 lit. b DSGVO).",
      "Gesundheitsdaten verarbeiten: deine ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO), die du beim ersten Start gibst. Du kannst sie jederzeit widerrufen, indem du dein Konto löschst.",
      "KI-Funktionen (freiwillig): deine gesonderte Einwilligung (Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO). Jederzeit unter Mehr → Datenschutz ein- und ausschaltbar.",
      "Sicherheit und Fehlersuche: berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).",
    ],
  },
  {
    titel: "5. Wer deine Daten sieht",
    liste: [
      "Dein Coach sieht deine Einträge, um dich zu begleiten. Die freie Notiz im Tagebuch sieht dein Coach nur, wenn du sie ausdrücklich freigibst.",
      "Dein Team sieht nur Punkte und Namen – und nur, wenn du die Rangliste einschaltest.",
      "Wir verkaufen keine Daten, zeigen keine Werbung und nutzen kein Tracking über andere Apps oder Websites hinweg.",
    ],
  },
  {
    titel: "6. Dienstleister, die für uns arbeiten",
    absaetze: ["Wir setzen Dienstleister ein, die Daten nur nach unserer Weisung verarbeiten (Auftragsverarbeitung, Art. 28 DSGVO):"],
    liste: [
      "Supabase (Datenbank, Anmeldung, Dateien, Server-Funktionen) – Server in der EU (Frankfurt am Main).",
      "Vercel (Auslieferung der Web-App) – kann dabei deine IP-Adresse verarbeiten, auch außerhalb der EU.",
      "Apple (Push-Mitteilungen auf dem iPhone) bzw. der Push-Dienst deines Browsers.",
      "Nur mit deiner KI-Einwilligung: Google (Gemini, Text-to-Speech) und Groq (USA) – sie erhalten nur die Texte oder Fotos, die für die jeweilige Funktion nötig sind (z. B. deine Frage an Aka, ein Foto einer Nährwerttabelle).",
      "Nur wenn du es verbindest: Spotify (Musik zu Routinen).",
      "Fehlerberichte (falls eingeschaltet): Sentry – bei einem Absturz technische Angaben zum Fehler, keine Einträge.",
      "Beim ersten Öffnen mancher Funktionen lädt die App Programmteile von jsDelivr (z. B. die Texterkennung für den Dienstplan). Dabei wird deine IP-Adresse übertragen, aber keine Inhalte.",
    ],
  },
  {
    titel: "7. Übermittlung außerhalb der EU",
    absaetze: [
      "Wenn Dienstleister Daten außerhalb der EU verarbeiten (z. B. in den USA), geschieht das auf Grundlage eines Angemessenheitsbeschlusses (EU-US Data Privacy Framework) oder von EU-Standardvertragsklauseln.",
    ],
  },
  {
    titel: "8. Was auf deinem Gerät bleibt",
    liste: [
      "Das Zählen von Wiederholungen mit der Kamera läuft komplett auf dem Gerät, die Bilder werden nicht gespeichert.",
      "Die Texterkennung beim Dienstplan-Foto läuft auf dem Gerät, das Foto wird nicht hochgeladen.",
    ],
  },
  {
    titel: "9. Wie lange wir Daten speichern",
    absaetze: [
      "Solange dein Konto besteht. Löschst du dein Konto (Mehr → Konto löschen), werden dein Zugang und alle deine Einträge und Dateien endgültig gelöscht. Video-Nachweise werden automatisch nach den in der App genannten Fristen gelöscht (in der Regel nach 7 Tagen).",
    ],
  },
  {
    titel: "10. Deine Rechte",
    absaetze: [
      "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, Einwilligungen jederzeit für die Zukunft zu widerrufen. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei " +
        BETREIBER.aufsicht +
        ".",
    ],
  },
  {
    titel: "11. Sicherheit",
    absaetze: [
      "Alle Verbindungen sind verschlüsselt (TLS). In der Datenbank sorgen Zugriffsregeln dafür, dass du nur deine eigenen Daten siehst; dein Coach nur die Daten der Personen, die er begleitet.",
    ],
  },
  {
    titel: "12. Änderungen",
    absaetze: [`Stand: ${DATENSCHUTZ_VERSION.split("-").reverse().join(".")}. Ändert sich etwas Wesentliches, informieren wir dich in der App.`],
  },
];

export const IMPRESSUM = [
  {
    titel: "Angaben nach § 5 DDG",
    absaetze: [BETREIBER.name, BETREIBER.anschrift, ...(BETREIBER.zusatz ? [BETREIBER.zusatz] : [])],
  },
  {
    titel: "Kontakt",
    absaetze: [`E-Mail: ${BETREIBER.email}`, ...(BETREIBER.telefon ? [`Telefon: ${BETREIBER.telefon}`] : [])],
  },
  {
    titel: "Hinweis",
    absaetze: [
      "AKA ist eine Lifestyle-App für den Alltag mit ADHS. Sie ersetzt keine ärztliche oder therapeutische Behandlung. Inhalte sind keine Heils- oder Wirkversprechen.",
    ],
  },
];

// true, solange noch Platzhalter [ … ] in den Angaben stehen.
export const rechtstexteUnvollstaendig = () => Object.values(BETREIBER).some((v) => /^\[.*\]$/.test(String(v)));
