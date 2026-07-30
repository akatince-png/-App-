# 📋 ÜBERGABEPROTOKOLL: AKA App

**Stand: 31.07.2026, nachts (Zwischenstand, Fortsetzung folgt) — Branch
`claude/app-uebergabeprotokoll-improvements-03r3b3`**

Dieses Dokument wurde komplett neu geschrieben (nicht nur ergänzt), um die
vielen "Nachtrag"-Schichten der letzten Sessions in einen einzigen
aktuellen Stand zusammenzuführen. Ältere Zwischenstände: siehe Git-Historie
dieser Datei.

---

## 1. Was ist diese App?

**AKA** (Claim: "Deine exekutive rechte Hand") ist eine Web-App zur
Selbstverwaltung von Gesundheitsprotokollen/Biohacking, mit besonderem
Fokus auf ADHS-Freundlichkeit (reduzierte Reizüberflutung, Notfallmodus,
große Bedienelemente, klare Sprache). Die Nutzerin ist selbst nicht
technisch versiert (kommuniziert oft per Spracheingabe, mit
Transkriptionsfehlern) — siehe Abschnitt 8 für Hinweise zur
Zusammenarbeit.

**Rebranding (Nachtrag 28.07.):** Die App hieß bis dahin "MyProtocols";
das Produkt selbst heißt jetzt fest **AKA** (Titel, Login, Manifest,
Service Worker — überall hartcodiert, nicht personalisierbar). Getrennt
davon bleibt der **Assistenten-Persona-Name** weiterhin individuell
umbenennbar (siehe `utils/coachStorage.js`), Standard ist **"Aka"** —
beide Namen kommen bewusst aus derselben Idee (die App IST die
exekutive rechte Hand), sind technisch aber zwei getrennte Konzepte:
Marken-Text (Logo, Header, Abschnittsüberschriften) ist immer fest
"AKA"/"Akas", Dialog-Text (Chat-Begrüßungen, Platzhalter,
Persona-System-Prompt) nutzt dynamisch `getCoachName()`.

**Begriff "Coach" komplett entfernt (Nachtrag, selber Tag):**
Nutzerinnen-Vorgabe — das Wort "Coach" sollte aus der gesamten
sichtbaren App raus (impliziert Vorschriften machen, das Gegenteil von
dem, was gewünscht ist). Zwischenzeitlich hieß der Standardname testweise
"Acker" (kurz probiert, dann von der Nutzerin wieder verworfen — Standard
ist wieder "Aka", siehe Abschnitt 4 für die volle Persona-Beschreibung).
Betrifft nur sichtbaren Text/Verhalten — interne Variablen-/Dateinamen
(`getCoachName()`, `coachStorage.js`, `CoachOrb.jsx`, ...) behalten
bewusst "coach" im Namen, das sieht die Nutzerin nie und ein App-weites
Umbenennen aller Bezeichner wäre unverhältnismäßig hoher Aufwand/Risiko
ohne sichtbaren Nutzen.

Abgedeckte Lebensbereiche (jeder mit eigenem Plan/Protokoll): Schlaf,
Hydration, Ernährung, Training, Gewohnheiten, Supplemente,
Medikamente/Hormone, Peptide, Tageslicht (wie viel Zeit am Tag im
Freien/Tageslicht verbracht wird) — **9 Bereiche insgesamt**, plus die
Startseite Home.

Darüber liegt ein **Hauptprotokoll** (Name, Startdatum, Grund/Ziel), unter
dem alle Kategorien als **Teilprotokolle** laufen.

> ⭐ **Leitprinzip, nicht verhandelbar (ausdrücklich von der Nutzerin so
> formuliert): Die App muss IMMER zwei vollständig gleichwertige
> Bedienwege haben — manuell ausfüllen ODER per KI-Coach (Sprache/Chat).**
> Das ist "der Hack" an der ganzen App: Für "denkfaule, tippfaule,
> schreibfaule, recherchierfaule" Menschen macht der KI-Coach die App erst
> nutzbar. Für alle anderen — die selbst genau wissen, was sie wollen, ihre
> Ruhe haben möchten, der KI grundsätzlich nicht vertrauen, oder die App nur
> als reines Erinnerungs-/Verwaltungstool ohne jede KI-Einmischung nutzen
> wollen — muss jede Funktion genauso gut **ganz ohne KI** nutzbar bleiben.
> Praktisch heißt das: **niemals** ein manuelles Formular/einen manuellen
> Button entfernen oder verstecken, nur weil es jetzt auch einen
> KI-Weg dafür gibt. Der Assistenten-Orb öffnet sich nur auf Tap, nie von
> selbst — wer ihn nie antippt, bekommt die KI nie zu Gesicht. (Ausnahme,
> siehe Abschnitt 4: bei auffälligen Trackinglücken darf der Assistent im
> *Gesprächsverlauf* von sich aus etwas ansprechen — das öffnet aber
> weiterhin nichts von selbst, sondern wirkt erst, wenn die Nutzerin den
> Chat ohnehin öffnet.)

**Der Assistent** heißt standardmäßig **"Aka"** (individuell umbenennbar,
z. B. "Finn") und ist als echter Chat in **jedem der 9 Bereiche plus
Home/Tagesplan/Wochenübersicht** verfügbar — er fragt nach, schlägt vor,
und legt nach Bestätigung durch die Nutzerin selbst neue Einträge an.
Rolle/Tonalität: **Sidekick-Assistent, ausdrücklich kein "Coach"** (siehe
Abschnitt 4 für den vollen Systemprompt-Hintergrund) — im Hintergrund
unaufdringlich wie ein Butler, aber im Gespräch präsent statt rein passiv,
nimmt
die lästige Logistik/den Papierkram ab, erzeugt kein schlechtes Gewissen,
lässt der Person aber die Kontrolle. Läuft produktiv über **Google
Gemini** (Cloud, auch unterwegs nutzbar) — Ollama (lokal) und Groq bleiben
als Alternativ-Provider im Code vorbereitet, aber nicht aktiv.

---

## 2. Tech-Stack (verifiziert)

- **Frontend:** React 19 + Vite 8, reines **JavaScript** (kein TypeScript
  trotz `@types/react` in devDependencies — reine Editor-Hilfe).
- **Backend/Datenbank:** Supabase (Postgres, Auth, Storage, Row Level
  Security, Edge Functions in Deno/TypeScript).
- **Hosting:** **Vercel**, Live-URL **`https://myprotocolsapp.vercel.app`**.
  Automatischer Rebuild bei jedem Push auf `main` — reine
  Environment-Variable-Änderungen lösen KEIN automatisches Rebuild aus,
  dafür braucht es manuell "Redeploy" im Vercel-Dashboard.
- **KI:** **Google Gemini** (Modell `gemini-3.6-flash` — Vorsicht:
  Gemini-Modellnamen werden von Google regelmäßig abgeschaltet, siehe
  Abschnitt 5 „Gemini-Fallstricke"), angebunden über einen sicheren
  Supabase-Edge-Function-Proxy (`gemini-chat`). Alternativ vorbereitet,
  aber nicht aktiv konfiguriert: Ollama (lokal, `qwen2.5:7b`) und Groq
  (Cloud, kein API-Key vorhanden).
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk`.

---

## 3. Architektur & wichtige Konzepte

### Verzeichnisstruktur (Auszug, verifiziert)

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus, universeller Coach
│   ├── TageslichtView.jsx, HydrationView.jsx, NutritionView.jsx,
│   │   TrainingView.jsx, GewohnheitenView.jsx, SupplementeView.jsx,
│   │   MedikamenteView.jsx, PeptidView.jsx, SchlafView.jsx
│   │   → alle mit Coach-Orb (KiChat) UND eigener Bereichsfarbe erweitert
│   ├── onboarding/                Onboarding-Flow (siehe Abschnitt 5)
│   └── plan/                      PlaeneView (Tab-Hub für die 8 Kategorien
│                                   außer Gewohnheiten), MehrTab (Coach-Name,
│                                   Sprache, Erinnerungen-Übersicht)
├── ui/
│   ├── primitives.jsx             Shell, Card, PrimaryButton, Pill, CheckRow, Stepper, ...
│   ├── BereichColorContext.jsx    Bereichseigene Akzentfarbe für Shell → Buttons/Pills
│   ├── ViewHeader.jsx             Einheitliche Kopfzeile (Home-Button + Logo) für alle Screens
│   ├── CoachOrb.jsx               Animierte Kreis-Grafik, reagiert auf Coach-Gesprächszustand
│   ├── KiChat.jsx                 Wiederverwendbare Chat-Oberfläche (Orb-Trigger + Bottom-Sheet-Modal)
│   ├── Fab.jsx                    "+"-Button oben rechts
├── services/
│   ├── aiProviders.js             Low-Level: Ollama/Groq/Gemini, inkl. Streaming, sicherer Edge-Function-Weg
│   └── aiService.js               Domänenfunktionen (siehe Abschnitt 5)
├── utils/
│   ├── coachStorage.js            localStorage für Coach-Namen + Vorlesen-Einstellung
│   ├── speech.js                  Web Speech API (Mikrofon + Vorlesen)
│   ├── schedule.js                Intervall-Logik (fixed/custom/cycle/weekdays) — auch serverseitig portiert, siehe Abschnitt 5
│   ├── dayItems.js                KATEGORIE_META (Bereichsfarben) + Tagesplan-Aggregation
│   └── wissensBasis.js            Liest src/wissen/**/*.md fürs Coach-Hintergrundwissen
├── data/                          Ein use*.js-Hook pro Datenbereich
├── context/AppDataContext.jsx     Zentrale Datenverwaltung — kombiniert alle data/use*.js-Hooks
src/wissen/                        Statisches ADHS-Coaching-Hintergrundwissen (.md), pro Bereich ein Unterordner
supabase/functions/
├── groq-chat/index.ts             Sicherer Groq-Proxy — deployt, aber nicht aktiv genutzt
├── gemini-chat/index.ts           Sicherer Gemini-Proxy — AKTIV
├── lexikon/index.ts               Eigenständige Anthropic-Anbindung fürs Lexikon (Laborwerte-Erklärungen etc.)
└── send-due-reminders/index.ts    Cron-Job-Versand für Push-Erinnerungen (siehe Abschnitt 5)
```

### Design-System

Kein CSS-Framework — plain CSS (`src/index.css`, v. a. `@keyframes`) +
Design-Tokens aus `src/ui/theme.js` (`accent`, `accentDark`, `cardBorder`,
`bg = "#FFFFFF"`, ...), eingebunden über inline `style={{...}}`-Objekte.
**Immer** Farben aus `theme.js`/`KATEGORIE_META` importieren, nie
Hex-Werte direkt schreiben.

**Bereichseigene Farben statt überall derselben Akzentfarbe.** Jeder
Lebensbereich hat seine eigene Farbe (`KATEGORIE_META` in
`utils/dayItems.js`): Tageslicht=Gelb, Training=Rot, Medikamente=Lila,
Hydration=Blau, Schlaf=Indigo, Peptide=Marken-Grün, Supplemente=Gold,
Ernährung=Terrakotta, Gewohnheiten=Teal. Umgesetzt über
`src/ui/BereichColorContext.jsx`: `<Shell bereich="training">` (Prop an
die `Shell`-Komponente) versorgt `PrimaryButton`/`Pill`/`CheckRow`/
`Stepper` automatisch über React Context mit der passenden Farbe — kein
einzelner Button musste manuell eingefärbt werden. Ohne `bereich` fällt
alles auf die generische Marken-Akzentfarbe zurück (Home, Wochenübersicht
— mischen mehrere Bereiche). `PlaeneView.jsx` (der "Alle Pläne"-Tab-Hub)
und `OnboardingCategoriesView.jsx` setzen `bereich` dynamisch nach
aktivem Tab/Schritt.

Der Home-Button ist über `src/ui/ViewHeader.jsx` vereinheitlicht
(Home-Button links neben dem Logo). Bei neuen Screens **immer**
`ViewHeader` nutzen, nicht wieder einen eigenen Header-Block bauen.

**Farbverlauf-Buttons + Tiefe statt flacher Flächen (Nachtrag 28.07.).**
Nutzerinnen-Feedback: das bisherige Design wirkte "flach, undynamisch,
unmodern"; als Vorbild diente der Notfallmodus-Knopf auf Home
(`ADHSModeToggle.jsx` — Farbverlauf + farbiger Glow-Schatten +
Press-Animation). Umgesetzt:
- Genereller Marken-Akzent (`accent` in `theme.js`) ist jetzt Indigo
  (`#6366F1`) statt des alten Grüns.
- „Erledigt"/Erfolg ist jetzt ein **eigenständiges** Grün (`success`,
  `#0E7C66` — der alte Akzent-Wert), nicht mehr an `accent` gekoppelt.
  Beide Bedeutungen (Marke vs. Erfolg) waren vorher in einer Farbe
  vermischt.
- Zwei neue Hilfsfunktionen in `theme.js`: `aufhellen(hex, prozent)` und
  `hexZuRgba(hex, alpha)` — erzeugen zur Laufzeit den zweiten
  Verlaufs-Farbton bzw. den Glow-Schatten aus jeder beliebigen Hex-Farbe.
- `PrimaryButton` (`primitives.jsx`) nutzt jetzt einen
  135°-Zweifarben-Verlauf, einen farbigen `boxShadow`-Glow und eine
  Press-Scale-Animation (`onMouseDown`/`onTouchStart` → `scale(0.97)`).
  Das gilt automatisch für **jede** Bereichsfarbe aus `KATEGORIE_META`
  (über `useBereichColor()`), nicht nur den generischen Akzent — ein
  Training-Button ist z. B. jetzt ein Rot-Verlauf mit rotem Glow, ohne
  dass irgendwo eine Bereichsfarbe einzeln angefasst werden musste.
- `Card`-Schatten vertieft (`shadow` in `theme.js`, sichtbar dunkler/
  größer) und `CheckRow`s bekommen im ausgewählten Zustand ebenfalls
  einen farbigen Glow am Häkchen-Kästchen, damit es nicht nur bei
  Buttons "lebendig" wirkt.
- Hintergrund (`bg`) ist weiterhin reines Weiß (`#FFFFFF`) — kann nicht
  wörtlich "noch heller" werden; falls die Nutzerin das anders meinte
  (z. B. Kontrast zwischen Seite und Karte), müsste das gezielt
  nachgefragt werden.

**Tablet-/Desktop-Layout (Nachtrag 28.07.).** Bug-Report: "sieht aus wie
Handy-Auflösung" — `Shell` (`primitives.jsx`) hatte die Inhaltsbreite alle
30 Views hindurch fest auf `maxWidth: 420px` gedeckelt, unabhängig von
der tatsächlichen Bildschirmgröße. Behoben über zwei neue CSS-Klassen mit
festen Breakpoints (`index.css`, keine JS-Breite-Erkennung nötig):
- `.mp-shell-inner` (ersetzt die inline `maxWidth` in `Shell`): 420px
  Handy, **680px** ab 640px Viewportbreite, **860px** ab 1024px.
- `.mp-ordner-grid` (Kategorie-Kacheln auf Home, `ORDNER.map(...)`): 3
  Spalten Handy, **4 Spalten** ab 640px, **5 Spalten** ab 1024px — bekommt
  auf Tablet also wirklich mehr Kacheln pro Zeile statt nur größerer.
- Alle anderen Grids in der App (z. B. die 2-Spalten-Fortschrittsringe auf
  Home, das `auto-fill`-Mini-Widget-Raster) profitieren automatisch von
  der breiteren `Shell` mit — deren Zellen werden einfach größer, ohne
  dass ich jede einzelne Stelle anfassen musste.
- Bewusst NICHT angefasst: die übrigen fest 2-spaltigen Grids
  (`HydrationView.jsx`, `TageslichtView.jsx`) — die werden auf Tablet
  einfach breiter, nicht mehrspaltig. Falls das später auch störend groß
  wirkt, wäre das ein gezielter Folgeschritt.
- Visuell mit Playwright bei 390px (Handy)/768px (Tablet Hoch)/1024px
  (Tablet Quer)/1280px (Desktop) geprüft, direkt gegen die kompilierte
  CSS-Datei, ohne Login/Backend nötig.

