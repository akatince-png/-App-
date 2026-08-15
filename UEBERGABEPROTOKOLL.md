# 📋 ÜBERGABEPROTOKOLL: AKA App

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
Bedienelemente, klare Sprache, kleine Schritte statt Überforderung).

> ⭐ **Leitprinzip, nicht verhandelbar:** Jede Funktion muss sowohl manuell
> als auch per KI-Assistent ("Aka") nutzbar sein. Niemals ein manuelles
> Formular entfernen oder verstecken, nur weil es jetzt auch einen KI-Weg
> gibt. Der Assistenten-Orb öffnet sich nur auf Tap, nie von selbst.

**Die Nutzerin ist nicht technisch versiert** und kommuniziert überwiegend per
Spracheingabe — Transkriptionsfehler sind normal und meist an einer kleinen
Verwechslung zu erkennen, nicht an grundsätzlichem Unverständnis (Beispiele
aus dieser Sitzung: "Acker"/"Ecker" = Aka, "smartifer" = Spotify). Bei
unklaren/abgeschnittenen Nachrichten lieber kurz nachfragen als eine größere
Änderung auf eine Vermutung zu bauen — das hat sich in dieser Sitzung mehrfach
bewährt.

### Geschäftsmodell-Pivot (13.08., zentral für alles Weitere)

Die App wird **nicht mehr primär von jeder Person komplett selbst
eingerichtet**. Die Nutzerin selbst tritt als **Coach/Admin** auf und richtet
die meisten Bereiche für ihre **Coachees** (Klient:innen) über den
bestehenden "Verwalten als"-Modus stellvertretend ein. Coachees durchlaufen
nur noch ein reduziertes Onboarding (Profil + Ziel + kurzer Steckbrief) und
nutzen die App zur reinen Ausführung (Routinen, Logging) — kein KI-Assistent,
kein "+"-Button, stattdessen eine Nachrichtenfunktion an die Coachin. Details
in Abschnitt 6.

Parallel dazu baut die Nutzerin gerade ihre eigene Coaching-Praxis auf
(12-Wochen-Selbsttrainingsprogramm "AKA ADHS-Coaching-Praxisakademie", erste
Pilotgespräche mit realen Menschen geplant) und will währenddessen **Aka**
(den KI-Assistenten) parallel mit dem coaching-relevanten Wissen füttern, das
sie sich selbst erarbeitet — mit dem ausdrücklichen Ziel, dass Aka langfristig
selbstständig Coachings mitbetreuen kann. **Der Coachee darf nie erfahren,
dass die Coachin im Hintergrund mit Aka arbeitet.**

---

## 2. Tech-Stack

- **Frontend:** React 19 + Vite 8, reines JavaScript (kein TypeScript).
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security, Edge
  Functions in Deno/TypeScript).
- **Hosting:** Vercel. **Aktuelle, bestätigte Live-Adresse:
  `https://akaapp.vercel.app`** (eine ältere Notiz in einer früheren Version
  dieses Dokuments nannte noch `myprotocolsapp.vercel.app` — das war der Stand
  vor der Umbenennung zu "AKA"; falls in einer neuen Sitzung Zweifel an der
  aktuellen Domain bestehen, sicherheitshalber bei der Nutzerin nachfragen).
  Automatischer Rebuild bei jedem Push auf `main`.
- **KI:** Google Gemini (`gemini-3.6-flash`, Vorsicht: Gemini-Modellnamen
  veralten schnell), angebunden über Supabase-Edge-Function-Proxy
  (`gemini-chat`). Ollama/Groq sind im Code vorbereitet, aber nicht aktiv.
