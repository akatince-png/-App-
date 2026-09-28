// Coach-Handbuch (28.09., Nutzerin: „Coaching-Handbuch … auf alle
// Teilbereiche eingehen“). Reiner Inhalt, angezeigt in
// views/admin/CoachHandbuchView.jsx (auch druckbar). Stand: was die App am
// 28.09.2026 kann. Grundsätze: Lifestyle-Begleitung, keine Therapie, keine
// Heils- oder Wirkversprechen, alle Bausteine gleichwertig, jede Einstellung
// geht von Hand und mit Aka. Neue Funktionen → hier nachtragen.
//
// Kapitel: { id, emoji, titel, wozu, dauer?, schritte?, achten?, wennDann?, tabelle? }
// tabelle: { kopf: [..], zeilen: [[..], ..] }

export const HANDBUCH_STAND = "28.09.2026";

export const KAPITEL = [
  {
    id: "haltung",
    emoji: "🧭",
    titel: "Deine Rolle als Coach",
    wozu: "AKA ist die exekutive rechte Hand für den Alltag mit ADHS. App und Coach übernehmen Planen, Erinnern, Tracken, Im-Blick-Behalten und Auswerten. Du stellst ein, die Person lebt.",
    achten: [
      "Einstellen statt bewerten: Klappt etwas nicht, passt meist der Plan nicht, nicht die Person.",
      "Nichts ist rot, nichts schimpft. Lob konkret, Kritik nur als Vorschlag nach vorne.",
      "Alle Bausteine sind gleichwertig: Routinen, Bewegung, Wasser, Licht, Essen, Schlaf, Supplemente, Medikation. Keinen über die anderen stellen.",
      "Ein guter Morgen beginnt am Abend davor: Abendroutine immer zuerst.",
      "AKA ist Lifestyle-Begleitung, keine Therapie. Keine Heils- oder Wirkversprechen. Medizinisches (z. B. Medikamente) nur so, wie es ärztlich besprochen ist.",
      "Jede Einstellung geht von Hand und mit Aka. Kein Weg wird versteckt.",
    ],
  },
  {
    id: "aufnehmen",
    emoji: "➕",
    titel: "Neue Person aufnehmen",
    wozu: "Die Person bekommt einen Zugang und ist in wenigen Minuten startklar für das Erstgespräch.",
    dauer: "5 Minuten",
    schritte: [
      "Coach-Bereich → „+ Person hinzufügen“ → „✉️ Per E-Mail einladen (empfohlen)“. Die Person setzt ihr Passwort selbst.",
      "Nur falls nötig: „🔑 Zugang mit Passwort anlegen“ und das Passwort persönlich weitergeben.",
      "In der Karte der Person „🧭 Einrichten“ öffnen: Team wählen oder „Einzelperson“.",
      "Das Programm „Einstellungsphase“ ist für neue Personen automatisch freigeschaltet und wartet auf den Start.",
      "Der Person sagen: „Öffne den Link, geh das kurze Onboarding durch, danach telefonieren wir.“",
    ],
    achten: ["Die Einladung kommt per E-Mail. Landet sie nicht, im Spam-Ordner nachsehen lassen oder neu einladen."],
  },
  {
    id: "aufteilung",
    emoji: "🧩",
    titel: "Wer macht was beim Start",
    wozu: "Fakten füllt die Person allein aus. Entscheidungen trefft ihr gemeinsam. Was einer festen Vorgabe folgt, übernimmt die App.",
    tabelle: {
      kopf: ["Wer", "Wann", "Was", "Dauer"],
      zeilen: [
        ["Person allein", "vor dem Erstgespräch", "Vorstellung, Name, Ziel und Grund, Steckbrief (Größe, Gewicht, Geburtsdatum, Alltag, Supplemente, Sport), Startzeiten Abend und Morgen, danach die kurze Tour", "ca. 10 Min."],
        ["Du allein", "vor dem Gespräch", "Einrichtungs-Liste lesen: Steckbrief mit Grundumsatz und Tagesbedarf, Startzeiten. „Übliches übernehmen“ für Wasser, Licht, Schlaf", "5 Min."],
        ["Gemeinsam", "Erstgespräch am Telefon", "Zeiten festlegen, eigene Schritte in Abend- und Morgenroutine, Sportart und Tage für Woche 2, Medikation wie ärztlich verordnet, Supplemente, Team, Startdatum", "30–40 Min."],
        ["Die App", "ab dem Start", "Pflicht-Bausteine jeder Woche, Messwoche mit Stoppuhr, Erinnerungen, Sonntags-Check", "–"],
      ],
    },
  },
  {
    id: "erstgespraech",
    emoji: "📞",
    titel: "Das Erstgespräch",
    wozu: "Ihr stellt gemeinsam alles ein, was die ersten Wochen tragen soll. Du trägst live ein, die Person sieht auf ihrem Handy mit.",
    dauer: "30–40 Minuten",
    schritte: [
      "Vorher: Person bitten, AKA auf dem Handy offen zu haben.",
      "Coach-Bereich → Karte der Person → „Verwalten“. Du siehst jetzt ihre App. Jede Änderung, die du speicherst, erscheint nach 1–2 Sekunden auch auf ihrem Handy.",
      "Abendroutine: Startzeit und ihre eigenen Schritte (z. B. Tasche packen, Kleidung rauslegen). Dauer egal, Woche 1 misst.",
      "Morgenroutine: Aufwachzeit und eigene Schritte.",
      "Wasserziel, Tageslicht, Schlafenszeit bestätigen oder anpassen.",
      "Bewegung: Welche Sportart, an welchen Tagen, um wie viel Uhr (gilt ab Woche 2). Nicht ob, nur was und wann.",
      "Medikation: nur eintragen, was ärztlich verordnet ist.",
      "Supplemente aus dem Steckbrief übernehmen.",
      "Zum Schluss: Einrichtungs-Liste → Startdatum wählen → „▶ Start festlegen“. Start ist immer abends mit der ersten Abendroutine.",
      "Fragen: „Was ist dir wichtig? Was hat früher nicht geklappt?“ Kurz notieren (Notiz nur für dich).",
    ],
    achten: [
      "Die Person führt, du tippst. Frag nach, statt vorzugeben.",
      "Lieber kleiner anfangen: 3–5 eigene Schritte pro Routine reichen.",
      "Läuft bei der Person gerade eine Routine oder tippt sie in ein Feld, erscheint deine Änderung erst danach.",
    ],
  },
  {
    id: "wochen",
    emoji: "🗓️",
    titel: "Die 8 Wochen aus Coach-Sicht",
    wozu: "Woche 1–4 kommt jede Woche ein kleiner Baustein dazu, Woche 5–8 wird gefestigt. Nach Woche 4 und 8 sprecht ihr in Ruhe. Danach geht es in 4-Wochen-Etappen weiter.",
    tabelle: {
      kopf: ["Woche", "Neu für die Person", "Deine Aufgabe", "Dauer"],
      zeilen: [
        ["1 · Messen + Anker", "Glas Wasser, Tageslicht, 2 Min. Atmen, Tagebuch, feste Schlafenszeit. Routinen laufen mit Stoppuhr.", "Tag 1: kurze Nachricht zum Start. Tag 4: Messwerte übernehmen (siehe unten). Sonntag: Wochen-Check lesen, eine Nachricht.", "15 Min."],
        ["2 · Bewegung", "10 Min. Aktivierung morgens, ruhige Atmung abends, Sport 2–3× pro Woche", "Montag: Sportplan prüfen. Sonntag: Wochen-Check.", "7 Min."],
        ["3 · Essen + Planen", "Eiweißreiches Frühstück, Top 3 mit 15 Min. Start, regelmäßige Mahlzeiten, Eiweißziel", "Montag: Eiweißziel prüfen (Ernährung der Person). Sonntag: Wochen-Check.", "7 Min."],
        ["4 · Abend + Bilanz", "Bildschirm-Stopp, Plan für morgen", "Etappen-Gespräch vorbereiten und führen (siehe Kapitel „Gespräche“).", "30–45 Min."],
        ["5 · Festigen", "Nichts Neues muss", "Sonntag: Wochen-Check.", "5 Min."],
        ["6 · Dein Zusatz", "Ein freiwilliger Baustein, den ihr gemeinsam aussucht", "Zusatz mit der Person wählen und einrichten.", "10 Min."],
        ["7 · Nachmessen", "Routinen wieder mit Stoppuhr", "Vergleich mit Woche 1 vorbereiten.", "10 Min."],
        ["8 · Bilanz", "Vorher und nachher anschauen", "Abschlussgespräch, nächste Etappe festlegen, „Mein Alltag“ freischalten.", "30–45 Min."],
      ],
    },
    schritte: [
      "Messwerte übernehmen (ab Tag 4): Verwalten → „Mein AKA-Coaching“ → „Deine Messwoche“. Je Schritt steht ein Vorschlag (Durchschnitt + 15 % Puffer). „✓ übernehmen“ oder „Alle Vorschläge übernehmen“.",
    ],
  },
  {
    id: "bausteine",
    emoji: "🧱",
    titel: "Die Bausteine im Einzelnen",
    wozu: "Je Baustein: übliche Vorgabe, wo du es einstellst, woran du erkennst, dass es hakt.",
    tabelle: {
      kopf: ["Baustein", "Übliche Vorgabe", "Einstellen (in Verwalten)", "Woran es hakt"],
      zeilen: [
        ["🌙 Abendroutine", "Start ca. 21:30, 3–5 eigene Schritte + Anker", "Pläne → Abend", "Start oft viel später → Uhrzeit anpassen"],
        ["☀️ Morgenroutine", "Start ca. 06:30, eigene Schritte + Anker", "Pläne → Morgen", "Zeit-Hinweis „deutlich später“ → Aufwachzeit oder Schritte prüfen"],
        ["🏃 Bewegung", "2–3× pro Woche, feste Tage", "Pläne → Training", "Mehrere Termine offen → kleinere Version (z. B. 10 Min. Gehen)"],
        ["💧 Wasser", "2,5 l am Tag", "Pläne → Wasser", "Häufig unter der Hälfte → Flasche sichtbar hinstellen, Erinnerung"],
        ["☀️ Tageslicht", "30 Min. am Tag, möglichst morgens", "Pläne → Tageslicht", "Wenig Minuten → mit Weg zur Arbeit verbinden"],
        ["😴 Schlaf", "Feste Schlafenszeit", "Pläne → Schlaf", "Späte Zeiten → Abendroutine früher starten"],
        ["🍽️ Essen", "Regelmäßige Mahlzeiten, Eiweißziel ab Woche 3", "Pläne → Ernährung", "Mahlzeiten fehlen → feste Essenszeiten eintragen"],
        ["💊 Supplemente", "Nur mit guter Studienlage, wie besprochen", "Pläne → Supplemente", "Oft vergessen → an eine Routine hängen"],
        ["💊 Medikation", "Nur wie ärztlich verordnet", "Pläne → Medikamente", "Fragen zur Dosis → an Ärztin oder Arzt"],
        ["📱 Bildschirmzeit", "Stopp vor dem Schlafen (Woche 4)", "Pläne → Bildschirmzeit", "Werte aus dem Handy nachschauen lassen statt schätzen"],
        ["🌬️ Atmung", "2 Min. morgens, 5 Min. abends", "Routinen → Atemübungen", "–"],
        ["📓 Tagebuch", "30 Sek. abends", "Teil der Abendroutine", "Muster lesen, nicht bewerten"],
      ],
    },
  },
  {
    id: "alltag",
    emoji: "👀",
    titel: "Dein Tag als Coach",
    wozu: "Einmal am Tag kurz reinschauen reicht. Die Coach-Übersicht zeigt oben, wer dich gerade braucht.",
    dauer: "5–10 Minuten am Tag",
    schritte: [
      "Coach-Bereich → Übersicht öffnen.",
      "Oben stehen Personen, die seit 2 oder mehr Tagen ruhig sind, deren Onboarding offen ist, die dir geschrieben haben oder deren Routine an 3 von 5 Tagen mehr als 30 Min. später klappt.",
      "Bei „🧭 Einführung · W…“ siehst du, in welcher Woche jemand ist. „💬 Etappen-Gespräch fällig“ heißt: Termin vereinbaren.",
      "Aufklappen zeigt die Bausteine der letzten 7 Tage und was seit 2 Wochen wackelt.",
      "Einer Person pro Tag eine kurze, persönliche Nachricht schreiben reicht oft.",
    ],
  },
  {
    id: "sprechen",
    emoji: "💬",
    titel: "Mit Coachees sprechen",
    wozu: "Alles läuft über den Chat in der App. Kurz, warm, konkret.",
    schritte: [
      "Chat: Übersicht → Person → Nachricht. Die Person sieht sie unter „Dein Coach“.",
      "Gruppen-Termine: „Gemeinsam fokussieren“ (Runde planen, alle bekommen eine Einladung) und gemeinsame Atempausen.",
    ],
    tabelle: {
      kopf: ["Anlass", "Beispiel-Nachricht"],
      zeilen: [
        ["Start", "„Schön, dass du heute Abend startest. Nichts muss perfekt sein, die Uhr misst nur mit.“"],
        ["Lob", "„Deine Abendroutine lief 5 von 7 Tagen. Das ist die Grundlage für alles andere.“"],
        ["Nachfragen", "„Mir ist aufgefallen, dass die Morgenroutine oft später startet. Passt die Uhrzeit noch?“"],
        ["Wiedereinstieg", "„Ich denk an dich. Magst du heute nur die Abendroutine starten? Der Rest kann warten.“"],
        ["Sonntag", "„Danke für deinen Wochen-Check. Nächste Woche kommt Bewegung dazu. Welche Tage passen dir?“"],
      ],
    },
  },
  {
    id: "anpassen",
    emoji: "🔧",
    titel: "Anpassen, wenn es hakt",
    wozu: "Der Plan passt sich der Person an, nicht umgekehrt.",
    schritte: [
      "Uhrzeit oder Schritte ändern: Verwalten → Pläne → Morgen oder Abend.",
      "Baustein pausieren (z. B. Verletzung): Übersicht → Person aufklappen → Baustein, Datum und Begründung.",
      "Woche wiederholen: Programme der Person → „🔁 Woche wiederholen“. Das Ende der Etappe rückt um 7 Tage.",
      "Programm pausieren: Programme der Person → Pausieren. Beim Fortsetzen geht es in derselben Woche weiter.",
      "Baustein für diese Person weglassen: Programme → „⚙️ Persönlich einstellen“.",
      "Schichtarbeit: Verwalten → Schichtplan. Routinen-Zeiten gelten dann je Schicht.",
    ],
  },
  {
    id: "gespraeche",
    emoji: "🤝",
    titel: "Etappen-Gespräche (Woche 4 und 8)",
    wozu: "Gemeinsam anschauen, was bleibt und was angepasst wird, und die nächste Etappe festlegen.",
    dauer: "30–45 Minuten",
    schritte: [
      "Vorher (10 Min.): Übersicht → Person aufklappen: Bausteine der letzten Wochen, was wackelt, Wochen-Checks, Tagebuch-Muster. In Woche 8 zusätzlich den Vergleich Woche 1 und 7.",
      "Im Gespräch: Was lief gut? Was war schwer? Was nehmen wir mit?",
      "Danach: Gesprächsdatum und Notiz eintragen, „Wie geht's weiter?“ wählen: 🔁 Erhaltung (4 Wochen), ⏸ Pause oder 🏁 Coaching beenden.",
    ],
  },
  {
    id: "alltag",
    emoji: "🗓️",
    titel: "Nach den 8 Wochen: Mein Alltag",
    wozu: "Der Kalender bringt das ganze Leben an einen Ort: Tag, Woche als Stundenplan und Monat. Neben Routinen, Training und Essen stehen dort Arbeit, Haushalt, Hobbys, Me-Time, Termine, Freunde & Familie und eigene Bereiche.",
    dauer: "20–30 Minuten beim ersten Einrichten",
    schritte: [
      "Freischalten: Übersicht → Person → Programme → „Mein Alltag“ → „+ Freischalten“ → Datum → „▶ Starten“. Am besten im Abschlussgespräch nach Woche 8.",
      "Gemeinsam einrichten (am Telefon mit Verwalten): Pläne → „Mein Alltag (Kalender)“ → „+ Eintrag“. Zuerst die großen Blöcke (Arbeit, feste Termine), dann Haushalt, dann Hobbys und Me-Time.",
      "Wiederkehrendes über Wochentage, Einmaliges über „Einmalig“ mit Datum. Erinnerung ist an, sie meldet sich zur Startzeit.",
      "Fehlt ein Bereich (z. B. Kinder, Ehrenamt, Garten): „+ Eigener Bereich“ mit Namen und Symbol. Das geht für die Person selbst oder für dich über Verwalten.",
      "Die Person kann auch Aka sagen: „Samstags 10 Uhr Staubsaugen“ – der Eintrag landet im Kalender.",
      "Antippen eines Eintrags: abhaken, ändern oder löschen.",
    ],
    achten: [
      "Die Woche soll Luft haben. Lieber Lücken lassen als jede Stunde verplanen.",
      "Me-Time ist ein fester Termin, kein Rest.",
      "Die Routinen bleiben das Rückgrat. Neues wird um sie herum geplant, nicht auf sie drauf.",
    ],
  },
  {
    id: "teams",
    emoji: "👥",
    titel: "Teams und Community",
    wozu: "Gemeinsam fällt Dranbleiben leichter.",
    schritte: [
      "Coach-Bereich → „👥 Teams“: Team anlegen, Personen zuordnen.",
      "Team-Wochenziel, Rangliste und Quests (→ „🎯 Quests“) sorgen für Spielcharakter.",
      "Gruppen-Runden „Gemeinsam fokussieren“ planen: für ein Team oder für alle.",
    ],
  },
  {
    id: "aka",
    emoji: "🤖",
    titel: "Aka als Helfer",
    wozu: "Aka nimmt dir Tipparbeit ab. Alles geht weiterhin auch von Hand.",
    achten: [
      "Aka kann aus einem Satz Einträge machen (z. B. Mahlzeiten, Routinen-Schritte, Fokus-Runden).",
      "Aka lernt noch und tritt nicht erkennbar selbst mit Coachees in Kontakt. Gegenüber der Person bist du der Coach.",
      "Hintergrundwissen für Aka pflegst du unter „📚 Wissen“.",
    ],
  },
  {
    id: "grenzen",
    emoji: "📌",
    titel: "Was AKA ist und was nicht",
    wozu: "AKA ist Alltags- und Lifestyle-Begleitung für Menschen mit ADHS, keine Therapie und keine medizinische Behandlung.",
    achten: [
      "Medizinische Fragen (Medikamente, Dosis, Diagnosen) gehen an Ärztin oder Arzt.",
      "Keine Heils- oder Wirkversprechen, auch nicht im Gespräch.",
      "Daten der Person bleiben in der App. Tagebuch und Notizen nicht weitergeben.",
    ],
  },
  {
    id: "wenndann",
    emoji: "🗂️",
    titel: "Wenn-dann-Karten",
    wozu: "Die häufigsten Lagen auf einen Blick.",
    wennDann: [
      ["Die Person trägt 3 Tage nichts ein", "Eine warme Nachricht, nur die Abendroutine vorschlagen. Nach 2 weiteren Tagen anrufen. Keine Vorwürfe, nicht mehrere Nachrichten am selben Tag."],
      ["Eine Routine startet oft deutlich später", "Uhrzeit mit der Person anpassen oder Schritte kürzen. Fragen, was dazwischenkommt."],
      ["Ein Baustein klappt dauerhaft nicht", "Nachfragen, kleinere Version vereinbaren. Bei Verletzung oder Krankheit pausieren."],
      ["Eine Woche ist kaum etwas gelaufen", "„Woche wiederholen“ anbieten. Das ist normal und kein Rückschritt."],
      ["Die Person will aufhören", "Zuhören, Gründe verstehen, Pause statt Abbruch anbieten. Die Entscheidung liegt bei der Person."],
      ["Medikamente sollen geändert werden", "An die behandelnde Ärztin oder den Arzt verweisen. In der App nur eintragen, was ärztlich besprochen ist."],
      ["Die Person hat Schicht oder unregelmäßige Tage", "Schichtplan einrichten, Routinen-Zeiten je Schicht."],
    ],
  },
];
