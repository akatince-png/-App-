# 📋 ÜBERGABEPROTOKOLL: AKA App

**Stand: 28.07.2026, nachts — Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`**

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
| 10 | Echte Cloud-TTS-Stimme statt Web Speech API | ❌ Verworfen — würde laufende Kosten bedeuten (z. B. ElevenLabs, Google Cloud TTS) | — |
| 11 | Globaler Plus-Button auf allen Screens statt nur Home | ❌ Verworfen — bleibt wie es ist | — |
| 12 | Sprachauswahl (DE/EN/TR) auf den Assistenten ausweiten | Nur UI-Texte sind aktuell mehrsprachig, der Assistent antwortet immer auf Deutsch (fest in ~15 System-Prompts) | Bei explizitem Wunsch: zentrale Sprachanweisung statt der verteilten "Antworte auf Deutsch"-Zeilen |
| 13 | Protokoll-Journal (jeder Schritt dokumentiert, auch verspätet/ausgesetzt) + Erinnerung ab 10 Min. Verspätung + Vorab-Erinnerungen + KI an/aus-Schalter + Korrelationen | ✅ Vollständig erledigt (29.07.), siehe Abschnitt 4a im Detail — Erinnerungen jetzt für alle 9 Bereiche (inkl. Deploy von `send-due-reminders` durch die Nutzerin bestätigt), automatische "ausgefallen"-Erfassung, Notfallmodus-Dokumentation, KI an/aus-Schalter, Korrelationserkennung, Compliance für alle 9 Bereiche | — |

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

**Letzte Aktualisierung:** 29.07.2026. Coach ist jetzt exekutiver
Assistent (nicht "Coach") in allen 9 Bereichen + Home/Tagesplan/
Wochenübersicht, Onboarding hat zwei gleichwertige Begleitungs-Phasen,
Design ist auf weißen Untergrund + bereichseigene Farben umgestellt.
Das Erinnerungs-/Push-System deckt jetzt **alle 9 Kategorien** ab und ist
**deployt und bestätigt aktiv** (siehe Abschnitt 5). Alle Punkte aus der
letzten großen Bestandsaufnahme sind abgearbeitet: Notfallmodus-
Dokumentation, KI an/aus-Schalter, automatische "ausgefallen"-Erfassung,
Compliance für alle 9 Bereiche, Korrelationserkennung (Abschnitt 4a).
Kein offener manueller Deploy-Schritt mehr. Nächster sinnvoller
Ansatzpunkt: verbleibende offene Punkte in Abschnitt 6 durchgehen (v. a.
Punkte 4-7, alle bewusst zurückgestellt/verworfen, kein akuter
Handlungsbedarf) oder auf neue Rückmeldung der Nutzerin warten.