- **Sprachausgabe:** Google Cloud Text-to-Speech (WaveNet, Stimme
  `de-DE-Wavenet-B`), mit automatischem Rückfall auf die Browser-eigene Web
  Speech API, falls die Cloud-Funktion mal nicht erreichbar ist.
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
│   ├── admin/                     AdminDashboardView, AdminWissenView,
│   │                               AdminFormulareView
│   ├── onboarding/                Onboarding-Flow (siehe Abschnitt 6)
│   └── plan/                      PlaeneView (Tab-Hub), MehrTab (Coach-Name,
│                                   Sprache, Erinnerungen, Spotify, Konto)
├── ui/
│   ├── primitives.jsx             Shell, Card, PrimaryButton, Pill, CheckRow
│   ├── BereichColorContext.jsx    Bereichseigene Akzentfarbe je Screen
│   ├── KiChat.jsx                 Wiederverwendbare Chat-Oberfläche
│   ├── SpotifyAnlassPicker.jsx    Playlist-Zuordnung je Anlass
│   ├── RoutineAblauf.jsx          Geführter Morgen-/Abendroutine-Screen
├── services/
│   ├── aiProviders.js             Low-Level Ollama/Groq/Gemini
│   └── aiService.js               Domänenfunktionen, Formular-Extraktoren
├── data/                          Ein use*.js-Hook pro Datenbereich
├── context/
│   ├── AppDataContext.jsx         Zentrale Datenverwaltung, kombiniert alle Hooks
│   ├── AdminContext.jsx           "Verwalten als"-Zustand (proband)
│   └── AuthContext.jsx            Supabase-Session
supabase/
├── migrations/                    0001–0048, siehe Abschnitt 9
└── functions/
    ├── gemini-chat/                Sicherer Gemini-Proxy — AKTIV
    ├── text-to-speech/             Google Cloud TTS-Proxy — AKTIV
    ├── spotify-auth-callback/      OAuth-Code-Austausch
    ├── spotify-play/               Wiedergabe starten (Login ODER Auto-Play-Token)
    ├── send-due-reminders/         Cron-Job für Push-Erinnerungen
    └── admin-create-proband/       Neues Coachee-Konto anlegen