### Willkommens-Folien komplett neu (Nachtrag 29.07.)

Auf ausführliche Vorgabe der Nutzerin komplett neu gestaltet: die drei
Folien VOR dem eigentlichen Onboarding-Ablauf (`WelcomeView.jsx`, Phase
`welcome` in `OnboardingFlow.jsx` — NICHT die Coach-Begleitungs-Screens
aus den vorherigen Nachträgen, die kommen erst danach). Ziel:
"nach den ersten drei Screens das Gefühl 'Endlich muss ich nicht mehr
alles selbst im Kopf behalten'" statt Funktions-Verkauf — Referenz
Apple/Headspace/Notion-Onboarding.

- **Texte** komplett neu (`src/i18n/dict/welcome.js`, alle drei Sprachen
  DE/EN/TR): weg vom bisherigen "Ich übernehme die Logistik: Peptide,
  Medikamente, ..."-Aufzählungston, hin zu den drei von der Nutzerin
  vorgegebenen Kernsätzen ("Dein Kopf ist fürs Leben da – nicht zum
  Merken." / "Alles an einem Ort." / "Kleine Schritte. Große
  Entlastung."). Neuer Dict-Key `welcome.slide3.abschluss` für den von
  der Nutzerin selbst vorgeschlagenen Abschlusssatz ("Ab jetzt musst du
  nicht mehr an alles denken – ich erinnere dich daran.") — erscheint nur
  auf der letzten Folie, optisch abgesetzt als kleiner fetter
  Abschluss-Satz.
- **Neue Illustrationen** statt Marken-Ring-Logo/Emoji-Icons:
  `src/ui/WelcomeIllustrations.jsx`, drei eigenständige, selbstgebaute
  Inline-SVGs (kein externer Asset-Dienst) — `KopfEntlastungIllustration`
  (Kopf, aus dem ein paar Gedanken sanft nach draußen abgegeben werden),
  `UebersichtIllustration` (ruhiges 2×2-Raster statt Zettel-Chaos),
  `RuheIllustration` (ruhiges Häkchen-Abzeichen statt Rakete — bewusst
  Sicherheit/Leichtigkeit statt Tempo). Jede in ein weiches
  Kreis-Badge eingebettet, Farben aus dem bestehenden Theme
  (`accent`/`blue`/`success` + ihre Soft-Varianten), keine neuen Farben
  eingeführt.
- **Layout/Typografie**: `Card`-Rahmen um den Button entfernt (wirkte
  bei einem einzelnen Button unnötig schwer), größere Illustration
  (132px), größere/luftigere Überschrift (25px, engere Zeilenhöhe),
  mehr Weißraum zwischen den Elementen, Fließtext mit bewussten
  Absatzumbrüchen (`\n` in den Dict-Strings + `whiteSpace: "pre-wrap"`)
  statt einem dichten Textblock. Sanfter Fade-in/Slide-Übergang beim
  Folienwechsel über die schon vorhandene `fadeInUp`-Keyframe aus
  `index.css` (`key={index}` löst die Animation bei jedem Wechsel neu
  aus), respektiert automatisch `prefers-reduced-motion` wie der Rest der
  App.
- **Bewusst unverändert**: Sprach-Umschalter (DE/EN/TR) und
  "Überspringen" oben, `OnboardingNavArrows` für Vor/Zurück, die
  Fortschritts-Punkte unten, der gesamte weitere Onboarding-Ablauf danach
  (Hauptprotokoll/Ziele/Profil/Laborwerte/Kategorien) — Auftrag war
  ausdrücklich nur diese drei Folien, keine funktionalen Änderungen.
- Mit Playwright bei Handy- und Tablet-Breite sowie in allen drei
  Sprachen geprüft (Text bricht nirgends unschön um, Illustrationen
  bleiben lesbar).

### Bugfix: Abmelden-Ausweg im Erst-Onboarding fehlte (Nachtrag 29.07.)

**Bug (Nutzerin-Meldung):** Wer sich zum ersten Mal anmeldet, aber das
Onboarding nicht in einem Zug durchläuft, blieb nach einem Seiten-Refresh
im Willkommens-Screen hängen — ohne jeden Weg zurück zu Abmelden/Neu-
anmelden. Das Hängenbleiben selbst beim Refresh ist gewollt (`onboarding_
complete` liegt in der DB, nicht im Client-State — Onboarding wird
korrekt fortgesetzt), der eigentliche Bug war: `AuthenticatedApp.jsx`
übergab `<OnboardingFlow>` für Erstanmeldungen gar kein `onCancel`,
und `WelcomeView.jsx`/die `welcome`-Phase in `OnboardingFlow.jsx` kannten
das Prop bislang gar nicht (nur alle Screens danach hatten den
`onCancel`-Abbrechen-Mechanismus, der aber schon für bestehende Konten,
die das Protokoll neu einrichten, existierte).

**Fix:** `AuthenticatedApp.jsx` übergibt jetzt `signOut` (aus `useAuth()`)
als `onCancel` an `<OnboardingFlow>` bei Erstanmeldungen.
`OnboardingFlow.jsx` reicht `onCancel` in der `welcome`-Phase an
`WelcomeView` weiter (vorher dort schlicht nicht verdrahtet).
`WelcomeView.jsx` zeigt bei gesetztem `onCancel` einen dezenten
"Abmelden"-Link unter dem Haupt-Button (bewusst unauffällig, kollidiert
nicht mit Sprach-Umschalter/"Überspringen" oben) — nutzt den bereits
vorhandenen Übersetzungsschlüssel `mehr.konto.abmelden` (DE/EN/TR schon
vorhanden). Reine Frontend-Änderung, kein Supabase-Deploy nötig.

### Wochenübersicht & PDF-Export (existiert schon — Nachtrag 28.07.)

**Wichtig:** diese Funktion war vor dem heutigen Nachtrag in diesem
Dokument nicht beschrieben — reiner Dokumentationsfehler, die Nutzerin
mit Recht nachgefragt, ob das schon bekannt war. `WochenuebersichtView.jsx`
hat bereits:
- Umschalter **Tag/Woche/Monat** (`viewMode`), Monatsansicht mit
  Vor/Zurück-Navigation.
- **PDF-Export** (`src/utils/pdfExport.js`, `exportElementAsPdf()`):
  fotografiert ein unsichtbares Off-Screen-Export-Raster per
  `html2canvas` und packt es als mehrseitiges A4-PDF (`jsPDF`), Download
  läuft komplett clientseitig.
- Ein separates **"Erste-Woche-Protokoll"-Snapshot-System**
  (`src/utils/wochenprotokollSnapshot.js` + `useWochenprotokollMeilenstein.js`
  + Tabelle `wochenprotokoll_snapshots`): wird EINMALIG 7 Tage nach
  Protokollstart fällig, friert Substanzen/Wochenplan/Compliance als
  festen Schnappschuss ein (nicht live neu berechnet wie die normale
  Wochenübersicht).

**Lücke zur Vorgabe der Nutzerin (28.07., "wöchentliches/monatliches
Protokoll für einen frei festgelegten Zeitraum, einsehbar + als PDF"):**
- Compliance/Statistik ist aktuell nur für **Peptide/Hormone** berechnet
  (`plan`/`hormonPlan` vs. `erledigt`/`hormonErledigt`) — NICHT für die
  anderen 7 Bereiche (Schlaf, Hydration, Ernährung, Training,
  Gewohnheiten, Supplemente, Tageslicht).
- Kein **frei wählbarer Zeitraum** — nur Tag/Woche/(rollierender)Monat,
  kein "von X bis Y" oder "für die Dauer des Protokolls".
- Kein **Verspätungs-/Auslass-Tracking** (wann wurde etwas nachgeholt,
  wie spät, mit welcher Notiz) — nur binäres erledigt/nicht erledigt zum
  Anzeigezeitpunkt.
- Das "Erste-Woche"-Snapshot-System ist ein Einzelfall (Meilenstein nach
  7 Tagen), kein wiederkehrendes Wochen-/Monats-Protokoll.

Für die volle Vorgabe (siehe Abschnitt 6, offener Punkt "Protokoll-
Journal") müsste die bestehende Wochenübersicht um alle 9 Bereiche
erweitert werden, statt eine Parallel-Lösung zu bauen — die Tag/Woche/
Monat-Umschaltung und der PDF-Export sind die richtige Grundlage dafür.

**Nachtrag 28.07., später am selben Tag — Feedback-Fenster nach jeder
Bestätigung:** Nutzerinnen-Vorgabe: nach jeder "Bestätigen"-Aktion soll
(wie beim Peptid-Nebenwirkungsfenster) eine kurze, typ-passende
Rückfrage kommen. Bei der Durchsicht zeigte sich: das Backend dafür war
für Medikamente und Supplemente bereits vollständig fertig gebaut
(`saveHormonFeedback`/`skipHormonFeedback` in `useHormoneData.js`,
`saveSupplementFeedback`/`skipSupplementFeedback` in
`useSupplementData.js`, inkl. passender Konstanten
`VERTRAEGLICHKEIT_OPTIONEN`/`WIRKUNG_OPTIONEN`/`NEBENWIRKUNGEN_OPTIONEN`
in `constants.js`) — nur die UI hat nie darauf zugegriffen, der
"Bestätigen"-Knopf hat direkt `toggleHormonErledigt`/
`toggleSupplementErledigt` ohne Rückfrage aufgerufen. Jetzt behoben:
`MedikamenteView.jsx` und `SupplementeView.jsx` haben jetzt dasselbe
Feedback-Panel-Muster wie `PeptidView.jsx` (Pills für
Verträglichkeit/Wirkung/Nebenwirkungen + Notizfeld + "Ohne Notiz
bestätigen"/"Speichern"). Training/Schlaf/Hydration/Peptide hatten diese
Rückfrage schon vorher (RPE/Schmerzen bei Training, Erholt-Status bei
Schlaf, Menge bei Hydration, Nebenwirkungen bei Peptiden) — nur
Medikamente/Supplemente fehlten.

**Nachtrag 28.07., dritte Runde — lückenloses Tagesprotokoll (Start):**
Nutzerinnen-Vorgabe: jeder Protokollschritt soll dokumentiert werden,
inklusive Verspätung gegenüber der geplanten Uhrzeit. Statt eine neue
Tabelle zu bauen, wird das bereichsübergreifende **Änderungsprotokoll**
weiterverwendet, das es schon gab (`aenderungsprotokoll`-Tabelle,
`useAenderungsprotokoll.js`, bisher nur für "hinzugefügt/entfernt/
geändert" bei Plan-Bearbeitungen genutzt — sichtbar in
`ProtokollLogView.jsx`, jetzt "📝 Tagesverlauf" statt "📝 Änderungen"
genannt, weil dort jetzt auch Bestätigungen auftauchen). Neuer Helper
`verspaetungText(geplantUhrzeit, jetzt)` in `utils/dates.js` (5 Minuten
Toleranz, sonst "X Min./Std. später als geplant") wird beim Bestätigen
in **Peptide, Medikamente, Supplemente, Gewohnheiten, Mahlzeiten**
aufgerufen und zusammen mit etwaigem Feedback (Nebenwirkungen/Notizen)
als `aktion: "erledigt"`-Eintrag vermerkt.

**Noch nicht abgedeckt (bewusst nächster Schritt, nicht in dieser
Runde):**
- Training/Schlaf/Hydration/Tageslicht: haben kein einzelnes
  "geplant vs. erledigt"-Paar wie die anderen Bereiche (Training loggt
  bereits volle Einheiten, Schlaf/Hydration/Tageslicht sind kumulative
  Tageswerte statt Einzeltermine) — bräuchten ein eigenes Konzept statt
  denselben `verspaetungText()`-Aufruf.
- **Echte "ausgefallen"-Dokumentation** (ein Termin wird gar nicht erst
  wahrgenommen): aktuell nur implizit sichtbar (Status "verpasst" wird
  live berechnet, wenn ein Datum verstrichen ist, ohne eigenen Log-
  Eintrag). Eine automatische Nacherfassung bräuchte einen Tages-
  Rollover-Sweep (beim App-Start prüfen, was seit gestern offen blieb)
  mit Dedup-Logik, damit nichts doppelt geloggt wird — bewusst
  zurückgestellt, um das nicht überstürzt/fehleranfällig zu bauen.
- **"Notfallmodus/kein Plan genutzt"-Tagesdokumentation**: der
  Notfallmodus (`ADHSModeToggle.jsx`) ist aktuell rein clientseitiger
  UI-Zustand (welche Widgets angezeigt werden), wird nirgends
  persistiert — bräuchte eine neue Aktion, die einen Tages-Eintrag ins
  Änderungsprotokoll schreibt.
- Der Sammel-Knopf "Alle bestätigen" (Supplemente, mehrere auf einmal)
  loggt noch nicht einzeln — bewusst niedrige Priorität.

---

## 4. KI-Assistent — vollständiger technischer Überblick

### Architektur

- `src/services/aiProviders.js` — Low-Level-Transport, drei Provider
  (Ollama/Groq/Gemini) über `VITE_AI_PROVIDER` wählbar. `sendeAnfrage()`
  für normale Anfragen, `sendeAnfrageStreamend()` für Wort-für-Wort-Antworten
  (Ollama + Gemini haben echtes Streaming, Groq noch nicht). Bei
  Groq/Gemini: ohne `VITE_AI_API_KEY` läuft die Anfrage automatisch über
  die passende Supabase Edge Function (sicherer Normalweg, Key bleibt
  serverseitig).
- `src/services/aiService.js` — Domänenfunktionen: freier Chat
  (`coachChat`/`coachChatStreamend`), strukturierte Extraktoren
  ("Formular-Generatoren", …AusChat-Funktionen für jeden Bereich:
  Training, Ernährung, Gewohnheiten, Hydration, Tageslicht, Supplemente,
  Medikamente, Peptide, Schlaf, Laborwerte, Onboarding-Felder), sowie
  `bereichErkennen()` (klassifiziert im Hintergrund, zu welchem
  Themenbereich ein Gespräch schon konkret genug ist) und
  `feldAntwortInterpretieren()` (bereinigt eine einzelne gesprochene
  Antwort zum reinen Feldwert, z. B. "ich wiege ungefähr 75 Kilo" → "75").
- `src/data/useCoachVerlauf.js` + Tabelle `coach_nachrichten` — persistenter
  Gesprächsverlauf pro `bereich`. Wird beim Öffnen eines Chats geladen und
  fließt automatisch (bis zu `KI_KONTEXT_LIMIT` = 24 Nachrichten) als
  Kontext in jede neue KI-Anfrage ein.
- `src/ui/KiChat.jsx` — geschlossen: schwebender runder Assistenten-Orb
  (68px, Komponente `CoachOrb.jsx` — Dateiname intern noch "Coach", nicht
  sichtbar) unten mittig. Tap öffnet ein Bottom-Sheet-Modal UND startet direkt die
  Spracherkennung. Anzeige bewusst minimal wie ein KI-Sprachmodus
  (ChatGPT/Gemini-Stil): nur die jeweils aktuelle Frage/Antwort groß,
  älterer Verlauf hinter Aufklapp-Link. Barge-in: eigenes Sprechen oder
  Antippen des Orbs unterbricht sofort eine laufende Sprachausgabe.
  Spracherkennung liefert Zwischenergebnisse live, Tastatur fokussiert
  sich automatisch sobald nicht zugehört wird.

**Nachtrag 28.07. — Vorlesen jetzt überall, Standard AN:** Bug-Report der
Nutzerin per Screenshot: Im Onboarding ("Frei erzählen") antwortete Aka
nur als Text, obwohl "Vorlesen" in den Grundeinstellungen existierte —
`sprich()` (Text-zu-Sprache, `utils/speech.js`) war nur in `KiChat.jsx`
verdrahtet, nicht in den zwei Onboarding-Begleitungs-Screens
(`OnboardingCoachFreitext.jsx`, `OnboardingCoachGuide.jsx`). Beide lesen
jetzt ihre Antworten (Begrüßung/Coach-Antwort bzw. jede neue Frage)
automatisch vor. Außerdem: `getVorlesenAktiv()` in `coachStorage.js`
liefert jetzt standardmäßig `true` statt `false` (Nutzerin: "ich möchte
eigentlich das ja überall mit Ton antwortet") — wer es nicht will, kann
es jederzeit über den 🔊/🔈-Knopf abschalten, neu ausgelagert in
`src/ui/VorlesenToggle.jsx` und an allen drei Stellen (KiChat + beide
Onboarding-Screens) eingebunden.

**Nachtrag 28.07., zweite Runde — flüssigere Stimme + Auto-Zuhören ohne
Antippen.** Zwei weitere Rückmeldungen der Nutzerin:
- *"Die Stimme klingt noch abgehackt."* `sprich()` (`utils/speech.js`)
  sprach bisher den kompletten Text als EINEN `SpeechSynthesisUtterance`
  — das klingt auf vielen Geräten (v. a. iOS Safari) stockend und kann
  bei längeren Antworten sogar mittendrin abbrechen (bekannter
  Plattform-Bug). `sprich()` zerlegt den Text jetzt in einzelne Sätze und
  reiht sie als mehrere kurze Utterances hintereinander ein — der Browser
  spielt die lückenlos nacheinander ab, das klingt spürbar runder.
  Zusätzlich `rate`/`pitch` auf neutrale Standardwerte (vorher `rate:
  1.04`, leicht gehetzt). `sprich()` nimmt jetzt außerdem ein optionales
  `{ onEnde }` entgegen, das feuert, sobald der letzte Satz fertig
  gesprochen ist — Grundlage für den nächsten Punkt.
- *Auto-Zuhören ohne erneutes Antippen:* Die Wahl "Frage für Frage" bzw.
  "frei erzählen" auf `OnboardingIntroView.jsx` galt bisher nur als
  Einstieg in den jeweiligen Bildschirm — dort musste dann trotzdem noch
  einmal manuell auf den Orb getippt werden, um das Mikrofon zu starten.
  Die Nutzerin wollte, dass diese Wahl direkt als durchgehende
  Zustimmung fürs ganze Gespräch zählt: `OnboardingCoachGuide.jsx` und
  `OnboardingCoachFreitext.jsx` sprechen jetzt jede Frage/Antwort
  automatisch UND starten direkt danach (via `sprich(..., { onEnde })`)
  automatisch das Mikrofon, ohne dass angetippt werden muss — bei
  `OnboardingCoachGuide.jsx` nur für Feldtypen, die Spracheingabe
  überhaupt unterstützen (Text/Zahl, nicht Pillen/Datum). Manuelles
  Antippen des Orbs bleibt weiterhin möglich (Barge-in unterbricht wie
  gehabt eine laufende Vorlese-Antwort).
**Nachtrag 28.07., dritte Runde — dasselbe Muster jetzt auch in
`KiChat.jsx` (Laborwerte, Hydration & Co.).** Direkte Folge auf "Mach
weiter": die Nutzerin wollte dieselbe Auto-Frage/Auto-Zuhören-Logik auch
dort, wo Fragen wie Laborwerte/Hydration tatsächlich gestellt werden —
das läuft über die generische `KiChat.jsx`, eingebettet in
`OnboardingCategoriesView.jsx` (9 Kategorie-Schritte) und
`OnboardingLaborwerteView.jsx`, nicht über die beiden Onboarding-
Profil-Screens von eben.
- `KiChat.jsx` hat jetzt einen optionalen `autoStart`-Prop: startet
  direkt offen (kein Tap auf den schwebenden Orb nötig), spricht sofort
  die Begrüßung vor (bzw. bei bestehendem Verlauf die letzte
  Coach-Nachricht, damit man beim Wiedereinstieg weiß, wo man stand) und
  hört danach automatisch zu — extrahiert in eine gemeinsame
  `starteGespraech()`-Funktion, die sowohl der Tap-Handler als auch ein
  Mount-Effekt bei `autoStart` aufrufen.
- **Universell für ALLE `<KiChat>`-Stellen** (auch ohne `autoStart`):
  Tap auf den Orb spricht jetzt zuerst die Begrüßung vor und startet das
  Mikrofon erst danach (vorher: sofortiges stummes Zuhören ohne
  Vorlesen). Nach JEDER Coach-Antwort hört das Mikrofon jetzt automatisch
  wieder zu (bzw. sofort, falls Vorlesen aus ist) — kein erneutes
  Antippen pro Gesprächsrunde mehr nötig, überall in der App.
- `autoStart` gesetzt nur auf den zwei eingebetteten Instanzen in
  `OnboardingCategoriesView.jsx` und `OnboardingLaborwerteView.jsx` — die
  ~12 schwebenden Trigger-Orb-Stellen (Home, Trainingsplan, Ernährung,
  Hydration, Medikamente, Peptide, Supplemente, Schlaf, Tageslicht,
  Wochenübersicht, Tagesplan, Gewohnheiten) bleiben bewusst Tap-to-open,
  weil das Erreichen dieser Screens (anders als bei den Onboarding-
  Kategorie-Schritten) keine Zustimmung zum sofortigen KI-Gespräch ist.
- Neue `KATEGORIE_EINLEITUNG`-Map in `OnboardingCategoriesView.jsx`:
  ersetzt die generische Begrüßung ("Was möchtest du für X einrichten?")
  durch die konkrete, zur Substanz/Einnahmeart passende Frage direkt zu
  Beginn — z. B. Hydration: "Wie viel trinkst du aktuell am Tag, und was
  wäre ein gutes Tagesziel für dich?" statt einer generischen Frage.
  Laborwerte-Begrüßung in `OnboardingLaborwerteView.jsx` ebenso
  angepasst ("Hast du Laborwerte da? Sag sie mir einfach, oder mach
  unten ein Foto vom Befund").
- Manuelle Formulare bleiben unverändert erreichbar (Leitprinzip): das
  Chat-Fenster ist ein schließbares Overlay, dahinter steht wie bisher
  das komplette manuelle Formular.

### Persona: "Aka" als Sidekick, ausdrücklich kein Coach

`STANDARD_COACH_NAME` in `coachStorage.js` ist `"Aka"`, individuell
umbenennbar (Einstellungen → "Dein Assistent"). In `aiService.js` gibt es
zwei Persona-Ebenen:
- `mitPersona()` — nur die Namens-Vorstellung, für ALLE Funktionen inkl.
  der strukturierten Extraktoren.
- `mitVollerPersona()` (`coachPersonaBlock()`) — zusätzlich die volle
  Persönlichkeits-/Antwortstruktur, NUR für den freien Chat
  (`coachChat`/`coachChatStreamend`) — bewusst nicht für die Extraktoren,
  da die Stil-Vorgaben (Bullet Points etc.) mit der geforderten reinen
  JSON-Antwort kollidieren und das Parsen brechen würden.

**Wichtig zur Begriffsklärung:** "AKA" (Großschreibung) ist der feste
App-Markenname (Login, Titel, Manifest — siehe Abschnitt 1). "Aka"
(Groß-/Kleinschreibung wie ein Name) ist der personalisierbare
Assistenten-Name. Beides kommt aus derselben Grundidee, sind technisch
aber getrennte Konzepte.

**Rolle: Sidekick, ausdrücklich kein Coach (Nachtrag 28.07., zweimal
präzisiert).** Das Wort "Coach" ist komplett aus der sichtbaren App raus
— ein Coach schreibt vor, ein Sidekick nimmt ab, bleibt aber im Gespräch
präsent statt nur zu verwalten. Metapher: ADHSler haben oft
außergewöhnliche Fähigkeiten (Kreativität, Hyperfokus, schnelles Denken)
— was fehlt, sind die Rahmenbedingungen, damit die auch zum Tragen
kommen. Genau das liefert Aka.

Zwei Ebenen, die zusammen die Balance halten (erste Fassung war zu
Butler-lastig/passiv — Nutzerinnen-Feedback direkt danach: "nicht zu
ruhig, nicht zu ausschließlich Hintergrund"):
- **Im Hintergrund unaufdringlich wie ein guter Butler** (Alfred,
  Batmans Butler): übernimmt den langweiligen Teil (Formulare, Tabellen,
  Rückfragen zu Details) unsichtbar, langweilt die Person nicht mit dem
  Umfang dessen, was im Hintergrund passiert.
- **Im Gespräch präsent, nicht passiv:** freundschaftlich, motivierend,
  mit echtem Interesse. Kritisiert konstruktiv und lösungsorientiert,
  wenn's mal nicht rund läuft — nie als Vorwurf. Meldet sich bei
  Auffälligkeiten von sich aus (siehe unten), statt nur zu reagieren.

ADHSler lassen sich ungern etwas vorschreiben, wollen aber trotzdem
verstehen, worum es geht, und das Gefühl behalten, Kontrolle zu haben —
Aka erklärt auf Nachfrage, bevormundet aber nie. Erzeugt bewusst **kein
schlechtes Gewissen** (viele ADHSler tragen davon schon chronisch genug
mit sich herum) — kein Zeigefinger, kein Urteil, keine Vorwürfe bei
Rückschlägen, aber Ansprechen ist ausdrücklich erwünscht, solange es
unterstützend klingt. Behält außerdem im Hinterkopf: Gewohnheiten halten
meist erst, wenn die gesundheitliche Grundlage stimmt (Schlaf, Bewegung,
Morgenroutine, Hormonhaushalt) — bei Problemen lieber die eigentliche
Ursache mitdenken statt nur das Symptom zu behandeln. Prinzipien für die
Antwortstruktur: sofort auf den Punkt, konkrete Mikroschritte ("Next
Small Step"), maximale Scannbarkeit (Fettdruck, Bullet Points). Eine
Vorgabe bewusst NICHT wörtlich umgesetzt: Pläne erscheinen weiterhin als
lesbarer Fließtext in der sichtbaren Antwort, NIE als rohes JSON — das
würde sonst mit den Formular-Generatoren kollidieren (die strukturierte
Übernahme läuft separat über den "Übernehmen"-Knopf).

**Proaktives Nachfragen bei Trackinglücken (neu, 28.07.):**
Nutzerinnen-Vorgabe konkret: "wenn drei Tage kein geplantes Training
gemacht wurde, muss die KI von sich aus nachfragen." Umgesetzt in
`src/utils/trackingZusammenfassung.js` (`trainingsLuecken()`): vergleicht
die letzten 7 Tage gegen `trainingWochenplan` (was war geplant) und
`trainingEintraege` (was wurde geloggt); ab 3 verpassten geplanten Tagen
erscheint eine "Auffälligkeit"-Zeile im Trackingdaten-Kontext, der
ohnehin bei jeder Chat-Anfrage mitgeschickt wird ("Background Brain",
siehe unten). Der System-Prompt weist Aka an, das dann von sich aus
anzusprechen. Wichtig: das ist **kein echtes Push/Server-Proaktiv** — es
wirkt erst, wenn die Nutzerin selbst irgendeinen Chat öffnet (passt zum
Leitprinzip oben: nichts öffnet sich von selbst). Bisher nur für Training
gebaut (klarstes Plan-vs-Log-Paar); ließe sich nach demselben Muster auf
andere Bereiche mit Wochenplan/Dosierung ausweiten, falls gewünscht.
Echte Push-Benachrichtigungen bei Lücken (auch wenn die App zu ist) wären
ein größerer, separater Ausbau — würde die `send-due-reminders`
Edge-Function um dieselbe Lücken-Logik erweitern und einen manuellen
Redeploy brauchen.

### "Background Brain": Wissens-Basis + Live-Daten in JEDER Anfrage

Zwei Kontext-Quellen werden zentral in `KiChat.jsx` (und in
`OnboardingCoachFreitext.jsx`) an jede Coach-Anfrage angehängt:
- `src/utils/wissensBasis.js` — liest alle `.md`-Dateien unter
  `src/wissen/**/*.md` per `import.meta.glob` (eager, `?raw`) beim Bauen
  der App ein. Ein Unterordner pro Lebensbereich plus `allgemein/` für
  bereichsübergreifende ADHS-Coaching-Themen — aktuell überall nur
  Platzhalter-Inhalte, die die Nutzerin nach und nach durch echtes
  Coaching-Wissen ersetzen will. **Neue `.md`-Datei irgendwo unter
  `src/wissen/` ablegen reicht** — kein Code nötig. Einfache Variante
  bewusst ohne Vektorsuche (kompletter Text aller Dateien wird
  angehängt) — falls der Ordner mal sehr groß wird, muss hier eine
  Auswahl/Suche rein.
- `src/utils/trackingZusammenfassung.js` — aggregierte Trackingdaten
  (Hydration, Training, Schlaf, Ernährung, Peptid-/Hormon-Feedback,
  Check-ins, Profil, Blutwerte) der letzten 2-4 Wochen statt der
  kompletten Rohhistorie.

Wichtig: Die `wissen/`-Dateien sind rein statisches Hintergrundwissen —
die eigentlichen Nutzerinnen-Daten liegen ausschließlich in Supabase. Ein
Browser kann nicht in Projektdateien schreiben.

### Universeller Coach (Home, Tagesplan, Wochenübersicht)

Diese drei Screens sind NICHT auf eine feste Aktion beschränkt, sondern
können alle 7 Aktionen bedienen (Gewohnheit/Supplement/Medikament/
Hydration/Tageslicht/Training/Ernährung anlegen). Mechanik: `KiChat`
bekommt `pruefeBereitschaft` (läuft automatisch nach jeder Coach-Antwort,
liefert erkannten Bereich oder `null` — der "Übernehmen"-Knopf erscheint
erst dann, nicht nach jeder beliebigen Antwort) und `uebernehmenLabels`.
Die komplette Routing-Logik liegt gemeinsam in
`src/data/useUniversellerCoach.js` (Hook, extrahiert aus HomeView, damit
sie nicht dupliziert werden musste).

### Coach-geführtes Onboarding — zwei Phasen + alle Schritte

Nach der Begrüßung (`OnboardingIntroView.jsx`) fragt der Coach, ob er
begleiten soll — bei Begleitung gibt es zwei gleichwertige Varianten:
- **Phase 1 — Frage für Frage** (`OnboardingCoachGuide.jsx`): feste
  Sequenz durch Name/Ziele/Geschlecht/Geburtsdatum/Größe/Startgewicht.
  Die Fragen selbst sind NICHT KI-generiert (Felder fest bekannt), aber
  die Antwort läuft bei Text-/Zahlenfeldern durch
  `feldAntwortInterpretieren()` und wird zur Bestätigung gezeigt. Der
  Coach-Orb selbst ist der Mikrofon-Knopf (kein separater Mikrofon-Button
  mehr).
- **Phase 2 — Frei erzählen** (`OnboardingCoachFreitext.jsx`): die Person
  erzählt frei, `onboardingAusChat()` ordnet am Ende zu. Großer Coach-Orb
  (100px) als visueller Mittelpunkt statt eines Eingabe-Kastens; hat das
  volle "Background Brain" im Systemprompt.

**Orb-Position: fest unten, wie überall sonst in der App.** Beide Orbs
sitzen `position: fixed` unten mittig (`FesterOrb`-Komponente in
`OnboardingCoachFreitext.jsx`, analoges Inline-Markup in
`OnboardingCoachGuide.jsx`) — exakt dieselbe Position wie der
Coach-Trigger in `KiChat.jsx`, NICHT oben im Seiteninhalt. Das war schon
mal falsch verstanden worden (siehe eigener Punkt weiter oben zu "Der KI
Button muss runter") — die Nutzerin meinte eine wörtliche feste
Positionierung, kein Ausrollen auf alle Screens.

Beide Varianten zeigen vor dem Speichern eine
**Bestätigungs-/Vorschau-Ansicht** — erst nach explizitem zweitem Tippen
wird über dieselben Funktionen wie die manuellen Formulare gespeichert.

Auch **Laborwerte** (`OnboardingLaborwerteView.jsx`) und alle **9
Kategorien-Schritte** (`OnboardingCategoriesView.jsx`) haben eine
Coach-Begleitung: der Coach füllt die passenden Felder aus, die Person
bestätigt danach über den normalen Button (Training/Peptide übernehmen
direkt, da diese Schritte schon beim manuellen Antippen sofort
speichern). Jeder Laborwert hat außerdem einen ℹ️-Knopf mit einer
Kurzerklärung übers Lexikon (Relevanz, Zweck, üblicher Referenzbereich,
ohne Diagnose).

### Vor-/Zurück-Pfeile im gesamten Onboarding (Nachtrag 28.07.)

Nutzerinnen-Vorgabe: beim Durchgucken/Bearbeiten der Onboarding-Seiten
nicht mehr komplett raus müssen, sondern Seite für Seite vor und zurück
blättern können — ausdrücklich auch auf den allerersten Seiten
(Welcome-Folien, Hauptprotokoll anlegen, Intro-Begrüßung), die vorher gar
keine Zurück-Option hatten.

Neue geteilte Komponente `src/ui/OnboardingNavArrows.jsx` — eine
Kopfzeile mit „‹ Zurück" links und „Weiter ›" rechts, `onBack`/`onForward`
weglassen blendet die jeweilige Seite aus (z. B. Intro-Auswahlbildschirm
hat drei gleichwertige Optionen statt eines einzelnen „weiter", deshalb
dort kein Pfeil rechts). Eingebaut in **jeden** Onboarding-Screen:
- `WelcomeView.jsx`: Pfeile navigieren jetzt zwischen den 3 Folien (vorher
  nur Punkte + ein "Weiter"-Button ohne Zurück-Möglichkeit).
- `OnboardingFlow.jsx`: `hauptprotokoll`- und `intro`-Phase bekommen jetzt
  ein echtes `onBack` (vorher gab es dort gar keinen Rückweg).
- `HauptprotokollErstellenView.jsx`/`OnboardingIntroView.jsx`: Pfeil
  „Weiter" löst dieselbe Validierung wie der bestehende Haupt-Button aus
  (z. B. Name-Pflichtfeld) — kein Bypass, damit sich nichts an der
  echten Nutzung für neue Konten ändert.
- `OnboardingCoachGuide.jsx`: neue `vorherigerSchritt()`-Funktion für
  Schritt-zurück (vorher nur vorwärts/überspringen möglich).
- `OnboardingCoachFreitext.jsx`, `OnboardingZieleView.jsx`,
  `OnboardingProfilView.jsx`, `OnboardingLaborwerteView.jsx`,
  `OnboardingCategoriesView.jsx`, `OnboardingCompletionView.jsx`: Pfeile
  nutzen dieselben Handler wie die bereits vorhandenen
  Zurück-/Überspringen-Buttons — keine neue Logik, nur eine einheitliche,
  konsistente Bedienung obendrauf.

**ZIELE-Liste ist ADHS-spezifisch** (`constants.js`): acht ADHS-bezogene
Ziele (Fokus & Konzentration, Prokrastination überwinden, Tagesstruktur
aufbauen, Reizüberflutung reduzieren, Zeitgefühl verbessern,
Impulskontrolle stärken, Weniger Overwhelm, Motivation im Alltag) stehen
vor den allgemeinen Gesundheits-/Biohacking-Zielen.

### Sicherheitsmodell (bewusste Entscheidung, bitte beibehalten)

Der Coach kann **niemals** eigenständig etwas speichern — jede Aktion
läuft über: (1) frei chatten, (2) Nutzerin tippt explizit auf einen
"Übernehmen/Anlegen/Setzen"-Knopf, (3) erst dann wird über die ganz
normale App-Funktion (dieselbe, die auch das manuelle Formular aufruft)
gespeichert. Kein direkter Datenbankzugriff durch die KI, kein
Code-Zugriff.

### ⚠️ Gemini-Fallstricke für die Zukunft

1. **Gemini-Modellnamen veralten schnell.** Aktuell konfiguriert:
   `gemini-3.6-flash`. Bei "model not found": aktuelle Modellliste unter
   `ai.google.dev/gemini-api/docs/latest-model` per Web-Suche prüfen,
   nicht raten — die Modellgenerationen wechseln offenbar im
   Monats-/Quartalstakt.
2. **`GEMINI_API_KEY` ist ein Supabase-Secret, keine Vercel-Variable** —
   liegt unter Supabase Dashboard → Edge Functions → Secrets.
3. **`VITE_AI_MODEL`/`VITE_AI_PROVIDER` bei Vercel ändern reicht allein
   nicht** — Vite bäckt diese Variablen beim Build ein, nicht zur
   Laufzeit. Nach jeder Änderung braucht es einen manuellen Redeploy.
4b. **Kostenloses Tageskontingent ist je nach Modell sehr unterschiedlich
   hoch — bei `gemini-3.6-flash` nur 20 Anfragen/Tag** (Nachtrag 30.07.,
   live erlebt: 429 "Quota exceeded" nach einem intensiven Testtag). Ältere/
   kleinere Modelle wie `gemini-3.5-flash-lite` haben laut Google-Dashboard
   das übliche, viel großzügigere Freikontingent (1.500 Anfragen/Tag) — bei
   "model not found"/429-Fehlern also nicht nur den Modellnamen, sondern
   auch das jeweils aktuelle Freikontingent für GENAU dieses Modell prüfen.
   Für eine App, mit der ganztägig gesprochen wird, ist das kostenlose
   Kontingent auf Dauer ohnehin zu knapp — siehe offener Punkt in
   Abschnitt 6 (Nutzerin muss sich noch entscheiden: günstigeres Modell
   oder Abrechnung aktivieren).
4. **Ein über den Supabase-Browser-Editor deployter Funktions-Slug lässt
   sich im Nachhinein nicht umbenennen** — das "Name"-Feld in den
   Function-Settings ändert nur die Anzeige, nicht die echte Adresse
   (passierte schon einmal: die Gemini-Funktion lief monatelang unter
   `clever-worker` statt `gemini-chat`, bis neu deployt wurde). Nur ein
   komplettes Neu-Deployen unter dem gewünschten Namen behebt das.

### Ollama/Groq — weiterhin im Code, aktuell nicht die aktive Konfiguration

- **Ollama**: lokal über Cloudflare Quick Tunnel erreichbar gemacht,
  Adresse ist **ephemeral** (ändert sich bei jedem Neustart). Kein
  Passwort auf Ollama — bewusst akzeptiertes, vorübergehendes
  Sicherheitsrisiko der Nutzerin.
- **Groq**: `supabase/functions/groq-chat/index.ts` ist deployt-fertig,
  aber die Nutzerin kam nicht an einen API-Key (GitHub/Apple-
  Signup-Probleme). Falls später gewünscht: Code ist fertig, nur Key
  besorgen + Secret setzen + `VITE_AI_PROVIDER=groq` setzen.

---

## 4a. Nachtrag 29.07. — alle offenen Punkte aus Abschnitt 6 abgearbeitet

Nutzerinnen-Vorgabe nach einer Bestandsaufnahme ("sind wir jetzt fertig?"):
alle damals noch offenen Lücken "ohne Ausnahme" schließen. Sechs Punkte,
alle bereits Teil des Codes (Deploy für den Erinnerungs-Teil steht noch
aus, siehe Abschnitt 5):

**1. Notfallmodus-Tage werden dokumentiert.** `ADHSModeToggle.jsx` war
rein clientseitiger UI-Zustand. `HomeView.jsx`s `handleToggleEmergencyMode`
ruft jetzt zusätzlich `aenderungVermerken({ kategorie: "notfallmodus",
aktion: "aktiviert"/"beendet", ... })` auf — taucht damit automatisch im
"📖 Tagesverlauf" (`ProtokollLogView.jsx`) auf. Neuer Eintrag in
`KATEGORIE_META` (`dayItems.js`) fürs Icon/die Farbe.

**2. KI an/aus-Schalter unter "Mehr".** Neues Pärchen `getKiAktiv()`/
`saveKiAktiv()` in `coachStorage.js` (localStorage, Default AN). Neue
Karte oben in `MehrTab.jsx` mit Pill-Umschalter. `KiChat.jsx` rendert bei
`!getKiAktiv()` komplett `null` (weder schwebender Orb noch offenes
Fenster) — geprüft sowohl vorm `autoStart`-Mount-Effekt als auch vorm
finalen Render. Betrifft **nur** die KI-Oberfläche; alle manuellen
Formulare bleiben davon komplett unberührt (Leitprinzip).

**3. Erinnerungen jetzt für alle 9 Bereiche** (vorher 5 von 9):
- `src/ui/HydrationErinnerungenCard.jsx` → verallgemeinert zu
  `src/ui/ZeitErinnerungenCard.jsx` (Prop-gesteuert: `kategorie`,
  `labelKey`, optional `mengeLabel`) und für **Tageslicht** und **Schlaf**
  wiederverwendet — beide hatten kein Uhrzeit-Feld, bekommen aber jetzt
  dieselbe frei editierbare Erinnerungszeiten-Liste wie Hydration
  (`profiles.erinnerungen[kategorie].zeiten`, keine neue Migration
  nötig). Eingebaut in `TageslichtView.jsx`, `SchlafView.jsx` UND den
  jeweiligen Onboarding-Kategorie-Schritten.
- **Training** (`training_wochenplan`) und **Ernährung**
  (`meal_wochenplan`) hatten beim genaueren Hinsehen schon jeweils eine
  echte `uhrzeit`-Spalte im Wochenplan — nur nie an `send-due-reminders`
  angeschlossen. Jetzt ergänzt: Wochentag-Abgleich (kein Intervallsystem
  wie bei Peptid/Medikament/Supplement, `training_wochenplan` erlaubt
  ohnehin nur einen Eintrag pro Wochentag) + Vorab-/Nachfass-Erinnerung
  wie bei den anderen Kategorien. Nachfass-Check gegen
  `training_sessions`/`meal_logs` für den jeweiligen Tag.
- **Keine neue Migration nötig** für den kompletten Punkt — alle
  gebrauchten Spalten existierten schon.

**4. Automatische "ausgefallen"-Erfassung.** Neuer
`src/utils/ausgefallenSweep.js`: läuft einmal pro Kalendertag beim Laden
der App (`AppDataContext.jsx`, `useEffect` mit `sweepLaufendRef`-Schutz
gegen doppelte Läufe durch Re-Renders). Nutzt `buildDayItems()`
(`dayItems.js`) — dieselbe Funktion, die auch Tagesplan/Home fürs
Anzeigen von "was steht heute an" verwenden — für jeden Tag zwischen dem
letzten Sweep und heute (auf 14 Tage gedeckelt), statt die "was war
geplant"-Logik ein zweites Mal nachzubauen. Alles mit `done: false` wird
als `aktion: "ausgefallen"` ins Änderungsprotokoll eingetragen, mit
Dedup-Check gegen bereits vorhandene Einträge. **Deckt dieselben 6
Bereiche ab wie `buildDayItems()`**: Peptide, Medikamente, Supplemente,
Mahlzeiten, Gewohnheiten, Training — NICHT Hydration/Tageslicht/Schlaf
(kumulative Tageswerte ohne Einzeltermin). Erster Lauf überhaupt legt nur
die Grundlage, ohne rückwirkend zu fluten.

**5. Wochen-/Monatsstatistik für alle 9 Bereiche.**
`WochenuebersichtView.jsx` hatte nur eine Compliance-Zahl für Peptide/
Hormone zusammen. Neue Karte "Compliance je Bereich" (Ansicht + PDF-
Export):
- Peptide/Medikamente/Supplemente/Gewohnheiten/Mahlzeiten/Training: Tag
  für Tag über `buildDayItems()` gezählt, vom Protokollstart bis
  **heute** (nicht bis Protokollende — sonst würden künftige, noch nicht
  fällige Tage die Quote künstlich drücken). Auf 180 Tage gedeckelt.
- Hydration/Tageslicht: kein Einzeltermin, sondern kumulative
  Tageswerte — hier "an wie vielen Tagen im Zeitraum wurde das Tagesziel
  erreicht".
- Schlaf: kein hinterlegter Zielwert (nur Bettzeit/Aufwachzeit aus dem
  Onboarding, kein Stunden-Ziel) — deshalb Durchschnitt statt Quote.
- Rein aus bereits geladenen Daten berechnet, keine neuen Abfragen.

**6. Korrelationserkennung.** `trackingZusammenfassung.js` bekommt eine
neue `korrelationenErkennen()`-Funktion nach demselben Muster wie das
schon bestehende `trainingsLuecken()` (siehe Abschnitt 4, "Proaktives
Nachfragen bei Trackinglücken"): regelbasiert, keine Statistik/ML. Prüft
über die letzten 7 Tage fünf Bereichspaare (Schlaf×Ernährung,
Schlaf×Training, Schlaf×Hydration, Hydration×Training,
Ernährung×Training) auf gemeinsame "schlechte" Tage — ab 2
überschneidenden Tagen wird es als `Auffälligkeit (Zusammenhänge): ...`
in den KI-Kontext eingespeist, den JEDE Chat-Anfrage ohnehin schon
mitbekommt ("Background Brain"). Der Assistent spricht es dann von sich
aus an, genau wie bei den Trainingslücken — kein neuer Mechanismus
nötig, nur eine neue Erkennungsregel im bestehenden.
"Schlecht"-Schwellen: Schlaf < 6 Std. oder "nicht erholt", Hydration
< 50 % vom Tagesziel, Ernährung = kein bestätigter Eintrag an einem
laut Ernährungsplan tatsächlich belegten Wochentag, Training = laut
`trainingsLuecken()` geplant, aber nicht geloggt.

---

## 4b. Nachtrag 29.07. — Admin-Dashboard ("Verwalten als"-Modus)

**Auftrag der Nutzerin:** Sie will sich als Admin anmelden und Zugriff auf
Profile/Pläne aller Probandinnen und Probanden haben — u. a. um für Leute,
die (noch) nicht selbstständig mit der KI ihren Plan erstellen können (z. B.
ihre Eltern), das Ganze im Hintergrund einzustellen. Die Probandin/der
Proband soll danach nur noch den fertigen Tagesplan auf ihrem/seinem
eigenen Handy abrufen. Erst-Onboarding-Feinheiten (Sport-Istzustand,
Körperkomposition etc.) sind bewusst zurückgestellt — heute zählte nur das
Dashboard selbst.

**Architekturentscheidung — kein Extra-UI, sondern "Verwalten als":** statt
für den Admin ein zweites, eigenständiges UI zum Bearbeiten fremder Profile
zu bauen, schaltet das Dashboard einfach um, FÜR WEN die ganz normale App
gerade Daten lädt/speichert. Jeder Daten-Hook in `AppDataContext.jsx` nahm
`userId` ohnehin schon als Parameter — der Admin klickt "Verwalten" bei
einer Person, und ab dann läuft buchstäblich dieselbe App (Onboarding,
KiChat, alle 9 Kategorien, Wochenübersicht, ...) mit deren `user_id` statt
der eigenen. Dadurch ist "gleiches Design/gleicher Stil" automatisch erfüllt
— es ist dieselbe Komponente, kein Nachbau.

- **`src/context/AdminContext.jsx`** (neu): hält `proband` (`{ id, email,
  vorname } | null`) — null heißt normaler eigener Account. NICHT
  persistiert (kein sessionStorage), damit niemand nach einem Reload aus
  Versehen dauerhaft im fremden Konto hängen bleibt.
- **`src/context/AppDataContext.jsx`**: `userId = proband?.id || user?.id`
  statt nur `user?.id`.
- **`src/App.jsx`**: `AdminProvider` um `Root()` gelegt; `AppDataProvider`
  bekommt `key={proband?.id || "self"}` — erzwingt beim Betreten/Verlassen
  des Verwalten-als-Modus einen kompletten Remount (sonst bliebe z. B. der
  `view`-State von `AuthenticatedApp` oder alter Hook-State hängen).
- **`src/AuthenticatedApp.jsx`**: neuer `view === "admin"` (öffnet
  `AdminDashboardView`), plus ein fest angepinntes grünes Banner ganz oben
  ("Du verwaltest gerade: X — Zurück zum Dashboard"), sichtbar auf JEDEM
  Screen, solange `proband` gesetzt ist — genau die gleiche Lehre wie beim
  Onboarding-Abmelden-Bug vom selben Tag: ein Modus ohne jederzeit
  sichtbaren Ausweg ist ein Bug, kein Feature.
- **`src/views/admin/AdminDashboardView.jsx`** (neu): Liste aller Konten
  (Name/E-Mail, Badge "Eingerichtet"/"Onboarding offen", Admin-Badge),
  Suche, "Verwalten"-Knopf pro Zeile, "+ Neuen Zugang anlegen"-Formular.
- **`src/views/plan/MehrTab.jsx`**: neuer "Admin-Dashboard"-Eintrag, nur
  sichtbar wenn `appData.isAdmin` true ist (aus `useProfileData.js`, liest
  `profiles.is_admin`).

**Datenbank (`supabase/migrations/0035_admin_dashboard.sql` — ✅ deployt):**
- `profiles.is_admin boolean default false`, `profiles.vorname text`.
- `public.is_admin(uid)` — Hilfsfunktion.
- `public.admin_liste_probanden()` — liefert die Probandenliste inkl.
  E-Mail (liegt in `auth.users`, das der Browser nicht direkt lesen darf).
- Pro Tabelle (alle ~35 mit `user_id`-Spalte) EINE zusätzliche, rein
  additive RLS-Policy `"<tabelle>: admin voller Zugriff"`. Die
  bestehenden "eigene Zeilen"-Policies bleiben unverändert — mehrere
  permissive Policies für denselben Befehl verknüpfen sich in Postgres
  automatisch per OR. Reines Hinzufügen, kein Risiko für bestehende
  Nutzer:innen.

**Edge Function `supabase/functions/admin-create-proband/index.ts` — ✅
deployt:** legt aus dem Dashboard heraus ein neues Konto an
(service-role-basiert). Wichtig: ein normales `supabase.auth.signUp()` im
Browser hätte die eigene Admin-Session durch die neue ersetzt — deshalb
läuft das Anlegen serverseitig mit dem (automatisch bereitstehenden)
`SUPABASE_SERVICE_ROLE_KEY`, ohne die Admin-Session zu berühren. Prüft
selbst, ob die aufrufende Person Admin ist, bevor sie irgendwas anlegt.

**⚠️ Für die Nutzerin — zwei Deploy-Schritte, bevor das Dashboard nutzbar
ist** (wie beim `send-due-reminders`-Deploy: SQL Editor bzw. Edge Functions
im Supabase-Dashboard, kein Terminal nötig):
1. Migration `0035_admin_dashboard.sql` im Supabase-Dashboard unter
   "SQL Editor" einmal komplett einfügen und ausführen (Inhalt von GitHub
   kopieren, wie beim letzten Mal).
2. Neue Edge Function `admin-create-proband` im Dashboard unter
   "Edge Functions" → "Deploy a new function" mit dem Inhalt von
   `supabase/functions/admin-create-proband/index.ts` anlegen.
3. Sich selbst zur Admin machen — im SQL Editor einmalig (E-Mail-Adresse
   anpassen):
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'DEINE-E-MAIL@...');
   ```
   Danach Seite neu laden — unter "Mehr" erscheint "Admin-Dashboard".

**Bewusst zurückgestellt (nächster Schritt, nicht heute):** die im
Onboarding erwähnten Detailfragen zum Sport-Istzustand/Körperkomposition
sind noch nicht eingebaut — sobald das Dashboard steht, kann das als
zusätzlicher Onboarding-Schritt nachgezogen werden. Push-Erinnerungen sind
geräte-, nicht kontogebunden — wenn der Admin während der Verwaltung fremd
"Push aktivieren" drückt, würden Erinnerungen an SEIN Gerät gehen statt an
das der Probandin/des Probanden; das UI verhindert das nicht aktiv, der
Admin muss es einfach nicht anklicken (kein Automatismus, der es versehentlich auslöst).

**Status:** Migration 0035 + Edge Function `admin-create-proband` sind von
der Nutzerin deployt und bestätigt (`is_admin` gesetzt, Dashboard sichtbar).

---

## 4c. Nachtrag 29.07. — Admin-Hinweise über den Assistenten zustellen

**Auftrag der Nutzerin:** Aka soll sich wie "ihr Mitarbeiter am Kunden"
verhalten — sie will ihm Dinge mitgeben können ("beim nächsten Mal die
Übung X erklären"), oder eine Nachricht hinterlassen, die die Person nach
der nächsten Aktion in einem Bereich bekommt. Explizit NICHT als separates
"Nachricht vom Admin"-Postfach — es soll wirken, als käme es natürlich von
Aka selbst.

**Zwei Modi, beide über `admin_notizen` (Migration
`0036_admin_notizen.sql` — ✅ deployt):**
- **`kontext`** — Hintergrundwissen, fließt bei JEDER Chat-Anfrage im
  passenden Bereich in den ohnehin schon bestehenden "Background
  Brain"-Kontext ein (`KiChat.jsx`, `hintergrundKontext`, direkt neben
  `wissensBasisText()`/`trackingZusammenfassung()`). Bleibt aktiv, bis der
  Admin es im Dashboard löscht — wird der Person NIE wörtlich gezeigt, der
  Assistent bekommt nur die Anweisung "natürlich einbauen, nicht als
  Hinweis ankündigen".
- **`nachricht`** — wird als eigene Coach-Nachricht zugestellt, sobald die
  Person den Chat im gewählten Bereich (oder bereichsübergreifend, falls
  kein Bereich gewählt) das nächste Mal öffnet. Umgesetzt in
  `useCoachVerlauf.js`: `coachVerlaufLaden(bereich)` prüft vor dem Laden
  des Verlaufs erst auf offene Nachrichten, schreibt sie als ganz normale
  `coach_nachrichten`-Zeile (rolle "coach") und markiert sie als
  zugestellt — dadurch taucht die Nachricht 1:1 wie eine normale Antwort
  von Aka im Chat auf, keine Sonderbehandlung in der Anzeige nötig.

Funktioniert unabhängig davon, ob der Admin gerade "verwaltet" oder die
Person später selbst mit ihrem eigenen Konto den Chat öffnet — beide Male
läuft dieselbe `userId`-basierte Logik.

**Neu in `src/views/admin/AdminDashboardView.jsx`:** pro Proband ein
"Hinweis"-Knopf neben "Verwalten" (kein Wechsel ins fremde Konto nötig für
eine schnelle Notiz) — öffnet ein Panel mit Bereichs-Auswahl (die 10
Bereiche, in denen KiChat tatsächlich mit `bereich="..."` läuft, siehe
Konstante `BEREICH_OPTIONEN`), Modus (Nachricht/Hintergrund), Textfeld,
plus eine Liste bisheriger Hinweise mit Zustellstatus (offen/zugestellt)
und Löschen-Knopf.

**Datenschutz/Rechte:** eigene RLS-Policies (nicht die additive
Admin-Policy aus 0035, sondern eigens definiert) — die Probandin/der
Proband darf die eigenen Notizen nur LESEN und als "zugestellt"
markieren, NICHT selbst welche anlegen oder löschen. Nur der Admin kann
schreiben/löschen (über `is_admin(auth.uid())`, dieselbe Hilfsfunktion
wie in 0035).

**✅ Deployt (29.07.).** Migration `0036_admin_notizen.sql` ist von der
Nutzerin über das Supabase-Dashboard ausgeführt worden.

---

## 4d. Nachtrag 29.07. — Spotify-Anbindung (Grundlage für "geführte Morgenroutine")

**Auftrag der Nutzerin:** Aka soll morgens wecken, direkt die Playlist
starten und dann per Sprache durch die Morgenroutine führen (Getränk,
Supplemente, Sonnenlicht, Training-Start), mit Wartezeiten und Nachfragen
dazwischen — perspektivisch auch für Abendroutine/Training. Heute nur die
Spotify-Anbindung selbst; die eigentliche geführte Routine (Timer,
Sprachführung durch die Schritte) ist der nächste Schritt.

**Wichtige technische Grenze, ehrlich kommuniziert:** eine Web-App wie AKA
kann NICHT von selbst Ton abspielen oder "aufwachen", während das Handy
gesperrt ist oder die App geschlossen ist — das verbietet iOS/Android jeder
Web-App aus Akku-/Datenschutzgründen, unabhängig vom Code. Die Weckzeit
läuft über eine Push-Benachrichtigung (Mechanismus existiert bereits, siehe
Abschnitt 5), die Nutzerin tippt einmal drauf zum Aufwachen — AB DIESEM
MOMENT kann Aka vollautomatisch übernehmen (Musik, Ansagen, Timing).
Zusätzlich Voraussetzung: Spotify PREMIUM (Wiedergabe-Steuerung per API
funktioniert nur damit, hat die Nutzerin bestätigt) und die Spotify-App
muss auf dem Handy zumindest kürzlich geöffnet gewesen sein (sonst kein
"aktives Wiedergabegerät", Fehler 404 von Spotify).

**Umsetzung (OAuth Authorization-Code-Flow):**
- `supabase/migrations/0037_spotify_verbindung.sql` — ✅ deployt. Neue
  Tabelle `spotify_verbindung` (user_id, refresh_token, access_token,
  token_laeuft_ab, playlist_uri) mit eigener Zeile-Policy + Admin-Bypass
  (Admin kann die Verbindung auch im "Verwalten als"-Modus für eine
  Probandin/einen Probanden herstellen/pflegen).
- `supabase/functions/spotify-auth-callback/index.ts` — ✅ deployt.
  Tauscht den OAuth-Code gegen Access-/Refresh-Token (braucht
  `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` als Edge-Function-Secrets,
  Secret NIE im Browser).
- `supabase/functions/spotify-play/index.ts` — ✅ deployt. Erneuert das
  Access-Token bei Bedarf und startet die hinterlegte Playlist über die
  Spotify-Web-API.
- `src/services/spotify.js` — baut die Spotify-Autorisierungs-URL
  (`VITE_SPOTIFY_CLIENT_ID`, neue öffentliche Env-Var, siehe
  `.env.example`), ruft die Edge Functions auf, normalisiert
  Playlist-Links (`open.spotify.com/playlist/...` → `spotify:playlist:...`).
- `src/data/useSpotifyVerbindung.js` + `AppDataContext.jsx` — Status/
  Playlist/Testabspielen, nach demselben `userId`-Muster wie alle anderen
  Daten-Hooks (funktioniert dadurch automatisch auch im "Verwalten
  als"-Modus).
- `AuthenticatedApp.jsx` — fängt die Rückkehr von `accounts.spotify.com`
  ab (`?code=...&state=aka_spotify_connect` in der URL), tauscht den Code,
  räumt die URL auf, landet danach automatisch wieder bei "Mehr".
- Neue Karte "Musik (Spotify)" in `MehrTab.jsx`: Verbinden-Knopf, nach
  Verbindung Playlist-Link einfügen + speichern + "Jetzt testen"-Knopf +
  Trennen-Knopf.

**⚠️ Für die Nutzerin — mehrere Schritte, bevor es nutzbar ist:**
1. Auf [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   mit dem Spotify-Konto einloggen, "Create app" — beliebiger Name/
   Beschreibung.
2. Bei "Redirect URIs" die echte Produktions-URL der App eintragen (die,
   unter der die App im Browser erreichbar ist, z. B.
   `https://deine-domain.vercel.app/`) — muss exakt passen, inkl. `/` am
   Ende.
3. In den App-Einstellungen "Client ID" und "Client secret" kopieren.
4. Client ID: als `VITE_SPOTIFY_CLIENT_ID` bei Vercel unter
   Environment Variables eintragen (Projekt-Einstellungen → Environment
   Variables) UND als Secret `SPOTIFY_CLIENT_ID` bei den Edge Functions
   `spotify-auth-callback` und `spotify-play` hinterlegen.
5. Client secret: NUR als Secret `SPOTIFY_CLIENT_SECRET` bei denselben
   beiden Edge Functions hinterlegen — nirgends sonst.
6. Migration `0037_spotify_verbindung.sql` im SQL Editor ausführen.
7. Beide Edge Functions deployen (gleiches Vorgehen wie bei
   `admin-create-proband`).
8. Nach Vercel-Neubau: unter "Mehr" → "Musik (Spotify)" → "Mit Spotify
   verbinden".

**✅ Deployt (29.07.).** Die Nutzerin hat verbunden, es funktioniert.

### Nachtrag 29.07., direkt danach — mehrere benannte Playlists + Aka löst sie im Gespräch selbst aus

Erster Live-Test zeigte: die Spotify-Verbindung selbst lief, aber Aka
konnte im Chat nichts damit anfangen ("ich hab keinen Zugriff") — die
Wiedergabe existierte bisher nur als manueller Knopf unter "Mehr", nicht
als etwas, das der Assistent selbst auslösen kann. Zusätzlicher Wunsch:
mehrere Playlists (Morgen, Abend/Chillen, Notfallmodus/Erholung, Training,
Arbeit/Workflow, ...), OHNE feste Kategorien im Code — Aka soll frei
zuordnen, welche Playlist zu einer Bitte passt.

- `supabase/migrations/0038_spotify_playlists.sql` — ✅ deployt. Neue
  Tabelle `spotify_playlists` (user_id, name, uri) statt der bisherigen
  einzelnen `playlist_uri`-Spalte — beliebig viele, frei benannt.
- `src/data/useSpotifyVerbindung.js` — erweitert um
  `spotifyPlaylists`/`spotifyPlaylistHinzufuegen`/`spotifyPlaylistLoeschen`;
  `spotifyAbspielen(uri)` nimmt jetzt optional eine konkrete Playlist-URI
  entgegen (Edge Function `spotify-play` unterstützte das `playlistUri`-Feld
  bereits, brauchte keine Änderung).
- **`src/ui/KiChat.jsx` — das eigentliche Herzstück:** die Namen aller
  gespeicherten Playlists fließen als Kontext in JEDE Coach-Anfrage ein
  (gleicher Mechanismus wie die Admin-Hinweise, Abschnitt 4c), mit der
  Anweisung, bei einer passenden Bitte (auch sinngemäß wie "ich brauch was
  zum Runterkommen") GENAU EINMAL einen Marker `[[SPOTIFY_PLAY:<Name>]]`
  in die Antwort zu schreiben. `senden()` erkennt den Marker per Regex,
  entfernt ihn aus dem angezeigten/vorgelesenen Text (die Person sieht ihn
  nie), löst darüber die Wiedergabe der passenden Playlist aus und zeigt
  bei Fehlschlag (z. B. kein aktives Spotify-Gerät) einen kurzen Hinweis.
  Bewusst kein "echtes" KI-Tool-Calling, weil das je nach Provider
  (Groq/Gemini/Ollama) uneinheitlich unterstützt wird — der Marker-Trick
  ist provider-unabhängig und reiht sich in denselben Chat-Text ein.
- `src/views/plan/MehrTab.jsx` — Playlist-Verwaltung umgebaut: Liste
  bestehender Playlists (Name, Testen-Knopf, Löschen), Formular für neue
  Playlist (Name + Spotify-Link).

**✅ Deployt (29.07.).** Migration `0038_spotify_playlists.sql` ist
ausgeführt, mehrere Playlists angelegt und im Gespräch mit Aka erfolgreich
getestet (Playlist wurde per Marker erkannt und abgespielt).

**Nächster Schritt (noch nicht begonnen), explizit von der Nutzerin
gewünscht:** ein echter Wecker im Schlaf-Bereich mit Playlist-Auswahl
("zum Wecker geweckt werden mit Playlist X"), und darauf aufbauend die
eigentliche geführte Morgenroutine — Weckzeit als Push-Erinnerung, die
beim Antippen direkt in einen neuen Ablauf-Screen führt, der die vorher
mit Aka geplanten Schritte per Sprache durchgeht (Musik läuft im
Hintergrund weiter, Ansagen, Wartezeiten abzählen, Nachfragen wie "schon
ausgetrunken?", Abschluss "wir hören uns bei der Medigabe"). Perspektivisch
dieselbe Struktur für Abend-/Trainingsroutine.

### Zwischenlösung: iOS-Kurzbefehl statt App-Funktion (Nachtrag 29.07.)

Bis der echte Wecker gebaut ist, testet die Nutzerin einen **iOS-
Kurzbefehl** (Shortcuts-App) als Übergangslösung: eine "Persönliche
Automation" mit Auslöser "Uhrzeit" (täglich, Weckzeit), Aktion "URLs
öffnen" mit dem kopierten Spotify-Playlist-Link, "Vor dem Ausführen
fragen" ausgeschaltet. Läuft komplett außerhalb von AKA — kein Code
in diesem Repo, keine Rückwirkung auf die App. Drei Stolpersteine, die
ihr mitgegeben wurden: (1) das ist normale Musikwiedergabe, kein
iOS-Alarmton — bei Stummschaltung/leiser Lautstärke bleibt es leise,
anders als ein echter Wecker; (2) Spotify-App muss in den letzten Tagen
mal geöffnet gewesen sein, sonst "kein aktives Gerät" wie beim
"Testen"-Knopf in der App; (3) **live erlebt in der Nacht 30./31.07.:
Spotify spielt nach dem automatischen Öffnen NICHT von selbst los** —
anders als Apple Music unterstützt Spotify kein echtes Autoplay über
geöffnete Links/Shortcuts, das ist eine bekannte, dokumentierte
Spotify-Einschränkung (viele Berichte in der Spotify-Community, kein
Fehler im Kurzbefehl-Aufbau). Der Kurzbefehl bringt die Nutzerin also
morgens automatisch bis zur richtigen Playlist, ein letzter manueller
Play-Tap bleibt aber nötig. Ein community-bekannter Trick (`&context=
spotify:playlist:<ID>` an den Link anhängen) wurde als Versuch
mitgegeben, gilt aber als unzuverlässig (Spotify hat das nach
App-Updates wiederholt abgeschaltet) — nicht verlässlich genug, um
sich darauf zu verlassen. Der einzige wirklich zuverlässige Weg zu
echtem Autoplay bleibt der Smart-Speaker-Weg (Echo Dot + Alexa-Routine,
siehe "Vertiefung: Smart Speaker als Zielbild" weiter unten) — dort
sendet Alexa einen echten Wiedergabe-Befehl statt nur die App zu öffnen.

### Diskussion: "Wie Alexa" — native App vs. PWA (Nachtrag 29.07.)

Nutzerin-Frage: kann Aka Spotify irgendwann so bedienen wie ein Amazon-
Echo/Alexa? Eingeordnet:
- **Offline-Downloads helfen nicht** — die betreffen nur "Songs ohne
  Internet abspielbar", nicht die "aktives Gerät"-Regel von Spotify.
- **Der eigentliche Weg dahin wäre eine echte native App** statt einer
  zum Homescreen hinzugefügten Website (PWA) — mit Zugriff auf Spotifys
  eigenes App-SDK statt der eingeschränkten Web-API und auf iOS'
  Hintergrund-Mechanismen. Deutlich größeres Projekt (Apple-
  Entwickler-Konto, eigene App-Entwicklung, TestFlight oder App Store) —
  bewusst NICHT begonnen, nur als Vision im Hinterkopf behalten.
- **Schneller Zwischenweg, falls die Nutzerin einen Smart Speaker
  (Echo/Nest/Sonos mit Spotify Connect) im Schlafzimmer hat oder sich
  zulegt:** der bleibt technisch dauerhaft "aktives Gerät" bei Spotify
  (anders als ein schlafendes Handy) — Aka könnte darüber schon HEUTE mit
  dem bestehenden `spotify-play` zuverlässig Musik starten, ganz ohne
  neue Entwicklung. Empfehlung an die Nutzerin: das zuerst probieren,
  bevor über eine native App nachgedacht wird.

### Vertiefung: Smart Speaker als Zielbild statt iOS-Kurzbefehl (Nachtrag 30.07.)

Direkt im Anschluss an den iOS-Kurzbefehl-Test (siehe unten) wollte die
Nutzerin genauer wissen, wie eine "wie Alexa"-Lösung konkret aussehen
würde — explizit **kostengünstig, ohne Lizenz-/Zertifizierungsaufwand**,
und **plattformunabhängig** (auch für Probandinnen/Probanden ohne iOS,
z. B. ihre Eltern). Wichtige Klarstellung, zweigeteilt:

1. **"Aka, starte meine Playlist" mitten im Gespräch** funktioniert
   bereits heute — das ist genau der Marker-Mechanismus aus 4d oben,
   solange irgendein Spotify-"aktives Gerät" existiert.
2. **Automatisch beim Aufwachen, ohne jede Interaktion** — das kann
   grundsätzlich **kein** Anbieter aus einer Web-App/PWA heraus lösen
   (Spotifys "aktives Gerät"-Regel, s. o.), auch nicht mit mehr Code.
   Alexa-Lautsprecher lösen das nur, weil der Lautsprecher SELBST
   permanent ein aktives Gerät ist.

**Empfohlener, günstigster Weg — Echo Dot + Alexa-Routine (kein
Entwickler-/Lizenzaufwand):**
- Hardware: **Amazon Echo Dot (5. Generation)**, ca. 38–40 € — aktuell
  klar günstiger/verfügbarer als die Google-Alternative (Google Nest Mini
  ist eingestellt worden, nur noch Restbestände zu 99–140 €).
- Ablauf: Echo Dot per Alexa-App einrichten → **Einstellungen → Musik &
  Podcasts → Standard-Musikdienst → Spotify verknüpfen** (normaler
  Endnutzer-Login mit dem Premium-Konto, KEIN Entwicklerkonto nötig) →
  in der Alexa-App eine **Routine** anlegen (Auslöser Uhrzeit 06:15
  täglich → Aktion "Spotify abspielen: <Playlist>" auf dem Echo Dot).
  Läuft danach vollautomatisch, ohne dass Aka oder die Nutzerin
  irgendwas tun müssen — in diesem Szenario startet **Alexa** die Musik,
  nicht Aka.
- Das ist bewusst NICHT dasselbe wie "Aka steuert den Lautsprecher" —
  falls das später zusätzlich gewünscht wird (Aka spricht den Lautsprecher
  per Chat-Befehl gezielt an), bräuchte es eine eigene Alexa-Skill
  (kostenloses Amazon-Entwicklerkonto + Skill-Code). Wichtig für die
  Kostenfrage: Für **reine Privatnutzung** (nur die Nutzerin selbst bzw.
  eingeladene Test-Probandinnen/-Probanden) ist **keine öffentliche
  Zertifizierung** bei Amazon nötig — eine Skill kann dauerhaft im
  Entwicklungsmodus bleiben. Deutlich mehr Aufwand als die reine
  Routine oben, deshalb bewusst als möglicher, aber nicht begonnener
  nächster Schritt eingeordnet.
- **Plattformfrage (Android-Probandinnen/-Probanden):** keine
  Universallösung — jede Plattform bräuchte ihren eigenen
  Automatisierungsweg (Android-Äquivalent wäre z. B. "Tasker"). Noch
  nicht weiter untersucht, nur als bekannte Lücke vermerkt.

**Stand iOS-Kurzbefehl (parallel dazu, 30.07.):** Die Aktion "URLs
öffnen" ist nach mehreren erfolglosen Direktsuchen (Suche nach
"URL"/"Safari"/"Spotify" lieferte in dieser Shortcuts-Installation
durchgehend keine Treffer) über den Umweg **Suche nach "Öffnen" →
komplette Ergebnisliste durchscrollen** gefunden worden (lag unter
Safari-Aktionen). Automation "15 Minuten vor Sonnenaufgang, täglich"
(bewusst Sonnenaufgang statt fester Uhrzeit, Nutzerinnen-Entscheidung)
war zuletzt kurz davor, mit dem Playlist-Link befüllt zu werden — im
nächsten Gespräch ggf. nachfragen, ob das fertiggestellt wurde.

---

## 4e. Nachtrag 29.07. — Politur-Runde (UI-Fixes, Logo/Icon, Größen)

Sammel-Nachtrag für kleinere Korrekturen im Laufe des Tages, jede einzeln
von der Nutzerin gemeldet und noch am selben Tag behoben:

- **Onboarding-Abmelden-Fix** siehe Nachtrag bei den Willkommens-Folien
  (Abschnitt 3) — Erst-Onboarding hatte keinen Ausweg, wenn nicht in
  einem Zug durchlaufen.
- **Aka-Orb (schwebender Chat-Auslöser, `KiChat.jsx`) verdeckte
  Karteninhalt:** erst nach rechts unten verschoben, dann auf
  ausdrücklichen Wunsch der Nutzerin wieder MITTIG unten (Referenz:
  zentriertes Sprachassistenten-Overlay bei Gemini) — stattdessen bekommt
  jede Seite (`Shell` in `primitives.jsx`) jetzt unten zusätzlichen
  Freiraum (`padding-bottom` erhöht), damit zumindest der letzte
  Karteninhalt nicht mehr dauerhaft verdeckt wird.
- **"Wochenübersicht"-Reiter in "Alle Pläne" (`PlaeneView.jsx`) wurde beim
  Anwählen unsichtbar:** Hintergrund UND Text fielen beide auf denselben
  fehlenden Farbwert zurück (weißer Text auf weißem Grund). Zwei Runden:
  erst Fallback auf die generische Akzentfarbe (behob die Unsichtbarkeit),
  dann eigene Slate-Farbe (`#64748B`), weil die Akzentfarbe bereits fest
  an "Peptide" vergeben war und beide Reiter sonst gleich aussahen.
- **Peptide hatte versehentlich dieselbe Farbe wie die generische
  Marken-Akzentfarbe** (`utils/dayItems.js`, `KATEGORIE_META.peptid`) —
  Rest eines alten Kommentars ("Peptide = Marken-Grün"), der beim
  Indigo-Redesign nicht mehr umgesetzt wurde. Jetzt eigenständiges Grün
  (`dot: "#4F9153"`), wirkt sich global überall aus, wo die Peptide-
  Bereichsfarbe verwendet wird.
- **"Routinen" in "Alle Pläne" ergänzt und nach oben verschoben:**
  Gewohnheiten war vorher nur über die Home-Kachel erreichbar. Neuer
  Abschnitt "Routinen" (Listen-Button-Stil, aktuell ein Eintrag
  "Gewohnheiten", später erweiterbar um Morgen-/Abendroutine) — auf
  Nutzerinnen-Wunsch VOR der 9er-Reiter-Zeile "Pläne", nicht dahinter
  (Priorität).
- **Neues Logo + App-Icon:** von der Nutzerin ausgewählte, eigens
  gestaltete Motive (Gehirn-Symbol) ersetzen den bisherigen Ring-
  Schriftzug — `public/logo-mark.png` (Header/Login, über `Logo.jsx`)
  sowie `public/icons/icon-192.png` / `icon-512.png` /
  `apple-touch-icon.png` (Homescreen-Symbol). Aus Screenshots
  zugeschnitten (Python/Pillow, Bounding-Box-Erkennung), Bildschärfe
  entsprechend etwas weicher als ein echter Export — bei Bedarf später
  mit einer schärferen Quelle nachziehen. **Wichtig für die Nutzerin:**
  ein bereits vorhandenes Homescreen-Symbol aktualisiert sich nicht von
  selbst — altes Symbol löschen und über Safari neu "Zum Home-Bildschirm"
  hinzufügen.
- **Logo/Schriftzug/Begrüßung vergrößert:** `ViewHeader.jsx` (Logo
  30→38, Titel 15→16), `LoginView.jsx` (Logo 64→84, "AKA" 22→28,
  Untertitel 13→14.5), `HomeView.jsx` (Logo 40→52, "AKA" 16→19,
  Begrüßung 16→18, Überschrift 22→24).
- **Bugfix: Aka wiederholte bei jedem Öffnen das alte Gespräch.** Bisher
  wurde beim Öffnen automatisch die letzte gespeicherte Coach-Nachricht
  vorgelesen/prominent gezeigt ("damit man weiß, wo man stand") —
  Nutzerin empfand das als "fängt immer wieder mit dem alten Thema an"
  und musste Aka jedes Mal unterbrechen. `KiChat.jsx`: neuer
  `altVerlaufBisRef` markiert, wie viele Nachrichten beim Öffnen aus
  früheren Sitzungen bereits geladen waren — die große Anzeige, das
  automatische Vorlesen und der "Übernehmen"-Knopf reagieren jetzt nur
  noch auf das, was in der AKTUELLEN Sitzung neu dazukommt. Der volle
  Verlauf lädt weiterhin (Klapp-Verlauf + KI-Gedächtnis über die Zeit),
  treibt aber die prominente Anzeige nicht mehr.
- **Bugfix: Edge-Function-Fehlermeldungen kamen im Client nie an.**
  `supabase-js` verschluckt bei jedem Nicht-2xx-Status den JSON-Body
  ("Edge Function returned a non-2xx status code" statt der echten
  Meldung) — betraf `admin-create-proband`, `spotify-auth-callback`,
  `spotify-play`. Alle drei geben erwartete/behandelte Fehler jetzt mit
  HTTP 200 + `{ error }` im Body zurück; das Frontend unterschied ohnehin
  schon per `data.error`, nicht per Status. **Bereits redeployt von der
  Nutzerin.**

---

## 4f. Nachtrag 30.07. — Cloud-Sprachausgabe (Google Cloud TTS) statt robotischer Browser-Stimme

**Auslöser:** Ein Gemini-Kontingent-Fehler (429, "You exceeded your current
quota" — das kostenlose Kontingent von `gemini-3.6-flash` liegt bei nur 20
Anfragen/Tag, dazu mehr unten) führte zur Frage der Nutzerin nach besseren
kostenpflichtigen Modellen — dabei kam heraus, dass ihre eigentliche
Unzufriedenheit weniger den Text-Antworten galt, sondern der **Stimme**
("noch sehr robotisch"). Wichtige Klarstellung, die in diesem Gespräch
herausgearbeitet wurde: **Die Stimme hat nichts mit dem Gemini-Modell zu
tun** — sie kam bisher komplett separat von der geräteeigenen Browser-
Sprachausgabe (Web Speech API), unabhängig davon, welches KI-Modell den Text
liefert.

**Umsetzung — Google Cloud Text-to-Speech (WaveNet-Stimme) gewählt, nicht
ElevenLabs:** deutlich natürlicher als die Browser-Stimme, und bei
Ein-Personen-Nutzung voraussichtlich im oder nur knapp über dem kostenlosen
Kontingent (1 Mio. Zeichen/Monat gratis bei WaveNet-Stimmen, danach nur 4 €
pro weitere Million Zeichen) — ElevenLabs klingt zwar noch etwas natürlicher,
kostet aber bei täglicher Nutzung schon spürbar mehr (Schätzung damals: eher
20-25 €/Monat). Bei Bedarf später als Zweitschritt nachrüstbar, falls die
WaveNet-Stimme der Nutzerin nicht reicht.

**Architektur — automatischer, lückenloser Rückfall auf die alte
Browser-Stimme:** `src/utils/speech.js` behält seine öffentliche
Schnittstelle exakt bei (`sprich(text, { onEnde })`,
`sprachausgabeStoppen()`, `sprachausgabeVerfuegbar()`) — kein Aufrufer in
`KiChat.jsx`/den Onboarding-Screens musste angepasst werden. Intern probiert
`sprich()` zuerst die neue Cloud-Sprachausgabe; schlägt sie aus irgendeinem
Grund fehl (Funktion noch nicht deployt, kein Netz, Google-Fehler, nicht
angemeldet, ...), fängt ein `.catch()` das ab und spielt denselben Text
stattdessen komplett über die alte, bisherige Web-Speech-Logik ab. Die App
ist dadurch **schon vor dem Deploy** (unten) genauso nutzbar wie bisher —
nichts wird stummer oder bricht, es klingt nur so lange weiter wie vorher,
bis der Deploy-Schritt erledigt ist.

- **`supabase/functions/text-to-speech/index.ts`** (neu) — reiner
  Durchreicher zu Googles `text:synthesize`-Endpunkt (gleiches Muster wie
  `gemini-chat`), `GOOGLE_TTS_API_KEY` nur serverseitig als Secret. Stimme
  fest im Code als `STIMME = "de-DE-Wavenet-F"` hinterlegt (leicht änderbar,
  Google bietet `de-DE-Wavenet-A` bis `-F` mit unterschiedlichen
  Klangfarben).
- **`src/utils/speech.js`** — `cloudSprich()` teilt lange Antworten in
  Textblöcke (max. 800 Zeichen, an Satzgrenzen) auf, ruft die Edge Function
  Block für Block auf und spielt jeden Block als `Audio`-Objekt
  (Data-URI aus dem von Google gelieferten Base64-MP3) nacheinander ab —
  damit ist die Antwort schneller hörbar, als wenn erst der komplette,
  oft längere Text auf einmal synthetisiert werden müsste. Ein interner
  `generation`-Zähler ersetzt das bei Web Speech eingebaute automatische
  "neu spricht = alt wird sofort verworfen"-Verhalten, damit Barge-in
  (eigenes Sprechen/erneutes Antippen des Orbs unterbricht sofort) auch bei
  einer noch laufenden Cloud-Anfrage zuverlässig funktioniert.
- Keine Änderung an `KiChat.jsx` oder den Onboarding-Screens nötig — die
  nutzen ausschließlich die unveränderte öffentliche Schnittstelle.

**⚠️ Für die Nutzerin — Deploy-Schritte, bevor die neue Stimme aktiv ist:**
1. In der [Google Cloud Console](https://console.cloud.google.com/) (mit
   demselben Google-Konto wie für Gemini, oder einem neuen Projekt) die
   **"Cloud Text-to-Speech API"** aktivieren (Suchfeld oben, "API aktivieren").
2. Unter "APIs & Dienste" → "Anmeldedaten" einen neuen **API-Schlüssel**
   erstellen. Empfehlenswert (nicht zwingend): den Schlüssel auf die
   Text-to-Speech-API einschränken ("Schlüssel einschränken" →
   "Cloud Text-to-Speech API"), damit er für nichts anderes missbraucht
   werden kann, falls er je durchsickert.
3. Damit das Kostenlos-Kontingent überhaupt greift, muss für das
   Google-Cloud-Projekt eine **Abrechnung/Zahlungsmethode** hinterlegt sein
   (wie bei den meisten Google-Cloud-Diensten) — ohne Abrechnung funktioniert
   die API gar nicht, auch nicht innerhalb des Freikontingents. Das ist
   normal und bedeutet nicht automatisch Kosten, solange man unter der
   Freigrenze bleibt.
4. Den API-Schlüssel als Secret `GOOGLE_TTS_API_KEY` bei der Edge Function
   `text-to-speech` hinterlegen (Supabase Dashboard → Edge Functions →
   `text-to-speech` → Secrets — die Funktion selbst muss dafür erst einmal
   angelegt/deployt sein, siehe nächster Punkt).
5. Neue Edge Function `text-to-speech` im Supabase-Dashboard unter
   "Edge Functions" → "Deploy a new function" mit dem Inhalt von
   `supabase/functions/text-to-speech/index.ts` anlegen.
6. Kein Vercel-Schritt nötig (keine neue `VITE_...`-Variable) — sobald die
   Edge Function + das Secret stehen, greift die neue Stimme beim nächsten
   Öffnen der App automatisch.

**Noch nicht umgesetzt/geprüft (bewusst zurückgestellt):**
- Keine Stimmauswahl in der UI (Stimme ist fest im Code hinterlegt) — bei
  Bedarf leicht nachrüstbar (Pill-Auswahl unter "Mehr", analog zum
  Sprachgeschwindigkeits-Wunsch der Nutzerin).
- **Sprechgeschwindigkeit** wurde von der Nutzerin explizit mitgenannt
  ("Sprichgeschwindigkeit ... gefällt mir nicht"), aber noch nicht separat
  einstellbar gemacht — Google Cloud TTS unterstützt `speakingRate` als
  Parameter (0.25-4.0), aktuell nicht gesetzt (= Standardgeschwindigkeit
  1.0). Falls die Nutzerin nach dem Testen der neuen Stimme immer noch zu
  schnell/langsam findet: einfacher Folgeschritt (Parameter in der Edge
  Function ergänzen, optional als Regler unter "Mehr").
- Kein Live-Test möglich in dieser Sandbox (kein Netzwerkzugriff auf
  Supabase/Google) — Verifikation nur über Rückmeldung der Nutzerin nach
  dem Deploy.

### 🔴 Live-Stand des Deploys, Nacht 30./31.07. — HIER GEHT ES MORGEN WEITER

Die Nutzerin ist mitten im Deploy-Schritt 1-4 oben, live per Screenshots
durch die Google Cloud Console begleitet. Genauer Stand:

- ✅ Google-Cloud-Projekt **"My First Project"** angelegt (Organisation
  `aka-t-ince-org`), Projekt-ID `project-8895de46-f187-44d0-bd1`.
- ✅ Kostenloses Google-Cloud-Testguthaben aktiviert (300 $, davon noch
  262,60 € übrig, 90 Tage Laufzeit) — nicht zwingend nötig gewesen, schadet
  aber nicht, deckt jegliche Kosten für die nächsten 90 Tage ab.
- ✅ **Cloud Text-to-Speech API aktiviert** (Status "Aktiviert" bestätigt).
- 🔴 **API-Schlüssel noch NICHT erstellt.** Erster Versuch führte über
  "Anmeldedaten erstellen" auf der API-Detailseite in einen
  Auswahl-Assistenten ("Art der Qualifikation"), der bei "Anwendungsdaten"
  zu einem **Dienstkonto** (Service Account) geleitet hat — das ist der
  FALSCHE, zu komplexe Weg für unseren Code (der erwartet einen einfachen
  `?key=...`-API-Schlüssel, kein Dienstkonto mit JSON-Schlüsseldatei).
  Dienstkonto-Erstellung wurde abgebrochen, ohne etwas zu speichern.
- **Nächster Schritt morgen:** über die Suche zu **"APIs und Dienste"**
  navigieren → linkes Menü **"Anmeldedaten"** → oben **"+ Anmeldedaten
  erstellen"** → diesmal direkt **"API-Schlüssel"** wählen (NICHT über die
  API-Detailseite gehen, das öffnet wieder den falschen Assistenten). Das
  sollte ohne Umweg sofort einen fertigen Schlüssel anzeigen.
- Danach weiter mit Schritt 4-6 der Anleitung oben: Schlüssel kopieren →
  Edge Function `text-to-speech` im Supabase-Dashboard anlegen (Code aus
  `supabase/functions/text-to-speech/index.ts`) → Schlüssel dort als Secret
  `GOOGLE_TTS_API_KEY` hinterlegen → fertig, kein Vercel-Schritt nötig.

**Außerdem weiterhin offen (unabhängig von der Cloud-Stimme):** das
Gemini-429-Kontingentproblem von vorhin (nur 20 Freianfragen/Tag bei
`gemini-3.6-flash`) — die Nutzerin muss sich noch entscheiden zwischen
Modellwechsel (kostenlos, `gemini-3.5-flash-lite`) oder Abrechnung im
Gemini-Projekt aktivieren, siehe Abschnitt 6, Punkt 14.

---

## 4g. Nachtrag 31.07. — Auto-Play-Schlüssel: volle Spotify-Automatik ohne neue Hardware

**Auslöser:** Beim Live-Test des iOS-Kurzbefehls (Abschnitt 4d) zeigte sich,
dass Spotify nach dem automatischen Öffnen NICHT von selbst losspielt
(bekannte Spotify/Shortcuts-Einschränkung, siehe dort). Die Nutzerin hatte
danach selbst die richtige Idee: Wenn der Kurzbefehl Spotify öffnet, zählt
das Gerät (Handy/Tablet) ab dann als "aktives Spotify-Gerät" — **Aka
bräuchte danach nur noch die Chance, den eigentlichen Play-Befehl zu
schicken.** Bisher konnte das nur die App selbst (mit einer normalen,
~1 Std. gültigen Anmeldung) — ein externer Aufrufer wie ein Kurzbefehl
hatte keinen Weg dazu. Jetzt behoben, kostenlos, ganz ohne Hardware-Kauf.

**Umsetzung:**
- `supabase/migrations/0039_spotify_auto_play_token.sql` — NOCH NICHT
  DEPLOYT. Neue Spalte `spotify_verbindung.auto_play_token` (langer,
  zufälliger Schlüssel, pro Person eindeutig). Keine neue RLS-Policy nötig
  — die bestehende "eigene Zeile"-Policy deckt die neue Spalte automatisch
  mit ab.
- `supabase/functions/spotify-play/index.ts` — NOCH NICHT (erneut)
  DEPLOYT. Akzeptiert jetzt zusätzlich zum bisherigen Anmelde-Weg einen
  `?token=...`-Query-Parameter (GET oder POST) — findet darüber direkt die
  Person, ganz ohne Supabase-Anmeldung, keine Ablaufzeit. Zusätzlich
  optional `&playlist=<Name>`, um statt der Standard-Playlist eine der
  benannten Playlists zu starten (z. B. für eine zweite Automation
  "Abendroutine"). Wer den Schlüssel kennt, kann ausschließlich Musik für
  genau diese eine Person starten — kein Zugriff auf sonstige Daten.
- `src/data/useSpotifyVerbindung.js` — `spotifyAutoPlayToken` (aktueller
  Schlüssel oder `null`) + `spotifyAutoPlayTokenErzeugen()` (erzeugt per
  `crypto.getRandomValues` einen neuen 192-Bit-Zufallsschlüssel, ersetzt
  einen vorhandenen — macht ihn damit ungültig, falls er mal weitergegeben
  wurde und zurückgezogen werden soll).
- `src/views/plan/MehrTab.jsx` — neuer Abschnitt "Automatischer Start"
  unter "Musik (Spotify)": Knopf "Automatik-Link erzeugen", danach Anzeige
  der fertigen URL + "Link kopieren"/"Neu erzeugen".

**⚠️ Für die Nutzerin — Deploy-Schritte:**
1. Migration `0039_spotify_auto_play_token.sql` im Supabase-Dashboard unter
   "SQL Editor" ausführen.
2. Edge Function `spotify-play` im Supabase-Dashboard **neu deployen**
   (bestehende Funktion, Inhalt komplett ersetzen durch den neuen Code aus
   `supabase/functions/spotify-play/index.ts`) — kein neues Secret nötig,
   nutzt dieselben `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` wie bisher.
3. In der App unter "Mehr" → "Musik (Spotify)" → "Automatischer Start" →
   "Automatik-Link erzeugen" → Link kopieren.
4. Im iOS-Kurzbefehl (die "15 Minuten vor Sonnenaufgang"-Automation)
   **nach** der "URLs öffnen"-Aktion zwei weitere Aktionen ergänzen:
   - **"Warten"** (2-3 Sekunden, damit Spotify Zeit hat zu laden).
   - **"URL-Inhalt abrufen"** ("Get Contents of URL") mit dem kopierten
     Link als Ziel-URL, Methode GET (Standard) — kein Body, keine
     zusätzlichen Kopfzeilen nötig, der Schlüssel steckt direkt in der URL.

Sobald das steht, läuft die morgendliche Musik **komplett automatisch**,
ohne dass die Nutzerin irgendetwas antippt oder zu Aka sagen muss — sowohl
auf dem Handy als auch auf dem Tablet, kein Hardware-Kauf nötig.

---

## 5. Erinnerungs-/Push-System

**Befund (28.07.):** Die UI bietet in JEDER Kategorie (Onboarding,
`MehrTab.jsx` — "Erinnerungen"-Übersicht) ein "Ja, erinnere mich" an,
aber `supabase/functions/send-due-reminders/index.ts` (per pg_cron einmal
pro Minute aufgerufen, siehe Migration 0032) prüfte bisher **nur
Hydration** — alle anderen Kategorien hatten ein UI-Versprechen ohne
echte Funktion dahinter. Die DB-Spalten für Peptide/Medikamente/
Supplemente (`uhrzeiten`, `intervall_mode`, ...) waren laut
Migrations-Kommentar 0029 extra dafür vorbereitet, nur nie angeschlossen.

**Ergänzt am 28.07.** (portiert aus `faelltAnTag()` in
`src/utils/schedule.js`, damit Server- und Client-Logik nie
auseinanderlaufen):
- Peptide (`protocol_peptide`), Medikamente (`hormones`), Supplemente
  (`supplements`) — volles Intervall-Modell (fixed/custom/cycle/
  weekdays) + `uhrzeiten`-Array.
- Gewohnheiten (`routines`) — feste einzelne `uhrzeit`, kein
  Intervallsystem (Gewohnheiten sind konzeptionell täglich).
- Mehrere gleichzeitig fällige Erinnerungen eines Nutzers werden zu
  **einer** Push-Nachricht gebündelt statt mehrerer auf einmal.

**Nachtrag 28.07., vierte Runde — Vorab- + Nachfass-Erinnerung:** Auf
Wunsch der Nutzerin gibt's jetzt pro Kategorie (außer Hydration) nicht
mehr nur EINE Erinnerung zur geplanten Uhrzeit, sondern drei mögliche
Zeitpunkte:
1. Zur geplanten Uhrzeit selbst (wie bisher).
2. **Vorab, 15 Minuten vorher** ("⏳ Gleich dran: ...") — für Peptide/
   Medikamente/Supplemente/Gewohnheiten/Hydration.
3. **Nachfass, 10 Minuten danach** ("❗ Noch offen: ...") — nur wenn bis
   dahin noch NICHT bestätigt wurde. Dafür gleicht die Funktion jetzt
   zusätzlich gegen `peptide_logs`/`hormone_logs`/`supplement_logs`/
   `routine_logs` für den jeweils "heutigen" Tag (in der Zeitzone des
   Nutzers) ab. Hydration hat keine Nachfass-Erinnerung, weil Trinken
   keine einzelne bestätigbare Aktion mit eigenem Log ist, sondern eine
   laufende Menge.

Beide Zeitfenster (15 Min. vorab, 10 Min. Nachfass) sind bewusst feste
Werte im Code (`VORLAUF_MINUTEN`, `NACHFASS_MINUTEN` oben in der Datei),
nicht pro Nutzer/Kategorie einstellbar — die Nutzerin hatte selbst
gesagt, dass sie "10, 20 Minuten vorher" bzw. "eine halbe Stunde früher"
je nach Kontext will, aber die genaue Feinabstimmung mir überlässt. Das
ist der erste, einfache Schritt; eine Kategorie-genaue oder gar
KI-gewählte Vorlaufzeit wäre der nächste Ausbau, falls gewünscht.

Nebenbei behoben: Die `faellig`-Map (sammelt fällige Erinnerungen pro
Durchlauf) war als Modul-Variable deklariert und wurde nie geleert — bei
einer zwischen Cron-Ticks warmgehaltenen Deno-Isolate hätte das zu
mehrfach/wachsend gesendeten Erinnerungen führen können. Jetzt wird sie
zu Beginn jedes Aufrufs explizit geleert.

**Nachtrag 29.07., fünfte Runde — jetzt alle 9 Bereiche.** Training
(`training_wochenplan`) und Ernährung (`meal_wochenplan`) hatten schon
eine `uhrzeit`-Spalte, nur nie angeschlossen — jetzt ergänzt, Wochentag-
Abgleich statt Intervall-System, Nachfass-Check gegen
`training_sessions`/`meal_logs`. Tageslicht/Schlaf bekommen dieselbe
freie Uhrzeiten-Liste wie Hydration (`ZeitErinnerungenCard.jsx`,
`profiles.erinnerungen[kategorie].zeiten`) — keine neue Migration nötig,
das "kein Uhrzeit-Feld"-Problem von vorher ist damit erledigt (die Person
legt die Erinnerungszeit selbst fest, statt dass sie aus einem
Dosierungsplan abgeleitet würde). Siehe Abschnitt 4a für die volle
Beschreibung aller sechs an diesem Tag geschlossenen Lücken.

**Weiterhin bewusst nicht abgedeckt:**
- Eine dauerhafte, wiederholte Erinnerung nach dem ersten Nachfass (z. B.
  alle 30 Min. weiter nerven) — aktuell genau EIN Nachfass-Ping pro
  verpasstem Termin, keine Eskalation.

**✅ Deployt (29.07.).** Die Nutzerin hat `send-due-reminders` über das
Supabase Dashboard neu deployt (Code manuell ersetzt, kein Secret nötig).
Damit ist der letzte offene manuelle Schritt aus der kompletten Liste in
Abschnitt 6 erledigt — Push-Berechtigung auf dem jeweiligen Gerät (unter
"Mehr") bleibt weiterhin Voraussetzung, damit tatsächlich Benachrichtigungen
ankommen.

---

## 6. Offene Punkte — konkret, mit nächstem Schritt

| # | Thema | Status | Nächster Schritt |
|---|-------|--------|-------------------|
| 1 | Erinnerungs-Versand für alle 9 Bereiche, inkl. Vorab- (15 Min. vorher) und Nachfass-Erinnerung (10 Min. Verspätung) | ✅ Erledigt (29.07.) — `send-due-reminders` deployt, siehe Abschnitt 5 | — |
| 2 | Erinnerungs-Versand für Training/Ernährung (Wochenplan-basiert) | ✅ Erledigt (29.07.) — `training_wochenplan`/`meal_wochenplan` hatten schon eine `uhrzeit`-Spalte, jetzt an `send-due-reminders` angeschlossen | — |
| 3 | Erinnerungs-Versand für Tageslicht/Schlaf | ✅ Erledigt (29.07.) — eigene Uhrzeiten-Liste wie bei Hydration (`ZeitErinnerungenCard.jsx`), keine neue Migration nötig | — |
| 4 | Groq als Provider aktivieren | Zurückgestellt (Nutzerinnen-Entscheidung) — Code fertig, kein API-Key vorhanden | Falls Nutzerin einen Groq-Key bekommt: Secret setzen, `VITE_AI_PROVIDER=groq` |
| 5 | Cloudflare-Tunnel-Adresse für Ollama ist ephemeral | Zurückgestellt — bekannte Einschränkung, aktuell nicht aktiv genutzt | Nur relevant, falls wieder auf Ollama gewechselt wird |
| 6 | Groq-Streaming | Noch nicht implementiert (nur Ollama + Gemini) | Bei Bedarf, gleiches Muster wie Gemini-SSE-Streaming übernehmen |
| 7 | Multi-User-/"jeder Teilnehmer bekommt eigenen Coach"-Vision | Zurückgestellt — mit Gemini technisch näher, aber noch nicht umgesetzt | Bei Bedarf besprechen |
| 8 | `bereichErkennen()`-Routing auf weitere Einstiegspunkte | Erledigt für Home/Tagesplan/Wochenübersicht | Bei Bedarf auf weitere Screens ausweiten |
| 9 | Farbige Icon-Hintergründe in Onboarding-Kategorie-Headern | Bewusst zurückgestellt beim Design-Umbau (Zeitgrenze) | Nur Politur, kein funktionaler Gap |
| 10 | Echte Cloud-TTS-Stimme statt Web Speech API | ✅ Umgesetzt (30.07., Google Cloud TTS/WaveNet) — Code fertig, Deploy steht noch aus, siehe Abschnitt 4f | Nutzerin: Deploy-Schritte aus 4f durchführen |
| 11 | Globaler Plus-Button auf allen Screens statt nur Home | ❌ Verworfen — bleibt wie es ist | — |
| 12 | Sprachauswahl (DE/EN/TR) auf den Assistenten ausweiten | Nur UI-Texte sind aktuell mehrsprachig, der Assistent antwortet immer auf Deutsch (fest in ~15 System-Prompts) | Bei explizitem Wunsch: zentrale Sprachanweisung statt der verteilten "Antworte auf Deutsch"-Zeilen |
| 13 | Protokoll-Journal (jeder Schritt dokumentiert, auch verspätet/ausgesetzt) + Erinnerung ab 10 Min. Verspätung + Vorab-Erinnerungen + KI an/aus-Schalter + Korrelationen | ✅ Vollständig erledigt (29.07.), siehe Abschnitt 4a im Detail — Erinnerungen jetzt für alle 9 Bereiche (inkl. Deploy von `send-due-reminders` durch die Nutzerin bestätigt), automatische "ausgefallen"-Erfassung, Notfallmodus-Dokumentation, KI an/aus-Schalter, Korrelationserkennung, Compliance für alle 9 Bereiche | — |
| 14 | Gemini-Kontingent: `gemini-3.6-flash` hat nur 20 kostenlose Anfragen/Tag, App lief am 30.07. deshalb abends leer (429) | 🔴 Offen, noch nicht entschieden | Nutzerin entscheidet: (a) kostenlos auf `gemini-3.5-flash-lite` wechseln (Vercel-Variable `VITE_AI_MODEL` + Redeploy) oder (b) Abrechnung im Google-Cloud-Projekt aktivieren (Kosten gering, siehe Abschnitt 4, Gemini-Fallstrick 4b) |
| 15 | Cloud-Sprachausgabe (Google Cloud TTS/WaveNet statt robotischer Browser-Stimme) | ✅ Code fertig (30.07.), siehe Abschnitt 4f — Deploy durch Nutzerin steht noch aus | Deploy-Schritte aus 4f durchführen, danach testen |
| 16 | Auto-Play-Schlüssel für vollautomatischen Spotify-Start (iOS-Kurzbefehl, kein Hardware-Kauf) | ✅ Code fertig (31.07.), siehe Abschnitt 4g — Deploy durch Nutzerin steht noch aus | Deploy-Schritte aus 4g durchführen (Migration 0039 + `spotify-play` neu deployen), dann Kurzbefehl um "Warten" + "URL-Inhalt abrufen" ergänzen |

---

## 7. Ziele / Gesamtvision (unverändert)

- ADHS-freundliche, reizarme App zur Verwaltung komplexer
  Gesundheitsprotokolle — Notfallmodus für überforderte Tage.
- Ist-Zustand + Zielzustand sauber trennen und sichtbar machen.
- **KI-Coach als Ersatz für einen klassischen Online-Coach**: die
  Nutzerin möchte sich mit einem persönlich benannten Assistenten
  unterhalten, der die Arbeit im Hintergrund erledigt, statt selbst
  Formulare auszufüllen — jetzt in allen 9 Bereichen + Home/Tagesplan/
  Wochenübersicht umgesetzt.
- **Gleichzeitig, gleichrangig: vollständige manuelle Nutzbarkeit ohne
  jede KI** — siehe Leitprinzip in Abschnitt 1. Beide Bedienwege sind
  Kernversprechen der App, nicht KI-Weg mit manuellem Fallback.
- Langfristig denkbar: mehrere echte Nutzer bekommen jeweils eigene
  Coach-Instanzen (siehe offener Punkt 7).

---

## 8. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Manuell UND per KI, nie nur eins von beidem** (siehe Abschnitt 1) —
  bei JEDER Änderung an einem Bereich prüfen, ob das manuelle Formular
  noch genauso vollständig funktioniert wie vorher. Diese Regel steht
  über den meisten anderen Design-Entscheidungen.
- **Die Nutzerin ist nicht technisch versiert**, spricht oft per
  Spracherkennung — Transkriptionsfehler bei Fachbegriffen sind normal
  (Beispiele: "Obama" = Ollama, "Grow"/"Growth" = Groq). Bei
  Screenshots/Fotos von Bildschirmen: genau hinschauen, oft liegt der
  Fehler an einer kleinen Verwechslung, nicht an grundsätzlichem
  Unverständnis. Bei abgeschnittenen/unklaren Sprachnachrichten lieber
  kurz nachfragen als eine große Änderung auf eine Vermutung zu bauen.
- **Dashboards (Supabase/Vercel) können täuschen**: ein angezeigtes
  "Name"-Feld ist nicht zwangsläufig die echte Adresse/der echte Slug —
  siehe Abschnitt 4, Gemini-Fallstrick #4.
- **Diese Agent-Sandbox hat keinen Netzwerkzugriff auf Supabase/Vercel**
  und keine Supabase-CLI. Änderungen an Edge Functions oder
  DB-Migrationen landen im Code/Repo, müssen aber von der Nutzerin selbst
  über das Supabase-Dashboard deployt werden — Code im Chat bereitstellen
  und Schritt-für-Schritt-Anleitung geben (siehe Abschnitt 4/5 für
  Beispiele). Live-Verifikation von Deployments ist nur über Screenshots
  der Nutzerin möglich.
- **Playwright ist lokal nutzbar für Frontend-QA**: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`,
  Chromium unter `/opt/pw-browsers/chromium`. Die App braucht echte
  Supabase-Zugangsdaten zum Starten (`.env`, gitignored) — für reine
  UI-Komponenten-QA notfalls einen temporären Platzhalter-`.env` +
  einen temporären Test-Entry-Point anlegen, danach beides wieder
  entfernen (nichts davon committen).
- **Alles außerhalb von Code sehr kleinschrittig erklären** — echte
  Klick-für-Klick-Anleitungen, keine Fachbegriffe ohne Erklärung.
- **Keine Infrastruktur-Fakten erfinden** — Hosting-URL, Konten-Zugänge,
  Modellnamen etc. im Zweifel per Web-Suche verifizieren statt zu raten.
- **Git-Workflow:** Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`,
  NICHT direkt auf `main` arbeiten, dann fetch+fast-forward-merge+push
  nach `main` (in dieser Session-Reihe wiederholt so autorisiert). Vor
  jedem Commit: `npm run build` + `npx oxlint`.
- **Dieses Dokument aktuell halten** — bei viel Veränderung lieber neu
  schreiben (wie hier geschehen) statt endlos weitere "Nachtrag"-Absätze
  aufzustapeln.

---

**Letzte Aktualisierung:** 30.07.2026 — Fortsetzung des sehr langen,
ereignisreichen 29.07.-Sitzungstags, hier bewusst ausführlich
zusammengefasst, damit möglichst wenig Kontext für die nächste Sitzung
verloren geht.

**Ausgangslage vor heute:** Coach ist exekutiver Assistent (nicht
"Coach") in allen 9 Bereichen + Home/Tagesplan/Wochenübersicht,
Onboarding hat zwei gleichwertige Begleitungs-Phasen, Design auf weißem
Untergrund + bereichseigene Farben. Erinnerungs-/Push-System deckt alle
9 Kategorien ab, deployt und bestätigt aktiv (Abschnitt 5).

**Heute neu gebaut UND vollständig deployt/bestätigt:**
- **Admin-Dashboard** ("Verwalten als"-Modus, Abschnitt 4b) — die
  Nutzerin kann sich als Admin anmelden, alle Konten einsehen und
  stellvertretend die App für jemanden bedienen (z. B. Eltern, die noch
  nicht selbst mit der KI ihren Plan aufbauen können). Migration 0035 +
  Edge Function `admin-create-proband` live, Nutzerin ist als Admin
  markiert.
- **Admin-Hinweise über den Assistenten** (Abschnitt 4c) — der Admin kann
  Aka pro Proband Hintergrundwissen oder direkte Nachrichten mitgeben,
  die wie ganz normale Aka-Antworten wirken, kein separates Postfach.
  Migration 0036 live.
- **Spotify-Anbindung inkl. mehrerer Playlists** (Abschnitt 4d) —
  OAuth-Verbindung, beliebig viele benannte Playlists, Aka erkennt im
  Gespräch selbst (Marker-Mechanismus, kein festes Trigger-Wort nötig),
  welche gemeint ist, und startet sie. Migrationen 0037 + 0038, beide
  Edge Functions, Spotify-Entwickler-Konto, Vercel-Variable — alles live,
  im Gespräch mit Aka erfolgreich getestet.
- **Diverse UI-Bugfixes und Politur** (Abschnitt 4e) — u. a. Aka-Orb
  verdeckte keine Karteninhalte mehr, Farbverwechslungen bei
  Wochenübersicht/Peptide behoben, neuer "Routinen"-Abschnitt (Priorität
  vor den 9 Plan-Reitern), neues Logo + App-Icon nach Nutzerinnen-Vorgabe,
  Logo/Schriftzug/Begrüßung vergrößert, Aka wiederholt beim Öffnen nicht
  mehr automatisch alte Gespräche, Edge-Function-Fehlermeldungen kommen
  jetzt im Client an (waren vorher stumm verschluckt).

**Am 30.07. zusätzlich:** Migrationen 0035–0038 sind jetzt durchgängig
als "✅ deployt" markiert (vorher stellenweise noch als "NOCH NICHT
DEPLOYT" stehen geblieben, obwohl die Nutzerin sie längst ausgeführt
hatte — reiner Dokumentationsfehler, jetzt korrigiert). Live-Support-
Sitzung zum iOS-Kurzbefehl fortgesetzt (rein extern, kein Code) sowie
ausführliche Recherche/Beratung zu einer Smart-Speaker-Lösung als
Zielbild (Echo Dot + Alexa-Routine, siehe neuer Abschnitt "Vertiefung:
Smart Speaker als Zielbild" unter 4d) — reine Konzept-/Kaufberatung,
noch nichts angeschafft oder umgesetzt. Außerdem **Cloud-Sprachausgabe
gebaut** (Google Cloud TTS/WaveNet statt der robotischen Browser-Stimme,
Abschnitt 4f) — Code fertig mit automatischem Rückfall auf die alte
Stimme, falls der Deploy noch aussteht; Auslöser war ein Gemini-429-
Kontingentfehler (nur 20 kostenlose Anfragen/Tag bei `gemini-3.6-flash`),
der im selben Gespräch mit besprochen, aber noch nicht behoben wurde (die
Nutzerin muss sich noch zwischen Modellwechsel auf ein Modell mit
höherem Freikontingent oder Abrechnung aktivieren entscheiden — siehe
neuer offener Punkt unten).

**Besprochen, aber bewusst NICHT begonnen (nächste Schritte):**
1. **Echter Wecker mit Playlist-Auswahl** im Schlaf-Bereich, darauf
   aufbauend die **geführte Morgenroutine** (Weckzeit als Push-
   Erinnerung → Ablauf-Screen, der die mit Aka geplanten Schritte per
   Sprache durchgeht, Musik läuft mit, Wartezeiten/Nachfragen, Abschluss)
   — von der Nutzerin klar priorisiert, siehe Abschnitt 4d. Übergangs-
   weise nutzt sie dafür einen iOS-Kurzbefehl außerhalb der App (siehe
   Abschnitt 4d, "Zwischenlösung" + "Stand iOS-Kurzbefehl" im neuen
   30.07.-Abschnitt — zuletzt kurz vor Fertigstellung).
2. **Smart-Speaker-Weg als Alternative zum Kurzbefehl** (Abschnitt 4d,
   neuer Vertiefungs-Abschnitt) — konkrete Kaufempfehlung (Echo Dot,
   ~38–40 €) und Einrichtungsschritte liegen vor, aber noch nicht
   angeschafft/umgesetzt. Eine eigene Alexa-Skill (Aka steuert den
   Lautsprecher aktiv) wäre ein separater, deutlich größerer Folgeschritt
   — nur bei explizitem späteren Wunsch angehen.
3. Im ursprünglichen Onboarding fehlen noch Detailfragen zum
   Sport-Istzustand/zur Körperkomposition (von der Nutzerin beim
   Admin-Dashboard-Auftrag erwähnt, dort bewusst zurückgestellt).

Nächster sinnvoller Ansatzpunkt: Punkt 1 oben (Wecker + geführte
Morgenroutine) ist die von der Nutzerin priorisierte nächste große
Baustelle — dabei auch klären, ob sie sich für den iOS-Kurzbefehl oder
einen Echo Dot als Auslöser entscheidet, das beeinflusst das Design des
Ablauf-Screens (Push-Tap vs. sprachgesteuert vom Lautsprecher aus).
Alternativ verbleibende offene Punkte in Abschnitt 6 durchgehen (v. a.
Punkte 4-7, alle bewusst zurückgestellt/verworfen, kein akuter
Handlungsbedarf) oder auf neue Rückmeldung der Nutzerin warten.
