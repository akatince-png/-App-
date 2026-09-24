# 📋 ÜBERGABEPROTOKOLL: AKA App

## 🧭 STAND & LESE-REIHENFOLGE FÜR DEN NÄCHSTEN AGENTEN (14.09.2026, Abend — bitte ZUERST lesen)

**An den nächsten Agenten:** Bitte dieses Dokument selbst vollständig
einlesen, bevor irgendetwas an dieser App verändert wird — insbesondere
Abschnitt 3 (Design-System) und den neuen Abschnitt 13 (Test-
Infrastruktur) weiter unten. Grund für diesen Absatz: In der vorigen
Sitzung wurde per Versehen kurz gegen das **falsche** Repo gearbeitet
(ein komplett separates zweites Projekt, "Kidnapp"/Arcanova, eine
Kinder-ADHS-App — siehe die Warnung in Abschnitt „Wichtiger Hinweis…"
weiter unten). Der Fehler wurde bemerkt, sofort verworfen und beide
Repos wurden danach geprüft: **kein Code/keine Verbindung ist aus
Versehen ins Kidnapp-Repo gelangt**, AKA selbst ist davon unberührt.
Genau um so etwas künftig zu vermeiden — und damit keine neue Sitzung
aus Unwissenheit eigene Farben/Designs/Muster erfindet, die es hier
längst gibt — jetzt diese Kurzübersicht:

- **Gesamtstatus:** Die komplette 13-Punkte-„App-Bauplan"-Liste der
  Nutzerin ist fertig umgesetzt, getestet und deployt (Details: Teile
  88–101 unten). Die kritische Sicherheitslücke (`profiles.is_admin`-
  Selbsterhöhung, Teil 81) ist bestätigt im echten Supabase-Projekt
  geschlossen (Teil 84). Kein bekannter offener Sicherheits- oder
  Blocker-Punkt zum aktuellen Zeitpunkt.
- **Design-System — bitte NICHT neu erfinden:** Alle Farben, Abstände
  und Bauteile sind in `src/ui/theme.js` (Farb-Tokens) und
  `src/ui/primitives.jsx` (`Shell`, `Card`, `PrimaryButton`, `Pill`,
  `Label`, `TextInput`, `TextArea`, `CheckRow`, `Stepper`, `StatusBadge`,
  …) bereits definiert. **Kein CSS-Framework** (kein Tailwind, kein
  Bootstrap) — alles Inline-`style={{}}` gegen diese Tokens. Vor jeder
  neuen Komponente/Farbe erst hier nachschauen, ob es das betreffende
  Bauteil/den Farbton nicht schon gibt — Details + vollständige
  Farbtabelle in Abschnitt 3.
- **Tests — bitte immer laufen lassen, nicht nur „sieht gut aus":** Vor
  jedem Commit `npm run build && npx oxlint <geänderte Dateien> && npm
  run typecheck && npm test` (Vitest, aktuell 124 Tests) und
  `npx playwright test` (E2E, aktuell 39 Tests) — alles muss grün sein.
  Vollständige Erklärung der Testphilosophie + wie man einen neuen Test
  schreibt: Abschnitt 13 weiter unten.
- **Neu seit dem letzten Durchgang:** Diktierfunktion ohne KI-Beteiligung
  für Formularfelder (Teil 102); Bug-Fix "Neues Protokoll" (Teil
  103–105: kein Voll-Onboarding mehr bei bestehendem Konto, "Ziel &
  Grund" bleibt Pflicht, Bestätigungs-Nachfrage vorm Archivieren);
  einheitliche PDF-Zentrierung (Teil 106); neue Kategorie
  "Bildschirmzeit" (Teil 107, manuelles Tracking — automatisches
  Auslesen vom Telefon ist aus einer Web-App heraus technisch nicht
  möglich — jetzt auch als eigener Schritt im Erst-Onboarding, Teil 108);
  neues Feature "Denkpause" (Teil 110, freiwillige Mini-Denksportaufgaben
  + Punkte-/Erfolge-Integration); Bug-Fix "KI ploppt bei Laborwerten
  automatisch auf" (Teil 111); Morgen-/Abendroutine im Onboarding:
  Weckzeit/Startzeit + Vorab-Erinnerung + größer lesbare, separate
  Schritte-Liste (Teil 112); Schlafplan ist kein eigener Onboarding-
  Schritt mehr, sondern jetzt Teil derselben Seite wie Morgen-/
  Abendroutine (Teil 113); Laborwerte und Morgen-/Abendroutine zeigen
  jetzt denselben nummerierten Stepper wie die 8 Kategorie-Schritte —
  eine durchgehende "1 von 10" bis "10 von 10"-Zählung statt eines
  optischen Bruchs (Teil 114); "Neues Protokoll" (Bestandskonto) fragt
  jetzt direkt nach dem Protokollnamen, ob Aka beim Einrichten helfen soll
  oder ob es alleine laufen soll — die Wahl unterdrückt das bisher
  unkontrollierte automatische KI-Popup auf den folgenden Seiten
  wirklich (Teil 115); Home-Tagesfortschritt-Balkendiagramm hat jetzt eine
  Tag/Woche/Monat/Gesamt-Auswahl (Gesamt nur bei Protokollen älter als
  einen Monat) — funktioniert auch im Coach-Verwalten-Modus automatisch
  mit (Teil 116); Bug-Fix: "Bildschirmzeit" und "Atemübungen" konnten nie
  als Teilprotokoll gespeichert werden, DB-Check fehlte beide Kategorien
  (Teil 117, Migration 0088 — ✅ deployt, siehe unten).
- **✅ Migration `0086_bildschirmzeit.sql`:** von der Nutzerin bestätigt
  im echten Supabase-Projekt ausgeführt (15.09., Abend) — kein offener
  Deploy-Punkt mehr, Bildschirmzeit ist live nutzbar.
- **✅ Migrationen 0087–0090 + Edge Function `send-due-reminders`:** von
  der Nutzerin bestätigt ausgeführt/deployt (16.09., Abend) — kein
  offener Deploy-Punkt mehr aus den Teilen 117–120. Im Einzelnen:
  `0087_denkpause.sql` (Denkpause-Tabelle, musste wegen "already exists"
  einmal nachträglich idempotent gemacht und erneut ausgeführt werden,
  Teil 120), `0088_teilprotokolle_bildschirmzeit_atemuebungen.sql`
  (Bildschirmzeit/Atemübungen konnten nie als Teilprotokoll gespeichert
  werden, Teil 117), `0089_aenderungsprotokoll_fehlende_kategorien.sql`
  (Tagesverlauf verschluckte mehrere Kategorien lautlos, Teil 118),
  `0090_hormones_kategorie_adhs_cannabis.sql` ("ADHS-Medikation"/
  "Cannabis" scheiterten beim Speichern, Teil 118), sowie das manuelle
  Redeploy der Edge Function `send-due-reminders` (Bildschirmzeit-
  Erinnerungen wurden nie verschickt, Teil 119). Alle fünf Bugs sind
  damit live behoben.
- **✅ Nachkontrolle 15.09. (Teil 109):** Alle Änderungen seit dem letzten
  Checkpoint (Teil 102–108, Commits `b3aae48`..`145dbf5`) wurden noch
  einmal manuell auf Bugs durchgesehen (Zeilen-für-Zeilen-Diff-Lektüre +
  Handnachvollzug der State-Machines) UND per Build/Lint/Typecheck/Tests
  gegengeprüft — keine neuen Fehler gefunden, siehe Details unten.
- **🔜 Geplant, sobald die native App verfügbar ist (nicht vergessen!):**
  die Nutzerin plant, AKA nächsten Monat als echte native App über den
  Apple App Store bereitzustellen — sobald das steht, hier weitermachen:
  1. **Wecker-Ausschalten mit Denkpause-Rätsel:** eine Denkpause (siehe
     Teil 110, `DenkpauseNudge.jsx`/`src/data/denkpausen*.js`) beim
     morgendlichen Wecker-Ausschalten anbieten, per iOS-Shortcut/native
     Alarm-Integration — aus der Web-App heraus technisch nicht möglich
     (siehe Denkpausen-Mockup, Beispiel 1). "Normal ausschalten" muss
     als Option erhalten bleiben.
  2. **Allgemein mehr Kurzbefehle/Verlinkungen mit dem Telefon:** die
     Nutzerin möchte, sobald die App "richtig" installiert ist (nicht
     mehr nur Web/PWA), stärker mit iOS-Shortcuts/Widgets/Deep-Links
     arbeiten — noch nicht weiter konkretisiert, einfach im Hinterkopf
     behalten und bei Gelegenheit proaktiv ansprechen, was sich davon
     sinnvoll umsetzen lässt.
- **Zwei ehrliche, noch offene Restpunkte** (keine Fehler, aber vor
  „100 % fertig" der Nutzerin selbst zu bestätigen):
  1. Die Datentopf-Aufteilung (Teil 98) wurde nur strukturell + gegen
     gemockte Testdaten verifiziert, nicht gegen eine echte
     Supabase-Login-Session — einmal bewusst durch Kernbereiche klicken
     (Supplement abhaken, Mahlzeit eintragen, Team-Nachricht senden),
     bevor dieser Punkt als 100 % bestätigt gilt.
  2. Spotify-Auto-Play braucht ein "aktives Gerät" zur Wake-up-Zeit
     (externe Spotify-Einschränkung, kein Code-Bug, Abschnitt 8) und die
     Erinnerungs-Edge-Function `send-due-reminders` wird NICHT
     automatisch deployt — beides liegt außerhalb dessen, was ein Agent
     aus der Sandbox heraus verifizieren kann.
- **Keine offenen Entscheidungen mehr aus dem 16.09.-Themenblock:** die
  visuelle Uneinheitlichkeit zwischen "normalen" Onboarding-Seiten und den
  nummerierten Kategorie-Schritten ist seit Teil 114 geklärt und umgesetzt
  (überall Stepper-Stil), die fehlende "allein/mit KI"-Nachfrage bei
  "Neues Protokoll" ist seit Teil 115 umgesetzt (neuer Zwischenschritt
  `OnboardingKiWahlView.jsx`, direkt nach dem Protokollnamen).
- **Empfohlene Lesereihenfolge:** erst Abschnitte 1–13 (Grundlagen,
  einmal geschrieben, werden bei größeren Umbauten aktuell gehalten),
  dann bei Bedarf die Chronik ab „Teil 102" weiter unten (chronologisches
  Detail-Protokoll jeder einzelnen Sitzung, ältere Teile weiter unten).

---

## ✅ Update 23.09.2026 (Teil 121) — Direkter Supabase-Zugriff, UX-Review als Test-User, parallele Zusatzprotokolle

**Wichtigste Änderung für jede künftige Sitzung: Es gibt jetzt direkten
Supabase-Zugriff.** Die Nutzerin hat den Supabase-Connector auf claude.ai
verbunden und den Netzwerkzugang der Cloud-Umgebung auf „Full" gestellt.
Damit kann eine Sitzung (sofern der Connector in ihr aktiv ist) selbst
SQL ausführen, Migrationen einspielen (`apply_migration`), Tabellen/
Policies prüfen und die Security-Advisors abfragen — und die App lokal mit
`npm run dev` gegen das echte Projekt starten und im Browser durchklicken
(Chromium braucht dafür `--ignore-certificate-errors-spki-list=<SPKI des
Proxy-CA>`, siehe `/root/.ccr/README.md`). Der alte Hinweis „keine
Supabase-Verbindung, Nutzerin muss alles selbst deployen" gilt nur noch,
wenn der Connector in einer Sitzung fehlt. Produktive DB-Änderungen und
Pushes nach `main` trotzdem vorher mit der Nutzerin abstimmen.

**Achtung Verwechslung (passiert in dieser Sitzung):** Der automatisch
angelegte Arbeitszweig einer neuen Sitzung kann auf einem uralten Commit
basieren (hier 486 Commits hinter `main`). Vor jeder Arbeit `git fetch
origin main` und prüfen, ob der Zweig auf dem aktuellen `main` steht —
`main` ist IMMER die maßgebliche, live laufende Version.

**Datenbank-Abgleich (alle Migrationen gegen die echte DB):**
- `0063_trainingsplaene_ordner_und_ziel.sql` war entgegen der Doku NIE
  eingespielt (`training_programme` fehlte → 404 bei jedem App-Start) —
  jetzt eingespielt.
- `0091_admin_zugriff_fehlende_tabellen.sql` (eingespielt): 17 Tabellen
  hatten keine „admin voller Zugriff"-Policy → im „Verwalten als"-Modus
  konnten Routinen, Bildschirmzeit, Workflows, Atemübungen, Tagesplan-
  Ausnahmen, Trainingsordner u. a. für Coachees nicht gespeichert werden.
  Von der Nutzerin ausdrücklich für alle 17 freigegeben (inkl. Akutmodus-
  Log, Denkpause, Fragebögen, Lexikon).
- `0092_rangliste_team_filter_und_anon_sperre.sql` (eingespielt):
  `0085` hatte den Team-Filter von `quest_rangliste()` überschrieben —
  jede Person, sogar ohne Login, sah Vornamen + Quest-Zahlen aller
  Coachees. Team-Filter + Ausblenden kombiniert, `anon` darf
  `quest_rangliste`/`admin_liste_probanden`/`gleiches_team` nicht mehr
  aufrufen.
- `0093_zusatzprotokolle.sql` (eingespielt): siehe unten.
- Offen (nur Warnungen der Supabase-Advisors, nicht behoben):
  „Leaked Password Protection" im Auth-Dashboard aktivieren;
  `set_updated_at` ohne festen `search_path`.

**App-Änderungen (alle live auf `main`):**
- Vertrauen: Datenschutz-Texte auf „Mehr" korrigiert (kein „Ende-zu-Ende"/
  „DSGVO konform" mehr, sondern verschlüsselte Übertragung/Speicherung +
  Server in Frankfurt); Dosierungen ohne Einheit („250") lassen sich nicht
  mehr speichern (`utils/mengeEinheit.js`, Einheiten-Chips in
  `DosierungFields.jsx`); Wochentags-Leiste im Tagesplan war um einen Tag
  verschoben; jede neue Ansicht startet oben (Scroll-Reset in
  `AuthenticatedApp.jsx`).
- Ein-Tipp-Abhaken: „Bestätigen" im Tagesplan hakt sofort ab, danach nur
  optionale Ein-Tipp-Rückmeldung (`ui/SchnellFeedback.jsx`, Details
  weiterhin erreichbar, keine vorausgewählten Werte mehr). Bug: dieser Weg
  löste nie das Belohnungsfenster aus (jetzt in `skip*Feedback`).
- Belohnungs-Moment: Konfetti + Vibration im `Belohnungsfenster.jsx`,
  große Feier „Tagesplan geschafft!" (`ui/useTagGeschafftFeier.js`).
- Home: „Jetzt dran"-Karte (oberster Punkt in Bereichsfarbe mit
  „✓ Erledigt") und runde Haken für alle direkt abhakbaren Punkte unter
  „Als Nächstes", auch im Notfallmodus.
- **Parallele Zusatzprotokolle** (Nutzerinnen-Wunsch): `hauptprotokolle.art`
  = `haupt` (wie bisher, eines aktiv) | `zusatz` (beliebig viele parallel).
  „Neues Protokoll" fragt „parallel starten" vs. „Hauptprotokoll ersetzen".
  Während ein Zusatzprotokoll das Eintrags-Ziel ist (violettes Band oben,
  `CoreDataContext.eintragsZielId`), landen neue Supplemente/Medikamente/
  Mahlzeiten/Gewohnheiten dort. Abschließen: „beendet" (Einträge
  verschwinden aus dem Tagesplan, Logs bleiben) oder „übernommen" (Einträge
  wandern ins Hauptprotokoll). Übersicht in „Alle Pläne" (nur Admin-/
  Verwalten-als-Modus), 🧪-Etikett im Tagesplan/auf Home.

**Nachtrag (gleicher Tag, Nutzerinnen-Feedback "noch kein Spiellevel"):**
- Home oben: neue `ui/SpielstandKarte.jsx` (Tagesring, 🔥 globale Serie, ⚡
  Punkte aus `useErrungenschaften`, Level + Balken aus `utils/level.js`,
  Stufen = PUNKTE_SCHWELLEN), antippbar → Erfolge. "Als Nächstes"/"Jetzt
  dran" direkt darunter, Hydration/Akut/Notfallmodus/Diagramm danach.
- Aka auf jeder Seite: `ui/GlobalerAka.jsx` (universeller Coach) wird in
  `AuthenticatedApp.jsx` auf allen Views gerendert, die keinen eigenen
  KiChat haben (`VIEWS_MIT_EIGENEM_AKA`).
- "Übungsbilder verwalten" (Admin) entfernt — Bilder sollen später in
  einer eigenen Sitzung automatisiert entstehen. Tabelle `uebungs_bilder`
  + Bucket + Anzeige im Live-Workout bleiben unverändert.
- Admin-Dashboard: Verbindungsabbruch ("Load failed") wird einmal still
  nachgeladen, sonst verständliche Meldung + "Erneut laden"
  (`utils/netzwerkFehler.js`).
- Onboarding: "Nein, ich mach's selbst" unterdrückt Akas Auto-Popup für
  die Sitzung (sessionStorage `kiAutoStartUnterdrueckt`), doppelter
  Zurück-Knopf entfernt, Begrüßung im Verwalten-Modus mit Coachee-Namen.

**Test-User:** `ux-test-claude@example.com` wurde für den Durchlauf angelegt
und danach wieder gelöscht (siehe Chat) — falls noch vorhanden, gefahrlos
löschbar.

---

### Nachtrag Teil 121 — Nachtblau-Design, Gehirn + Tagesfortschritt in einer Karte

- **Nachtblau als App-Farbe** (Wunsch der Nutzerin: „alle Bereiche, die einheitlich grün waren, sollen Nachtblau sein“):
  - `theme.js`: accent `#3B4BA8`, accentDark `#1B2150`, accentSoft `#E7E9F7`; success/„erledigt“ `#2F3E96`.
  - Dazu neue Tokens `nachtVerlauf`, `nachtSchatten`, `logoTuerkis`, `logoBlau`, `logoVerlauf` für die Highlight-Elemente (Spielstand-Karte, Gehirn, große Feier-Karte).
  - Bereichsfarben (KATEGORIE_META) und der rote Notfallmodus bleiben.
  - Restliche fest eingebaute Grüntöne ersetzt: QuickTaskList, KiChat-Orb-Schein, Onboarding-Schatten, Puls-Animation in `index.css`.
- **Gehirn + Diagramm in einer Karte** (`ui/GehirnKarte.jsx`):
  - Klassische Gehirn-Seitenansicht mit Lappen, Seiten- und Zentralfurche, Windungen im Logo-Linienstil, Kleinhirn und Hirnstamm.
  - Die Zeitraum-Wahl Tag/Woche/Monat/Gesamt steuert Regionen (`berechneGehirnZeitraum` in `utils/gehirn.js`, Zuordnung `WIDGET_REGION`) und die Balken darunter.
  - Antippen einer Region hebt ihre Balken hervor.
  - Die separate Tagesfortschritt-Karte auf Home ist entfallen, ebenso `TagesfortschrittBalken.jsx`/`TagesfortschrittOrden.jsx`; die Orden sind unter Erfolge zu sehen.
- **Bug-Fix** `kalendertageSeit()` (`utils/zeitraumFortschritt.js`): Tage seit Protokollstart nach örtlichem Datum. Vorher ignorierte die Wochen-/Monatsansicht kurz nach Mitternacht den Vortag (UTC-Verschiebung).

### Nachtrag Teil 121 — Gehirn, 800 Denksport-Aufgaben, Denksport-Seite

- **„Dein Gehirn“ statt „Deine Welt“** (`utils/gehirn.js`, `ui/GehirnKarte.jsx`), gestaltet nach dem Logo: Gehirn von vorne, links Linienzeichnung, rechts Punktewolke, die sich mit der Wochenladung zur ganzen Hälfte sammelt; der offene Logo-Ring zeigt den Wochenfortschritt; Regionen = große Punkte plus Legende mit Ladebalken. Die Bereiche sind zu 6 Regionen zusammengefasst:
  - Fokus & Planung (Gewohnheiten, Routinen, Denkpause)
  - Bewegung
  - Energie (Ernährung, Hydration, Supplemente, Medikamente)
  - Licht & Rhythmus
  - Ruhe & Gefühl (Atemübungen)
  - Erholung (Schlaf)

  Jede Region lädt sich mit den aktiven Tagen der letzten 7 Tage auf. Laufende Serien leuchten als Nervenbahnen zwischen benachbarten Regionen. Pausierte Regionen „ruhen“ (💤), nie genutzte bleiben neutral. Antippen erklärt die Region; bei Fokus gibt es einen Knopf zum Denksport. Die Grafik ist ein selbst gezeichnetes SVG, später gegen eine Canva-Illustration tauschbar. `berechneErrungenschaften` liefert dafür je Kategorie zusätzlich `tage`/`tageListe`.
- **Denksport-Katalog 200 je Kategorie** (`src/data/denkpausen*2.js`, zusammengeführt in `denkpausen.js`):
  - Mathe per Generator, unabhängig nachgerechnet.
  - Wortspiele, Rätsel und Wissen von Hand geschrieben und auf Eindeutigkeit durchgesehen.
  - `denkpausen.test.js` prüft Anzahl, keine Dopplung und 4 verschiedene Antworten.
- **Denksport-Seite** (`views/DenksportView.jsx`, View `denksport`): Kategorie wählen (auch „Gemischt“), Runde aus 5 Fragen (`denksportRunde`, ohne direkte Wiederholung), freundliche Auflösung ohne „falsch“-Rot, große Feier am Ende, Ergebnisse über `denkpauseErgebnisVermerken`. Erreichbar über die Kachel „🧩 Denksport“ auf Home und über die Fokus-Region im Gehirn. e2e: `e2e/denksport.spec.js`.

### Nachtrag Teil 121 — Gruppenprotokolle (24.09.)

- Die Nutzerin hat die Vorschau freigegeben. Ein Team führt **zusätzlich** zu den eigenen Protokollen ein gemeinsames Protokoll. Anlegen und Beenden darf nur der Admin (Coach). Nebenbei geklärt: „Neues Protokoll“ im Modus „Verwalten als“ legt das Protokoll bereits für die verwaltete Coachee an, weil `userId` dann die Proband-ID ist.
- **Migration `0096_gruppenprotokolle.sql`** (auf Prod eingespielt):
  - Tabellen `gruppenprotokolle`, `gruppen_bausteine`, `gruppen_baustein_logs` und `gruppen_quests`
  - RLS: Admin alles, Team-Mitglieder lesen über `ist_im_gruppenprotokoll()`, Logs nur für sich selbst anlegen und löschen
  - `gruppenprotokoll_status(gp, von, bis)` liefert, wer an welchem Tag welchen Baustein geschafft hat. Die Arten `morgenroutine`, `abendroutine`, `trinkziel`, `tageslicht` und `tagesraetsel` zählen automatisch aus den vorhandenen Daten, `eigen` über die Logs.
  - `_punkte_ereignisse` zählt `gruppen_baustein_logs` jetzt mit.
- **App:**
  - `data/gruppenprotokoll.js` (+ Test): Hook `useGruppenprotokolle` im PlatformDataContext, `gruppenBausteinUmschalten`, Admin-Funktionen, Helfer `questFortschritt` und `werHatHeute`. **Achtung:** Der Fortschritt heißt `gp.stand`, `gp.status` bleibt active/archived.
  - `ui/GruppenprotokollKarte.jsx` sitzt oben auf der Team-Seite: Tag x von y, Gruppen-Quests mit eigenem Beitrag, „Heute“ je Baustein mit Profilbildern, Abhaken eigener Gruppen-Gewohnheiten, „Die letzten Tage“. Ist eine Quest geschafft, gibt es eine große Feier und das Abzeichen `gruppenquest_<id>`.
  - Home: offene eigene Gruppen-Gewohnheiten stehen unter „Als Nächstes“ (Kategorie `gruppe`, direkt abhakbar), dazu die Karte „Gruppen-Quest“.
  - Neue Punkte-Kategorie `gruppe` in `errungenschaften.js`.
  - `ui/GruppenprotokollAdmin.jsx` in Admin → Teams je Team: Formular (Name, Ziel, Zeitraum, Bausteine, eine Quest), laufende Protokolle mit „Stand“ und „Beenden“.
- **Dauertest:** Das Skript hakt auf der Team-Seite eigene Gruppen-Gewohnheiten ab (mit Fleiß-Faktor). e2e: `e2e/gruppenprotokoll.spec.js`; das Harness kennt `?gruppe=1`.
- **Bugsuche 24.09. (Nachmittag):** Live-Check mit Mia/Lea: 24 Ansichten fehlerfrei, Abhaken auf der Team-Seite funktioniert. Behoben: (1) Nach dem Enddatum liefen Gruppenprotokolle bisher einfach weiter. Jetzt `istAbgelaufen`: Der Stand bleibt auf dem Enddatum stehen, die Karte zeigt „abgeschlossen“, Abhaken und Home-Einträge entfallen, und im Admin steht „Zeit um – kann beendet werden“. (2) Der Team-Feed zeigt jetzt den Tag („heute“, „gestern“ usw., `tagLabel`). Vorher wirkte eine Routine von gestern, als wäre sie heute geschafft.
- **Komplett-Test 24.09. nachts:** Unit-, Oberflächen- und Live-Tests (4 Coachees und Admin) liefen ohne App-Fehler. Behoben: Das Team-Wochenziel zählte nur Personen, die teilen; jetzt kommen Summe und Personenzahl aus `team_liga`. Außerdem den Hinweistext auf der Team-Seite angepasst. Migration `0099` härtet Trigger-Funktionen (kein API-Aufruf mehr) und setzt den search_path von `set_updated_at`. Bekannt: Chromium merkt sich fehlgeschlagene Modul-Importe, deshalb helfen die stillen Wiederholungen dort nicht, und es greift das einmalige Neuladen (kein Absturz-Bildschirm).
- **Rangliste + Teilen-Freigabe (24.09. abends, Vorschau freigegeben):**
  - Unter Mehr → Rangliste der Schalter „Meine Punkte mit anderen teilen“ (`profiles.rangliste_sichtbar`). **Startzustand jetzt aus.** Migration `0098_rangliste_personen.sql` (auf Prod) hat alle bestehenden Konten auf aus gesetzt, außer den vier Dauertest-Konten.
  - Team-Seite, Reiter „🏆 Rangliste“ mit „👤 Personen“ und „👥 Teams“ sowie Woche/Monat/Gesamt.
    - **Personen:** `rangliste_personen()`, alle Coachees über alle Teams, nur wer teilt; Admin-Konten nur, wenn sie teilen. Nicht-Teilende werden nur gezählt. Ansehen dürfen alle; wer nicht teilt, sieht „Jetzt freischalten“.
    - **Teams:** immer sichtbar, Ø pro Person plus Gesamtpunkte (`team_liga.punkte_summe`). „euer Team“ kommt aus dem App-Kontext und stimmt deshalb auch bei „Verwalten als“.
  - Coachees ohne Team landen direkt in der Rangliste; auf der Startseite gibt es dafür die Karte „🏆 Rangliste“.
  - Die Quest-Rangliste auf der Startseite ist jetzt auch für Nicht-Teilende sichtbar.
  - Folge: Wer nicht teilt, erscheint auf der Team-Seite des eigenen Teams als „🙈 privat“. Team-Wochenziel und Summen zählen alle mit.
- **Dauertest 24.09. abends:** Gruppenprotokolle wurden nur beim App-Start geladen, dadurch zeigte die Team-Seite veraltete Stände. Jetzt laden sie neu beim Öffnen von Team-Seite und Startseite (`gruppenprotokolleNeuLaden`) und bei `visibilitychange`. Bericht: `docs/dauertest/2026-09-24.md`.
- **Admin-Livetest 24.09. (Abend):** Neues Admin-Testkonto `claude.admintest@example.com`, Skript `scripts/dauertest/adminlauf.mjs` (siehe `scripts/dauertest/README.md`). Behoben:
  1. **„Verwalten als“ auf der Team-Seite:** Die Seite rechnete mit dem Admin-Konto statt mit der verwalteten Person. Folgen: kein „Du“, „Motivieren“ bei sich selbst, leerer Feed. `MeinTeam` bekommt jetzt `ichId` = `userId` aus `useAppData`. Migration `0097_team_neuigkeiten_verwalten.sql` (auf Prod eingespielt) ergänzt `team_neuigkeiten(p_tage, p_fuer)`; `p_fuer` wirkt nur für Admins.
  2. **Nachlade-Fehler:** Ein einzelner 502 auf einer Teil-Datei ließ den Tagesplan kurz abstürzen. Der alte `vite:preloadError`-Handler mit preventDefault ließ den Import mit `undefined` enden. Neu ist `lazyAnsicht` = `lazy(ladeMitWiederholung(...))`: zwei stille Wiederholungen, danach lädt das Auffangnetz einmal neu.
  3. Im Admin-Dashboard wurde das „Admin“-Schild bei langen Namen weggequetscht.

### Nachtrag Teil 121 — Team-Seite, Team-Liga, Coach-Ansicht (24.09.)

- Die Nutzerin hat die Vorschau freigegeben: „bau alle drei Seiten“.
- **Migration `0095_team_statistik.sql`** (auf Prod eingespielt, plus `0095b` gegen doppelte Neuigkeiten):
  - `_punkte_ereignisse(user)`: intern, nicht aufrufbar für `authenticated`. Zählt wie `errungenschaften.js`: 1 Punkt je erledigtem Eintrag, erreichtem Wasser-/Tageslicht-Tagesziel, abgeschlossener Routine pro Tag und richtiger Tagesrätsel-Antwort, dazu der Tagesrätsel-Bonus. Datum der Zeitstempel in der Zeitzone der Person.
  - `team_mitglieder_statistik(von, bis)`: für Admins alle Personen in Teams, sonst nur das eigene Team. Personen mit `rangliste_sichtbar = false` erscheinen für andere als `privat` ohne Zahlen.
  - `team_liga(von, bis)`: nur Team-Summen (Ø pro Person, Vorzeitraum, aktive Tage, Tagesrätsel-Tage) und Anfangsbuchstaben.
  - `team_neuigkeiten(tage)`: Routine geschafft, Training, Tagesrätsel; ohne Privat-Personen und ohne Gesundheitsdetails.
- **App:**
  - `data/teamStatistik.js` (+ Test): Zeiträume Mo–So, Monat, gesamt; `WOCHENZIEL_PRO_PERSON = 50`; Highlights nur auf Team-Ebene.
  - `views/TeamView.jsx` (View `team`, Reiter „Mein Team“ / „🏆 Team-Liga“):
    - gemeinsames Wochenziel; Privat-Personen zählen nicht ins Ziel
    - Mitglieder mit Profilbild, Serie, Level und Punkten
    - „💬 Motivieren“ für alle, die seit 2 oder mehr Tagen ruhig sind (nutzt `teamNachrichtSenden` inklusive Push)
    - Team-Neuigkeiten
  - Erreichbar über „Team-Seite ›“ in der Team-Karte auf Home; für Admins über „🏆 Team-Liga ansehen“ in Admin → Teams.
  - **Coach-Ansicht** in `AdminTeamsView.jsx` (`TeamWoche`): Balken der Wochenpunkte pro Person mit Profilbild und Warnhinweisen „seit X Tagen nichts abgehakt“. Direkt daneben „Nachricht schreiben“ über `coachNachrichtSenden`.
- e2e: `e2e/team.spec.js` mockt die RPCs. Das Harness kennt jetzt `?team=1`; im Mock ist `team` standardmäßig `null`.
- **Stand 24.09.:** Es gibt 1 Team („Aka“) ohne Mitglieder. Die Seiten füllen sich erst, wenn Coachees Teams zugeordnet werden.

### Nachtrag Teil 121 — Kürzeres Erst-Onboarding (24.09.)

- Die Nutzerin hat die Vorschau freigegeben. Vorher waren es 20 Bildschirme (selbst beim Überspringen), jetzt 5 plus die 1–3 gewählten Bereiche.
- **Neuer Ablauf** (`OnboardingFlow.jsx`, nur Erst-Onboarding):
  1. `welcome`: eine Seite statt drei Folien; `WelcomeView` mit neuen Texten `welcome.kurz.*` (de/en/tr).
  2. `intro`: Name und Begleitungs-Wahl auf einer Seite. Die Knöpfe heißen jetzt „🗣️ Ich erzähl Aka einfach frei“, „💬 Aka fragt mich Schritt für Schritt“ und „🙋 Ich klick mich selbst durch“.
  3. `ziele`: die Ziele als Antipp-Pills statt einer Häkchen-Liste.
  4. `bereiche` (neu, `OnboardingBereicheView.jsx` + `startBereiche.js`):
     - höchstens 3 Bereiche wählbar;
     - 2 Vorschläge aus den Zielen sind vorausgewählt (`vorschlaegeAusZielen`, Standard: Routinen und Medikamente);
     - das Hauptprotokoll „Mein Start“ wird gleich nach der Willkommensseite angelegt (damit auch Einträge aus dem Aka-Begleitmodus daran hängen); hier lässt sich der Name noch ändern (`hauptprotokollUmbenennen`).
  5. Die Routinen-Seite erscheint nur, wenn „Routinen & Schlaf“ gewählt wurde.
  6. `categories` mit `nurSchritte`: nur die gewählten Kategorien, ohne „Jetzt oder später?“-Gate, Zählung „Bereich x von n“.
  7. `celebration` mit `spaeter`: eine Liste „Später dazunehmen“ mit den übrigen Bereichen und „Profil & Laborwerte“.
- **Coachees im Kurz-Modus:** Willkommen → Name → Ziele → Steckbrief → Abschluss. Das Protokoll wird nach den Zielen automatisch angelegt.
- **Weggefallen im Erst-Onboarding:** die Seiten Protokollname, Quick-Win, Profil und Laborwerte sowie die 8 Gate-Seiten. Alle Formulare bleiben erreichbar (Startseite „Weitere Pläne“, Archiv → Profil).
- **„Neues Protokoll“** (`startPhase="hauptprotokoll"`) läuft unverändert den alten, vollständigen Weg.
- Jede Onboarding-Seite scrollt jetzt beim Wechsel nach oben.
- e2e: `e2e/onboarding.spec.js` ist neu geschrieben (voller Durchlauf, Bildschirmzeit, Coachee-Kurzweg). Unit-Test: `startBereiche.test.js`.

### Nachtrag Teil 121 — Profilbilder und Team-Kolleg:innen-Fix (24.09.)

- **Migration `0094_profilbilder.sql`** (schon auf Prod eingespielt, zusammen mit `0094b`):
  - neue Spalte `profiles.profilbild_pfad`
  - privater Bucket `profilbilder` (max. 2 MB, jpeg/png/webp), Dateien unter `<user_id>/profil-<zeit>.jpg`
  - Storage-RLS: Schreiben nur im eigenen Ordner; Lesen für die Person selbst, Admins und das eigene Team (`gleiches_team`)
  - `quest_rangliste()` und `admin_liste_probanden()` liefern zusätzlich `profilbild_pfad` (Funktionen per drop/create neu angelegt, Grants wie in 0092)
- **Bug-Fix Teams:** `useTeamData.js` las die Team-Kolleg:innen bisher direkt aus `profiles`. Das erlaubt RLS für Coachees nur für die eigene Zeile, die Team-Karte blieb deshalb für alle Coachees leer. Neu gibt die Funktion `team_kollegen()` (security definer) Vorname und Profilbild aus demselben Team zurück.
- **App:**
  - `data/profilbild.js`: schneidet das Bild vor dem Upload quadratisch zu und verkleinert es auf 512 px; zeigt es über signierte URLs an (Cache 55 Min.).
  - `ui/Profilbild.jsx`: rundes Bild oder, ohne Foto, der Anfangsbuchstabe.
  - `ui/ProfilbildKarte.jsx`: oben in Archiv → Profil, mit Hinweis, wer das Foto sieht.
  - Bilder erscheinen in der Rangliste, in der Team-Karte und in der Admin-Teamverwaltung.
- **Offen / aufgefallen:**
  - `CommunityTab.jsx` zeigt ein fest eingebautes Beispiel („BPC-157 … 124 Nutzer:innen, 72 %“). Das sind keine echten Daten. Sollte entfernt oder klar als Beispiel markiert werden, bevor echte Nutzer:innen die App sehen.
  - Eine Team-gegen-Team-Wertung oder eine Punkte-Rangliste gibt es noch nicht; die Rangliste zählt nur abgeschlossene Quests je Person.

### Nachtrag Teil 121 — Neustart: „Fortschritt auf Null“ und Lücken im Komplett-Reset (24.09.)

- Die Nutzerin will vor dem echten Protokoll „von Null an neu anfangen“. Sie hat entschieden, beide Wege anzubieten.
- **Mehr → Gefahrenzone** hat jetzt zwei Karten:
  - **„Fortschritt auf Null“:** Bestätigungswort „NEU STARTEN“, Funktion `fortschrittZuruecksetzen` in `useKompletterReset.js`.
    - Löscht alle Abhak-Logs und Verläufe, Errungenschaften, Denksport-Ergebnisse, Quest-Fortschritt und Wochen-Snapshots sowie Trainings bis heute.
    - Setzt das `startdatum` aktiver Protokolle auf heute.
    - Die Einrichtung bleibt erhalten, ebenso Blutwerte, Änderungsprotokoll, Nachrichten und Tagebuch.
  - Beide Knöpfe öffnen danach zusätzlich ein Fenster „Bist du dir sicher?“ mit großem „Nein, abbrechen“ (Wunsch 24.09.)
  - **„Alles löschen“:** wie bisher mit „ALLES LÖSCHEN“. Neu mit gelöscht werden `quest_fortschritt`, die `routine_*_items` und `atemuebungen`.
- **RLS:** `quest_fortschritt` und `wochenprotokoll_snapshots` dürfen nur Admins löschen. Bei Coachees bleiben diese Zeilen still stehen; das ist gewollt.

### Nachtrag Teil 121 — Home: eine Karte ganz oben, Schnellknöpfe im Gehirn (24.09.)

- **Eine Karte oben:** Ganz oben steht eine einzige Karte (`GehirnKarte` mit Prop `kopf`). Darin sitzt der Spielstand (`SpielstandKarte eingebettet`) mit Begrüßung, Level, Tagesring, Serie, Punkten und Level-Balken. Darunter folgt, durch eine Linie getrennt, „Dein Gehirn“. „Als Nächstes“ und die Tages-Quests kommen danach.
- **Schnellknöpfe im Gehirnbild:** Die Kacheln „Wasser eintragen“ und „Grad nicht gut?“ unter dem Gehirn sind entfernt. Stattdessen sitzen unten links im Gehirnbild zwei Knöpfe (`Schnellknoepfe` in `GehirnKarte.jsx`):
  - ein großer, leicht wippender Wasser-Tropfen (`.mp-tropfen`), der die Wasser-Seite öffnet;
  - ein runder gelber 💡-Knopf, der das Akutmodus-Panel öffnet.
- **„Jetzt dran“ in der Karte:** Die Nutzerin hat sich aus drei Vorschauen für „Variante B“ entschieden. `HomeView.jsx` übergibt `kartenMitte` als `mitte` an `GehirnKarte`. Direkt unter dem Spielstand steht ein weißes Feld mit der nächsten Aufgabe groß (`renderAlsNaechstes({ max: 1, eingebettet: true })`), die folgenden stehen als antippbare „Danach:“-Chips in ihrer Bereichsfarbe daneben. Die separate „Als Nächstes“-Liste unter der Karte gibt es nicht mehr, die volle Liste steht im Tagesplan.
- Das Test-Harness kennt `?beispiel=1` (Beispieltag mit Routine, Medikament, Supplement, Gewohnheit) für Design-Vorschauen.
- **Aka-Knopf:** Der Aka-Orb bleibt wie gehabt fest unten mittig (`KiChat.jsx`, Portal). Auf ganzseitigen Screenshots erscheint er mitten auf der Seite; das ist kein Fehler.

### Nachtrag Teil 121 — Tagesrätsel statt freiem Denksport (24.09.)

- **Wunsch der Nutzerin:** jeden Tag 5 gemischte Fragen als Pflichtaufgabe, wie das Trinkziel, mit Belohnung im Punktesystem.
- **Freies Training nur für das Admin-Konto:** Die Nutzerin hat sich für „Variante 3“ entschieden, weil der Fragenvorrat sonst zu schnell aufgebraucht ist. Nachtrag von ihr: „Nur für mich der freie Bereich“. In `views/DenksportView.jsx` sehen daher alle die Tagesrätsel-Karte, die Kategorie-Auswahl („Freies Training“) nur bei `istAdminKonto`, auch in deren Coachee-Ansicht.
- **Logik** (`utils/tagesraetsel.js`, Ziel `TAGESRAETSEL_ZIEL = 5`):
  - Gezählt wird jede heute beantwortete Frage in `denkpause_ergebnisse`, egal ob richtig oder falsch. Auch Antworten aus der Denkpause zählen mit.
  - Ab 5 Antworten gilt der Tag als geschafft.
- **Auf der Startseite:**
  - Tages-Quest „Tagesrätsel x/5 Fragen“ (`utils/tagesQuests.js`, antippbar über `viewId`).
  - Ein Pseudo-Punkt unter „Als Nächstes“, bis das Tagesrätsel geschafft ist.
  - Es zählt im Tagesring als +1 mit.
  - Farbe: `TAGESRAETSEL_META` in `dayItems.js`.
- **Direktstart:** View `tagesraetsel` (`#/tagesraetsel`) startet die Runde sofort mit den noch offenen Fragen.
- **Punkte:** Jede richtige Antwort bringt weiterhin einen Punkt (Kategorie `denkpause`). Dazu kommt die neue Kategorie `tagesraetsel` in `errungenschaften.js`: ein Bonuspunkt je geschafftem Tag, mit eigener Serie und eigenen Abzeichen. Im Gehirn gehört sie zur Region „Fokus“.
- e2e: `e2e/denksport.spec.js`.

### Nachtrag Teil 121 — Farben: Bereichsfarben, Kasten-Stil, Tagesphasen (23./24.09.)

- **Bereichsfarben** (`utils/dayItems.js`): jede Kategorie hat eine eigene, gut unterscheidbare Farbe (`KATEGORIE_META`, je `bg`/`text`/`dot`). Morgen-/Abendroutine stehen in `ROUTINE_META` (Orange/Indigo). `BereichColorContext` kennt beide.
- **Kasten-Stil:** Tagesplan-Einträge, „Als Nächstes“ und Tages-Quests sind Kästen mit dicker Umrandung in der Bereichsfarbe (`dot`) und getönter Füllung (`bg`).
- **Tagesphasen** (`utils/tagesphase.js`, Hook `utils/useTagesphase.js`, minütlich):
  - `morgen` gilt bis zur erledigten Morgenroutine, höchstens bis 12:00 (ohne Morgenroutine bis 09:00).
  - `nacht` gilt ab `abend.startZeit` (Standard 20:00), sobald heute die Abendroutine läuft, und vor 04:00.
  - Sonst gilt `tag`.
- **Die ganze App folgt der Phase:** Die Marken-Tokens in `ui/theme.js` (`accent`, `accentDark`, `accentSoft`, `success`, `successSoft`, `nachtVerlauf`, `nachtSchatten`) sind **CSS-Variablen** (`--mp-…`, Standard Nacht in `index.css`).
  - `AuthenticatedApp` setzt sie über `setzeTagesphasenFarben(phase)` (Paletten in `TAGESPHASEN_FARBEN`).
  - `hexZuRgba`, `aufhellen` und `verdunkeln` erkennen `var(...)` und nutzen `color-mix`.
  - **Wichtig:** Tokens nicht mehr per String-Anhang abdunkeln (`${accent}22`), sondern über diese Helfer.
  - In SVG Tokens über `style={{ fill/stroke }}` setzen, nicht als Attribut. Grund: Safari verträgt `var()` in Attributen nicht zuverlässig.
  - Recharts bekommt Farben über `aufgeloesteFarbe()`.
- Die Gehirn-Karte (`ui/GehirnKarte.jsx`) hat ihre eigene Stimmung je Phase: Sonne, Wolken, Sterne und Mond.

### Nachtrag Teil 121 — Aka: ein Assistent für die ganze App

- Wunsch der Nutzerin: Aka auf allen Seiten „über den gleichen Code, die gleiche Systematik“, als wäre es von Anfang an so gebaut worden.
- **Vorher:** 12 Bereichsseiten hatten je einen eigenen `<KiChat>` mit kopierter Speicher-Logik (…Uebernehmen-Handler je Seite). Home, Tagesplan und Wochenübersicht nutzten den universellen Coach, alle übrigen Seiten den `GlobalerAka`.
- **Jetzt:** `ui/Aka.jsx` wird genau einmal zentral in `AuthenticatedApp.jsx` gemountet, für jede Ansicht außer dem Onboarding (`form`, das hat seine eigene geführte KI).
  - Die Aktionen laufen überall über `useUniversellerCoach()`, jetzt auch mit Morgen-/Abendroutine-Schritten (`bereichErkennen` kennt `morgenroutine`/`abendroutine`).
  - Die Bestätigung nach „Übernehmen“ zeigt `ui/AkaErgebnis.jsx`.
- Die Seite bestimmt nur den Fokus (`AKA_SEITEN`): Fokus-Satz im Prompt (die Inhalte der früheren Bereichs-Prompts), Begrüßung und Verlaufs-Schlüssel `bereich`.
  - Die Schlüssel sind dieselben wie früher, damit Verläufe und bereichsbezogene Admin-Hinweise erhalten bleiben.
  - Seiten ohne eigenen Fokus teilen sich `home`.
  - Ausnahme: Der alte separate Workflow-Chatverlauf (`workflow`) wird nicht mehr angezeigt; auf der Gewohnheiten-Seite läuft Aka unter `gewohnheiten`.
- Entfernt: `GlobalerAka.jsx`, `KiHinweis.jsx`, alle seitenbezogenen KiChat-Blöcke, Handler und Hinweistexte (~500 Zeilen). Die manuellen Formulare sind unverändert (Leitprinzip).
- e2e: `e2e/aka.spec.js` prüft genau einen Aka-Knopf auf jeder Seite und keinen für Coachees.

### Nachtrag Teil 121 — Belohnungsfenster bleibt stehen

- Wunsch der Nutzerin: Das Belohnungsfenster war zu kurz offen, der Belohnungseffekt ging verloren; sie möchte es selbst wegdrücken.
- `ui/Belohnungsfenster.jsx`: `gross: true` erscheint jetzt als Feier-Karte in der Mitte (abgedunkelter Hintergrund, großes Symbol, Konfetti, „⚡ +1 Punkt“, Knopf „Juhu, weiter! 🎉“). Sie bleibt, bis weggetippt wird. Kleine +1-Meldungen stehen 5 s (vorher 2,6 s) und schließen per Tipp. Die Warteschlange hält alles an, bis eine große Feier weggetippt ist.
- Als große Momente markiert: Routine abgeschlossen (`RoutineAblauf`), Training abgeschlossen, Trinkziel erreicht, dazu wie bisher Tag geschafft, Level-Up und neues Abzeichen.
- Tests: `src/ui/Belohnungsfenster.test.jsx`.

### Nachtrag Teil 121 — Coachee-Ansicht für Admin-Konten

- Wunsch: als Admin die App auch "ganz normal wie jede Coachee" nutzen. Entscheidung der Nutzerin: **Umschalter im Admin-Konto** (kein zweites Konto).
- `useProfileData.js`: `istAdminKonto` = echtes `profiles.is_admin`; `isAdmin` ist jetzt die *Ansicht* (`istAdminKonto && !coacheeAnsicht`), daher greift die bestehende istAdminModus-Logik überall automatisch. `coacheeAnsicht` pro Gerät/Person in localStorage (`aka_coachee_ansicht_<userId>`). Datenbank-Rechte unverändert.
- `ui/AnsichtUmschalter.jsx` unter "Mehr" (nur für Admin-Konten, auch in der Coachee-Ansicht sichtbar = Weg zurück). Beim Umschalten wird "Verwalten als" beendet.
- Einschränkung: Admin-Quests "an alle" und Teams filtern `is_admin`-Profile weiterhin heraus — das eigene Konto bekommt dort also keine Coach-Quests/Teams.
- e2e: `e2e/coachee-ansicht.spec.js`; Harness hält `coacheeAnsicht` als echten State.

### Nachtrag Teil 121 — Spiel-Ausbau (Wunsch "erweitere es soweit du kannst")

- **Tages-Quests** (`utils/tagesQuests.js`, `ui/TagesQuestsKarte.jsx`): automatische Etappenziele aus dem eigenen Tag (erster Haken, Halbzeit, Morgen-Sprint bis 11 Uhr, Trinkziel) — ohne DB, für alle (auch Admin). Die Coach-Quests (`quests`-Tabelle) bleiben unverändert für Coachees.
- **Deine Welt** (`utils/welt.js`, `ui/WeltKarte.jsx`): jeder Bereich mit Punkten = Pflanze, die mit erledigten Tagen wächst (🌰→🌱→🌿→🪴→🌳→🌸 bei 0/1/3/7/14/30). Ohne aktuelle Serie schläft sie (💤), welkt aber nie.
- **Level-Up- und Abzeichen-Feier** (`ui/useSpielFeiern.js`): höchstes Level pro Person in localStorage (`aka_level_<userId>`), erstes Mal nur merken; neue Abzeichen aus `neueBadgeKeys` → große Feier.
- **Belohnungsfenster mit Warteschlange**: eine große Feier wird nicht mehr vom nächsten Fenster überschrieben.
- Beide Karten stehen auf Home direkt unter "Als Nächstes" und sind im Notfallmodus ausgeblendet.

## 🔴 Update 16.09.2026 (Teil 120) — Migration 0087 (Denkpause) nachträglich idempotent gemacht

**Nutzerinnen-Report:** beim Ausführen von `0087_denkpause.sql` meldete
Supabase "relation denkpause_ergebnisse already exists".

**Root Cause:** die Tabelle war offenbar schon aus einem früheren Versuch
vorhanden, das Skript hatte aber kein `if not exists` — `create table`
bricht in diesem Fall sofort mit Fehler ab, wodurch die beiden folgenden
Anweisungen (RLS-Policy, Index) gar nicht mehr ausgeführt werden. Exakt
dasselbe Problem wurde in dieser App schon zweimal gelöst (Migration
0071: `routine_schritte`/`routine_einstellungen`; Migration 0076:
`atemuebungen`/`atemuebung_logs`/`akutmodus_log`) — diesmal wurde beim
Schreiben von 0087 schlicht vergessen, densel­ben Guard mit
anzuwenden.

**Umgesetzt:** `0087_denkpause.sql` auf `create table if not exists`,
`drop policy if exists` vor `create policy` und `create index if not
exists` umgestellt — sicher erneut ausführbar, unabhängig davon, wie weit
ein vorheriger Versuch schon gekommen war.

Keine Auswirkung auf App-Code, reine SQL-Korrektur.

---

## 🔴 Update 16.09.2026 (Teil 119) — Zweite Nachkontrolle: Erinnerungs-Edge-Function kannte "bildschirmzeit" nicht (Redeploy nötig)

**Nutzerinnen-Frage** (nach Teil 118): "ist es möglich, dass es noch
weitere solcher versteckten Dinge gibt? Musst du das vielleicht jetzt
noch einmal in einem anderen Bereich noch überprüfen?" — ja, Teil 118 hat
nur EINE Fehler-Art durchsucht (DB-Check-Constraints mit fester
Werte-Liste). Zwei weitere Bereiche desselben Grundmusters ("neue
Kategorie eingeführt, andere Stelle nicht mitgezogen") geprüft:

1. **RLS-Policies:** jede Tabelle mit `enable row level security` gegen
   alle `create policy ... on public.<tabelle>`-Zeilen über sämtliche
   Migrationen gegengeprüft — keine Tabelle ohne mindestens eine Policy
   gefunden. Kein Fund.
2. **Erinnerungs-Edge-Function `send-due-reminders/index.ts`:** jede
   Kategorie, die irgendwo in der App eine Erinnerungs-UI einbindet
   (`ZeitErinnerungenCard`/`KategorieErinnerung`), gegen die Kategorien
   geprüft, die die Edge Function tatsächlich abfragt. **Fund:**
   `ZEITEN_KATEGORIEN` (der Abschnitt für Hydration/Tageslicht/Schlaf —
   Erinnerungen mit einer frei konfigurierbaren Uhrzeiten-Liste) enthielt
   "bildschirmzeit" nicht, obwohl `BildschirmzeitView.jsx` seit Teil 107
   genau dieselbe `<ZeitErinnerungenCard kategorie="bildschirmzeit">`
   einbindet wie die anderen drei. Alle übrigen Kategorien (Gewohnheiten,
   Training, Ernährung, Medikamente/Supplemente/Peptide, Morgen-/
   Abendroutine, Workflow) wurden einzeln nachverfolgt — alle korrekt an
   ihre jeweilige Tabelle/ihren jeweiligen Erinnerungs-Mechanismus
   angebunden, kein weiterer Fund.

**Umgesetzt:** `ZEITEN_KATEGORIEN` in
`supabase/functions/send-due-reminders/index.ts` um `{ kategorie:
"bildschirmzeit", icon: "📱", einheit: "Bildschirmzeit-Check", mitMenge:
false }` ergänzt — exakt dasselbe Muster wie die drei bestehenden
Einträge.

**Wichtiger Unterschied zu den Migrationen 0087–0090:** das hier ist
KEINE SQL-Datei — Edge Functions werden nicht über `supabase db push`
mit ausgerollt, sondern brauchen ein eigenes, separates Redeploy (`supabase
functions deploy send-due-reminders` oder über das Supabase-Dashboard).
Ohne dieses Redeploy bleibt der Fix wirkungslos, obwohl der Code im Repo
schon korrigiert ist.

Kein Build/Lint/Typecheck/Test-Lauf möglich für diese Datei (Deno-
Edge-Function, kein Teil der Vite/Vitest-Toolchain dieses Repos) — Änderung
manuell gegengelesen (reine Ergänzung eines Array-Eintrags, exakt im
bestehenden Muster).

---

## 🔴 Update 16.09.2026 (Teil 118) — Nachkontrolle: systematische Suche nach demselben Bug-Muster in der ganzen App (Migrationen 0089 + 0090, beide noch nicht deployt)

**Nutzerinnen-Bitte** (nach dem Bildschirmzeit-Fund, Teil 117): "check
auch bitte gleich den Rest der Sachen, die du heute verändert hast und
bearbeitet hast oder andere Bereiche wie diesen, ob da Bugs sind oder
Probleme."

**Vorgehen:** zwei getrennte Durchgänge.

**1. Die heutigen Code-Änderungen selbst (Teile 113–116) noch einmal
gegengeprüft** — Schlaf-Merge, Stepper-Vereinheitlichung, KI-Wahl-Screen,
Home-Zeitraum-Auswahl: Zurück/Weiter-Übergänge, Edge Cases (leeres
`schlafBloecke`, fehlendes `aktivesHauptprotokoll`, negative/fehlende
Tage-seit-Start-Werte) noch einmal einzeln durchgespielt. Keine neuen
Fehler gefunden — alle vier Features verhalten sich wie in ihren
jeweiligen Teilen oben beschrieben und getestet.

**2. Systematische Suche nach demselben Bug-MUSTER in der ganzen App**
(nicht nur den heutigen Änderungen): der Bildschirmzeit-Fehler war ein
Postgres-CHECK-Constraint, dessen erlaubte Werte-Liste nie erweitert
wurde, als eine neue Kategorie dazukam. Also: JEDEN "kategorie in
(...)"-artigen CHECK-Constraint aus allen `supabase/migrations/*.sql`-
Dateien gegen die tatsächlich im App-Code verwendeten Werte
gegengeprüft (`grep` über alle Migrationen + alle Aufrufstellen der
jeweiligen Speicher-Funktion). Ergebnis: **zwei weitere, unabhängige
Fundstellen desselben Musters**, beide nicht mit heutigen Änderungen
zusammenhängend, sondern schon länger bestehend:

- **`aenderungsprotokoll_kategorie_check`** (Tagesverlauf/Änderungs-Log,
  Migration 0019, seitdem nie erweitert): erlaubte bisher nur `peptid,
  hormon, supplement, training, gewohnheit, hydration, mahlzeit`. Fehlten:
  `workflow` (Workout-Flow-Einträge/-Ausnahmen, `GewohnheitenView.jsx`/
  `TagesEintragBearbeiten.jsx`/`useUniversellerCoach.js`), `notfallmodus`
  (`HomeView.jsx`, Notfallmodus an/aus), `protokoll` (`MehrTab.jsx`,
  Baustein an/ausschalten + "Version festhalten"), `tageslicht` und
  `bildschirmzeit` (`useZielMitKorrektur.js`, Ziel-Korrektur-Vermerk).
  Besonders tückisch: `useAenderungsprotokoll.js`s `aenderungVermerken()`
  fängt den Fehler ab und loggt nur `console.error` — kein Wurf, keine
  UI-Fehlermeldung. Diese Änderungen fehlten seitdem einfach lautlos im
  Tagesverlauf, ohne dass es je auffiel. → `0089_aenderungsprotokoll_fehlende_kategorien.sql`.
- **`hormones_kategorie_check`** (Medikamente, zuletzt in Migration 0042
  erweitert): `MEDIKAMENTE_KATEGORIEN` in `constants.js` (direkt als
  Auswahl in `MedikamenteView.jsx` gerendert) enthält "ADHS-Medikation"
  und "Cannabis" (Cannabis-Felder kamen mit Migration 0082 dazu) — beide
  fehlten im DB-Check. Anders als beim Tagesverlauf-Fall scheitert das
  hier SICHTBAR (derselbe "wartet und bricht bei Fehler ab"-Mechanismus
  wie beim Bildschirmzeit-Fund). "ADHS-Medikation" ist bei dieser
  ADHS-Coaching-App vermutlich einer der am häufigsten gewählten Werte
  überhaupt. → `0090_hormones_kategorie_adhs_cannabis.sql`.

**Bewusst NICHT als Bug behandelt** (geprüft, aber kein CHECK-Verstoß):
`tagesplan_ausnahmen_kategorie_check` (passt exakt zu
`AUSNAHME_KATEGORIEN` in `TagesEintragBearbeiten.jsx`), `rolle`/
`absender`-Checks bei Coach-Nachrichten (passen exakt), `quests.typ`
(passt exakt), Routine-/Wochentag-Checks (passen exakt). Die
KI-Kategorisierung in `aiService.js`/`useUniversellerCoach.js` kennt
"bildschirmzeit"/"atemuebungen" nicht als eigenen Fall — das ist eine
fehlende FUNKTION (der Universelle Coach kann diese zwei Bereiche bisher
nicht frei zuordnen), kein Bug/Absturz, da App-seitig konsistent (die
KI würde diese Werte nie vorschlagen) — nicht mit behoben, da außerhalb
des Bug-Scopes; bei Bedarf separat ansprechen.

**🔴 Beide Migrationen NOCH NICHT im echten Supabase-Projekt
ausgeführt** — reine SQL-Änderungen, kein App-Code betroffen. Bitte
zusammen mit 0087 und 0088 deployen, danach Bescheid geben.

---

## 🔴 Update 16.09.2026 (Teil 117) — Bug-Fix: "Bildschirmzeit"/"Atemübungen" konnten nie als Teilprotokoll gespeichert werden (Migration 0088, noch nicht deployt)

**Nutzerinnen-Report** (mit Screenshot): beim Bildschirmzeit-Onboarding-
Schritt, Klick auf "Speichern & weiter", erscheint sichtbar
`Speichern fehlgeschlagen: new row for relation "teilprotokolle" violates
check constraint "teilprotokolle_kategorie_check"`.

**Root Cause:** exakt derselbe Bug wie schon einmal bei Migration 0067
(damals mit "tageslicht") — die `teilprotokolle`-Tabelle hat einen
Postgres-CHECK-Constraint, der die erlaubten `kategorie`-Werte fest
auflistet. Als "Bildschirmzeit" (0086_bildschirmzeit.sql, Teil 107) und
"Atemübungen" (0076_atemuebungen.sql) als neue Lebensbereiche eingeführt
wurden, wurde jeweils vergessen, diesen Check mit zu erweitern —
`teilprotokollSpeichern(hauptprotokollId, "bildschirmzeit", ...)`
(Onboarding-Kategorien-Schritt) und `teilprotokollSpeichern(...,
"atemuebungen", ...)` (An-/Abschalten unter Mehr, `MehrTab.jsx`
`BAUSTEINE_KATEGORIEN`) schlagen seitdem fehl. Anders als beim
Tageslicht-Fall 0067 landet der Fehler hier NICHT nur still in der
Konsole, sondern wird der Nutzerin direkt angezeigt (die
Fehlerbehandlung dafür — "wartet und bricht bei Fehler ab, statt
stillschweigend weiterzuspringen" — ist genau der Bug-Fix aus Teil
103–105).

**Umgesetzt:** `supabase/migrations/0088_teilprotokolle_bildschirmzeit_atemuebungen.sql`
— derselbe drop-and-recreate-Constraint-Ansatz wie 0067, jetzt mit
`bildschirmzeit` und `atemuebungen` ergänzt. Alle App-seitig tatsächlich
verwendeten `kategorie`-Werte (`CATEGORY_STEPS` in `categorySteps.js` +
`BAUSTEINE_KATEGORIEN` in `MehrTab.jsx` + der Schlaf-Sonderfall in
`OnboardingRoutinenView.jsx`, Teil 113) wurden gegen den neuen Constraint
geprüft — vollständig abgedeckt.

**🔴 Migration NOCH NICHT im echten Supabase-Projekt ausgeführt** — reine
SQL-Änderung, kein App-Code betroffen, deshalb kein Build/Lint/Typecheck/
Test-Lauf nötig für diesen Teil. Bitte deployen, danach Bescheid geben.

---

## ✅ Update 16.09.2026 (Teil 116) — Home-Tagesfortschritt: Tag/Woche/Monat/Gesamt-Auswahl fürs Balkendiagramm

**Nutzerinnen-Vorgabe:** im Home-Bereich mit dem Tagesfortschritt-
Balkendiagramm zwischen Wochen- und Monatsdiagramm wählen können können
(Pills über oder unter dem Kasten) — soll genauso funktionieren, wenn sie
als Coach in einen Coachee-Account wechselt ("Verwalten als"). Zusätzlich,
falls ein Protokoll länger als einen Monat läuft: eine "Gesamt"-Option,
die die prozentuale Erfolgs-/Nicht-Erfolgs-Verteilung je Bereich über die
gesamte Protokolllaufzeit zeigt.

**Ansatz:** Statt einer zweiten, abweichenden "Wochen-Zählung" wird die
schon bestehende, zentrale Datenquelle aus dem Erfolge-/Streak-System
(`utils/errungenschaften.js`: `KATEGORIEN` + `holeTage(quellen)` — liefert
pro Lebensbereich exakt die Tage, an denen er als erledigt zählt, dieselbe
Definition wie Streaks/Punkte in Archiv → Erfolge) wiederverwendet. Ein
Tag, der hier im Wochen-/Monats-Balken als "erledigt" zählt, ist exakt
derselbe Tag, der auch einen Streak-Tag in Archiv → Erfolge ausmacht —
keine zweite, konkurrierende Definition von "erfolgreich".

**Umgesetzt:**
- Neue Datei `utils/zeitraumFortschritt.js`: `widgetsFuerZeitraum(zeitraum,
  miniWidgetData, quellen, hauptprotokollStartdatum)` baut aus den
  Home-Widgets (`HomeView.jsx`, `miniWidgetData`) eine Variante fürs
  gewählte Zeitfenster — gibt für "tag" die Widgets unverändert zurück,
  für "woche"/"monat"/"gesamt" ersetzt sie `dailyCount`/`dailyTotal` durch
  "an wie vielen der letzten X Tage erledigt" / "X" (`TagesfortschrittBalken.jsx`
  bleibt dadurch komplett unverändert — sie bekommt einfach ein anderes
  Widget-Array). Der Nenner wird auf die tatsächlich seit Protokollstart
  vergangenen Tage gedeckelt, damit ein frisch gestartetes Protokoll in
  der Wochenansicht nicht künstlich schlecht aussieht (2 von 2 Tagen statt
  2 von 7). `gesamtVerfuegbar(startdatum)` prüft, ob das Protokoll wirklich
  schon länger als 31 Tage läuft.
- Kategorien ohne Eintrag im Erfolge-System (aktuell nur Bildschirmzeit —
  bewusst kein Teil davon, weil es ein Limit statt eines Mindestziels ist,
  siehe Kommentar in `errungenschaften.js`) werden für Woche/Monat/Gesamt
  wie eine inaktive Kategorie (grauer Balken) behandelt, statt mit einer
  irreführenden zweiten Erfolgs-Definition zu rechnen.
- `HomeView.jsx`: neue Pill-Reihe ("Tag"/"Woche"/"Monat"/ggf. "Gesamt")
  direkt über dem Balkendiagramm im "Tagesfortschritt"-Kasten, `useState`
  für die Auswahl, `aktivesHauptprotokoll` neu aus `useAppData()`
  destrukturiert. Die Orden-Vorschau (`TagesfortschrittOrden`) bleibt
  bewusst bei den unveränderten Tages-Widgets — die zeigt ohnehin
  Streak-Badges, keinen Zeitraum-Wert. Funktioniert im Coach-Verwalten-
  Modus automatisch mit, weil `HomeView.jsx` dieselbe Komponente für
  beide ist und `useAppData()` im Verwalten-Modus schon auf den
  verwalteten Account zeigt — keine Sonderbehandlung nötig.

Getestet: Build/Lint/Typecheck grün, 124 Unit-Tests grün (9 neu:
`zeitraumFortschritt.test.js` — Zeitraum-Zählung, Nenner-Deckelung bei
frischem Protokoll, Bildschirmzeit-Sonderfall, `gesamtVerfuegbar`-
Grenzfälle), 39 E2E-Tests grün (unverändert). Zusätzlich per Playwright
visuell durch alle vier Zeiträume auf der Home-Seite geklickt (Screenshot)
— Pills schalten korrekt um, "Gesamt" erscheint (Standard-Harness-
Protokoll läuft seit 01.01.2026).

Keine neue Migration nötig — reine Auswertung bereits vorhandener Daten.

---

## ✅ Update 16.09.2026 (Teil 115) — "Neues Protokoll" fragt jetzt "allein oder mit Aka", unterdrückt automatisches KI-Popup wirklich

**Nutzerinnen-Vorgabe:** beim Start eines neuen Protokolls über den
"+"-Button als Bestandsnutzerin sprang die KI trotzdem auf jeder Seite
automatisch auf, obwohl nie danach gefragt wurde. Gewünscht: "ich möchte
gefragt werden ... ob ich das laufende Protokoll abbrechen möchte, wie das
Protokoll heißen soll, ob ich nochmal Werte überarbeiten muss, ob ich es
alleine oder mit der KI machen möchte, das mit der KI vielleicht viel
früher von der Reihenfolge sinnvoller."

**Vorgefunden:** Drei der vier gewünschten Fragen existierten bereits —
Abbrechen-Bestätigung (`NeuesProtokollBestaetigenView.jsx`, Teil
103–105), Protokollname (`HauptprotokollErstellenView.jsx`), Werte-
Update (`OnboardingWerteAktualisierenView.jsx`). Es fehlte ausschließlich
die "allein oder mit KI"-Frage: bei `istDirekterNeuStart` (Einstieg über
den "+"-Button) übersprang `OnboardingFlow.jsx` die Phasen `quickwin`/
`intro` komplett, wo diese Frage beim allerersten Onboarding steckt
(`OnboardingIntroView.jsx`) — dadurch wurde sie nie gestellt.

**Root Cause des automatischen Popups:** `KiChat.jsx` prüft global
`getKiAktiv()` (`coachStorage.js`, localStorage, Standard AN) — nur wenn
das global ausgeschaltet ist, rendert KiChat überhaupt nicht. Es gab
bisher aber KEINEN Weg, diesen Schalter aus dem Onboarding heraus zu
setzen (auch nicht beim allerersten Onboarding — selbst dort setzt "Nein,
ich mach's selbst" in `OnboardingIntroView.jsx` nur, WIE der eigene
Name/Ziel/Profil erfasst wird, nicht ob KiChat auf späteren Seiten
erscheint). `saveKiAktiv()` wurde bisher ausschließlich vom Schalter unter
Mehr → "Assistent aktiv" aufgerufen.

**Umgesetzt:**
- Neue Datei `OnboardingKiWahlView.jsx`: einfacher Zwei-Wege-Screen ("Mit
  Aka" / "Alleine, ohne Aka"), Stil an `OnboardingWerteAktualisierenView.jsx`
  angelehnt. Ruft beim Antippen `saveKiAktiv(true|false)` auf — derselbe
  globale Schalter wie unter Mehr, damit es KEINE zweite,
  konkurrierende Ein-/Aus-Quelle für den Assistenten gibt.
- `OnboardingFlow.jsx`: neue Phase `kiWahl`, eingehängt direkt nach
  `hauptprotokoll` (Protokollname) und vor `ziele` — nur für
  `istDirekterNeuStart` erreichbar, der reguläre Erst-Onboarding-Ablauf
  bleibt unverändert (dort deckt weiterhin `OnboardingIntroView` die
  Namenseingabe ab, ohne dass etwas an dessen Verhalten geändert wurde —
  bewusst nicht mit angefasst, um den Umfang auf die "Neues Protokoll"-
  Vorgabe zu begrenzen).
- `e2e/onboarding.spec.js`: die beiden bestehenden "Neues Protokoll"-Tests
  um den neuen Zwischenschritt ergänzt (klicken "Mit Aka" durch, damit sich
  am Rest nichts ändert) + ein komplett neuer Test, der beweist, dass
  "Alleine, ohne Aka" das automatische KiChat-Modal auf Laborwerte UND dem
  ersten erreichten Kategorie-Schritt tatsächlich unterdrückt (Abwesenheit
  des "Schließen"-Buttons als Beleg für "kein offenes Modal").

Getestet: Build/Lint/Typecheck grün, 115 Unit-Tests grün (unverändert),
39 E2E-Tests grün (2 bestehende angepasst, 1 neuer Test). Zusätzlich per
Playwright visuell gegengeprüft (Screenshot des neuen "Wie soll's
laufen?"-Screens).

Keine neue Migration nötig — `saveKiAktiv()`/`localStorage` existierten
schon vollständig, nur ein neuer Aufrufort dafür.

---

## ✅ Update 16.09.2026 (Teil 114) — Einheitlicher nummerierter Stepper über Laborwerte, Morgen-/Abendroutine und die 8 Kategorie-Schritte

**Nutzerinnen-Vorgabe:** die "normalen" Onboarding-Seiten (Laborwerte,
Morgen-/Abendroutine) sahen bisher schlicht aus, dann sprang die Optik auf
einmal auf die 8 Kategorie-Schritte um, die oben einen nummerierten
"1 bis 8"-Fortschrittsbalken (`Stepper`-Komponente) zeigen — "das sieht
doch total blöd aus... designtechnisch auch blöd aus". Auf Nachfrage
(überall schlicht vs. überall Stepper) hat sich die Nutzerin für **überall
den nummerierten Stepper-Stil** entschieden. "Blutwerte, Morgen- und
Abendroutine ... gehören auch in die gleiche Reihenfolge" wie die
Kategorie-Schritte.

**Umgesetzt:** Laborwerte und Morgen-/Abendroutine (mit dem seit Teil 113
mit eingebauten Schlafplan) zählen jetzt als die ersten beiden Schritte
EINER durchgehenden, zehnteiligen Zählung statt zweier isolierter Seiten
vor den 8 Kategorie-Schritten:
- `categorySteps.js`: neue Konstanten `PROTOKOLL_SCHRITT_OFFSET` (= 2,
  Laborwerte + Routinen) und `PROTOKOLL_SCHRITTE_GESAMT` (=
  `CATEGORY_STEPS.length + PROTOKOLL_SCHRITT_OFFSET` = 10) — einzige
  Quelle für die Gesamtzahl, keine der drei Views zählt selbst.
- `OnboardingLaborwerteView.jsx`: `<Stepper step={0}
  total={PROTOKOLL_SCHRITTE_GESAMT} />` + Fortschrittstext "1 von 10"
  direkt unter der bestehenden Pfeil-Navigation ergänzt — exakt dieselbe
  Stepper-Komponente wie bei den Kategorie-Schritten, keine neue gebaut.
- `OnboardingRoutinenView.jsx`: dasselbe, `step={1}` → "2 von 10".
- `OnboardingCategoriesView.jsx`: Fortschrittstext und `<Stepper>` nutzen
  jetzt `index + PROTOKOLL_SCHRITT_OFFSET` statt `index` und
  `PROTOKOLL_SCHRITTE_GESAMT` statt `CATEGORY_STEPS.length` — die 8
  Kategorie-Schritte zählen dadurch automatisch als "3 von 10" bis
  "10 von 10" weiter, ohne dass sich an ihrer eigenen Logik (Reihenfolge,
  Gate-Seiten, Speichern) etwas ändert.
- Laborwerte/Routinen bekommen bewusst **keinen** eigenen "Alles
  überspringen"-Link (den gibt es nur bei den Kategorie-Schritten, weil
  dort mehrere gleichartige Schritte auf einmal übersprungen werden
  können) — nur den Fortschrittsbalken selbst, um die Optik zu vereinheitlichen,
  ohne die Navigationslogik der beiden Seiten zu verändern.

Getestet: Build/Lint/Typecheck grün, 115 Unit-Tests grün (unverändert),
38 E2E-Tests grün (keine Anpassung nötig — kein Test prüfte bisher den
genauen Zählertext). Zusätzlich per Playwright durch Laborwerte →
Routinen → ersten Kategorie-Schritt (Hydration) navigiert und den
durchgehenden Zähler "1 von 10" → "2 von 10" → "3 von 10" sowie den
wachsenden Fortschrittsbalken per Screenshot gegengeprüft.

Keine neue Migration nötig — rein visuelle/Navigations-Änderung.

---

## ✅ Update 16.09.2026 (Teil 113) — Schlafplan ist kein eigener Onboarding-Schritt mehr, sondern Teil der Morgen-/Abendroutine-Seite

**Nutzerinnen-Vorgabe:** "Eigentlich kannst du dann den Schlafplan mit
der Morgen- und Abendroutine gleich zusammentun, denn die hängen ja alle
unmittelbar miteinander zusammen. Also dann wäre auch eine Seite weniger
im Onboarding nötig." — der Schlafplan-Kategorie-Schritt (bisher der
erste der 8 `CATEGORY_STEPS`) verschwindet als eigene Seite; seine
Bettzeit/Aufwachzeit-Einrichtung läuft jetzt direkt unter der
Morgen-/Abendroutine-Seite (`OnboardingRoutinenView.jsx`, siehe Teil
112), eine Onboarding-Seite weniger.

**Umgesetzt:**
- `categorySteps.js`: `schlaf`-Eintrag aus `CATEGORY_STEPS` entfernt
  (Hydration ist jetzt der erste Kategorie-Schritt).
- `OnboardingCategoriesView.jsx`: alle Schlaf-spezifischen Teile entfernt
  — `SCHRITT_ZU_KATEGORIE`/`KATEGORIE_COACH_PROMPTS`/
  `KATEGORIE_EINLEITUNG`-Einträge, die Block-Helfer
  (`neuerSchlafblock`/`berechneSchlafstunden`/Wochentage-Zuweisung je
  Block), den `schlaf`-Zweig in `speichernUndWeiter()`/
  `onUebernehmenKategorie()`/`renderKategorieErgebnis()`, die komplette
  Render-JSX. **Bewusst stehen gelassen:** `ISTZUSTAND_FRAGEN.schlaf`
  (weiterhin exportiert, jetzt von `OnboardingRoutinenView.jsx`
  importiert) und `toggleInArray` (wird noch von Ernährung gebraucht).
- `aiService.js`: `schlafzielAusChat()` entfernt (war nur noch von der
  gelöschten Schlaf-Coach-Integration aufgerufen — totes Coach-Chat-
  Feature für Schlaf gibt es auf der neuen Seite bewusst nicht, passend
  zum Rest von `OnboardingRoutinenView.jsx`, das ebenfalls ohne KI-Chat
  auskommt).
- `OnboardingRoutinenView.jsx`: neue dritte Karte "😴 Schlafplan" nach
  der Abendroutine, vor "Weiter" — exakt dieselbe Bettzeit/Aufwachzeit-
  Block-Logik wie zuvor in `OnboardingCategoriesView.jsx` (Intervall
  "Täglich"/"Bestimmte Wochentage", mehrere Blöcke mit je eigenen
  Wochentagen fürs Wecker-Szenario, Ist-Zustand-Frage, Erinnerungszeiten
  über `<ZeitErinnerungenCard kategorie="schlaf">`), nur hierher
  verschoben statt neu erfunden. Der "Weiter"-Button speichert jetzt
  zusätzlich `categoryZiele.schlaf` + eine `teilprotokolle`-Zeile für
  `schlaf` (`teilprotokollSpeichern`), bevor er weiterschaltet — dieselbe
  Datenform wie vorher, weil `MehrTab.jsx` (Bausteine an/abschaltbar),
  `OnboardingCompletionView.jsx` (Abschluss-Screen-Detailanzeige) und
  `SchlafView.jsx` unverändert darauf angewiesen bleiben. Kein
  Zieldauer-Feld (`ZieldauerField`/"wie lange") übernommen — Routinen
  kennen dieses Konzept generell nicht, passt zum Rest der Seite.
- `OnboardingFlow.jsx`: `routinen`- und `categories`-Phasenübergänge von
  Ersetzen- auf Anhängen-Semantik umgestellt (`onDone`/`onFinished`
  bauen `eingerichteteBereiche` jetzt inkrementell auf, statt es jedes
  Mal zu überschreiben) — sonst wäre der von der Routinen-Seite
  gemeldete Schlaf-Bereich beim Weiterschalten in die Kategorien sofort
  wieder verloren gegangen. Gegen Duplikate abgesichert (nach Schlüssel
  gefiltert), falls jemand über "Zurück" mehrfach durch Routinen/
  Kategorien läuft.
- `e2e/onboarding.spec.js`: beide betroffenen Tests angepasst — der
  komplette Durchlauf schließt jetzt vor "Alles überspringen" das
  KiChat-Modal von Hydration (jetzt erster Kategorie-Schritt statt
  Schlaf, das anders als Schlaf keine Gate-Seite hat) und prüft
  zusätzlich, dass "😴 Schlafplan" auf der Routinen-Seite sichtbar ist;
  der Bildschirmzeit-Test überspringt Schlaf nicht mehr als eigenen
  Schritt.

Getestet: Build/Lint/Typecheck grün, 115 Unit-Tests grün (unverändert —
kein neuer Unit-Test nötig, da keine neue eigenständige Komponente
entstanden ist, sondern bestehende Logik verschoben wurde), 38 E2E-Tests
grün (2 Tests angepasst, siehe oben). Zusätzlich per Playwright durch den
echten Onboarding-Flow bis zur Routinen-Seite navigiert und die neue
Schlafplan-Karte visuell gegengeprüft (Screenshot) — fügt sich sauber
zwischen Abendroutine und "Weiter" ein, gleiche Kartenoptik wie
Morgen-/Abendroutine.

**Keine neue Migration nötig** — `categoryZiele.schlaf` und die
`teilprotokolle`-Zeile für `schlaf` liefen schon vorher über bestehende
Tabellen/Funktionen, nur der Einrichtungsort im Onboarding hat sich
geändert.

**Zwei damit zusammenhängende, von der Nutzerin selbst angesprochene
Punkte sind bewusst NICHT mit umgesetzt** (siehe die beiden Bullet-Punkte
oben in der STAND-Box) — beide brauchen erst ihre Design-Entscheidung:
die visuelle Uneinheitlichkeit zwischen den "normalen" Onboarding-Seiten
und den nummerierten Kategorie-Schritten, und die fehlende
"allein/mit KI"-Nachfrage beim Start eines neuen Protokolls als
Bestandsnutzerin.

---

## ✅ Update 16.09.2026 (Teil 112) — Morgen-/Abendroutine: Weckzeit, Vorab-Erinnerung, größer lesbare Schritte-Liste

**Nutzerinnen-Vorgabe** (zum Onboarding-Schritt "Morgen- & Abendroutine",
mit Screenshot): drei Dinge.

1. Die bereits angelegten Schritte sollen nicht mehr klein, ganz oben im
   Editor stehen ("kleine Listenform oberhalb"), sondern in einem
   eigenen, separaten Fenster unter dem jeweiligen Bereich, in klar
   lesbaren, ausreichend großen Druckbuchstaben.
2. Der Morgenroutine soll man gleich die Weckzeit hinzufügen können —
   die Routine schließt direkt ans Aufwachen an.
3. Der Abendroutine soll man sowohl eine Start-Uhrzeit als auch einen
   Vorlauf ("Hey, es ist Viertel vor neun...") für eine Vorab-Erinnerung
   geben können.

**Vorgefunden:** Die komplette Infrastruktur dafür existierte bereits —
nur nicht im Onboarding. `routine_einstellungen` (Start-/Endzeit je
Routine, `routineZeitrahmenSetzen()` in `useRoutinen.js`) und die
generische `<KategorieErinnerung>`-Komponente (Ja/Nein + Vorlauf-Minuten,
liest/schreibt `erinnerungen[kategorie]`) waren schon lange im
"Routinen"-Tab (`RoutineTabView.jsx`) verbaut — sogar die Erinnerungs-
Edge-Function (`send-due-reminders`) unterstützte "morgenroutine"/
"abendroutine" inkl. Vorlauf bereits vollständig. Reine Portierung ins
Onboarding, keine neue Migration nötig.

**Umgesetzt:**
- `OnboardingRoutinenView.jsx`: `TimeWheelField` für die Weckzeit
  (Morgenroutine) bzw. den Beginn (Abendroutine) + `<KategorieErinnerung
  kategorie="abendroutine">` für den Vorlauf-Hinweis.
- Neue Komponente `RoutineSchritteListe.jsx`: eigene, größere (16px statt
  13px) Anzeige der Schritte samt errechneter Uhrzeit je Schritt
  (`routineSchrittZeit()`, dieselbe Herleitung wie in
  `RoutineHeuteChecklist.jsx`) — inkl. Auf/Ab/Löschen. Aus
  `RoutineSchritteEditor.jsx` herausgelöst (die zeigte die Liste bisher
  klein und ganz oben, noch vor den Eingabefeldern) und jetzt als
  eigene Karte UNTER der jeweiligen Eingabe-Karte platziert — betrifft
  automatisch alle vier Einsatzorte (Onboarding, `RoutineTabView.jsx`,
  `GewohnheitenView.jsx`, `TagesplanView.jsx`-Bearbeiten-Modus), nicht
  nur das Onboarding.
- **Bug in der Test-Harness gefunden und behoben** (beim visuellen
  Gegenprüfen mit echten Test-Schritten, nicht nur Code-Lektüre):
  `routineSchrittZeit` ist eine synchrone ABFRAGE-Funktion (liefert
  direkt einen String), passte aber zu keinem Muster der generischen
  Mock-Heuristik in `e2e/harness/mockAppData.js` — die hätte ein Promise
  statt eines Strings geliefert, Absturz beim Rendern. War vorher nie
  aufgefallen, weil kein Test `routineSchritte` je mit echten Einträgen
  füllte; betraf latent auch das längst bestehende
  `RoutineHeuteChecklist.jsx`. Jetzt als expliziter Sonderfall
  `() => ""` gemockt.

Getestet: Build/Lint/Typecheck grün, 115 Unit-Tests (5 neu:
`RoutineSchritteListe.test.jsx`), 38 E2E-Tests grün — zusätzlich per
Playwright durch den echten Onboarding-Flow bis zu diesem Schritt
navigiert und mit eingesetzten Test-Schritten visuell gegengeprüft
(Screenshot), nicht nur die leere Ansicht.

---

## ✅ Update 16.09.2026 (Teil 111) — Bug-Fix: KI ploppte bei den Laborwerten automatisch auf

**Nutzerinnen-Report:** "bei den Laborwerten ploppt immer automatisch die
KI auf und fragt nach den Laborwerten — das soll nicht automatisch
passieren, ich hab sogar extra 'ich möchte selbst ausführen' angeklickt,
trotzdem passiert es, das ist schon seit Wochen so."

**Ursache gefunden:** `OnboardingLaborwerteView.jsx` rendert seinen
`<KiChat>` mit der Prop `autoStart` — anders als bei den Onboarding-
Kategorie-Schritten (Schlaf, Training, …), wo `autoStart` bewusst erst
NACH einem expliziten Klick auf "Jetzt einrichten" gesetzt wird
(`effectiveModus === "jetzt"`, siehe OnboardingCategoriesView.jsx),
stand es hier fest im Code — unabhängig von jeder Wahl der Nutzerin.
`autoStart` öffnet den Chat nicht nur sichtbar, sondern spricht laut
Kommentar in KiChat.jsx auch sofort die Begrüßung vor und startet
danach automatisch das Mikrofon — dadurch wirkt es besonders aufdring­
lich. Der globale "Assistent aktiv/ausgeschaltet"-Schalter (Mehr →
Einstellungen) hätte das zwar theoretisch komplett unterdrücken können,
aber offenbar unabhängig davon: das Laborwerte-Fenster hatte schlicht
keinerlei Gate, es öffnete sich bei JEDEM Betreten des Schritts.

**Fix:** `autoStart` von `OnboardingLaborwerteView.jsx` entfernt. Der
Coach-Chat verhält sich dort jetzt wie überall sonst in der App: ein
antippbarer, schwebender Orb unten am Bildschirmrand — öffnet sich nur
noch, wenn die Nutzerin aktiv draufklickt. Die manuelle Eingabe über
`LaborwerteCard` (inkl. Foto-Upload) bleibt unverändert die Standard-
Ansicht auf diesem Schritt. Kein anderer Onboarding-Schritt war
betroffen (Kategorie-Schritte korrekt hinter "Jetzt einrichten" gegated,
"Routinen"-Schritt hat aktuell gar kein KiChat).

Getestet: Build/Lint/Typecheck/Unit-Tests grün, `e2e/onboarding.spec.js`
(der Haupt-Onboarding-Durchlauf, der bisher das Laborwerte-Modal defensiv
schloss, falls es offen war) bleibt grün — der Check ist weiterhin
vorhanden, greift jetzt aber einfach nie mehr.

---

## ✅ Update 16.09.2026 (Teil 110) — Neues Feature: "Denkpause" (freiwillige Mini-Denksportaufgaben) + Punkte-/Erfolge-Integration

**Vorgeschichte:** Im Rahmen der Themenfarben-/Tagesplan-Farbkacheln-
Diskussion (siehe Mockups) kam die Idee auf, kurze, freiwillige
Denksportaufgaben als ADHS-gerechte "Anlasser" vor Handlungen anzubieten
(z. B. statt aufs Handy zu scrollen). Nutzerinnen-Vorgabe: volle
Zustimmung zum Konzept aus dem Denkpausen-Mockup, dazu zwei
Erweiterungen — (1) je 100 Aufgaben in mehreren Bereichen für
Abwechslung, (2) Denkpausen sollen ins bestehende Punktesystem
einzahlen UND unter "Erfolge" pro Kategorie gezählt werden (gelöst/nicht
gelöst).

**Content (400 Aufgaben, alle strukturell + stichprobenartig geprüft):**
- `src/data/denkpausenMathe.js` — 100 Kopfrechen-/Logik-Aufgaben,
  deterministisch per Skript generiert (Addition, Subtraktion,
  Multiplikation, Division, Prozent, Zahlenreihen, Textaufgaben) — jede
  Antwort programmatisch auf Korrektheit geprüft, nicht nur von einem
  Modell behauptet.
- `src/data/denkpausenWortspiele.js`, `denkpausenRaetsel.js`,
  `denkpausenWissen.js` — je 100 Aufgaben, parallel von drei Subagenten
  erstellt, danach JEWEILS unabhängig nachgeprüft (Schema, Duplikate,
  Antwortverteilung) statt dem Eigenbericht der Agenten blind zu
  vertrauen. Rätsel hatte eine schiefe Antwortverteilung (9/28/41/22) —
  per Nachbearbeitungs-Skript auf 25/25/25/25 korrigiert, Inhalte
  unverändert.

**Neue Bausteine:**
- `src/ui/DenkpauseNudge.jsx`: zwei feste Regeln hart im Code verankert
  (nicht nur Doku) — "Nee, weiter" ist in JEDER Phase erreichbar (nie
  eine Sackgasse), und nach einer Antwort gibt es in diesem Moment kein
  sichtbares "falsch", nur die richtige Antwort kurz hervorgehoben.
- Eingebaut in `BildschirmzeitView.jsx` (Nudge nahe am Tageslimit, ≤15
  Min. übrig) und `TagesplanView.jsx` (Übergangs-Moment vor der
  Abendroutine-Sektion, nur "heute", nur solange etwas offen ist).
  Wecker-Ausschalten bewusst NICHT gebaut — siehe "Geplant, sobald native
  App verfügbar" oben, technisch aus der Web-App heraus nicht möglich.
- **Migration `0087_denkpause.sql`** (🔴 noch nicht deployt, siehe oben):
  Tabelle `denkpause_ergebnisse` (user_id, kategorie, richtig,
  erstellt_am) — jeder Versuch wird geloggt, nicht nur richtige.
- `src/data/useDenkpauseData.js` + Registrierung in
  `TrackingDataContext.jsx` (gleiches Muster wie `useAtemuebungenData.js`)
  und `useKompletterReset.js`.
- **Punkte-Integration:** neue Kategorie "Denkpause" in
  `utils/errungenschaften.js` — nur RICHTIG beantwortete Denkpausen
  zählen als Punkt (1 Punkt pro erledigtem Eintrag, dieselbe "Währung"
  wie jeder andere Lebensbereich), damit sich das wie echtes
  Punkte-verdienen anfühlt statt wie reine Teilnahme.
- **Erfolge-Ansicht** (`ErfolgeTab.jsx`, unter Archiv → Erfolge, dort wo
  auch die Abzeichen/Trophäen sind): neuer Block "Denkpausen" zeigt pro
  Kategorie (Mathe/Wortspiele/Rätsel/Allgemeinwissen), wie viele Aufgaben
  gelöst UND wie viele nicht gelöst wurden — bewusst nur Zähler, keine
  Liste einzelner Fragen.
- Neuer `puzzle`-Icon-Versuch in `Icon.jsx` wurde verworfen (händisch
  gezeichneter SVG-Pfad sah beim Rendern wie ein wirres Knäuel aus, nicht
  wie ein Puzzleteil) — stattdessen das bestehende `book`-Icon
  wiederverwendet. Lehre: neue Linien-Icons immer erst isoliert rendern
  und ansehen, bevor sie eingebaut werden.

Getestet: Build/Lint/Typecheck grün, 110 Unit-Tests (10 neu:
`denkpausen.test.js` + `DenkpauseNudge.test.jsx`), 38 E2E-Tests grün.

---

## ✅ Update 15.09.2026 (Teil 109) — Nachkontrolle: Bug-Review aller Änderungen seit Teil 101 (Commits `b3aae48`..`145dbf5`)

Auf Wunsch der Nutzerin ("ich habe jetzt keine Zeit, das nachzuschauen")
wurden **alle** Code-Änderungen dieser Sitzung seit dem letzten
Nachkontroll-Checkpoint (Teil 101, Commit `bc6f979`) noch einmal
durchgesehen — Diktierfunktion, "Neues Protokoll"-Fix + Bestätigungs-
Nachfrage, PDF-Zentrierung, Bildschirmzeit-Feature + dessen Onboarding-
Integration. Umfang: 7 Code-Commits, 30 geänderte Dateien,
1382 Zeilen hinzugefügt / 55 entfernt.

**Vorgehen — zwei Ebenen, wie bei Teil 101:**

1. **Manuelle Lektüre:** jede substanzielle Datei komplett gelesen und
   die Logik von Hand nachvollzogen, mit besonderem Fokus auf die
   riskantesten Stellen:
   - `OnboardingFlow.jsx`: die komplette Phasen-State-Machine für alle
     Pfade durchgespielt (normales Erst-Onboarding, direkter Neustart
     über "+", Ja/Nein-Abzweigung bei "Werte aktualisieren?").
   - `NeuesProtokollBestaetigenView.jsx`: Async-/Effect-Timing geprüft
     (Ref-Guard gegen Endlosschleife, Verhalten nach Unmount).
   - `BildschirmzeitView.jsx`: Zusammenspiel der invertierten
     Limit-Logik (mehr = schlechter, anders als bei allen anderen
     Kategorien) mit den gemeinsam genutzten Bauteilen `ProgressRing`,
     `TagesfortschrittBalken` und den Erfolgs-Orden geprüft.
   - `OnboardingCategoriesView.jsx`: alle ~10 verstreuten Stellen, an
     denen "bildschirmzeit" als Kategorie-Schlüssel eingetragen wurde,
     gegeneinander abgeglichen (keine Tippfehler, keine vergessene
     Stelle).
   - `primitives.jsx`: die neue `diktierbar`-Prop auf Einhaltung der
     React-Hook-Regeln geprüft (Hook wird immer aufgerufen, nur die
     Wirkung wird bedingt).
   - Alle kleinen Registrierungs-Dateien (`constants.js`, `dayItems.js`,
     `Icon.jsx`, `categorySteps.js`, `MehrTab.jsx`, `PlaeneView.jsx`,
     `TrackingDataContext.jsx`, `useKompletterReset.js`) gegeneinander
     abgeglichen.

   **Ergebnis der Lektüre:** keine neuen Bugs gefunden. Eine
   vorbestehende (nicht neu eingeführte) architektonische Unschönheit
   wurde identifiziert: Das Archivieren eines alten Peptid-Protokolls
   (im "Ja"-Pfad von `NeuesProtokollBestaetigenView`) läuft nicht
   atomar mit dem späteren Archivieren des Hauptprotokolls in
   `HauptprotokollErstellenView` zusammen. Das gab es aber schon vor
   der heutigen Änderung — die neue Bestätigungs-Nachfrage macht die
   Lage strikt besser (Nutzerin sieht jetzt vorher, was passiert),
   nicht schlechter. Eine vollständige Lösung wäre ein größerer,
   eigenständiger Umbau und war nicht Teil der heutigen Aufgabe.

2. **Empirische Gegenprobe** (nach der Lektüre, zur Bestätigung):
   - `npm run build` → ✅ erfolgreich (`✓ built in 813ms`).
   - `npx oxlint src/ e2e/ supabase/` → ✅ sauber (keine neuen Warnungen
     außer der bekannten, harmlosen `only-export-components`-Meldung).
   - `npm run typecheck` → ✅ keine Fehler.
   - `npm test` → ✅ **100 von 100** Unit-Tests grün.
   - `npx playwright test` → ✅ **38 von 38** E2E-Tests grün (inkl. der
     drei neuen Tests für Bestätigungs-Nachfrage, Diktierfunktion und
     Bildschirmzeit-Onboarding-Fragen).

**Fazit:** Anders als bei Teil 101 (dort wurden zwei echte Bugs gefunden
und behoben) hat diese Nachkontrolle **keine neuen Fehler** ergeben —
weder in der Handlektüre noch in den automatisierten Prüfungen. Alle
Änderungen seit Teil 102 gelten als geprüft und stabil.

---

## ✅ Update 15.09.2026 (Teil 108) — Nachtrag zu Teil 107: Bildschirmzeit als eigener Kategorie-Schritt im Erst-Onboarding (Commit `6f96338`)

Direkte Nutzerinnen-Rückfrage auf Teil 107: die neue Kategorie war zwar
überall sonst integriert (Home, Pläne-Reiter, "Mehr" → Aktuelles
Protokoll), fehlte aber im geführten Erst-Onboarding
(`OnboardingCategoriesView.jsx`) — dort bewusst ausgelassen (siehe Teil
107, "bewusst NICHT angebunden"). Die Nutzerin wollte das ausdrücklich
drin haben, mit vier konkreten Reflexionsfragen: "Wie viel
Bildschirmzeit hast du üblicherweise? Wie viel willst du in Zukunft
haben? Was machst du am meisten am Telefon? Kannst du dir vorstellen,
es zu reduzieren?"

**Umgesetzt** nach exakt demselben Muster wie die 8 bestehenden
Kategorien in diesem (großen, aber jetzt doch angefassten) Screen:
neuer Schritt direkt nach Tageslicht in `categorySteps.js`, drei
Reflexionsfragen in `ISTZUSTAND_FRAGEN.bildschirmzeit` (üblicher
Verbrauch/Haupttätigkeit/Reduzieren-Vorstellung), das Zahlenfeld selbst
beantwortet "wie viel künftig" (als Obergrenze, nicht Mindestwert,
konsistent mit Teil 107).

**Wichtige Erkenntnis beim Umsetzen, die die ursprüngliche
Scope-Entscheidung aus Teil 107 revidierte:** `KiChat` mit `autoStart`
rendert in diesem Screen für JEDE Kategorie automatisch einen
Coach-Chat — das ist kein Opt-in pro Kategorie, sondern fest in der
Architektur verankert. Ohne eigene Anbindung wäre der Chat für
Bildschirmzeit zwar nicht abgestürzt, aber bei jedem Versuch mit dem
festen Fehlertext "Für diesen Bereich gibt es noch keine
Assistenten-Begleitung" gescheitert — spürbar kaputt gewirkt. Deshalb
zusätzlich `AIService.bildschirmzeitAusChat()` (`aiService.js`, analog
zu `tageslichtAusChat`/`hydrationAusChat`) sowie die passenden
`KATEGORIE_COACH_PROMPTS`/`KATEGORIE_EINLEITUNG`/
`onUebernehmenKategorie`-Einträge ergänzt. Das ist NICHT dasselbe wie
die KiChat-Anbindung, die für `BildschirmzeitView.jsx` selbst (die
laufende Nutzung unter "Pläne") bewusst weiterhin fehlt — dort gibt es
diesen Architektur-Zwang nicht, ein eigenes KI-Gespräch nur fürs
Nachjustieren eines einzelnen Zahlenfelds bleibt dort unverhältnismäßig.

Neuer E2E-Test führt einmal komplett durch Schlaf/Hydration/Tageslicht
bis zu Bildschirmzeit (dabei die zwei unterschiedlichen Skip-Wege
demonstriert — Schlaf/Tageslicht haben eine Gate-Seite, Hydration
startet direkt im KiChat-Modal), bestätigt alle drei Reflexionsfragen
und das Limit-Feld sichtbar sind, speichert, und bestätigt den
nahtlosen Übergang zu Ernährung danach. Build, Lint, Typecheck, 100
Unit- und 38 E2E-Tests grün.

---

## ✅ Update 15.09.2026 (Teil 107) — Neue Kategorie: Bildschirmzeit-Tracking, manuell (Commit `68f4973`)

Nutzerinnen-Vorgabe: neues Tracking-Feld für die Zeit am Telefon, v. a.
Freizeit-Scrollen. Ursprünglicher Wunsch war, das evtl. direkt mit der
telefoneigenen Bildschirmzeit-Erfassung zu verbinden — dazu vorab
ehrlich geklärt: **automatisches Auslesen ist aus einer Browser-/PWA-App
heraus technisch nicht möglich**, weder iOS noch Android geben Web-Apps
Zugriff auf ihre Screen-Time-/Digital-Wellbeing-Daten. Das ist eine
harte Plattformgrenze, keine Umsetzungsfrage — gilt für jede Web-App,
nicht nur für AKA. Deshalb wie jede andere Kategorie rein manuelles
Eintragen.

**✅ Migration `supabase/migrations/0086_bildschirmzeit.sql`** (zwei neue
Tabellen `bildschirmzeit_logs`/`bildschirmzeit_settings`, exakt nach
demselben Muster wie `0033_tageslicht.sql`) — von der Nutzerin am
15.09. abends bestätigt im echten Supabase-Projekt ausgeführt. Kein
offener Deploy-Punkt mehr.

**Umsetzung:** gleicher Aufbau wie Tageslicht (ein Log-Eintrag pro Tag
in Minuten + ein Tagesziel als eigene Einstellung), aber mit einem
wichtigen inhaltlichen Unterschied: das Ziel ist hier eine OBERGRENZE
(man will darunter bleiben), kein Mindestwert zum Erreichen wie bei
Hydration/Tageslicht — Motivationstext, Ringfarbe (Warnfarbe bei
Überschreitung) und Beschriftungen ("Limit" statt "Ziel") entsprechend
angepasst. Bewusst OHNE die KiChat-gestützte Zielfindung, die
Tageslicht/Hydration haben — ein eigenes KI-Gespräch nur für ein
einzelnes manuelles Feld wäre unverhältnismäßig gewesen.

Vollständig als eigene Kategorie eingebunden: Datenhook
(`useBildschirmzeitData.js`), eigene View, Pläne-Reiter, Home-Mini-
Widget, An-/Ausschalten unter "Mehr" → "Aktuelles Protokoll" (läuft
OHNE Onboarding-Assistenten-Schritt — `teilprotokollSpeichern` legt die
Zeile bei Bedarf selbst an, siehe Code-Kommentar in
`OnboardingWerteAktualisierenView`-Nachbarschaft), eigene Farbe/Icon
("smartphone"), Erinnerungszeiten, Reset-Fähigkeit unter "Gefahrenzone".

**Bewusst NICHT angebunden** (Scope-Entscheidung, alle drei über "Mehr"
jederzeit nachträglich erreichbar, keine Voraussetzung für volle
Funktionsfähigkeit): Erfolge-/Orden-System, KiChat/AIService-gestützte
Zieleinrichtung, Erst-Onboarding-Assistent
(`OnboardingCategoriesView.jsx` — riesige, fragile Datei, bewusst nicht
angefasst; Aktivierung funktioniert nachweislich auch ohne diesen
Schritt über den Bausteine-Schalter).

Nebenbei gefundener und behobener Bug im E2E-Test-Harness
(`mockAppData.js`): Feldnamen, die auf "...Minuten" enden (betraf schon
`tageslichtZielMinuten`/`tageslichtHeuteMinuten`, jetzt auch die neuen
Bildschirmzeit-Felder), trafen keines der Zahlen-Erkennungsmuster und
fielen fälschlich auf einen leeren Array-Fallback statt auf `0` —
betraf nur die Test-Oberfläche, nicht die echte App/Datenbank, jetzt
korrigiert.

Build, Lint, Typecheck, 100 Unit- und 37 E2E-Tests grün. Zusätzlich
manuell im Browser durchgeklickt (Tab-Wechsel, Ring/Motivationstext,
Schnell-Hinzufügen, Tageslimit-Feld, Erinnerung, Verlauf) — Screenshots
geprüft, sieht konsistent zu den übrigen Kategorien aus.

---

## ✅ Update 15.09.2026 (Teil 106) — PDF-Export: einheitlicher Seitenrand + Zentrierung für alle PDFs (Commit `3f65fb7`)

Nutzerinnen-Vorgabe: "die PDFs werden nicht sauber erstellt, die sind
nicht gut zentriert ... jede mögliche PDF überprüfen ... die
Voreinstellungen so gestellt." Alle drei bestehenden PDF-Exporte
(Tagebuch-Seiten, Coaching-Vorlagen, Wochenübersicht) teilen sich
denselben zentralen `exportElementAsPdf()` in `utils/pdfExport.js` —
ein einziger Fix dort behebt alle drei gleichzeitig.

**Ursache:** Das erfasste Bild füllte randlos die komplette A4-
Seitenbreite und wurde immer oben an der Seite angeheftet (`y=0`). Bei
kurzem Inhalt (der häufigste Fall: eine einzelne Tagebuchseite, ein
einzelnes ausgefülltes Formular) blieb dadurch unten sehr viel Weißraum
übrig, während der Inhalt oben "klebte" — genau das, was als "nicht gut
zentriert" auffiel.

**Fix:** 15mm Seitenrand rundum (Druck-/Word-Standard). Passt der
Inhalt auf eine Seite, wird er zusätzlich vertikal mittig platziert.
Zu langer Inhalt blättert wie vorher seitenweise weiter, jetzt mit
demselben Rand links/rechts auf jeder Seite (kein Rand oben/unten
zwischen den Seiten — würde sonst benachbarte Seiteninhalte sichtbar
in die Randzone bluten lassen, siehe Code-Kommentar).

**Empirisch validiert, nicht nur am Code abgelesen** (Vorgabe aus
Abschnitt 11 dieses Dokuments): über einen echten, im Browser
(Playwright) erzeugten Tagebuch- UND Wochenübersicht-Export per
`pdfplumber` (Python) nachgemessen — exakt gleiche Ränder
links=rechts und oben=unten bestätigt (z. B. 42.5pt/42.5pt links/
rechts, 337.7pt/337.7pt oben/unten bei der kurzen Tagebuchseite).
Zusätzlich dauerhaft als Unit-Test abgesichert (`pdfExport.test.js`,
jsPDF/html2canvas gemockt): Einzelseiten-Fall (mittig, x=15) und
Mehrseiten-Fall (gleicher linker Rand auf jeder Seite). Build, Lint,
Typecheck, 100 Unit- und 36 E2E-Tests grün.

---

## ✅ Update 15.09.2026 (Teil 105) — "Neues Protokoll": Bestätigungs-Nachfrage statt blindem Archivieren + zwei bestehende Features gegengeprüft (Commit `6a7c9e2`)

Drei Nutzerinnen-Anliegen in einer Nachricht, zwei davon bereits erledigt
(nur gegengeprüft, nichts gebaut), eines neu umgesetzt:

**1. Fortschrittsfotos (Körperteile fokussieren) — bereits vorhanden,
nichts gebaut.** Existiert in `WoechentlicheCheckinsCard.jsx` (geteilt
zwischen ProfilTab unter "Mehr" und dem Onboarding-Schritt "Profil &
Ausgangslage"): Foto-Upload mit Kategorien `FOTO_KATEGORIEN` (Taille,
Arme, Ganzkörper, Gesicht, Haare, Haut, `constants.js`), verknüpft mit
jedem Gewichts-/Messwert-Eintrag, Anzeige über `SignedPhoto`. Der
Nutzerin mitgeteilt, wo sie das findet — keine Code-Änderung nötig.

**2. Bereiche nachträglich aktivieren/deaktivieren + Inhalte
nachbearbeiten — ebenfalls bereits vorhanden.** "Mehr" → "Aktuelles
Protokoll" (`AktuellesProtokoll` in `MehrTab.jsx`) zeigt alle 9
Bausteine (Schlaf/Hydration/Tageslicht/Ernährung/Training/Gewohnheiten/
Supplemente/Medikamente/Atemübungen) mit An-/Aus-Umschalter, unabhängig
vom Onboarding-Assistenten — genau der "aktivieren/nicht aktivieren"-
Knopf pro Bereich, den die Nutzerin sich wünschte. Bearbeiten der
Inhalte selbst passiert weiterhin direkt im jeweiligen Reiter unter
"Alle Pläne". Der Nutzerin mitgeteilt, wo sie das findet.

**3. Archivieren beim "Neues Protokoll"-Knopf lief bisher blind —
NEU behoben.** Wörtliche Vorgabe: "möchte ich erstmal gefragt werden,
möchtest du das archivieren ... und ich möchte auch darüber informiert
werden, auf welchem Stand das alte Protokoll ist ... das soll nicht
einfach blind passieren." Bisher archivierte `neuesProtokoll()`
(`AuthenticatedApp.jsx`) das laufende Peptid-Protokoll sofort beim
Klick auf den "+"-Button, ohne jede Rückfrage.

Neuer Zwischenschritt: `NeuesProtokollBestaetigenView.jsx` (neuer
`view`-Zustand `"neuesProtokollBestaetigen"`, hängt sich automatisch
ins bestehende generische Hash-Routing ein, kein Update an
`utils/routing.ts` nötig) zeigt Name, "seit [Datum] · Woche X" und die
Anzahl aktiver Bereiche des aktuellen Hauptprotokolls (aus
`aktivesHauptprotokoll`/`teilprotokolle`, keine neue Datenbankabfrage)
und verlangt ein explizites "Ja, archivieren und neu beginnen" oder
"Abbrechen, beim aktuellen Protokoll bleiben". Erst nach "Ja" läuft die
bisherige `neuesProtokoll()`-Logik. Kein aktives Hauptprotokoll
(Edge-Case) → der Screen übersteht sich selbst automatisch, ohne leere
Nachfrage.

`e2e/harness/mockAppData.js` musste dafür `aktivesHauptprotokoll`/
`teilprotokolle` erstmals mocken (vorher generischer `null`/`[]`-
Fallback) — bewusst NUR für den normalen "schon eingerichtetes Konto"-
Harness-Zustand, nicht für `?onboarding=1` (frischer Account hat noch
kein aktives Hauptprotokoll; ohne diese Unterscheidung hätte
`HauptprotokollErstellenView` im echten Erst-Onboarding-Test fälschlich
"Weiter mit diesem Protokoll" angeboten statt des leeren Namensfelds —
beim ersten Durchlauf dieser Änderung tatsächlich aufgetreten und
gefixt, bevor gepusht wurde).

**Tests:** neuer E2E-Test für den Bestätigungs-Screen (zeigt
Protokoll-Stand korrekt, "Abbrechen" bleibt nachweislich auf Home ohne
zu archivieren), bestehende "Neues Protokoll"-Tests aus Teil 103/104 um
den zusätzlichen Bestätigungsschritt ergänzt. Build, Lint, Typecheck,
98 Unit- und 36 E2E-Tests grün.

---

## ✅ Update 15.09.2026 (Teil 104) — Nachtrag zu Teil 103: "Ziel & Grund" bleibt bei "Neues Protokoll" Pflicht-Schritt (Commit `37b07c5`)

Direkte Nutzerinnen-Rückmeldung auf Teil 103: ein Ziel (oder ausdrücklich
keins — "Alltagsprotokoll" ohne konkretes Ziel ist eine gültige, bewusste
Wahl) gehört zu jedem neuen Protokoll dazu und darf deshalb NICHT hinter
dem optionalen Ja/Nein-Gate verschwinden, anders als Profildaten
(Geschlecht/Geburtsdatum/Größe/Gewicht) — die beschreiben die Person
selbst, nicht das einzelne Protokoll, und dürfen deshalb optional/
vorausgefüllt bleiben. Ausdrückliche Zusatz-Vorgabe: wenn "Ziel & Grund"
für ein neues Protokoll erscheint, MUSS die Checkbox-Liste leer sein,
nicht mit den alten Zielen vorausgefüllt.

**Umgesetzt:** `OnboardingFlow.jsx` zeigt bei "Neues Protokoll"
(`istDirekterNeuStart`) jetzt IMMER "Ziel & Grund" direkt nach
Protokollname/Datum, bevor der Ja/Nein-Screen (jetzt nur noch für
Profildaten zuständig, Text entsprechend angepasst: "Fast geschafft"
statt "Neues Protokoll") überhaupt erscheint. Die geforderte Leer-
Garantie war bei genauerem Hinsehen bereits durch bestehenden,
unveränderten Code erfüllt (nicht neu gebaut, nur verifiziert): der
"+"-Button ruft in `AuthenticatedApp.jsx` VOR dem Öffnen des
Onboarding-Formulars `protokollArchivieren()` auf
(`useProtocolData.js`) — das archiviert das bisherige aktive
Peptid-Protokoll (dort liegt `ziele`, historisch aus dem separaten
Peptid-Assistenten) und legt sofort ein neues mit `ziele: []` an, bevor
der Ziele-Bildschirm überhaupt erreichbar ist.

Beide E2E-Tests aus Teil 103 entsprechend angepasst (Ziel & Grund jetzt
immer sichtbar vor dem Gate, Ja-Pfad führt zu Profil statt zu Ziele).
Build, Lint, Typecheck, 98 Unit- und 35 E2E-Tests grün.

**Offen/im Raum stehen gelassen, NICHT umgesetzt** (Nutzerin dachte im
selben Atemzug laut weiter, aber ohne konkreten Auftrag): Fortschritts-
fotos vom eigenen Körper hinzufügen und bestimmte Körperteile "in den
Fokus setzen" können. Klar als vage Idee erkennbar (Satz bricht mit
"...oder so, aber ja." ab), absichtlich NICHT gebaut — bei Bedarf beim
nächsten Mal konkret nachfragen, was genau gewünscht ist (eigener
Bereich? Teil des Profils? Vorher-Nachher-Vergleich?), bevor irgendwas
entsteht.

---

## ✅ Update 15.09.2026 (Teil 103) — Bug-Fix: "Neues Protokoll" verlangte bei bestehendem Konto das komplette Erst-Onboarding erneut (Commit `8c3ef12`)

Nutzerinnen-Bug-Report: der "+"-Button ("Neues Protokoll", `startPhase=
"hauptprotokoll"`) führte bisher exakt denselben Fragebogen wie beim
allerersten Onboarding durch — inklusive erneuter Namensabfrage,
Quick-Win-Feier ("Erster Schritt geschafft!") und Ziel-/Profildaten
(Geschlecht/Geburtsdatum/Größe/Gewicht). Bei einem bereits bestehenden,
eingerichteten Konto ist das unnötig und ermüdend — die Person ist
schon bekannt, nur das neue Protokoll selbst (Name+Datum) ist neu.

**Neuer Ablauf beim "+"-Button:** Hauptprotokoll-Name/Datum → neuer
Ja/Nein-Zwischenschirm (`OnboardingWerteAktualisierenView.jsx`) → "Nein"
(Standardfall, Haupt-Button) springt direkt zu den inhaltlichen
Protokoll-Schritten (Laborwerte bzw. Steckbrief), "Ja, kurz
aktualisieren" führt noch durch Ziel & Grund und Profil — beide
vorausgefüllt mit den bestehenden gespeicherten Werten, nichts geht
verloren. Die Phasen "quickwin" und "intro" (Namensabfrage) werden beim
"+"-Button jetzt IMMER übersprungen. Das ursprüngliche Erst-Onboarding
(ohne `startPhase`-Override, also die eigentliche Erstregistrierung)
läuft unverändert mit allen Schritten durch — nur der Wiederholungsfall
über den "+"-Button wurde verkürzt.

Zurück-Navigation (`onBack`) von "ziele"/"laborwerte"/"steckbrief"
musste dabei mit angepasst werden (neues `zieleProfilBesucht`-Flag in
`OnboardingFlow.jsx`), damit der Zurück-Pfeil nie auf eine in diesem
Lauf tatsächlich übersprungene Phase zeigt (z. B. nicht auf "intro",
wenn die Namensabfrage in diesem Lauf gar nicht gezeigt wurde).

**Tests:** zwei neue E2E-Tests in `e2e/onboarding.spec.js` (Nein-Pfad:
Name/Quick-Win/Ziel/Profil bleiben komplett unsichtbar, landet direkt
bei "Deine Laborwerte"; Ja-Pfad: führt weiterhin durch "Ziel & Grund").
Der bestehende Erst-Onboarding-Test bleibt unverändert grün — betrifft
ausschließlich den `startPhase="hauptprotokoll"`-Einstieg. Build, Lint,
Typecheck, 98 Unit- und 35 E2E-Tests grün.

---

## ✅ Update 14.09.2026 (Teil 102) — Diktierfunktion ohne KI für Onboarding-Formularfelder (Commit `b3aae48`)

Nutzerinnen-Vorgabe: das bestehende KI-gestützte Onboarding
(`OnboardingCoachFreitext.jsx`, „frei erzählen" + KI ordnet den Feldern
zu) ermüdet sie bei häufiger Nutzung, und das KI-Kontingent ist knapp
(siehe Offene Punkte, Gemini-429). Gewünscht: eine reine
Spracherkennung fürs Ausfüllen einzelner Formularfelder, komplett OHNE
KI-Beteiligung — plus eine optische Unterscheidung zwischen dem gerade
erst (unsicher) erkannten Satzteil und dem bereits bestätigten Text.

**Neu:** `src/ui/useDiktat.js` — ein wiederverwendbarer Hook um die
bereits bestehende `starteSprachErkennung()` (`utils/speech.js`, reine
Web-Speech-API, dieselbe Funktion, die schon TagebuchModal.jsx und
OnboardingCoachFreitext.jsx fürs Mikrofon nutzen — **kein**
`AIService`-Aufruf, kein Netzwerk, kein KI-Kontingent). Neu daran: der
noch unsichere Zwischenteil (`interim`) wird separat nach außen
gereicht statt sofort in den Feldwert geschrieben.

**`src/ui/primitives.jsx`:** `TextInput`/`TextArea` haben ein neues,
standardmäßig AUS-geschaltetes `diktierbar`-Prop bekommen (alle ~55
bestehenden Aufrufstellen dieser beiden Komponenten bleiben dadurch
unverändert — nur explizit angegebene Stellen zeigen das
Mikrofon-Icon). Bei aktivem Diktat: Mikrofon-Knopf oben rechts im Feld,
Zwischenergebnis erscheint kursiv/blass unterhalb des Felds ("Anton…"),
erst der fertige Satz landet normal-gewichtet im echten Feldwert.

**Angewendet auf** die freien Textfelder der nicht-KI-gestützten
Onboarding-Screens: Name (`OnboardingIntroView.jsx`), Steckbrief-
Freitextfelder (`OnboardingSteckbriefView.jsx`), Hauptprotokoll-Name
(`HauptprotokollErstellenView.jsx`), den generischen Freitext-Schritt
der geführten Coach-Fragen (`OnboardingCoachGuide.jsx`, Phase 1) sowie
alle Namens-/Freitextfelder der Kategorien-Einrichtung
(`OnboardingCategoriesView.jsx`: Gewohnheiten-Name/-Menge,
Ernährung-Mahlzeitname/-Zutat, Supplement-Name, Medikament-Name, „Dein
aktueller Stand"-Freitext je Kategorie). Bewusst NICHT auf Zahl-/Datum-
Felder (Zieltage, Hydration-ml, Startdatum) — dort hilft Diktat nicht.

**Tests:** 4 neue Unit-Tests (`src/ui/useDiktat.test.jsx` — Zwischen-/
Endergebnis-Trennung, Anhängen mehrerer Sätze, Start/Stop, Fehlerfall)
plus ein neuer E2E-Test (`e2e/onboarding.spec.js`) mit simulierter
`SpeechRecognition` (kein echtes Mikrofon im Testrunner), der zusätzlich
jeden Netzwerkaufruf an `**/functions/v1/**` abfängt und den Test
scheitern lässt, falls doch eine Edge Function (KI) aufgerufen würde —
stellt die „ohne KI"-Vorgabe damit nicht nur durch Code-Lesen, sondern
messbar sicher. Build, Lint, Typecheck, 98 Unit- und 34 E2E-Tests grün.

---

## ✅ Update 14.09.2026 (Teil 101) — Nachkontrolle: zwei echte Fehler gefunden und behoben (Commit `0147a63`)

Nutzerinnen-Vorgabe nach Abschluss der 13-Punkte-Liste: noch einmal
gezielt auf selbst eingebaute Fehler durchsehen, nicht nur "läuft
grün" als ausreichend nehmen. Dabei zwei reale, bis dahin von den
Tests nicht erfasste Probleme gefunden — beide entstehen erst im
Zusammenspiel zweier für sich genommen korrekter Änderungen aus
unterschiedlichen Teilen dieser Liste:

1. **AuthenticatedApp.jsx (Echtes Routing, Teil 97):** ein aus der URL
   gelesener View wurde bei JEDEM Mount übernommen — aber
   AuthenticatedApp mountet nicht nur beim echten Seitenaufruf neu,
   sondern auch bei jedem Wechsel in/aus dem "Verwalten als"-Modus
   (`key={proband?.id || "self"}` in App.jsx). Ein Admin, der z. B. auf
   `#/tagesplan` stand, hätte eine gerade übernommene Coachee-Sitzung
   sofort auf deren Tagesplan statt (wie vorher und wie erwartet) auf
   Home gesehen. Fix: ein modul-weites Flag sorgt dafür, dass der Hash
   nur beim allerersten Laden dieser Registerkarte übernommen wird —
   jeder weitere Remount startet wieder sauber auf Home.
2. **AkutModusGlobal.jsx (Teil 90) im Zusammenspiel mit dem neuen
   Routing (Teil 97):** der schwebende Akutmodus-Knopf lebt außerhalb
   des `key={view}`-Remounts (bleibt beim Bildschirmwechsel bestehen,
   wechselt nur seine Sichtbarkeit) — anders als der ursprüngliche
   Home-Akutmodus, dessen State beim Verlassen von Home automatisch
   mit wegfällt. Browser-Zurück während das Panel offen war (durch
   Teil 97 überhaupt erst möglich) ließ `offen` wahr stehen; beim
   nächsten Sichtbarwerden wäre das Panel ohne jeden Klick von selbst
   wieder aufgesprungen. Fix: ein Effekt setzt `offen` zurück, sobald
   die Komponente unsichtbar wird.

Beide Fixes mit neuen, echten E2E-Regressionstests abgesichert — für
Fund 2 vorab verifiziert (Fix testweise rückgängig gemacht), dass der
neue Test gegen den unreparierten Code tatsächlich rot ausschlägt statt
nur grün zu sein, weil er nichts wirklich prüft.

Alle anderen 11 der 13 Punkte beim erneuten Durchgehen (Datenfluss,
Zustandsverwaltung, Reihenfolge/Grenzfälle, TypeScript-Typprüfung, exakte
Spread-Reihenfolge im aufgeteilten Datentopf) ohne weitere Befunde.

Build, Lint, Typecheck, 94 Unit- und 32 E2E-Tests grün (E2E zusätzlich
mit `--repeat-each=2`, 64 Durchläufe).

## ✅ Update 14.09.2026 (Teil 100) — TypeScript eingeführt (Commit `79f2fed`) — App-Bauplan-Liste vollständig abgearbeitet

Letzter der 13 Punkte aus der App-Bauplan-Liste (siehe Teile 88–100,
alle in dieser Sitzung nacheinander umgesetzt). ~150 Dateien in einem
Rutsch auf TypeScript umzustellen wäre ein eigenes, mehrwöchiges
Projekt für sich gewesen — zu riskant, um es ungeprüft in einer
Sitzung durchzuziehen. Stattdessen:

- `typescript` als Dev-Dependency, `tsconfig.json` mit `allowJs: true`
  + `checkJs: false` — bestehende .js/.jsx-Dateien laufen unverändert
  und ungeprüft neben echten .ts/.tsx-Dateien weiter.
- `npm run typecheck` (`tsc --noEmit`), jetzt Teil von `npm run test:all`.
- Drei echte, in dieser Sitzung selbst geschriebene Utility-Module auf
  TypeScript umgestellt (Modul + Test, bewusst diese drei — schon
  vollständig unit-getestet, klein, eigenständig, ihr Verhalten aus
  erster Hand bekannt): `queryCache.ts`, `routing.ts`, `gnadentag.ts`.
  Der Typecheck fand dabei zwei echte kleine Typfehler (kein reines
  Ritual) — behoben, nicht unterdrückt.
- Migration der übrigen ~150 Dateien: eigener, über Zeit laufender
  nächster Schritt (Konvertieren-beim-Anfassen-Policy).

**Damit sind alle 13 Punkte aus dem App-Bauplan-Gespräch umgesetzt,
getestet und auf `main` gepusht** — 8 kleinere, bereichsweise Fixes
(Teile 88–96 bzw. 88–97 je nach Zählung) und 5 größere strukturelle
Umbauten (Code-Splitting, echtes Routing, Datentopf-Aufteilung,
Caching-Datenschicht, TypeScript-Grundlage). Einzige offene
Gegenprüfung: Teil 98 (Datentopf-Aufteilung) bittet um einen kurzen
manuellen Blick in echter Nutzung, siehe dort — alles andere ist ohne
Einschränkung fertig.

## ✅ Update 14.09.2026 (Teil 99) — Zentrale Datenschicht mit Caching (Commit `fc0cc99`)

Vierter der fünf größeren strukturellen App-Bauplan-Punkte. Konkreter,
im Code auffindbarer Auslöser: `AuthenticatedApp.jsx` mountet den
aktiven Bildschirm bei jedem `view`-Wechsel komplett neu (für die
fadeInUp-Übergangsanimation) — jede Komponente mit eigenem
`useEffect`-Datenabruf, unabhängig vom zentralen `AppDataProvider`,
lädt ihre Daten dadurch bei jedem erneuten Besuch neu. Home → Mehr →
zurück zu Home fragte z. B. die Quest-Rangliste jedes Mal komplett neu
ab, auch wenn seit dem letzten Besuch vor Sekunden nichts passiert war.

Neu: `src/lib/queryCache.js` (reines Cache-Modul: TTL + Dedup
gleichzeitiger Anfragen für denselben Key, Fehler werden nicht
gecacht) + `src/lib/useCachedQuery.js` (React-Hook-Anbindung). Bewusst
ein schlankes, selbst geschriebenes Modul statt React Query/SWR: die
~33 Daten-Hooks unter `src/data/` haben schon eigene, sorgfältig
gebaute optimistische Updates samt Rollback bei Fehlern (mehrere
frühere Teile dieses Protokolls) — die alle auf eine Bibliotheks-
eigene Mutations-API umzustellen wäre ein eigener, riesiger Umbau für
sich. Dieses Modul deckt genau den Fall ab, für den es hier gebraucht
wird: einfache GET-artige Abfragen, die bei jedem Bildschirmwechsel
neu gemountet werden.

`RanglisteKarte.jsx` als erster echter, vollständig getesteter
Anwendungsfall umgestellt (Cache-Key `"quest-rangliste"`, 30s TTL,
geteilt zwischen Home und `AdminQuestsView`). Die Migration der
restlichen ~5 Stellen mit eigenem Ad-hoc-Datenabruf (Admin-Views, die
strukturell andere Cross-User-Abfragen machen) ist ein eigener,
risikoarmer nächster Schritt — kein Blocker dafür, dass die neue
Infrastruktur schon jetzt echten Nutzen bringt.

## ⚠️ Update 14.09.2026 (Teil 98) — Globalen Datentopf aufgeteilt (Commit `ccefca8`) — bitte in echter Nutzung gegenprüfen

Dritter der fünf größeren strukturellen App-Bauplan-Punkte, aus
demselben Grund vorsichtiger angegangen wie die letzten beiden: berührt
die Datenschicht, über die praktisch die ganze App läuft.

`AppDataContext.jsx` bündelte bisher ~33 Daten-Hooks direkt in einem
einzigen ~150-Felder-Objekt — jede Änderung irgendwo (ein Supplement
abhaken, eine neue Team-Nachricht) rendert dadurch JEDE Komponente neu,
die überhaupt `useAppData()` aufruft. Jetzt in drei fachliche Kontexte
aufgeteilt (`src/context/appData/{Core,Tracking,Platform}DataContext.jsx`,
jeweils mit eigenem Provider, eigener `useShallowStableValue`-
Stabilisierung): Core (Profil/Protokoll-Grunddaten + Hormondosen),
Tracking (die täglichen "Lebensbereiche" — höchste Änderungsfrequenz,
bisher Haupttreiber unnötiger Re-Renders), Platform (Coaching/Social +
App-Infrastruktur). `AppDataContext.jsx` selbst orchestriert die drei
nur noch und bleibt als Kompatibilitäts-Fassade bestehen —
`useAppData()` liefert weiterhin exakt dasselbe Objekt wie vorher, alle
bestehenden Aufrufstellen unverändert.

**Wichtige Einschränkung, ehrlich benannt statt verschwiegen:** die
neue Struktur wurde strukturell gegen die alte Datei verifiziert
(identische Spread-Reihenfolge, identische Hook-Aufruf-Signaturen,
per Diff geprüft) und Build/Lint/alle 84 Unit- + 31 E2E-Tests sind
grün — ABER die E2E-Suite hängt `AppDataProvider` selbst gar nicht
ein (der Test-Harness injiziert einen gemockten Wert direkt in
denselben Context, bewusst ohne echtes Supabase, siehe
`e2e/harness/TestApp.jsx`). Die echte Hook-Verkettung (33 Hooks über
drei verschachtelte Provider gegen die echte Datenbank) konnte in
dieser Umgebung NICHT automatisiert End-to-End getestet werden — dafür
bräuchte es einen echten Login mit echten Supabase-Zugangsdaten, die
hier nicht vorliegen. Bitte nach dem nächsten Deploy einmal bewusst
durch ein paar Kernbereiche klicken (Supplemente abhaken, Mahlzeit
eintragen, Team-Nachricht senden) und prüfen, ob alles wie gewohnt
aussieht, BEVOR dieser Punkt als vollständig abgehakt gilt.

Neuer Code kann künftig gezielt `useCoreData()`/`useTrackingData()`/
`usePlatformData()` statt `useAppData()` nutzen — die schrittweise
Umstellung der ~60 bestehenden Aufrufstellen ist ein eigener,
risikoarmer nächster Schritt, keine Voraussetzung dafür, dass dieser
Umbau schon jetzt wirkt.

## ✅ Update 14.09.2026 (Teil 97) — Echtes Routing eingeführt (Commit `d7f52b8`)

Zweiter der fünf größeren strukturellen App-Bauplan-Punkte. `view` in
`AuthenticatedApp.jsx` war bisher reiner React-State, nirgends mit der
echten Browser-URL verknüpft: ein Lesezeichen landete beim Öffnen immer
auf Home, der Zurück-Knopf des Browsers tat gar nichts (kein Eintrag in
der Historie), ein Neuladen mittendrin setzte unsichtbar auf den
Startbildschirm zurück.

Neues `utils/routing.js`: bewusst Hash-Routing (`#/tagesplan`) statt
"sauberer" Pfade — Pfad-Routing bräuchte eine serverseitige SPA-
Fallback-Regel, die für dieses Projekt nirgends konfiguriert ist (kein
`vercel.json` im Repo); ohne die würde ein direkter Aufruf oder ein
Neuladen von z. B. `/tagesplan` mit einem 404 vom Hosting scheitern.
Hash-Routing braucht dagegen auf keinem Host irgendeine
Zusatzkonfiguration.

In `AuthenticatedApp.jsx`: jeder `view`-Wechsel pusht jetzt einen
echten History-Eintrag, ein `popstate`-Listener übernimmt Zurück/
Vorwärts direkt in `view` (mit Ref-Guard gegen eine kaputte Historie/
Endlosschleife zwischen Push- und Popstate-Effekt). Ein aus der URL
gelesener View wird beim App-Start nur übernommen, wenn er bekannt ist
UND — bei `admin-*` — `isAdmin` zutrifft: ein alter oder manipulierter
Link darf weder in einen unbekannten Zustand noch in eine Admin-Ansicht
führen, die eine Coachee sowieso nicht sehen könnte.

Neuer E2E-Test (`smoke.spec.js`) prüft die eigentliche Funktion, nicht
nur "nichts kaputt": Navigation setzt den Hash, Browser-Zurück/Vorwärts
wandert tatsächlich durch die zuvor besuchten Bildschirme.

## ✅ Update 14.09.2026 (Teil 96) — Code-Splitting eingeführt (Commit `7e3fa70`)

Nächster Punkt aus der App-Bauplan-Liste — der erste der fünf größeren
strukturellen Punkte. Der Produktions-Build warnte schon länger ("Some
chunks are larger than 500 kB"): die komplette App — Admin-Bereich,
Onboarding-Fragebogen, jede einzelne Kategorie-Ansicht — landete in
einem einzigen JS-Bundle (~2,37 MB minifiziert), obwohl pro Sitzung
immer nur ein Bruchteil davon tatsächlich gebraucht wird.

In `AuthenticatedApp.jsx`: alle Bildschirme außer `HomeView` (praktisch
jede Sitzung sofort nach dem Laden gebraucht, ein zusätzlicher
Netzwerk-Sprung dort würde nur schaden) jetzt per `React.lazy()` als
eigener Chunk — nachgeladen genau dann, wenn `view` erstmals darauf
wechselt. `<Suspense fallback={<LoadingScreen />}>` sitzt dabei
INNERHALB der bestehenden Error Boundary (Teil 88), nicht daneben —
schlägt ein Chunk-Nachladeversuch fehl (z. B. Netzwerkfehler), fängt
das Auffangnetz das mit auf statt einer leeren Seite.

Haupt-Bundle dadurch von ~2,37 MB auf ~695 KB (≈ -71%), der Rest
verteilt sich jetzt auf ~15 eigene, pro Bildschirm nachgeladene Chunks
(TagesplanView, AdminDashboardView, MehrView, GewohnheitenView,
OnboardingFlow, PlaeneView, ...). E2E-Suite (deckt jeden dieser
Bildschirme ab) zusätzlich mit `--repeat-each=2` verifiziert (60
Durchläufe) — keine Flakiness durch die neue Async-Ladezeit.

## ✅ Update 14.09.2026 (Teil 95) — Startseite entschlacken (Commit `c327f91`)

Nächster Punkt aus der App-Bauplan-Liste. Home versteht sich laut
bestehenden Kommentaren selbst als "ein Tagesassistent, kein Menü" —
die Reihenfolge widersprach dem aber: die Quests-/Rangliste-/Team-/
Coach-Nachricht-Karten standen direkt zwischen den Schnellaktionen
(Hydration/Akutmodus-Knopf) und dem eigentlichen Tagesfortschritt/
"Als Nächstes". Genau der Teil, den man als Erstes braucht ("Was steht
heute an?"), verschwand dadurch hinter vier Motivations-/Social-Karten.

Reine Umsortierung in `HomeView.jsx`, nichts entfernt oder in der
Funktion verändert: der Block (QuestsKarte/RanglisteKarte/TeamKarte/
NachrichtAnCoachCard bzw. der Home-KiChat im Admin-Modus) sitzt jetzt
NACH "Als Nächstes", VOR "Direktzugriff" — bleibt vollständig
erreichbar, nur nicht mehr im Weg zum eigentlichen Tagesinhalt.

## ✅ Update 14.09.2026 (Teil 94) — Onboarding: schneller kleiner Erfolg an den Anfang (Commit `47b7ba6`)

Nächster Punkt aus der App-Bauplan-Liste. Der Onboarding-Ablauf war
bisher: Willkommens-Folien → Hauptprotokoll anlegen → Intro → Ziel &
Grund → Profil → Laborwerte → Morgen-/Abendroutine → Kategorien (bis
zu 8!) → erst DANN der Abschluss-Screen mit dem einzigen echten
Erfolgsmoment. Bei ADHS reißt Motivation/Aufgabeninitiierung gerade an
so langen Durststrecken ohne Zwischen-Belohnung am ehesten ab.

Neuer Zwischenscreen `OnboardingQuickWinView.jsx`, eingehängt als neue
Phase "quickwin" zwischen "hauptprotokoll" und "intro"
(`OnboardingFlow.jsx`): direkt nach dem allerersten, kleinsten Schritt
(Protokoll anlegen — Name + Startdatum, wenige Sekunden) gibt's schon
eine sichtbare Bestätigung, bewusst im selben visuellen Muster
(Farbverlauf-Icon, Glückwunsch-Ton) wie der bestehende Abschluss-
Screen — Anfang und Ende des Onboardings sollen sich wie
zusammengehörige Erfolgsmomente anfühlen, nicht nur das Ende. Neue
i18n-Schlüssel `onboarding.quickwin.*` in allen drei Sprachen
(de/en/tr, `src/i18n/dict/onboarding.js`). `e2e/onboarding.spec.js`
entsprechend um den neuen Screen erweitert.

## ✅ Update 14.09.2026 (Teil 93) — Gnadentag-/Vergebungsmechanik reaktivieren (Commit `32017cc`)

Nächster Punkt aus der App-Bauplan-Liste. `GraceDayCard.jsx` gab es
schon einmal (Wochenrückblick mit Anti-Scham-Messaging), war aber im
Code-Audit (Teil 5, 13.09.) zu Recht als toter Code entfernt worden —
die Komponente war nirgends importiert, hatte keine echte
Datengrundlage (nahm `weeklyStats` nur als Prop entgegen, ohne dass
irgendwer sie befüllt hätte) und war stilistisch ein Fremdkörper
(hartcodierte Hex-Farben statt theme.js).

Jetzt neu aufgebaut statt nur zurückgeholt:
- **`utils/gnadentag.js`** (neu, mit Tests): `berechneWochenStats()`
  nutzt `buildDayItems()` — dieselbe Ist-geplant-Logik wie Tagesplan/
  `ausgefallenSweep.js` (Teil 87/Bug-Fix) statt einer zweiten,
  unabhängigen Berechnung. Ein Tag ohne geplante Punkte zählt NICHT
  als Pause (nichts stand an); ab 50%+ erledigten Punkten gilt ein Tag
  als "aktiv".
- **`ui/GraceDayCard.jsx`** neu geschrieben: theme.js-Tokens statt
  eigener Hex-Werte (inkl. des neuen `warn`-Bernstein-Tons aus Teil 92
  für die "Pausen"-Kachel — passt thematisch zusammen).
- In **`ErfolgeTab.jsx`** oben eingehängt, vor der bestehenden Punkte-/
  Streak-/Abzeichen-Übersicht — der Reiter war bisher rein additiv
  (Punkte, Streaks, Abzeichen), ohne Platz für "es ist okay, wenn mal
  nicht alles geklappt hat".

Kernbotschaft bleibt wie im Original: "Pausen sind nicht Scheitern. Du
machst das richtig." — kein Streak-Reset-Gefühl bei einem einzigen
ausgelassenen Punkt, dieselbe Grundhaltung wie der KI-Coach-Systemprompt
("motivierend statt beschämend", `aiService.js`).

## ✅ Update 14.09.2026 (Teil 92) — Sprache/Farbe bei Verspätungen auf Wohlwollen geprüft (Commit `b3154c5`)

Nächster Punkt aus der App-Bauplan-Liste: gesamte App auf beschämende/
vorwurfsvolle Sprache bei Verspätungen und Rückständen durchsucht. Der
KI-Coach hat dafür bereits eine starke Vorgabe im Systemprompt
(`aiService.js`, Zeile ~66f.: "motivierend statt beschämend", "kein
schlechtes Gewissen erzeugen") — die meisten statischen Texte waren
ebenfalls schon neutral/faktisch ("30 Min. später als geplant", "Nicht
bestätigt am ..."). Zwei Stellen fielen aus diesem Rahmen:

1. **"Verpasst"-Zähler** (Peptid-Statistik `StatistikTab.jsx`,
   `StatusBadge` in `primitives.jsx`) leuchtete in Alarm-Rot (`danger`)
   neben Grün ("Erledigt")/Blau ("Geplant") — wirkt wie ein
   Fehlerzähler statt wie eine neutrale Information. Neuer eigener
   Farbton `warn`/`warnSoft` (Bernstein `#D97706`, theme.js) — derselbe
   Wert wie der bereits bestehende "💛 Heute nur Basics ... Kein
   Druck!"-Notfallmodus-Banner auf Home. `danger`-Rot bleibt echten
   Fehlern/Löschen vorbehalten.
2. **Änderungsprotokoll** (`ProtokollLogView.jsx`) zeigte das rohe
   `aktion`-Feld direkt an — für automatisch erfasste, nicht bestätigte
   Einträge stand da wörtlich "ausgefallen", liest sich wie ein Verdikt.
   Neue Anzeige-Beschriftung "Nicht geschafft" NUR fürs Rendering
   (`AKTION_ANZEIGE`-Map) — der gespeicherte Wert bleibt exakt
   "ausgefallen", weil `ausgefallenSweep.js` genau danach filtert, um
   bereits erfasste Tage nicht doppelt einzutragen.

## ✅ Update 14.09.2026 (Teil 91) — Quest-Rangliste/Wettbewerb optional machen (Commit `90d7cb8`)

Nächster Punkt aus der App-Bauplan-Liste. Die Quest-Rangliste
(`RanglisteKarte.jsx`, ursprünglich eigene Nutzerinnen-Vorgabe vom
16.08. — "die Leute sollen halt meine Coachees gegeneinander antreten
können") zeigte bisher zwangsweise alle Coachees allen anderen.
Vergleich mit anderen motiviert manche Menschen, wirkt bei anderen
(gerade in schlechten Phasen — Stichwort Rejection Sensitive
Dysphoria, bei ADHS besonders verbreitet) demotivierend oder
beschämend statt anspornend.

Neue Spalte `rangliste_sichtbar` auf `profiles` (Migration 0085,
Default `true` — nichts ändert sich, bis jemand aktiv abschaltet).
`quest_rangliste()` filtert selbst schon danach, nicht erst im
Frontend — wer sich ausblendet, verschwindet serverseitig aus den
Daten, nicht nur optisch. Neuer Schalter in "Mehr" → Profil-
Einstellungen (`MehrTab.jsx`, gleicher Toggle-Button-Stil wie die
Datenteilung in `CommunityTab.jsx`): einmal umgelegt, sieht man die
Rangliste selbst nicht mehr UND taucht bei niemand anderem mehr darin
auf — bewusst symmetrisch in beide Richtungen. Die
Admin-Verwaltungsansicht (`AdminQuestsView.jsx`, neuer
`erzwingeSichtbar`-Prop an `RanglisteKarte`) bleibt davon unberührt —
der Coach braucht die Übersicht unabhängig von der eigenen (dort
ohnehin irrelevanten) Präferenz.

## ✅ Update 14.09.2026 (Teil 88–90) — Auffangnetz, Fehler-Frühwarnsystem, Akutmodus überall erreichbar

Nutzerinnen-Vorgabe nach dem App-Bauplan-Gespräch: die dort erarbeitete
13-Punkte-Liste offener Baustellen "Stück für Stück" direkt im Code
abarbeiten, nicht nur als Vorschläge stehen lassen. Erste drei Punkte:

**Teil 88 — Auffangnetz gegen Abstürze (Commit `3625b92`).** Ohne
Error Boundary zeigt React bei einem Fehler irgendwo im Komponentenbaum
eine komplett leere, weiße Seite — man merkt nicht mal, dass etwas
schiefging. Neue Klassenkomponente `src/ui/ErrorBoundary.jsx`
(`getDerivedStateFromError`/`componentDidCatch`, einzige Möglichkeit in
React, einen Fehler-Grenzwert zu bauen), bewusst ohne Abhängigkeit von
Shell/Context — falls der Fehler durch einen kaputten Context ausgelöst
wurde, darf die Auffang-Anzeige nicht selbst davon abhängen. Zeigt
"Zurück zur Startseite" / "Seite komplett neu laden", im Dev-Modus
zusätzlich die Rohfehlermeldung. In `App.jsx` um die ganze App gelegt,
zusätzlich in `AuthenticatedApp.jsx` um jeden einzelnen Bildschirm-
Wechsel — ein Absturz auf einer Unteransicht reißt so nicht die ganze
App mit, sondern nur den betroffenen Bereich.

**Teil 89 — Fehler-Frühwarnsystem, Sentry (Commit `ef48257`).** Bisher
erfuhr man von einem Absturz draußen im echten Betrieb nur durch Zufall
(die Nutzerin berichtet es). Neuer Service
`src/services/errorMonitoring.js`, angebunden über `@sentry/react`;
`meldeAbsturz()` wird aus der Error Boundary heraus aufgerufen. Rein
additiv und ungefährlich: ohne gesetzte `VITE_SENTRY_DSN` bleibt das
Frühwarnsystem einfach aus, die App läuft normal weiter. `.env.example`
um die nötige Erklärung/Platzhalter-Zeile ergänzt — kostenloses
Sentry-Konto reicht für eine Einzelnutzer-App.

**Teil 90 — Akutmodus von jedem Bildschirm aus erreichbar (Commit
`fe08c3b`).** Der Akutmodus saß bisher nur auf Home (eigene, frühere
Nutzerinnen-Vorgabe, bleibt dort unverändert bestehen) — ausgerechnet
der Moment, in dem jemand ihn braucht, passiert aber oft nicht auf der
Startseite. Neue Komponente `src/ui/AkutModusGlobal.jsx`: schwebender
💡-Knopf unten links auf allen Bildschirmen außer Home und Onboarding,
öffnet dasselbe `AkutModusPanel` wie bisher, per `createPortal` an
`document.body` gerendert (gleicher Grund wie beim KiChat-Fix aus Teil
87 — sonst könnte eine transformierende Vorfahren-Animation den Knopf
oder das Panel beschneiden). In `AuthenticatedApp.jsx` neben
`<Belohnungsfenster />` eingehängt.

Build, Lint, alle 76 Unit- und 30 E2E-Tests grün nach jedem der drei
Schritte. Nächste Punkte aus der Liste (Team-Rangliste optional machen,
wohlwollende Sprache bei Rückständen, Gnadentag-Mechanik, Onboarding-
Quick-Win, Startseite entschlacken, dann die größeren strukturellen
Punkte Code-Splitting/Routing/Datentopf-Aufteilung/TypeScript) folgen
in denselben Schritten.

## ✅ Update 14.09.2026 (Teil 87) — Bug-Fix: Coach-Chat-Modal deckte Bildschirm nur teilweise ab

Die in Teil 86 notierte "Beobachtung" (Coach-Chat überlappt den
"Weiter"-Button im Onboarding) war ein echter Bug, kein Testartefakt —
Nutzerinnen-Vorgabe: "Alles, was Du im Code erkennst, wird auch mit
Sicherheit im echten Leben so sein... darfst Du das gerne einfach so in
Ordnung bringen." Commit `b19c197`.

**Ursache:** `KiChat.jsx` rendert Chat-Orb und -Modal mit `position:
fixed` (soll relativ zum echten Bildschirm sitzen). Eingebettet in eine
Ansicht mit transformierender Vorfahren-Animation (z. B. die fadeInUp-
Phasenwechsel-Animation in `OnboardingFlow.jsx` — ein CSS-`transform`
erzeugt einen neuen "Containing Block" für `position: fixed`) wurde
"fixed" dadurch relativ zu diesem Vorfahren statt zum Bildschirm. Auf den
Onboarding-Schritten "Laborwerte"/"Routinen" (KiChat läuft dort mit
`autoStart` automatisch an) deckte das Modal dadurch nicht den ganzen
Bildschirm ab, sondern nur einen abgeschnittenen Ausschnitt — der
"Weiter"-Button darunter war sichtbar, aber unklickbar. Wirkte wie
kaputtes Layout, nicht wie ein absichtliches "erst schließen, dann
weiter". Betraf grundsätzlich jede Stelle mit einer transformierenden
Vorfahren-Animation, nicht nur diese zwei Onboarding-Screens.

**Fix:** Orb-Knopf und Modal werden jetzt per `createPortal` direkt an
`document.body` gerendert — garantiert unabhängig davon, wo KiChat im
Baum eingebettet ist. Empirisch mit Vorher/Nachher-Screenshots bestätigt
(Modal deckt jetzt korrekt den kompletten Bildschirm ab, "Weiter" ist
danach wieder normal per Schließen-Knopf erreichbar, wie bei jedem
anderen Modal in der App auch). `onboarding.spec.js` entsprechend
angepasst: schließt das Modal jetzt über den echten "Schließen"-Knopf
statt es zu umgehen.

## ✅ Update 14.09.2026 (Teil 86) — E2E-Suite auf vollen Umfang ausgeweitet (Onboarding, alle Kategorien, Archiv, Admin)

Nutzerinnen-Vorgabe: die Playwright-Suite aus Teil 85 deckte bis hierhin
nur Home/Navigation/Tagebuch ab — sollte auf denselben Umfang wie der
ursprüngliche manuelle UI-Durchklick-Test (Teil 80: Onboarding, alle 9
Kategorien, Tagesplan, Archiv, Admin) ausgebaut werden, vollständig,
nicht nur teilweise. Commit `645bc2d`.

**Jetzt 30 E2E-Tests (vorher 4):**
- `onboarding.spec.js` — kompletter Durchlauf Willkommen → Hauptprotokoll
  → Intro → Ziele → Profil → Laborwerte → Routinen → Kategorien ("Alles
  überspringen") → Abschluss → zurück auf Home. **Bewusste Grenze**:
  befüllt nur die zum Weiterkommen nötigen Felder (Protokollname,
  Vorname) — testet nicht jede der 8 Kategorien einzeln mit echten Werten
  (Ziel/Grund, Messwerte, ...), das wäre für einen automatisierten
  Smoke-Test zu fragil (bricht bei jeder Text-/Feld-Änderung, für einen
  Nutzen kaum über "stürzt nicht ab" hinaus).
- `plaene.spec.js` — alle 10 Reiter unter "Alle Pläne" (9 Kategorien +
  Wochenübersicht).
- `archiv.spec.js` — alle 8 Reiter im Archiv-Hub.
- `admin.spec.js` — Dashboard + alle 6 Unteransichten.

**Beim Ausbau gefundene/behobene Mock-Lücken** (jeweils durch einen
echten Testlauf-Absturz aufgedeckt, nicht auf Verdacht): Funktionsnamen
jetzt als explizite ~140-Namen-Liste direkt aus dem Code statt nur
Regex-Heuristik (robuster gegen einzelne verfehlte Verb-Muster);
gemockte Funktionen liefern ein plausibles `{ok:true, ...{id}}` statt
`undefined` (nötig, damit mehrstufige Formulare wie Onboarding
tatsächlich weiterkommen); "aktives"+Großbuchstabe- und "...datum"-Felder
liefern jetzt `null` statt des generischen (aber truthy) Array-Fallbacks.

**Neue Sammelbefehle:** `npm run test:all` (Build + Lint + Vitest +
Playwright hintereinander — der Befehl, den künftige Sitzungen nach
größeren Änderungen laufen lassen sollten) und `npm run test:e2e` (nur
Playwright, für schnellere Iteration).

**Update (Teil 87, direkt im Anschluss):** die "Beobachtung" unten war
kein Mock-Artefakt, sondern ein echter Bug — gefunden, bestätigt und
behoben, siehe Teil 87.

## ✅ Update 13.09.2026 (Teil 85) — Echte automatisierte Testsuite aufgebaut (Vitest + Playwright)

Nutzerinnen-Vorgabe: nach dem UI-Test/der Sicherheitsprüfung/Barriere-
freiheits-Stichprobe (Teile 80-82) sollte künftig eine dauerhafte,
automatisierte Testsuite existieren, statt jedes Mal neu von Hand oder
mit Wegwerf-Testskripten zu prüfen. Bisher gab es **keinerlei** Tests im
Projekt (kein `test`-Skript, keine Test-Bibliothek in package.json).

**Teil 1 — Vitest, Unit-Tests für Kernlogik (Commits `0372d2e`, `b61f457`):**
`npm test` (= `vitest run`) neu eingerichtet, 73 Tests für die am meisten
fehleranfällige reine Berechnungslogik: `dates.js`, `belohnungZeit.js`,
`schedule.js` (alle 4 Intervall-Modi), `kalorien.js`, `errungenschaften.js`,
`ausgefallenSweep.js`.

**Dabei ein echter, produktiver Bug gefunden und gefixt** (nicht von der
Nutzerin gemeldet — der Test hat ihn beim Schreiben selbst aufgedeckt):
`pruefeAusgefalleneEintraege()` (`ausgefallenSweep.js`) berechnete die
nachzuholenden Tage falsch (`luecke - 1` statt `luecke`) — der Tag, an
dem der vorige Sweep lief, wurde dadurch für immer übersprungen. Bei
täglicher App-Nutzung (die Lücke zwischen zwei Sweeps ist dann fast immer
genau 1 Tag) bedeutete das: die automatische "als ausgefallen markieren"-
Funktion lief **faktisch nie**. Gefixt, durch Test empirisch bestätigt
(vorher 0 Aufrufe bei 1-Tage-Lücke, jetzt der erwartete 1 Aufruf).

**Teil 2 — Playwright, E2E-Smoke-Tests (Commit `4032f13`):** `npx
playwright test` treibt die echte App-Oberfläche über einen echten
Chromium-Browser, gegen den normalen Vite-Dev-Server. Neuer Harness
(`e2e/harness/`) rendert `AuthenticatedApp.jsx` mit gemockten Auth-/
AppData-Context-Werten statt echtem Supabase/echtem Login — dafür
exportieren `AppDataContext.jsx`/`AuthContext.jsx` jetzt zusätzlich das
rohe Context-Objekt (rein additiv, ändert am normalen App-Verhalten
nichts). `e2e/harness/mockAppData.js` rät bei den ~150 Feldern aus
`useAppData()` per Namens-Heuristik (Proxy), ob ein Feld eine Funktion
oder welche Art Daten ist — kein Ersatz für echte Fixtures, aber genug
für einen Absturz-/Navigations-Smoke-Test. 4 Tests: Home lädt fehlerfrei,
Seitenleisten-Navigation (Archiv → Mehr → Admin → Home), Tagesplan
erreichbar, Tagebuch-Modal öffnet/schließt per Escape (Regressionstest
für die Barrierefreiheits-Verbesserung aus Teil 82).

**Für die Zukunft:** `npm test` und `npx playwright test` sollten künftige
Sitzungen nach größeren Änderungen mit ausführen (wie `npm run build` +
`npx oxlint` schon jetzt Standard sind) — beide sind jetzt genauso einfach
aufrufbar. Die Playwright-Testsuite deckt bisher nur Home/Navigation/
Tagebuch ab, kein Onboarding, keine der 9 Kategorien im Detail, kein
Admin-Workflow — bei Gelegenheit ausbaufähig, gleiches Harness-Muster
wiederverwendbar.

## ✅ Update 13.09.2026 (Teil 84) — Migrationen 0001-0084 vollständig bestätigt deployt

Nutzerin hat bestätigt: auch die zuletzt noch unbestätigten Migrationen
0077, 0078, 0083 und **0084 (der Sicherheitsfix aus Teil 81)** sind
erfolgreich im echten Supabase-Projekt gelaufen. Zusammen mit der
Bestätigung aus Teil 83 (0079-0082 liefen bereits vorher) sind damit
**alle Migrationen bis einschließlich 0084 in Produktion aktiv** — auch
die kritische Sicherheitslücke (`profiles.is_admin`-Selbsterhöhung, Teil
81) ist damit tatsächlich geschlossen, nicht nur im Repo behoben.

Kein weiterer offener Deploy-Punkt zum aktuellen Zeitpunkt.

## ✅ Update 13.09.2026 (Teil 83) — Migrationen 0079-0082 waren entgegen der Dokumentation bereits deployt; alle 8 offenen Migrationen idempotent nachgerüstet

Auf Nachfrage der Nutzerin: Sie hatte versucht, die als "offen" gelisteten
Migrationen 0079-0082 im Supabase-SQL-Editor auszuführen — alle vier
kamen mit "already exists" zurück. Das bedeutet, sie waren entgegen der
bisherigen Protokoll-Notizen (die keine Ausführungs-Bestätigung hatten)
**längst deployt** — vermutlich in einer der Sitzungen, in denen die
jeweilige Funktion (Errungenschaften, Tagesplan-Ausnahmen,
Belohnungsfenster-Puffer, Cannabis-Felder) gebaut und getestet wurde,
nur ohne die sonst übliche explizite "✅ erledigt"-Notiz hier im
Protokoll. Exakt das Muster, vor dem Teil 8 (Abschnitt 9) schon mal
gewarnt hatte — nur diesmal umgekehrt (als offen notiert, tatsächlich
längst gelaufen, statt andersherum).

**Alle 8 zu dem Zeitpunkt offen gemeldeten Migrationen (0077-0084)
nachträglich idempotent gemacht** (`create table if not exists`, `add
column if not exists`, `drop policy/trigger if exists` vor `create
policy/trigger` — gleiches Muster wie schon bei 0070/0071/0075/0076 in
Teil 63), damit ein erneuter Ausführungsversuch nie wieder mit einem
Fehler abbricht, egal ob eine Migration schon lief oder nicht. Bestehende
Daten/Policies bleiben davon unberührt, rein additive Absicherung.

**Bestätigter Stand jetzt:**
- **0079, 0080, 0081, 0082 — bereits deployt** (durch "already exists"
  bestätigt).
- **0077, 0078, 0083, 0084 — Status unbestätigt**, keine Rückmeldung der
  Nutzerin dazu, ob "already exists" oder erfolgreich gelaufen. **0084 ist
  davon die dringendste** (siehe Teil 81, Sicherheitsfix).

Commit folgt direkt danach.

Dritter Teil der Aufgabe "Tu das bitte jetzt alles" (nach dem
UI-Durchklick-Test in Teil 80 und der Sicherheitsprüfung in Teil 81).
Stichprobenartig geprüft: Tastaturbedienbarkeit der Bottom-Sheets,
Farbkontraste der Theme-Tokens, fehlender alt-Text.

- **Tastatur:** Keins der Bottom-Sheets/Modals ließ sich per Escape
  schließen, nur per Tap auf Hintergrund oder ×-Knopf — echte Lücke,
  behoben mit neuem, wiederverwendbarem Hook `useEscapeSchliesst.js`,
  verdrahtet in den vier Stellen mit eindeutiger Schließen-Funktion:
  TagebuchModal, TagesEintragBearbeiten, KiChat (nur solange offen),
  TrainingVorschau. (Belohnungsfenster/GrundEingabe/WheelPicker haben
  keinen eigenen Schließen-Handler bzw. sind keine Modals — nicht
  betroffen.)
- **Kontraste:** Alle Theme-Token-Farben gegen Weiß nachgerechnet
  (WCAG-AA, 4.5:1 für normalgroßen Text). Ein echter Treffer:
  `HauptprotokollErstellenView.jsx` nutzte `accent` (~3.7:1) für den
  "Zurück"-Knopftext, jetzt `accentDark` (~9:1, dieselbe Farbe, die
  überall sonst in der App für Text auf Weiß steht). `textMuted` und
  `danger` liegen mit ~4.9:1/~5.0:1 knapp über der Grenze, unverändert
  gelassen.
- **Alt-Text:** alle `<img>`-Tags app-weit geprüft — keine Lücke, jedes
  Bild hat ein `alt` (eines bewusst leer, ein rein dekoratives
  Vorschaubild in AdminUebungsBilderView.jsx).

Build + oxlint danach geprüft: unverändert 12 Warnungen (gleiche
Baseline wie nach dem Code-Audit), keine Regression. Commit `fcae333`,
gepusht.

**Damit ist die Aufgabe "Tu das bitte jetzt alles" vollständig
abgeschlossen** (UI-Test, Sicherheitsprüfung, Barrierefreiheit — die
einzigen Punkte, die von den ursprünglich genannten Testkategorien
tatsächlich in dieser Umgebung durchführbar waren).

## 🚨 KRITISCH — Update 13.09.2026 (Teil 81) — Sicherheitslücke gefunden und behoben: is_admin-Selbsterhöhung — MUSS von der Nutzerin selbst in Supabase deployt werden

**Diese Umgebung hat keinen Supabase-Zugriff** — die Migration liegt nur
im Repo, ist aber noch NICHT im echten Produktions-Supabase-Projekt
angewendet. **Bitte zeitnah selbst im Supabase-Dashboard deployen**
(SQL-Editor → Inhalt von `supabase/migrations/0084_profiles_is_admin_schutz.sql`
ausführen, oder per `supabase db push`, falls die Supabase-CLI lokal
eingerichtet ist).

**Fund (im Rahmen der Sicherheitsprüfung aus Aufgabe "Tu das bitte jetzt
alles"):** Die RLS-Policy "profiles: eigene Zeile aktualisieren"
(`0001_init.sql`) erlaubte jeder eingeloggten Person, JEDE Spalte ihrer
eigenen `profiles`-Zeile per direktem Supabase-Client-Aufruf zu ändern —
auch `is_admin` (siehe `0035_admin_dashboard.sql`). Grund: die Policy hat
kein eigenes `WITH CHECK`; Postgres verwendet dann bei UPDATE die
`USING`-Klausel (`auth.uid() = id`) auch als Schreibprüfung — das prüft
aber nur, WESSEN Zeile geändert wird, nicht WELCHE Spalten. Jede Person
hätte sich also z. B. per
`supabase.from('profiles').update({is_admin:true}).eq('id', eigeneId)`
selbst zur Admin machen können — mit vollem Zugriff auf ~35 Tabellen
(alle "admin voller Zugriff"-Policies aus `0035_admin_dashboard.sql`)
sowie auf die beiden Edge Functions `admin-create-proband` und
`admin-invite-proband`.

**Fix:** `supabase/migrations/0084_profiles_is_admin_schutz.sql` — ein
`BEFORE UPDATE`-Trigger auf `profiles`, der `is_admin` unbemerkt auf den
alten Wert zurücksetzt, außer die aufrufende Person ist selbst bereits
Admin. Rein additiv, alle anderen Profilfelder bleiben normal änderbar.

**Empirisch validiert** (lokales Postgres 16 mit nachgebautem
Supabase-Auth-Stub, nicht nur am Code abgelesen): Exploit-Versuch vor dem
Fix gelang nachweislich (`is_admin` sprang von `false` auf `true`), nach
Anwenden der Migration schlägt derselbe Versuch fehl (bleibt `false`),
während eine normale Spalte (`vorname`) im selben Testlauf weiterhin
änderbar blieb — keine Funktionseinbuße.

Commit: `b4098c4`. **Bereits ins Repo gepusht — aber die eigentliche
Absicherung wird erst wirksam, sobald die Migration im echten
Supabase-Projekt ausgeführt wurde.**

## ✅ Update 13.09.2026, Fortsetzung (Teil 80) — Systematisches Code-Audit der gesamten App abgeschlossen (Teile 1-10)

Nutzerinnen-Vorgabe: "als Ingenieur bzw. UI/UX-Experte und Programmierer
die App im Ganzen noch mal ansehen... in Teile unterteilen und Stück für
Stück nach Bugs, überflüssigem Code prüfen, unprofessionelle Stellen
professioneller gestalten — ohne Funktionen zu verändern oder
einzubüßen." Auftrag: "arbeite so lange wie Du kannst, speicher immer
zwischen."

Die App wurde in 10 Teile eingeteilt (eigene Zählung, unabhängig von
dieser Protokoll-Nummerierung — Commits heißen "Code-Audit Teil N",
1-10). Methodik pro Teil: (1) Export-/Import-Nutzung app-weit per grep
prüfen (Kandidaten für toten Code), (2) Stichproben der größten/
verdächtigsten Dateien lesen, (3) nur echte, sicher risikofreie Funde
beheben (kein Refactoring auf Verdacht, keine Verhaltensänderung), (4)
nach jedem Teil `npm run build` + `npx oxlint` + Commit + Push.

**Ergebnis — alle 10 Teile durchgesehen:**
- **Teil 1 (Fundament)** — AuthContext.jsx fehlte als einziger Lade-Hook
  der cancelled-Schutz gegen StrictMode-Doppel-Mount (nachgezogen); zwei
  Ladebildschirme (App.jsx/AuthenticatedApp.jsx) liefen inkonsistent
  teils mit, teils ohne i18n (vereinheitlicht).
- **Teil 2 (Datenschicht, ~39 Hooks)** — geprüft, keine Änderungen nötig:
  die Rollback-/Fehlerbehandlungs-Arbeit aus früheren Sitzungen (Teile
  30/31/36/41) deckt dieses Gebiet bereits ab.
- **Teil 3 (Services)** — 3 tote AIService-Methoden entfernt
  (peptidAusChat, trainingsplanVorschlag, ernaehrungsplanVorschlag —
  app-weit von nirgends mehr aufgerufen, ~100 Zeilen).
- **Teil 4 (Utils, ~20 Dateien)** — totes clearADHSSettings() entfernt.
- **Teil 5 (UI-Komponenten, ~68 Dateien)** — totes GraceDayCard.jsx
  entfernt (nie importiert, stilistisch ohnehin ein Fremdkörper: harte
  Hex-Farben statt Theme-Token, kein i18n); doppelte Web-Audio-Beep-
  Implementierung in QuickTaskList.jsx nach utils/beep.js zusammengeführt
  (gleicher Klang, ein Ort statt zwei).
- **Teil 6 (Onboarding, 11 Views)** — zwei ungenutzte Imports entfernt
  (OnboardingIntroView.jsx).
- **Teil 7 (Home + Kernbereiche, ~8350 Zeilen)** — 5 Stellen gefunden, an
  denen ein Theme-Token-Farbwert als Hex-String statt als Token
  verwendet wurde (danger/blueSoft), auf die Tokens umgestellt. Bewusst
  NICHT angefasst: hartcodierte Farben im unsichtbaren PDF-Export-Raster
  von WochenuebersichtView.jsx — dort absichtlich unabhängig vom
  Theme, damit ein Export nicht rückwirkend anders aussieht.
- **Teil 8 (Archiv-Hub, 11 Dateien)** — geprüft, keine Funde.
- **Teil 9 (Admin-Bereich, 7 Views)** — geprüft, keine Funde (der
  hartcodierte Indigo-Ton in AdminUebungsBilderView.jsx war bereits in
  Teil 72 dieses Protokolls behoben worden).
- **Teil 10 (i18n + Wissensbasis)** — vollständige Schlüssel-Abdeckung in
  allen 3 Sprachen (de/en/tr) app-weit verifiziert, keine Lücken. Die
  Wissensbasis-Ladefunktion (utils/wissensBasis.js) ist sauber und
  einfach gehalten, keine Änderung nötig.

**Oxlint-Warnungen: Baseline 16 → jetzt 12** (jede Verbesserung kommt aus
diesem Audit, keine Regression — falls die Zahl je über 16 steigt, ist
das ein Bug). Die verbleibenden 12 sind ausschließlich
"react(only-export-components)"-Hinweise (Vite-Fast-Refresh-Detail, ohne
Laufzeit-Auswirkung) — geprüft und bewusst nicht angefasst, da ein Umbau
~9 Dateien nur wegen einer Dev-Tooling-Nicety umstrukturieren würde.

**Gesamtbild:** Die App war schon vor diesem Audit überwiegend sauber
und gut dokumentiert (Ergebnis der vielen vorherigen, gezielten
Bugfix-Sitzungen) — die Funde waren entsprechend klein und punktuell
(vor allem Reste aus abgeschlossenen Umbauten wie der Peptid/Medikamente-
Vereinheitlichung), keine grundlegenden strukturellen Probleme. Jeder
Commit wurde einzeln gebaut/gelintet/gepusht, nichts blieb ungesichert.

## ⚠️ Wichtiger Hinweis für JEDE Claude-Session, die diese Datei liest (Teil 78) — geteilte Umgebung mit dem Kidnapp/Arcanova-Repo

**Falls du das hier liest: Bevor du irgendetwas an diesem Projekt änderst,
prüfe, dass du wirklich im AKA-Repo bist** (React/Vite/JSX-Dateien unter
`src/`, Arbeitsverzeichnis i. d. R. `/home/user/-app-`, `git remote -v`
zeigt `akatince-png/-app-` bzw. `akatince-png/-App-`) — siehe auch den
Warnhinweis ganz oben in `CLAUDE.md`.

**Hintergrund (13.09., per `get_session`/`list_environments` nachgeprüft,
nicht nur vermutet):** Die Claude-Code-Umgebung, in der diese und viele
frühere Sessions laufen, heißt **"peptid-app/, dort claude starten."**
(`env_01NuWbRyiyPxpiFB9YCpzbNY`) und hat **beide** Repos als Quelle
eingetragen — `akatince-png/Kidnapp` (Arcanova, Kinder-App) UND
`akatince-png/-app-` (diese App, AKA, Erwachsenen-App). Beide liegen
deshalb im selben Container nebeneinander auf der Platte
(`/home/user/Kidnapp` und `/home/user/-app-`). Das ist der technische
Grund, warum es in der Vergangenheit mehrfach zu Verwechslungen zwischen
den beiden Apps kam — nicht nur ein Flüchtigkeitsfehler beim Lesen des
Verlaufs. Die Session-Metadaten deuten Kidnapp als "primäres" Repo dieser
Umgebung an (der getrackte Branch/die "outcomes" zeigen auf Kidnapp) —
eine frisch gestartete Session in derselben Umgebung landet deshalb
vermutlich zunächst in `/home/user/Kidnapp`, auch wenn es eigentlich um
AKA gehen soll.

**Was das für dich (Claude) bedeutet, falls eine neue Session hier
weitermachen soll:** Wenn die Nutzerin von "Aka", "der Coaching-App" oder
Ähnlichem spricht, aber das aktuelle Arbeitsverzeichnis/CLAUDE.md auf
Kidnapp/Arcanova zeigt (reine `index.html`, Kinder-App-Sprache), NICHT
einfach loslegen — erst zu `/home/user/-app-` wechseln bzw. per `add_repo`
nachladen, falls das Repo im Container fehlt, und die Diskrepanz notfalls
kurz ansprechen (siehe frühere Session, in der genau das über
`AskUserQuestion` geklärt wurde, bevor am Tagebuch-Feature weitergearbeitet
wurde).

**Transkriptionsfehler, extra hier festgehalten (siehe auch CLAUDE.md):**
Die Nutzerin sagt "Aka" (den App-internen KI-Coach-Namen), die
Spracherkennung macht daraus oft **"Acker"** oder "Ecker" — das ist
IMMER als "Aka"/"AKA" zu lesen, nie als eigenständiges Wort oder gar als
Hinweis auf ein drittes Projekt.

**Zukunftsplan der Nutzerin (noch NICHT umgesetzt, Stand 13.09.):** Sie
möchte die beiden Apps auf Umgebungsebene sauber trennen — zwei eigene
Claude-Code-Umgebungen, je eine ausschließlich mit einem der beiden
Repos als Quelle, damit eine Session strukturell gar nicht mehr an die
falsche App geraten kann. Das ist aktuell bewusst zurückgestellt ("ist
mir jetzt im Moment ein bisschen zu umständlich") — bis dahin bleibt die
geteilte Umgebung bestehen, und die Prüfung oben (Arbeitsverzeichnis/
CLAUDE.md/`git remote`) ist der einzige Schutz. Sollte die Trennung
später nachgeholt werden, kann dieser gesamte Abschnitt (Teil 78)
gelöscht/verkürzt werden.

## ✅ Update 13.09.2026, Fortsetzung (Teil 77) — Tagebuch: eigener Archiv-Reiter mit PDF-Export statt Liste im Schreibfenster

Nutzerinnen-Vorgabe: "Die Tagebucheinträge sollen als PDF abgespeichert
werden, also so als A4-Seite... und sollen halt auch aussehen wie eine
Tagebuchseite... wenn ich etwas abgespeichert habe, will ich das nächste
Mal, wenn ich das Feld Tagebuch aufrufe, nicht unten sehen, was ich
zuletzt abgespeichert hatte, sondern es soll... im Archivbereich einen
Button geben, wo Tagebuch steht... die einzelnen Seiten nachlesen...
einsehen... als PDF herunterladen... wie es mit den anderen Protokollen
auch ist."

Neuer Reiter **"Tagebuch"** im Archiv-Hub (`PlanView.jsx`, neue
`TagebuchTab.jsx`, `AuthenticatedApp.jsx` `ARCHIV_VIEW_IDS`) — genau wie
die anderen Protokoll-Reiter dort (Protokolle/Statistik/Erfolge/...):
Liste aller gespeicherten Seiten (Datum + antippbarer Ausschnitt zum
Nachlesen/Ausklappen), pro Seite ein "Als PDF herunterladen"-Knopf sowie
weiterhin "Löschen". Nutzt `exportElementAsPdf()` (`utils/pdfExport.js`),
dieselbe bereits vorhandene clientseitige jsPDF/html2canvas-Funktion, die
schon für die Wochenübersicht im Einsatz ist — läuft komplett lokal auf
dem Gerät, nichts wird hochgeladen (bleibt damit konsistent zur
Datenschutz-Vorgabe aus Teil 73).

Die exportierte Seite ist bewusst wie eine echte Tagebuchseite gestaltet:
A4-Format (595×842pt, per `strings`/`MediaBox` verifiziert), Serifenschrift,
kleine "TAGEBUCH"-Kopfzeile, volles Datum kursiv, dezente Trennlinie,
großzügige Ränder. Bug beim ersten Entwurf (per Playwright-PDF-Test
gefunden, vor dem Commit behoben): ein `minHeight` in exakter A4-Höhe
(1123px) führte bei kurzen Einträgen durch einen Rundungsfehler in
`exportElementAsPdf()`s Paginierung zu einer fast leeren zweiten Seite
(`/Count 2` statt `1`) — ohne festes `minHeight` endet die Seite jetzt
einfach dort, wo der Text aufhört, bei langen Einträgen paginiert die
bestehende Logik weiterhin ganz normal.

`TagebuchModal.jsx` (das Schreibfenster) zeigt jetzt **keine** Liste
bisheriger Einträge mehr — nach dem Speichern erscheint stattdessen ein
Bestätigungsbildschirm mit einem Knopf direkt zum neuen Tagebuch-Archiv
(`onOpenArchiv`-Prop, von `HomeView.jsx` auf `onOpenView("tagebuch")`
verdrahtet, landet dank der bestehenden `ARCHIV_VIEW_IDS`-Weiche direkt
auf dem neuen Reiter) oder alternativ "Noch eine Seite schreiben".

Verifiziert per Playwright: Archiv-Liste mit zwei Testeinträgen
(aufklappen/einklappen funktioniert), echter PDF-Download ausgelöst und
geprüft (Chromiums PDF-Viewer gerendert: 1 Seite, A4, korrekt gestaltet),
Schreibfenster zeigt nach dem Speichern den neuen Bestätigungsbildschirm
statt der alten Liste. `npm run build` + `npx oxlint` weiterhin grün
(16 Warnungen, unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 76) — Orden auch auf den Direktzugriff-Kacheln (sichtbar auf jedem Gerät)

Direkte Nachbesserung zu Teil 75: "Die Orden dieser Punkte sollen für
die Nutzer sichtlicher sein. Vielleicht machen wir's auch so, dass das
in der Tabletfunktion... für mich so ersichtlich ist und für die Nutzer
unten in ihren kleinen Feldern." Nach Rückfrage (Kachel-Lösung für alle
vs. Trennung nach Rolle vs. beides) hat sich die Nutzerin für die
Kachel-Lösung für alle entschieden — kein Rollen-Unterschied.

Grund für die Rückfrage: die Orden-Leiste aus Teil 75 sitzt nur ab
Tablet-Breite (≥1024px) rechts neben dem Balkendiagramm — auf dem Handy
war sie dadurch komplett unsichtbar, obwohl die eigentlichen
Nutzer:innen (Probanden) die App überwiegend auf dem Handy verwenden.

Umsetzung: `MiniPlanWidget.jsx` (die kleinen Kategorie-Kacheln im
"Direktzugriff"-Bereich, sichtbar auf jedem Gerät) bekommt einen neuen
optionalen `orden`-Prop — ein kleiner Kreis auf der Kartenecke (leicht
negativer Versatz, weißer Rand, damit er nicht über den Kategorienamen
läuft — im ersten Entwurf wurde "Gewohnheiten" so zu "ewohnheiten",
beim Playwright-Screenshot aufgefallen und vor dem Commit korrigiert).
Grau/transparent, solange kein Streak-Meilenstein erreicht ist, farbig
im Kategorie-Verlauf sobald einer geschafft ist — exakt dieselbe
Freischalt-Logik wie die Tablet-Leiste, jetzt aus `utils/
errungenschaften.js` (`WIDGET_ZU_ORDEN_KATEGORIE`/
`ordenFuerWidgetKategorie`) ausgelagert, damit beide Stellen dieselbe
Logik nutzen statt sie zu duplizieren. Die Tablet-Leiste selbst bleibt
unverändert bestehen (weiterhin für alle, nicht admin-exklusiv).

Verifiziert über einen isolierten Playwright-Preview-Aufbau (nur
`MiniPlanWidget` mit Beispiel-Kacheln/Orden-Zuständen) bei 400px
(Handy-Breite) — Badges korrekt grau vs. farbig, keine Text-Überlappung
mehr nach der Korrektur, keine Konsolenfehler. `npm run build` +
`npx oxlint` weiterhin grün (16 Warnungen, unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 75) — Tablet: Orden-Vorschau rechts neben Tagesfortschritt-Balkendiagramm

Nutzerinnen-Vorgabe anhand eines Tablet-Screenshots: "die Balken, die den
Tageserfolg anzeigen, sind relativ links zentriert und rechts in diesem
Feld ist recht viel Platz... wenn dann Pläne gestellt wurden, die
nächsten und potenziellen Orden dort angezeigt werden, noch in so einem
durchsichtigen Modus, weil sie noch nicht erreicht wurden, sollen erst
dann Farbe bekommen und ihre Punktzahl angezeigt bekommen, wenn Ziel
erreicht wurde... eher links die Tabelle, rechts die Ordner."

Neue Komponente `TagesfortschrittOrden.jsx`: pro Lebensbereich, für den
bereits ein Plan eingerichtet ist (dasselbe `widget.aktiv` wie im
Balkendiagramm selbst — kein Orden-Platz für noch gar nicht eingerichtete
Bereiche), ein kleiner Orden-Platz rechts neben dem Balkendiagramm:
grau/transparent (0.55 Deckkraft), solange noch kein Streak-Meilenstein
(7/14/28/... Tage, siehe `utils/errungenschaften.js`) erreicht ist —
sobald einer erreicht ist, voll eingefärbt im Kategorie-Farbverlauf
(gleiche Optik wie die "Alle Abzeichen"-Ansicht in `ErfolgeTab.jsx`) mit
der erreichten Tage-Zahl statt der Platzhalter-Zahl.

`HomeView.jsx` zieht dafür jetzt dieselben Erfolge-Quelldaten wie
`ErfolgeTab.jsx` heran und nutzt denselben `useErrungenschaften()`-Hook —
ein Orden wird hier also exakt dann farbig, wenn es das auch im
Archiv-Reiter "Erfolge" ist. Nebeneffekt (gewollt): Orden werden dadurch
jetzt schon beim Öffnen von Home vergeben/gespeichert, nicht erst nach
einem Besuch im Erfolge-Reiter.

Responsive Lösung fürs Handy (zweiter Teil der Vorgabe: "wie man diese
Ansicht auf der App-Funktion generiert, weil dort ja die Tabelle gleich
direkt den gesamten Balken einnimmt"): neue CSS-Klasse
`.mp-tagesfortschritt-grid` nach demselben Breakpoint-Muster wie
`.mp-ordner-grid`/`.mp-app-shell` (`index.css`) — ab 1024px zweispaltig
mit den Orden rechtsbündig, darunter unverändert nur das Balkendiagramm
wie bisher, das die Breite auf dem Handy ohnehin schon ausfüllt.

Verifiziert über einen isolierten Playwright-Preview-Aufbau (nur
`TagesfortschrittBalken`/`TagesfortschrittOrden` mit Beispiel-Widgets/
-Kategorien, ohne den kompletten `AppDataContext`, da beide Komponenten
rein aus Props rendern) bei 375px (Handy, nur Balken), 1024px und 1200px
(Tablet, Balken links + Orden rechtsbündig, grau vs. farbig korrekt
gemischt) — keine Konsolenfehler. `npm run build` + `npx oxlint`
weiterhin grün (16 Warnungen, unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 74) — Tagebuch: Datumszeile + unbegrenzte Zeichenzahl

Direkte Nachbesserung zu Teil 73: "soll natürlich oben dann das aktuelle
Datum und die Uhrzeit stehen... so wie es halt in einem Tagebuch wäre"
sowie "Zeichen sollen unbegrenzt sein."

`TagebuchModal.jsx` zeigt jetzt über dem Schreibfeld eine Kopfzeile im
vollen Tagebuch-Stil ("Sonntag, 13. September 2026, 13:50 Uhr" statt der
knappen Kurzform aus `dates.js`, die anderswo für Listenzeilen reicht),
die sich alle 30 Sekunden aktualisiert, solange das Fenster offen ist.
Der tatsächlich beim Speichern dokumentierte Zeitstempel kommt weiterhin
aus dem echten Speicherzeitpunkt in `tagebuchStorage.js` — die
Kopfzeile ist nur die live sichtbare Anzeige während des Schreibens.

Zeichenzahl war schon vorher an keiner Stelle begrenzt (weder im
Textfeld noch beim Speichern noch bei der Aka-Überarbeitung) — per
Playwright mit 5000 Zeichen am Stück bestätigt, zusätzlich per Kommentar
im Code festgehalten, damit später niemand versehentlich ein `maxLength`
einbaut.

`npm run build` + `npx oxlint` weiterhin grün (16 Warnungen, unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 73) — Neue Funktion: Tagebuch (lokal, mit Diktierfunktion + Aka-Überarbeitung)

Nutzerinnen-Vorgabe: "integrier unten neben dem Button neue Pläne in
dieser Reihe mit den Ordnern einen gleichgroßen Button mit der Funktion
Tagebuch... mithilfe der Diktierfunktion und einer eingestellten
Rechtschreibhilfe oder mithilfe von Aka, der das Ganze dann noch mal
zusammenfasst... Und das soll dann abspeicherbar sein."

Neue Kachel "Tagebuch" auf Home (`HomeView.jsx`), direkt in derselben
Zeile/demselben Grid (`.mp-ordner-grid`) wie die drei Ordner-Kacheln
(Alle Pläne/Archiv/Mehr), gleiche Größe/Form/Icon-Stil (neues `book`-
Icon in `Icon.jsx`, passend zum bestehenden Linien-Icon-Set statt
Emoji). Öffnet `TagebuchModal.jsx`, ein Bottom-Sheet nach demselben
Muster wie `TagesEintragBearbeiten.jsx`:

- Textfeld im Tagebuch-"Seiten"-Look (serifenbetonte Schrift), mit
  `spellCheck` (geräteeigene Rechtschreibhilfe) und einem
  Mikrofon-Knopf, der über die bereits vorhandene Spracherkennung
  (`utils/speech.js`, `starteSprachErkennung`) diktierten Text laufend
  anhängt.
- "Mit Aka überarbeiten"-Knopf (neue Methode `AIService.tagebuchUeberarbeiten({text})`
  in `aiService.js`): rein sprachliche Glättung (Rechtschreibung/
  Grammatik/Lesefluss), verändert laut System-Prompt ausdrücklich NIE
  Inhalt, Bedeutung oder Ton. Ergebnis erscheint als Vorschlag mit
  "Übernehmen"/"Verwerfen" — wird nie automatisch übernommen, die
  Person sieht immer erst, wie die überarbeitete Seite aussehen würde.
- Speichern-Knopf + darunter eine Liste bisheriger Einträge (Datum,
  antippbar zum Aus-/Einklappen, mit Löschen-Option) — sonst wären
  gespeicherte Einträge unsichtbar und die Funktion kaum nutzbar.

**Datenschutz (wörtliche Vorgabe der Nutzerin):** "aufgrund der
Datenschutzrichtlinien möchte ich, dass man diese Daten nur auf seinem
Handy abspeichern kann... und nicht auch auf irgendeinem anderen
Speicher." Tagebuch-Einträge laufen deshalb bewusst NICHT über
`useAppData()`/`AppDataContext` (das würde über kurz oder lang zu einer
Supabase-Tabelle verleiten), sondern über ein komplett eigenständiges,
rein lokales Modul `utils/tagebuchStorage.js` (`localStorage`, analog zu
`adhsStorage.js`) — die Texte selbst erreichen Supabase/die Cloud zu
keinem Zeitpunkt. Die einzige Stelle, an der ein Tagebuchtext das Gerät
überhaupt verlässt, ist der explizit angetippte "Mit Aka
überarbeiten"-Knopf (kurzzeitig, zum Überarbeiten, nichts wird dabei
gespeichert) — alles andere (Schreiben, Diktieren, Speichern, Anzeigen,
Löschen) bleibt vollständig auf dem Gerät.

Verifiziert über einen isolierten Playwright-Preview-Aufbau (nur
`TagebuchModal.jsx`, ohne `AppDataContext`, da die Komponente bewusst
keine Abhängigkeit dorthin hat): Text eingeben → Vorschau/Fehlerfall bei
"Mit Aka überarbeiten" gegen einen nicht erreichbaren Dummy-Backend
(schlägt sauber mit Fehlermeldung fehl, kein Absturz) → Speichern (echtes
`localStorage`, Eintrag korrekt persistiert und nach Neuöffnen des
Fensters in der Liste sichtbar). `npm run build` + `npx oxlint` (weiterhin
16 Warnungen, unverändert) beide grün.

## ✅ Update 13.09.2026, Fortsetzung (Teil 72) — Button-Farben app-weit vereinheitlicht (Türkis statt Indigo als Rückfall)

Nutzerinnen-Vorgabe anhand zweier Screenshots (Routinen-Ansicht vs.
Admin-Dashboard): "dass die Bereiche in verschiedenen Modulen
verschiedene Farben haben, irritiert ein bisschen... bring bitte...
alle Buttonbereiche wieder auf diese türkise Farbe wie im ersten Bild."

Ursache gefunden: `theme.js` definiert einen generischen Marken-Akzent
(`accent`/`accentDark`/`accentSoft`) als Rückfallfarbe für alle
Bereiche OHNE eigenen `KATEGORIE_META`-Eintrag (Admin, Sidebar-
Auswahlfarbe, Onboarding-Gerüst, generische `PrimaryButton`s) —
`PrimaryButton`/`Pill`/`CheckRow`/`Stepper` lesen diese Farbe über
`useBereichColor()`/`BereichColorContext.jsx` automatisch, sobald
`<Shell bereich="...">` keinen bekannten `KATEGORIE_META`-Schlüssel
bekommt. Dieser Rückfall wurde am 28.07. auf Indigo/Blau umgestellt.
Bereiche mit EIGENER `KATEGORIE_META`-Farbe (z. B. Gewohnheiten/
Routinen, `bereich="gewohnheit"` → Türkis `#24948E`) blieben davon
unberührt — dadurch liefen "neue" generische Bereiche (Indigo) und
"alte" Bereiche wie Gewohnheiten/Routinen (weiterhin Türkis) sichtbar
auseinander.

Fix: `accent`/`accentDark`/`accentSoft` in `theme.js` jetzt exakt
identisch mit `KATEGORIE_META.gewohnheit` (`dot`/`text`/`bg`) — bewusst
dieselben drei Werte, nicht nur ein ähnlicher Farbton, damit generische
und Gewohnheiten-Bereiche exakt zusammenpassen. Kategorie-eigene
Bereiche (Training rot, Hydration blau, Tageslicht gold, Medikamente
lila, ...) bleiben komplett unverändert, da sie unabhängig aus
`KATEGORIE_META` kommen — betroffen ist wirklich nur der Rückfall.

Zusätzlich 3 Stellen gefunden, die die alte Indigo-Farbe unabhängig vom
theme.js-Token hart codiert hatten (wären durch die Token-Änderung
NICHT automatisch mit-aktualisiert worden):
- `ADHSModeToggle.jsx` (Normalmodus-Verlauf auf Home — war sogar die
  ursprüngliche Referenzfarbe für die Indigo-Wahl vom 28.07.)
- `AdminUebungsBilderView.jsx` ("Hochladen"/"Ersetzen"-Knopf)
- `TagesEintragBearbeiten.jsx` (Ausnahme-Hinweis-Badge)

Alle drei jetzt über die theme.js-Token (`accent`/`accentDark`/
`accentSoft`) statt eigener Hex-Werte, damit künftige Farbänderungen an
einer einzigen Stelle wirken.

Verifiziert über Playwright-Preview: Home (Normalmodus-Umschalter,
"+ Neues Protokoll"-Kachel) und Admin-Dashboard ("Coach-Übersicht")
zeigen jetzt dasselbe Türkis wie die Gewohnheiten/Routinen-Ansicht;
kategorie-eigene Farben bleiben unverändert bunt. Build + `npx oxlint`
weiterhin bei 16 Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 71) — Onboarding-Supplemente-Schritt: korrekten KI-Baustein verwenden

Nachtrag zu Teil 70: Nutzerin fragte nach, wie groß die dort als "eigene
Baustelle" dokumentierte, nicht gefixte Sache sei ("supplemente"-
Onboarding-Schritt ruft `AIService.peptidAusChat()` statt eines eigenen
Prompts auf). Einschätzung: praktisch klein — das eigentliche Gespräch
mit dem Coach lief schon über eigene, korrekte Supplement-Prompts, nur
der unsichtbare Abschluss-Schritt (Gespräch → strukturierte Daten) war
falsch beschriftet; die extrahierten Felder passen trotzdem exakt
zusammen (kein Absturz, kein Datenverlust), und das Ergebnis lässt sich
vor dem Speichern im Formular noch prüfen/korrigieren.

Da der Fix trotzdem klein und risikoarm war, gleich erledigt: Es gab
bereits einen passenden, korrekt beschrifteten Baustein
(`AIService.supplementAusChat()`, exakt kompatibles Feld-Format) — nur
nie an dieser Stelle verwendet. `OnboardingCategoriesView.jsx` ruft
jetzt `supplementAusChat()` statt `peptidAusChat()` auf. Build + `npx
oxlint` weiterhin bei 16 Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 70) — Medikamente/Hormone/Peptide app-weit vereinheitlicht

Nutzerinnen-Vorgabe: "Bitte den Bereich Medikamente, Hormone nur in
Medikamente umbenennen und das in allen Bereichen in der App. Ich
möchte nicht mehr, dass Medikamente unterschieden werden von Peptiden,
Hormonen oder sonstigen Dingen... Falls es ein grundlegendes Problem im
Code gibt, wo Medikamente und Peptide weiterhin getrennt... geführt
werden, möchte ich, dass Du das auch in Ordnung bringst."

Die Recherche ergab: es war keine reine Umbenennungsfrage — es gab
tatsächlich ein separates, verwaistes Peptid-System, das parallel zum
längst vereinheitlichten Medikamente/Hormone-System existierte, ohne
dass es der Nutzerin je sichtbar funktioniert hätte (buildDayItems()
vergibt seit Migration 0042, 13.08., nur noch die Kategorie "hormon",
nie "peptid" — TagesplanView.jsx enthielt trotzdem noch einen eigenen,
technisch unerreichbaren "peptid"-Feedback-Zweig mit Stärke-Auswahl und
Einstichstellen-Foto):

- **`src/data/usePeptideLogs.js` gelöscht** — eigener `peptide_logs`-
  Feedback-Hook, dessen einziger Aufrufpfad (TagesplanView.jsx,
  `item.kategorie === "peptid"`) nie erreicht werden konnte. Verdrahtung
  in `AppDataContext.jsx` entfernt.
- **`TagesplanView.jsx`**: toten "peptid"-Feedback-Zweig entfernt
  (FEEDBACK_HEADER, Kategorie-Listen, Stärke-/Foto-Felder im
  Feedback-Formular).
- **`OnboardingCategoriesView.jsx`**: kompletten toten "peptide"-
  Onboarding-Schritt entfernt (Auswahl/Dosierung/Foto-UI, KiChat-
  Anbindung, Coach-Prompts, Submit-Guard) — `CATEGORY_STEPS`
  (`categorySteps.js`) enthält seit der Datenzusammenlegung gar keinen
  solchen Schritt mehr ("kein eigener Schritt mehr" steht da schon
  länger als Kommentar), der zugehörige Code war aber nie aufgeräumt
  worden. Örtlich definierte Wrapper (`peptide`/`togglePeptid`/
  `addCustomPreparat`/...) leiteten zwar schon korrekt auf die
  vereinheitlichten `hormonHinzufuegen`/`hormonDosierung`-Funktionen um
  (Bug-Fix aus einer früheren Session, 11.09.) — waren aber wegen des
  fehlenden Schritts trotzdem nie erreichbar.
- **`MedikamenteView.jsx`**: separate "🔔 Erinnerungen Peptide"-Kachel
  entfernt — nur noch eine "🔔 Erinnerungen Medikamente"-Erinnerung für
  alle Medikamente-Einträge (Peptide eingeschlossen, da technisch
  ohnehin schon derselbe Tabelleneintrag mit Kategorie "Peptid").
- **`utils/errungenschaften.js`**: Erfolge-Label "Hormone & Medikamente"
  → "Medikamente" (Icons/Farben blieben unverändert, siehe Teil 66/67).
- **Nutzer:innen-sichtbare Texte vereinheitlicht**: KiChat-Einleitungen/
  Systemprompts in `MedikamenteView.jsx` und `OnboardingCategoriesView.jsx`
  ("Medikament oder Hormon" → "Medikament"), Formularvorlage
  "Protokoll 8: Medikamente / Hormone" → "Protokoll 8: Medikamente"
  (`data/formulareVorlagen.js`), Willkommens-Screen (DE/EN/TR,
  `i18n/dict/welcome.js`) listet "Peptide, Hormone" nicht mehr separat
  neben "Medikamente" auf.

**Bewusst NICHT angefasst**, da außerhalb der eigentlichen Anfrage bzw.
mit echten Live-Daten/-Funktionen verbunden:
- die "Kategorie"-Unterscheidung INNERHALB eines Medikamenten-Eintrags
  (Hormone/Peptid/Blutdruck/Diabetes/... als Dropdown-Wert beim
  Anlegen) — bleibt als sinnvoller Sub-Typ bestehen, genau wie
  Cannabis/Schmerzmittel/Sonstige.
- der Lexikon-Wissensbestand zu Peptiden (`i18n/dict/peptid.js`) —
  Sachinhalt (was bewirkt ein bestimmtes Peptid), keine
  Struktur-/Trennungsfrage.
- `useProtocolData.js`/`ziele`/`protokollArchivieren`/`ArchivTab.jsx`
  ("Aktuelles Protokoll archivieren") — beim genaueren Hinsehen eine
  aktive, von Peptiden unabhängige "Ziele"-Funktion des laufenden
  Hauptprotokolls (siehe `OnboardingZieleView.jsx`,
  `OnboardingCoachGuide.jsx`) — wird beim "+ Neues Protokoll"-Klick
  echt verwendet, keine Peptid-Altlast.

**Nebenbei entdeckt, aber bewusst NICHT gefixt** (eigene Baustelle):
der "supplemente"-Onboarding-Schritt ruft `AIService.peptidAusChat()`
statt eines eigenen Supplement-Prompts auf — vermutlich ein
Kopierfehler aus früherer Zeit. Dokumentiert direkt im Code
(`aiService.js`), nicht angefasst, um den Umfang dieser Änderung nicht
zusätzlich zu vergrößern.

Verifiziert über Debug-Preview-Seiten (Playwright): `KATEGORIEN`-Liste
zeigt jetzt `"medikamente": "Medikamente"` statt `"Hormone &
Medikamente"`. Build + `npx oxlint` weiterhin bei 16 Warnungen
(Baseline unverändert) — trotz 10 geänderter Dateien und einer
gelöschten (426 Zeilen entfernt, 41 hinzugefügt, netto deutlich
schlanker).

## ✅ Update 13.09.2026, Fortsetzung (Teil 69) — Sunrise-Icon nachgebessert + Peptide/Getränke-Rezepte als Erfolge-Kategorien entfernt

Nutzerinnen-Feedback zu Teil 68:

**1) Sunrise-Icon schwer erkennbar.** "die man erkennt nicht so wirklich,
dass das eine Sonne ist... zwei, drei Sonnenstrahlstriche mehr...
Meinetwegen vier Striche mit Lücke drumrum". Von 2 auf 4 Strahlen
erweitert, alle mit durchgängiger Lücke zum Halbkreis (vorher war die
Lücke inkonsistent — der senkrechte Strahl saß direkt am Bogen, die zwei
diagonalen hatten Abstand). Symmetrisch um die Mittelachse verteilt.

**2) "Peptide"/"Hormone" als eigene Erfolge-Kategorie auflösen.**
"insbesondere den Bereich Peptinen und Hormone kannst Du eigentlich
auflösen, weil der nicht relevant ist. Der hat ja... gehört ja auch zum
Medikamententeil... Falls es ein grundlegendes Problem im Code gibt...
möchte ich, dass Du das auch in Ordnung bringst."

Recherche bestätigte einen echten, vorbestehenden Bug: Die separate
"Peptide"-Abzeichen-Kategorie in `utils/errungenschaften.js` las ein
Feld `erledigt` aus `useAppData()` (in `ErfolgeTab.jsx` lokal als
`peptidErledigt` aliasiert) — dieses Feld existiert im `AppDataContext`
gar nicht. Die Kategorie war dadurch technisch immer leer, die
zugehörigen Abzeichen faktisch unerreichbar — kein bewusstes Feature,
sondern Code-Leiche. Peptide sind seit Migration 0042 (13.08.) ohnehin
Teil von "hormon"/Medikamente (eigener Kommentar dort bestätigt das).
Komplett entfernt: der `KATEGORIEN`-Eintrag selbst sowie die tote
`peptidErledigt`-Verdrahtung durch `ErfolgeTab.jsx` und
`useErrungenschaften.js`.

**3) Getränke-Rezepte als Erfolge-Kategorie raus.** "Getränkemischung...
kannste auch rausnehmen... die muss auch keiner mit Belohnungen
versehen. Die Getränkemischungen... können Teil einer Supplementegabe,
eines Trainings oder einer Morgenroutine/Abendroutine sein." Die
"drinks"-Kategorie aus `KATEGORIEN` entfernt — die zugrundeliegende
Tracking-Funktion (`rezeptErledigt`/`toggleRezeptErledigt` in
`SupplementeView.jsx`) bleibt unverändert und funktioniert weiter, nur
ohne eigenen Abzeichen-/Streak-Satz im Erfolge-Tab.

11 statt 13 Kategorien im Erfolge-Tab übrig (Morgenroutine, Abendroutine,
Schlaf, Hydration, Tageslicht, Ernährung, Training, Supplemente,
Hormone & Medikamente, Gewohnheiten, Atemübungen). Die Punktevergabe je
Kategorie (aktuell überall 1 Punkt/Eintrag) bleibt bewusst unverändert —
laut Nutzerin ein separates, späteres Thema ("da können wir gerne noch
mal später dran arbeiten, welches Punktesystem...").

Verifiziert über eine Debug-Preview-Seite (Playwright-Screenshot):
Icon-Vergleich vorher/nachher sowie die vollständige `KATEGORIEN`-Liste
mit Kategorienzahl. Build + `npx oxlint` weiterhin bei 16 Warnungen
(Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 68) — Eigenes "sunrise"-Icon für die Morgenroutine

Nutzerinnen-Vorgabe: "das Symbol für die Morgenroutine von einer Sonne zu
einer aufgehenden Sonne... sodass einfach nur 'n Spiegelstrich unten ist
und man nur eine halbe Sonne sieht, damit man das vom Tageslicht
unterscheiden kann" — Morgenroutine und Tageslicht teilten sich bisher
beide das volle "sun"-Icon (seit Teil 66/67 an mehreren Stellen app-weit
konsistent verwendet).

Neues Icon `sunrise` im zentralen Linien-Icon-Set (`src/ui/Icon.jsx`):
Halbkreis, der auf einer Horizontlinie "aufgeht", mit drei Strahlen
darüber — bewusst kein Pfeil o. Ä., genau wie beschrieben nur Halbkreis +
Linie. An allen Stellen ersetzt, die bisher "sun" für Morgenroutine
verwendet haben (dieselbe Konsistenz-Logik wie in Teil 66/67):
`PLAENE_TABS` (`constants.js`), `KATEGORIEN` (`utils/errungenschaften.js`),
`ROUTINE_ICON` (`HomeView.jsx`), sowie die beiden Belohnungsfenster-
Aufrufe in `RoutineAblauf.jsx` und `useRoutinen.js`. Tageslicht behält
die volle Sonne unverändert, damit sich beide jetzt klar unterscheiden.

Dabei einen echten Bug in `useRoutinen.js` gefunden und mitgefixt: das
Belohnungsfenster-Icon beim Abschließen eines einzelnen Routine-Schritts
war fest auf `"sun"` verdrahtet, unabhängig davon, ob es sich um einen
Morgen- oder Abend-Schritt handelte — Abendroutine-Schritte zeigten also
fälschlich eine Sonne statt eines Monds. Jetzt wie in `RoutineAblauf.jsx`
nach `schritt.routine` unterschieden.

Verifiziert über eine Debug-Preview-Seite (Playwright-Screenshot):
sunrise/sun/moon nebeneinander sowie das Icon in der tatsächlichen
14px-Balkengröße. Build + `npx oxlint` weiterhin bei 16 Warnungen
(Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 67) — Eine Farbskala app-weit: Erfolge/Belohnungsbereich an Home/Pläne angeglichen

Nutzerinnen-Vorgabe nach Teil 66: "Gerne die gleichen Symbole, wie Du
verwendet hast im Belohnungsbereich... Du solltest die gleichen Farben
benutzen, die ohnehin schon hinterlegt sind... die Pläne müssen überall
die gleichen Farben haben in der gesamten App."

Recherche ergab: Icons stimmten bereits überein (cross/capsule/utensils/
dumbbell/target/droplet/sun/moon/wind — dieselben Namen in
`KATEGORIE_META` wie in den Erfolge-Abzeichen `utils/errungenschaften.js`).
Die FARBEN aber nicht — die App hatte tatsächlich zwei parallele
Farbskalen:
- `KATEGORIE_META[...].dot` (`src/utils/dayItems.js`) — 12 eigene Farben,
  eine je Kategorie. Wird für den Home-Tagesfortschritt-Balken UND für
  die "Alle Pläne"-Reiter (`PlaeneView.jsx`, Zeile `KATEGORIE_META[...]
  .dot`) verwendet — diese beiden waren also schon vorher konsistent.
- `F_WARM`/`F_SLATE`/`F_PLUM`/`F_EMERALD` (`src/constants.js`) — nur 4
  Gradient-Familien, JE FAMILIE über mehrere Kategorien hinweg geteilt.
  Wurde bisher für die Erfolge-/Abzeichen-Kacheln in `ErfolgeTab.jsx`
  verwendet (via `utils/errungenschaften.js`, `KATEGORIEN[...].grad`) —
  "Training" erschien dort dadurch bräunlich-orange statt rot wie überall
  sonst, "Hydration" grün statt blau usw.

Fix: `utils/errungenschaften.js` bezieht die Farbe jeder Kategorie jetzt
aus `KATEGORIE_META[...].dot` statt aus den 4 Gradient-Familien (neuer
`gradAus()`-Helper baut daraus weiterhin einen sanften Verlauf zur
aufgehellten Variante, via dem schon bestehenden `aufhellen()`-Helper aus
`ui/theme.js` — gleiches Muster wie in `primitives.jsx`). Morgen-/
Abendroutine ohne eigenen `KATEGORIE_META`-Eintrag bekommen die schon an
anderer Stelle etablierte Farbe (`ROUTINE_FARBE`/`EIGENE_TAB_FARBE`).
Peptide/Getränke-Rezepte (ebenfalls ohne eigenen Eintrag) übernehmen die
Farbe der inhaltlich nächsten Kategorie (Medikamente bzw. Hydration).

`constants.js` (`F_WARM` usw., `PLAENE_TABS.grad`) bewusst unangetastet
gelassen — dieses `grad`-Feld wird nirgends gerendert (toter Code, siehe
`PlaeneView.jsx`, das für die Reiterfarbe längst `KATEGORIE_META[...]
.dot` nutzt statt `PLAENE_TABS.grad`), also kein sichtbarer Unterschied
und kein Grund, das in diesem Zug mit anzufassen.

Verifiziert über eine Debug-Preview-Seite (Playwright-Screenshot), die
beide Farblisten (`KATEGORIEN` aus errungenschaften.js und
`KATEGORIE_META`) nebeneinander als Farbkreise rendert — bestätigt Hex-
für-Hex identische Farben je Kategorie. Build + `npx oxlint` weiterhin
bei 16 Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 66) — Tagesfortschritt-Balken: Kategorie-Icons als zusätzlicher Anker

Nutzerinnen-Vorgabe: "kleine Symbole unter die Balken setzen, damit man
nicht nur an der Farbe, sondern auch an diesem Symbol erkennt, um welche
Protokollart es sich handelt... damit die Vernetzung im Gehirn
stattfindet... kleine Anker". Bisher stand unter jedem Balken nur ein
7px-Farbpunkt (identisch geformt, nur die Farbe unterschied sich).

`KATEGORIE_META` (`src/utils/dayItems.js`) bekommt ein neues `icon`-Feld
je Kategorie — bewusst dieselben Icon-Namen aus dem zentralen
Linien-Icon-Set (`src/ui/Icon.jsx`), die an anderer Stelle der App schon
für dieselbe Kategorie verwendet werden (`constants.js`,
`PlaeneView.jsx`), damit sich die Symbol-Assoziation app-weit verstärkt
statt für dieses eine Diagramm neu erfunden zu werden: hormon→cross,
supplement→capsule, mahlzeit→utensils, training→dumbbell,
gewohnheit→target, hydration→droplet, tageslicht→sun, schlaf→moon,
atemuebung→wind. Morgen-/Abendroutine stecken (wie Farbe/Hintergrund
auch) nicht in `KATEGORIE_META`, sondern in einer neuen
`ROUTINE_ICON`-Map in `HomeView.jsx` (sun/moon) — analog zu
`ROUTINE_FARBE`/`ROUTINE_HINTERGRUND`.

`TagesfortschrittBalken.jsx` rendert das Icon jetzt statt des Punkts
unter jedem Balken, in Kategoriefarbe (aktiv) bzw. gedecktem Grau
(inaktiv/noch nicht eingerichtet) — fällt auf den alten Punkt zurück,
falls für eine Kategorie kein Icon hinterlegt ist.

Verifiziert über den Playwright-Preview-Harness bei 375px Breite (Mix
aus aktiven und inaktiven Kategorien im Screenshot bestätigt sowohl
farbige als auch graue Icon-Darstellung). Build + `npx oxlint` weiterhin
bei 16 Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 65) — "Weitere Pläne": Grid statt chaotischer Liste

Nutzerinnen-Feedback nach Teil 64: "Und in der App Ansicht auf dem Handy
werden die Pläne unten sehr, sehr chaotisch untereinander aufgelistet."
Ursache: die "Weitere Pläne"-Pillen aus Teil 64 tragen jetzt Name +
"+ einrichten"-Text nebeneinander in variabler Breite — auf Handybreite
(375–420px) passte dadurch kaum mehr als eine Pille pro Zeile in die
Flex-Wrap-Zeile, sodass sie einzeln untereinander standen.

Fix: `display: grid, gridTemplateColumns: repeat(auto-fill, minmax(108px, 1fr))`
statt `flex; flex-wrap: wrap` — dieselbe Technik wie beim bereits
bestehenden "Direktzugriff"-Grid direkt darüber. Name und
"+ einrichten" stehen jetzt untereinander in der Kachel statt
nebeneinander, wodurch alle Kacheln gleich breit sind und sich sauber
in Reihen anordnen (3 Spalten auf 375px Breite) statt eine Liste zu
bilden.

Verifiziert über den Playwright-Preview-Harness bei 375px Breite
(iPhone-Standardbreite). Build + `npx oxlint` weiterhin bei 16
Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 64) — Home-Screen: Kategoriefarben, Gabel-Button-Position, Plus-Button-Sichtbarkeit

Nutzerin-Vorgabe per annotiertem Screenshot (handschriftlich "1"/"2" +
Pfeil auf den "+"-Button) plus Sprachnachricht, drei Wünsche:

1. **"Weitere Pläne"-Pillen einfärben.** Bisher trug jede Pille nur einen
   7px-Punkt in der Kategoriefarbe, der Rest war neutral grau. Damit die
   Probandin die Farben langfristig mit dem Tagesfortschritt-Balken
   oben assoziiert, hat jetzt der gesamte Button-Hintergrund + Text die
   Kategoriefarbe aus `KATEGORIE_META` (bzw. `ROUTINE_FARBE`/neu
   `ROUTINE_TEXT` für Morgen-/Abendroutine, die bewusst keinen
   `KATEGORIE_META`-Eintrag haben).
2. **Gabel-Button (`AkutModusTrigger`, "💡 Grad nicht gut?") neben
   Hydration.** Per Sprachtranskript "Gabel Button" identifiziert durch
   Ausschlussverfahren: der andere Button (`ADHSModeToggle`) heißt im
   eigenen Code/Label explizit "Notfallmodus"/"Normalmodus", also muss
   der gemeinte Button `AkutModusTrigger` sein. Hydration und
   AkutModusTrigger stehen jetzt als gleich breite Flex-Row nebeneinander;
   `ADHSModeToggle` nimmt vorerst weiterhin eine volle Zeile darunter ein
   (Nutzerin: Design dort wird ohnehin nochmal überarbeitet).
3. **"+"-Button (`Fab.jsx`, "Neues Protokoll") auffälliger platzieren.**
   Der freischwebende runde Button fiel der Nutzerin gestern nicht auf —
   sie hat die App deswegen fälschlich für funktional unvollständig
   gehalten und musste lange suchen. `Fab.jsx` wurde komplett entfernt
   (toter Code) und durch eine 4. Kachel im `.mp-ordner-grid` ersetzt,
   direkt neben "Alle Pläne"/"Archiv"/"Mehr" — rechteckig, gleiche Größe
   wie die Ordner-Kacheln, aber in Blau (`accentDark`), damit sie trotz
   gleicher Form optisch abgesetzt bleibt.

Geänderte Dateien: `src/views/HomeView.jsx`, `src/AuthenticatedApp.jsx`
(Prop `onNeuesProtokoll` statt `Fab`-Import, totes `zeigeFab`/
`istAdminModus` entfernt), `src/ui/Fab.jsx` gelöscht.

Verifiziert über den etablierten Playwright-Preview-Harness (temporärer
`export { AppDataContext }` + Mock-Provider), Screenshot bei 420px
Breite bestätigt alle drei Änderungen visuell; Harness danach vollständig
zurückgebaut (`git status --short` sauber). Build + `npx oxlint` bei
weiterhin 16 Warnungen (Baseline unverändert).

## ✅ Update 13.09.2026, Fortsetzung (Teil 63) — Migrationen 0070/0076 repariert (idempotent nachgerüstet)

Nutzerin führte die in Teil 61/62 als Copy-Paste-Artifact bereitgestellten
4 Migrationen aus — 0071 und 0075 liefen durch, 0070 und 0076 brachen mit
`relation "..." already exists` ab (Screenshot: 0076 bei
`create table public.atemuebungen`).

Ursache: beide Dateien nutzten bisher plain `CREATE TABLE`/`CREATE POLICY`
ohne Guards — anders als 0071, das dieses Muster schon hatte (siehe dort).
Da CREATE TABLE eine bereits existierende Relation nicht stillschweigend
überspringt, bricht die gesamte Transaktion sofort an der ersten schon
vorhandenen Tabelle ab — alles, was in derselben Datei danach kommt
(0070: `quest_fortschritt`; 0076: `atemuebung_logs`/`akutmodus_log`),
wird dadurch ebenfalls nicht angelegt, selbst wenn es noch fehlt.
Vermutlich Rest eines früheren, nie dokumentierten Teilversuchs.

Beide Dateien jetzt wie 0071 geschrieben: `CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS` vor jedem
`CREATE POLICY` — beliebig oft gefahrlos erneut ausführbar, unabhängig
vom tatsächlichen Vorzustand der Datenbank. Das schon veröffentlichte
Copy-Paste-Artifact wurde mit den reparierten Texten aktualisiert
(gleiche URL) und zeigt jetzt zusätzlich pro Skript einen Status
("✓ Schon gelaufen" für 0071/0075, "↻ Bitte erneut ausführen" für die
zwei reparierten) — die embedded SQL wurde dabei erneut maschinell
byte-für-byte gegen die Repo-Dateien geprüft.

Nachtrag (13.09.): Nutzerin hat beide reparierten Skripte erfolgreich
ausgeführt. Damit sind jetzt alle 4 Migrationen (0070/0071/0075/0076)
durchgelaufen — kein offener DB-Migrationspunkt aus Teil 61/62/63 mehr.

## ✅ Update 13.09.2026, Fortsetzung (Teil 62) — setErinnerung() sichtbar fehlerbewusst gemacht

Nutzerinnen-Vorgabe: "Mach setErinnerung() sichtbar fehlerbewusst, auch
wenn es 6 Dateien betrifft" — der in Teil 61 bewusst zurückgestellte
Rest von Übergabeprotokoll-Punkt #13.

`useProfileData.setErinnerung()` speicherte einen Fehler bisher nur in
die Browser-Konsole (`console.error` + stiller Rollback) — genau dieses
Muster hatte laut Protokoll den Erinnerungen-Bug einer früheren Sitzung
wochenlang unsichtbar gehalten. Gibt jetzt wie `resetOnboarding()` `{ok,
error}` zurück. Alle 6 Aufrufer-Dateien zeigen einen fehlgeschlagenen
Speicherversuch jetzt sichtbar an:

- **`ZeitErinnerungenCard.jsx`**: eigener Fehler-Banner. Zusätzlich
  behoben: bei einem Fehlschlag rollt `setErinnerung` den echten
  `erinnerungen`-Stand zurück, das lokale `zeiten`-Array blieb bisher
  aber auf dem nie gespeicherten optimistischen Stand stehen (das
  `zeitenBearbeitetRef`-Sync-Gate ließ den Rollback nicht durch) — Ref
  wird jetzt bei einem Fehler zurückgesetzt.
- **`KategorieErinnerung.jsx`**: eigener Fehler-Banner.
- **`MehrTab.jsx`**: ein Fehler-Zustand `{key, message}` für die ganze
  Erinnerungen-Kategorien-Liste, direkt bei der betroffenen Zeile
  angezeigt.
- **`HydrationView.jsx`**: `handleHydrationUebernehmen()` (KiChat-
  Übernehmen-Knopf) wirft bei einem Fehlschlag jetzt wie schon beim
  Tagesziel direkt daneben — `KiChat.jsx` fängt das bereits ab.
- **`TrainingView.jsx`**: nutzt den schon vorhandenen `fehler`-Zustand,
  jetzt auch neben dem Wochenplan-Editor angezeigt.
- **`OnboardingCategoriesView.jsx`**: nutzt den schon vorhandenen
  `error`-Zustand der Schrittseite.

**Getestet**: Playwright gegen eine Preview-Harness mit gemocktem
AppDataContext (echte async Lücke zwischen optimistischem Update und
Rollback nachgebildet — ohne die batcht React beides zu einem No-Op,
Test hat das zunächst auch selbst getroffen und wurde entsprechend
korrigiert). Erfolgsfall fehlerfrei; Fehlerfall zeigt die Meldung UND der
Zustand rollt korrekt zurück (ZeitErinnerungenCard: lokale Zeiten-Liste
synct sich wieder auf den echten Stand; KategorieErinnerung: Umschalter
bleibt auf dem vorherigen Wert). Die restlichen vier Aufrufer nutzen
mechanisch dasselbe, hier verifizierte `await` + `{ok, error}`-Muster,
per Code-Review geprüft. Build + oxlint weiterhin sauber (16 Warnungen,
Baseline unverändert).

Damit ist Übergabeprotokoll-Punkt #13 vollständig erledigt.

## ✅ Update 13.09.2026, Fortsetzung (Teil 61) — Punch-Liste (Teil 60) komplett abgearbeitet

Nutzerinnen-Vorgabe: "Beginne jetzt bitte mit allen von dir Repo
hinterlegten zukünftigen Arbeiten" (erste Sitzung), später konkretisiert
zu "alle vorgenommenen Ziele aus dem Übergabeprotokoll heute umsetzen ...
ich möchte nichts mehr ausstehen haben." Die in Teil 60 als Backlog
zurückgestellte Punch-Liste in 5 weiteren Runden (7-11) abgearbeitet —
zusammen mit den bereits in derselben Sitzung zuvor erledigten Runden 1-6
ist damit die komplette Teil-60-Liste durchgearbeitet, jeder Punkt entweder
umgesetzt oder mit konkreter technischer Begründung bewusst zurückgestellt.

**Runde 7 — `TrainingView.jsx`: LiveWorkout ausgelagert.** War eine der
als "zum Aufteilen" markierten sehr langen Dateien (>1300 Zeilen). Der
komplette Live-Trainingsablauf (Satz-/Phasen-Logik, Timer, Intervall-
Musik-Sync) nach `src/ui/LiveWorkout.jsx`, die Nachtraining-Feedback-
Erfassung nach `src/ui/TrainingFeedbackPanel.jsx` — TrainingView.jsx auf
~920 Zeilen reduziert. `INTERVALL_FADE_SEK` nach
`utils/intervallMusikStorage.js` verschoben (sonst zirkulärer Import).
Getestet: Preview-Harness + Playwright, kompletter Krafttraining-Ablauf
(Satz → Pause → Satz → Bestätigen → Beenden → Feedback-Panel)
fehlerfrei, Verhalten identisch zu vorher.

**Runde 8 — Dosis-Feld-Logik zwischen Peptiden und Hormonen/Medikamenten
zusammengeführt.** `useProtocolData.js` (Peptide) und `useHormoneData.js`
(Hormone/Medikamente/Cannabis) hatten dieselbe Spalten-Zuordnung,
Numerisch-Feld-Liste und Wert-Umwandlungslogik für Dosierungsfelder als
zwei unabhängige Kopien — die laut Teil-60-Analyse eigentliche Ursache,
warum ein Rollback-Fix in einer Kopie nicht automatisch in der anderen
landete. Jetzt eine einzige Quelle in `utils/schedule.js`:
`DOSE_SPALTEN_VOLLSTAENDIG`/`DOSE_NUMERISCHE_FELDER_VOLLSTAENDIG` (hormones
hat alle Spalten inkl. Cannabis-Details) + `spaltenTeilmenge()` für die
kleinere Peptid-Teilmenge, `coerceDoseFeldWert()` (bisher viermal fast
wortgleich), `buildDosePlan()` (bisher zweimal fast wortgleich, per
Callback parametrisiert). Reine Extraktion, keine Verhaltensänderung.
Getestet: Node-Skript, das die neuen reinen Funktionen gegen eine
wörtliche Kopie der ursprünglichen Inline-Logik durchspielt — 384 Feld/
Wert-Kombinationen für `coerceDoseFeldWert` und 10 synthetische
Dosierungs-Szenarien (fixed/custom/cycle/weekdays) für `buildDosePlan`,
jeweils exakt identisches Ergebnis.

**Runde 9 — `AppDataContext.jsx` Re-Render-Fanout behoben.** ~30 Daten-
Hooks werden zu einem `value`-Objekt zusammengeführt, das jeden
`useAppData()`-Konsumenten versorgt — bisher ohne Stabilisierung, obwohl
jeder Hook bei jedem Render ein frisches Objekt-Literal zurückgibt. Jede
State-Änderung in irgendeinem der 30 Hooks rendert dadurch bisher ALLE
Konsumenten neu. Ein einfaches `useMemo` um `value` hätte nichts gebracht
(Dependency-Array bestünde aus denselben, immer neuen Referenzen); ein
voller Context-Split hätte ~50+ Konsumenten-Dateien app-weit angefasst —
unverhältnismäßiges Risiko ohne Live-Testing, zumal keiner der 30 Hooks
einen tickenden Timer enthält (geprüft: `useIntervallMusikSync.js` läuft
lokal in TrainingView/LiveWorkout/WorkflowTimer, nicht in
AppDataContext). Stattdessen `src/context/useShallowStableValue.js`:
vergleicht die ~150 flach zusammengeführten Einzelwerte in `value` selbst
(Object.is je Schlüssel) statt der 30 Hook-Objekt-Referenzen — funktioniert,
weil Zustände durchgängig immutabel aktualisiert werden und Setter/
Toggle-Funktionen durchgängig per `useCallback` stabil sind. Rührt keine
der 30 Hook-Dateien und keine View an. Getestet: eigenständiger
Playwright-Test (Provider/Consumer-Struktur, die die echte
`children`-Weitergabe von App.jsx an AppDataProvider nachbildet) — 5
Provider-interne State-Änderungen ohne inhaltliche `value`-Änderung lösen
0 Re-Renders beim Consumer aus, 3 echte Wert-Änderungen lösen genau 3
Re-Renders aus.

**Runde 10 — `HomeView.jsx`: zwei Widgets ausgelagert.** War ebenfalls
als "zum Aufteilen" markiert (1113 Zeilen). `TagesfortschrittBalken`
(Balkendiagramm) und `NachrichtAnCoachCard` (Coach-Kontakt für Coachees)
waren bereits saubere, rein props-getriebene Komponenten — nach
`src/ui/TagesfortschrittBalken.jsx` bzw. `src/ui/NachrichtAnCoachCard.jsx`
verschoben, HomeView.jsx auf 1023 Zeilen reduziert. Nach Durchsicht
bewusst NICHT weiter aufgeteilt — weder der Haupt-Komponentenkörper von
HomeView.jsx selbst noch `WochenuebersichtView.jsx`, `KiChat.jsx` oder
`WochenplanEditor.jsx`: alle vier sind einzelne monolithische
Komponentenkörper, die lokalen State eng mit Render-Blöcken verweben,
ohne bereits vorhandene, sauber abtrennbare Teil-Komponenten wie bei
LiveWorkout — ein erzwungener Split hätte eher neue Prop-Drilling-
Fehlerquellen geschaffen als Übersichtlichkeit gewonnen.

**Runde 11 — Hydration/Tageslicht: Ziel-/Korrektur-Logik
zusammengeführt.** `HydrationView.jsx` und `TageslichtView.jsx` teilten
sich fast wortgleich die Logik für Tagesziel-Entwurf (inkl.
Änderungsgrund + Änderungsprotokoll-Eintrag), "Verschätzt?"-Korrektur,
Zurücksetzen mit Bestätigungsdialog und Fehleranzeige — im Punch-Liste-
Eintrag selbst als Kandidat für einen `useZielMitKorrektur`-Hook benannt.
Jetzt in `src/ui/useZielMitKorrektur.js`, parametrisiert über
zielWert/heuteWert/hinzufuegen/zielSetzen/zielZuruecksetzen/
aenderungVermerken/kategorie/itemName/einheit/kachelName/defaultZiel.
Bewusst NUR die Logik zusammengeführt, nicht die JSX-Darstellung —
Hydration hat zusätzlich eine Check-in-Karte, ein gemeinsames Render
hätte eher eine Konfigurations-Objekt-Wüste erzeugt. Getestet: Playwright
gegen eine Preview-Harness mit gemocktem AppDataContext (beide Views
gleichzeitig gemountet, Fehler-Schalter simuliert fehlschlagende
Supabase-Aufrufe) — Erfolgs- und Fehlerpfad für schnellHinzufuegen,
Ziel-Wheel + Speichern (Anzeige + aenderungVermerken-Eintrag exakt wie im
Original formatiert), "Ziel zurücksetzen" erscheint erst ab abweichendem
Ziel mit korrektem, kachelspezifischem Bestätigungstext.

**Zwei Ermessensfragen vorab mit der Nutzerin geklärt** (Runden 8/9
betreffen Dosis-Timing bzw. globalen Re-Render-Mechanismus — beides ohne
Live-Zugriff auf echte Daten nicht vollständig verifizierbar): explizit
grünes Licht für "vorsichtig angehen" (Runde 8, reine Extraktion + Node-
Verifikation) bzw. "versuchen" mit Verständnis für eine risikoärmere
Teilfassung statt eines vollen Context-Splits (Runde 9) eingeholt, bevor
losgelegt wurde.

**Bewusst nicht angefasst — Abschnitt 10 ("Offene Punkte") gegengelesen:**
fast ausschließlich Supabase-Dashboard-Aktionen (Migrationen ausführen,
Edge Functions deployen, Dashboard-Konfiguration prüfen), Live-Browser-
Tests mit echtem Login/Netzwerkzugriff, oder Scope-Entscheidungen, die
nur die Nutzerin treffen kann (Groq-Provider, native App, Akutmodus-
Ausbau) — nichts davon lässt sich aus dieser Sandbox zusätzlich sicher
umsetzen. Einzige Ausnahme mit echtem Sandbox-Potenzial: Punkt #13
(`useProfileData.js`-Speicherfehler nur in der Konsole geloggt, nie
sichtbar; "mindestens `setErinnerung()` sollte Fehler sichtbar
zurückmelden") — betrifft aber 14 Aufrufstellen in 6 UI-Dateien
(`ZeitErinnerungenCard.jsx`, `KategorieErinnerung.jsx`, `MehrTab.jsx`,
`HydrationView.jsx`, `TrainingView.jsx`, `OnboardingCategoriesView.jsx`),
von denen heute keine geprüft wurde — bewusst zurückgestellt statt
überstürzt an mehreren unbekannten Stellen gleichzeitig sichtbare
Fehlerpfade einzuziehen, bleibt als konkret umsetzbarer nächster Schritt
stehen.

**Getestet (übergreifend)**: `npm run build` + `npx oxlint` nach jeder
Runde, durchgehend 16 Warnungen (Baseline unverändert, keine neuen).

## ✅ Update 13.09.2026, Fortsetzung (Teil 60) — App-weite Fehler-/Code-Durchsuchung

Nutzerinnen-Vorgabe: "überprüft die gesamte App nach Bugs und nach
komplizierten und unnötig viel Code, die Du nachkorrigieren könntest."
Vier parallele Recherche-Durchgänge über die komplette Codebase
(Datenschicht `src/data/`, Views `src/views/`, UI-Komponenten `src/ui/`,
Utils/Context/Services), danach ein gezielter Fix-Pass über die
eindeutigsten, am besten abgesicherten Funde. Vier Commits, thematisch
gruppiert:

**1. Datenschicht — fehlende Rollbacks, Fehlerprüfungen, Doppeltipp-Schutz**
In mehreren neueren Dateien war ein Bug-Fix-Muster bereits sauber
nachgerüstet, in älteren, strukturell fast identischen Schwesterdateien
aber nie nachgezogen:
- `useProtocolData.js` (Peptide): `setEinnahmeart`/`setDose`/
  `setDoseBatch`/`setPeptidFoto`/`removePeptidRow` zeigten bei einem
  Speicherfehler dauerhaft den neuen, nie gespeicherten Wert — jetzt
  Rollback wie im (laut eigenem Kommentar) gespiegelten
  `useHormoneData.js`.
- `useHormoneData.js`: `saveHormonFeedback`/`skipHormonFeedback` ohne
  Rollback bei fehlgeschlagenem Upsert — nachgezogen wie in
  `usePeptideLogs.js`.
- `useHormoneData.js`/`useRoutinen.js`/`useDrinkRecipes.js`: die
  Abhaken-Funktionen (Medikament/Routine-Schritt/Getränk) lasen bei
  schnellem Doppeltippen noch den veralteten React-State — ein zweiter,
  als "Rückgängig" gemeinter Tap wirkte dadurch nicht. Gleicher
  `pendingErledigtRef`-Schutz wie in `useGewohnheitenData.js` ergänzt.
- `useBiomarkerData.js`: Fehler beim Übernehmen der per Foto erkannten
  Laborwerte wurden gar nicht geprüft — Oberfläche meldete "erkannt",
  obwohl nichts gespeichert wurde; ein fehlgeschlagener Archiv-Insert
  legte zusätzlich einen nie löschbaren Eintrag mit `id: undefined` an.
- `useSpotifyVerbindung.js`: `spotifyAnlassEntfernen` prüfte den
  Lösch-Fehler nicht (Schwesterfunktionen in derselben Datei schon).

**2. Views — Datenverlust-Risiko, doppelte Einträge, Monatssprung**
- `HydrationView.jsx`/`TageslichtView.jsx`: Ziel-Eingabefeld zeigte beim
  Laden kurz den Standardwert (2500 ml/30 Min.) statt des echten Ziels
  — ein versehentlicher Tap auf "Speichern" in diesem Moment setzte das
  echte Ziel unbemerkt zurück. Jetzt mit Sync-Effekt, der das Feld nicht
  mehr überschreibt, sobald die Nutzerin es selbst angefasst hat.
- `TrainingView.jsx`/`SupplementeView.jsx`: Speichern-Buttons ohne
  Sperre während des Requests — ein schneller Doppel-Tap erzeugte zwei
  parallele Einträge (bei Training exakt die "Geister-Einträge", die den
  gerade erst in Teil 58 behobenen Home-Kachel-Bug wieder auslösen
  konnten). Jetzt gesperrt, solange der Request läuft.
- `WochenuebersichtView.jsx`: Monatsnavigation rechnete "±30 Tage" statt
  kalendarisch — bei Monaten mit mehr als 30 Tagen wurde ein ganzer Monat
  komplett übersprungen (z. B. 31. Januar → 2. März).
- `ProtokollLogView.jsx`: Einzel-Löschen (🗑) synchronisierte die
  Mehrfachauswahl nicht mit — eine bereits gelöschte, aber noch markierte
  ID blieb im Auswahl-Set, "X ausgewählt" zeigte danach eine falsche
  Zahl. Jetzt mit `entfernenAusAuswahl()` synchronisiert, wie es
  `ArchivAbschnitt.jsx` (Vorlage für dieses Muster) bereits richtig macht.

**3. Datumsberechnung, UI-Leaks, toter Code**
- Neue `parseLocalISODate()` in `utils/dates.js`: `new Date("YYYY-MM-DD")`
  parst laut Sprachstandard als UTC-Mitternacht statt lokaler
  Mitternacht — in jeder Zeitzone westlich von UTC verschiebt das den
  effektiven Tag. Betraf die komplette Dosierungs-/Intervallberechnung
  (`schedule.js`), die "Wochenprotokoll fällig"-Erkennung
  (`wochenprotokollSnapshot.js`) und die Zeitraum-Berechnung in
  `WochenuebersichtView.jsx` — alle vier umgestellt.
- `QuickTaskList.jsx`/`RoutineSchritteEditor.jsx`: ungeräumte
  `setTimeout`-Timer ließen bei schnell hintereinander ausgelösten Taps
  Erfolgs-Animationen/-Meldungen vorzeitig verschwinden.
- `WoechentlicheCheckinsCard.jsx`: Blob-URLs für Check-in-Fotos wurden
  nie freigegeben (`URL.revokeObjectURL()` fehlte komplett) — Speicherleck
  bei häufiger Foto-Nutzung.
- `MiniPlanWidget.jsx`: Ring-Hintergrundfarbe per String-Anhängen von
  Alpha-Hex statt der dafür vorgesehenen `hexZuRgba()`-Funktion.
- Toter Code entfernt: `src/ADHS_HOMEVIEW_EXAMPLE.jsx` (286 Zeilen,
  nirgends importiert) und `wochenplanUebungenText()` in `dayItems.js`
  (nirgends aufgerufen).

**4. Akutmodus/Lexikon/Blutwerte-Scan (separater, dringender Fix, siehe
Teil 59)** — Ursache war ein ungültiger Anthropic-Modellname in zwei
Supabase Edge Functions plus ein app-weiter Bug beim Auslesen von
Fehlermeldungen aus fehlgeschlagenen Edge-Function-Aufrufen.

**Getestet**: Build + oxlint nach jedem der vier Commits (Warnungen sanken
von 18 auf 16 durch den entfernten toten Code, sonst unverändert, keine
neuen). `parseLocalISODate()` zusätzlich mit einem kleinen Node-Skript
gegen Rundreise-Konsistenz geprüft.

### Nicht behoben — bewusst zurückgestellt (Punch-Liste für später)

Aus den vier Recherchen blieben weitere, weniger eindeutige oder deutlich
aufwändigere Funde übrig, die nicht in diesem Durchgang angefasst wurden:

- **`AuthContext.jsx`**: potenzielle Race Condition zwischen
  `getSession()` und `onAuthStateChange()` beim Start — eng, aber real
  (z. B. beim Öffnen eines Einladungs-/Recovery-Links).
- **`AppDataContext.jsx`**: das zusammengeführte `value`-Objekt hat kein
  `useMemo` — jede State-Änderung in irgendeinem der ~30 Hooks
  re-rendert alle `useAppData()`-Konsumenten. Bei ~30 Dependencies ist
  ein einfaches `useMemo` unhandlich; eher ein Hinweis, den Context in
  mehrere kleinere aufzuteilen — größerer Umbau, nicht in diesem Pass.
- **`useProfileData.js`**: mehrere Funktionen (`toggleDatenteilung`,
  `setCategoryZiel` u. a.) platzieren den Supabase-Aufruf innerhalb der
  `setState`-Updater-Funktion — unter React StrictMode (aktiv in
  `main.jsx`) löst das im Dev-Modus doppelte Schreibzugriffe aus.
- Fehlende `cancelled`-Guards in ca. 10 Lade-`useEffect`s
  (`useAtemuebungenData.js`, `useTeamData.js`, `useQuestData.js` u. a.) —
  aktuell durch den Remount bei Nutzerwechsel abgeschwächt, aber
  inkonsistent zum Rest der App.
- Zweistufiges "Archivieren + Neu anlegen" ohne Rollback
  (`useHauptprotokollData.js`, `useProtocolData.protokollArchivieren`) —
  schlägt der zweite Schritt fehl, zeigt die Oberfläche weiterhin das
  (jetzt archivierte) alte Protokoll als aktiv.
- Duplizierte Berechnungen: Alter (`kalorien.js` vs.
  `trackingZusammenfassung.js`, leicht inkonsistente Null-Behandlung) und
  Streak-Zählung (`errungenschaften.js` vs. `useGewohnheitenData.js`).
- Stark duplizierte Dosis-/Intervall-Logik zwischen `useProtocolData.js`
  (Peptide) und `useHormoneData.js` (Medikamente) — die eigentliche
  Wurzelursache, warum Fixes in einer Kopie nicht automatisch in der
  anderen landen (siehe Fund 1 oben). Kandidat für eine gemeinsame
  Hook-Factory.
- `aiService.js`: ~15 nahezu identische `…AusChat`-Funktionen
  (~500 Zeilen Boilerplate), ließen sich auf einen parametrisierten
  Helper reduzieren.
- Mehrfach duplizierte "frisch"-Schattenstate-Logik
  (`PersoenlicheDatenCard.jsx`, `WoechentlicheCheckinsCard.jsx`,
  `LaborwerteFelder.jsx`) — nie in einen gemeinsamen Hook ausgelagert,
  obwohl die Kommentare explizit aufeinander verweisen.
- Uneinheitliche Lösch-Bestätigung: `ArchivAbschnitt.jsx` fragt immer per
  `window.confirm()` nach, viele andere 🗑-Buttons (WochenplanEditor,
  WorkflowTimer, RoutineSchritteEditor, UebungenEditor,
  ZeitErinnerungenCard) löschen sofort ohne Rückfrage.
- Sehr lange Dateien (>500 Zeilen), Kandidaten zum Aufteilen:
  `TrainingView.jsx`, `HomeView.jsx`, `WochenuebersichtView.jsx`,
  `KiChat.jsx`, `WochenplanEditor.jsx`.
- `HydrationView.jsx`/`TageslichtView.jsx` teilen sich praktisch
  denselben Aufbau (Motivationstext, Schnellauswahl,
  Verschätzt-Korrektur) bis auf Variablennamen — Kandidat für einen
  gemeinsamen `useZielMitKorrektur`-Hook.
- `charts.jsx`: `data.map()` ohne Default-Array-Fallback — aktuell nicht
  ausgelöst, aber fragil gegenüber künftiger Wiederverwendung.
- `templateDirektStarten` in `TrainingView.jsx` (Vorlagen-Direktstart)
  hat noch keine Doppeltipp-Sperre wie der Haupt-Submit-Weg (Teil 60,
  Punkt 2) — selteneren Pfad, gleiche Fehlerklasse.

Diese Liste ist bewusst als Backlog stehen gelassen statt in einem einzigen
Mega-Durchgang durchgezogen — die oben tatsächlich gefixten Punkte waren
die mit dem klarsten Nutzerinnen-Impact und dem geringsten Risiko einer
neuen Regression.

## ✅ Update 13.09.2026 (Teil 59) — Akutmodus "Edge Function"-Fehler behoben + App-weite Fehlermeldungen korrigiert

Nutzerinnen-Vorgabe (mit Screenshot): Im Akutmodus ("Was hilft mir jetzt?"
→ "Idee holen") erschien die Meldung "Edge Function returned a non-2xx
status code" statt einer Antwort. Zusätzlich gebeten, die ganze App auf
ähnliche Fehler zu prüfen.

**Ursache 1 (der eigentliche Absturz):** Die Supabase Edge Functions
`lexikon` (Akutmodus + Lexikon) und `blutwerte-scan` (Blutwerte-Foto-Scan)
riefen die Anthropic API mit dem Modellnamen `"claude-sonnet-4-6"` auf —
das ist keine gültige Modell-ID. Jede Anfrage schlug dadurch serverseitig
fehl (Anthropic antwortet mit 400, die Edge Function leitet das als 502
weiter). Betraf ALLE drei Features gleichermaßen, nicht nur den
Akutmodus. Beide Dateien auf `"claude-sonnet-5"` korrigiert.

**Ursache 2 (warum die Fehlermeldung unlesbar war, app-weit):**
`supabase.functions.invoke()` liefert bei jedem non-2xx-Status IMMER
`data: null` zurück — der überall in der App verwendete Ausdruck
`data?.error || error.message` griff dadurch nie wie beabsichtigt und
zeigte statt der eigentlich vom Server gesendeten deutschen Meldung
(z. B. "Antwort konnte nicht geladen werden.") immer nur die generische,
englische System-Meldung des Supabase-Clients an. Betraf 9 Stellen in 6
Dateien: `useAkutModus.js`, `useLexikon.js` (2×), `useBiomarkerData.js`,
`useSpotifyVerbindung.js`, `usePushNotifications.js`,
`AdminDashboardView.jsx` (3×, Testkonto/Konto anlegen/Einladen). Eine
Stelle (`services/spotify.js`) hatte dasselbe Problem bereits früher für
sich allein gelöst (siehe dortiger Kommentar), ohne dass der Fix auf die
anderen neun Stellen übertragen wurde.

- **`utils/edgeFunctionFehler.js`** (neu): `edgeFunctionFehlertext(error,
  data, fallback)` — liest den tatsächlichen JSON-Fehlertext aus
  `error.context` (dort steckt bei einem `FunctionsHttpError` die
  Original-Antwort der Funktion) aus, mit sauberem Fallback bei
  Netzwerkfehlern oder nicht-JSON-Antworten. Jetzt an allen 10 Stellen
  einheitlich verwendet statt dupliziertem/fehlerhaftem Code je Datei.
- **Getestet**: Node-Skript mit simulierten `FunctionsHttpError`/
  `FunctionsFetchError`-Objekten — bestätigt korrekte Fehlertext-Extraktion
  in allen vier Fällen (JSON-Fehlerbody, direkter `data.error`,
  Netzwerkfehler ohne Body, nicht-JSON-Body). Build + oxlint (weiterhin 18
  Warnungen, unverändert).

**⚠️ WICHTIG — zusätzlicher Schritt nötig:** Die beiden geänderten Dateien
unter `supabase/functions/lexikon/index.ts` und
`supabase/functions/blutwerte-scan/index.ts` laufen auf Supabase-Servern,
nicht im normalen App-Build — ein reines Push zu GitHub reicht NICHT aus,
damit der Fix live geht. Im Supabase-Dashboard unter "Edge Functions" →
`lexikon` bzw. `blutwerte-scan` → Code-Editor öffnen und die Zeile
`model: "claude-sonnet-4-6"` durch `model: "claude-sonnet-5"` ersetzen
(oder den kompletten, aktuellen Dateiinhalt aus dem Repo einfügen), dann
"Deploy" klicken. Erst danach funktioniert der Akutmodus/das Lexikon/der
Blutwerte-Scan wieder.

## ✅ Update 12.09.2026, Fortsetzung (Teil 58) — "Aktiv"-Bug: verbleibende Ursachen bei Training/Tageslicht

Nutzerinnen-Vorgabe (mit 3 Screenshots, direkter Folge-Bericht auf Teil 57):
"beim Training alles rausgelöscht ... ist sowohl Training als auch
Tageslicht noch vorhanden ... hab auch Tageslicht auf null gesetzt, hab
aber keine Möglichkeit, das da irgendwie komplett zurückzusetzen ... hab
[über die Mehrfachauswahl] alle gelöscht in allen Bereichen und kann
trotzdem Training und Tageslicht nicht dort entfernen." Teil 57 hatte den
Bug nur teilweise behoben — zwei konkrete Lücken blieben:

1. **Training**: `aktiv: trainingEintraege.length > 0 || trainingWochenplan.length > 0`
   zählte JEDEN Eintrag, nicht nur abgeschlossene. Die Mehrfachauswahl in
   `ProtokollLogView.jsx` (Teil 56) filterte aber auf
   `trainingEintraege.filter(e => e.erledigt)` — ein über "Jetzt live
   starten" oder einen Vorlagen-Direktstart angelegter, aber nie
   abgeschlossener Eintrag (`erledigt: false`) blieb dadurch komplett
   unsichtbar und unlöschbar (z. B. nach Abbruch über "Schließen" in der
   Live-Trainings-Ansicht, die den Datenbank-Eintrag NICHT löscht,
   sondern nur die lokale Ansicht schließt). Ein einziger solcher
   Karteileichen-Eintrag reichte, um die Kachel für immer "aktiv" zu
   halten.
   - **Fix**: `ProtokollLogView.jsx` zeigt im Abschnitt "🏋️ Training"
     jetzt ALLE Einträge, nicht mehr nur erledigte — unfertige Einträge
     tragen zur Unterscheidung ein kleines "nicht abgeschlossen"-Label.
     Sobald sie (einzeln oder per Mehrfachauswahl) gelöscht werden, geht
     `trainingEintraege.length` auf 0 und die Kachel wird inaktiv — ohne
     dass die `aktiv`-Bedingung selbst angefasst werden musste.
2. **Hydration/Tageslicht**: Die in Teil 57 gebaute
   "Ziel zurücksetzen"-Funktion löscht die Einstellungs-Zeile komplett
   (Zustand "nie eingerichtet"). Die Nutzerin hat aber stattdessen das
   normale Ziel-Feld auf **0** gesetzt und gespeichert (naheliegender
   erster Versuch) — das läuft über den bestehenden
   `hydrationZielSetzen()`/`tageslichtZielSetzen()`-Pfad, der weiterhin
   eine Zeile mit `ziel_ml: 0` bzw. `ziel_minuten: 0` anlegt. Die
   `aktiv`-Bedingung (`zielMl !== 2500` / `zielMinuten !== 30`) erkannte
   0 damit fälschlich weiterhin als "aktiv" (0 ist ja ungleich 2500).
   - **Fix**: `HomeView.jsx` — beide Bedingungen behandeln jetzt zusätzlich
     0 als "nicht konfiguriert": `zielMl > 0 && zielMl !== 2500` bzw.
     `zielMinuten > 0 && zielMinuten !== 30`. Deckt damit sowohl den
     "Ziel zurücksetzen"-Weg als auch den "0 eintippen"-Weg ab.
- **Getestet**: Preview-Harness (Playwright) mit `ProtokollLogView.jsx` und
  zwei gemockten Trainings-Einträgen (einer erledigt, einer nicht) —
  bestätigt, dass beide angezeigt werden, der unfertige das
  "nicht abgeschlossen"-Label trägt, beide per Mehrfachauswahl markierbar
  sind und nach dem Löschen die Liste tatsächlich leer ist. Build + oxlint
  (weiterhin 18 Warnungen, unverändert).

## ✅ Update 12.09.2026, Fortsetzung (Teil 57) — "Aktiv"-Bug behoben + kompletter Reset-Knopf

Nutzerinnen-Vorgabe: "obwohl ich alle Bereiche leer mache ... stehen im
aktiven Bereich immer noch drei Sachen ... Morgenroutine kriege ich nicht
leer ... Ich muss doch alles auf Null setzen können und neue Protokolle
starten können." Auf Rückfrage gewünscht: **beides** — den Bug beheben
UND einen echten "Alles zurücksetzen"-Knopf bauen.

**Ursache des Bugs**: Die "aktiv"-Markierung der Direktzugriff-Kacheln auf
der Startseite basiert je Kategorie auf unterschiedlichen Bedingungen
(`utils/dayItems.js`/`HomeView.jsx`). Bei Hydration/Tageslicht lautete sie
u. a. `zielMl !== 2500` bzw. `zielMinuten !== 30` — einmal geändert, gab
es aber nirgends einen Weg, das Ziel wieder auf "gar nicht konfiguriert"
zurückzustellen (nur neue Werte setzen, nie die Einstellungs-Zeile
löschen) — die Kachel blieb dadurch für immer "aktiv", egal wie viele
Trinkmengen-/Tageslicht-Einträge gelöscht wurden. Morgenroutine dagegen
war technisch schon zurücksetzbar (Schritte einzeln entfernen), saß aber
seit Teil 52 hinter dem neuen "⚙️ Einstellungen"-Klapp-Button und war
dadurch schwerer zu finden.

- **`useHydrationData.js`** / **`useTageslichtData.js`**: neue Funktionen
  `hydrationZielZuruecksetzen()` / `tageslichtZielZuruecksetzen()` —
  löschen die Einstellungs-Zeile komplett statt sie auf einen Wert zu
  setzen, Zustand entspricht danach wieder "nie eingerichtet" (Standard
  2500 ml / 30 Min.).
- **`HydrationView.jsx`** / **`TageslichtView.jsx`**: "Ziel zurücksetzen"-
  Link unter dem Tagesziel-Feld, nur sichtbar, wenn vom Standard
  abweichend, mit Sicherheitsabfrage.
- **`data/useKompletterReset.js`** (neu): `allesZuruecksetzen()` — leert
  nacheinander (Kind- vor Eltern-Tabellen, gegen Fremdschlüssel-Races)
  über 40 Tabellen: alle Medikamente/Hormone/Peptide/Protokolle,
  Supplemente, Ernährung, Training, Routinen (inkl. der aus Teil 51/52),
  Hydration, Tageslicht, Schlaf, Check-ins, Blutwerte, Workflow,
  Zeitblöcke, Getränke-Rezepte, Änderungsprotokoll, Baustein-Versionen,
  Errungenschaften usw. — plus `onboarding_complete: false`, damit
  "neue Protokolle starten" tatsächlich wieder beim Einrichtungs-
  Assistenten landet. Bewusst NICHT gelöscht: das Konto/Profil selbst,
  Team-Daten (gehören nicht nur ihr), Spotify-Verbindung/Playlists,
  Push-Geräte-Registrierung, Coach-Wissen (globale Wissensbasis),
  Übungsbilder-/Quest-Katalog, Nachrichten an den Coach.
- **`plan/MehrTab.jsx`**: neue Karte "⚠️ Gefahrenzone" ganz unten, rot
  umrandet. Bewusst KEIN einfaches `window.confirm()` — die Nutzerin muss
  zusätzlich exakt "ALLES LÖSCHEN" eintippen (Groß-/Kleinschreibung und
  Leerzeichen drumrum egal), sonst bleibt der Knopf deaktiviert. Nach
  Erfolg automatischer Reload wie beim bestehenden "Zum Testen"-Reset.
- **Getestet**: Preview-Harness (Playwright) — Bestätigungs-Feld: Button
  bei leerem/falschem Text deaktiviert, bei korrektem Text (auch
  kleingeschrieben, mit Leerzeichen) aktiviert, nach Löschen des Textes
  wieder deaktiviert. Tabellen-Reihenfolge/-Liste manuell gegen die
  tatsächliche Tabellennutzung im gesamten `src/data/`-Ordner
  gegengeprüft (jede Tabelle hat bestätigt eine `user_id`-Spalte). Build +
  oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 56) — Mehrfachauswahl auch in "Akas fertige Protokolle"

Nutzerinnen-Vorgabe (mit Screenshot): "Obwohl ich das Archiv komplett
gelöscht habe, sind in anderen Bereichen immer noch Protokolle zu
finden ... Wenn ich dir solche Aufgaben gebe, übertrag das bitte auf
alle möglichen anderen Systeme in der App auch." Der gezeigte Screen
("Akas fertige Protokolle" → 📝 Tagesverlauf/🗂️ Baustein-Versionen/
🏋️ Training) ist ein von "Archiv" (Teil 53) komplett unabhängiger
Datenbereich (Änderungsprotokoll-Log, Baustein-Versionen-Snapshots,
abgeschlossene Trainings) — daher blieb der dort weiterhin sichtbar.

- **`ui/useMehrfachauswahl.js`** (neu): die Auswahl-Logik aus
  `ArchivAbschnitt.jsx` herausgelöst (Set von IDs, alle
  markieren/aufheben, Callback-Reset) — wiederverwendbar auch für
  Listen mit abweichendem, z. B. nach Datum gruppiertem Layout, die
  nicht in das feste Zeilenschema von `ArchivAbschnitt` passen.
- **`ui/MehrfachauswahlLeiste.jsx`** (neu): die "Alle auswählen"/
  "Auswahl aufheben"- + "X löschen"-Kopfzeile, ebenfalls herausgelöst.
- **`ArchivAbschnitt.jsx`**: auf die beiden neuen Bausteine umgestellt
  (identisches Verhalten wie in Teil 53, nur entkoppelt).
- **`views/ProtokollLogView.jsx`** ("Akas fertige Protokolle"): alle
  drei Bereiche bekommen jetzt Checkbox je Zeile + Sammel-Löschen,
  jeweils mit eigener Auswahl (kann Einträge über mehrere Tage hinweg
  umfassen, unabhängig von der Datums-Gruppierung):
  - 📝 Tagesverlauf (Änderungsprotokoll) — `aenderungEntfernen`.
  - 🗂️ Baustein-Versionen — `versionLoeschen`.
  - 🏋️ Training — hatte bisher noch gar keine Löschfunktion (nur
    "Training starten"/"eintragen", nie "entfernen"), jetzt über die
    schon vorhandene `trainingEntfernen` nachgerüstet (gleiches Muster
    wie der Blutwerte-Verlauf in Teil 53).
- **Bewusst NICHT angefasst diese Runde**: die Verwaltungslisten für
  Workflow-Presets (`WorkflowTimer.jsx`) und Trainings-Vorlagen
  (`TrainingsplaeneVerwaltung.jsx`) — das sind wenige, bewusst benannte
  Einträge, keine mit der Zeit anwachsende Log-Unordnung wie bei den
  Protokollen/dem Archiv. Der wiederverwendbare Baustein steht jetzt
  aber bereit, falls das auch dort gewünscht ist.
- **Getestet**: Preview-Harness (Playwright) — "Alle auswählen" +
  Sammel-Löschen in allen drei Bereichen geprüft (Tagesverlauf 3→0,
  Versionen 2→0, Training 1 einzeln markiert und gelöscht, verbleibender
  Eintrag zeigt Checkbox + 🗑 korrekt). Build + oxlint (weiterhin 18
  Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 55) — Seitenleiste: "Training" als eigener Menüpunkt entfernt

Nutzerinnen-Vorgabe: "Training ist ja eins von vielen Punkten, wenn
überhaupt" — die Tablet/Desktop-Seitenleiste zeigte Training als eigenen
Menüpunkt neben "Pläne", obwohl es dort genau wie Hydration, Ernährung,
Supplemente, Medikamente usw. nur einer von vielen Reitern ist.

- **`ui/AppSidebar.jsx`**: den eigenen "Training"-Menüpunkt entfernt;
  "training" bleibt ein ganz normaler `PLAENE_TABS`-Eintrag, erreichbar
  wie jeder andere über "Pläne" → Reiter-Grid. Die bisherige
  Sonderbehandlung (`PLAENE_VIEW_IDS_OHNE_TRAINING`, die Training beim
  Hervorheben von "Pläne" ausklammerte, damit stattdessen der eigene
  Training-Punkt aufleuchtete) ist damit auch nicht mehr nötig — "Pläne"
  leuchtet jetzt korrekt auf, solange irgendein Reiter dort aktiv ist,
  Training eingeschlossen.
- Betrifft nur die Seitenleiste (>=1024px) — am Handy/iPad-Hochformat gab
  es diese Dopplung ohnehin nicht (dort läuft die Navigation weiterhin
  über die Home-Ordner-Kacheln).
- **Getestet**: Preview-Harness (Playwright) — "Training" taucht in der
  Seitenleiste nicht mehr auf, "Pläne" wird korrekt hervorgehoben, wenn
  `view === "training"`. Screenshot bei Desktop-Breite geprüft. Build +
  oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 54) — Startseite: direkter Hydration-Knopf

Nutzerinnen-Vorgabe: "einen Button hinzufügen mit einem großen Tropfen,
der immer direkt zur Hydration führt ... damit ich immer, wenn ich was
trinke, direkt auf den Knopf drücken kann."

- **`HomeView.jsx`**: neuer, immer sichtbarer Button ganz oben (direkt
  unter der Begrüßung, vor allem anderen Inhalt, unabhängig vom
  Notfallmodus) — großes rundes Tropfen-Icon (`Icon name="droplet"`,
  hydration-Farbe aus `KATEGORIE_META`) + "Hydration eintragen" + kurzer
  Hinweistext. Ein Tap führt direkt zu `onOpenView("hydration")`, ohne
  erst über Direktzugriff oder Tagesplan suchen zu müssen.
- **Getestet**: Preview-Harness (Playwright) — Klick löst zuverlässig
  `onOpenView("hydration")` aus, Icon/Farben/Layout per Screenshot
  geprüft. Build + oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 53) — Archiv: Mehrfachauswahl zum Löschen

Nutzerinnen-Vorgabe: "ganze Bereiche der Protokolle auf einmal löschen ...
alle markieren und dann alle auf einmal löschen ... oder markierte" — die
einzelnen 🗑-Buttons pro Zeile im Archiv waren mühsam, wenn viele Einträge
weg sollen.

- **`ui/ArchivAbschnitt.jsx`** (neu): wiederverwendbare Liste mit
  Checkbox je Zeile, "Alle auswählen"/"Auswahl aufheben" und einem
  "X löschen"-Sammel-Button (erscheint erst ab 1 Auswahl), jeweils mit
  Sicherheitsabfrage. Der einzelne 🗑-Button pro Zeile bleibt zusätzlich
  erhalten — für "nur diesen einen schnell weg" ohne erst Auswahlmodus.
- **`plan/ArchivTab.jsx`**: alle vier Archiv-Bereiche (Abgeschlossene
  Protokolle, Abgeschlossene Hauptprotokolle, Blutwerte-Verlauf,
  Check-in-Verlauf) nutzen jetzt `ArchivAbschnitt` statt der bisherigen
  fest verdrahteten Einzel-Lösch-Listen.
- **`useBiomarkerData.js`**: Blutwerte-Verlauf hatte bisher gar KEINE
  Löschmöglichkeit — neue Funktion `blutwertEntfernen(id)` nachgerüstet
  (gleiches Rollback-bei-Fehler-Muster wie überall sonst), `id` wird jetzt
  mitgeladen/nach dem Anlegen zurückgegeben, damit einzelne Einträge
  überhaupt adressierbar sind.
- **Getestet**: Preview-Harness (Playwright) — einzelne Checkboxen
  markieren, Sammel-Löschen entfernt genau die ausgewählten, "Alle
  auswählen" markiert alle sichtbaren und der Text wechselt zu "Auswahl
  aufheben", letzter Eintrag gelöscht zeigt wieder den Leer-Text. Build +
  oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 52) — Routine-Reiter ("Pläne → Morgenroutine"/"Routinen"): Einstellungen weggeräumt

Nutzerinnen-Vorgabe (mit Screenshot): derselbe "Maske bearbeiten"-Eindruck
wie in Teil 51 bestand nicht nur auf der Startseite, sondern auch auf dem
eigenständigen "Morgenroutine"/"Abendroutine"-Reiter unter "Pläne" sowie
auf der "Routinen"-Seite in der Seitenleiste — dort standen Start-Button,
Schritte-Editor, Playlist-Auswahl (volle Pill-Liste), Erinnerungs-
Einstellungen und Zeitrahmen-Felder alle gleichrangig nebeneinander.
Gewünscht: nur noch, was in der Routine steht + Bestätigungspunkt je
Schritt, plus ein reiner Hinweis, welche Playlist zugeordnet ist (kein
Auswahl-Widget) — "nicht diese ganzen Wahlpunkte".

- **`RoutineTabView.jsx`** (Reiter "Pläne → Morgenroutine"/"Abendroutine",
  identisch mit dem von der Nutzerin gezeigten Screenshot): oben jetzt nur
  noch Titel, ein reiner Text-Hinweis "🎵 Playlist: <Name>" (falls
  zugeordnet, sonst nichts) und der Start-Button. Direkt darunter die aus
  Teil 51 bekannte `RoutineHeuteChecklist`. "Schritte einrichten"
  (Editor), die volle Playlist-Auswahl (`SpotifyAnlassPicker`),
  Erinnerungs-Einstellung, Zeitrahmen-Felder und die "Passt in deinen
  Zeitrahmen"-Übernahme-Vorschläge sitzen jetzt gemeinsam hinter einem
  einzigen "⚙️ Einstellungen"-Klapp-Button, standardmäßig zugeklappt.
- **`GewohnheitenView.jsx`** (Seitenleiste → "Routinen", identisches
  Problem): die bisher kombinierte "🌅🌙 Morgen- & Abendroutine"-Karte in
  zwei einzelne Karten (Morgen/Abend) mit je Playlist-Hinweis, Start-
  Button und `RoutineHeuteChecklist` aufgeteilt; Schritte-Editor +
  Playlist-Auswahl (beide Routinen) hinter einem gemeinsamen "⚙️
  Einstellungen"-Klapp-Button zusammengefasst, ebenfalls zugeklappt per
  Standard.
- Der geführte "▶️ ... starten"-Ablauf (Timer-geführt) bleibt an beiden
  Stellen unverändert erreichbar — nur als zusätzliche Option neben der
  Checkliste, nicht als einziger Weg.
- **Getestet**: Preview-Harness (Playwright, `RoutineTabView` mit
  vollständigem `AppDataContext`-Mock) — im zugeklappten Ausgangszustand
  sind Playlist-Hinweis, Start-Button und Checkliste (inkl. berechneter
  Uhrzeiten) sichtbar, Zeitrahmen/Playlist-Pills/Erinnerung NICHT; nach
  Klick auf "⚙️ Einstellungen" erscheinen sie. Screenshots beider
  Zustände visuell geprüft. Build + oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 51) — Morgen-/Abendroutine: Schritte direkt auf der Startseite abhaken

Nutzerinnen-Vorgabe (ausführlich, u. a. am Beispiel "Exemestan bestätigen"):
das Bestätigen eines einzelnen Routine-Schritts war "sehr umständlich" —
Klick führte zum Tagesplan, dort stand der Punkt unter "Morgenroutine",
und das Zahnrad öffnete den Schritte-EDITOR statt einer Bestätigung
("als würde ich die Maske bearbeiten wollen"). Gewünscht: die
Morgenroutine/Abendroutine soll beim Antippen auf der Startseite direkt
aufklappen und NUR die echten, konfigurierten Schritte zeigen — Zeit für
Zeit (z. B. "6:30 ...", "6:40 ..."), mit einem eigenen Bestätigungspunkt
direkt daneben je Schritt. Zusätzlich: die jeweils oberste "Als
Nächstes"-Karte (das, was als Nächstes ansteht) soll sich etwas von den
anderen abheben.

- **Ursache des alten Verhaltens**: `TagesplanView.jsx`s "Morgenroutine"-
  Block gruppiert nur alles vor 11 Uhr per Uhrzeit-Bucket unter diese
  Überschrift (Zufallstreffer, keine echte Verknüpfung zu den
  konfigurierten Routine-Schritten), das Zahnrad öffnet den
  `RoutineSchritteEditor` (zum Einrichten, nicht zum Abhaken). Außerdem
  gab es bisher KEINE Möglichkeit, einen einzelnen Routine-Schritt
  unabhängig vom kompletten geführten Ablauf (`RoutineAblauf.jsx`,
  Timer-geführt, ein Durchlauf wird erst ganz am Ende als Ganzes
  gespeichert) direkt zu bestätigen.
- **Neue Migration `0083_routine_schritt_logs.sql`**: eigene, schlanke
  Tabelle `routine_schritt_logs` (eine Zeile = an diesem Tag erledigt,
  gleiches Muster wie `routine_logs` bei Gewohnheiten) — **muss von der
  Nutzerin selbst im Supabase-Dashboard ausgeführt werden**.
- **`useRoutinen.js`**:
  - `routineSchrittZeit(schrittId)`: leitet die Uhrzeit eines Schritts
    her (Zeitrahmen-Start der Routine + Summe der Dauer aller
    vorherigen Schritte) — es gibt dafür keine eigene Uhrzeit-Spalte je
    Schritt, das wird bewusst berechnet statt gespeichert. Ohne
    gesetzten Zeitrahmen-Start gibt's keine Uhrzeit (kein "zu spät",
    siehe Belohnungsfenster-Logik).
  - `routineSchrittErledigtUmschalten(schrittId, datum)`: bestätigt/
    entfernt EINEN Schritt für einen Tag, unabhängig vom geführten
    Ablauf — der bleibt für alle, die lieber Schritt für Schritt mit
    Timer durchgehen wollen, unverändert nutzbar. Sind danach ALLE
    Schritte der Routine für diesen Tag abgehakt, wird automatisch ein
    normaler Durchlauf gespeichert (`routine_durchlaeufe`) — dieselbe
    Quelle, die Streaks/Abzeichen (`utils/errungenschaften.js`) und die
    Direktzugriff-Widgets/"Als Nächstes"-Filterung in `HomeView.jsx`
    sowieso schon lesen, damit "heute erledigt" unabhängig vom
    verwendeten Weg konsistent bleibt. Feuert außerdem — wie die
    übrigen Kategorien seit Teil 47 — eine Belohnungsfenster-Meldung je
    bestätigtem Schritt, wenn nicht später als der Admin-Puffer nach
    der berechneten Uhrzeit.
- **`ui/RoutineHeuteChecklist.jsx`** (neu): zeigt für eine Routine
  ausschließlich ihre echten Schritte, je mit berechneter Uhrzeit +
  Name + "Bestätigen"-Button (bzw. `StatusBadge` "Erledigt", sobald
  erledigt) — bewusst kein Navigieren, kein Editor.
- **`HomeView.jsx`**: Tippen auf "Morgenroutine"/"Abendroutine" in "Als
  Nächstes" klappt jetzt `RoutineHeuteChecklist` direkt darunter auf/zu
  (Pfeil ▼/▲ statt "›"), statt zu einer anderen Seite zu springen. Der
  Detailtext zeigt jetzt echten Fortschritt ("3 von 6 Schritten
  erledigt") statt der bisherigen pauschalen "Routine offen". Die
  oberste Karte der Liste ist jetzt etwas größer (Schrift, Punkt,
  Innenabstand) als der Rest — Nutzerinnen-Vorgabe: das, was als
  Nächstes ansteht, soll sich abheben.
- **Getestet**: Zeitberechnung isoliert mit Node gegen ihr eigenes
  Beispiel (Start 6:30 → 6:30/6:32/6:34 bei 2-Minuten-Schritten,
  Mitternacht-Überlauf geprüft). Checkliste per Preview-Harness
  (Playwright): Uhrzeiten + Namen korrekt angezeigt, Bestätigen schaltet
  auf "Erledigt" um. Build + oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 50) — Bug-Fix: Eigenes Startdatum ließ sich nicht zurücksetzen

Nutzerinnen-Vorgabe: "Ich kann das eingegebene Startdatum nicht
zurücksetzen ... habe ich jetzt was aus Versehen angewählt und das kann
ich jetzt nicht mehr auf null setzen."

- **Ursache**: `DosierungFields.jsx` nutzt für "Eigenes Startdatum" ein
  natives `<input type="date">` — am Desktop (Chrome) gibt's dort ein
  kleines "×" zum Leeren, auf dem iPad/Safari fehlt diese Möglichkeit
  komplett. Einmal gesetzt, ließ sich das Feld über die native UI gar
  nicht mehr leeren.
- **Fix**: eigener "Zurücksetzen"-Button neben dem Datumsfeld, erscheint
  nur wenn ein Wert gesetzt ist, setzt ihn browserunabhängig auf leer
  (die Datenschicht wandelt einen leeren String beim Speichern schon
  korrekt in `null` um, siehe `useHormoneData.js`/`useProtocolData.js` —
  das war rein ein UI-Problem, kein Speicherproblem). Da `DosierungFields`
  eine gemeinsame Komponente ist, gilt der Fix automatisch überall dort,
  wo "Eigenes Startdatum" vorkommt: Medikamente/Hormone/Peptide (Anlegen
  + Dosis bearbeiten) und im Onboarding.
- Getestet per Preview-Harness (Playwright): Button erscheint nur bei
  gesetztem Datum, ein Klick leert das Feld zuverlässig, Button
  verschwindet danach wieder. Build + oxlint (weiterhin 18 Warnungen).

## ✅ Update 12.09.2026, Fortsetzung (Teil 49) — Cannabis als Medikamente-Kategorie

Nutzerinnen-Vorgabe: Cannabis als eigene Kategorie unter Medikamente, mit
THC-/CBD-Prozentangabe, Menge/Rhythmus/Uhrzeiten "wie bei jeder anderen
Medigabe auch", aber mit den passenden Konsumform-Details — Blüte zum
Rauchen (inkl. Tabak-Beimischung, Filter-Typ), Blüte zum Verdampfen (inkl.
Temperatur), Öl in Tropfenform (Anzahl Tropfen) — und "alle möglichen und
in Deutschland legalen Varianten".

- **Neue Migration `0082_cannabis_felder.sql`**: 6 neue, optionale Spalten
  auf `hormones` (`cannabis_thc_prozent`, `cannabis_cbd_prozent`,
  `cannabis_tabak_menge`, `cannabis_filter`, `cannabis_temperatur_grad`,
  `cannabis_tropfen`) — **muss von der Nutzerin selbst im Supabase-
  Dashboard ausgeführt werden**. Gleiches Muster wie die bereits
  bestehenden Peptid-spezifischen Felder `bac_wasser_ml`/`spruehstoesse`
  auf derselben Tabelle (Migration 0077): eine gemeinsame Tabelle für
  Hormone/Medikamente/Peptide/Cannabis statt einer eigenen Tabelle pro
  Kategorie, mit optionalen kategoriespezifischen Spalten.
- **`constants.js`**: `MEDIKAMENTE_KATEGORIEN` um "Cannabis" erweitert;
  `EINNAHMEARTEN` um "Blüte (Rauchen)", "Blüte (Verdampfen)", "Esswaren
  (Edibles)" erweitert — "Kapsel" und "Tropfen" gab's als Einnahmeart
  schon (deckt Cannabis-Kapseln/-Öl mit ab). Neu:
  `CANNABIS_FILTER_OPTIONEN` (Aktivkohlefilter/Papierfilter/Kein Filter).
- **Menge, Intervall und Uhrzeit(en) laufen bewusst über die schon
  vorhandenen generischen Dosierungs-Felder** — keine neue Spalte dafür,
  genau wie bei jedem anderen Medikament (die Nutzerin verglich das
  explizit: "wie bei jeder anderen Medigabe auch"). Menge-Placeholder
  wechselt bei Kategorie "Cannabis" von "z. B. 100 mg" auf "z. B. 0,3 g".
- **`ui/CannabisFelder.jsx`** (neu): THC-%/CBD-% immer sichtbar (sobald
  Kategorie "Cannabis"), plus konditionale Detailfelder je gewählter
  Einnahmeart:
  - "Blüte (Rauchen)" → Tabak-Beimischung (Pills "Ohne Tabak"/"Mit
    Tabak", bei "Mit Tabak" zusätzliches Mengenfeld) + Filter-Typ-Pills.
  - "Blüte (Verdampfen)" → Temperatur (°C).
  - "Tropfen" → Anzahl Tropfen pro Einnahme.
  - "Kapsel"/"Esswaren (Edibles)" → kein Zusatzfeld, Hinweistext auf das
    generische Menge-Feld (z. B. mg).
  Werte bleiben beim Wechseln der Einnahmeart erhalten (nur ausgeblendet,
  nicht gelöscht) — zurückwechseln verliert nichts.
- **`useHormoneData.js`**: die 6 neuen Felder in `rowToHormonDosierung`,
  `DOSE_FELD_TO_COLUMN`, `NUMERIC_FELDER`, `toRow()` und im lokalen
  State-Aufbau nach dem Anlegen ergänzt — anders als bei
  bacWasser/spruehstoesse (die bisher nur nachträglich über die Dosis-
  Bearbeitung gesetzt werden) sind die Cannabis-Felder von Anfang an auch
  im Anlege-Formular ausfüllbar.
- **`MedikamenteView.jsx`**: `CannabisFelder` sowohl im "Neues Medikament
  hinzufügen"-Formular als auch in der Protokoll-Liste (kompakte
  Zusammenfassungszeile: `THC 22% · CBD 0,8% · Tabak 0,3 g ·
  Aktivkohlefilter` o. ä.) eingebunden; `DOSIS_FELDER` um die neuen Felder
  erweitert, damit Änderungen über "Dosis bearbeiten" tatsächlich
  gespeichert werden; beim Wechsel der Kategorie auf "Cannabis" wird die
  Einnahmeart-Voreinstellung automatisch von "Injektion" auf "Blüte
  (Rauchen)" umgestellt statt einer unsinnigen Kombination; KiChat-
  Systemprompt kennt die neuen Cannabis-Einnahmearten (THC/CBD/Konsum-
  Details trägt die Nutzerin danach manuell nach, nicht über den Chat).
- **`ui/DosisBearbeitenPanel.jsx`**: `CannabisFelder` auch im
  Bearbeiten-Panel bestehender Einträge eingebunden (gleicher
  Menge-Placeholder-Wechsel).
- **Getestet**: Preview-Harness (Playwright) — Umschalten zwischen allen
  vier Konsumformen, Tabak-Toggle mit Mengenfeld, Filter-Auswahl,
  Temperatur- und Tropfenzahl-Eingabe, THC-/CBD-Werte bleiben beim
  Formwechsel erhalten. Build + oxlint (weiterhin 18 Warnungen,
  unverändert zur Baseline).

## ✅ Update 12.09.2026, Fortsetzung (Teil 48) — Belohnungsfenster: auch Mahlzeiten

Nutzerinnen-Vorgabe: "Ja, Du kannst gerne Mahlzeiten noch verknüpfen." —
Ernährung war in Teil 47 bewusst außen vor gelassen worden, weil nicht
ausdrücklich genannt.

- **`useMealData.toggleMahlzeitErledigt`**: gleiche Verdrahtung wie
  Medikamente/Supplemente — Belohnung nur beim Abhaken (nicht beim
  Rückgängigmachen) und nur innerhalb des Admin-Puffers nach der
  geplanten Uhrzeit (neuer Parameter `belohnungPufferMin`, aus
  `AppDataContext.jsx` durchgereicht wie bei den anderen Kategorien).
  Sonderfall geprüft: der `zeit`-Parameter ist bei Mahlzeiten oft nur
  eine Tageszeit-Bezeichnung ("Frühstück") statt einer echten Uhrzeit
  (`NutritionView.jsx`: `e.uhrzeit || e.tageszeit || "Mahlzeit"`) —
  `istRechtzeitig()` erkennt das (kein "HH:MM"-Muster) und lässt es
  dann unbegrenzt durch, statt fälschlich abzulehnen; nur bei einer
  echten Uhrzeit greift der Puffer. Mit Node isoliert gegengeprüft.
- Build + oxlint (weiterhin 18 Warnungen, unverändert zur Baseline).

## ✅ Update 12.09.2026, Fortsetzung (Teil 47) — Belohnungsfenster

Nutzerinnen-Vorgabe: bei jeder rechtzeitig erledigten Tagesaufgabe (egal
ob Morgen-/Abendroutine, Training, Medikamente, Supplemente, Hydration)
soll ein sichtbares Belohnungsfenster erscheinen — ein direktes visuelles
Feedback der App ("möchte ich zum Beispiel sehen, wie viele Punkte ich
gesammelt habe"). Für Aktivitäten mit echtem Start/Ende-Verlauf
(Training, Morgen-/Abendroutine) zählt für "rechtzeitig" der **Start**,
nicht das Ende — einmal innerhalb eines Zeitpuffers nach der geplanten
Uhrzeit begonnen, darf die Erledigung selbst beliebig lange dauern
("Zeiten-Flexibilität"). Für einfache Ja/Nein-Erledigungen (Medikamente,
Supplemente) ist die Erledigung selbst die einzige zu prüfende Aktion.
Der Zeitpuffer (Standard 10 Minuten) ist admin-konfigurierbar.

- **Neue Migration `0081_belohnung_puffer_min.sql`**: `profiles.belohnung_puffer_min`
  (integer, Default 10) — **muss von der Nutzerin selbst im Supabase-Dashboard
  ausgeführt werden**, diese Umgebung hat keinen Supabase-Zugriff.
- **`utils/belohnungZeit.js`** (neu): `istRechtzeitig(geplanteUhrzeit, pufferMin, jetzt)`
  — true, wenn keine geplante Uhrzeit vorhanden ist (nichts, wogegen "zu
  spät" gemessen werden könnte) oder `jetzt` nicht später als geplante
  Uhrzeit + Puffer liegt. Früher als geplant zählt immer als rechtzeitig.
- **`utils/belohnungBus.js`** (neu): einfacher Publish/Subscribe-Kanal
  (`feuereBelohnung`/`aufBelohnungHoeren`) — die auslösenden Stellen
  (Daten-Hooks, RoutineAblauf, TrainingView) haben keinen sinnvollen
  gemeinsamen React-Vorfahren mit der Popup-Komponente, deshalb ein
  globaler Kanal statt Context/Props-Durchreichen durch jeden Hook.
- **`ui/Belohnungsfenster.jsx`** (neu): Toast-Popup oben mittig, hört auf
  den Bus, zeigt Icon + Text + "+1 Punkt", blendet nach 2,6s automatisch
  wieder aus. Einmalig in `AuthenticatedApp.jsx` gemountet (bleibt beim
  View-Wechsel erhalten, da außerhalb des `key={view}`-Wrappers). Zeigt
  bewusst NICHT die Gesamtpunktzahl aus dem bestehenden
  Errungenschaften-System (`useErrungenschaften`) an — das würde eine
  Neuberechnung an jeder einzelnen Erledigen-Stelle erfordern, für eine
  reine "+1 Punkt"-Anzeige unverhältnismäßig viel Verdrahtung. "1 Punkt
  pro erledigtem Eintrag" gilt dort unverändert weiter.
- **Verdrahtung** (jeweils nur beim Abhaken/Start, nicht beim
  Rückgängigmachen, und nur wenn `istRechtzeitig(...)` true liefert):
  - `useHormoneData.toggleHormonErledigt` (Medikamente/Hormone)
  - `useSupplementData.toggleSupplementErledigt` (Supplemente)
  - `useHydrationData.hydrationHinzufuegen` — Sonderfall: keine geplante
    Uhrzeit vorhanden, deshalb kein Zeitpuffer-Check — Belohnung stattdessen
    beim erstmaligen Erreichen des Tagesziels (nicht bei jedem Schluck-Tap).
  - `RoutineAblauf.jsx` — Rechtzeitigkeit wird einmalig beim Mounten gegen
    `routineEinstellungen[routine].startZeit` geprüft (Ref, nicht bei
    jedem Schritt neu), Belohnung erst beim wirklichen Abschluss.
  - `TrainingView.jsx` — nur "Jetzt live starten" (echter Start-Moment,
    inkl. Direktstart aus der Vorlagen-Verwaltung), NICHT "Nur eintragen"
    (reine nachträgliche Protokollierung, kein Live-Vorgang). Rechtzeitigkeit
    wird beim Start in einer Ref (Session-ID → boolean) gemerkt, weil die
    tatsächliche Prüfung erst beim späteren `trainingAbschliessen` zählt.
  - `useProfileData.js`: neues Feld `belohnungPufferMin` + Setter
    `setBelohnungPufferMin`, gleiches Rollback-bei-Fehler-Muster wie die
    übrigen Set-Funktionen dieser Datei.
- **`MehrTab.jsx`**: neue Einstellungskarte "Belohnungsfenster" mit
  Puffer-Eingabefeld (Minuten) — bewusst KEIN separater Admin-Dashboard-
  Screen: dank des bestehenden "Verwalten als"-Mechanismus (AdminContext)
  bearbeitet dieselbe Stelle beim Verwalten eines Probanden automatisch
  dessen Profil, kein zusätzlicher Verdrahtungsaufwand nötig. Neue
  i18n-Strings (`mehr.belohnung*`) in de/en/tr.
- **Getestet**: `istRechtzeitig()` isoliert mit Node gegen die von der
  Nutzerin genannten Beispielwerte (Training 15:00 geplant, Start 15:12
  mit 10-Minuten-Puffer → korrekt abgelehnt; Start 15:08 → korrekt
  angenommen; frühzeitiger Start → immer angenommen; Randfall exakt an
  der Pufferschwelle). Das Popup selbst per Preview-Harness (Playwright)
  interaktiv geprüft: erscheint korrekt mit Text/Icon/Punkten, blendet
  nach 2,6s automatisch wieder aus, mehrere Belohnungen nacheinander
  funktionieren.
- **Bewusst nicht verdrahtet**: Mahlzeiten und Gewohnheiten (von der
  Nutzerin nicht genannt) — falls gewünscht, ist die Verdrahtung nach
  demselben Muster wie Medikamente/Supplemente in wenigen Zeilen
  nachrüstbar (`useMealData.toggleMahlzeitErledigt`,
  `useGewohnheitenData.toggleGewohnheitErledigt`).

## ✅ Update 12.09.2026, Fortsetzung (Teil 46) — Morgen-/Abendroutine: bestehende Einträge per Reiter übernehmen

Nutzerinnen-Vorgabe: beim Einrichten einer Morgen-/Abendroutine nicht
alles von Hand eintippen müssen — stattdessen auf "Training", "Ernährung",
"Supplemente", "Medikamente", "Gewohnheiten" klicken können und von dort
direkt einen schon vorhandenen Eintrag (z. B. einen Snack, eine
Trainingseinheit) als Routine-Schritt übernehmen. Ausdrücklich KEIN neuer
großer Bereich — die bereits bestehenden Daten sollen nur mit wenigen
Klicks aus der Routine heraus erreichbar sein. Freies Handschreiben soll
bestehen bleiben (für Dinge wie "Wasser trinken", "Duschen", die keinem
Tracker angehören).

- **`RoutineSchritteEditor.jsx`**: neue Reiter-Reihe "Aus anderen
  Bereichen übernehmen" unter den bestehenden hardcodierten Beispielen
  — sechs Reiter (Training, Ernährung, Supplemente, Medikamente,
  Gewohnheiten, Hydration), ein Tap auf einen Reiter zeigt die
  jeweiligen echten, schon konfigurierten Einträge als Pills:
  - Training → `trainingWochenplan` (Wochentag + Name/Trainingsart)
  - Ernährung → `mahlzeiten` (Name)
  - Supplemente → `supplemente` (Name)
  - Medikamente → `hormone` (umfasst wie überall in der App auch
    Hormone/Peptide, siehe frühere Vereinheitlichung)
  - Gewohnheiten → `gewohnheiten` (Name)
  - Hydration → hat keine Einzeleinträge (laufende Trinkmenge statt
    Liste), deshalb ein einzelner Schnell-Eintrag "Wasser trinken"
  Ein weiterer Tap auf einen Pill übernimmt ihn direkt als Schritt
  (derselbe `antippen()`-Pfad wie bei den bestehenden Beispielen, inkl.
  Erfolgs-/Fehlermeldung). Bereits übernommene Einträge verschwinden aus
  ihrem Reiter (gleiches Filtermuster wie bei den Beispielen) — eine
  eigene Meldung unterscheidet "dort ist noch nichts eingerichtet" von
  "schon alles aus diesem Bereich übernommen".
  Bewusst als reiner Zusatz zum bereits vorhandenen "Passt in deinen
  Zeitrahmen"-Vorschlag (`RoutineTabView.jsx`, unverändert) — dieser
  zeigt nur heute ohnehin geplante Punkte innerhalb des Zeitfensters,
  die neuen Reiter zeigen dagegen ALLE konfigurierten Einträge der
  Kategorie, unabhängig von Datum/Uhrzeit, und schließen als einzige
  Stelle auch Gewohnheiten mit ein.
- **`RoutineTabView.jsx`** (Reiter unter "Alle Pläne") und
  **`GewohnheitenView.jsx`** (kompakte Variante unter Home →
  Gewohnheiten) reichen die fünf Datenlisten jetzt an
  `RoutineSchritteEditor` durch — beide Stellen, an denen
  Morgen-/Abendroutine-Schritte eingerichtet werden, haben die neue
  Reiter-Reihe jetzt gleichermaßen (für Morgen- UND Abendroutine).

Mit einer temporären Vorschau-Variante (danach vollständig zurückgesetzt)
geprüft: alle sechs Reiter zeigen die richtigen Einträge, ein Tap übernimmt
korrekt als Schritt, bereits übernommene Einträge verschwinden aus dem
Reiter, funktioniert identisch für Morgen- und Abendroutine. `npm run
build` + `npx oxlint` sauber (18 vorbestehende Warnungen, keine neuen).

---

## ✅ Update 12.09.2026, Fortsetzung (Teil 45) — Home-Redesign gegengelesen, 3 Bugs gefunden und behoben

Nutzerinnen-Vorgabe: vor dem eigenen Test nochmal zeigen + Bereich (den
gerade gebauten Home-Umbau, Teil 44) auf Bugs prüfen. Beim systematischen
Gegenlesen von `HomeView.jsx`/`MiniPlanWidget.jsx` drei echte Bugs
gefunden (einer davon deutlich sichtbar, zwei subtiler):

1. **Balkendiagramm fast komplett unsichtbar.** `TagesfortschrittBalken`
   griff für die Balkenfarbe direkt auf `w.farbe` zu — das Feld ist aber
   nur bei Morgen-/Abendroutine befüllt (siehe `ROUTINE_FARBE`), alle
   anderen Kategorien (Gewohnheiten, Medikamente, Supplemente, Mahlzeiten,
   Training, Hydration, Tageslicht) holen ihre Farbe normalerweise aus
   `KATEGORIE_META[kategorie].dot`. Ohne diesen Fallback hatten 7 von 9
   Balken kein `background` — im Screenshot sah das aus wie ein fast
   leeres Diagramm mit nur 2 sichtbaren Farbflecken. Gefunden beim
   Kontrollieren des HTML-Outputs (Playwright), nicht auf den ersten
   Blick im Screenshot erkennbar.
2. **Tagesfortschritt-Kopfzeile lief zusammen.** `statusText()` liefert
   teils ganze Sätze ("Nur noch zwei Aufgaben bis zum Tagesziel."), nicht
   nur kurze Zahlen — in der einzeiligen `space-between`-Zeile mit dem
   Label gab es dafür keinen Platz, Label und Satz standen ohne
   Zwischenraum nebeneinander. Jetzt eigene Zeile für jedes.
3. **Notfallmodus zeigte einen irreführenden Bruch.** `erledigtCount` kam
   schon aus den notfallmodus-gefilterten `displayItems` (nur
   Medikamente/Hydration), der Gesamtwert aber ungefiltert aus
   `heuteItems.length` — ergab z. B. "2 von 9" statt "2 von 3", obwohl
   der Rest im Notfallmodus bewusst Bonus ist. Beide Werte kommen jetzt
   aus derselben Liste.

Zusätzlich beim Gegenlesen entdeckt (nicht neu durch Teil 44, aber jetzt
deutlich sichtbarer, weil Hydration jetzt garantiert im "Direktzugriff"
auftaucht): der "+200ml"-Aktions-Button in `MiniPlanWidget` lief bei
längeren Kategorienamen über den Namenstext. `MiniPlanWidget` reserviert
jetzt Platz dafür, und hat eine neue optionale `statusText`-Prop für
Kategorien ohne sinnvollen Bruchteil (Morgen-/Abendroutine zeigen jetzt
"heute erledigt"/"heute noch offen" statt "0/1 heute").

Erneut mit der temporären Vorschau-Variante (danach vollständig
zurückgesetzt) geprüft, inkl. direkter HTML-Kontrolle der gerenderten
Balken (nicht nur Screenshot-Blick) — das hat Bug 1 überhaupt erst
zuverlässig aufgedeckt. `npm run build` + `npx oxlint` sauber (18
vorbestehende Warnungen, keine neuen).

---

## ✅ Update 12.09.2026, Fortsetzung (Teil 44) — Home-Bildschirm neu geordnet: Balkendiagramm, Direktzugriff/Weitere Pläne, Morgen-/Abendroutine

Nutzerinnen-Vorgabe: "so viele Diagramme drauf und Ansichten, die aber so
unfunktional sind" — der Routinen-Ring sollte kleiner/ein Button werden,
Morgen-/Abendroutine sollten eigene Buttons bekommen UND im Tagesplan
auftauchen (aktuelle Morgenroutine erschien dort bisher gar nicht), und
Hydration/Notfallmodus/Tagesplan sollten klarer als Direktzugriff wirken.
Vorab drei Mockup-Richtungen als Canvas gezeigt (Claude-Design-Vorschau),
Nutzerin wählte "Option B" und präzisierte danach: Direktzugriff soll nur
die tatsächlich AKTIVEN Pläne zeigen, "Weitere Pläne" nur die inaktiven;
Tagesplan/"Als Nächstes" direkt unter den Tagesfortschritt; Tagesfortschritt
als Balkendiagramm statt Ring.

**Datengrundlage geprüft, bevor gebaut wurde:** Morgen-/Abendroutine
(`routine_schritte`/`routine_durchlaeufe`, `useRoutinen.js`) speichern einen
Durchlauf erst EINMAL ganz am Ende (`routineDurchlaufSpeichern` — kein
Zwischenstand, `RoutineAblauf.jsx` hält den Fortschritt nur lokal im
Komponentenstatus). Die in den Mockups skizzierte Schritt-Bruchteil-Anzeige
("3 von 6 Schritten") war also nicht durch echte Daten gedeckt — bewusst
vereinfacht auf binär "heute erledigt / heute noch offen", statt dafür ein
neues Zwischenspeicher-Feature zu bauen (keine ungefragte Zusatzfunktion).

- **`HomeView.jsx`** umgebaut:
  - **Tagesfortschritt** ist jetzt eine Karte mit Balkendiagramm
    (`TagesfortschrittBalken`, neue kleine Komponente in derselben Datei) —
    ein Balken je Lebensbereich (Gewohnheiten, Morgen-/Abendroutine,
    Medikamente, Hydration, Tageslicht, Supplemente, Mahlzeiten, Training),
    Höhe = heutiger Fortschritt, graue Kurz-Balken = noch nicht eingerichtet.
    Der bisherige zweite Ring ("Routinen") ist weg.
  - **"Als Nächstes"** steht jetzt direkt unter dem Tagesfortschritt (vorher
    weiter unten) und hat einen schlanken "Tagesplan ›"-Link im Titel statt
    des früheren eigenen großen Buttons.
  - **Morgen-/Abendroutine erscheinen jetzt in "Als Nächstes"**, solange sie
    eingerichtet UND heute noch nicht abgeschlossen sind — bleiben stehen,
    bis ein Durchlauf für heute wirklich gespeichert ist (nicht schon beim
    ersten Antippen).
  - **"Direktzugriff"** (aktive Pläne) und **"Weitere Pläne"** (noch nicht
    eingerichtete, mit "+ einrichten"-Hinweis) ersetzen das bisherige "Alle
    Pläne im Überblick"-Raster samt "Alle/Nur genutzte zeigen"-Umschalter
    (Präferenz entfällt — die neue Aufteilung braucht sie nicht mehr,
    `src/utils/widgetPrefs.js` gelöscht). Gewohnheiten, Morgenroutine und
    Abendroutine sind jetzt drei ganz normale Einträge in dieser Liste,
    gleichberechtigt mit Medikamenten/Hydration/etc.
  - Der "Zwischenfälle"-Button aus dem Nutzerinnen-Feedback meinte den
    bereits vorhandenen Notfallmodus-Button — keine neue Funktion nötig.
- **`MiniPlanWidget.jsx`**: neue optionale `farbe`/`hintergrund`-Props —
  Morgen-/Abendroutine haben bewusst KEINEN `KATEGORIE_META`-Eintrag (sonst
  tauchen sie als tote Einträge in der Wochenübersicht-Legende auf, siehe
  Kommentar in `PlaeneView.jsx`), bekommen ihre Farbe jetzt also direkt
  mitgegeben statt über die Kategorie nachgeschlagen.
- **`src/i18n/dict/home.js`**: neue Schlüssel für Direktzugriff/Weitere
  Pläne/"heute noch offen" in de/en/tr ergänzt, `home.gewohnheiten.cta.desc`
  (frühere separate Routinen-Kachel, jetzt entfernt) blieb ungenutzt stehen.

Mit einer temporären Vorschau-Variante von `HomeView.jsx` (Mock-Kontext,
danach vollständig zurückgesetzt — `git status` wieder leer) geprüft:
Balkendiagramm zeigt aktive/inaktive Bereiche korrekt, "Als Nächstes"
zeigt die Morgenroutine mit korrektem Sprung-Ziel, Direktzugriff/Weitere
Pläne teilen sich korrekt nach aktiv/inaktiv auf, alle Klick-Ziele
(morgenroutine/abendroutine/tagesplan/hydration/...) wurden einzeln
gegengeprüft. `npm run build` + `npx oxlint` sauber (18 vorbestehende
Warnungen, keine neuen).

---

## ✅ Update 12.09.2026, Fortsetzung (Teil 43) — Onboarding-Coach speichert direkt, Sprachfenster-Größe stabilisiert

Ausgangsfrage der Nutzerin: kann Aka schon aus freiem Sprechen komplette
Pläne bauen, oder muss danach noch manuell gespeichert werden? Antwort:
für Training/Peptide/den Home-Coach schon (echte KI-Extraktion + direktes
Speichern), aber die 5 übrigen Kategorien-Schritte im Onboarding-Assistenten
(Gewohnheiten, Schlaf, Hydration, Tageslicht, Ernährung) füllten bisher nur
die Formularfelder — ein zusätzlicher "Weiter"/Speichern-Klick war noch
nötig. Daraufhin zwei Aufträge:

**1. Onboarding-Kategorien direkt speichern** (`OnboardingCategoriesView.jsx`,
`onUebernehmenKategorie`):
- **Gewohnheiten, Ernährung** (Listen-Kategorien wie Training): rufen jetzt
  direkt `gewohnheitHinzufuegen` bzw. `mahlzeitHinzufuegen` +
  `wochenplanMahlzeitSetzen` auf und landen sofort in der
  "bereits hinzugefügt"-Liste — kein Formular-Umweg mehr.
- **Hydration, Tageslicht**: rufen direkt `hydrationZielSetzen` /
  `tageslichtZielSetzen` auf; das lokale Eingabefeld bleibt zusätzlich
  vorbefüllt (für die Anzeige), ein späteres "Speichern & weiter" schreibt
  denselben Wert nur nochmal — unschädlich.
- **Schlaf**: einzige "unsichere" Kategorie, weil `speichernUndWeiter` hier
  ausschließlich aus lokalem Komponentenstatus (`schlafBloecke`) speichert.
  Deshalb beides: lokale Vorbefüllung bleibt (`setBlockFeld`), UND es wird
  zusätzlich sofort per `setCategoryZiel("schlaf", …)` mit den frischen
  KI-Werten gespeichert — ein späteres "Weiter" überschreibt damit nicht
  mehr mit veralteten Werten.
- Erfolgstext unter dem "Übernehmen"-Knopf je Kategorie angepasst, damit er
  nicht mehr fälschlich "bitte unten noch speichern" für Kategorien
  behauptet, die längst gespeichert sind.
- Supplemente/Medikamente bewusst NICHT umgestellt (nicht Teil der
  angefragten 5 Kategorien) — bleiben wie bisher reine Formular-Vorbefüllung.

**2. Sprachfenster-Größe stabilisiert** (`KiChat.jsx`): die große
Antwort-Anzeige (`grosseAntwort`) hatte keine Höhenbegrenzung — bei jeder
Antwort sprang dadurch das ganze (am unteren Bildschirmrand verankerte)
Bottom-Sheet sichtbar größer/kleiner, besonders auffällig während des
Streamens. Fix: der Antwort-Textblock hat jetzt `minHeight: 90` /
`maxHeight: 200` mit eigenem `overflowY: auto` — lange Antworten scrollen
innerhalb dieser Box, statt das ganze Sheet wachsen zu lassen. Ein
zusätzlicher Effekt hält die Anzeige beim Streamen automatisch am unteren
Rand der Box (sonst bliebe während des Tippens nur der Anfang sichtbar).
Mit einer statischen HTML/CSS-Nachbildung geprüft: Sheet-Höhe variiert nur
noch um die Differenz aus min-/maxHeight (110px), statt unbegrenzt mit der
Textlänge zu wachsen; Text scrollt intern korrekt.

`npm run build` + `npx oxlint` sauber (18 vorbestehende Warnungen, keine
neuen).

---

## ✅ Update 12.09.2026, Fortsetzung (Teil 42) — Abzeichen-Übersicht mit Beschreibungen, Einstieg unter "Mehr"

Nachtrag zum Erfolge-Feature aus Teil 39/41: "diese ganzen Orden
müssen auch irgendwo einsehbar sein, unter Mehr, und beim Draufklicken
soll eine Beschreibung kommen, was man dafür erfüllen muss."

- **Neue Sektion "Alle Abzeichen"** in `ErfolgeTab.jsx`, unter den
  bereits verdienten — zeigt den kompletten Katalog aller ~104
  möglichen Abzeichen (13 Kategorien × 7 Streak-Stufen + globale
  Streak-/Punkte-Stufen als eigene "Gesamt"-Gruppe), nicht nur die
  schon erreichten. Freigeschaltete Abzeichen farbig (Kategorie-Farbe
  bzw. Marken-Akzent für "Gesamt"), gesperrte grau/abgeblendet.
- **Klick auf ein Abzeichen** zeigt darunter Name, eine Beschreibung
  in einem Satz ("7 Tage in Folge in der Kategorie Training erledigt")
  sowie je nachdem das Erreichungsdatum oder den aktuellen Fortschritt
  zur Schwelle ("aktuell 4 von 7").
- **Neuer Einstiegspunkt "🏆 Erfolge & Abzeichen"** direkt unter
  "Mehr" (`MehrTab.jsx`) — bisher nur über den Archiv-Hub-Reiter
  "Erfolge" erreichbar, jetzt zusätzlich prominent verlinkt. Nutzt
  denselben View-als-Reiter-Trick wie an anderer Stelle in der App
  ("erfolge" steht schon seit Teil 39 in `ARCHIV_VIEW_IDS`).

Badge-Galerie per Playwright gegen Mockdaten getestet (Darstellung
gesperrt/freigeschaltet, Klick-Interaktion, Beschreibungs-Panel).
`npm run build` + `npx oxlint` sauber (18 vorbestehende Warnungen,
keine neuen).

---

## ✅ Update 12.09.2026, Fortsetzung (Teil 41) — Einzeltag-Ausnahmen aus Wochen-/Monatsübersicht

Dritter Punkt aus derselben Feedback-Runde wie Teil 40 (nach visueller
Trennung der Pläne-Seite und PDF-Wochen-Diagrammen): "aus der Wochen-/
Monatsübersicht heraus soll sich ein einzelner Tages-Eintrag
bearbeiten lassen, ohne die ganze wiederkehrende Regel zu ändern —
mit Rückfrage 'nur heute oder dauerhaft', und das muss im Protokoll
nachvollziehbar sein." Nutzerin hat sich bewusst für die vollständige
Version entschieden (echte Einzeltag-Ausnahmen mit eigenem
Datenmodell, nicht nur einen "dauerhaft ändern"-Link).

**Wichtige Erkenntnis vorab:** Training und Zeitblöcke brauchen das
Ausnahmen-Konzept nicht — die haben schon echte, einzelne Tages-Zeilen
in der DB (kein "eine Regel, täglich neu berechnet"-Muster). Betrifft
nur die fünf Kategorien Supplemente, Hormone/Medikamente, Ernährung,
Gewohnheiten, Workflows.

**Migration 0080** (muss wie 0077-0079 manuell im Supabase Dashboard
SQL Editor ausgeführt werden): neue Tabelle `tagesplan_ausnahmen`,
eine gemeinsame Tabelle für alle fünf Kategorien statt fünf einzelner.
`ref_id` verweist je nach Kategorie auf hormones/supplements/
meal_wochenplan/routines/workflow_plaene — nur gesetzte Felder gelten
als überschrieben.

**buildDayItems() (dayItems.js)** prüft jetzt für diese fünf
Kategorien pro generiertem Tages-Eintrag, ob eine Ausnahme existiert —
überschreibt Uhrzeit/Name/Detail oder lässt den Eintrag ganz entfallen
("entfällt heute"). Jeder Eintrag trägt jetzt zusätzlich
`originalUhrzeit`/`ausnahmeKategorie`/`ausnahmeRefId` — wichtig, damit
der Erledigt-Haken immer den echten, zugrunde liegenden Log-Schlüssel
trifft, auch wenn die Anzeige gerade eine überschriebene Uhrzeit zeigt.

**Bedienung:** Klick auf einen Eintrag in Woche/Monat (Monatsraster:
die kleinen Farbpunkte sind jetzt mit vergrößertem Tap-Bereich
antippbar) öffnet ein neues Bottom-Sheet (`TagesEintragBearbeiten.jsx`,
gleiches Muster wie die bestehende Trainings-Vorschau):
- **Erledigt-Haken** — sofort wirksam, eindeutig pro Tag, keine
  Rückfrage nötig.
- **"Heute anders"** — Uhrzeit/Name/Detail nur für diesen einen Tag,
  oder "Entfällt heute komplett". Landet als Ausnahme, wird im
  Änderungsprotokoll vermerkt, lässt sich mit einem Klick wieder
  zurücknehmen.
- **"Dauerhaft ändern"** — navigiert zur vollen, längst vorhandenen
  Bearbeiten-Oberfläche der jeweiligen Kategorie, statt deren
  Formulare hier zu duplizieren (bewusste Scope-Entscheidung, um nicht
  fünf verschiedene Bearbeiten-Formulare doppelt zu pflegen).

**Änderungsprotokoll im PDF:** neuer Abschnitt "Änderungen im
Zeitraum" (live in der App UND im Wochenübersicht-PDF-Export) — nutzt
das bereits bestehende, bereichsübergreifende Änderungsprotokoll
(war schon überall verdrahtet, bisher aber nirgends im PDF sichtbar),
gefiltert auf den gewählten Erfassungszeitraum.

Jeder der drei Teilschritte (Datenmodell/buildDayItems, Bottom-Sheet-
Oberfläche, PDF-Integration) einzeln committet und mit isolierten
Logik-Tests bzw. Playwright-Screenshots gegengeprüft (Override-Logik,
Wochen-Bucketing, Modal-Interaktionen gegen einen gemockten
Daten-Kontext). `npm run build` + `npx oxlint` nach jedem Schritt
sauber (18 vorbestehende Warnungen, keine neuen).

---

## ✅ Update 12.09.2026 (Teil 40) — Home-Kachel-Verwirrung, Tagesplan-Ruckeln, ADHS-Medikation-Kategorie

Drei Punkte aus derselben Nachricht, bevor mit den ausstehenden
Migrationen 0077-0079 weitergemacht wurde (Nutzerin hatte ihren
GitHub-Zugang wiederbekommen).

1. **Home-Kachel "Hormone" wirkte wie ein zweiter, separater Bereich
   neben "Medikamente"** — war aber schon technisch derselbe: Hormone
   und Peptide sind seit Migration 0042 (13.08.) Teil von "hormon"
   (Medikamente), die Kachel öffnete beim Klick bereits dieselbe
   Medikamente-Ansicht. Nur die Beschriftung war fest "Hormone" statt
   "Medikamente" (`HomeView.jsx`, `miniWidgetData`). Umbenannt.

2. **"Tagesplan ruckelt beim Öffnen"** — zwei tatsächliche Ursachen:
   - `buildDayItems()` filterte bei jedem Aufruf die komplette,
     unbegrenzt wachsende Trainingshistorie nach dem gesuchten Tag
     (O(n) Scan statt O(1) Lookup) — wird mit mehr geloggten
     Trainingseinheiten über die Zeit spürbar langsamer.
     `useTrainingData.js` gruppiert jetzt einmal pro Datenänderung
     nach Datum (`trainingNachDatum`, eine Map), `buildDayItems()`
     nutzt sie, wenn mitgegeben (Fallback bleibt bestehen).
   - `TagesplanView.jsx`: `montag`/`wochentage` waren nicht
     memoisiert, und die Wochenansicht rief `itemsForDate(d)` für
     alle 7 Tage direkt im Render-Body statt gecacht auf — beides
     zusammen ließ `buildDayItems()` bei praktisch jeder Interaktion
     irgendwo in der App neu für die ganze Woche laufen. Exakt
     dasselbe Muster wurde in `WochenuebersichtView.jsx` bereits in
     Teil 30 behoben (dort ausführlich dokumentiert) — nur eben nicht
     auch auf `TagesplanView.jsx`/`HomeView.jsx` übertragen. Jetzt
     nachgezogen (inkl. `heuteItems` in `HomeView.jsx`).
   - **Nicht behoben, bewusst zurückgestellt:** die tiefere
     Ursache dahinter — der `AppDataContext`-Wert selbst ist kein
     memoisiertes Objekt (~30 Datenhooks, laufen beim App-Start
     unabhängig voneinander durch, jeder mit eigenem Ladezustand),
     wodurch jede Komponente, die `useAppData()` nutzt, bei jeder noch
     so unbeteiligten Zustandsänderung neu rendert. Die obigen Fixes
     dämpfen die sichtbaren Auswirkungen davon deutlich, beheben aber
     nicht die Ursache selbst — eine vollständige Memoisierung des
     ~150-Felder-Objekts wäre ein eigenes, größeres Vorhaben (jedes
     einzelne Feld müsste korrekt als Dependency geführt werden).
3. **Neue Medikamente-Kategorie "ADHS-Medikation"** — Ritalin/
   Elvanse/Antidepressiva hatten bisher keine eigene Kategorie
   (nur Hormone/Peptid/Blutdruck/Diabetes/Cholesterin/Schmerzmittel/
   Sonstige) und wären unter "Sonstige" gelandet, obwohl das der
   eigentliche Kernzweck von "Medikamente" bei einer ADHS-App ist.
   Als erste Option in `MEDIKAMENTE_KATEGORIEN` ergänzt.

`npm run build` + `npx oxlint` nach jedem Punkt sauber (18
vorbestehende Warnungen, keine neuen).

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 39) — Neues Feature: Punkte-/Abzeichen-System ("Erfolge")

Nutzerinnen-Vorgabe (Brainstorming, dann konkretisiert): ein
Belohnungssystem — Punkte, Streaks ("28 Tage", "90 Tage", ...) und
Abzeichen, die man sich verdient. Geklärt wurden vorab zwei
Design-Entscheidungen: Streaks/Punkte gelten sowohl **pro Kategorie**
als auch **global** (nicht nur eins von beidem), und es gibt **1 Punkt
pro erledigtem Eintrag** (nicht gewichtet nach Aufwand).

**Datenmodell — bewusst schlank:** Punkte und Streaks werden NICHT
separat gespeichert, sondern bei Bedarf direkt aus den bereits
geladenen "erledigt"-Daten jeder Kategorie berechnet
(`src/utils/errungenschaften.js`) — vermeidet doppelte Buchhaltung und
das Risiko, dass ein eigener Zähler von den echten Daten abweicht. Nur
WELCHE Abzeichen bereits verdient wurden, muss dauerhaft festgehalten
werden (sonst verschwindet ein Abzeichen wieder, sobald ein Streak
später reißt) — dafür die neue Tabelle `errungenschaften` (Migration
0079, muss wie 0077/0078 manuell im Supabase Dashboard SQL Editor
ausgeführt werden).

**13 Kategorien** mit eigenem Streak: Morgenroutine, Abendroutine,
Schlaf, Hydration, Tageslicht, Ernährung, Training, Supplemente,
Hormone & Medikamente, Peptide, Gewohnheiten, Getränke-Rezepte,
Atemübungen — plus ein globaler Streak über alle Kategorien
gemeinsam. Hydration/Tageslicht sind zielwert- statt haken-basiert:
ein Tag zählt dort nur, wenn das Tagesziel erreicht wurde. Hormone und
Medikamente teilen sich technisch dieselbe Tabelle (nur ein Textfeld,
keine echte DB-Verknüpfung) — auf Nutzerinnen-Wunsch bewusst als EINE
gemeinsame Kategorie geführt statt den Mehraufwand einer sauberen
Trennung zu betreiben.

**Abzeichen-Meilensteine:** Streak-Abzeichen (pro Kategorie + global)
bei 7/14/28/60/90/180/365 Tagen am Stück, Punkte-Abzeichen (global) bei
50/100/250/500/1000/2500 Punkten. Neu verdiente Abzeichen werden beim
Öffnen der Ansicht automatisch in die DB geschrieben und kurz optisch
hervorgehoben (gleiches fadeIn-Muster wie bei "neue Ergebnisse
sichtbar machen", Teil 32).

**Oberfläche:** neuer Reiter "Erfolge" im "Archiv"-Hub (neben
Statistik) — Gesamtpunkte + globaler Streak oben, darunter eine
Kategorie-Kachel-Übersicht (nur Kategorien mit mindestens einem
Eintrag) mit Punkten/Streak/nächstem Meilenstein, darunter die
verdienten Abzeichen mit Datum. Zwei neue Icons (trophy, flame) im
zentralen Linien-Icon-Set ergänzt.

Bewusst NICHT in den immer geladenen `AppDataContext` gehängt, sondern
nur berechnet, wenn die "Erfolge"-Ansicht tatsächlich geöffnet wird —
kein zusätzlicher Ladeaufwand beim normalen App-Start.

Kernlogik (Punktezählung, Streak-Berechnung mit Lücke, "heute noch
offen"-Kulanz, gemischte Datumsformate zwischen den Kategorien)
isoliert mit Beispieldaten gegengeprüft, bevor es in die App integriert
wurde. `npm run build` + `npx oxlint` sauber (18 vorbestehende
Warnungen, keine neuen).

**Offen für später** (bewusst nicht Teil dieser ersten Version, siehe
frühere Brainstorming-Runde): die andere Idee aus demselben Gespräch —
Bereiche pro Coachee gezielt freischalten/sperren (z. B. "Training erst
freigeben, wenn Schlaf/Morgenroutine etabliert sind") — wurde
zurückgestellt, da zuerst geklärt werden sollte, wonach ein Coach
"erfolgreich genug" tatsächlich bemisst.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 38) — Rollback bei Fehlern: restliche Daten-Hooks

Nach Abschluss der ursprünglichen Teil-27-Liste (Teil 37) auf "mach weiter,
wo du aufgehört hast" hin ein systematischer Nachzieh-Scan: dasselbe
Rollback-Muster aus Teil 30/36 (optimistisches `setState` vor einem
Supabase-Write, aber kein Zurückrollen bei einem Fehler) wurde jetzt auch
in allen bis dahin ungeprüften `src/data/use*.js`-Hooks nachgezogen.

**Auffälligster Fund:** `usePushNotifications.js` → `pushDeaktivieren`
prüfte den Löschvorgang der Push-Subscription in der DB überhaupt nicht
(reines Fire-and-Forget) — schlug er fehl, stand trotzdem "deaktiviert"
in der Oberfläche, während der Server über die verwaiste Zeile
theoretisch weiter Push-Nachrichten ans Gerät hätte schicken können.

**Weitere behobene Stellen** (gleiches Muster: fehlender Rollback bzw.
komplett fehlende Fehlerprüfung):
- `useSupplementData.js` (6 Funktionen: Bearbeiten, Foto, Erledigt-Toggle,
  Feedback speichern/überspringen, "alle einer Tageszeit bestätigen")
- `usePeptideLogs.js` (Feedback speichern/überspringen)
- `useRoutinen.js` (`schrittEntfernen` — war im Löschfunktionen-Sweep aus
  Teil 31 offenbar durchgerutscht; `schrittVerschieben` — die zwei
  parallelen Updates wurden gar nicht auf Fehler geprüft)
- `useMealData.js` (Bearbeiten, Zutat bearbeiten, Foto, Erledigt-Toggle)
- `useTrainingData.js` (Erledigt setzen, Abschließen, Feedback speichern)
- `useGewohnheitenData.js` (Akut-Favorit-Toggle, Erledigt-Toggle)
- `useDrinkRecipes.js` (Erledigt-Toggle)
- `useHydrationData.js` / `useTageslichtData.js` (Ziel setzen)
- `useTrainingTemplates.js` (Vorlage bearbeiten, Erinnerung einzeln/alle
  umschalten)
- `useWorkflowData.js` (Preset bearbeiten)
- `useTeamData.js` (Nachricht als gelesen markieren — geringste
  Auswirkung, betrifft nur ein Ungelesen-Badge)

Geprüft und bereits sauber (kein Fund): `useAdminNotizen.js`,
`useAenderungsprotokoll.js`, `useAkutModus.js`, `useAtemuebungenData.js`,
`useBausteinVersionen.js`, `useCheckinData.js`, `useCoachVerlauf.js`,
`useCoachWissen.js`, `useCoacheeNachrichten.js`, `useHauptprotokollData.js`,
`useLexikon.js`, `useQuestData.js`, `useUebungsBilder.js`,
`useUniversellerCoach.js`, `useWochenprotokollMeilenstein.js`,
`useZeitbloecke.js`.

`npm run build` + `npx oxlint` sauber (18 vorbestehende Warnungen, keine
neuen).

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 37) — Doppeltes aktives Protokoll: Race Condition behoben

Letzter offener Punkt aus Teil 27/35/36 ("Behebe bitte alle Punkte, die
Du in der Zwischenzeit beheben kannst").

**Das Problem:** `useProtocolData.js` lädt beim Start das aktive
Protokoll und legt eins an, falls keins existiert — Prüfung ("gibt es
schon eins?") und Anlegen liefen dabei ohne DB-seitige Sperre
nacheinander ab. Bei zwei fast gleichzeitigen Ladevorgängen (React-
StrictMode-Doppel-Mount, zwei offene Browser-Tabs) konnten beide "kein
aktives Protokoll" sehen und je eins anlegen — neue Peptid-Einträge
landeten danach nur noch in einem der beiden, das andere wirkte für
die Nutzerin "verschwunden".

**Die Lösung:**
1. **Migration `0078_protocols_ein_aktives_pro_nutzer.sql`** (NEU, muss
   wie schon Migration 0077 manuell im Supabase Dashboard SQL Editor
   ausgeführt werden) — partieller Unique-Index auf
   `protocols(user_id) where status='active'`. Bewusst partiell statt
   einer generellen Unique-Constraint, da pro Nutzer beliebig viele
   archivierte Protokolle bestehen bleiben.
2. **`useProtocolData.js`**: Schlägt der Insert wegen dieses Index mit
   `23505` (unique_violation) fehl, wird das nicht mehr als Fehler
   behandelt, sondern das inzwischen vom parallelen Aufruf angelegte
   aktive Protokoll nachgeladen.

**Falls bei Ihnen bereits zwei aktive Protokolle für denselben Nutzer
existieren** (durch genau diesen Bug, bevor die Migration lief),
schlägt das Anlegen des Index fehl — dann bitte vorher im Table Editor
eins der beiden Duplikate (das ältere, per `created_at`) von Hand auf
`status='archived'` setzen und die Migration erneut ausführen.

`npm run build` + `npx oxlint` sauber (18 vorbestehende Warnungen,
keine neuen).

Damit ist die komplette Liste aus Teil 27 ("bewusst offen gelassene"
kleinere Funde) abgearbeitet.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 36) — Restliche kleinere Bug-Check-Funde: zweite Runde

Direkt im Anschluss an Teil 35, weiter mit der "behebe alles, was Du in
der Zwischenzeit beheben kannst"-Liste.

1. **Kurz-Intervalltimer: Musik startete beim zweiten Durchlauf nicht
   neu** (`Timer.jsx`, `TrainingView.jsx`) — Timer-interner "Reset"-Knopf
   setzte nur den Timer-eigenen Status zurück, nicht
   `useIntervallMusikSync`s `gestartetRef` — Reset → erneut Start (ohne
   zwischendurch zu schließen) übersprang dadurch den "erster
   Start"-Pfad, der die Playlist (neu) startet. `Timer.jsx` bekommt ein
   neues, optionales `onReset`-Prop (wird bei jedem `reset()` aufgerufen,
   egal ob intern über den Knopf oder von außen), an allen vier
   Intervall-Timer-Stellen in `TrainingView.jsx` mit
   `intervallMusikSync.reset` verdrahtet.
2. **Rollback bei Fehlern, zweite Runde** — dieselbe Absicherung wie in
   Teil 29 (vorherigen Stand merken, bei einem Fehler zurückrollen statt
   dauerhaft einen nie gespeicherten Wert anzuzeigen), jetzt zusätzlich
   für: `useProtocolData.js` (Ziele, Startdatum, Dauer, Notizen),
   `useProfileData.js` (persönliche Daten, Datenteilung-Schalter,
   Onboarding-Abschluss, Kategorie-Ziele, Erinnerungs-Präferenzen,
   Steckbrief, aktive Messwerte — 7 Funktionen), `useBiomarkerData.js`
   (einzelner Biomarker-Wert). Damit sind jetzt praktisch alle
   optimistischen Set-Funktionen der App gegen stillen Datenverlust bei
   Fehlern abgesichert.

**Als Nächstes** (letzter offener Punkt aus Teil 27): das mögliche
doppelte aktive Protokoll bei schnellem Tab-/Gerätewechsel — braucht
eine DB-Migration (Unique-Constraint), die die Nutzerin manuell
einspielen muss.

`npm run build` + `npx oxlint` nach jedem Dateiblock sauber (18
vorbestehende Warnungen, keine neuen).

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 35) — Restliche kleinere Bug-Check-Funde: erste Runde

Nutzerinnen-Auftrag: "Behebe bitte alle Punkte, die Du in der
Zwischenzeit beheben kannst" — Abarbeitung der in Teil 27 bewusst offen
gelassenen kleineren Funde, mit Zwischenbericht.

1. **Onboarding "Schlaf": Zurück-Navigation überschrieb gespeicherte
   Zeiten** (`OnboardingCategoriesView.jsx`) — beim (Wieder-)Betreten
   eines Schritts wurden Schlafzeiten und "eigenes Startdatum" bisher
   immer auf den Standard zurückgesetzt statt aus bereits gespeicherten
   Daten (`categoryZiele.schlaf.bloecke` bzw. der
   `teilprotokolle`-Zeile) vorbefüllt. Neuer `useEffect` an `index`
   geknüpft, holt sich nach jedem Reset die echten Werte zurück, falls
   vorhanden.
2. **`teilprotokollSpeichern` ohne await/Fehlerprüfung** (dieselbe
   Datei) — lief bisher fire-and-forget; schlug der Schreibvorgang
   fehl, sprang der Flow trotzdem sofort weiter, ohne dass die
   Nutzerin je davon erfuhr (untergräbt auch das
   Zwischenspeichern-Feature, das genau diese Zeilen zählt). `weiter()`
   ist jetzt async, wartet, zeigt bei einem Fehler eine Meldung und
   navigiert NICHT weiter.
3. **Spotify-Trennen/Playlist-Löschen ignorierte Fehler**
   (`useSpotifyVerbindung.js`) — `error` wurde nicht geprüft, lokaler
   Zustand wurde auch bei einem fehlgeschlagenen Löschen auf
   "getrennt"/"gelöscht" gesetzt (wirkte wie ein Reconnect-Bug nach dem
   nächsten Neuladen). Jetzt wird der Fehler geprüft, über das
   bestehende `spotifyVerbindungFehler`-Feld angezeigt (bereits in
   MehrTab.jsx verdrahtet) und der lokale Zustand nur bei Erfolg
   geändert.
4. **Aufräumen**: totes `softBounce`-CSS (definiert, nie verwendet)
   entfernt. `handleToggleSoundEnabled`/`soundEnabled` in
   `HomeView.jsx` existierten bereits (steuern den Erledigt-Ton in
   `QuickTaskList`), es gab aber nirgends einen Schalter dafür — Ton
   ließ sich nie ausschalten. Kleiner 🔊/🔇-Knopf neben "Als
   Nächstes" ergänzt statt den toten Code nur zu entfernen, da die
   Funktion technisch schon vollständig war, nur die UI dafür fehlte.

**Noch in Arbeit** (siehe nächster Teil): Kurz-Intervalltimer-Musik-
Neustart bei internem Reset, restliche Rollback-Stellen
(`useProtocolData.js`/`useProfileData.js`/`useBiomarkerData.js`),
doppeltes aktives Protokoll (braucht DB-Migration).

`npm run build` + `npx oxlint` sauber nach jedem Punkt (18 statt 19
vorbestehende Warnungen — die HomeView-Warnung ist jetzt weg).

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 34) — Wochenübersicht: Zustandserhalt (Fortsetzung des Remount-Themas)

Nutzerinnen-Nachfrage: War die "AppDataContext"-Diagnose aus Teil 27
eine Falschdiagnose, oder gibt es am Grundgerüst noch etwas zu
korrigieren? Antwort dazu direkt im Chat gegeben (kurz: die
AppDataContext-Sorge war keine Falschdiagnose des Symptoms, aber die
angenommene Fix-Größe war überschätzt — die eigentliche Ursache war
eng genug, um sicher behoben zu werden, siehe Teil 30. Was strukturell
WEITERHIN besteht: der komplette Remount bei jedem View-Wechsel, siehe
Teil 27). Diese Sitzung schließt die zweite Hälfte davon: Teil 31 hat
das nur für den Tagesplan (Datum/Modus) behoben, die Wochenübersicht
war noch offen.

**Fix**, exakt dasselbe Muster wie beim Tagesplan: `selectedDate`,
`viewMode` (Tag/Woche/Monat) und `monthDate` sind jetzt kontrollierte
Props, die in `AuthenticatedApp.jsx` liegen statt in
`WochenuebersichtView.jsx` selbst. Die Wochenübersicht wird über
`PlaeneView.jsx` gerendert (der "Alle Pläne"-Hub mit den 9+1 Reitern:
Schlaf/Hydration/Training/.../Wochenübersicht) — dort remountet `Aktiv`
(die jeweils aktive Reiter-Komponente) bei jedem Reiterwechsel genauso
hart wie `AuthenticatedApp.jsx` seine Hauptansichten, betraf also nicht
nur "ganz woanders hin und zurück", sondern schon den Wechsel zwischen
z. B. Schlaf- und Wochenübersicht-Reiter. Die drei Props laufen von
`AuthenticatedApp.jsx` durch `PlaeneView.jsx` (als reine Durchreiche,
für alle anderen Reiter dort ungenutzte, harmlose Zusatz-Props) bis zu
`WochenuebersichtView.jsx`. `WochenuebersichtView` hat nur diesen einen
Verwendungsort, deshalb ohne Rückfall auf internen State möglich.

**Weiterhin bewusst offen**: Zustandserhalt für die übrigen Reiter in
PlaeneView (z. B. Trainingsansicht-Zustände) sowie für die eigentliche
Remount-Architektur selbst (siehe Teil 27/31 — Alternative wäre, Views
dauerhaft gemountet zu halten statt sie neu aufzubauen, dafür bräuchte
es aber eine Prüfung jeder einzelnen View auf stille "läuft nur einmal
beim echten Mount"-Annahmen, zu groß für einen Nebenbei-Fix).

`npm run build` + `npx oxlint` sauber, keine neuen Warnungen. Prop-
Namen an allen drei Stellen manuell gegengeprüft (kein Live-Test mit
echtem Login möglich, aber strukturell identisch zum bereits
verifizierten Tagesplan-Fix aus Teil 31).

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 33) — Trainings-Wochenplan: Tages-Karten statt Tabelle

Direkt im Anschluss an Teil 32. Auf Rückfrage ("was genau überzeugt am
Trainingsplan nicht?") antwortete die Nutzerin: "Reine Tabellenoptik" —
die flache Zeilen-Tabelle (Tag/Zeit/Art als Spalten) wirkt zu nüchtern/
spreadsheet-artig, nicht wie ein "richtiger" Trainingsplan.

**Fix** (`WochenplanEditor.jsx`, geteilt zwischen TrainingView und dem
Onboarding-Trainingsschritt — Änderung wirkt an beiden Stellen): Die
Tabelle ist durch nach Wochentag gruppierte Karten ersetzt. Jeder Tag
mit mindestens einer Einheit bekommt eine eigene Karte mit farbigem
Verlaufs-Header (Tagesname + Anzahl Einheiten), darunter jede Einheit
als eigene Zeile mit einem Icon-Kreis je Trainingsart (🏋️ Kraft, 🏃
Cardio, 🤸 Bodyweight, 🧘 Isometrisch, ⚡ Sonstiges), Name, Uhrzeit als
kleines Badge, und der bestehenden Detailzeile (Übungsanzahl, Intervall,
Warm-up/Cool-down). Die "gerade hinzugefügt"-Hervorhebung aus Teil 32
funktioniert unverändert innerhalb der neuen Struktur.

Vor dem Commit lokal mit Vite-Devserver + Playwright-Screenshot geprüft
(Testdaten, kein echter Login nötig, siehe Screenshot-Ablage dieser
Sitzung) — Vorschau-Dateien danach wieder entfernt, nicht Teil des
Commits.

`npm run build` + `npx oxlint` sauber.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 32) — Neue Ergebnisse sichtbar machen (Scroll + Hervorhebung)

Nutzerinnen-Feedback (während sie ihr GitHub/Supabase/Vercel-Login-
Problem selbst behoben hat): "wenn man etwas ausfüllt und dann ein
Ergebnis entsteht ... wird es visuell nicht klar, dass das grade
entstanden ist. Erst wenn man scrollt, sieht man, dass da jetzt neuer
Text ist." Betraf mehrere Stellen mit demselben Muster: ein Formular
wird ausgefüllt, das Ergebnis erscheint aber in einem Listenbereich, der
gerade NICHT im sichtbaren Bereich liegt (oft, weil er oberhalb des
gerade benutzten Formulars steht).

**Gefixt** (überall dasselbe Muster: automatisch ins Bild scrollen +
kurze Hervorhebung mit der schon vorhandenen `slideInSuccess`/
`fadeInUp`-Animation, wie beim Abhaken in QuickTaskList.jsx):
- **Onboarding, "Bereits hinzugefügt"-Liste** (`OnboardingCategoriesView.jsx`):
  steht oberhalb des Formulars — ein neu hinzugefügter Eintrag (z. B. eine
  Gewohnheit, ein Supplement) war unsichtbar, solange man unten am
  Formular blieb.
- **Trainings-Wochenplan** (`WochenplanEditor.jsx`, geteilt zwischen
  TrainingView und Onboarding): neu gespeicherte Einheiten scrollen jetzt
  automatisch ins Bild und sind kurz farblich hervorgehoben.
- **Akutmodus-Antwort** (`AkutModusKarte.jsx`): scrollt jetzt automatisch
  ins Bild, sobald sie da ist (relevant bei einem längeren, schon
  aufgeklappten Panel).
- **Lexikon** (`LexikonView.jsx`): neue Frage-/Antwort-Karte wird beim
  Entstehen kurz eingeblendet und ins Bild gescrollt.
- Dafür `Card` (`primitives.jsx`, in fast der ganzen App verwendet) auf
  `React.forwardRef` umgestellt — rückwärtskompatibel, ändert nichts an
  bestehenden Stellen ohne `ref`-Prop.

**Noch offen, unbeantwortet:** Die zweite, eher gestalterische Rückmeldung
("der Trainingsplan sieht danach nicht wie ein guter Trainingsplan aus")
ist zu unspezifisch für einen gezielten Fix ohne weitere Rückfrage — dazu
folgt eine Nachfrage an die Nutzerin (Screenshot oder genauere
Beschreibung, WAS konkret daran nicht überzeugt: die Tabellenoptik, das
Fehlen einer Wochenübersicht auf einen Blick, etwas anderes).

`npm run build` + `npx oxlint` sauber, keine neuen Warnungen.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 31) — Sanfte Übergänge + Tagesplan-Datum bleibt beim Navigieren erhalten

Direkt im Anschluss an Teil 30. Letzter Teil des dritten angestoßenen
großen Punkts ("Ruckeln/Übergänge") — die eigentliche Übergangsanimation
und ein erstes, bewusst begrenztes Stück Zustandserhalt.

**Sanfte Übergänge statt hartem Schnitt** (`AuthenticatedApp.jsx`,
`OnboardingFlow.jsx`): Beide View-Switches sind reine
Komponentenaustausche ohne gemeinsamen DOM-Knoten — bisher komplett
unanimiert. Beide bekommen jetzt einen `key`-erzwungenen Neu-Mount des
Wrappers plus die bereits im Projekt vorhandene `fadeInUp`-Animation
(dieselbe Technik, die WelcomeView.jsx schon für die Folienwechsel
nutzt) — ein sanftes Einblenden statt eines harten Sprungs bei jedem
"Weiter"/jedem Seitenwechsel. Respektiert automatisch
`prefers-reduced-motion` (die `@keyframes`-Regel ist in index.css
innerhalb des entsprechenden `@media`-Blocks definiert und wird bei
reduzierter Bewegung gar nicht erst registriert).

**Tagesplan-Datum + Tag/Woche-Modus bleiben erhalten**: Da jeder
View-Wechsel in `AuthenticatedApp.jsx` weiterhin ein kompletter Remount
ist (siehe Teil 27 — diese Architektur selbst wurde bewusst NICHT
angefasst, dazu gleich mehr), sprang der Tagesplan bisher bei jedem
"Home → woanders hin → zurück zum Tagesplan" wieder auf "heute"/"Tag"-
Ansicht zurück. `selectedDate`/`modus` sind jetzt kontrollierte Props,
die in `AuthenticatedApp.jsx` liegen statt in `TagesplanView.jsx` selbst
— der Rest der (sehr langen) Datei musste dafür nicht angefasst werden,
da die Props dieselben Namen wie die vorherigen lokalen State-Variablen
tragen.

**Bewusst nicht angefasst — für einen späteren, gezielten Durchgang:**
- Dieselbe Zustandserhalt-Behandlung fehlt noch für weitere lokale
  States (`morgenOffen`/`abendOffen` im Tagesplan, `viewMode`/
  `monthDate`/`selectedDate` in der Wochenübersicht, u. a.) — jeweils
  ein kleiner, aber eigener Eingriff pro View.
- Die grundsätzliche Remount-Architektur selbst (jeder `view`-Wechsel =
  neuer Komponententyp) bleibt bestehen. Die Alternative — alle Views
  dauerhaft gemountet halten und nur per CSS ein-/ausblenden — würde
  Zustandserhalt für ALLE Views auf einen Schlag lösen, aber auch
  potenziell ~20 Views gleichzeitig mit allen ihren Datenladevorgängen/
  Intervallen im Hintergrund aktiv halten — ohne jede einzelne View auf
  stille Annahmen ("läuft nur einmal beim echten Mount") zu prüfen, ein
  zu großes Risiko für eine einzelne Sitzung.

`npm run build` + `npx oxlint` sauber, keine neuen Warnungen.

---

**Zusammenfassung der drei von der Nutzerin angestoßenen großen
Punkte** (Teile 28–31): Peptid-Tagesplan-Lücke vollständig geschlossen
(Migration nötig, siehe Teil 28); die häufigsten Datenverlust-Stellen
(Peptid-/Hormon-Dosis, zehn Löschfunktionen) gegen stillen Datenverlust
bei Fehlern abgesichert; die tatsächliche Ursache des Ruckelns
identifiziert und behoben (nicht der Context selbst, sondern
überbreite `useMemo`-Abhängigkeiten in der Wochenübersicht) plus
sanfte Übergänge und ein erster Zustandserhalt-Fix. Mehrere kleinere,
klar benannte Folgepunkte bleiben bewusst offen für einen gezielten
nächsten Durchgang, statt sie überstürzt in derselben Sitzung
anzufassen.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 30) — Ruckeln in der Wochenübersicht behoben (AppDataContext-Befund neu eingeordnet)

Direkt im Anschluss an Teil 29. Dritter der drei angestoßenen großen
Punkte — mit einer wichtigen Korrektur gegenüber der ursprünglichen
Einschätzung aus Teil 27.

**Neu eingeordnet:** Teil 27 vermutete, der fehlende `useMemo` um den
`value` in `AppDataContext.jsx` sei die Hauptursache fürs Ruckeln und
nur mit einem großen, riskanten Umbau (alle ~30 Datenhooks einzeln
memoisieren oder den Context aufteilen) zu beheben. Beim genaueren
Hinsehen zeigt sich: Die einzelnen Datenstücke (`hormonPlan`,
`supplemente`, `gewohnheiten`, ...) sind über `useState` in ihren Hooks
selbst schon stabile Referenzen — sie ändern sich nur, wenn wirklich
etwas an genau diesen Daten geändert wird. Das eigentliche Problem war
NICHT der Context selbst, sondern dass `WochenuebersichtView.jsx`
überall den kompletten `appData` (alle ~150 Felder aus allen Hooks
zusammen) als `useMemo`-Abhängigkeit verwendet hat — und `appData` als
Sammelobjekt bekommt bei jeder noch so unbeteiligten Änderung irgendwo
in der App eine neue Referenz. Das ließ `bereichsCompliance` (bis zu
180 `buildDayItems()`-Aufrufe für die 180-Tage-Statistik!) sowie vier
weitere `buildDayItems()`-Stellen (Tagesansicht, Wochenraster,
Monatsraster, PDF-Export) bei praktisch jeder Interaktion irgendwo in
der App neu durchlaufen, solange diese View offen war.

**Fix** (nur `WochenuebersichtView.jsx`, kein Eingriff in
`AppDataContext.jsx` oder die Datenhooks nötig): ein einziges,
schmal auf die tatsächlich von `buildDayItems()` benötigten ~16 Felder
gestütztes `dayItemsQuelldaten`-`useMemo` ersetzt überall `appData`.
Zusätzlich `wochentage`/`montag` (hingen bisher an `selectedDate`,
waren aber selbst nicht memoisiert) sowie zwei neue vorberechnete
Listen (`wochenItemsProTag`, `monatsTageMitItems`) für Wochenraster/
Monatsraster/PDF-Export, die vorher inline bei jedem Render bis zu 31
`buildDayItems()`-Aufrufe gemacht haben, jetzt nur noch bei echter
Datenänderung. `kumulativeCompliance` (Hydration/Tageslicht/Schlaf)
ebenso auf die konkret benötigten 5 Felder statt auf `appData` umgestellt.

**Bewusst nicht angefasst:** Die strukturelle Tatsache, dass JEDE
Context-Änderung weiterhin alle ~150 `useAppData()`-Komponenten neu
rendern lässt, bleibt bestehen — das ist aber, wie sich jetzt zeigt,
für sich genommen kaum spürbar (ein reiner Re-Render ohne teure
Berechnung ist billig); spürbares Ruckeln entsteht erst durch
un-memoisierte teure Arbeit wie oben. Sollten an anderer Stelle noch
ähnliche "ganzes appData als Dependency"-Muster auffallen, lohnt sich
derselbe gezielte Fix — eine app-weite Suche (`grep "appData\]"`) hat
aktuell keine weiteren Fälle in render-kritischen Views gefunden. Der
komplette Context-Split bleibt ein mögliches, aber angesichts dieses
Befunds nicht mehr dringendes Vorhaben für später.

`npm run build` + `npx oxlint` sauber.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 29) — Rollback bei Fehlern: Dosis-Änderungen + Löschfunktionen

Direkt im Anschluss an Teil 28. Zweiter der drei von der Nutzerin
angestoßenen großen Punkte: das systemische "optimistisches Update ohne
Rollback"-Muster aus dem Bug-Check (Teil 27), zuerst an den
meistgenutzten Stellen.

**Peptid-/Hormon-Dosis** (`useHormoneData.js` — nach Teil 28 der einzige
noch lebendige Pfad für beide): `setHormonKategorie`,
`setHormonEinnahmeart`, `setHormonDose`, `setHormonDoseBatch`,
`hormonEntfernen`, `toggleHormonErledigt`. Muster überall gleich: den
Stand vor der optimistischen Änderung im selben `setState`-Aufruf
merken, bei einem Fehler exakt darauf zurückrollen, statt dass ein
nie gespeicherter Wert dauerhaft (bis zum nächsten Neuladen) in der
Oberfläche stehen bleibt. `useProtocolData.js`s alte, gleichnamige
Peptid-Funktionen (togglePeptid, setDose, ...) bewusst NICHT angefasst
— seit Teil 28 ruft sie niemand mehr auf (totes Codestück, kein
Nutzen von Rollback auf ungenutztem Code).

**Löschfunktionen**, dasselbe Rollback-Muster (Index+Objekt vor dem
Filtern merken, bei Fehler an derselben Stelle wieder einfügen), in:
`useGewohnheitenData.js` (Entfernen + Ziel-Aktualisieren),
`useSupplementData.js`, `useTrainingData.js`, `useMealData.js`
(Mahlzeit + Wochenplan-Zuweisung, inkl. der kaskadierten
Wochenplan-Einträge), `useAtemuebungenData.js`, `useDrinkRecipes.js`,
`useZeitbloecke.js` (Projekt + Zeitblock, inkl. kaskadierter
Zeitblöcke), `useWorkflowData.js` (Preset + Plan, inkl. kaskadierter
Pläne), `useTrainingTemplates.js` (Programm + Vorlage + Wochenplan,
inkl. der auf `programmId: null` gesetzten Vorlagen), `useCoachWissen.js`.
Zusätzlich `useUebungsBilder.js`: löschte den Eintrag bisher lokal auch
dann, wenn der Server-Aufruf fehlschlug (Fehler wurde nicht mal
geprüft) — jetzt wird `error` erst geprüft, bevor lokal gelöscht wird.

**Bewusst noch offen** (nicht Teil dieser beiden Batches, für einen
späteren Durchgang): die übrigen ~15 optimistischen Set-Funktionen aus
Teil 27 (v. a. `useProtocolData.js` Ziele/Notizen, `useProfileData.js`,
`useBiomarkerData.js`) sowie fehlende Cancel-Guards/Race-Conditions bei
paralleler Erst-Migration (Workflow-Presets) — beides niedrigere
Priorität laut Bug-Check.

`npm run build` + `npx oxlint` nach jedem Dateiblock geprüft, keine
neuen Warnungen.

---

## ✅ Update 11.09.2026, Fortsetzung (Teil 28) — Peptid-Tagesplan-Lücke geschlossen

Direkt im Anschluss an Teil 27. Von den drei dort offen gelassenen großen
Punkten hat die Nutzerin alle drei angestoßen — hiermit der erste:
**Peptid-Dosen tauchten nirgends im Tagesplan/Home/Wochenübersicht auf.**

Ursachenklärung: Am 13.08. (Migration 0042) wurde bewusst entschieden,
Peptide keine eigene Kategorie mehr zu geben, sondern sie als
`kategorie: "Peptid"` in die bestehende Medikamente/Hormone-Tabelle
(`hormones`/`hormone_logs`) zu integrieren — Nutzerinnen-Zitat aus dem
Migrations-Kommentar: "als separaten Reiter aufzustellen, wo wir doch
schon Medikamente inklusive Hormone und Off-Label-Produkte haben, halte
ich für absurd". `buildDayItems()` (Tagesplan/Home/Wochenübersicht)
wurde entsprechend umgestellt und liest seitdem nur noch `hormonPlan`.
**Aber:** Diese Migration war nur eine einmalige Kopie des damals aktiven
Peptid-Protokolls — der Onboarding-Schritt "Peptide" selbst wurde nie
mit umgestellt und schrieb weiterhin in die alte, separate
`protocol_peptide`-Tabelle. Jedes seit dem 13.08. im Onboarding
eingetragene Peptid landete dadurch in einem "toten" Datenpfad, den
niemand mehr ausliest — unsichtbar im Tagesplan, nirgends abhakbar.
(Nur über MedikamenteView.jsx direkt mit Kategorie "Peptid" angelegte
Präparate funktionierten schon die ganze Zeit korrekt.)

**Fix, dreiteilig:**
1. Migration `0077_hormones_bacwasser_spruehstoesse.sql`: `hormones`
   bekommt die zwei peptid-spezifischen Spalten (`bac_wasser_ml`,
   `spruehstoesse`), die `protocol_peptide` hatte, `hormones` aber
   nicht — sonst wären diese Dosierungsdetails beim Umstieg verloren
   gegangen. **Muss von Ihnen im Supabase-Dashboard eingespielt werden**
   (dieses Sandbox hat keinen DB-Zugriff).
2. `useHormoneData.js`: um `bacWasser`/`spruehstoesse` erweitert
   (Lesen, Schreiben, Feld-Mapping) — spiegelt jetzt exakt, was
   `useProtocolData.js` für Peptide schon konnte.
3. `OnboardingCategoriesView.jsx`: Der komplette Peptid-Schritt läuft
   jetzt über dieselben `hormonHinzufuegen`/`hormonEntfernen`/
   `setHormonEinnahmeart`/`setHormonDose`/`setHormonFoto`-Funktionen wie
   der Medikamente-Schritt (mit `kategorie: "Peptid"` fest gesetzt),
   statt über die alten `protocol_peptide`-Funktionen. Dünne
   Wrapper-Funktionen mit identischen Namen/Signaturen wie vorher
   (`togglePeptid`, `setDose`, `setEinnahmeart`, `addCustomPreparat`,
   `setPeptidFoto`, `intervallGueltig`) halten den Rest der ohnehin
   schon sehr langen Datei unverändert — nur die vier Stellen, die auf
   das alte separate `einnahmeart`-Objekt zugriffen, wurden auf
   `dosierung[p]?.einnahmeart` umgestellt (im neuen Modell steckt die
   Einnahmeart mit in der Dosierung, nicht mehr in einem eigenen Feld).

**Bewusst nicht angefasst:** `useProtocolData.js`s alte
Peptid-Funktionen selbst (togglePeptid, setDose, ...) bleiben bestehen
— WochenuebersichtView.jsx/StatistikTab.jsx lesen für die Statistik
weiterhin auch von dort, für bereits vor diesem Fix angelegte alte
Peptid-Einträge. Diese beiden Stellen zeigen neu (über Medikamente/
Onboarding) hinzugefügte Peptide aktuell noch als "Medikament" statt
als "Peptid" gelabelt in der Statistik — ein rein kosmetischer
Folgefund, separat vermerkt, nicht Teil dieses Fixes.

`npm run build` + `npx oxlint` sauber, keine neuen Warnungen.

---

## ✅ Update 11.09.2026 (Teil 27) — Kompletter Bug-Check der gesamten App

Nutzerinnen-Auftrag: "immer noch viele Bugs ... manche Funktionen
funktionieren nicht ... Übergänge nicht flüssig" — ein kompletter Check
des gesamten Codes, ohne Zeitlimit. Vorgehen: eigene Durchsicht der
App-Shell/Navigation sowie Akutmodus/Atemübungen, parallel dazu vier
Hintergrund-Agenten für Datenschicht (src/data/*.js), Timer-/Animations-
Komponenten, Onboarding-Flow und Plan-/Protokoll-Views — alle explizit
auf das echte Repo (`/workspace/-app-main`) angesetzt und deren Befunde
vor Übernahme geprüft. Build (`npm run build`) und `npx oxlint` nach
jedem Fix-Block gegengeprüft, keine neuen Warnungen.

### Gefixt (11 Bugs, 14 Dateien)

1. **[KRITISCH] Onboarding: oberer „Weiter"-Pfeil verwarf eingegebene
   Formulardaten.** `OnboardingCategoriesView.jsx` — der Pfeil oben auf
   jeder Kategorie-Seite rief IMMER `weiter(false)` (= "überspringen")
   auf, unabhängig davon, ob gerade ein Formular ("Jetzt einrichten")
   ausgefüllt wurde. Klicksequenz: Supplement-/Trainings-/Medikamenten-
   Daten eintragen → aus Gewohnheit den oberen statt des richtigen
   Speichern-Buttons antippen → Eingaben weg, Schritt als übersprungen
   markiert, kein Hinweis. Das erklärt vermutlich einen großen Teil der
   "meine Eingaben verschwinden einfach"-Berichte. Fix: Pfeil wird
   ausgeblendet, solange das Formular aktiv ist (`effectiveModus ===
   "jetzt"`) — Weiter geht dann nur noch über den echten Speichern-Button.

2. **[HOCH] Hydration/Tageslicht: schnelles Mehrfach-Tippen verlor Taps.**
   `useHydrationData.js`, `useTageslichtData.js` — `+250 ml`/`+Minuten`
   berechnete den neuen Stand aus dem zum Aufrufzeitpunkt noch nicht
   aktualisierten React-State. Zwei schnell aufeinanderfolgende Taps
   lasen denselben alten Wert, der zweite ging verloren. Fix: ein Ref
   hält den zuletzt synchron zugewiesenen Wert fest, auf dem ein
   unmittelbar folgender zweiter Tap aufbaut statt auf dem alten State.

3. **[HOCH] `Timer.jsx`: Fortsetzen nach Pause feuerte fälschlich
   "Runde 1, Arbeitsphase"-Ereignis.** Betraf JEDEN Intervall-Timer
   (Workflow, Bodyweight/Cardio/Isometrisch, Kurz-Intervalltimer).
   `istErstStart` prüfte nur `mode === "interval"` statt zusätzlich den
   tatsächlichen Status — beim Fortsetzen nach einer Pause (z. B. mitten
   in einer stillen Musik-Pause) fuhr `useIntervallMusikSync` dadurch
   unerwartet die Musik wieder hoch, obwohl die App weiterhin "PAUSE"
   anzeigte. Fix: `istErstStart` prüft jetzt zusätzlich `status ===
   "idle" || status === "vorbereitung"`.

4. **[HOCH] Home-Knopf ließ Spotify beim Verlassen weiterlaufen.**
   `WorkflowTimer.jsx`, `TrainingView.jsx` (Live-Workout) — der ⌂-Knopf
   in der Kopfzeile rief bisher direkt die Navigation auf und umging
   damit `beenden()`/`spotifyPausieren()`, die extra für genau dieses
   gemeldete Problem eingebaut wurden. Nur "Abbrechen"/"Fertig" stoppten
   die Musik, Home nicht. Fix: Home stoppt jetzt bei laufender Session
   zuerst die Musik (bei TrainingView über einen eigenen schmalen
   `homeVerlassen()`-Wrapper, damit ein abgebrochenes Training nicht
   fälschlich als "fertig" protokolliert wird).

5. **[MITTEL] Gewohnheiten/Mahlzeiten/Supplemente: Doppeltippen auf
   Abhaken verlor den zweiten Tap.** `useGewohnheitenData.js`,
   `useMealData.js`, `useSupplementData.js` — dieselbe Race Condition
   wie bei Hydration (Punkt 2), hier als Ja/Nein statt als Delta. Fix:
   analoger Pending-Ref pro Hook.

6. **[MITTEL] Onboarding: Netzwerkfehler ließ den Speichern-Button für
   immer auf "Speichern..." hängen.** `OnboardingCategoriesView.jsx`
   (`hinzufuegen`, `speichernUndWeiter`, `customPeptidHinzufuegen`),
   `HauptprotokollErstellenView.jsx` (`submit`) — ein echter
   Verbindungsabbruch (nicht nur ein von Supabase zurückgegebenes
   `{error}`) lief ungefangen durch, `setSaving(false)` wurde nie
   erreicht. Fix: Fehlerbehandlung an den Aufrufstellen bzw. per
   try/catch/finally direkt in `submit()`.

7. **[MITTEL] `WochenuebersichtView.jsx`: Wochentag-Leiste ließ sich nie
   auf eine andere Woche verschieben.** Hing an `today` statt an
   `selectedDate` — anders als die Monatsansicht (mit ‹/›) gab es keine
   Möglichkeit, die Tagesauswahl-Leiste (Tag-Modus, Wochenraster,
   PDF-Export "Woche vom …") auf eine andere Woche zu bewegen; wählte
   man in der Monatsansicht einen Tag aus einer anderen Woche, passte
   sich die Leiste nicht an. Fix: an `selectedDate` gekoppelt (wie in
   TagesplanView.jsx).

8. **[MITTEL] `WheelPicker.jsx`: Scroll-Position synct nicht bei
   externer Wertänderung.** Effekt für den initialen Sprung zur
   passenden Position hatte trotz gegenteiligem Kommentar leere
   Dependencies, lief also nur beim Mount. Änderte sich der Wert von
   außen (z. B. Coach füllt ein Feld, oder ein Supabase-Roundtrip bringt
   einen aktualisierten Wert zurück), blieb die physische Scroll-Position
   stehen, während der fett hervorgehobene Wert bereits sprang. Fix:
   reagiert jetzt auf den Index, überspringt den Sprung aber, wenn die
   Position bereits durch einen eigenen Tap/Scroll-Snap dorthin gebracht
   wurde (kein Konflikt mit laufender Nutzer-Interaktion).

9. **[NIEDRIG] `useIntervallMusikSync.js`: Fade-Interval ohne
   Unmount-Cleanup.** Lief bis zu 6 weitere Ticks im Hintergrund weiter,
   wenn die Komponente während eines laufenden Fades verschwand. Fix:
   `useEffect(() => fadeStoppen, [])` ergänzt.

10. **[PERFORMANCE] `HomeView.jsx`: Widget-Liste wurde bei JEDEM Render
    neu berechnet statt gecacht.** `today = new Date()` erzeugte bei
    jedem Render ein neues Objekt, das als Dependency eines `useMemo`
    diente — machte die Memoisierung wirkungslos, spürbar als Ruckeln
    bei Interaktionen auf der Startseite. Fix: `today` per `useMemo(()
    => new Date(), [])` einmal pro Mount berechnet.

### Geprüft, bewusst NICHT gefixt — größere Befunde für eine Entscheidung

Diese Punkte sind real, aber entweder architektonisch groß (Risiko,
in einer Sitzung überstürzt viele Dateien anzufassen) oder brauchen
erst eine inhaltliche Entscheidung. Einzeln aufgeführt, damit nichts
verloren geht:

- **[GROSS, vermutlich Hauptursache für "ruckelig"] `AppDataContext.jsx`:
  der an alle ~150 Komponenten verteilte `value` ist kein `useMemo` —
  JEDE Zustandsänderung irgendwo in der App (ein Tastendruck, ein Tap)
  lässt den gesamten Datenkontext neu rendern, und jede Komponente, die
  `useAppData()` nutzt, rendert mit — unabhängig davon, ob sie die
  geänderten Daten überhaupt braucht. Eine korrekte Behebung braucht
  entweder sorgfältige Memoisierung in jedem der ~30 einzelnen
  Daten-Hooks oder eine Aufteilung in mehrere kleinere Contexts — beides
  ein eigenständiges, mehrstündiges Vorhaben mit echtem Risiko für neue
  Bugs (falsch/unvollständig memoisiert = veraltete Daten werden
  angezeigt), wenn überstürzt gemacht.
- **[GROSS] Kompletter Remount statt Zustandserhalt beim View-Wechsel.**
  `AuthenticatedApp.jsx` rendert bei jedem `view`-Wechsel einen komplett
  neuen Komponententyp — kein `key`/keine Transition, kein Zustandserhalt.
  Wechselt man z. B. Tagesplan → Home → zurück, sind Datum-Auswahl,
  aufgeklappte Morgen-/Abendroutine, Wochenansicht-Modus etc. wieder auf
  Standard. Das erklärt sowohl "Zustände gehen verloren" als auch die
  ruckartigen (statt weichen) Bildschirmwechsel strukturell für die
  GESAMTE App, nicht nur einzelne Screens. Eigenständiges Vorhaben.
- **[GROSS, inhaltliche Entscheidung nötig] Peptid-Dosen tauchen
  nirgends mehr im Tagesplan/Home/Wochenübersicht auf.** `dayItems.js`
  (`buildDayItems`) nimmt Peptid-Daten gar nicht mehr entgegen, obwohl
  "Peptide" weiterhin ein Pflicht-Onboarding-Schritt ist und
  Statistik/Wochenübersicht die alten Peptid-Daten weiterhin als
  "geplant" führen. Nutzerinnen mit aktiven Peptiden können ihre Dosen
  nirgends abhaken — sie sammeln sich unsichtbar als "verpasst". Bevor
  das gefixt wird, muss geklärt werden: Peptide wieder in `buildDayItems`
  einspeisen, oder ganz auf das neuere Hormon-Modell (`kategorie:
  "Peptid"` in MedikamenteView.jsx) migrieren und den alten Pfad
  abschalten?
- **[MITTEL, systemisch] Optimistische Updates/Löschungen ohne Rollback
  bei Fehler**, an rund 20 Stellen in `src/data/*.js` (u. a.
  `useProtocolData.js`, `useHormoneData.js`, `useProfileData.js`,
  Lösch-Funktionen in fast jedem Hook). Bei einem Server-/Netzwerkfehler
  zeigt die Oberfläche trotzdem den neuen/gelöschten Zustand — bis zum
  nächsten Neuladen, dann erscheint der alte Wert/gelöschte Eintrag
  wieder, wirkt wie zufälliger Datenverlust. Klar identifizierbares
  Muster, aber zu viele Stellen für einen sicheren Rundumschlag in einer
  Sitzung — am besten gezielt an den meistgenutzten Stellen zuerst
  (Peptid-/Hormon-Dosis ändern, Gewohnheit/Supplement löschen).
- **[MITTEL] Mögliche doppelte aktive Protokolle bei schnellem
  Tab-/Gerätewechsel.** `useProtocolData.js` legt ohne Sperre ein neues
  aktives Protokoll an, wenn keins gefunden wird — es gibt keinen
  Unique-Constraint in der Datenbank, der "nur eins pro Nutzer" erzwingt.
  Bräuchte eine Migration (DB-Constraint), die Sie manuell im Supabase-
  Dashboard einspielen müssten.
- **[MITTEL] Onboarding „Schlaf": Zurück-Navigation kann bereits
  gespeicherte Zeiten stillschweigend auf Standard (22:30–06:30)
  zurücksetzen**, ebenso ein aktiviertes "eigenes Startdatum". Anders als
  bei Hydration/Tageslicht gibt es hier keinen "leer = unverändert
  lassen"-Schutz beim erneuten Betreten des Schritts.
- **[NIEDRIG] Weitere kleinere Funde:** fehlende Fehlerprüfung beim
  Spotify-Trennen (`useSpotifyVerbindung.js`), mögliche doppelte
  Workflow-Presets bei paralleler Erst-Migration, fehlende
  Cancel-Guards in ca. 8 Daten-Hooks (nur im Admin-"Verwalten
  als"-Modus relevant), ein definiertes aber nie verwendetes
  `softBounce`-Animation (index.css), ein `handleToggleSoundEnabled` in
  HomeView.jsx ohne zugehörigen Schalter in der Oberfläche.

Kein Bereich sonst berührt. Alle Fixes einzeln nachvollziehbar in den
Commits, `npm run build` + `npx oxlint` sauber.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 26) — GLP-1/ADHS/Diabetes: dritter Puzzle-Stein verknüpft

Direkt im Anschluss an Teil 25 (Commit `3194fe5`). Nutzerinnen-Nachfrage:
Sie erinnerte daran, dass der Peptide-Leitfaden (Abschnitt 3) GLP-1-
Rezeptoragonisten (Semaglutid, Tirzepatid) als aufkommenden, positiven
ADHS-Nebenbefund beschreibt — und dass GLP-1-Agonisten gleichzeitig
Diabetes-Medikamente sind. Frage: Hängt das mit dem in Teil 25
dokumentierten ADHS-Diabetes-Zusammenhang zusammen, und wenn ja, wie?

Per WebSearch recherchiert (aktuelle Grundlagenforschung zu Insulin,
Striatum-Dopamin und ADHS). Ergebnis in beide betroffenen Dateien
eingearbeitet:

- **CGM-Leitfaden, Abschnitt 2** (`cgm-blutzuckermessung-bei-adhs.md`):
  neuer Absatzblock "Ein dritter Puzzle-Stein: Passt der GLP-1-Befund
  aus dem Peptide-Leitfaden hier rein?" Ehrliche Einordnung: **Nicht
  direkt** — die Geschwisterstudie aus Teil 25 zeigt ja gerade, dass
  ADHS selbst kaum einen direkten Kausalpfad zu Diabetes hat, und der
  GLP-1-Befund betrifft ohnehin die umgekehrte Richtung (Diabetes-
  Medikament wirkt auf ADHS, nicht ADHS auf Diabetes-Risiko). Es gibt
  aber einen dritten, unabhängigen und plausiblen (aber noch nicht
  bewiesenen) Erklärungsstrang: **Insulin(-resistenz) als gemeinsamer
  Hebel auf die Dopamin-Signalübertragung im Striatum** — Insulin
  verstärkt im Gehirn nachweislich die Dopaminausschüttung (u. a. über
  Tyrosinhydroxylase-Hochregulierung und cholinerge Interneurone),
  Erwachsene mit ADHS zeigen in mehreren Studien eine geringere
  Insulinsensitivität korrelierend mit dem Symptomausmaß, und
  GLP-1-Agonisten verbessern genau diese Insulinsensitivität zentral
  wie peripher. Klar als **Theoretisch/Aufkommend** eingeordnet — die
  drei Bausteine stammen aus getrennten Studien, niemand hat den Pfad
  bislang direkt als Erklärung für den GLP-1-ADHS-Effekt nachgewiesen.
- **Peptide-Leitfaden, Abschnitt 3** (`peptide-bei-adhs.md`): neuer
  Querverweis-Absatz direkt nach der bestehenden "Einordnung", der in
  die Gegenrichtung auf den CGM-Leitfaden Abschnitt 2 verweist, damit
  die Verbindung von beiden Seiten aus auffindbar ist.

Beide PDFs (`CGM-...-Handbuch.pdf`, 7 Seiten unverändert;
`Peptide-Handbuch.pdf`, 5 Seiten unverändert) neu erstellt und per
pymupdf-Screenshot auf korrekte Formatierung (Fettung, Aufzählung,
Absatzumbrüche) geprüft. `npm run build` erfolgreich. Keine Migration,
keine Edge Function nötig, keine anderen Dateien berührt.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 25) — CGM-Leitfaden: epidemiologischer ADHS-Diabetes-Zusammenhang ergänzt

Direkt im Anschluss an Teil 24 (Commit `d56169a`). Nutzerinnen-Nachfrage:
"Hast Du auch den Bezug von ADHS und Diabetes gemacht?" — zu Recht,
der bisherige CGM-Text behandelte nur die Symptom-Überlappung
(Blutzuckerabfall fühlt sich wie eine ADHS-Krise an), nicht den
eigentlichen statistischen Zusammenhang zwischen den beiden Diagnosen
selbst.

Neuer Abschnitt 2 "ADHS und Diabetes: der epidemiologische
Zusammenhang" (per WebSearch recherchiert), mit einer differenzierten,
aktuellen Einordnung: Die reine Assoziation ist gut belegt
(Meta-Analysen, adjustiertes Odds Ratio ~2,3 für Typ-2-Diabetes bei
ADHS) — aber eine aktuelle (2024) bevölkerungsweite Geschwister-
Vergleichsstudie (methodisch stark, rechnet familiäre/genetische
Faktoren heraus) findet für ADHS **allein** nur einen vernachlässigbaren
direkten Effekt auf das Diabetes-Risiko. Die eigentlichen Treiber
scheinen psychiatrische Begleiterkrankungen (Substanzkonsum,
Depression, Angst) und gemeinsame familiäre Faktoren zu sein, nicht ein
direkter ADHS-→-Diabetes-Mechanismus. Ergänzt um die entwicklungsbezogene
Gegenrichtung (mütterlicher Diabetes in der Schwangerschaft und
ADHS-Risiko beim Kind) sowie einen Querverweis auf den
Insulinresistenz/HOMA-IR-Abschnitt des Laborwerte-Leitfadens aus Teil
22/23. Restliche Abschnitte umnummeriert, alle internen
Selbstverweise geprüft und korrigiert.

`npm run build` erfolgreich geprüft, PDF neu erstellt (7 statt 6
Seiten) und verschickt. Keine Migration, keine Edge Function nötig.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 24) — Neuer Leitfaden "Kontinuierliche Blutzuckermessung (CGM)"

Direkt im Anschluss an Teil 23 (Commit `cc1af28`). Nutzerin lieferte ein
Konzeptblatt zu CGM-Nutzung bei Nicht-Diabetikern (Auswertungs-
kriterien, Selbstexperiment-Hebel, Produktvergleich Abbott/Dexcom) und
bat um ein Datenblatt daraus — **ausdrücklich ohne die konkrete
Produktempfehlung**, die deshalb bewusst nicht übernommen wurde
(Geräte-/Preisvergleiche veralten schnell, sind keine
Wissensbasis-Frage).

`src/wissen/blutwerte/cgm-blutzuckermessung-bei-adhs.md` (neu, Sibling
zum Laborwerte-Leitfaden aus Teil 22/23) behandelt: Messprinzip
(interstitielle Flüssigkeit statt Blut), die vier
Auswertungskriterien aus dem Konzeptblatt der Nutzerin (Nüchternglukose/
Dawn-Phänomen, Erholungszeit, reaktive Hypoglykämie, Glukose-
variabilität) mit Studienlage-Einordnung, die drei
Selbstexperiment-Hebel (Food Sequencing — Studienlage überwiegend aus
Prädiabetes-/Diabetes-Populationen, Übertragung auf Gesunde plausibel
aber nicht im selben Umfang belegt; Spaziergang nach dem Essen —
etabliert, Timing wichtiger als Dauer; Stress/Schlaf-Einfluss). Neu
per WebSearch recherchiert und ergänzt: ein eigener Abschnitt zur
aktuellen (2024–2026) Kontroverse um CGM-Nutzung bei Menschen ohne
Diabetes — FDA hat 2024 erstmals rezeptfreie Systeme auch für
Nicht-Diabetiker zugelassen, aber die Evidenz für echten
Gesundheitsnutzen bei bereits Stoffwechselgesunden ist noch dünn.

`npm run build` erfolgreich geprüft, PDF-Handbuch erstellt (6 Seiten)
und verschickt. Keine Migration, keine Edge Function nötig.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 23) — Laborwerte-Leitfaden vertieft + YouTube-Skriptvorlage (appextern)

Direkt im Anschluss an Teil 22. Nutzerin wollte den Laborwerte-Leitfaden
gleichzeitig als Fachlektüre, Coach-Handbuch, Teil der Wissensbasis UND
als Vorlage für ein YouTube-Video nutzbar haben — "noch ausführlicher"
und mit den Lücken/Schwachstellen, die sie selbst wahrscheinlich nicht
erkennen würde (Commit `f08667e`).

**Wissensbasis vertieft** (siehe Teil 22 für die Details: neue
Abschnitte zu Selen/Jod als Schilddrüsen-Kofaktoren, Schwermetalle,
Insulinresistenz/HOMA-IR, MTHFR-Gentest, sowie ein bewusst in den
Fließtext integrierter Abschnitt "Grenzen dieses diagnostischen
Ansatzes" — direkte Antwort auf die gewünschte kritische
Selbstreflexion).

**Neu in dieser Runde**: Eine **YouTube-Skriptvorlage** als viertes
Format — bewusst **NICHT** in `src/wissen/` oder die App eingepflegt
(kein KI-Kontext-Zweck, appfremdes Content-Format für die Nutzerin
persönlich), sondern als eigenständiges PDF erstellt und verschickt.
Enthält Hook-Ideen, eine Grobstruktur mit Zeitmarken, publikumstaugliche
"Aha-Momente" aus dem Handbuch in einfacherer Sprache, und einen
Quellen-Kurzverweis für die Videobeschreibung — kein
Wort-für-Wort-Skript, sondern Arbeitsvorlage.

**Technische Notiz**: `build_pdf_multi.py` (lokales Scratchpad-Skript)
um einen optionalen `src_abs`-Parameter erweitert, damit sich auch
appexterne Markdown-Dateien (nicht nur `src/wissen/*.md`) mit derselben
Handbuch-Optik in ein PDF umwandeln lassen.

Keine Migration, keine Edge Function nötig.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 22) — Wissens-Leitfaden "Laborwerte, Mikronährstoffe & Hormone" + PDF-Skript um Tabellen erweitert

Nutzerin lieferte einen ausführlichen fachlichen Entwurf zu ADHS-
relevanter Labordiagnostik und bat darum, ihn in die Wissensbasis
einzuarbeiten, zu vertiefen und wie immer als Handbuch zu liefern
(Commit `280c0cf`).

- `src/wissen/blutwerte/laborwerte-mikronaehrstoffe-hormone-bei-adhs.md`
  (neu) ersetzt den bisherigen Platzhalter unter `blutwerte/` — der war
  laut eigenem Text explizit für genau diese Art Inhalt vorgesehen
  ("Hinweise ablegen, wie der Coach Laborwerte einordnen soll").
  Behandelt: warum Dopamin/Noradrenalin nicht direkt im Blut gemessen
  werden (Blut-Hirn-Schranke, Urin-Neurotransmitter-Profile als
  umstritten eingeordnet), den methodischen Grundsatz Serum vs.
  Vollblut/Erythrozyten, Dopaminsynthese-Kofaktoren (Ferritin+hs-CRP,
  Magnesium, Zink/Kupfer, Vitamin D, B12/Holo-TC, B6/P5P, Homocystein),
  Omega-3-Index und Aminosäuren, Hormonstatus (Schilddrüse, Cortisol-
  Tagesprofil, geschlechtsspezifisch inkl. Messzeitpunkt/Lutealphase),
  den rechtlichen/praktischen Coaching-Hinweis der Nutzerin, sowie drei
  Übersichtstabellen.
- Per WebSearch gegengeprüft und mit aktueller (2024–2026) Evidenz
  eingeordnet — u. a. Ferritin/ADHS-Studienlage als uneinheitlich statt
  pauschal bestätigt korrigiert, RBC-Magnesium als überwiegend aus der
  funktionellen Medizin (nicht schulmedizinisch einheitlich etabliert)
  eingeordnet, der verbreitete Vitamin-D-Zielwert 40–60 ng/ml als
  umstritten markiert (Endocrine Society 2024 rät bei Gesunden sogar
  von Routine-Screening ab), Holo-TC-Überlegenheit gegenüber
  Gesamt-B12 als uneinheitlich belegt statt als klar besser
  dargestellt, und der Lutealphase-Dopamin-Mechanismus präzisiert
  (vorrangig Östrogenabfall, nicht nur Progesteron).
- **PDF-Skript (`build_pdf_multi.py`, lokal im Scratchpad) um
  Markdown-Tabellen-Unterstützung erweitert** — die drei
  Übersichtstabellen dieses Leitfadens wären sonst als unleserlicher
  Rohtext ins PDF gerutscht. Neue `build_table()`-Funktion rendert
  `| ... |`-Tabellen als echte reportlab-Tabelle (farbige Kopfzeile,
  abwechselnde Zeilenfarben, Textumbruch in Zellen) — nützlich auch für
  künftige Handbücher mit Tabellen.

`npm run build` erfolgreich geprüft, PDF-Handbuch erstellt und
verschickt (8 Seiten, Tabellen per Screenshot visuell verifiziert).
Keine Migration, keine Edge Function nötig — reine Wissensbasis-Datei.

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 21) — Bug-Check aller neuen Akutmodus-/Atemübungen-Teile

Nutzerin bat um eine gezielte Fehlersuche in allen seit Teil 17 neu
gebauten Teilen (Commit `2cc1b12`). Erster Versuch mit dem
`code-review`-Skill lief in einer isolierten Fork-Ausführung fehl —
landete in einem völlig fremden Repository (ein "Arcanova"-
Kinder-App-Projekt) statt in diesem hier, vermutlich ein Kontext-/
Worktree-Problem der Fork-Ausführung. Die Ergebnisse waren daher
irrelevant und wurden verworfen; stattdessen den kompletten Diff seit
Teil 17 (`775a9df^..HEAD`, ~1200 Zeilen über 19 Dateien) manuell
Datei für Datei durchgesehen.

**Ein echter Bug gefunden und behoben**: In `AtemTimer.jsx` lief der
Fortschrittsring bei jeder Atemphase (Einatmen/Halten/Ausatmen)
rückwärts — startete voll und leerte sich, statt sich zu füllen.
Ursache: `ringDone` wurde versehentlich mit der Restzeit-Formel
berechnet (`total - verstrichen`, fallend) statt mit der
Verstrichen-Formel (`verstrichen`, steigend) — `ProgressRing.jsx`
erwartet aber `done` steigend (`pct = done/total`). Rein visuell, keine
Auswirkung auf Ton/Ablauf/Dokumentation — aber ein spürbarer Makel bei
einer Übung, die gerade beruhigend wirken soll.

Restliche geprüfte Bereiche ohne Befund: Phasenübergangs-Logik im
Timer (Rundung, Abbruch während Vorbereitung, sauberer Abschluss nach
vollständigem Ausatmen), die Callback-Verträge zwischen AtemTimer/
AkutModusPanel/AtemuebungenView (kein doppeltes/verlorenes Logging),
Optional-Chaining bei Zahlenwerten (0 vs. leer bei Halten-Sekunden),
RLS-Policies der drei neuen Tabellen, sowie alle Routing-/Integrations-
Änderungen (MehrTab, PlaeneView, AuthenticatedApp, dayItems, Icon).

---

## ✅ Update 16.08.2026, Fortsetzung (Teil 20) — Akutmodus: eigene, frei eingetragene Maßnahme dokumentieren

Direkt im Anschluss an Teil 19 (Commit `ce1a39c`). Nutzerinnen-Beispiel:
jemand geht im Akutmodus raus, konzentriert sich spontan 5 Minuten auf
eine schöne Aussicht statt der eingestellten Atem-/Akut-Übung — auch
das soll dokumentierbar sein, als Grundlage dafür, dass der Coach
erkennt, was der Person tatsächlich hilft (z. B. könnte sich daraus
später eine Vorstellungskraft-/Visualisierungs-Übung ergeben).

Neuer Button "✍️ Ich hab schon selbst was gemacht — eintragen" in
`AkutModusKarte.jsx` (unterhalb des Freitext-"Idee holen"-Felds) öffnet
ein einfaches Formular ("Was hast du gemacht?"), gefolgt vom selben
Gefühls-Check-in wie bei den anderen Akutmodus-Wegen (Symptom-Kachel,
Akut-Übung, Atemübung). **Keine neue Migration, keine Edge Function
nötig** — nutzt die in Teil 19 bereits angelegte `akutmodus_log`-
Tabelle (Spalten `aktion`/`detail`/`gefuehl_danach` reichten schon
aus). Sofern Migration `0076_atemuebungen.sql` (Offener Punkt #32)
schon ausgeführt wurde, ist dieser Teil damit bereits ohne weiteres
Zutun live.

`npm run build` erfolgreich geprüft.

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 19) — Neuer Protokollbereich "Atemübungen" + Akutmodus-Dokumentation

Direkt im Anschluss an Teil 18 (Commit `0fe62a9`). Nutzerinnen-Vorgabe:
ein komplett neuer, eigener Protokollbereich für Atemübungen —
konfigurierbares Muster (Sek. einatmen/halten/ausatmen), 10 Sek.
Vorbereitungszeit mit hörbarem Ticken, danach geführter Phasenwechsel
mit demselben Erinnerungston wie beim Wecker, schriftliche Anleitung
statt Sprachausgabe (keine KI nötig). Zusätzlich: die Übung soll sich
auch im Akutmodus starten lassen, und der Akutmodus soll dokumentieren,
was gemacht wurde und ob es geholfen hat.

**Neuer Protokollbereich:**
- Migration `0076_atemuebungen.sql`: drei neue Tabellen —
  `atemuebungen` (Presets: Name, Sek. je Phase, Gesamtdauer),
  `atemuebung_logs` (abgeschlossene Sitzungen inkl. optionalem
  Gefühls-Check-in danach), `akutmodus_log` (schlanke Dokumentation
  für den Akutmodus, siehe unten).
- `AtemTimer.jsx` (neu): eigenständiger 3-Phasen-Timer. **Bewusst
  NICHT** der bestehende, überall verwendete `Timer.jsx` erweitert
  (der kennt technisch nur zwei Phasen "arbeit"/"pause") — ein Umbau
  hätte alle bisherigen Einsatzstellen (isometrisches Training,
  Workflow-Intervalle) riskiert. Stattdessen eine neue, unabhängige
  Komponente, die dieselben bewährten Bausteine wiederverwendet:
  `playBeep`/`playTick` aus `utils/beep.js` (bereits vorhanden, u. a.
  vom isometrischen Training — genau der "Ticken pro Sekunde"- und
  "Erinnerungston"-Effekt, den die Nutzerin wollte, existierte also
  schon), `ProgressRing`, echte Timestamp-Anker statt Zähl-Ticks (keine
  Drift). Beendet den Zyklus immer erst nach einem vollständigen
  Ausatmen, nie mitten im Atemzug.
- `AtemuebungenView.jsx` (neu): Presets anlegen/löschen, Starten öffnet
  den Timer, Verlauf der letzten Sitzungen.
- Neues "wind"-Icon im Linien-Icon-Set (`Icon.jsx`).
- Als vollwertiger Protokollbereich integriert (analog zu
  Gewohnheiten, dem einzigen bisherigen Bereich mit demselben Muster):
  toggle-bar in `BAUSTEINE_KATEGORIEN` (MehrTab.jsx, Aktiv/Inaktiv wie
  die anderen 8 Bausteine), `KATEGORIE_META`-Eintrag (dayItems.js) für
  Farbkonsistenz, Direktzugriff über "Alle Pläne" → Routinen-Liste
  (PlaeneView.jsx, neben "Gewohnheiten") statt über die 9-Reiter-
  Zeitplanung (die ist für die aufwendiger geplanten Bereiche gedacht,
  Atemübungen ist bewusst ein einfacheres On-Demand-Werkzeug — bewusst
  NICHT in `PLAENE_TABS`/Wochenübersicht/Onboarding-Schritte
  eingebaut, das wäre deutlich mehr Umfang gewesen, als die Nutzerin
  mit "nicht allzu umfangreich" angefragt hatte).

**Akutmodus erweitert** (`AkutModusKarte.jsx`, `useAkutModus.js`):
- Neue Option "🌬️ Atemübung machen" ganz oben im Panel — startet
  direkt die erste angelegte Übung, oder falls noch keine angelegt
  wurde, eine sinnvolle Standardübung (4-4-6 Sek., 3 Minuten), damit
  der Akutmodus sofort nutzbar ist, ohne vorher eine Übung anlegen zu
  müssen.
- Emoji 🧘 auf Nutzerinnen-Wunsch durch ⭐ ersetzt (bei "Als Akut-Übung
  merken" in GewohnheitenView.jsx).
- **Einfache Dokumentation ergänzt** (`akutmodusEreignisLoggen()`,
  neue Tabelle `akutmodus_log`): Nach jeder Akutmodus-Aktion (Symptom-
  Kachel, Akut-Übung, Freitext, Atemübung) fragt die App "Geht's dir
  jetzt besser?" (😊/😐/😞/Überspringen) und speichert Aktion +
  Rückmeldung. Das ist eine **bewusst schlanke** erste Version der
  Nutzerinnen-Vorgabe ("wie oft hatte er so einen Anfall, wie ist er
  damit umgegangen, ist es besser geworden") — reicht für Häufigkeit/
  Wirksamkeit auf Aktions-Ebene.

**Bewusst NICHT umgesetzt** (expliziter Folgepunkt, siehe Offene
Punkte #33): die volle von der Nutzerin skizzierte Verzweigung
"Notfallmodus → Atemübung ODER Supplement ODER Medikament als
Optionen", jeweils mit eigener Doku. Das würde bedeuten, Supplement-/
Medikamenten-Einnahmen aus dem Akutmodus heraus auszulösen und als
"wegen eines Akutmodus-Ereignisses genommen" zu kennzeichnen — ein
eigener, nicht kleiner Ausbauschritt mit eigenem Datenmodell-Bedarf,
der den heutigen Umfang gesprengt hätte. Aktuell deckt der Akutmodus
Atemübung + Symptom-Kacheln + persönliche Akut-Übung + Freitext ab.

`npm run build` erfolgreich geprüft. **Nicht im Browser getestet**
(Sandbox ohne Supabase-Login) — Timer-Logik sorgfältig per Code-Review
geprüft (Phasenübergänge, Rundung, Abbruch während Vorbereitung,
Beenden-Knopf jederzeit verfügbar).

**🔴 Deploy nötig**: nur die neue Migration `0076` — keine
Edge-Function-Änderung diesmal.

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 18) — Akutmodus überarbeitet: Layout + vorab festlegbare Akut-Übung

Direkt im Anschluss an Teil 17, Feedback zum gerade gebauten Akutmodus
(Commit `8adbdde`):

1. **Layout**: Notfallmodus-Knopf etwas schmaler, daneben (nicht
   darunter) ein gleich hoher, aber schmalerer Knopf für den
   Akutmodus. Umgesetzt als Flex-Reihe (Verhältnis 1,6:1, gleiche Höhe
   automatisch über Flex-Stretch statt fester Pixelwerte). Dafür
   `ADHSModeToggle.jsx` um eine `compact`-Variante erweitert (kein
   Pfeil-Indikator, kleinere Schrift) und `AkutModusKarte.jsx` in zwei
   Teile aufgeteilt: `AkutModusTrigger` (der schmale Knopf für die
   Reihe) und `AkutModusPanel` (das eigentliche Feature in voller
   Breite, öffnet sich unterhalb der Knopf-Reihe). Layout lokal per
   Playwright-Screenshot einer statischen HTML-Kopie der Styles
   geprüft (Sandbox kann nicht einloggen, siehe #30).
2. **Vorab festlegbare "Akut-Übung"**: Nutzerin wollte, dass sich eine
   konkrete Übung (isometrisches Training, progressive Entspannung,
   Atemübung o. Ä.) vorher hinterlegen lässt, die die App im Akutmodus
   dann aktiv mit warmer, geführter Anleitung vorschlägt — "die App
   ist dann so ein bisschen der Kumpel, der nicht da ist". Umgesetzt
   über die BESTEHENDEN Gewohnheiten statt eines neuen, separaten
   Übungs-Systems (Nutzerin selbst unsicher, wo genau — "Gewohnheiten
   und Workflow, keine Ahnung" — Gewohnheiten gewählt, da einfachster,
   naheliegendster Ort für "Isometrisches Training"/"Atemübung" als
   trackbarer Eintrag; Workflow-Presets als möglicher zweiter Ort
   bewusst nicht mit umgesetzt, um den Umfang nicht zu verdoppeln):
   - Migration `0075_gewohnheit_akut_favorit.sql`: neue Spalte
     `routines.akut_favorit`.
   - `GewohnheitenView.jsx`: neuer Umschalter "🧘 Als Akut-Übung
     merken" pro Gewohnheit, neben "Ziel bearbeiten".
   - `AkutModusPanel`: als Akut-Übung markierte Gewohnheiten erscheinen
     prominent VOR den allgemeinen Symptom-Kacheln; Antippen ruft
     `uebungAnfordern()` auf, die denselben "akut"-Prompt der
     `lexikon`-Funktion nutzt (der ohnehin schon "kurz anerkennen + 1-2
     konkrete Schritte" verlangt) — dadurch **keine weitere Änderung an
     der Edge Function nötig**, nur ein anders formulierter Anfragetext
     ("Ich möchte jetzt meine Akut-Übung machen: '{Name}' — führ mich
     kurz und warmherzig da durch").

`npm run build` erfolgreich geprüft. Weiterhin **nicht im Browser
getestet** (Sandbox ohne Supabase-Login) — nur Layout separat per
Screenshot verifiziert.

**🔴 Deploy nötig**: nur die neue Migration `0075` — die
`lexikon`-Edge-Function musste diesmal NICHT erneut geändert werden.

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 17) — Neues Feature "Akutmodus" auf der Startseite

Direkt im Anschluss an Teil 16. Nutzerinnen-Vorgabe: ein Knopf im
Home-Bereich für Momente akuter ADHS-Symptomatik ("innere Unruhe",
"kirre werden") — Symptom antippen oder frei beschreiben, direkt eine
konkrete Lösung angeboten bekommen (Commit `775a9df`).

**Wichtige Architektur-Entscheidung dabei eingehalten**: Beim Bauen
festgestellt, dass es eine bewusste frühere Entscheidung gibt — der
offene KI-Chat (KiChat.jsx/"Aka") ist für echte Coachees NICHT
verfügbar, die kommunizieren stattdessen mit dem echten Coach
(`useCoacheeNachrichten.js`, Kommentar dort: "ersetzt für Coachees den
KI-Assistenten als Kontaktmöglichkeit"). Ein Akutmodus mit offenem
KiChat hätte diese Entscheidung stillschweigend unterlaufen. Stattdessen
denselben leichtgewichtigen Einzelanfrage-Mechanismus wie das
bestehende Lexikon verwendet (bestätigt coachee-zugänglich, da über
"Mehr"-Tab ohne Admin-Gate erreichbar) — technisch dieselbe `lexikon`
Edge Function, nur mit neuer, wärmerer "Akutmodus"-Rolle statt
Glossar-Ton.

- `utils/wissensBasis.js`: neue `wissensBasisFuerPfade()` — liefert
  Text aus mehreren gezielt gewählten Wissensdateien (nicht nur einem
  ganzen Ordner wie bei der Lexikon-Variante aus Teil 15).
- `data/useAkutModus.js` (neu): 7 Symptom-Kacheln (Reizüberflutung, zu
  viele Aufgaben, komme nicht in Gang, innere Unruhe/kirre,
  Konzentration weg, Gedankenrasen, sehr gereizt) + freier Text, jede
  Kachel mit eigenem kuratiertem Kontext aus den passenden
  Wissens-Dateien.
- `ui/AkutModusKarte.jsx` (neu): Knopf → Symptom-Kacheln/Freitext → KI-
  Antwort (max. 4 kurze Sätze, sofort umsetzbar) → optional direkt an
  den echten Coach weiterleiten. Der "An {Coach} schicken"-Knopf
  erscheint nur für echte Coachees, nicht im Verwalten-als-Modus.
- `views/HomeView.jsx`: direkt unter dem bestehenden Notfallmodus-Knopf
  eingebunden — ergänzt ihn sinnvoll (Notfallmodus vereinfacht nur die
  Ansicht auf das Nötigste, Akutmodus schlägt zusätzlich aktiv eine
  Lösung vor).
- `supabase/functions/lexikon/index.ts`: neues optionales
  `modus: "akut"`-Feld — exakt abwärtskompatibel, das bestehende
  Lexikon (LexikonView.jsx) verhält sich unverändert, wenn das Feld
  fehlt.

`npm run build` erfolgreich geprüft. **Konnte NICHT im Browser
getestet werden** (Sandbox ohne Netzwerkzugriff auf Supabase, kein
Login möglich) — nur per Code-Review geprüft, keine echte
End-to-End-Bestätigung.

**🔴 Deploy nötig**: `functions/lexikon/index.ts` hat sich erneut
geändert (nach dem Redeploy in Teil 15/16) — muss noch einmal manuell
in Supabase neu deployt werden, sonst bleibt der Akutmodus-Knopf ohne
Wirkung (Fehlermeldung "Antwort konnte gerade nicht geladen werden"
o. Ä., kein Absturz der App).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 16) — Morgenroutine + Abendroutine als letzte fehlende Wissens-Themen ergänzt

Direkt im Anschluss an Teil 15. Nutzerin bemerkte, dass Morgen- und
Abendroutine (nicht zu verwechseln mit Schlaf, das schon in Teil 15
behandelt wurde) noch fehlten, und bat darum, sie ebenso umfassend
abzuhandeln (Commit `88306a6`). Geprüft: `src/wissen/` hatte für beide
Themen bislang gar keinen eigenen Ordner (nur je ein kürzerer
"Modul"-Eintrag in coach_wissen, Migration 0050) — echte Lücke, jetzt
geschlossen.

- `morgenroutine/morgenroutine-bei-adhs.md` (neu): Schlaftrunkenheit
  (Sleep Inertia, bei ADHS überdurchschnittlich stark ausgeprägt),
  Cortisol-Aufwachreaktion (38-75 % Anstieg in den ersten 30-45 Min.),
  Decision Fatigue als doppelter Engpass, warum Snoozen die
  Schlaftrunkenheit eher verstärkt, Chaining/kleinstmögliche erste
  Handlung, Medikamenten-Timing-Mismatch am Morgen.
- `abendroutine/abendroutine-bei-adhs.md` (neu): "Revenge Bedtime
  Procrastination" (AASM-Umfrage 2024: 52-58 % der US-Erwachsenen,
  bei ADHS verstärkt durch Zeitblindheit/Fremdbestimmungsgefühl),
  physiologisches Wind-Down-Fenster, doppelter Aktivierungseffekt von
  Bildschirmen (Licht- UND Inhalts-Kanal), 2025er Studie zur
  wechselseitigen Handynutzung-/Aufschub-Beziehung (80 vs. 18 Minuten
  Bildschirmzeit), Medikamenten-Rebound am frühen Abend.
- Beide bewusst mit Querverweisen auf Schlaf-, Tageslicht-, Gewohnheits-
  und Medikamente-Wissen dieser App geschrieben statt Inhalte zu
  duplizieren — gleiche Vorgehensweise wie bei den 8 Themen aus Teil 15.
- Zwei neue PDF-Handbücher erstellt und verschickt.
- `npm run build` erneut erfolgreich geprüft (Bundle weiter gewachsen,
  siehe Architektur-Warnung #28 — betrifft jetzt 11 umfangreiche
  Themen-Dateien plus Ernährung).

Damit sind jetzt alle ADHS-Alltagsbereiche, die in dieser App als
eigene Protokoll-Kategorien existieren, mit einem vollständigen
Wissens-Leitfaden hinterlegt.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 15) — Alle 8 verbliebenen Platzhalter-Themen auf Ernährungs-Niveau ausgebaut + Lexikon an Wissensbasis angebunden

Direkt im Anschluss an Teil 14. Nutzerin: Wenn der Ernährungs-Leitfaden
jetzt der umfangreichste Text der Wissensbasis ist, sollen alle anderen
Themen ebenso umfassend aufgearbeitet werden — UND die
Coaching-Unterlagen (Coachinghandbuch/Lexikon/Curriculum) sollen zur
App-Wissensbasis konsistent bleiben, damit sie nie mehr "weiß" als sie
selbst nachlesen kann. Vor dem Start per Rückfrage geklärt (Nutzerin
antwortete "alle 8 direkt nacheinander" + "beides" zu
appintern/appextern) — Details dazu unten (Commit `e52c5dd`).

**1. Acht bisherige Platzhalter-Dateien ersetzt** (jeweils mit
WebSearch-gestützter aktueller 2024-2026-Studienlage, Evidenzgrad pro
Aussage, eigenem PDF-Handbuch):
- `gewohnheiten/gewohnheiten-bei-adhs.md` — Neurowissenschaft der
  Gewohnheitsbildung, Implementation Intentions (heben ADHS-Leistung
  bei exekutiven Aufgaben auf annähernd neurotypisches Niveau), Habit
  Stacking, Environmental Design, Body Doubling, "Restart statt
  Aufholen".
- `hydration/hydration-bei-adhs.md` — Interozeptionsforschung
  (Bruton 2025), kognitive Effekte bereits milder Dehydration (~1 %
  Körpergewicht reicht), Stimulanzien-Effekt auf Durstempfinden.
- `schlaf/schlaf-bei-adhs.md` — ADHS als circadiane Rhythmusstörung,
  DLMO-Verschiebung (45 Min. Kinder/90 Min. Erwachsene), Chronotherapie-
  RCT, Restless-Legs-Syndrom (20-33 % Prävalenz bei ADHS), CBT-I,
  differenzierter Blick auf Stimulanzien-Effekt auf Schlafqualität.
- `tageslicht/tageslicht-bei-adhs.md` — Lichttherapie-Studien zu
  ADHS-Kernsymptomatik (nicht nur Schlaf), "Grün-Zeit"/Attention
  Restoration Theory bei Naturaufenthalten.
- `training/training-bei-adhs.md` — akutes Zeitfenster nach Training
  (30-60 Min. verbesserter Fokus), Vergleich Trainingsarten
  (fertigkeitsbasiert schlägt reines Ausdauertraining bei exekutiven
  Funktionen laut 2025er Netzwerk-Meta-Analyse), BDNF-Timing, ergänzt
  das gesonderte Isometrisches-Training-Wissen in coach_wissen.
- `medikamente/medikamente-bei-adhs.md` — bewusst Coaching-fokussiert
  (Einnahmetreue/Adhärenz-Forschung: nur 20-40 % Therapietreue nach 12
  Monaten, Einflussfaktoren, was nachweislich hilft), explizit KEINE
  Dosierungs-/Präparate-Empfehlungen, klare Grenzziehung zur
  ärztlichen Zuständigkeit.
- `supplemente/supplemente-bei-adhs.md` — bewusst als
  **Rahmenkonzept/Entscheidungslogik** angelegt (Mangel vs.
  Optimierung, Sicherheitsrahmen, Produktqualität/Kontamination,
  gezielte Vermarktung an ADHS-Zielgruppe laut Lancet Psychiatry 2026),
  NICHT als Wiederholung der ~25 bereits einzeln in coach_wissen
  gepflegten Supplement-Einträge (Magnesium, Zink, Omega-3, Kreatin
  usw.) — verweist stattdessen darauf, um Redundanz in der ohnehin
  riesigen Wissensbasis zu vermeiden.
- `peptide/peptide-bei-adhs.md` — größte inhaltliche Lücke (vorher
  0 Einträge in coach_wissen UND nur Platzhalter in src/wissen).
  Ordnet nach regulatorischer Kategorie (zugelassenes Medikament vs.
  Off-Label vs. unreguliertes "Research Chemical"), GLP-1-Agonisten
  und ADHS (2024er PET-Studie zu Dopamintransporter-Bindung unter
  Semaglutid, 2025er Beobachtungsstudie, aber explizit KEINE RCTs zu
  ADHS UND ein 2025er Sicherheitssignal zu Depression/Suizidalität bei
  entsprechender genetischer Veranlagung), BPC-157/TB-500
  (Tierstudien, Zulassungsstatus, Qualitätsrisiko unreguliert
  gekaufter Produkte). Strengste Coaching-Grenzen im gesamten
  Dokument (keine Bezugsquellen, keine Dosierung).

**2. In-App-Lexikon an Wissensbasis angebunden** (`utils/wissensBasis.js`,
`data/useLexikon.js`, `functions/lexikon/index.ts`): Beim Prüfen
festgestellt, dass die Lexikon-Funktion der App (📚-Icon, andere
Funktion als der KI-Chat/Aka) bisher OHNE jeden Bezug zur kuratierten
Wissensbasis antwortete — reine freie Modellantwort. Neue Funktion
`wissensBasisFuerLexikonKategorie()` liefert jetzt gezielt den
Wissenstext des passenden `src/wissen/`-Ordners zur gewählten
Lexikon-Kategorie; `useLexikon.js` schickt ihn als `kontext`-Feld mit;
die Edge Function baut ihn (falls vorhanden) in den Prompt ein. Nur 3
der 7 Lexikon-Kategorien haben einen passenden Wissens-Ordner
("Peptide", "Supplemente", "Schlafgesundheit" → `peptide/`,
`supplemente/`, `schlaf/`) — die anderen vier ("Hormone", "Anti-Aging",
"Muskelaufbau", "Haut & Haare") haben aktuell keinen eigenen
Wissensordner in dieser App und bleiben bewusst unverändert bei freier
Modellantwort, um nicht über den heute abgesteckten Rahmen
hinauszugehen. **🔴 Deploy nötig**: `functions/lexikon/index.ts` muss
manuell in Supabase neu deployt werden (kompletten Dateiinhalt in der
Edge-Function-Konsole ersetzen) — ohne Redeploy läuft die alte Version
weiter (kein Fehler, nur ohne den neuen Kontext-Effekt).

**3. Architektur-Warnung aus Teil 13/14 jetzt akut**: Die
`src/wissen/`-Sammlung ist durch diese Runde um satte 8 weitere große
Dateien gewachsen (Bundle +85 KB), alles davon fließt weiterhin
ungefiltert in JEDEN KiChat-Aufruf ein (`wissensBasisText()`,
`utils/wissensBasis.js`). Das ist jetzt kein theoretisches
"später bedenken" mehr, sondern ein realer Kosten-/Latenz-Faktor bei
jeder KI-Chat-Anfrage in der App. Empfehlung fürs nächste Mal, wenn
daran gearbeitet wird: gezielte Auswahl/Kurzfassung pro Themenbereich
statt weiter alles an jede Anfrage anzuhängen (z. B. nur den zum
gerade aktiven Protokoll-Bereich passenden Ausschnitt mitschicken,
ähnlich wie jetzt schon fürs Lexikon umgesetzt).

**4. Bewusst NICHT gemacht** (außerhalb des heute abgesteckten
Rahmens): coach_wissen (DB-Content-Library) wurde für keines der 8
Themen verändert — bestehende, bereits ausführliche Einträge dort
(Supplemente, Training/Isometrisches Training, Schlaf, Tageslicht,
Gewohnheiten, Hydration, Medikamente als "Modul"-Paare) bleiben
unangetastet und wurden nur beim Schreiben als Kontext berücksichtigt,
um Redundanz zu vermeiden. Externe, appfremde Coachinghandbuch-/
Lexikon-/Curriculum-Dokumente der Nutzerin kann ich nicht direkt
bearbeiten (kenne sie nicht) — die 8 neuen PDF-Handbücher sind die dafür
gedachte Grundlage zum eigenen Abgleich.

Build erfolgreich geprüft (`npm run build`), alle Änderungen committet
und gepusht.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 14) — Ernährungs-Leitfaden um viele Ernährungsweisen + aktuelle Studienlage erweitert

Sitzung wurde entgegen der Ankündigung in Teil 13 doch fortgesetzt:
Nutzerin sah den fertigen Leitfaden aus Teil 13, stellte klar,
intermittierendes Fasten sei "nur ein Beispiel" gewesen, und wollte
viele wissenschaftlich untersuchte Ernährungsweisen bei ADHS abgedeckt
haben — inklusive solcher, die noch früh in der Forschung stehen, aber
Potenzial zeigen, mit der **aktuellsten Studienlage**, "noch
akademischer", damit sie es gefiltert an ihre Coachees weitergeben
kann (Commit `581d40f`).

**Vorgehen:** Vor dem Schreiben mehrere Web-Recherchen zur aktuellen
(2024–2026) Studienlage durchgeführt (allgemeine Ernährungsmuster,
mediterrane Ernährung, Eliminationsdiäten/Farbstoffe/Feingold,
ketogene Ernährung, Mikrobiom/Probiotika, Omega-3, intermittierendes
Fasten, Mikronährstoffe, niedrig-glykämische Ernährung, gluten-/
kaseinfreie Ernährung, Präzisionsernährung), um nicht nur aus
Trainingswissen zu argumentieren.

**`src/wissen/ernaehrung/ernaehrung-bei-adhs.md` inhaltlich erweitert:**
- **Neuer Abschnitt 2.4** erklärt die Evidenzgrad-Logik (RCT vs.
  Meta-Analyse vs. Beobachtungsstudie vs. mechanistisch/theoretisch
  begründet) — Vokabular, das die Nutzerin auch im Coaching-Gespräch
  nutzen kann.
- **Abschnitt 2.2 (Fette/Omega-3) bewusst abgeschwächt**: eine aktuelle
  (2024/2025) Meta-Analyse (~22 Studien, ~1.800 Teilnehmende) fand
  **keinen** signifikanten Effekt von Omega-3-Supplementierung auf
  ADHS-Kernsymptome — deutlich zurückhaltender als die vorherige
  Formulierung. Ausführlich neu eingeordnet in **Abschnitt 3.9**.
- **Neuer, großer Abschnitt 3** ("Ernährungsweisen und Diät-
  Interventionen bei ADHS — aktuelle Studienlage") mit 11
  Unterabschnitten, jeweils mit Evidenzgrad-Label (Etabliert/Moderat/
  Aufkommend/Theoretisch), Mechanismus, Studienlage und
  Praxis-Einordnung: 3.1 allgemeines Ernährungsmuster (gesund vs.
  "westlich"), 3.2 mediterrane Ernährung (Ríos-Hernández 2017, Odds
  Ratio ~7 bei geringer Einhaltung), 3.3 Eliminationsdiäten/künstliche
  Farbstoffe/Feingold (Southampton-Studien, EU-Warnpflicht;
  Few-Foods-Diät mit stärkeren, aber aufwendigeren Effekten), 3.4
  niedrig-glykämische Ernährung, 3.5 ketogene Ernährung (früh, Oxford-
  RCT in Planung), 3.6 Darmmikrobiom/Probiotika (uneinheitlich), 3.7
  Mikronährstoffstatus (Eisen/Zink/Magnesium/Vitamin D), 3.8
  intermittierendes Fasten (bestehender Inhalt aus Teil 13 übernommen,
  jetzt mit explizitem Hinweis, dass direkte ADHS-Studien dazu
  praktisch fehlen), 3.9 Omega-3 neu eingeordnet, 3.10 gluten-/
  kaseinfreie Ernährung (schwache Evidenz für ADHS), 3.11
  Präzisionsernährung (Zukunftsfeld).
- Alte Abschnitte 4–8 (Mahlzeitenrhythmus, Lebensumstände, Getränke,
  Lebensmittel-Listen, Coaching-Praxis) unverändert erhalten, nur
  neu nummeriert; Abschnitt 7 um einen kurzen Verweis auf konkrete
  E-Nummern der Farbstoffe aus 3.3 ergänzt.
- **Neuer Abschnitt 9** listet die verwendeten Studien/Forschungsstränge
  als Ausgangspunkt für eigene Vertiefung.
- Datei wuchs von 301 auf 574 Zeilen. **Architektur-Hinweis aus Teil 13
  bleibt bestehen und verschärft sich**: diese Datei ist jetzt noch
  deutlicher die umfangreichste unter `src/wissen/` und fließt weiterhin
  ungefiltert in JEDEN KI-Chat der App ein (`utils/wissensBasis.js`,
  keine Vektorsuche). Beim nächsten Wachstumsschub der Wissens-Basis
  sollte über gezieltere Auswahl pro Anfrage nachgedacht werden.

**PDF-Handbuch neu erzeugt** (`build_pdf.py`, unverändert wiederverwendet)
und der Nutzerin erneut geschickt — jetzt 13 statt 7 Seiten, Aufbau/
Formatierung (Cover, Kapitel, Bullet-Listen, Fußzeile) unverändert
funktionsfähig, per pymupdf stichprobenartig visuell geprüft.

`npm run build` nach der Erweiterung erneut erfolgreich geprüft (Bundle
wuchs weiter, siehe Architektur-Hinweis oben).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 13) — Ernährungs-Wissen ausgebaut + Sitzungsabschluss

Letzte Runde der Sitzung, direkt im Anschluss an Teil 12. Zwei Themen:

**1. Härtere Sperre gegen Selbstregistrierung vertagt.** Die Nutzerin
wollte das eigentlich (Begründung: Piraterie-/Neugier-Schutz, sobald sie
öffentlich über die App spricht), hat es dann aber bewusst zurückgestellt
zugunsten des zweiten Themas unten — als offener Punkt #24 dokumentiert
(inkl. Zwischenstand: "Enable email provider" NICHT anfassen, vermuteter
"Allow new users to sign up"-Schalter unter einem "User Signups"-Bereich
auf der Hauptseite "Sign In / Providers" noch zu bestätigen).

**2. Umfassender Ernährung-bei-ADHS-Leitfaden** (Commit `38e067d`) —
Nutzerinnen-Vorgabe: nach Medikamente/Supplemente/Schlaf/Tageslicht/
isometrischem Training war Ernährung der letzte große Bereich ohne
detailliertes Hintergrundwissen. Zwei Ausgaben, ein Inhalt:
- `src/wissen/ernaehrung/ernaehrung-bei-adhs.md` ersetzt den bisherigen
  Platzhalter — wird wie jede Datei unter `src/wissen/` automatisch in
  den Hintergrundkontext des KI-Assistenten eingebunden (siehe
  `utils/wissensBasis.js`, "alles wird an jede Anfrage angehängt", keine
  Vektorsuche). **Zu bedenken für die Zukunft**: die Datei ist mit
  Abstand die umfangreichste unter `src/wissen/` (die Bundle-Größe stieg
  dadurch spürbar, ca. 15 KB) — sie fließt in JEDEN KI-Chat der App ein,
  nicht nur ernährungsbezogene. Bei weiterem Wachstum der Wissens-Basis
  (z. B. wenn Medikamente/Supplemente/Schlaf irgendwann ähnlich
  ausführlich wie hier nachgezogen werden) sollte über eine gezieltere
  Auswahl pro Anfrage nachgedacht werden, statt weiter alles an jede
  Anfrage anzuhängen.
- Inhaltlich behandelt: warum Ernährung bei ADHS überhaupt relevant ist
  (Neurotransmitter-Bausteine, Blutzucker, Darm-Hirn-Achse), die drei
  Makronährstoffe im Detail, intermittierendes Fasten differenziert
  (Pro/Contra spezifisch für ADHS, wann es trotzdem infrage kommt), warum
  regelmäßige Mahlzeiten meist die bessere Standardempfehlung sind,
  wann sich der Ernährungsbedarf je nach Lebensumständen ändert
  (Training, Medikamenten-Titration, Stress, Zyklus, Schlafmangel),
  Getränke, sowie Lebensmittel-/Getränkelisten (empfehlenswert/eher
  meiden) je Kategorie.
- Zusätzlich als eigenständiges PDF-Handbuch erstellt und der Nutzerin
  direkt geschickt ("Ernährung bei ADHS — Handbuch", 7 Seiten,
  reportlab-generiert) — bewusst NICHT in die bestehende
  `coach_wissen`-Content-Library (DB-gestützt, siehe Migrationen
  `coach_wissen_*`) eingepflegt, das hat die Nutzerin explizit auf später
  vertagt ("kann man später irgendwie reinhängen").

Sitzung von der Nutzerin für den Moment beendet ("das wäre echt noch das,
was du machen sollst ... bis ich die nächsten Tage wieder zu dir komme").

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 12) — Einladungssystem statt offener Registrierung + wählbarer Onboarding-Umfang

Direkt im Anschluss an Teil 11, ausgelöst durch zwei Beobachtungen der
Nutzerin beim Testen: (1) ihr Testkonto landete im kurzen Steckbrief-
Onboarding statt der vollen Einrichtung, (2) dabei kam heraus, dass der
Login-Screen noch einen offenen "Registrieren"-Tab hatte — jede beliebige
Person mit der URL hätte sich dort selbst ein Konto anlegen können, ganz
ohne Einladung. Beides jetzt behoben (Commit `c2044af`).

**1. Selbstregistrierung entfernt.** `LoginView.jsx` hat nur noch
"Anmelden", `AuthContext.signUp` wurde komplett entfernt. Konten entstehen
jetzt ausschließlich über die Admin — entweder direkt mit gesetztem
Passwort ("+ Neuen Zugang anlegen") oder per Einladung (siehe unten).
**Wichtig, das reicht allein noch nicht:** die Entfernung der UI verhindert
nicht, dass jemand mit Kenntnissen direkt die Supabase-API anspricht (der
öffentliche Anon-Key steckt sowieso im Browser-Bundle). Für einen
wirklich dichten Riegel sollte die Nutzerin zusätzlich einmalig in Supabase
→ Authentication → Sign In / Providers → Email die Option "Enable email
signups" deaktivieren (nur Einladungen/von Admin angelegte Konten bleiben
dann überhaupt möglich).

**2. Wählbarer Onboarding-Umfang je Coachee** (Nutzerinnen-Vorgabe: "ich
möchte verschiedene Coaching-Modelle anbieten, manche werden mehr selbst
geführt, manche komplett von mir geleitet"):
- Neue Spalte `profiles.onboarding_modus` ("kurz"/"lang", Standard
  "kurz" — bisheriges Verhalten bleibt der Default). Steuert in
  `OnboardingFlow.jsx`, ob eine Coachee beim EIGENEN Durchlauf nur den
  kurzen Steckbrief sieht (wie bisher) oder die volle Kategorie-
  Einrichtung, die sonst nur die Admin im "Verwalten"-Modus sieht.
  Wirkt sich NICHT aus, wenn die Admin sowieso per "Verwalten" alles
  vorher selbst einrichtet — dann bleibt es wie gehabt bei "kein
  Onboarding mehr nötig", unabhängig vom gewählten Modus.
- Wählbar an drei Stellen: beim Anlegen ("+ Neuen Zugang anlegen"), bei
  einer Einladung (siehe unten), und nachträglich direkt in der
  Kontenliste (kleiner "Onboarding: Kurz/Lang"-Knopf, nur sichtbar
  solange die Person ihr Onboarding noch nicht abgeschlossen hat).

**3. Einladung per E-Mail** (Nutzerinnen-Vorgabe: "dass ich jemandem einen
Link schicke ... er nur darüber reinkommt"):
- Neue Edge Function `admin-invite-proband` — nutzt Supabases eingebaute
  `auth.admin.inviteUserByEmail()`, verschickt die Standard-Einladungs-
  Mail von Supabase (Vorlage im Supabase-Dashboard unter Authentication →
  Email Templates anpassbar, aber nicht zwingend nötig). **Muss die
  Nutzerin noch manuell anlegen und deployen** (komplett neue Funktion,
  wie schon bei `send-team-push` in Teil 9/10).
- Neue Admin-UI "✉️ Coachee einladen" (Name, E-Mail, Kurz/Lang-Wahl).
- Neue `InviteAcceptView.jsx`: fängt den Klick auf den Einladungs-Link ab
  (URL-Parameter `type=invite`, dieselbe Weiche greift auch für
  `type=recovery` — es gibt also nebenbei jetzt auch eine funktionierende
  Landing-Page für "Passwort vergessen"-Links, falls die Nutzerin sowas
  später mal manuell über Supabase auslöst) und lässt die Person sich
  selbst ein Passwort setzen, bevor die eigentliche App startet.
- **Muss die Nutzerin einmalig prüfen**: Supabase → Authentication → URL
  Configuration → "Site URL" muss auf die echte App-URL zeigen
  (`akaapp.vercel.app` oder die tatsächliche Domain), sonst führt der
  Link in der Einladungs-Mail ins Leere.

**Nicht end-to-end testbar aus diesem Sandbox** (kein Netzwerkzugriff auf
Supabase) — die Nutzerin sollte einmal eine echte Testeinladung an sich
selbst (oder eine Zweit-E-Mail) verschicken und den kompletten Ablauf
durchklicken, bevor sie das für echte Coachees nutzt.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 11) — Test-Coachee-Zugangsdaten sichtbar (separates Login statt nur "Verwalten")

Direkt im Anschluss an Teil 10. Nutzerinnen-Vorgabe: sie will die App auch
"aus der Coacheeperspektive" nutzen können, mit einem SEPARATEN Zugang statt
über ihren eigenen Admin-Zugang. Wichtige Klarstellung dabei: "Verwalten
als" leistet das NICHT — dabei bleibt `istAdminModus` technisch immer
`true` (`proband !== null || isAdmin`), man sieht dort also absichtlich
weiterhin die Admin-Ansicht (Assistent statt Coachee-Startseite mit
Quests/Rangliste/Team-Karte), damit die Admin für die Person einrichten
kann, ohne deren Sicht simulieren zu müssen.

Behoben (Commit `d479304`): der in Teil 10 gebaute "🧪 Test-Coachee
erstellen"-Knopf zeigt die generierte E-Mail + das Passwort jetzt direkt
an (mit Kopieren-Knopf), statt sie wie beim normalen "+ Neuen Zugang
anlegen"-Formular zu verstecken. Damit kann sich die Nutzerin in einem
privaten/separaten Browser-Tab wirklich als Nicht-Admin-Person einloggen
und die echte Coachee-Ansicht sehen.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 10) — Teams-Deploy: drei Fixes beim Ausführen gefunden + Test-Coachee-Knopf

Direkt im Anschluss an Teil 9, während die Nutzerin die neue Teams-
Migration (0073) tatsächlich ausgeführt hat. Alle vier Punkte sind reine
Reaktionen auf konkrete Fehler/Wünsche beim Testen, keine neuen Features
über das in Teil 9 Beschriebene hinaus (außer Punkt 4).

1. **Migration 0073 lief zunächst nicht** (`ERROR: 42703: column "team_id"
   does not exist`): eigener Bug — die "teams: eigenes Team lesen"-Policy
   referenziert `profiles.team_id` in ihrer USING-Klausel, stand im Skript
   aber VOR der Zeile, die diese Spalte erst anlegt. Reihenfolge korrigiert
   (Commit `906e4af`).
2. **Danach neuer Fehler** (`ERROR: 42703: column qf.angenommen does not
   exist`, beim Anlegen von `quest_rangliste()`): die Nutzerin hatte die
   ursprüngliche Quests-Migration (0070) schon VOR dem späteren Ergänzen
   der `angenommen`-Spalte (Teil 7) ausgeführt — ihr lief also eine ältere
   Version. `0073_teams.sql` holt die Spalte jetzt selbst mit `if not
   exists` nach, statt sich auf einen bestimmten Vor-Deploy-Stand zu
   verlassen (Commit `ef1245b`).
3. **UI-Bug in `AdminTeamsView.jsx`**: der "Team löschen"-Knopf (ohne
   Breitenbegrenzung, `PrimaryButton` ist standardmäßig 100% breit) hat
   sich über die komplette Kartenbreite gezogen und den Teamnamen verdeckt.
   Mit `width: 120` in einem Wrapper-Div behoben, analog zum "Anlegen"-
   Knopf direkt darüber, der von Anfang an korrekt eingefasst war (Commit
   `3cc9733`).
4. **Neuer Wunsch beim Testen**: die Nutzerin hat noch keine echten
   Coachees, wollte aber Profile/Protokolle/Quests/Teams selbst
   durchklicken können, ohne für jeden Testzugang manuell E-Mail/Passwort
   einzutippen ODER eine KI regelmäßig Einträge simulieren zu lassen
   ("das ist jetzt zu groß und zu aufwendig, das ist nicht der Plan").
   Neuer Knopf "🧪 Test-Coachee erstellen" im Admin-Dashboard, direkt neben
   "+ Neuen Zugang anlegen" — ein Klick legt mit zufälliger E-Mail/
   Passwort und fortlaufendem Namen ("Test 1", "Test 2", ...) ein Konto
   an, das ausschließlich über "Verwalten" bedient wird (niemand muss sich
   je damit einloggen). Nutzt die bereits deployte `admin-create-proband`-
   Funktion, keine neue Migration/Edge Function nötig (Commit `c85fa6e`).
   **Bewusst nicht gebaut**: ein Lösch-Knopf für Testkonten — das wäre eine
   nicht rückgängig machbare Aktion samt Kaskaden-Löschung aller Daten
   dieser Person; Aufräumen aktuell nur direkt in Supabase (`auth.users`).

**Arbeitsweise-Hinweis der Nutzerin (16.08., wörtlich sinngemäß):** noch
vorsichtiger sein, keine Bugs/Fehlermasken einbauen oder unbeteiligte
Bereiche anfassen, UND das Übergabeprotokoll nach JEDER Änderung sofort
nachziehen statt am Ende in einer großen Runde — Kontingent-Sorge, falls
später doch nochmal viel repariert werden muss. Ab sofort entsprechend
disziplinierter dokumentieren.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 9) — Quest-Rangliste + Teams: Coachees können sich vergleichen und gegenseitig motivieren

Direkt im Anschluss an Teil 8, zwei Aufträge in Folge: erst eine
Quest-Rangliste (Commit `30d5eb7`), dann — noch in derselben Runde —
Teams, weil die Nutzerin die Rangliste nicht global (alle Coachees sehen
alle), sondern gruppenweise wollte, plus eine neue, größere Funktion:
Motivationsnachrichten zwischen Coachees samt Push (Commit `6ef2051`).

**Quest-Rangliste** (`0072_quest_rangliste.sql`, dann durch Teams-Migration
ersetzt, siehe unten): neue security-definer-Funktion `quest_rangliste()`
liefert Name + Anzahl abgeschlossener Quests je Coachee — sichtbar auf der
Startseite (eigene Zeile hervorgehoben) und oben in der
Quests-Verwaltung. Gibt bewusst nur aggregierte Zahlen zurück, keine
Notizen/Detail-Inhalte anderer Coachees.

**Teams** (`0073_teams.sql`, Nutzerinnen-Vorgabe wörtlich: "dass sich
Coachees ... in Teams zusammengesetzt werden und dann nur diese Teams die
Dinge voneinander sehen können ... dass man sich untereinander auch
Motivation gibt ... Push Nachrichten senden kann"):
- Neue Tabelle `teams` + Spalte `profiles.team_id` — **ein Team pro
  Coachee** (V1-Entscheidung, keine Mehrfach-Mitgliedschaft; für eine
  überschaubare Coaching-Gruppe ausreichend, einfacher als eine n:m-Tabelle).
- `quest_rangliste()` ist jetzt team-bewusst: Admin sieht weiterhin alle
  Coachees, eine Coachee MIT Team sieht nur ihre Team-Kolleg:innen, eine
  Coachee OHNE Team sieht nur sich selbst (kein Rundum-Vergleich ohne
  Team-Zuordnung — genau die geforderte Einschränkung).
- Neue Admin-Ansicht `AdminTeamsView.jsx` ("👥 Teams verwalten" im
  Admin-Dashboard): Teams anlegen/löschen, Coachees per Antippen einem
  Team zuordnen oder entfernen.
- Neue Hilfsfunktion `gleiches_team(a, b)` (security definer) — Grundlage
  für die RLS-Policies der neuen Peer-Nachrichten.
- **Motivationsnachrichten zwischen Team-Kolleg:innen**: neue Tabelle
  `team_nachrichten` (1:1, nicht an die Admin gerichtet — das bleibt
  `coachee_nachrichten`), RLS erlaubt Senden nur innerhalb desselben Teams.
  Neue Karte auf der Startseite (`TeamKarte.jsx`, nur sichtbar mit
  Team-Zuordnung): Team-Kollegin auswählen, Nachricht schreiben, senden.
- **Push-Zustellung dafür**: neue Edge Function `send-team-push` — muss
  die Nutzerin noch **manuell in Supabase anlegen und deployen** (siehe
  Abschnitt 10, ist eine KOMPLETT NEUE Funktion, nicht nur ein Redeploy
  einer bestehenden). Läuft mit dem Service-Role-Key (braucht Zugriff auf
  `push_subscriptions` der Zielperson, die der aufrufende Client per RLS
  nicht lesen dürfte), prüft aber vorher serverseitig per `gleiches_team()`,
  dass Sender:in und Empfänger:in wirklich im selben Team sind — sonst
  könnte im Prinzip jede angemeldete Person jeder anderen eine Push
  schicken, nur weil beide dieselbe App nutzen.

**Bewusst NICHT in dieser Runde umgesetzt:**
- **Team-vs-Team-Vergleich** (Gesamtwertung eines Teams gegen ein anderes,
  z. B. Summe/Schnitt der Quest-Abschlüsse) — die Nutzerin nannte das
  explizit ("diese gesamte Bewertung ... im Gruppenkontext bewertet werden
  können"), umgesetzt ist bisher nur der Vergleich EINZELNER Coachees
  INNERHALB ihres Teams. Eine echte Team-Gesamtwertung wäre eine weitere,
  kleinere Ergänzung (im Kern nur eine neue Aggregations-Funktion +
  Ansicht) — noch offen.
- **Vergleich beim normalen Protokoll** (nicht nur Quests) — weiterhin
  offen, siehe Teil 6/7. Keine verlässliche, faire Einzelzahl über alle
  Kategorien hinweg vorhanden (Training/Ernährung/Supplemente/... laufen
  sehr unterschiedlich), bräuchte eine eigene Klärungsrunde, WAS genau
  verglichen werden soll, bevor es gebaut wird.
- Broadcast-Nachrichten ans ganze Team (statt nur 1:1) — aktuell nur
  Person-zu-Person, analog zum bisherigen `coachee_nachrichten`-Muster.
- Kein Opt-out/Privatsphäre-Einstellung für einzelne Coachees, die evtl.
  nicht verglichen werden wollen — bisher ist die Team-Zuordnung rein eine
  Admin-Entscheidung, die Coachee selbst hat keine Möglichkeit, sich aus
  der Rangliste/den Vergleichen auszublenden.

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 8) — Routinen-Bug bestätigt: wieder eine fehlende Migration + Vorab-Hinweis war versteckt

Direkt im Anschluss an Teil 7. Die in Teil 7 sichtbar gemachte Fehlermeldung
bestätigte die dortige Vermutung: **`Could not find the table
'public.routine_schritte' in the schema cache`** — Migration 0041
(`routine_schritte`, `routine_durchlaeufe`) und vermutlich auch 0044
(`routine_einstellungen`) wurden nie in der echten Datenbank ausgeführt,
obwohl im Übergabeprotokoll als "deployt" notiert. **Exakt dasselbe Muster
wie der `profiles.erinnerungen`-Bug aus Teil 5** — einzelne Migrationen
beim manuellen Durchklicken übersprungen, ohne dass es auffiel, weil auch
hier nur `console.error()` statt einer sichtbaren Fehlermeldung lief (erst
durch den Teil-7-Fix überhaupt sichtbar geworden). Behoben mit neuer
Migration `0071_routine_tabellen_nachholen.sql` (holt alle drei Tabellen +
RLS-Policies nach, idempotent mit `if not exists`/`drop policy if
exists` geschrieben) — **muss die Nutzerin noch manuell in der
Supabase-SQL-Konsole ausführen**.

**Empfehlung für den nächsten Sitzungsstart:** Da jetzt zweimal
unabhängig voneinander Migrationen "als deployt" galten, aber nie liefen,
lohnt sich ein einmaliger Rundum-Check aller ~71 Migrationen gegen die
echte Datenbank (z. B. `select table_name from information_schema.tables
where table_schema = 'public'` mit der Nutzerin abgleichen, oder alle
Tabellennamen aus den `create table`-Anweisungen der Migrationsdateien
extrahieren und gegenprüfen), statt weiter einzeln nachzujagen, sobald
ein Fehler auffällt.

Zusätzlich, aus derselben Nutzerinnen-Vorgabe: Der Vorab-Hinweis
(15/30/45/60 Min. vorher erinnert werden, zusätzlich zum Signal beim
eigentlichen Start — für Gewohnheiten, Training, Mahlzeiten, Supplemente,
Workflow) existierte technisch schon (`VorlaufFeld.jsx`), war aber in
`KategorieErinnerung.jsx` und `WochenplanEditor.jsx` (Training) hinter dem
"Erinnerung: Ja"-Schalter versteckt — die Minuten-Auswahl erschien erst
nach dem Umschalten, was die Nutzerin wiederholt übersehen hat. Jetzt
immer sichtbar, eine Vorlauf-Auswahl aktiviert die Erinnerung von sich aus
mit. Außerdem 45-Minuten-Option ergänzt (bisher nur 15/30/60/120).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 7) — Quests: Annehmen/Ablehnen + Benachrichtigung + Tagesplan/Gewohnheiten, Routinen-Bug gefunden

Direkt im Anschluss an Teil 6, noch selbe Sitzung, zwei Meldungen der
Nutzerin.

**1. Routinen-Bug** (Screenshot: Morgen-/Abendroutine-Schritte-Editor unter
"Routinen"): Vorschlags-Pills ("Wasser trinken" etc.) und das manuelle
"Neuer Schritt"-Feld liefen ins Leere — kein Fehler, keine Bestätigung,
einfach nichts. Die Verdrahtung (`RoutineSchritteEditor.jsx` →
`routineSchrittHinzufuegen()` in `useRoutinen.js`) ist korrekt, aber die
Speicherfunktion meldete einen Fehler bisher nur per `console.error()` —
exakt dasselbe Silent-Failure-Muster wie beim `erinnerungen`-Bug in Teil 5
(Offener Punkt #13). **Nicht abschließend geklärt, ob die zugrunde
liegende Ursache ebenfalls eine fehlende Migration ist** (0041/0044
`routine_*`-Tabellen) — das lässt sich aus diesem Sandbox heraus nicht
gegen die echte Datenbank prüfen. Behoben: `RoutineSchritteEditor.jsx`
zeigt jetzt den tatsächlichen Fehlertext an, statt ihn verschluckt zu
lassen. **Nächster Schritt bei erneutem Auftreten:** den jetzt sichtbaren
Fehlertext im Chat mitteilen — verrät sofort, ob es eine fehlende Tabelle,
eine RLS-Policy oder etwas anderes ist (gleiche Diagnosetechnik wie in
Teil 5).

**2. Quests erweitert** (Nutzerinnen-Vorgabe, wörtlich zusammengefasst):
Coachees sollen über eine neue Quest per Nachricht benachrichtigt werden,
sie annehmen oder ablehnen können, und eine angenommene Quest soll
zusätzlich zur Startseite auch im Tagesplan und unter Gewohnheiten
auftauchen. Umgesetzt (Commit `b7b2911`):
- `quest_fortschritt` hat jetzt eine `angenommen`-Spalte (tri-state: noch
  unbeantwortet/angenommen/abgelehnt) — Migration `0070_quests.sql`
  entsprechend angepasst (siehe unten, **von der Nutzerin noch nicht
  ausgeführt**, daher direkt in der bestehenden Datei ergänzt statt eine
  neue Migration draufzusetzen).
- `adminQuestErstellen()` verschickt nach dem Anlegen automatisch eine
  Nachricht über den bestehenden Kontaktweg (`coachee_nachrichten`, siehe
  0045) — bei einer Rundruf-Quest an alle aktuellen Coachees einzeln.
- Neue geteilte Komponente `ui/QuestsKarte.jsx` (aus `HomeView.jsx`
  herausgezogen, dort dupliziert gewesen): zeigt auf der Startseite ALLE
  sichtbaren Quests inkl. Annehmen/Ablehnen-Einladung; in
  `GewohnheitenView.jsx` und `TagesplanView.jsx` (nur "heute") nur die
  bereits angenommenen, noch offenen Quests, ohne Einladungs-UI.
- `AdminQuestsView.jsx`: Fortschritts-Tabelle unterscheidet jetzt
  "Noch nicht reagiert" / "Abgelehnt" / "Angenommen · in Arbeit" /
  "Erledigt". Button "Archivieren" in "Entfernen" umbenannt (Funktion
  unverändert — Quest verschwindet bei Coachees, bleibt für die Auswertung
  in der Admin-Ansicht sichtbar).

Weiterhin bewusst NICHT umgesetzt (unverändert seit Teil 6): Rangliste/
Konkurrenz zwischen Coachees, automatische Kopplung an echte
Protokoll-Werte (satzgenaue Bestätigung bei Training).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 6) — KI-Chat kann jetzt wirklich eintragen + neues Feature "Quests"

Direkt im Anschluss an Teil 5, noch selbe Sitzung. Zwei Aufträge der
Nutzerin: (1) "die KI ... sagte mir, dass sie selber die Einträge nicht
vornehmen kann ... das war nicht die Idee der ganzen Sache" — der
"Übernehmen"-Mechanismus im Chat (`KiChat.jsx` → `on Uebernehmen`-Callback)
existierte zwar schon für einige Bereiche, aber Workflow/Schlaf fehlten im
universellen Coach komplett, und mehrere `*AusChat`-Extraktoren in
`aiService.js` fragten die KI nach weniger Feldern ab, als die zugehörige
Speicherfunktion eigentlich braucht — die KI hat dann (korrekterweise)
gesagt, sie könne nicht speichern, statt unvollständig zu speichern.
(2) Neues Feature "Quests": freiwillige Sonderaufgaben, die die Coach ihren
Coachees zusätzlich zum Pflicht-Protokoll stellen kann.

### Teil A: Chat-Übernahme lückenlos gemacht

- `f117d31`: Workflow-Presets/-Pläne sind jetzt per Chat anlegbar
  (`workflowAusChat`, neue `handleWorkflowUebernehmen` in
  `GewohnheitenView.jsx`), und der universelle Coach (Home/Tagesplan/
  Wochenübersicht) kennt jetzt auch `schlaf` und `workflow` als Ziel-Bereich
  (`useUniversellerCoach.js`, vorher fehlten beide in
  `bereichErkennen()`/der Switch-Routing-Tabelle, obwohl die dedizierten
  Ansichten dafür längst funktionierten).
- `24f552d`: Der konkrete Auslöser der Nutzerin — Trainingsplan-Chat
  (`trainingsplanAusChat`) fehlten bei Intervall-/isometrischem Training die
  Felder `uhrzeit`/`intervallArbeitSek`/`intervallPauseSek`/`runden`, obwohl
  `wochenplanHinzufuegen()` sie längst unterstützt. Genau diese Felder sind
  bei "5 Sek. halten, 4 Sek. Pause, 5 Runden" aber der eigentliche Inhalt der
  Übung — ohne sie konnte die KI nichts Sinnvolles speichern.
- `9708d21`: Danach alle **übrigen** `*AusChat`-Extraktoren im Hintergrund
  gegen ihre jeweilige Speicherfunktion geprüft (nicht nur gegen die
  DB-Spalten, sondern gegen das, was die Funktion tatsächlich verwendet).
  Ergebnis — drei weitere echte Lücken gefunden und behoben:
  - **`supplementAusChat`**: fehlten `menge` + das komplette
    Intervall-System (`intervallTyp`, `intervallDays`, `customDays`,
    `onDays`/`offDays`, `weekdays`, `eigenerStart`, `uhrzeiten`) — dieselben
    Felder, die Medikamente/Peptide im Chat längst nutzen. Betrifft auch
    `SupplementeView.jsx` und `useUniversellerCoach.js` (beide haben die
    KI-Antwort manuell destrukturiert, mussten also ebenfalls erweitert
    werden, sonst wären die neu erfassten Felder eine Ebene tiefer wieder
    stillschweigend verlorengegangen).
  - **`medikamentAusChat`**: `kategorie`-Enum fehlte `"Peptid"`, obwohl das
    seit der Zusammenführung von Peptiden in `hormones` (Migration 0042)
    eine vollwertige Kategorie ist.
  - **`workflowAusChat`**: fehlten `gueltigVon`/`gueltigBis`
    (Gültigkeitszeitraum), ergänzt inkl. der beiden Aufrufer.
  - Geprüft und bereits vollständig befunden: `gewohnheitAusChat`,
    `routineAusChat`, `hydrationAusChat`, `tageslichtAusChat`,
    `ernaehrungsplanAusChat`, `laborwerteAusChat`, `peptidAusChat`,
    `schlafAusChat`.

Build + `oxlint` nach jedem Schritt sauber (20 Warnungen, alle
vorbestehend, keine Fehler).

### Teil B: Neues Feature "Quests" (freiwillige Sonderaufgaben)

Nutzerinnen-Vorgabe (wörtlich, wichtig für die Einordnung des V1-Scopes):
"diese Woche machen wir drei Sätze isometrisches Training und das soll sone
freiwillige Aufgabe sein ... falls sie Interesse dran haben" — plus, in
einer ausführlicheren Antwort auf Rückfrage: Abschluss soll je nach
Quest-Art unterschiedlich funktionieren (einfach / mit Zielzahl),
beim Abschließen sollen Dauer + was gemacht wurde + Freitext an die Coach
gemeldet werden, und langfristig sollen Coachees **sowohl beim normalen
Protokoll als auch bei Quests gegeneinander antreten können** (ihre eigene
Formulierung: "ein bösen Konkurrenz-Gedanke, gleichzeitig eine gewisse
Gruppendynamik/Team für eine Gemeinschafts-Geschichte").

**V1 umgesetzt** (Commit `c3d2c16`):
- Neue Tabellen `quests` + `quest_fortschritt`
  (`supabase/migrations/0070_quests.sql`, **muss die Nutzerin noch manuell
  in der Supabase-SQL-Konsole ausführen**, siehe Abschnitt 10).
- Admin legt eine Quest an (Titel, Beschreibung, Typ "einfach" oder "mit
  Zielzahl" + Einheit, Ziel = alle Coachees oder eine einzelne Person,
  optional Gültig-bis-Datum) über den neuen Menüpunkt "🎯 Quests verwalten"
  im Admin-Dashboard (`AdminQuestsView.jsx`).
- Coachee sieht offene Quests auf der Startseite (neue `QuestsKarte` in
  `HomeView.jsx`), kann bei Zielzahl-Quests laufend einen Stand speichern,
  und beim Abschließen optional Dauer (Minuten) + Freitext-Notiz angeben.
  Admin sieht alle Meldungen pro Coachee in `AdminQuestsView.jsx`.
- Datenmodell/Hook: `src/data/useQuestData.js` — `useQuestData(userId)` für
  die Coachee-Seite (RLS lässt jede Coachee eigene + Rundruf-Quests sehen),
  plus eigenständige `adminQuest*`-Funktionen (analog
  `coachNachrichtSenden`) für die Admin-Seite, da die Admin nicht an eine
  feste userId gebunden ist.

**Bewusst NICHT in V1** (transparent an die Nutzerin kommuniziert, nicht
stillschweigend weggelassen — gleiches Vorgehen wie bei der
Baustein-Versionierung in Teil 3):
- **Rangliste/Vergleich zwischen Coachees**, weder für Quests noch fürs
  normale Protokoll. Der Wunsch nach "Konkurrenz" UND "Gruppendynamik/Team"
  gleichzeitig ist noch nicht aufgelöst — das ist ein eigenes, größeres
  Feature (braucht eine Definition, was genau verglichen wird, ob anonym
  oder mit Namen, ob pro Woche oder insgesamt) und sollte in einer eigenen
  Runde mit der Nutzerin konkretisiert werden, bevor es gebaut wird.
- **Automatische Kopplung an echte Protokoll-Werte** (z. B. jeden
  geloggten Trainingssatz automatisch mitzählen statt manueller Meldung,
  oder "jeder einzelne Satz muss bestätigt werden" bei Trainings-Quests) —
  V1 nutzt eine manuelle Fortschritts-/Abschlussmeldung durch die Coachee,
  das deckt die genannten Beispiele (Wasser, Aufstehzeit, Leute treffen)
  bereits vollständig ab, aber nicht die feingranulare Satz-für-Satz-
  Bestätigung bei Training.
- Kein Nachfass-/Erinnerungs-Push für offene Quests (anders als beim
  Pflicht-Protokoll) — bewusst weggelassen, damit "freiwillig" nicht durch
  Erinnerungsdruck konterkariert wird; könnte bei Bedarf ergänzt werden.

---

## 🔴 Update 16.08.2026, nachts (Teil 5) — Erinnerungen liefen NIE wirklich: zwei stille Fehlerquellen gefunden + behoben

Letzte Runde vor Zugangsende der Nutzerin. Direkt im Anschluss an Teil 4
(VAPID-Fix), noch in derselben Nacht. Committet: `17ec1fd` (Morgenroutine/
Abendroutine/Workflow-Erinnerungen), `b104732` (Vorab-Hinweis direkt in
jeder Kategorie-Ansicht statt nur unter Mehr — neue Komponente
`ui/KategorieErinnerung.jsx`, eingebunden in `GewohnheitenView.jsx`,
`RoutineTabView.jsx`, `NutritionView.jsx`, `MedikamenteView.jsx`,
`SupplementeView.jsx`, `ZeitErinnerungenCard.jsx`, `WochenplanEditor.jsx`).

**Ausgangspunkt:** Nutzerin legte testweise eine Gewohnheit mit Uhrzeit in
2–3 Minuten an, schaltete die Erinnerung dafür ein — keine
Push-Benachrichtigung kam an, obwohl der VAPID-Fix aus Teil 4 bestätigt
funktionierte (Test-Erinnerung-Button lief). Zwei **voneinander
unabhängige**, beide stille (keine Fehlermeldung für die Nutzerin
sichtbare) Fehlerquellen gefunden, gemeinsam per Screenshots/Supabase-Logs
im Chat durchdiagnostiziert:

### Fehler 1: `CRON_SECRET`-Mismatch — der automatische Versand lief seit jeher gegen 401

`send-due-reminders → Invocations` zeigte: pg_cron ruft zuverlässig jede
Minute auf, aber **fast jeder Aufruf wurde mit 401 abgelehnt**. Ursache:
Migration `0032_erinnerungs_versand.sql` legt den Cron-Job mit einem fest
im SQL-Text eingetragenen `x-cron-secret`-Header an — dieser Wert ist eine
**zweite, unabhängige Kopie** desselben Geheimnisses neben dem
`CRON_SECRET`-Supabase-Secret der Funktion. Beide müssen exakt
übereinstimmen; taten sie (aus unbekanntem Grund, vermutlich beim
ursprünglichen Einrichten) nicht. Da Supabase gespeicherte Secrets nicht
wieder anzeigt, war ein direkter Abgleich unmöglich — stattdessen neuen
Zufallswert erzeugt und **beide Seiten synchron neu gesetzt**:
`CRON_SECRET`-Secret aktualisiert UND Migration 0032 mit demselben neuen
Wert erneut ausgeführt (`cron.schedule()` mit bestehendem Job-Namen
ersetzt den alten Job automatisch, kein vorheriges `unschedule` nötig).

**Wichtige Nebenerkenntnis fürs Debuggen:** Nach dem Secret-Wechsel allein
blieb es zunächst bei 401 — die Funktion liest `Deno.env.get("CRON_SECRET")`
nur einmal beim Modul-Start, ein reines Secret-Update erzwingt keinen
Neustart einer bereits "warmgehaltenen" Instanz. Erst ein manueller
Redeploy (Code-Tab → Deploy, ohne Code-Änderung) hat den neuen Wert
tatsächlich eingelesen. **Für künftige Secret-Änderungen an dieser
Funktion: immer zusätzlich neu deployen, nicht nur das Secret speichern.**

Diagnostiziert am Ende sauber isoliert über den **"Test"-Button** direkt
auf der Funktionsseite (oben rechts, neben Docs/Download) — damit lässt
sich die Funktion mit frei wählbaren Headern aufrufen, unabhängig vom
nächsten Cron-Tick. Sehr nützlich fürs schnelle Verifizieren, ohne jedes
Mal eine Minute zu warten.

### Fehler 2: `profiles.erinnerungen` — die Spalte existierte in der echten Datenbank gar nicht

Nach dem Secret-Fix kam über den Test-Button ein neuer 500er:
`{ code: "42703", message: "column profiles.erinnerungen does not exist" }`.
Per `select column_name from information_schema.columns where
table_name = 'profiles'` verifiziert: **Migration `0025_erinnerungen.sql`
wurde nie ausgeführt**, obwohl spätere UND frühere Migrationen auf
`profiles` (`category_ziele` aus 0018, `steckbrief` aus 0045, ...)
nachweislich liefen — vermutlich einfach beim manuellen Durchklicken der
~69 Migrationen eine einzelne übersprungen. Behoben durch Nachholen von
Migration 0025 (`alter table public.profiles add column if not exists
erinnerungen jsonb not null default '{}'::jsonb;`).

**Das ist der eigentlich alarmierende Teil:** Diese fehlende Spalte hat
**seit Migration 0025 (vor Wochen) niemals einen sichtbaren Fehler
erzeugt**, weil:
- Das Laden der Erinnerungen über `.select("*")` läuft
  (`useProfileData.js`) — eine fehlende Spalte erscheint da einfach als
  `undefined`, kein Fehler.
- Das Speichern (`setErinnerung()`, gleiche Datei) wirft zwar einen
  PostgREST-Fehler zurück, der wird aber nur mit
  `.then(({ error }) => error && console.error(error))` in die
  Browser-Konsole geloggt — **nirgends der Nutzerin angezeigt**, und der
  lokale React-State wird trotzdem optimistisch aktualisiert, sodass die
  UI (Pill auf "Ja", Vorlauf-Auswahl sichtbar) völlig normal aussah.

**Praktische Konsequenz:** Jede Erinnerungs-Einstellung, die je in der App
vorgenommen wurde (nicht nur heute Abend), ist wahrscheinlich **nie in der
Datenbank angekommen**. Die Nutzerin wurde gebeten, nach dem Fix alle
gewünschten Erinnerungen (Gewohnheiten, Training, Hydration, Vorab-Zeiten,
Morgenroutine/Abendroutine, Workflow, ...) noch einmal neu einzustellen —
das war ausdrücklich noch NICHT erledigt, als die Sitzung endete (sie
wollte das am nächsten Tag nachholen). **Ein künftiger Agent sollte beim
nächsten Sitzungsstart als Erstes nachfragen, ob sie das schon gemacht
hat, und falls nicht, aktiv daran erinnern**, sonst bleibt der ganze
heutige Push-Fix wirkungslos.

**Empfehlung für einen künftigen Agenten (nicht mehr umgesetzt, da die
Sitzung zu Ende ging):** Das stille Verschlucken von Speicherfehlern in
`useProfileData.js` (`setErinnerung` und vermutlich weitere `set*`-
Funktionen nach demselben "optimistic update + `.then(error =>
console.error)`"-Muster) ist ein struktureller Schwachpunkt — er hat genau
diesen Bug wochenlang unsichtbar gehalten. Es lohnt sich, mindestens für
`setErinnerung()` (und stichprobenartig ähnliche Stellen) einen sichtbaren
Fehlerhinweis zu ergänzen, statt nur in der Konsole zu loggen, damit ein
fehlgeschlagener Speichervorgang künftig auffällt, statt erst durch
zufälliges Live-Testen entdeckt zu werden.

**Status bei Sitzungsende:** Beide Fixes bestätigt (Test-Button liefert
`{"ok":true, ...}` statt Fehler). Automatischer Versand sollte ab jetzt
technisch funktionieren, **sobald die Nutzerin ihre Erinnerungen neu
eingestellt hat** (s. o.) — ein Live-Test mit echter Push-Zustellung zu
einer geplanten Uhrzeit stand bei Sitzungsende noch aus.

## ⚠️ Update 15.08.2026, nachts (Teil 4) — Aufwachzeit-Spotify, Sekunden-Ticken, konfigurierbarer Vorab-Hinweis

Direkt im Anschluss an Teil 3, noch vor 16.08. Committet: `d938e7f` (Spotify
zur Aufwachzeit) + ein weiterer Commit für die beiden Punkte unten (main +
Feature-Branch synchron).

1. **Automatischer Spotify-Start zur Aufwachzeit** (`send-due-reminders/
   index.ts`) — analog zum bestehenden Bettzeit-Block, Quelle ist
   `category_ziele.schlaf.bloecke[].aufwachzeit`, Auslöser die Playlist-
   Zuordnung über `SpotifyAnlassPicker(anlass="morgenroutine")`. Braucht ein
   aktives Spotify-Gerät (kann kein schlafendes Gerät wecken) — Kurzbefehl
   kurz vor der Aufwachzeit empfohlen. Details siehe Commit-Message.
2. **Sound-Frage der Nutzerin geklärt** (keine Code-Änderung nötig, reine
   Plattform-Grenze): Web-Push-Benachrichtigungen (`public/sw.js`,
   `showNotification()`) können auf keiner Plattform einen eigenen
   Sound/eine eigene Datei bekommen — die Notifications-API kennt kein
   `sound`-Feld, nur `silent`. Es spielt immer der System-Standardton. Das
   ist der Grund, warum es dafür keine Einstellung in der App gibt/geben
   kann — kein fehlendes Feature, sondern Browser-/OS-Limitierung.
3. **Sekunden-Ticken beim isometrischen Training** (`utils/beep.js`:
   `playTick()`, `ui/Timer.jsx`: neue Prop `tickJedeSekunde`, verdrahtet in
   `TrainingView.jsx` bei `session.art === "Isometrisches Training"`) — ein
   leiser Klick bei jeder vollen Sekunde während Halten UND Pause, zusätzlich
   zum bestehenden Start-/Ende-Piep pro Phase (der war schon da, nur ohne
   Sekunden dazwischen).
4. **Vorab-Hinweis ("Gleich dran") konfigurierbar statt fest 15 Min.**
   (Nutzerinnen-Vorgabe: "vor einem Training/einer Gewohnheit... muss ich
   einstellen können, wie viele Minuten vorher") — neue Komponente
   `ui/VorlaufFeld.jsx`, eingebunden in `MehrTab.jsx` unter jeder Kategorie
   in der "Erinnerungen"-Übersicht. Wert landet in
   `profiles.erinnerungen[kategorie].vorlaufMinuten` (bestehende jsonb-
   Spalte, **keine neue Migration nötig**). `send-due-reminders/index.ts`
   liest den Wert über `vorlaufFuer()` mit Fallback auf die alte feste
   Konstante `VORLAUF_MINUTEN = 15`.
   - "1 Tag"/"2 Tage vorher" gibt's nur bei **Training** und **Ernährung**
     (echter Wochenplan mit Wochentag) — dafür neue Funktion
     `verschobeneUhrzeitMitTag()`, die den Tages-Versatz zurückgibt, damit
     der Vorab-Check bei Vorläufen über Mitternacht hinweg den WOCHENTAG
     VON MORGEN prüft statt versehentlich heute nochmal.
   - Bei den übrigen Kategorien (Gewohnheiten, Peptide/Medikamente/
     Supplemente, Hydration/Tageslicht/Schlaf-Zeitenliste) bewusst nur
     Minuten/Stunden wählbar — die wiederholen sich täglich, ein "1 Tag
     vorher" wäre dort gleichbedeutend mit "jeden Tag zur selben Zeit" und
     würde nur eine doppelte Benachrichtigung zum selben Zeitpunkt erzeugen.
   - Wake-Time (Aufwachzeit, Punkt 1 oben) ist bewusst **nicht** Teil davon —
     lief noch nie über das `erinnerungen`-System, sondern über die
     Schlaf-Blöcke, und ein Vorlauf vorm Aufwachen ergibt naturgemäß keinen
     Sinn (Nutzerinnen-Vorgabe: "nur beim Aufwachen ist das nicht
     realistisch").

**Offen für den nächsten Agenten:** Kalenderverbindung (Nutzerin erwähnte
das nur als vage Alternative, "keine Ahnung") — nicht umgesetzt, kein
konkreter Auftrag. Falls gewünscht: eigenes Thema, vermutlich .ics-Export
oder eine echte Google/Apple-Calendar-Anbindung, deutlich größerer Umbau.

### 🔴 Nachtrag, noch später: Push-Benachrichtigungen liefen nie — VAPID-Key fehlte

Beim Testen von `send-push` (manueller Test-Button) kam durchgehend
"Failed to send a request to the Edge Function". Ursache im Log (Supabase →
Edge Functions → send-push → Errors): `Error: No key set
vapidDetails.publicKey` — die Funktion stürzt schon beim Modul-Start ab
(`webpush.setVapidDetails(...)` in Zeile 12), noch bevor sie überhaupt
antworten kann. Grund: **`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` waren als
Supabase-Secret nie gesetzt** — Custom-Secrets-Liste enthielt nur
CRON_SECRET/GEMINI_API_KEY/SPOTIFY_*/GOOGLE_TTS_API_KEY. Betrifft
`send-due-reminders` identisch (derselbe Aufruf ganz oben in der Datei) —
Web-Push ist also seit Projektbeginn nie tatsächlich verschickt worden,
nur alles DRUMHERUM (Subscriptions speichern, UI) hat funktioniert.

**Behoben:** neues VAPID-Schlüsselpaar erzeugt (`npx web-push
generate-vapid-keys`), Public Key in `src/lib/pushConfig.js` eingetragen
und committet. **Die Nutzerin muss den Private Key noch selbst als Secret
`VAPID_PRIVATE_KEY` (und den Public Key als `VAPID_PUBLIC_KEY`) unter
Supabase → Edge Functions → Secrets eintragen** — der Private Key wurde ihr
im Chat mitgeteilt, steht bewusst nirgends im Repo. Nach dem Secret-Eintrag
sollte sie testweise "Erinnerungen deaktivieren" → erneut aktivieren
(neue Subscription mit dem neuen Public Key, alte wäre mit dem alten Key
ohnehin nutzlos) und dann "Test-Erinnerung senden" probieren.

**✅ Bestätigt funktionierend** (Screenshot: echte Push-Benachrichtigung
kam an) — nachdem beide Secrets korrekt gesetzt waren (drei Fehlversuche
beim manuellen Abtippen der Base64-Werte auf dem iPad, siehe Chat: "No key
set" → "must be URL safe Base 64" → "should be 65 bytes" → hat sich beim
Abtippen jedes Mal minimal verändert; gelöst mit einer kleinen Artifact-
Seite mit Kopieren-Knopf statt manuellem Markieren/Abtippen).

**Ton-Frage der Nutzerin geklärt (zweites Mal, jetzt endgültig):** eigene
Sounds pro Erinnerung sind mit Web-Push technisch nicht möglich, auf
keiner Plattform (keine `sound`-Option in der Notification-API). Einzige
Differenzierung: das Emoji im Text (🏋️ Training, 💧 Hydration, 🌱
Gewohnheit, ⏳ Vorab-Hinweis, ❗ Nachfass, ...). Nur mit einer nativen App
(Xcode/App Store) wäre das möglich — bewusst nicht der eingeschlagene Weg.

### Nachtrag: Morgenroutine, Abendroutine, Workout-Flow bekommen jetzt auch Erinnerungen

Nutzerin-Vorgabe direkt im Anschluss: die drei fehlten noch komplett im
Erinnerungssystem. Neu in `send-due-reminders/index.ts`:
- **Morgenroutine/Abendroutine** (🌅/🌆): Quelle ist
  `routine_einstellungen.start_zeit` (der Zeitrahmen-Start, den man beim
  Einrichten der Routine unter "Routinen" pflegt) — täglich, kein
  Wochentag-Feld vorhanden, deshalb wie Gewohnheiten ohne Tages-Versatz.
- **Workout-Flow** (🔁): Quelle ist `workflow_plaene` (echter Wochenplan mit
  `wochentage[]` + `uhrzeit`, plus optionalem Gültigkeits-Zeitraum
  `gueltig_von`/`gueltig_bis` und eigenem `aktiv`-Schalter pro Plan) —
  strukturell wie Training/Ernährung behandelt, inkl. Tages-Versatz bei
  mehrtägigem Vorlauf (`verschobeneUhrzeitMitTag`).

Alle drei nur Erinnerung + Vorab-Hinweis, **kein Nachfass-Fenster** — es
gibt keine Log-Tabelle, die einen Durchlauf eindeutig einer bestimmten
geplanten Uhrzeit zuordnet (anders als bei Training/Ernährung/Dosierung).

UI: bewusst NICHT in `categorySteps.js` (das sind die 8 Onboarding-
Kategorien mit eigenen Einrichtungs-Screens) — stattdessen eigene, kleine
Liste `WEITERE_ERINNERUNGEN` direkt in `MehrTab.jsx`, hängt an dieselbe
"Erinnerungen"-Karte dran und nutzt dieselbe Vorlauf-Logik/UI
(`VorlaufFeld.jsx`) wie die bestehenden Kategorien.

**Noch nicht deployt** — auch hier muss die Nutzerin `send-due-reminders`
nochmal im Supabase-Dashboard aktualisieren (siehe oben, Code-Tab, Deploy).

## ⚠️ Update 15.08.2026, spätabends (Teil 3) — Baustein-Versionierung + tote View entfernt

Letzte Runde dieser Sitzung, Nutzerin hat ab 16.08. keinen Zugang mehr.
Committet als `f6f2677`, `7ea39c7`, `e0f191c` (main + Feature-Branch synchron):

1. **`PeptidView.jsx` gelöscht** — Karteileiche seit der Peptid/Medikamente-
   Zusammenlegung (0042), von nirgends mehr importiert. Peptide laufen
   ausschließlich über `MedikamenteView.jsx`.
2. **Versionierung der Protokoll-Bausteine** (der Punkt, der in Teil 2 noch
   bewusst verschoben wurde): neue Tabelle `baustein_versionen` (Migration
   0069, **inklusive Admin-RLS-Policy** nach dem Muster von
   `0035_admin_dashboard.sql` — ohne die würde "Version festhalten" im
   "Verwalten als"-Modus an der Datenbank scheitern, weil `auth.uid()` dabei
   weiterhin die Admin-ID ist). Hook: `useBausteinVersionen.js`
   (`versionFesthalten`, `versionLoeschen`).
   - In `MehrTab.jsx` (`AktuellesProtokoll`) hat jeder Baustein jetzt einen
     📌-Button: hält die aktuell geltenden Werte als JSON-Snapshot fest
     (`snapshotFuer()` mappt Kategorie → Felder aus den jeweiligen
     Kategorie-Hooks — bei neuen Kategorien in `BAUSTEINE_KATEGORIEN` diese
     Funktion mit erweitern), mit optionaler Notiz per `window.prompt`.
   - Sichtbar unter Archiv → Protokolle, neue Sektion
     "🗂️ Baustein-Versionen" (`ProtokollLogView.jsx`), aufklappbar je
     Eintrag, mit generischem Snapshot-Renderer (`VersionSnapshot`) statt
     eigener Formatierung pro Kategorie, sowie löschbar.
   - **Bewusste Vereinfachung**, der Nutzerin so erklärt und von ihr
     akzeptiert: manuelle Snapshots per Knopfdruck, kein automatisches
     Diffing/Versionieren bei jeder einzelnen Änderung in den
     Kategorie-Views selbst (SchlafView, TrainingView, ...) — das hätte eine
     einheitliche Versionierung über alle unterschiedlichen Datenmodelle
     hinweg gebraucht, ein größerer Umbau als in dieser Sitzung machbar.
     Falls die Nutzerin künftig "automatisch bei jeder Änderung eine Version
     anlegen" möchte, wäre der nächste Schritt, `snapshotFuer()` + einen
     Aufruf von `versionFesthalten` in die jeweiligen Kategorie-Views
     einzubauen (z. B. vor jedem `setDose`/`wochenplanHinzufuegen`/...).

**Migration 0069 muss die Nutzerin noch im Supabase-SQL-Editor ausführen**
(Wortlaut siehe Datei `supabase/migrations/0069_baustein_versionen.sql`),
sonst schlägt "Version festhalten" mit einem Datenbankfehler fehl (Tabelle
existiert dann nicht).

**Backcheck am Ende dieser Sitzung:** `npm run build` + kompletter
`npx oxlint` liefen sauber, keine neuen Warnungen/Fehler.

---

## ⚠️ Update 15.08.2026, abends (Teil 2) — Feedback-Runde nach dem ersten Update

Direkt im Anschluss an das Update weiter unten kam noch eine Feedback-Runde
der Nutzerin zur UI-Platzierung der neuen "Bausteine"-Funktion, plus der
Wunsch nach einem Backcheck vor Sitzungsende (sie hat morgen, 16.08., keinen
Zugang mehr zu Claude). Zusätzlich committet als `4b41925` und `f6f2677`
(beide bereits fast-forward-gemerged nach `main`):

1. **"Aktuelles Protokoll" (Bausteine an-/abschalten) von Archiv → Protokolle
   nach Mehr verschoben.** Begründung der Nutzerin: Archiv soll ausschließlich
   abgeschlossene/archivierte Protokolle zeigen (nur ansehen + löschen,
   nichts editierbar), das laufende Protokoll gehört dort nicht hin — jetzt
   direkt sichtbar (nicht eingeklappt) unter Mehr, oberhalb von "Sprache"
   (`MehrTab.jsx`, Komponente `AktuellesProtokoll`).
2. **"Zu deinem Peptid-Protokoll"-Button entfernt** (`PlanView.jsx`, war am
   Ende jeder Archiv-Unterseite sichtbar, führte zu `setView("medikamente")`
   — veraltete Terminologie, Nutzerin empfand es als Sackgasse/Schleife).
   `onEditProtocol`-Prop dafür auch aus `AuthenticatedApp.jsx` entfernt.
3. **`PeptidView.jsx` komplett gelöscht** — seit der Peptid/Medikamente-
   Zusammenlegung (Migration 0042) von nirgends mehr importiert, reine
   Karteileiche. Peptide werden ausschließlich noch über
   `MedikamenteView.jsx` verwaltet.
4. **Alte Test-Einträge sind jetzt löschbar:**
   `gewichtEntfernen(datum)` in `useCheckinData.js` (Check-in-Verlauf,
   ArchivTab) und `aenderungEntfernen(id)` in `useAenderungsprotokoll.js`
   (Tagesverlauf, ProtokollLogView) — vorher gab es dafür keine Möglichkeit,
   die Nutzerin hatte sich über liegengebliebenes Test-Rauschen aus früheren
   Sitzungen beschwert.

**Bewusst NICHT umgesetzt** (Nutzerin einverstanden, für eine künftige,
ausgeruhte Sitzung vorgesehen): eine echte **Versionierung** pro Baustein
— alte Konfiguration bleibt archiviert erhalten, eine neue wird beim
Bearbeiten aktiv, sichtbar im Archiv als Verlauf. Das bräuchte für jeden
Baustein-Typ (Schlaf, Training, Ernährung, …) eine eigene Historie der
tatsächlichen Einstellungen — die haben aktuell alle unterschiedliche
Datenstrukturen, kein einheitliches Modell. Eigenes, größeres
Architektur-Thema, absichtlich verschoben statt spät abends reingequetscht.

**Backcheck vor Sitzungsende (15.08., ca. 22 Uhr) durchgeführt:**
`npm run build` und `npx oxlint` (komplettes Projekt, nicht nur geänderte
Dateien) liefen sauber durch — keine neuen Warnungen/Fehler durch die
heutigen Änderungen, nur bereits vorher bestehende harmlose
`react-refresh`/`no-unused-vars`-Warnungen in unberührten Dateien. Alle
View-IDs zwischen `AuthenticatedApp.jsx` (`ARCHIV_VIEW_IDS`) und
`PlanView.jsx` (`TABS`) wurden gegengeprüft, stimmen überein. Kein
verbliebener Verweis auf "Peptid-Protokoll" im UI-Text (nur noch in
Code-Kommentaren und `i18n/dict/peptid.js`, dort harmlos ungenutzt).

**Ausstehende SQL-Migrationen zum Zeitpunkt dieses Updates:** Die Nutzerin
hat 0066 (`coach_wissen`-Einträge ADHS-Paradoxon), 0067
(`teilprotokolle`-Kategorie-Check inkl. "tageslicht") und 0068
(`teilprotokolle.aktiviert_am`) im Verlauf dieser Sitzung im Supabase-
SQL-Editor bestätigt ausgeführt zu haben. Für die Änderungen aus diesem
Teil-2-Update war keine weitere Migration nötig (nur bestehende
Spalten/Tabellen verwendet).

---

## ⚠️ Update 15.08.2026 — Hinweis zur Dokumentationslücke + heutige Änderungen

**Dieses Dokument war bei Sitzungsbeginn nur bis Migration 0049 aktuell,
tatsächlich lag der Code-Stand aber schon bei Migration 0065** (u. a.
mehrere `coach_wissen_content_library`-Migrationen, Projekte/Zeitblöcke,
Trainingsplan-Ordner, Coach-Übersicht — zwischen 14.08. und 15.08. muss also
mindestens eine weitere, hier nicht dokumentierte Sitzung stattgefunden
haben). Der Rest dieses Dokuments unterhalb dieses Updates spiegelt nur den
Stand vom 14.08. wider und ist an mehreren Stellen veraltet (z. B. Abschnitt
9, Migrationstabelle). Ein künftiger Agent sollte bei Gelegenheit den echten
Verlauf zwischen 0050 und 0065 aus der Git-Historie rekonstruieren und
dieses Dokument komplett neu schreiben, statt auf dem 14.08.-Stand
aufzusetzen.

**Was diese Sitzung (15.08.) hinzugefügt hat**, direkt auf Migration 0065
aufsetzend, committet als `9801536` auf `main` und
`claude/google-cloud-tts-api-key-yc49xp` (identisch, wie gewohnt
fast-forward-gemerged):

1. **Wissens-Basis erweitert** (Migration 0066,
   `0066_coach_wissen_adhs_paradoxon.sql`, von der Nutzerin noch im
   Supabase-Dashboard auszuführen): drei neue `coach_wissen`-Einträge
   (bereich = null, wie die "Sonderthemen" aus 0050) aus dem von der
   Nutzerin bereitgestellten Curriculum "Das ADHS-Paradoxon" — (a)
   Schutzfaktoren & Person-Environment-Fit, (b) biografische Beispiele
   (Biles, Phelps, Branson, Neeleman), (c) das zugehörige Coaching-Framework
   für Lebensrahmenbedingungen (thematische Reihenfolge, Dreischritt
   Ist-/Ziel-Zustand/erster Schritt).
2. **Formular 11 "Der Passungs-Check"** in `formulareVorlagen.js` ergänzt —
   der Lebensrahmenbedingungen-Fragebogen aus demselben Curriculum (10
   Lebensbereiche + Auswertung), technisch identisch zu den bestehenden 10
   Formularen (schema-getrieben über `AdminFormulareView.jsx`, keine
   Code-Änderung dort nötig, keine DB-Persistenz, PDF-Export). Die Nutzerin
   wollte ihn selbst als erste "Coachee" durcharbeiten.
3. **Protokolle/Hauptprotokolle endgültig löschbar** (`ArchivTab.jsx`,
   `protokollLoeschen` in `useProtocolData.js`,
   `hauptprotokollLoeschen` in `useHauptprotokollData.js`): Sicherheitsabfrage
   nennt jeweils den Namen bzw. die Peptidliste des Protokolls, löscht nur
   archivierte (nie das aktive) Protokoll/Hauptprotokoll. War vorher gar
   nicht möglich, die Nutzerin hatte sich über liegengebliebene
   Test-Protokolle beschwert.

**Wichtige Falle in dieser Sitzung, für künftige Agenten relevant:** Diese
App hat vor dem Vercel/Supabase-Umbenennungsschritt (siehe Abschnitt 2) noch
ältere, ungepflegte Branches im selben Repo (`claude/claude-md-docs-pxv4bm`,
`claude/app-uebergabeprotokoll-*`), die noch den alten Projektnamen
"MyProtocols" tragen und NICHT mit der Live-App unter `akaapp.vercel.app`
übereinstimmen — trotz identischem GitHub-"About"-Link. Eine vorherige
Instanz dieser Sitzung hatte versehentlich auf so einem veralteten Branch
gearbeitet, bevor der Fehler anhand eines App-Screenshots der Nutzerin
auffiel. **Vor jeder Änderung sicherstellen, dass tatsächlich auf `main`
bzw. dem in diesem Dokument genannten Feature-Branch gearbeitet wird**, im
Zweifel `git log -1` / Screenshot der Nutzerin gegenchecken statt sich auf
den GitHub-Default-Branch oder das Repo-"About"-Feld zu verlassen.

---

**Stand: 14.08.2026, vormittags — Branch `claude/google-cloud-tts-api-key-yc49xp`**

Ursprünglich am 13.08. komplett neu geschrieben (statt weiterer
Nachtrag-Absätze), am 14.08. weitergepflegt statt erneut komplett neu
verfasst — die Sitzung vom 13.08. wurde in einem neuen Chat fortgesetzt.
Ziel dieses Dokuments bleibt: ein neuer Agent soll die App vollständig
verstehen und genau dort weitermachen können, wo diese Sitzung endete, ohne
dass die Nutzerin irgendetwas noch einmal erklären muss. Die alte, sehr viel
detailliertere Tag-für-Tag-Historie (bis 31.07.) bleibt über die Git-Historie
dieser Datei einsehbar, falls einzelne frühere Entscheidungen im Detail
nachvollzogen werden müssen.

**Kurzstand 14.08. für den ganz schnellen Einstieg:** Die Nutzerin wollte
das Spotify-Verbindungsproblem heute bewusst pausieren (siehe offener Punkt
1) und stattdessen an Übungsbildern für den Trainings-Katalog arbeiten
(Abschnitt 5) — das ist ebenfalls kurzfristig pausiert, weil ihre
Canva-Premium-Nutzung gerade nicht funktioniert. Migration 0049 lässt sie
sich parallel gerade im Supabase-Dashboard ausführen. Bei Sitzungsbeginn
freundlich nachfragen, woran sie heute arbeiten möchte, statt automatisch
eines der beiden pausierten Themen wieder aufzugreifen.

---

## 1. Was ist AKA?

**AKA** (Claim: "Deine exekutive rechte Hand") ist eine React+Supabase-Web-App
zur Selbstverwaltung von Gesundheitsprotokollen, mit starkem Fokus auf
ADHS-Freundlichkeit (reduzierte Reizüberflutung, Notfallmodus, große
Bedienelemente, klare Sprache, kleine Schritte statt Überforderung). Läuft
heute als **PWA** ("Zum Home-Bildschirm hinzufügen") — keine native App im
App Store, siehe Abschnitt 12 für den Plan dorthin.

> ⭐ **Leitprinzip, nicht verhandelbar:** Jede Funktion muss sowohl manuell
> als auch per KI-Assistent ("Aka") nutzbar sein. Niemals ein manuelles
> Formular entfernen oder verstecken, nur weil es jetzt auch einen KI-Weg
> gibt. Der Assistenten-Orb öffnet sich nur auf Tap, nie von selbst.

**Die Nutzerin ist nicht technisch versiert** und kommuniziert überwiegend per
Spracheingabe (oft mit Tippfehlern/abgehackten Sätzen von Diktierfunktionen)
und per Screenshot vom iPad — Transkriptionsfehler sind normal und meist an
einer kleinen Verwechslung zu erkennen, nicht an grundsätzlichem
Unverständnis (Beispiele aus mehreren Sitzungen: "Acker"/"Ecker" = Aka,
"smartifer" = Spotify). Bei unklaren/abgeschnittenen Nachrichten lieber kurz
nachfragen als eine größere Änderung auf eine Vermutung zu bauen. Sie hat auf
dem iPad öfter Schwierigkeiten mit Kopieren/Einfügen (aus Dateien UND beim
manuellen Abtippen langer Werte wie API-Keys) — bei kurzen, exakten Werten
(Base64-Schlüssel o. Ä.) hilft eine kleine Artifact-Seite mit
"Kopieren"-Knopf zuverlässiger als "markieren und kopieren" oder Abtippen.

### Geschäftsmodell-Pivot (seit 13.08., zentral für alles Weitere)

Die App wird **nicht mehr primär von jeder Person komplett selbst
eingerichtet**. Die Nutzerin selbst tritt als **Coach/Admin** auf und richtet
die meisten Bereiche für ihre **Coachees** (Klient:innen) über den
bestehenden "Verwalten als"-Modus stellvertretend ein. Coachees durchlaufen
nur noch ein reduziertes Onboarding (Profil + Ziel + kurzer Steckbrief) und
nutzen die App zur reinen Ausführung (Routinen, Logging) — kein KI-Assistent,
kein "+"-Button, stattdessen eine Nachrichtenfunktion an die Coachin. Details
in Abschnitt 6.

Parallel dazu baut die Nutzerin ihre eigene Coaching-Praxis auf
(12-Wochen-Selbsttrainingsprogramm "AKA ADHS-Coaching-Praxisakademie", erste
Pilotgespräche mit realen Menschen geplant) und füttert währenddessen **Aka**
(den KI-Assistenten) parallel mit dem coaching-relevanten Wissen, das sie
sich selbst erarbeitet — mit dem ausdrücklichen Ziel, dass Aka langfristig
selbstständig Coachings mitbetreuen kann. **Der Coachee darf nie erfahren,
dass die Coachin im Hintergrund mit Aka arbeitet.**

---

## 2. Tech-Stack

- **Frontend:** React 19 + Vite 8. Seit Teil 100 (14.09.) gibt es eine
  TypeScript-Infrastruktur (`tsconfig.json`, `npm run typecheck` =
  `tsc --noEmit`) — bestehende Dateien bleiben `.jsx`/`.js`, neue/stark
  überarbeitete Module werden nach und nach als `.ts`/`.tsx` angelegt
  (bisher u. a. `src/lib/queryCache.ts`, `src/utils/routing.ts`,
  `src/utils/gnadentag.ts`). Kein Zwang, alles auf einmal zu migrieren.
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security, Edge
  Functions in Deno/TypeScript).
- **Hosting:** Vercel. **Aktuelle, bestätigte Live-Adresse:
  `https://akaapp.vercel.app`** (eine ältere Notiz nannte noch
  `myprotocolsapp.vercel.app` — Stand vor der Umbenennung zu "AKA"; im
  Zweifel bei der Nutzerin nachfragen). Automatischer Rebuild bei jedem Push
  auf `main`.
- **KI (Chat-Assistent "Aka"):** Google Gemini (`gemini-3.6-flash`, Vorsicht:
  Gemini-Modellnamen veralten schnell), angebunden über Supabase-Edge-
  Function-Proxy (`gemini-chat`). Ollama/Groq sind im Code vorbereitet
  (`groq-chat`-Function existiert), aber nicht als aktiver Standard-Provider
  geschaltet.
- **KI (weitere, unabhängig vom Chat-Assistenten):** Anthropic Claude, direkt
  über zwei eigene Edge Functions — `lexikon` (Lexikon-Fragen beantworten)
  und `blutwerte-scan` (Laborwerte per Foto auslesen, Bild kommt nie roh vom
  Client, sondern als Storage-Pfad im privaten `photos`-Bucket).
- **Sprachausgabe:** Google Cloud Text-to-Speech (WaveNet, Stimme
  `de-DE-Wavenet-B`), mit automatischem Rückfall auf die Browser-eigene Web
  Speech API, falls die Cloud-Funktion mal nicht erreichbar ist.
- **Musik:** Spotify Web API (OAuth + Wiedergabe-Steuerung, Abschnitt 8).
- **Web Push:** VAPID-Protokoll über die `web-push`-npm-Bibliothek
  (Deno-Edge-Function-seitig) + die Browser-eigene Notifications-/Push-API
  (client-seitig, `public/sw.js`). Funktioniert erst seit heute Abend
  tatsächlich (Abschnitt 7) — vorher fehlte das Server-Secret komplett.
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk`.

---

## 3. Architektur

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus
│   ├── TageslichtView.jsx, HydrationView.jsx, NutritionView.jsx,
│   │   TrainingView.jsx, GewohnheitenView.jsx, SupplementeView.jsx,
│   │   MedikamenteView.jsx, SchlafView.jsx    8 Protokoll-Bereiche
│   ├── RoutineTabView.jsx         Morgen-/Abendroutine (eigene Reiter)
│   ├── LexikonView.jsx            Freies Nachschlagen über Claude
│   ├── admin/                     AdminDashboardView, AdminWissenView,
│   │                               AdminFormulareView, AdminUebungsBilderView,
│   │                               AdminCoachUebersichtView
│   ├── onboarding/                Onboarding-Flow (siehe Abschnitt 6)
│   └── plan/                      PlaeneView (Tab-Hub), MehrTab (Coach-Name,
│                                   Sprache, Erinnerungen, Spotify, Konto,
│                                   Bausteine/Protokoll-Verwaltung)
├── ui/
│   ├── primitives.jsx             Shell, Card, PrimaryButton, Pill, CheckRow
│   ├── BereichColorContext.jsx    Bereichseigene Akzentfarbe je Screen
│   ├── KiChat.jsx                 Wiederverwendbare Chat-Oberfläche
│   ├── SpotifyAnlassPicker.jsx    Playlist-Zuordnung je Anlass
│   ├── RoutineAblauf.jsx          Geführter Morgen-/Abendroutine-Screen
│   ├── Timer.jsx                  Stoppuhr/Countdown/Intervall (Training,
│   │                               isometrisches Halten mit Sekunden-Ticken)
│   ├── WorkflowTimer.jsx          Pomodoro-artiger Arbeits-/Pause-Timer
│   ├── VorlaufFeld.jsx            Vorab-Hinweis-Auswahl je Erinnerungs-
│   │                               Kategorie (Minuten/Stunden/Tage)
│   └── WochenplanEditor.jsx       Training/Ernährung-Wochenplan
├── services/
│   ├── aiProviders.js             Low-Level Ollama/Groq/Gemini
│   └── aiService.js               Domänenfunktionen, Formular-Extraktoren
├── data/                          Ein use*.js-Hook pro Datenbereich (u. a.
│                                   useRoutinen.js, useWorkflowData.js,
│                                   useBausteinVersionen.js,
│                                   usePushNotifications.js)
├── context/
│   ├── AppDataContext.jsx         Zentrale Datenverwaltung, kombiniert alle Hooks
│   ├── AdminContext.jsx           "Verwalten als"-Zustand (proband)
│   └── AuthContext.jsx            Supabase-Session
└── lib/
    └── pushConfig.js               VAPID Public Key fürs Web-Push-Abo
public/
└── sw.js                          Service Worker — zeigt eingehende Pushes an
supabase/
├── migrations/                    0001–0069, siehe Abschnitt 9
└── functions/
    ├── gemini-chat/                Sicherer Gemini-Proxy — AKTIV
    ├── groq-chat/                  Groq-Proxy, vorbereitet, nicht aktiv geschaltet
    ├── text-to-speech/             Google Cloud TTS-Proxy — AKTIV
    ├── lexikon/                    Claude-gestütztes Lexikon — AKTIV
    ├── blutwerte-scan/             Laborwerte aus Foto per Claude Vision — AKTIV
    ├── spotify-auth-callback/      OAuth-Code-Austausch
    ├── spotify-play/               Wiedergabe starten (Login ODER Auto-Play-Token)
    ├── send-push/                  Manueller Push-Test-Button (Nutzer-JWT) — AKTIV
    ├── send-due-reminders/         Cron-Job für alle Push-Erinnerungen — AKTIV
    └── admin-create-proband/       Neues Coachee-Konto anlegen
```

### Design-System — bitte lesen, bevor irgendwo eine neue Farbe/Komponente entsteht

**Kein CSS-Framework** (kein Tailwind, kein Bootstrap, kein Material UI).
Durchgehend Inline-`style={{}}`-Objekte gegen zentrale Farb-Tokens aus
`src/ui/theme.js`:

| Token | Wert | Verwendung |
|---|---|---|
| `accent` | `#6366F1` (Indigo) | Marken-Akzent, Standardfarbe außerhalb bereichsfarbiger Screens |
| `accentDark` | `#1F605B` | dunklere Akzentvariante (Mikrofon-Icons, Coach-Elemente — deckt sich mit `KATEGORIE_META.gewohnheit.text`) |
| `accentSoft` | `#DCF3F1` | heller Akzent-Hintergrund (deckt sich mit `KATEGORIE_META.gewohnheit.bg`) |
| `success` | `#0E7C66` | Erfolg/Erledigt |
| `danger` | `#C24545` | Fehler, Löschen, aktive Mikrofon-Aufnahme |
| `warn` / `blue` | s. `theme.js` | Status-Badges (`StatusBadge`: geplant/verpasst) |
| `textMain` | `#15181A` | Haupttext |
| `textMuted` | `#6B7178` | Nebentext, Platzhalter, Zwischenergebnis-Vorschau bei Diktat |
| `bg` / `card` | `#FFFFFF` | Hintergrund/Karten |
| `cardBorder` | s. `theme.js` | Standard-Rahmenfarbe aller Eingabefelder/Karten |

Hilfsfunktionen `aufhellen()`/`hexZuRgba()` erzeugen Verlaufs-/Glow-Farbtöne
für `PrimaryButton` (135°-Zweifarben-Verlauf + farbiger Schatten +
Press-Animation) zur Laufzeit aus jeder Bereichsfarbe — **neue Farbtöne
also nicht von Hand hex-kodieren, sondern über diese Funktionen aus einem
bestehenden Token ableiten.**

**Wiederverwendbare Bauteile, bevor etwas Neues gebaut wird — alle in
`src/ui/primitives.jsx`:** `Shell` (Seiten-Rahmen inkl. `bereich`-Prop für
automatische Bereichsfarbe), `Card`, `Label`, `Pill` (Auswahl-Chip),
`PrimaryButton`, `CheckRow`, `Stepper` (Onboarding-Fortschrittspunkte),
`StatusBadge`, `TextInput`/`TextArea` (inkl. optionalem `diktierbar`-Prop
für die Mikrofon-Diktierfunktion, Teil 102 — Standard ist AUS, siehe
Abschnitt 13). Weitere häufig gebrauchte, NICHT in primitives.jsx
liegende, aber genauso wiederzuverwendende Bausteine: `MikrofonIcon`/
`StopIcon` (`ui/MikrofonIcons.jsx`, gezeichnete SVG-Icons statt Emoji für
jede Sprach-Bedienung app-weit), `useEscapeSchliesst`/`useDiktat`
(`ui/*.js`-Hooks für Modal-Verhalten bzw. Diktat), `TimeWheelField`,
`NumberWheelField` (Zeit-/Zahleingabe-Räder).

**Faustregel für jede neue Sitzung:** Vor einer neuen Farbe/einem neuen
Button-/Karten-Stil immer zuerst `theme.js` + `primitives.jsx`
durchsuchen — mit an Sicherheit grenzender Wahrscheinlichkeit gibt es das
gesuchte Bauteil oder den gesuchten Farbton schon, auch wenn der Name auf
den ersten Blick nicht offensichtlich ist.

**Bereichsfarben** (`KATEGORIE_META` in `src/utils/dayItems.js` —
`{bg, text, dot}` je Kategorie, gesteuert über `BereichColorContext.jsx` via
`<Shell bereich="training">`):

| Bereich | dot-Farbe |
|---|---|
| Medikamente (`hormon`, inkl. Peptide) | `#8B5CB0` (Lila) |
| Supplemente | `#B8863D` (Gold) |
| Ernährung (`mahlzeit`) | `#C17A54` (Terrakotta) |
| Training | `#CC5145` (Rot) |
| Gewohnheiten (`gewohnheit`) | `#3E8E8A` (Teal) |
| Hydration | `#4A93B8` (Blau) |
| Tageslicht | `#D9A62E` (Gelb) |
| Schlaf | `#5B5FA6` (Indigo) |
| Notfallmodus | `#C24545` (Rot) |
| Morgenroutine (eigene, nicht in `KATEGORIE_META`) | `#E08A3E` |
| Abendroutine (eigene, nicht in `KATEGORIE_META`) | `#4E6690` |

Logo: `public/logo-mark.png` (Gehirn-Symbol), App-Icons unter `public/icons/`.

---

## 4. KI-Assistent "Aka"

Persona: **Sidekick, ausdrücklich kein "Coach"** (das Wort ist komplett aus
der sichtbaren App entfernt). Standardname `"Aka"`, individuell umbenennbar
(`coachStorage.js`). Zwei Ebenen: im Hintergrund unaufdringlich wie ein guter
Butler, im Gespräch präsent und motivierend, nie bevormundend, erzeugt kein
schlechtes Gewissen.

**"Background Brain"** — bei jeder Chat-Anfrage automatisch mitgeschickt:
- `src/wissen/**/*.md` — statische Wissensbasis (braucht Deploy für Änderungen)
- `coach_wissen`-Tabelle (DB-gestützt, live editierbar unter Admin → "📚
  Wissens-Basis verwalten", kein Deploy nötig) — mittlerweile mit weit über
  16 Einträgen aus der Coaching-Praxisakademie der Nutzerin bestückt, u. a.
  auch das ADHS-Paradoxon-Curriculum (siehe Abschnitt 6)
- `admin_notizen` (Hintergrundwissen ODER zugestellte Nachricht je Proband)
- Aggregierte Trackingdaten der letzten 2-4 Wochen
- Erkannte Auffälligkeiten (Trainingslücken, Korrelationen zwischen Bereichen)
- Namen aller gespeicherten Spotify-Playlists (Aka kann sie per
  `[[SPOTIFY_PLAY:<Name>]]`-Marker im Gespräch selbst starten)

**Sicherheitsmodell:** Der Assistent kann niemals eigenständig etwas
speichern — immer erst chatten, dann tippt die Person explizit auf
"Übernehmen", erst dann läuft die ganz normale App-Funktion.

**Coach-geführtes Onboarding:** zwei Modi (Frage-für-Frage /
Frei-erzählen), plus Coach-Begleitung bei Laborwerten und allen
Kategorie-Schritten — nur im Admin-/Verwalten-als-Modus (siehe Abschnitt 6).

**Separates Lexikon** (`LexikonView.jsx`, eigene Edge Function `lexikon`,
Claude statt Gemini): freies Nachschlagen von Begriffen unabhängig vom
eigentlichen Coaching-Gespräch, kein Zugriff auf persönliche Trackingdaten.

---

## 5. Die 8 Protokoll-Bereiche + Routinen + Training + Workout-Flow

Schlaf, Hydration, Ernährung, Training, Gewohnheiten, Supplemente,
Medikamente (inkl. Peptide, seit 13.08. datentechnisch zusammengelegt — kein
eigener Reiter mehr), Tageslicht. Darüber liegt ein **Hauptprotokoll** (Name,
Startdatum), unter dem alle Kategorien als **Teilprotokolle** laufen
(`hauptprotokolle`/`teilprotokolle`-Tabellen). Jeder Baustein einzeln
an-/abschaltbar ohne den kompletten Onboarding-Assistenten neu zu
durchlaufen (`MehrTab.jsx`), und seit dem 15.08. **versionierbar**: über
einen 📌-Button hält man die aktuell geltenden Werte eines Bausteins als
Snapshot fest (`baustein_versionen`-Tabelle, `useBausteinVersionen.js`),
sichtbar unter Archiv → Protokolle. Bewusst manuell per Knopfdruck, kein
automatisches Diffing bei jeder Änderung.

**Morgen-/Abendroutine** (eigene Reiter im "Alle Pläne"-Bereich, zusätzlich
zu den Tagesplan-Karten): frei benannte Schritte mit geplanter Dauer,
geführter Ablauf-Screen mit Countdown + Vorwarnton (`RoutineAblauf.jsx`),
editierbarer Zeitrahmen (`routine_einstellungen`) mit Überlappungs-Erkennung
(andere geplante Punkte, die in den Zeitrahmen fallen, werden zur Übernahme
als Routine-Schritt vorgeschlagen). Haben seit heute (15.08.) eine eigene
Push-Erinnerung zum Zeitrahmen-Start (Abschnitt 7). **Inhaltliche
ADHS-Vorgaben für eine "richtige" Morgen-/Abendroutine sind bewusst noch
nicht vorgegeben** — die Nutzerin wollte das erst nach eigener Recherche
gemeinsam festlegen; noch nicht nachgezogen.

**Training:** Live-Workout-Screen mit Satz-/Pausen-Timer, Wochenplan mit
Mehrfachauswahl von Wochentagen/Trainingsarten, großer Übungskatalog
(`KRAFTUEBUNGEN`/`BODYWEIGHT_UEBUNGEN` in `constants.js`, ~200 Einträge).
**Isometrisches Training** hat einen eigenen Intervall-Timer-Modus
(Halten/Pause, z. B. 5 Sek. halten/4 Sek. Pause) mit Vorbereitungs-Countdown,
Start-/Ende-Piep pro Phase UND (seit heute) einem leisen Sekunden-Ticken
während Halten/Pause (`Timer.jsx`, `tickJedeSekunde`-Prop, `playTick()` in
`utils/beep.js`).

**Workout-Flow** (`workflow_plaene`/`workflow_presets`, seit 15.08.): frei
konfigurierbare Arbeits-/Pause-Intervall-Presets (Pomodoro-artig,
`WorkflowTimer.jsx`), die sich — wie Training/Ernährung — festen Wochentagen
und Uhrzeiten zuordnen lassen, wahlweise mit einem Gültigkeits-Zeitraum
(ab Datum X, oder zwischen X und Y, oder unbegrenzt). Haben seit heute
ebenfalls eine eigene Push-Erinnerung (Abschnitt 7).

### Übungsbilder — Infrastruktur fertig, Inhalte fehlen noch

Im Live-Trainings-Screen kann zu jeder Übung ein Bild angezeigt werden:
öffentliche Tabelle `uebungs_bilder` (name eindeutig, bild_url) + Storage-
Bucket `uebungsbilder`. Admin-Ansicht `AdminUebungsBilderView.jsx` ("🖼️
Übungsbilder verwalten") erlaubt Hochladen eines Bildes pro Übung;
`TrainingView.jsx`s `LiveWorkout` zeigt es automatisch an, sobald eines
existiert. **Die eigentlichen Bilder fehlen weiterhin** — sollten von der
Nutzerin in Canva erstellt werden (einheitlicher Schwarz-Weiß-
Illustrationsstil, dafür existiert eine Prompt-Liste für alle ~200 Übungen,
nicht im Repo), war zuletzt wegen Problemen mit ihrer Canva-Premium-Nutzung
pausiert — Stand bei Sitzungsstart erfragen.

---

## 6. Coach/Coachee-Modell

`istAdminModus = proband !== null || isAdmin` — diese Formel entscheidet
überall (KiChat.jsx, OnboardingFlow.jsx, AuthenticatedApp.jsx, HomeView.jsx),
ob gerade eine echte Admin-Sitzung (eigenes Konto ODER "Verwalten als")
läuft oder eine restriktive Coachee-Sitzung.

- **Onboarding für Coachees reduziert:** nur Profil (Name/Alter/
  Körperwerte) + Ziel + kurzer **Steckbrief** (`profiles.steckbrief` jsonb):
  Supplemente ja/nein, Sport-Erfahrung, Sport-Menge. Laborwerte/Routinen/die
  8 Kategorie-Schritte entfallen komplett für Coachees, bleiben im
  Admin-/Verwalten-als-Modus unverändert vollständig.
- **KI-Assistent (Aka) und "+"-Button ("Neues Protokoll") sind für Coachees
  komplett ausgeblendet** — zentrales Gate in `KiChat.jsx`
  (`if (!istAdminModus) return null`) bzw. in `AuthenticatedApp.jsx`s
  `zeigeFab`.
- **Nachrichtenfunktion Coachee → Coach** ersetzt den KI-Assistenten für
  Coachees: Tabelle `coachee_nachrichten`, Karte auf `HomeView.jsx`
  ("Nachricht an deinen Coach"), Admin-Dashboard hat ein "Nachrichten"-Panel
  pro Proband (Lesen/als-gelesen-Markieren). `AdminCoachUebersichtView.jsx`
  zeigt der Coachin zusätzlich Trainingsplan + Aktivität je Coachee.
- **Wissens-Basis-Verwaltung ("Aka lernt mit"):** DB-gestützte Tabelle
  `coach_wissen` (`bereich` nullable, `titel`, `text`) — Admin trägt
  jederzeit direkt aus der App neues Wissen ein (`AdminWissenView.jsx`,
  Knopf im Admin-Dashboard "📚 Wissens-Basis verwalten"). Fließt in JEDEN
  Gesprächskontext von Aka ein (gefiltert nach `bereich`, `null`/leer = gilt
  überall). Inhaltlich mittlerweile deutlich gewachsen: die ursprünglichen
  16 destillierten Einträge aus den drei Praxisakademie-Dokumenten (Rolle &
  Grenzen, aktives Zuhören/GROW, ADHS-Psychoedukation, Red-Flag-
  Krisenprotokoll, Experiment-Methodik, ...) PLUS eine umfangreiche
  "Content-Library" (mehrere Migrationen, grob nach Themenblöcken 01-40,
  41-80, 60-80, 81-100, 101-122 nummeriert) PLUS Spezialthemen wie
  Sexualität/Intimität, isometrisches Training und das ADHS-Paradoxon
  (Schutzfaktoren, Person-Environment-Fit, biografische Beispiele wie Biles/
  Phelps/Branson/Neeleman, zugehöriges Coaching-Framework für
  Lebensrahmenbedingungen). Bewusst NICHT übernommen: die reine
  Trainingslogistik der Nutzerin selbst (Rollenspiel-Anleitungen,
  Prüfungsfragen, Formularvorlagen).
- **Bewusst NICHT umgesetzt:** automatisches Lernen aus individuellen
  Coachee-Protokolldaten (Datenschutz-/Einwilligungsfrage — Daten einer
  Person würden anderen Coachees zugutekommen). Vorschlag für später: ein
  von der Admin selbst geschriebenes "Fazit" bei Protokoll-Abschluss statt
  roher Coachee-Daten — noch nicht gebaut.
- **Digitale Coaching-Vorlagen** (`AdminFormulareView.jsx`, erreichbar über
  Admin-Dashboard "📋 Coaching-Vorlagen"): alle Formulare aus der
  Praxisakademie (Erstkontakt, Intake, Routinen-Profil, Sitzungsprotokoll
  GROW, Wochenplan, Red-Flag-Checkliste, Selbstreflexion, Beobachterbogen,
  Einwilligung, Feedbackbogen, Passungs-Check/Lebensrahmenbedingungen) digital
  ausfüllbar + als PDF exportierbar. Schema-getrieben
  (`src/data/formulareVorlagen.js`, generischer Feld-Renderer), PDF-Export
  über dieselbe `exportElementAsPdf()`-Pipeline wie die Wochenübersicht.
  Rein für die Coachin selbst, komplett getrennt von App-Daten der Coachees
  und von `coach_wissen`. **Keine Datenbank-Persistenz** — Werte bleiben nur
  im Browser-Zustand, solange die Ansicht offen ist; PDF-Export ist die Art,
  sie dauerhaft zu sichern.

---

## 7. Erinnerungs-/Push-System

**Technisch jetzt vollständig repariert (16.08., nachts), aber die
Nutzerin muss ihre Erinnerungen noch neu einstellen** — drei
unabhängige, alle stille (keine Fehlermeldung sichtbar) Fehlerquellen
nacheinander gefunden, siehe Teil 4 + Teil 5 der Update-Chronik oben für
die volle Diagnose-Geschichte:
1. `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` waren nie als Supabase-Secret
   gesetzt → `send-push`/`send-due-reminders` stürzten bei jedem Aufruf
   sofort ab. Neues Schlüsselpaar erzeugt, behoben.
2. `CRON_SECRET` im Cron-Job-SQL (Migration 0032) und im Supabase-Secret
   stimmten nicht überein → automatischer Versand lief seit jeher gegen
   401. Beide Seiten synchron auf einen neuen Wert gesetzt, behoben.
3. Migration `0025_erinnerungs.sql` (Spalte `profiles.erinnerungen`)
   wurde nie ausgeführt → jede je vorgenommene Erinnerungs-Einstellung
   verpuffte unsichtbar (Laden über `select("*")`, Speichern nur mit
   `console.error` statt sichtbarem Fehler, siehe `useProfileData.js`
   `setErinnerung()`). Migration nachgeholt, behoben.

**Offener Punkt, wichtig für den nächsten Sitzungsstart:** Weil Fehler 3
lange unbemerkt blieb, sind alle bisherigen Erinnerungs-Einstellungen der
Nutzerin nie in der Datenbank angekommen. Sie wollte sie am 16.08. selbst
neu einstellen (Gewohnheiten, Training, Hydration, Vorab-Zeiten,
Morgenroutine/Abendroutine, Workflow, ...) — bei Sitzungsende noch nicht
erledigt. Bitte nachfragen, ob das inzwischen geschehen ist, und ob ein
Live-Test (echte Push-Zustellung zu einer geplanten Uhrzeit) erfolgreich
war.

**`send-due-reminders`** (pg_cron, einmal pro Minute) deckt inzwischen
**12 Kategorien** ab, je mit bis zu drei Erinnerungs-Arten:
1. Erinnerung zur geplanten Uhrzeit selbst.
2. **Vorab-Hinweis** ("Gleich dran") — Zeitspanne **pro Kategorie frei
   wählbar** (`ui/VorlaufFeld.jsx`, `MehrTab.jsx`): Aus, 5/10/15/30 Min.,
   1-2 Std., bei Training/Ernährung/Workout-Flow zusätzlich 1-2 Tage (nur
   dort sinnvoll, weil die anderen Kategorien täglich wiederkehren — "1 Tag
   vorher" wäre dort gleichbedeutend mit "jeden Tag zur selben Zeit").
   Gespeichert in der bestehenden `profiles.erinnerungen`-jsonb-Spalte
   (`{aktiv, vorlaufMinuten}` je Kategorie), Rückfallwert 15 Min.
3. **Nachfass-Hinweis** 10 Min. danach, falls noch nicht bestätigt — nur bei
   Kategorien mit einer eindeutigen "erledigt"-Log-Tabelle (Peptide/
   Medikamente/Supplemente, Gewohnheiten, Training, Ernährung). Fehlt bei
   Hydration/Tageslicht/Schlaf-Zeitenliste sowie bei den drei neuesten
   Kategorien unten.

Die 12 Kategorien: Hydration, Tageslicht, Schlaf (eigene Zeiten-Liste),
Peptide, Medikamente, Supplemente (Dosierungsschema mit Intervall-Logik),
Gewohnheiten, Training, Ernährung (Wochenplan), sowie **neu seit heute**:
Morgenroutine, Abendroutine (Zeitrahmen-Start aus `routine_einstellungen`)
und Workout-Flow (`workflow_plaene`, inkl. Wochentag + optionalem
Gültigkeits-Zeitraum). Mehrere gleichzeitig fällige Erinnerungen werden zu
einer einzigen Push-Nachricht gebündelt (`merken()`/`faellig`-Map).

**Eigene Sounds pro Erinnerung sind technisch NICHT möglich** — das ist
keine Lücke in dieser App, sondern eine harte Grenze von Web-Push: keine
Browser-Engine (Safari/Chrome/Firefox) bietet eine `sound`-Option in der
Notification-API, es spielt immer der System-Standardton. Unterscheidbar
sind Erinnerungen nur über das Emoji im Text (🏋️ Training, 💧 Hydration,
🌱 Gewohnheit, 🌅 Morgenroutine, 🌆 Abendroutine, 🔁 Workout-Flow, ⏳ Vorab,
❗ Nachfass, ...). Eigene Sounds gingen nur mit einer nativen App — siehe
Abschnitt 12.

**Automatischer Spotify-Start** läuft ebenfalls über `send-due-reminders`,
unabhängig vom Push-System, aber im selben Cron-Tick: zur Bettzeit (1 Min.
danach) und zur Aufwachzeit (exakt), jeweils nur falls über
`SpotifyAnlassPicker` eine Playlist zugeordnet wurde — siehe Abschnitt 8.

---

## 8. Spotify-Integration

### Was fertig gebaut ist

- OAuth-Verbindung (`spotify-auth-callback`), Wiedergabe-Steuerung
  (`spotify-play`), mehrere frei benannte Playlists
  (`spotify_playlists`-Tabelle), Aka kann im Gespräch selbst eine passende
  Playlist starten (`[[SPOTIFY_PLAY:<Name>]]`-Marker).
- **Auto-Play-Schlüssel** für externe Automationen (iOS-Kurzbefehl) ohne
  normale Anmeldung — `spotify_verbindung.auto_play_token`, Aufruf per
  `?token=...` an `spotify-play`.
- **Playlist-Zuordnung je Anlass** (`spotify_anlass_playlists`:
  user_id, anlass, playlist_id, Komponente `SpotifyAnlassPicker.jsx`):
  Morgenroutine, Abendroutine, Training, ein allgemeiner
  "gewohnheiten"-Anlass (manuell per "Jetzt testen" ausgelöst) — UND, seit
  15.08., **automatischer serverseitiger Start ohne offene App**: zur
  Bettzeit (`anlass="schlaf"`, SchlafView.jsx, 1 Min. nach der konfigurierten
  Schlafenszeit) und zur Aufwachzeit (`anlass="morgenroutine"`, exakt zur
  Zeit aus `category_ziele.schlaf.bloecke[].aufwachzeit`). Läuft über
  `send-due-reminders` mit dem gespeicherten Refresh-Token — braucht ein
  aktives Spotify-Gerät (kann kein schlafendes Gerät wecken), ein
  Kurzbefehl, der Spotify kurz vorher einmal öffnet, ist empfehlenswert.

### 🔴 Zuletzt offen (Stand 14.08.) — Status heute nicht erneut geprüft

**Symptom (14.08.):** Beim Versuch, Spotify über "Mehr → Musik → Mit
Spotify verbinden" neu zu koppeln, landete die Nutzerin nach der Anmeldung
immer wieder auf der AKA-Seite, ohne dass die App "verbunden" anzeigte.
Vollständig ausgeschlossen wurden: Redirect-URI, `VITE_SPOTIFY_CLIENT_ID`,
Freigabeliste im Spotify-Dashboard, der Navigations-Mechanismus, der
gesamte Code-Pfad (`spotify-auth-callback` mehrfach zeilenweise geprüft),
sowie eine neu autorisierte App-Verbindung. Diagnose damals: die Schleife
trat innerhalb des verschachtelten "Mit Apple anmelden"-Schritts auf
Spotifys eigener Seite auf, vermutlich eine iOS/WebKit-Restriktion bei
verschachtelten Drittanbieter-Logins — **außerhalb dessen, was im Code
dieser App behoben werden kann**.

**Aber:** die Nutzerin hat seither erfolgreich Spotify-Wiedergabe genutzt
(automatischer Start zur Bettzeit/Aufwachzeit wurde heute getestet), es ist
also unklar, ob das Verbindungsproblem in der Zwischenzeit von selbst
verschwunden ist (z. B. durch ein iOS-Update) oder ob die bestehende
Verbindung nur nie erneuert werden musste. **Bei Bedarf zuerst nachfragen,
ob eine NEUE Verbindung überhaupt noch nötig ist**, bevor das alte Problem
erneut angegangen wird — möglicherweise erledigt sich das von selbst.

---

## 9. Migrationen

**Stand 15.08., spätabends: 0001–0069, alle als deployt/bestätigt
dokumentiert.** Diese Tabelle nennt nur die neuesten/für einen neuen Agenten
wichtigsten — für die vollständige Historie: `ls supabase/migrations/`.

| # | Datei | Inhalt |
|---|---|---|
| 0061 | `training_wochenplan_intervall.sql` | Intervall-Felder für isometrisches Training im Wochenplan |
| 0062 | `workflow_presets_und_plaene.sql` | Workout-Flow: Presets + Zeitplanung |
| 0063 | `trainingsplaene_ordner_und_ziel.sql` | Ordnerstruktur/Ziel für Trainingspläne |
| 0064 | `training_wochenplan_name.sql` | Freier Name je Wochenplan-Eintrag |
| 0065 | `coach_uebersicht.sql` | Grundlage für `AdminCoachUebersichtView.jsx` |
| 0066 | `coach_wissen_adhs_paradoxon.sql` | ADHS-Paradoxon-Wissenseinträge |
| 0067 | `teilprotokolle_tageslicht.sql` | Tageslicht als Teilprotokoll-Kategorie |
| 0068 | `teilprotokolle_aktiviert_am.sql` | Aktivierungs-Zeitpunkt je Baustein |
| 0069 | `baustein_versionen.sql` | Versionierung der Protokoll-Bausteine (📌-Snapshots) |
| 0070 | `quests.sql` | Neue Tabellen `quests` + `quest_fortschritt` fürs Quests-Feature (Teil 6/7) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |
| 0071 | `routine_tabellen_nachholen.sql` | Holt `routine_schritte`/`routine_durchlaeufe`/`routine_einstellungen` nach, die trotz 0041/0044 nie in der echten DB existierten (Teil 8) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |
| 0072 | `quest_rangliste.sql` | Erste Version der Quest-Rangliste-Funktion (Teil 9) — **durch 0073 ersetzt, muss NICHT separat ausgeführt werden** |
| 0073 | `teams.sql` | Teams (`teams`, `profiles.team_id`), `gleiches_team()`, team-bewusste `quest_rangliste()`, `team_nachrichten` + RLS, `admin_liste_probanden()` um `team_id` erweitert (Teil 9) | ✅ Erfolgreich ausgeführt (Teil 10) |
| 0074 | `coachee_einladung.sql` | `profiles.onboarding_modus` ("kurz"/"lang"), `admin_liste_probanden()` um `onboarding_modus` erweitert (Teil 12) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |

**Kein separates VAPID-Migrations-Skript nötig** für den Push-Fix heute —
das war ein reines Supabase-Secret, keine Schema-Änderung.

**⚠️ Migration 0025 (`erinnerungen`-Spalte auf `profiles`) fehlte trotz
"0001–0069 alle deployt"-Status** — erst am 16.08. nachts bemerkt und
nachgeholt (siehe Abschnitt 7 / Teil 5 der Chronik). Falls beim nächsten
Sitzungsstart Zweifel an anderen "als deployt markierten" Migrationen
bestehen: im Zweifel per `select column_name from information_schema.
columns where table_name = '<tabelle>'` direkt gegenchecken, statt sich
allein auf frühere Notizen in diesem Dokument zu verlassen — das
Silent-Failure-Verhalten der App (Abschnitt 7) hätte eine fehlende Spalte
sonst nie auffallen lassen.

---

## 10. Offene Punkte

| # | Thema | Status |
|---|---|---|
| 0 | Nutzerin muss alle Erinnerungs-Einstellungen neu vornehmen (waren wegen fehlender DB-Spalte nie gespeichert, s. Abschnitt 7) + Live-Test der Push-Zustellung | 🔴 Wichtigster offener Punkt — bei nächstem Sitzungsstart zuerst danach fragen |
| 1 | Spotify-"Verbinden" hing zuletzt (14.08.) in einer Anmelde-Schleife | 🟡 Unklar, ob noch aktuell — seither erfolgreiche Wiedergabe beobachtet, siehe Abschnitt 8. Vor erneutem Debugging erst prüfen, ob überhaupt noch nötig |
| 2 | Übungsbilder: Inhalte (Canva-Bilder) fehlen noch | 🟡 Pausiert — Code/Infrastruktur fertig (Abschnitt 5), Canva-Premium-Problem der Nutzerin zuletzt ungelöst |
| 3 | Gemini-429-Kontingentproblem (nur 20 Freianfragen/Tag) | 🔴 Offen seit mehreren Sitzungen, Stand erneut erfragen |
| 4 | Inhaltliche ADHS-Vorgaben für Morgen-/Abendroutine | Zurückgestellt, Nutzerin wollte selbst recherchieren |
| 5 | "Fazit"-Feld bei Protokoll-Abschluss statt automatischem Lernen aus Coachee-Daten | Nur als Vorschlag im Raum |
| 6 | Per-Gewohnheit-Playlist-Zuordnung | Bewusste Scope-Entscheidung |
| 7 | Groq als aktiver Provider | Zurückgestellt, Code vorbereitet |
| 8 | Sprachauswahl (DE/EN/TR) auf den Assistenten selbst ausweiten | Nur UI-Texte mehrsprachig |
| 9 | Sprechgeschwindigkeit der Cloud-Stimme einstellbar | Google-Cloud-TTS unterstützt `speakingRate`, noch nicht angebunden |
| 10 | Nachfass-Hinweis für Morgenroutine/Abendroutine/Workout-Flow | Fehlt bewusst — keine passende "erledigt"-Log-Tabelle, siehe Abschnitt 7 |
| 11 | Kalenderverbindung (Google/Apple Calendar oder .ics-Export) | Nur als vage Idee erwähnt, kein konkreter Auftrag |
| 12 | Native App (Xcode/App Store) | Gewünschtes Fernziel der Nutzerin — siehe Abschnitt 12 |
| 13 | `useProfileData.js`-Speicherfehler nur in der Browser-Konsole geloggt, nie sichtbar (Muster: optimistic update + `.then(error => console.error(error))`) | ✅ `setErinnerung()` erledigt (Teil 62) — gibt jetzt `{ok, error}` zurück, alle 6 Aufrufer zeigen einen Fehlschlag sichtbar an. Die übrigen `set*`-Funktionen in `useProfileData.js` (setPersonal, toggleDatenteilung, setCategoryZiel, setSteckbrief, setBelohnungPufferMin, toggleMesswert) folgen weiterhin nur dem stillen Konsolen-Muster — bewusst nicht mit angefasst, da nicht explizit angefragt |
| 14 | Migration `0070_quests.sql` ausführen | ✅ Erledigt (13.09., Teil 63 — erst mit "relation already exists" gescheitert, nach Reparatur der Datei von der Nutzerin erfolgreich ausgeführt) |
| 15 | Quests-Rangliste zwischen Coachees | ✅ Umgesetzt (Teil 9, team-bewusst) — Vergleich beim normalen Protokoll (nicht nur Quests) weiterhin offen, siehe #21 |
| 16 | Quests: satzgenaue Bestätigung bei Trainings-Quests (statt manueller Gesamt-Meldung) | Aus der Nutzerinnen-Vorgabe genannt, in V1 bewusst vereinfacht auf eine manuelle Fortschritts-/Abschlussmeldung, siehe Teil 6 |
| 17 | Migration `0071_routine_tabellen_nachholen.sql` ausführen | ✅ Erledigt (13.09., Teil 63) — Ursache des Routinen-Bugs aus Teil 7 bestätigt (Teil 8): `routine_schritte` fehlte komplett in der DB |
| 18 | Rundum-Check aller Migrationen gegen die echte Datenbank | Empfohlen (Teil 8) — zum zweiten Mal eine "als deployt" notierte Migration, die nie lief (nach `erinnerungen` in Teil 5 jetzt `routine_*`-Tabellen). Einmaliger Abgleich statt weiter einzeln nachzujagen |
| 19 | Migration `0073_teams.sql` ausführen | ✅ Erledigt (Teil 10, nach den drei dort beschriebenen Fixes erfolgreich gelaufen) |
| 20 | Edge Function `send-team-push` anlegen und deployen | ✅ Erledigt (Teil 10) — noch nicht live end-to-end getestet (Nachricht senden + tatsächliche Push-Zustellung an ein zweites Gerät), sollte bei Gelegenheit einmal verifiziert werden |
| 21 | Team-vs-Team-Gesamtwertung + Vergleich beim normalen Protokoll (nicht nur Quests) | Von der Nutzerin genannt ("diese gesamte Bewertung ... im Gruppenkontext"), in Teil 9 bewusst noch nicht umgesetzt — Team-Gesamtwertung ist ein kleinerer nächster Schritt (neue Aggregations-Funktion), Protokoll-Vergleich braucht weiterhin eine Klärungsrunde, WAS genau als faire Einzelzahl über alle Kategorien hinweg gelten soll |
| 22 | Migration `0074_coachee_einladung.sql` ausführen | ✅ Erledigt (Nutzerin hat den Text am 16.08. direkt aus dem Chat in die SQL-Konsole eingefügt und ausgeführt) |
| 23 | Edge Function `admin-invite-proband` anlegen und deployen | ✅ Erledigt (16.08., Text direkt aus dem Chat eingefügt) |
| 24 | Harte serverseitige Sperre gegen Selbstregistrierung (nicht nur UI-Entfernung) | 🟡 Von der Nutzerin gewünscht (16.08., Begründung: Piraterie-/Neugier-Schutz, sobald sie öffentlich über die App spricht, z. B. YouTube), aber für heute vertagt — kein akutes Risiko, das "Registrieren"-Tab-Entfernen deckt den praktischen Fall schon ab. Beim Versuch, "Enable email signups" zu finden, stellte sich heraus: im Email-Provider-Unterfenster (Sign In / Providers → Email) gibt es nur "Enable email provider" — **den NICHT ausschalten, das kappt die komplette E-Mail-Anmeldung inkl. der eigenen**. Vermutet, aber noch nicht bestätigt: ein separater "Allow new users to sign up"-Schalter unter einem "User Signups"-Abschnitt ganz oben auf der Hauptseite "Sign In / Providers" (vor der Anbieter-Liste, außerhalb des Email-Unterfensters) — das als Erstes prüfen, bevor an eine datenbankseitige Lösung gedacht wird. Falls der Schalter dort tatsächlich existiert: ausschalten, sollte die Selbstregistrierung serverseitig komplett blockieren, ohne Login/Invite/Verwalten-Flows zu berühren. Falls nicht auffindbar: mit der Nutzerin klären, ob eine eigene (aufwendigere, aus dem Sandbox nicht testbare) DB-seitige Absicherung gewünscht ist. |
| 25 | Supabase → Authentication → URL Configuration → Site URL prüfen | Muss auf die echte App-URL zeigen, sonst landet der Link in der Einladungs-Mail (Teil 12) ins Leere |
| 26 | Einladungs-Ablauf einmal komplett end-to-end testen (echte Test-E-Mail) | Aus dem Sandbox nicht möglich (kein Netzwerkzugriff auf Supabase), sollte die Nutzerin einmal selbst durchklicken, bevor sie es für echte Coachees nutzt |
| 27 | Edge Function `lexikon` neu deployen | ✅ Erledigt (16.08., Text direkt aus dem Chat eingefügt) — der kuratierte Kontext aus der Wissensbasis (Peptide/Supplemente/Schlafgesundheit) ist damit live |
| 28 | Wissensbasis-Größe (`src/wissen/`) — gezielte Auswahl statt "alles an jede Anfrage anhängen" | 🟡 Nach Teil 15 kein theoretisches Later-Thema mehr, sondern realer Kosten-/Latenz-Faktor bei jedem KiChat-Aufruf (9 umfangreiche Themen-Dateien plus Ernährung). Für das Lexikon bereits gezielte Auswahl pro Kategorie umgesetzt (Teil 15) — Vorbild für eine ähnliche Lösung bei KiChat |
| 29 | Edge Function `lexikon` erneut neu deployen | 🔴 Teil 17: `modus: "akut"`-Feld für den neuen Akutmodus-Knopf hinzugefügt — ohne erneutes manuelles Redeploy bleibt der Knopf ohne Wirkung (kein Absturz, nur keine Antwort) |
| 30 | Akutmodus-Feature im Browser end-to-end testen | 🟡 Teil 17/18: aus dem Sandbox nicht möglich (kein Netzwerkzugriff auf Supabase/kein Login), nur per Code-Review geprüft — die Nutzerin sollte einmal selbst durchklicken (Layout, Symptom antippen, Freitext, Akut-Übung markieren + starten, "An Coach schicken"), bevor sie sich darauf verlässt |
| 31 | Migration `0075_gewohnheit_akut_favorit.sql` ausführen | ✅ Erledigt (13.09., Teil 63) |
| 32 | Migration `0076_atemuebungen.sql` ausführen | ✅ Erledigt (13.09., Teil 63 — erst mit "relation atemuebungen already exists" gescheitert, nach Reparatur der Datei von der Nutzerin erfolgreich ausgeführt) |
| 33 | Akutmodus: volle Verzweigung zu Supplementen/Medikamenten als Option | 🟡 Von der Nutzerin skizziert (Teil 19: "auch Supplemente könnten helfen, auch Medikationen"), bewusst noch nicht umgesetzt — würde eigenes Datenmodell brauchen (Einnahme aus Akutmodus heraus auslösen + als "wegen Akutmodus-Ereignis" kennzeichnen), separater Ausbauschritt |
| 34 | Atemübungen-Feature im Browser end-to-end testen | 🟡 Teil 19: aus dem Sandbox nicht möglich (kein Netzwerkzugriff auf Supabase/kein Login) — Timer-Logik nur per Code-Review geprüft. Besonders prüfen: Ton bei Phasenwechseln, Ticken in der Vorbereitung, sauberer Abschluss nach vollständigem Ausatmen, Akutmodus-Einbindung |

---

## 11. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Manuell UND per KI, nie nur eins von beidem** — bei jeder Änderung
  prüfen, ob das manuelle Formular noch genauso vollständig funktioniert.
- **Die Nutzerin ist nicht technisch versiert**, spricht oft per
  Spracherkennung. Bei Screenshots genau hinschauen — oft eine kleine
  Verwechslung, kein grundsätzliches Unverständnis. Bei unklaren/
  abgeschnittenen Nachrichten kurz nachfragen statt zu raten.
- **Diese Sandbox hat keinen direkten Netzwerkzugriff auf das Supabase-
  Dashboard.** Migrationen/Edge-Function-Änderungen landen im Code, müssen
  aber von der Nutzerin manuell über das Supabase-Dashboard ausgeführt
  werden (SQL-Editor bzw. Edge-Functions-Code-Tab + Deploy). SQL/Code am
  besten **sowohl als Datei als auch als reinen Text im Chat**
  bereitstellen — je nachdem, was auf dem iPad gerade zuverlässiger
  funktioniert (variiert). Bei kurzen, exakten Werten (Secrets/Keys) hilft
  eine kleine selbst gebaute Kopieren-Knopf-Seite (Artifact) mehr als
  Chat-Text, weil manuelles Markieren/Abtippen auf dem Tablet leicht
  minimal verfälscht (siehe Push-Fix-Historie oben — drei fehlgeschlagene
  Versuche, jedes Mal ein anderer Tippfehler).
- **Live-Verifikation nur über Screenshots der Nutzerin möglich** (inkl.
  Supabase-Dashboard-Logs, die sie bei Bedarf durchklicken kann) — bei
  hartnäckigen Bugs lohnt sich systematisches, schrittweises
  Ausschlussverfahren mit ihrer Hilfe, aber auch die Bereitschaft, ehrlich
  zu sagen "das liegt außerhalb des Codes", statt endlos weiterzusuchen,
  wenn die Evidenz das nahelegt (Beispiel: Spotify-Loop, Abschnitt 8).
- **Git-Workflow:** i. d. R. auf einem Feature-Branch arbeiten, dann
  fast-forward nach `main` mergen und pushen (Vercel deployt automatisch bei
  Push auf `main`). Vor jedem Commit, der JS/JSX/TS berührt: `npm run
  build` + `npx oxlint <geänderte Dateien>` — beides muss sauber
  durchlaufen. Supabase Edge Functions werden NICHT automatisch deployt
  (kein CI/CD dafür eingerichtet) — jede Änderung an einer
  `supabase/functions/*/index.ts` muss die Nutzerin zusätzlich manuell im
  Dashboard nachziehen.
- **Neue Migrationsdateien** fortlaufend nummeriert ablegen (aktuell zuletzt
  `0069_...`), reine Datenmigrationen (kein Schema-Change) genauso wie
  Schema-Änderungen.
- **Dieses Dokument aktuell halten** — bei viel Veränderung lieber die
  betroffenen Abschnitte 1-13 direkt überarbeiten, statt nur oben in der
  Update-Chronik neue Absätze aufzustapeln (die Chronik ganz oben in diesem
  Dokument bleibt trotzdem wertvoll als Detail-Historie einzelner
  Sitzungen — beides ergänzt sich).

---

## 12. Zukunftsplan: Eine echte native App über Xcode

Die Nutzerin möchte AKA langfristig als **echte native iOS-App** (App
Store), nicht mehr nur als PWA. Das ist ein bewusst separates, größeres
Vorhaben — hier der Fahrplan für einen künftigen Agenten (oder Entwickler
mit Xcode-Zugang), plus was sich dadurch konkret verbessert.

### Warum überhaupt — was eine native App tatsächlich löst

- **Eigene Benachrichtigungs-Sounds pro Kategorie** (die in dieser Sitzung
  mehrfach gewünschte, mit Web-Push technisch unmögliche Funktion) — native
  Apps können über APNs (Apple Push Notification service) den `sound`-Wert
  im Push-Payload auf eine im App-Bundle mitgelieferte Audiodatei setzen,
  pro Benachrichtigungstyp unterschiedlich.
- **Zuverlässigere Hintergrund-Aktionen** (z. B. der Spotify-Auto-Play zur
  Aufwachzeit, der aktuell ein "aktives Gerät" voraussetzt) — native Apps
  haben mehr Hintergrund-Ausführungsrechte als eine im Browser laufende PWA.
- **App-Store-Präsenz** — leichter auffindbar/vertrauenswürdiger für
  Coachees als "zum Home-Bildschirm hinzufügen".
- **Echte Vibrations-/Haptik-Muster**, native UI-Komponenten (Datepicker,
  Kamera-Zugriff für Laborwert-Scans ohne Browser-Umweg), Widgets,
  potenziell Apple Watch-Anbindung für Trainings-Timer.

### Realistischer Weg — KEIN kompletter Neubau nötig

Der komplette bestehende React-Code muss **nicht** verworfen werden. Zwei
sinnvolle Wege, absteigend nach Aufwand:

1. **Capacitor (empfohlen als erster Schritt).** Verpackt die bestehende
   React-App fast unverändert in eine native iOS-Hülle (WebView + native
   Brücken-APIs). Vorteil: der komplette bestehende Code (alle Views, Hooks,
   die Supabase-Anbindung) bleibt exakt so bestehen — nur der Zugriff auf
   native Features (Push über APNs statt Web-Push, Kamera, Haptik) läuft
   über zusätzliche Capacitor-Plugins statt Browser-APIs. Braucht einen Mac
   mit Xcode zum Bauen/Signieren/Einreichen, aber keine Neuentwicklung der
   App selbst. Realistischster erster Schritt für dieses Projekt.
2. **Echte native Neuentwicklung (SwiftUI) oder React Native.** Deutlich
   größerer Aufwand — jede View, jeder Hook müsste in Swift/React-Native neu
   gebaut werden. Nur sinnvoll, falls Capacitor an echte Grenzen stößt
   (z. B. Performance bei sehr komplexen Screens) oder die Nutzerin explizit
   eine "richtige" native Optik will, die sich mit einer WebView nicht
   erreichen lässt.

**Empfehlung für den Einstieg:** Capacitor. Das liefert die von der
Nutzerin konkret gewünschten Verbesserungen (App-Store, eigene Sounds über
APNs) mit dem kleinsten Umbau, ohne den bestehenden, funktionierenden
Code wegzuwerfen.

### Was dafür konkret nötig ist (grober Fahrplan, keiner der Schritte ist begonnen)

1. **Ein Mac mit Xcode** — zwingende Voraussetzung, iOS-Apps lassen sich
   nicht ohne Apple-Toolchain bauen/signieren (das war der ganze Grund,
   warum diese Sitzung bewusst den PWA-Weg gegangen ist).
2. **Apple Developer Account** (99 $/Jahr) für Code-Signing und
   App-Store-Einreichung.
3. `npx cap init` + `npx cap add ios` im bestehenden Repo, `vite build`
   Output als WebView-Inhalt einbinden.
4. **Push-Migration von Web-Push (VAPID) auf APNs**: eigenes Zertifikat/Key
   bei Apple, `send-due-reminders`/`send-push` müssten für iOS-Clients
   APNs statt `web-push` ansprechen (Payload-Format ist unterschiedlich) —
   realistisch als Zweigleisigkeit (Web-Push für evtl. weiterhin
   existierende Browser-Nutzer, APNs für die native App) oder als klarer
   Schnitt, falls die PWA komplett abgelöst wird.
5. Sound-Dateien pro Erinnerungs-Kategorie festlegen/produzieren (aktuell
   nur unterschiedliche Emojis im Text, siehe Abschnitt 7) und im
   App-Bundle mitliefern.
6. App-Icons/Screenshots/Store-Listing vorbereiten, TestFlight-Beta vor dem
   eigentlichen Store-Release.
7. Datenschutzerklärung/App-Store-Datenschutzangaben (Supabase-Datenhaltung,
   Gesundheitsdaten-Kategorie beachten — Apple prüft das bei
   Gesundheits-Apps genauer als bei anderen Kategorien).

**Nicht vergessen:** Das Coach/Coachee-Geschäftsmodell (Abschnitt 6) bleibt
davon unberührt — eine native App ändert nichts an der Architektur
(Supabase-Backend, Admin-/Verwalten-als-Modus), nur an der Hülle und den
nativen Zusatzmöglichkeiten.

---

## 13. Test-Infrastruktur (Vitest + Playwright) — Stand 14.09.2026

Zwei getrennte Ebenen, unterschiedliches Werkzeug, unterschiedlicher Zweck.
**Vor jedem Commit beide laufen lassen** — siehe Abschnitt 11.

### 13.1 Unit-Tests (Vitest) — aktuell 98 Tests in 12 Dateien

- Config: `vitest.config.js` (separat von `vite.config.js`, damit
  `vite dev`/`vite build` unberührt bleiben), `environment: "jsdom"`,
  Setup-Datei `src/setupTests.js`.
- Befehl: `npm test` (= `vitest run`).
- Liegen direkt neben der getesteten Datei (`xyz.js` → `xyz.test.js`,
  bzw. `.test.jsx`/`.test.ts` je nach Ziel). Zwei Muster im Projekt:
  1. **Reine Logik/Utilities** (`utils/dates.test.js`,
     `utils/kalorien.test.js`, `utils/schedule.test.js`,
     `utils/gnadentag.test.ts`, `utils/routing.test.ts`,
     `utils/belohnungZeit.test.js`, `utils/ausgefallenSweep.test.js`,
     `utils/errungenschaften.test.js`, `lib/queryCache.test.ts`) — direkte
     Funktionsaufrufe mit `expect()`, kein Rendering.
  2. **Hooks/Komponenten mit Nebeneffekten** (`ui/ErrorBoundary.test.jsx`,
     `lib/useCachedQuery.test.jsx`, `ui/useDiktat.test.jsx`, neu Teil 102)
     — `render()`/`screen`/`fireEvent`/`act` aus
     `@testing-library/react`, externe Abhängigkeiten (Supabase, KI,
     Web-Speech-API) per `vi.mock(...)` ersetzt. Beispielmuster siehe
     `ui/useDiktat.test.jsx`: eine winzige Test-Wrapper-Komponente rendert
     den Hook, `vi.mock("../utils/speech")` ersetzt die echte
     Spracherkennung durch steuerbare Mock-Callbacks.
- **Wichtige Grenze, ehrlich benannt (gilt strukturell für alle
  Unit-Tests hier):** es läuft nie eine echte Supabase-Verbindung mit —
  jeder Datenzugriff ist gemockt. Unit-Tests prüfen also *Logik*, nicht
  *echte Backend-Integration*. Für Letzteres siehe die Einschränkung zu
  Teil 98 oben in der Lese-Reihenfolge-Box.

### 13.2 End-to-End-Tests (Playwright) — aktuell 34 Tests in 5 Dateien

- Config: `playwright.config.js`. Befehl: `npx playwright test`
  (einzelne Datei: `npx playwright test e2e/onboarding.spec.js`).
- Laufen gegen einen echten gerenderten Browser (Chromium), aber gegen
  einen **eigenen Test-Harness** (`e2e/harness/index.html` +
  `TestApp.jsx` + `mockAppData.js`), NICHT gegen die echte
  `main.jsx`/echtes Supabase — es gibt keinen Netzwerkzugriff auf das
  echte Backend aus dieser Umgebung heraus. `TestApp.jsx` injiziert einen
  gemockten `AppDataContext`-Wert direkt, ohne echten Login. Genau diese
  Grenze ist der Grund für die Teil-98-Einschränkung oben.
- Dateien nach Bereich aufgeteilt: `smoke.spec.js` (Grundnavigation,
  Routing, AkutModusGlobal, Tagebuch-Escape), `onboarding.spec.js`
  (kompletter Onboarding-Durchlauf + Diktierfunktion, Teil 102),
  `admin.spec.js`, `archiv.spec.js`, `plaene.spec.js` (rendert jeden
  Reiter/jede Unteransicht einmal durch, prüft auf Konsolenfehler).
- **Gemeinsames Muster** (`e2e/helpers.js`, `sammleKonsolenfehler(page)`):
  jeder Test sammelt `pageerror`- und `console.error`-Ereignisse während
  des Durchlaufs und prüft am Ende `expect(fehler).toEqual([])` —
  Netzwerkrauschen der Sandbox (`net::ERR_*`) wird dabei bewusst
  ignoriert (kein App-Bug), alles andere zählt als Fehlschlag.
- **Externe Browser-APIs mocken:** `page.addInitScript(...)` VOR
  `page.goto(...)` — läuft im Browser-Kontext, nicht in Node, kann also
  keine Variablen von außerhalb der übergebenen Funktion sehen.
  Referenz-Beispiel: der `FakeSpeechRecognition`-Mock in
  `onboarding.spec.js` (Teil 102) simuliert `SpeechRecognition`, inkl.
  `page.route("**/functions/v1/**", ...)`, um zusätzlich zu beweisen,
  dass dabei keine Edge Function (KI) aufgerufen wird.
- **Bewusste Grenze** (siehe Kommentar in `onboarding.spec.js`): der
  komplette Onboarding-Test befüllt nur Pflichtfelder, prüft nicht jede
  der 9 Kategorien inhaltlich im Detail — das wäre extrem
  änderungsanfällig für kaum Mehrwert. Inhaltliche Prüfung einzelner
  Kategorien passiert stattdessen in `plaene.spec.js` gegen bereits
  eingerichtete Mock-Daten.

### 13.3 Vor jedem Commit — vollständige Kommandokette

```
npm run build && npx oxlint <geänderte Dateien> && npm run typecheck && npm test && npx playwright test
```

Alle fünf Schritte müssen sauber durchlaufen, bevor committet/gepusht
wird (siehe auch Abschnitt 11). `oxlint` ohne Argumente prüft das ganze
Projekt und listet dabei auch einige länger bestehende, unkritische
Warnungen (`react(only-export-components)`, betrifft Context-Dateien mit
zusätzlichen Exports) — das sind keine neuen Fehler, nur bei tatsächlich
neuen `error`-Meldungen (nicht `warning`) eingreifen.