```

### Design-System

Plain CSS + Tokens aus `src/ui/theme.js`:
`accent = "#6366F1"` (Indigo, Marken-Akzent), `success = "#0E7C66"`,
`danger = "#C24545"`, `textMain = "#15181A"`, `textMuted = "#6B7178"`,
`bg = card = "#FFFFFF"`. Hilfsfunktionen `aufhellen()`/`hexZuRgba()` erzeugen
Verlaufs-/Glow-Farbtöne für `PrimaryButton` (135°-Zweifarben-Verlauf +
farbiger Schatten + Press-Animation) zur Laufzeit aus jeder Bereichsfarbe.

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
  Wissens-Basis verwalten", kein Deploy nötig) — seit heute mit 16 Einträgen
  aus der Coaching-Praxisakademie der Nutzerin vorbefüllt (siehe Abschnitt 6)
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

---

## 5. Die 8 Protokoll-Bereiche + Routinen + Training

Schlaf, Hydration, Ernährung, Training, Gewohnheiten, Supplemente,
Medikamente (inkl. Peptide, seit 13.08. datentechnisch zusammengelegt — kein
eigener Reiter mehr), Tageslicht. Darüber liegt ein **Hauptprotokoll** (Name,
Startdatum), unter dem alle Kategorien als **Teilprotokolle** laufen
(`hauptprotokolle`/`teilprotokolle`-Tabellen, Migration 0027/0028).

**Morgen-/Abendroutine** (seit 13.08. eigene Reiter im "Alle Pläne"-Bereich,
zusätzlich zu den Tagesplan-Karten): frei benannte Schritte mit geplanter
Dauer, geführter Ablauf-Screen mit Countdown + Vorwarnton
(`RoutineAblauf.jsx`), editierbarer Zeitrahmen (`routine_einstellungen`,
Migration 0044) mit Überlappungs-Erkennung (andere geplante Punkte, die in
den Zeitrahmen fallen, werden zur Übernahme als Routine-Schritt
vorgeschlagen). **Inhaltliche ADHS-Vorgaben für eine "richtige" Morgen-/
Abendroutine sind bewusst noch nicht vorgegeben** — die Nutzerin wollte das
erst nach eigener Recherche gemeinsam festlegen; noch nicht nachgezogen.

**Training:** Live-Workout-Screen mit Satz-/Pausen-Timer, Wochenplan mit
Mehrfachauswahl von Wochentagen/Trainingsarten, großer Übungskatalog
(`KRAFTUEBUNGEN`/`BODYWEIGHT_UEBUNGEN` in `constants.js`, ~200 Einträge).

### 🆕 Übungsbilder (14.08., neu — Bild-Beschaffung aktuell pausiert)

Infrastruktur ist fertig gebaut, damit im Live-Trainings-Screen zu jeder
Übung ein Bild angezeigt wird: neue **öffentliche** (nicht private) Tabelle
`uebungs_bilder` (name eindeutig, bild_url) + Storage-Bucket
`uebungsbilder` (Migration `0049_uebungsbilder.sql` — **von der Nutzerin
gerade zum Ausführen im Supabase-Dashboard, Status beim nächsten
Sitzungsstart erfragen**). Admin-Ansicht `AdminUebungsBilderView.jsx`
("🖼️ Übungsbilder verwalten" im Admin-Dashboard) erlaubt Hochladen eines
Bildes pro Übung; `TrainingView.jsx`s `LiveWorkout` zeigt es automatisch an,
sobald eines existiert — reine Anzeige-Logik, kein weiterer Code nötig.

**Bewusst noch OHNE Inhalte:** Die eigentlichen Bilder sollten von der
Nutzerin in **Canva** erstellt werden (einheitlicher Schwarz-Weiß-Illustrations-
Stil), dafür wurde ihr eine vollständige Prompt-Liste für alle ~200 Übungen
geschickt (als Datei, nicht im Repo — grob nach Muskelgruppen gruppiert,
mit festem Stil-Template oben). **Pausiert, weil die Canva-Premium-Nutzung
der Nutzerin gerade nicht funktioniert** — sowohl die Bild-Erstellung als
auch das Hochladen sind deshalb aufgeschoben, kein technisches Problem in
dieser App. Bei Bedarf die Prompt-Liste neu erzeugen (war eine reine
Text-Antwort, keine Datei im Repo, ggf. aus dem Chat-Verlauf rekonstruieren
oder neu schreiben).

---

## 6. Coach/Coachee-Modell (Kernthema dieser Sitzung)

`istAdminModus = proband !== null || isAdmin` — diese Formel entscheidet
überall (KiChat.jsx, OnboardingFlow.jsx, AuthenticatedApp.jsx, HomeView.jsx),
ob gerade eine echte Admin-Sitzung (eigenes Konto ODER "Verwalten als")
läuft oder eine restriktive Coachee-Sitzung.

- **Onboarding für Coachees reduziert:** nur Profil (Name/Alter/
  Körperwerte) + Ziel + kurzer **Steckbrief** (`profiles.steckbrief` jsonb,
  Migration 0045): Supplemente ja/nein, Sport-Erfahrung, Sport-Menge.
  Laborwerte/Routinen/die 8 Kategorie-Schritte entfallen komplett für
  Coachees, bleiben im Admin-/Verwalten-als-Modus unverändert vollständig.
- **KI-Assistent (Aka) und "+"-Button ("Neues Protokoll") sind für Coachees
  komplett ausgeblendet** — zentrales Gate in `KiChat.jsx`
  (`if (!istAdminModus) return null`) bzw. in `AuthenticatedApp.jsx`s
  `zeigeFab`.
- **Nachrichtenfunktion Coachee → Coach** ersetzt den KI-Assistenten für
  Coachees: Tabelle `coachee_nachrichten` (Migration 0045), Karte auf
  `HomeView.jsx` ("Nachricht an deinen Coach"), Admin-Dashboard hat ein
  "Nachrichten"-Panel pro Proband (Lesen/als-gelesen-Markieren).
- **Wissens-Basis-Verwaltung ("Aka lernt mit"):** DB-gestützte Tabelle
  `coach_wissen` (Migration 0046: `bereich` nullable, `titel`, `text`) —
  Admin trägt jederzeit direkt aus der App neues Wissen ein
  (`AdminWissenView.jsx`, Knopf im Admin-Dashboard "📚 Wissens-Basis
  verwalten"). Fließt in JEDEN Gesprächskontext von Aka ein (gefiltert nach
  `bereich`, `null`/leer = gilt überall). **Migration 0047** hat die
  Basis heute mit 16 destillierten Einträgen aus den drei von der Nutzerin
  hochgeladenen Praxisakademie-Dokumenten befüllt: 8 allgemeine
  (Rolle & Grenzen, aktives Zuhören/GROW, ADHS-Psychoedukation, Umgang mit
  Scham/Widerstand, Medikamente/Supplemente-Grenzen, Red-Flag-Krisenprotokoll,
  Experiment-Methodik, Sitzungsstruktur) + 8 protokollspezifische (je einer
  pro Lebensbereich: Wissenschafts-Hintergrund, Gesprächsskript, typische
  Probleme, Coaching-Fragen, gestufte Mini-Experimente, Red-Flags). Bewusst
  NICHT übernommen: die reine Trainingslogistik der Nutzerin selbst
  (Rollenspiel-Anleitungen, Prüfungsfragen, Formularvorlagen).
- **Bewusst NICHT umgesetzt:** automatisches Lernen aus individuellen
  Coachee-Protokolldaten (Datenschutz-/Einwilligungsfrage — Daten einer
  Person würden anderen Coachees zugutekommen). Vorschlag für später: ein
  von der Admin selbst geschriebenes "Fazit" bei Protokoll-Abschluss statt
  roher Coachee-Daten — noch nicht gebaut, die Nutzerin wollte das erst
  genauer durchdenken.
- **Digitale Coaching-Vorlagen** (`AdminFormulareView.jsx`, erreichbar über
  Admin-Dashboard "📋 Coaching-Vorlagen"): alle 10 Formulare aus der
  Praxisakademie (Erstkontakt, Intake, Routinen-Profil, Sitzungsprotokoll
  GROW, Wochenplan, Red-Flag-Checkliste, Selbstreflexion, Beobachterbogen,
  Einwilligung, Feedbackbogen) digital ausfüllbar + als PDF exportierbar.
  Schema-getrieben (`src/data/formulareVorlagen.js`, generischer
  Feld-Renderer), PDF-Export über dieselbe `exportElementAsPdf()`-Pipeline
  wie die Wochenübersicht, gegen eine unsichtbare Klartext-Ansicht (native
  Inputs lassen sich mit html2canvas nicht fotografieren). Rein für die
  Coachin selbst, komplett getrennt von App-Daten der Coachees und von
  `coach_wissen`. **Keine Datenbank-Persistenz** — Werte bleiben nur im
  Browser-Zustand, solange die Ansicht offen ist; PDF-Export ist die Art,
  sie dauerhaft zu sichern.

### Onboarding-Bug behoben (13.08., wichtig)

Jeder erneute Durchlauf des Onboardings (z. B. "Onboarding erneut
durchlaufen" in Mehr, zum Testen gedacht) archivierte bisher **ungefragt**
das laufende Hauptprotokoll und legte ein neues an
(`hauptprotokollErstellen()` in `useHauptprotokollData.js` archiviert beim
Anlegen immer das bisherige aktive — das ist beim echten "+"-Button gewollt,
lief aber unbemerkt auch bei jedem normalen Onboarding-Durchlauf mit). Jetzt
behoben: `HauptprotokollErstellenView.jsx` bietet bei bereits vorhandenem
aktivem Hauptprotokoll zuerst "Weiter mit „Name"" an (keine
Datenbank-Aktion), Neuanlegen nur noch über einen expliziten Knopf. Betraf
nur den normalen Ablauf (`zeigeBestehendesAlsOption`-Prop), der "+"-Button
bleibt unverändert.

---

## 7. Erinnerungs-/Push-System

`send-due-reminders` (pg_cron, einmal pro Minute) deckt alle 9 Bereiche ab:
Vorab-Erinnerung 15 Min. vorher, Erinnerung zur geplanten Zeit, Nachfass-
Erinnerung 10 Min. danach falls noch nicht bestätigt (außer Hydration, keine
Einzeltermine). Mehrere gleichzeitig fällige Erinnerungen werden zu einer
Push-Nachricht gebündelt. ✅ Deployt und bestätigt.

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
- **Playlist-Zuordnung je Anlass** (13.08., heute gebaut): Migration 0048
  `spotify_anlass_playlists` (user_id, anlass, playlist_id). Neue
  wiederverwendbare Komponente `SpotifyAnlassPicker.jsx`, eingebunden in
  Morgenroutine/Abendroutine (`RoutineTabView.jsx`, `GewohnheitenView.jsx`),
  Training (`TrainingView.jsx`) und ein allgemeiner "gewohnheiten"-Anlass
  (`GewohnheitenView.jsx`, manuell per "Jetzt testen" ausgelöst, da einzelne
  Gewohnheiten keinen festen Start-Moment haben). Automatischer Start beim
  Öffnen von `RoutineAblauf.jsx` bzw. der Live-Trainingssession.

### 🔴 Offen, ungelöst — Spotify-Verbinden hängt in einer Anmelde-Schleife

**Symptom:** Beim Versuch, Spotify über "Mehr → Musik → Mit Spotify
verbinden" neu zu koppeln, landet die Nutzerin nach der Anmeldung immer
wieder auf der AKA-Seite, OHNE dass die App "verbunden" anzeigt — weder eine
Erfolgs- noch eine Fehlermeldung erscheint. Passiert sowohl in Safari als
auch in Chrome auf dem iPad.

**Was in dieser Sitzung bereits ausgeschlossen wurde** (alles überprüft und
bestätigt in Ordnung):
- Redirect-URI im Spotify-Dashboard (`https://akaapp.vercel.app/`) stimmt
  exakt mit der Adresse überein, unter der die Nutzerin die App öffnet.
- `VITE_SPOTIFY_CLIENT_ID` ist korrekt bei Vercel gesetzt (per neu
  eingebauter Diagnose-Zeile in `MehrTab.jsx` bestätigt, endet auf `…4b9d`).
- Freigabeliste im Spotify-Dashboard ("Development Mode") enthält ihr Konto.
- Der reine Navigations-Mechanismus (`window.location.assign()` statt
  `<a href>`, plus ein sichtbarer Klartext-Link als Fallback) wurde
  gehärtet — half nicht, das Problem liegt eine Ebene tiefer.
- Der Code selbst (Redirect-Adresse bauen, Rückkehr-Logik inkl. `?error=`-
  Behandlung, Server-Funktion `spotify-auth-callback`) wurde mehrfach
  Zeile für Zeile durchgesehen — keine Fehler gefunden.
- Die Nutzerin hat eine alte, "hängengebliebene" App-Autorisierung direkt in
  ihren Spotify-Kontoeinstellungen ("Apps verwalten") entfernt und neu
  autorisiert — Symptom blieb identisch.

**Aktuelle Diagnose:** Die Schleife passiert beim verschachtelten
"Mit Apple anmelden"-Schritt INNERHALB von Spotifys eigener
Autorisierungsseite — bevor Spotify je mit `?code=` oder `?error=` zu
unserer `redirect_uri` zurückkehrt (bestätigt: im Browser-Verlauf taucht in
dem Zeitfenster kein `accounts.spotify.com`/`appleid.apple.com`-Eintrag auf,
der auf eine erfolgreiche Rückkehr hindeutet). Direkte Anmeldung auf
spotify.com mit Apple-ID (außerhalb des Autorisierungs-Flows) funktioniert
bei der Nutzerin einwandfrei — das Problem ist spezifisch auf den
verschachtelten OAuth-Autorisierungs-Kontext beschränkt. Das liegt
vermutlich an iOS/WebKit-Restriktionen bei verschachtelten
Drittanbieter-Logins (Chrome auf iOS nutzt technisch dieselbe WebKit-Basis
wie Safari, daher identisches Verhalten in beiden Browsern) — **außerhalb
dessen, was im Code dieser App behoben werden kann.**

**Nächste Schritte für morgen** (noch nicht ausprobiert):
1. Auf der Spotify-Autorisierungsseite explizit NICHT "Mit Apple
   fortfahren" wählen, sondern direkt E-Mail + Passwort — falls die
   Nutzerin noch kein eigenes Spotify-Passwort hat, dieses zuerst unter
   spotify.com → Konto-Einstellungen einrichten (während sie regulär per
   Apple-ID bei spotify.com selbst angemeldet ist, nicht im
   Autorisierungs-Flow).
2. Die Verbindung von einem echten Computer aus herstellen (Laptop/PC,
   nicht iPad) — dort tritt das Verschachtelungsproblem praktisch nie auf.
   Die Verbindung gilt danach geräteunabhängig für ihr Konto.
3. Falls beides nicht möglich ist: mit der Nutzerin klären, ob es
   grundsätzlich in Ordnung ist, dass Spotify-Verbinden vorerst nur vom
   Computer aus funktioniert.

**Nicht mehr nötig:** weiteres Code-Debugging in dieser Richtung — die
Ursache liegt nachweislich außerhalb des Repos.

---

## 9. Migrationen — Stand 13.08., spätabends

Alle Migrationen 0001–0046 sind laut vorherigen Sitzungen deployt und
bestätigt. Für diese Sitzung relevant:

| # | Datei | Inhalt | Status |
|---|---|---|---|
| 0044 | `routine_zeitrahmen.sql` | Zeitrahmen je Morgen-/Abendroutine | ✅ deployt |
| 0045 | `coachee_modell.sql` | `profiles.steckbrief` + `coachee_nachrichten` | ✅ deployt |
| 0046 | `coach_wissen.sql` | Wissens-Basis-Tabelle | ✅ deployt |
| 0047 | `coach_wissen_seed.sql` | 16 Wissenseinträge aus der Praxisakademie | ✅ deployt, von Nutzerin bestätigt |
| 0048 | `spotify_anlass_playlists.sql` | Playlist-Zuordnung je Anlass | ✅ deployt — bestätigt (erneuter Ausführungsversuch scheiterte mit "existiert bereits", also bereits früher erfolgreich gelaufen) |
| 0049 | `uebungsbilder.sql` | Öffentliche Tabelle + Storage-Bucket für Übungsbilder | ⚠️ Wird von der Nutzerin gerade ausgeführt (14.08.) — Status beim nächsten Sitzungsstart bestätigen |

---

## 10. Offene Punkte

| # | Thema | Status |
|---|---|---|
| 1 | Spotify-Verbinden funktioniert weiterhin nicht (14.08.: neuer Stand — selbst der reine Klartext-Link navigiert in Safari UND Chrome nicht mehr, Seite "lädt an und bricht ab", identisch in beiden Browsern; Spotify-Passwort statt Apple-ID wurde eingerichtet, half nicht) | 🔴 Offen — Verdacht auf Netzwerk-/Geräte-Ebene (Bildschirmzeit-Webinhalte-Filter oder installiertes VPN/Konfigurationsprofil), Prüfung angefordert aber Ergebnis noch nicht zurückgemeldet. Nutzerin wollte das Thema bewusst pausieren und unabhängig davon weiterarbeiten — siehe Abschnitt 8 für die vollständige bisherige Diagnose, keine weitere Code-Suche nötig, das liegt außerhalb des Repos |
| 2 | Übungsbilder: Inhalte (die eigentlichen Canva-Bilder) fehlen noch | 🟡 Pausiert (14.08.) — Canva-Premium-Nutzung der Nutzerin funktioniert gerade nicht. Code/Infrastruktur ist fertig (siehe Abschnitt 5), nur die Bild-Erstellung selbst steht aus. Bei Sitzungsstart nachfragen, ob Canva wieder geht |
| 3 | Gemini-429-Kontingentproblem (`gemini-3.6-flash`, nur 20 Freianfragen/Tag) | 🔴 Offen seit mehreren Sitzungen — Stand bei Sitzungsstart erfragen, evtl. hat die Nutzerin es selbst gelöst |
| 4 | Inhaltliche ADHS-Vorgaben für Morgen-/Abendroutine (Tageslicht, Bewegung, Supplemente als Bestandteile) | Zurückgestellt — Nutzerin wollte erst selbst recherchieren |
| 5 | "Fazit"-Feld bei Protokoll-Abschluss als datenschutzfreundliche Alternative zu automatischem Lernen aus Coachee-Daten | Nur als Vorschlag im Raum, noch nicht gebaut |
| 6 | Per-Gewohnheit-Playlist-Zuordnung (statt einem allgemeinen "gewohnheiten"-Anlass) | Bewusste Scope-Entscheidung, nur bei explizitem Wunsch ausbauen |
| 7 | Groq als Provider / Groq-Streaming | Zurückgestellt, Code vorbereitet |
| 8 | Sprachauswahl (DE/EN/TR) auf den Assistenten selbst ausweiten | Nur UI-Texte mehrsprachig, Assistent antwortet immer auf Deutsch |
| 9 | Sprechgeschwindigkeit der Cloud-Stimme einstellbar machen | Noch nicht umgesetzt, Google-Cloud-TTS unterstützt `speakingRate` |

---

## 11. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Manuell UND per KI, nie nur eins von beidem** — bei jeder Änderung
  prüfen, ob das manuelle Formular noch genauso vollständig funktioniert.
- **Die Nutzerin ist nicht technisch versiert**, spricht oft per
  Spracherkennung. Bei Screenshots genau hinschauen — oft eine kleine
  Verwechslung, kein grundsätzliches Unverständnis. Bei unklaren/
  abgeschnittenen Nachrichten kurz nachfragen statt zu raten.
- **Diese Sandbox hat keinen Netzwerkzugriff auf Supabase/Vercel.**
  Migrationen/Edge-Function-Änderungen landen im Code, müssen aber von der
  Nutzerin manuell über das Supabase-Dashboard ausgeführt werden — SQL
  **immer zusätzlich als reinen Text im Chat** bereitstellen (nicht nur als
  Datei), sie kopiert von dort direkt, hat auf dem Tablet Schwierigkeiten
  mit Dateien. Bei Bedarf auch mehrfach auf Anfrage erneut posten.
- **Live-Verifikation nur über Screenshots der Nutzerin möglich** — bei
  hartnäckigen Bugs (wie dem Spotify-Problem) lohnt sich systematisches,
  schrittweises Ausschlussverfahren mit ihrer Hilfe, aber auch die
  Bereitschaft, ehrlich zu sagen "das liegt nicht in unserem Code", statt
  endlos weiterzusuchen, wenn die Evidenz das nahelegt.
- **Git-Workflow:** auf dem Feature-Branch `claude/google-cloud-tts-api-key-yc49xp`
  arbeiten, nicht direkt auf `main`. Vor jedem Commit (der JS/JSX/SQL
  berührt): `npm run build` + `npx oxlint <geänderte Dateien>`. Danach:
  `git fetch origin main && git checkout main && git merge --ff-only origin/main
  && git merge --ff-only claude/google-cloud-tts-api-key-yc49xp && git push origin main
  && git checkout claude/google-cloud-tts-api-key-yc49xp && git push -u origin claude/google-cloud-tts-api-key-yc49xp`.
- **Neue Migrationsdateien** fortlaufend nummeriert ablegen (aktuell zuletzt
  `0048_...`), reine Datenmigrationen (kein Schema-Change) genauso wie
  Schema-Änderungen.
- **Dieses Dokument aktuell halten** — bei viel Veränderung lieber neu
  schreiben statt endlos weitere Nachtrag-Absätze aufzustapeln.
