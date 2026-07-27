# 📋 ÜBERGABEPROTOKOLL: MyProtocols App

**Stand: 27.07.2026, spät abends, Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`**

> ⚠️ **Diese Fassung ergänzt die Version vom frühen Abend desselben Tages.** Seitdem: Coach heißt jetzt standardmäßig **"Aka"** mit fest vorgegebener Persönlichkeit/Antwortstruktur, neue **Wissens-Basis** (`src/wissen/`, ein Unterordner pro Lebensbereich) + Trackingdaten-Zusammenfassung laufen jetzt in JEDEM der 8 Bereiche automatisch mit (nicht mehr nur Home), und ein neuer **Coach-geführter Onboarding-Modus** (Phase 1: Felder einzeln abfragen) für Name/Ziele/Profil. Abschnitt 5 komplett neu lesen.

---

## 1. Was ist diese App?

**MyProtocols** ist eine Web-App zur Selbstverwaltung von
Gesundheitsprotokollen/Biohacking, mit besonderem Fokus auf
ADHS-Freundlichkeit (reduzierte Reizüberflutung, Notfallmodus, große
Bedienelemente, klare Sprache). Die Nutzerin ist selbst nicht technisch
versiert (kommuniziert per Spracheingabe, oft mit Transkriptionsfehlern) —
siehe Abschnitt 8 für Hinweise zur Zusammenarbeit.

Abgedeckte Lebensbereiche (jeder mit eigenem Plan/Protokoll): Schlaf,
Hydration, Ernährung, Training, Gewohnheiten, Supplemente,
Medikamente/Hormone, Peptide, Tageslicht (wie viel Zeit am Tag im
Freien/Tageslicht verbracht wird).

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
> KI-Coach-Weg dafür gibt (aktuell in allen 8 Bereichen mit KiChat so
> umgesetzt — die "(manuell)"-Karten/Formulare stehen überall weiterhin
> parallel neben dem Coach-Orb). Der Coach-Orb öffnet sich nur auf Tap, nie
> von selbst — wer ihn nie antippt, bekommt die KI nie zu Gesicht.

**Der ADHS Coach** (Standardname **"Aka"**, individuell umbenennbar, z. B.
"Coach Acker"): ein Assistent mit fest vorgegebener Persönlichkeit (direkt,
wertschätzend, kurze Absätze/Fettdruck/Stichpunkte, immer ein "nächster
kleiner Schritt", siehe Abschnitt 5), der in 8 Bereichen als echter Chat
verfügbar ist — er fragt nach, schlägt vor, und legt nach Bestätigung durch
die Nutzerin selbst neue Einträge an (Rezepte, Trainingspläne, Gewohnheiten, Supplemente,
Medikamente, Ziele). **Läuft jetzt produktiv über Google Gemini** (Cloud,
schnell, auch unterwegs auf dem Handy nutzbar) — Ollama (lokal) und Groq
bleiben als Alternativ-Provider im Code vorbereitet, aber Gemini ist der
aktuell konfigurierte und bestätigt funktionierende Weg. Der Trigger ist
ein animierter Coach-Orb statt eines Text-Buttons — Tippen öffnet den Chat
und startet direkt die Spracherkennung.

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
  Abschnitt 5 „Modell-Fallstrick"), angebunden über einen sicheren
  Supabase-Edge-Function-Proxy. Alternativ verfügbar, aber nicht aktiv
  konfiguriert: Ollama (lokal, `qwen2.5:7b`) und Groq (Cloud).
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk`.

---

## 3. Architektur & wichtige Konzepte

### Verzeichnisstruktur (Auszug, verifiziert)

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus, Coach-Orb
│   ├── TageslichtView.jsx
│   ├── HydrationView.jsx, NutritionView.jsx, TrainingView.jsx,
│   │   GewohnheitenView.jsx, SupplementeView.jsx, MedikamenteView.jsx
│   │   → alle mit Coach-Orb (KiChat) erweitert
│   ├── onboarding/                Onboarding-Flow
│   └── plan/                      PlaeneView (Tab-Hub), MehrTab (Coach-Name-Einstellung)
├── ui/
│   ├── primitives.jsx             Card, Label, TextInput, TextArea, PrimaryButton, Pill, ...
│   ├── ViewHeader.jsx             ⭐ NEU: einheitliche Kopfzeile (Home-Button + Logo) für alle Screens
│   ├── CoachOrb.jsx               ⭐ NEU: animierte Kreis-Grafik, reagiert auf Coach-Gesprächszustand
│   ├── KiChat.jsx                 Wiederverwendbare Chat-Oberfläche, jetzt als Orb-Trigger + Bottom-Sheet-Modal
│   ├── Fab.jsx                    "+"-Button, jetzt oben rechts (war: unten mittig)
├── services/
│   ├── aiProviders.js             Low-Level: Ollama/Groq/Gemini, inkl. Streaming, sicherer Edge-Function-Weg
│   └── aiService.js               Domänenfunktionen (siehe Abschnitt 5)
├── utils/
│   ├── coachStorage.js            localStorage für Coach-Namen + Vorlesen-Einstellung
│   ├── speech.js                  Web Speech API (Mikrofon + Vorlesen)
├── context/AppDataContext.jsx     Zentrale Datenverwaltung — kombiniert alle data/use*.js-Hooks
supabase/functions/
├── groq-chat/index.ts             Sicherer Groq-Proxy (Key nur serverseitig) — deployt, aber nicht aktiv genutzt
├── gemini-chat/index.ts           Sicherer Gemini-Proxy — ⭐ AKTIV, siehe Abschnitt 5 für die reale Deploy-Adresse
```

### Design-System

Kein CSS-Framework — plain CSS (`src/index.css`, v. a. `@keyframes`) +
Design-Tokens aus `src/ui/theme.js` (`accent`, `accentDark`, `cardBorder`,
...), eingebunden über inline `style={{...}}`-Objekte. **Immer** Farben aus
`theme.js` importieren, nie Hex-Werte direkt schreiben.

Der Home-Button war früher ~19-fach einzeln pro Screen kopiert — jetzt
über `src/ui/ViewHeader.jsx` vereinheitlicht (Home-Button links neben dem
Logo, größer als vorher). Bei neuen Screens **immer** `ViewHeader` nutzen,
nicht wieder einen eigenen Header-Block bauen.

---

## 4. Was wurde in dieser Session-Reihe verändert? (chronologisch)

*(Punkte 1–17 aus früheren Fassungen, siehe Git-Historie für Details. Ab
Punkt 18 neu seit der letzten Protokoll-Fassung.)*

18. **Performance-Fixes**: N+1-Query-Bug beim Dosis-Speichern (Peptide,
    Hormone/Medikamente) behoben — mehrere `.update()`-Aufrufe pro Feld zu
    einem einzigen Batch-Update zusammengefasst (`setDoseBatch`,
    `setHormonDoseBatch`). Sequenzielle `await`-Schleifen durch
    `Promise.all` ersetzt (Mahlzeiten-Bearbeitung, Ernährungsplan-Übernahme).
    Redundante `buildDayItems()`-Berechnung in `HomeView.jsx` (lief 21×
    statt 7× pro Render) auf eine gemeinsame Berechnung reduziert.
19. **Echtes Streaming** für Ollama (NDJSON) und jetzt auch **Gemini**
    (Server-Sent Events über `streamGenerateContent`) — Coach-Antworten
    erscheinen wortweise live statt am Stück. Groq streamt noch nicht
    (kommt als Volltext zurück).
20. **Sicherer Cloud-KI-Weg statt nur lokalem Ollama**: Neue Supabase Edge
    Functions `groq-chat` und `gemini-chat` — der echte API-Key liegt nur
    serverseitig als Supabase-Secret, landet nie im Browser-Code. Ohne
    gesetzten `VITE_AI_API_KEY` läuft die Anfrage automatisch über die
    Edge Function (sicherer Normalweg); mit gesetztem Key ginge sie direkt
    aus dem Browser (schneller Testweg, aber Key wäre sichtbar — aktuell
    NICHT genutzt, `gemini-chat` läuft im sicheren Modus).
21. **Design-Umbau**: `ViewHeader.jsx` (Home-Button vereinheitlicht, siehe
    Abschnitt 3), `Fab.jsx` (Plus-Button von unten-mittig nach oben-rechts),
    `CoachOrb.jsx` (animierte Kreis-Grafik als Coach-Trigger in allen 8
    Bereichen, ersetzt statischen Text-Button). `KiChat.jsx` übernimmt jetzt
    selbst das Öffnen/Schließen als Bottom-Sheet-Modal — Tap auf den Orb
    öffnet den Chat UND startet direkt die Spracherkennung.

---

## 5. KI-Coach — vollständiger technischer Überblick (heutiger Stand)

### Architektur

- `src/services/aiProviders.js` — Low-Level-Transport, drei Provider
  (Ollama/Groq/Gemini) über `VITE_AI_PROVIDER` wählbar. `sendeAnfrage()`
  für normale Anfragen, `sendeAnfrageStreamend()` für Wort-für-Wort-Antworten
  (Ollama + Gemini haben echtes Streaming, Groq noch nicht). Bei
  Groq/Gemini: ohne `VITE_AI_API_KEY` läuft die Anfrage automatisch über
  die passende Supabase Edge Function.
- `src/services/aiService.js` — Domänenfunktionen (`coachChatStreamend`,
  `trainingsplanAusChat`, `ernaehrungsplanAusChat`, `gewohnheitAusChat`,
  `hydrationAusChat`, `tageslichtAusChat`, `supplementAusChat`,
  `medikamentAusChat`, `bereichErkennen`), alle nutzen `mitPersona()` für
  den Coach-Namen. `bereichErkennen()` klassifiziert im Hintergrund, ob/zu
  welchem der 7 Themenbereiche ein Gespräch schon konkret genug ist (siehe
  "Universeller Home-Coach" unten).
- `src/data/useCoachVerlauf.js` + Tabelle `coach_nachrichten` — persistenter
  Gesprächsverlauf pro `bereich`. Wird beim Öffnen eines Chats geladen und
  fließt automatisch (bis zu den letzten 24 Nachrichten, siehe
  `KI_KONTEXT_LIMIT` in KiChat.jsx) als Kontext in jede neue KI-Anfrage ein
  — der Coach "kennt" die Nutzerin über die Zeit zunehmend besser.
- `src/ui/KiChat.jsx` — geschlossen: schwebender runder "Anruf-Knopf"
  (`CoachOrb`, 68px) unten mittig, kein Text mehr. Tap öffnet ein
  Bottom-Sheet-Modal UND startet direkt die Spracherkennung. Anzeige
  bewusst minimal wie ein KI-Sprachmodus (ChatGPT/Gemini-Stil): nur die
  jeweils aktuelle Frage/Antwort groß, älterer Verlauf hinter
  Aufklapp-Link. Barge-in: eigenes Sprechen oder Antippen des Orbs
  unterbricht sofort eine laufende Sprachausgabe. Spracherkennung liefert
  Zwischenergebnisse live (nicht erst am Ende), Tastatur fokussiert sich
  automatisch sobald nicht zugehört wird.

### Universeller Home-Coach (⭐ neu)

Der globale Coach auf der Startseite ist NICHT mehr auf eine einzige feste
Aktion (früher: nur Gewohnheiten) beschränkt, sondern kann alle 7 Bereiche
bedienen. Mechanik: `KiChat` bekommt bei Bedarf die Props
`pruefeBereitschaft` (async, läuft automatisch nach jeder Coach-Antwort,
liefert erkannten Bereich oder `null`) und `uebernehmenLabels` (Beschriftung
je Bereich). Der "Übernehmen"-Knopf erscheint erst, wenn ein Bereich
erkannt wurde — nicht mehr automatisch nach jeder beliebigen Antwort. Beim
Klick routet `HomeView.handleUniverselleUebernahme()` zur selben
Extraktions-/Speicherfunktion, die auch der jeweilige Bereichs-Chat nutzt
(keine neue Schreib-Logik). Die anderen 7 Bereichs-Chats setzen diese Props
weiterhin nicht — dort ist der Bereich ja von vornherein durch den Kontext
klar.

### Persona: "Aka" + feste Tonalität (⭐ neu)

`STANDARD_COACH_NAME` in `coachStorage.js` ist jetzt `"Aka"` (statt
generisch "dein ADHS Coach"), individuell weiterhin umbenennbar. In
`aiService.js` gibt es jetzt zwei Persona-Ebenen:
- `mitPersona()` (unverändert) — nur die Namens-Vorstellung, für ALLE
  Funktionen inkl. der strukturierten Extraktoren (…AusChat).
- `mitVollerPersona()` (⭐ neu) — zusätzlich die von der Nutzerin fest
  vorgegebene Persönlichkeits-/Antwortstruktur (direkt, wertschätzend,
  kurze Absätze/Fettdruck/Stichpunkte, immer ein "nächster kleiner
  Schritt", ADHS-Hürden ohne Urteil, Pläne als lesbarer Fließtext statt
  JSON). Nur für `coachChat`/`coachChatStreamend` (den freien Chat)
  verwendet — **bewusst nicht** für die …AusChat/…Vorschlag-Funktionen,
  da die Stil-Vorgaben dort mit der geforderten reinen JSON-Antwort
  kollidieren und das Parsen brechen würden.

### "Background Brain": Wissens-Basis + Live-Daten (⭐ neu, in JEDER Anfrage)

Zwei Kontext-Quellen werden jetzt zentral in `KiChat.jsx` (nicht mehr nur
Home) an jede Coach-Anfrage angehängt:
- `src/utils/wissensBasis.js` — liest alle `.md`-Dateien unter
  `src/wissen/**/*.md` per `import.meta.glob` (eager, `?raw`) beim Bauen
  der App ein. Ein Unterordner pro Lebensbereich (`schlaf/`, `hydration/`,
  `ernaehrung/`, `training/`, `gewohnheiten/`, `supplemente/`,
  `medikamente/`, `peptide/`, `tageslicht/`, `profil/`, `blutwerte/`) plus
  `allgemein/` für bereichsübergreifende ADHS-Coaching-Themen — aktuell
  überall nur Platzhalter-Inhalte, die die Nutzerin nach und nach durch
  echtes Coaching-Wissen ersetzen will. **Neue `.md`-Datei irgendwo unter
  `src/wissen/` ablegen reicht** — kein Code nötig, wird automatisch beim
  nächsten Deploy erkannt. Einfache Variante bewusst ohne Vektorsuche
  (kompletter Text aller Dateien wird angehängt) — falls der Ordner mal
  sehr groß wird, muss hier eine Auswahl/Suche rein.
- `src/utils/trackingZusammenfassung.js` (bisher nur Home) — jetzt überall.
  Deckt zusätzlich Profil (Alter/Größe/Startgewicht) und Blutwerte/
  Biomarker ab, nicht mehr nur die zeitraumbezogenen Trackingdaten.

Wichtig: Die `wissen/`-Dateien sind rein statisches Hintergrundwissen
(Coaching-Theorie) — die eigentlichen Nutzerinnen-Daten liegen weiterhin
ausschließlich in Supabase. Ein Browser kann nicht in Projektdateien
schreiben; "Daten in wissen/ speichern" ist technisch nicht möglich und
war nicht die richtige Umsetzung eines entsprechenden Wunsches der
Nutzerin — stattdessen läuft `trackingZusammenfassung()` jetzt überall.

### Coach-geführtes Onboarding, Phase 1 (⭐ neu)

Nach der Begrüßung (`OnboardingIntroView.jsx`) fragt der Coach jetzt, ob
er begleiten soll oder die Nutzerin lieber allein macht. Bei Begleitung
übernimmt `OnboardingCoachGuide.jsx` (neu, in `src/views/onboarding/`)
Name, Ziele und persönliche Daten (Geschlecht, Geburtsdatum, Größe,
Startgewicht) als durchgehende Frage-für-Frage-Sequenz — Mikrofon-Option,
überspringbar, speichert jede Antwort **sofort über dieselben Funktionen**
wie die manuellen Formulare (`toggleZiel`, `setPersonal`). Kein KI-Call für
die Fragen selbst (Felder sind fest bekannt, ein Modell wäre hier nur
Latenz + Fehlerquelle in einem kritischen Pfad). `OnboardingFlow.jsx`
überspringt danach die Phasen `ziele`/`profil` (bereits erledigt) und geht
direkt zu `laborwerte` weiter — ab da normaler manueller Ablauf.

**Nicht umgesetzt (bewusst, siehe offene Punkte):** freies Erzählen +
automatische Zuordnung zu Feldern (Variante 2 aus dem Auftrag), sowie eine
geführte Alternative für Laborwerte und die 9 Kategorien-Schritte
(Training, Ernährung, Supplemente, Medikamente, Peptide, …) — die sind
deutlich vielschichtiger (Multi-Add-Muster, Dosierungs-Unterformulare,
Foto-Upload/OCR, WochenplanEditor) und brauchen einen eigenen Anlauf.

### Laborwerte-Lexikon-Verknüpfung (⭐ neu)

Jeder Laborwert in `LaborwerteFelder.jsx` (ProfilTab + Onboarding-
Biomarker-Plan) hat jetzt einen kleinen ℹ️-Knopf neben dem Namen. Klick
darauf lädt eine kurze Erklärung über das bestehende Lexikon (eigene
Supabase-Edge-Function `lexikon`, nutzt direkt die Anthropic-API,
unabhängig vom eingestellten Coach-Provider Ollama/Groq/Gemini — läuft
also immer, egal welcher KI-Anbieter gerade für den Coach aktiv ist): was
der Wert misst, wieso er gemessen wird, seine Relevanz, und der übliche
Referenzbereich — ausdrücklich ohne Diagnose. Antwort erscheint direkt
unter der jeweiligen Zeile, pro Zeile eigener Lade-/Fehler-Zustand
(`LaborwertZeile`-Komponente). Neue Hook-Funktion `lexikonSchnellFragen()`
in `useLexikon.js`: wie die bestehende `lexikonFragen()`, aber ohne den
geteilten Lexikon-Verlauf zu verändern — gibt die Antwort direkt zurück,
für punktuelle Erklärungen wie diese.

### Wo der Coach heute verfügbar ist

Home (universell, alle 7 Bereiche), Training, Gewohnheiten, Ernährung,
Hydration, Tageslicht, Supplemente, Medikamente, sowie geführt beim
Onboarding (Name/Ziele/Profil). **Noch nicht:** Schlaf, Peptide, die
tieferen Onboarding-Schritte (Laborwerte, Kategorien).

### ⭐ Leitprinzip: Manuell UND per KI — niemals nur eins von beidem

Siehe Abschnitt 1 für die vollständige Formulierung der Nutzerin. Kurz: die
App muss für "Nerds"/Kontrollmenschen genauso vollständig ohne KI nutzbar
bleiben wie für Menschen, die die KI die Arbeit machen lassen wollen. Jedes
manuelle Formular bleibt **immer** parallel zum jeweiligen Coach-Orb
bestehen — niemals eins zugunsten des anderen entfernen.

### Sicherheitsmodell (bewusste Entscheidung, bitte beibehalten)

Der Coach kann **niemals** eigenständig etwas speichern — jede Aktion
läuft über: (1) frei chatten, (2) Nutzerin tippt explizit auf einen
"Übernehmen/Anlegen/Setzen"-Knopf, (3) erst dann wird über die ganz normale
App-Funktion (dieselbe, die auch das manuelle Formular aufruft)
gespeichert. Kein direkter Datenbankzugriff durch die KI, kein
Code-Zugriff.

### ⚠️ Gemini-Setup — wichtige Fallstricke für die Zukunft

1. **Edge-Function-Adresse ist NICHT `gemini-chat`, sondern
   `clever-worker`.** Beim erstmaligen Deployen über den
   Supabase-Browser-Editor ("Via Editor") vergibt Supabase automatisch
   einen zufälligen Slug (Teil der URL) — dieser lässt sich über die
   Supabase-Oberfläche **im Nachhinein nicht mehr umbenennen**. Das
   "Name"-Feld in den Function-Settings ändert nur die Anzeige, nicht die
   echte Adresse. Der Code in `aiProviders.js` ruft deshalb bewusst
   `.../functions/v1/clever-worker` auf (Konstante
   `GEMINI_EDGE_FUNCTION_SLUG`), obwohl die Quelldatei weiterhin unter
   `supabase/functions/gemini-chat/index.ts` liegt. **Falls die Funktion
   irgendwann sauber unter dem Namen `gemini-chat` neu deployt wird**
   (z. B. per CLI, wo der Name frei wählbar ist), muss diese Konstante
   angepasst werden.
2. **Gemini-Modellnamen veralten schnell.** `gemini-2.5-flash` (ursprünglich
   empfohlen) war zum Testzeitpunkt bereits für neue Nutzer abgeschaltet.
   Aktuell konfiguriert: `gemini-3.6-flash`. Bei einem erneuten "model not
   found"-Fehler: aktuelle Modellliste unter
   `ai.google.dev/gemini-api/docs/latest-model` prüfen (Web-Suche nutzen,
   nicht raten — die Modellgenerationen wechseln offenbar im
   Monats-/Quartalstakt).
3. **`GEMINI_API_KEY` ist ein Supabase-Secret, keine Vercel-Variable** —
   liegt unter Supabase Dashboard → Edge Functions → Secrets. Leicht zu
   verwechseln, da die restlichen `VITE_*`-Variablen bei Vercel liegen.
4. **`VITE_AI_MODEL`/`VITE_AI_PROVIDER` bei Vercel ändern reicht allein
   nicht** — Vite bäckt diese Variablen beim Build ein, nicht zur
   Laufzeit. Nach jeder Änderung braucht es einen manuellen Redeploy.

### Ollama/Groq — weiterhin im Code, aktuell nicht die aktive Konfiguration

- **Ollama**: lokal über Cloudflare Quick Tunnel erreichbar gemacht
  (`cloudflared tunnel --url http://localhost:11434`), Adresse ist
  **ephemeral** (ändert sich bei jedem Neustart des Tunnels/PCs). Kein
  Passwort auf Ollama — bewusst akzeptiertes, vorübergehendes
  Sicherheitsrisiko der Nutzerin.
- **Groq**: `supabase/functions/groq-chat/index.ts` ist deployt-fertig im
  Code, aber die Nutzerin kam nicht an einen Groq-API-Key (GitHub/Apple-
  Signup-Probleme) — Gemini wurde stattdessen genutzt. Falls Groq später
  doch gewünscht wird: Code ist fertig, nur Key besorgen + Secret setzen +
  `VITE_AI_PROVIDER=groq` setzen.

---

## 6. Offene Punkte — konkret, mit nächstem Schritt

| # | Thema | Status | Nächster Schritt |
|---|-------|--------|-------------------|
| 1 | Weitere Bereiche für KiChat (Schlaf, Peptide) | Noch nicht umgesetzt | Nach demselben Muster wie die 8 bestehenden Bereiche, bei Bedarf |
| 2 | Onboarding-Begleitung Phase 2 (freies Erzählen + automatische Feld-Zuordnung) | Bewusst zurückgestellt, Phase 1 (Felder einzeln abfragen) ist fertig | Eigener Anlauf, nach explizitem Auftrag |
| 2b | Coach-Begleitung für Laborwerte + die 9 Kategorien-Schritte | Noch nicht umgesetzt — deutlich vielschichtiger (Multi-Add, Dosierung, Foto/OCR, WochenplanEditor) | Eigener Anlauf pro Kategorie, nach explizitem Auftrag |
| 3 | Gemini-Edge-Function sauber unter `gemini-chat` statt `clever-worker` neu deployen | Funktioniert wie es ist, aber unschöner Name/Slug-Mismatch | Nur bei Gelegenheit, z. B. via Supabase CLI statt Browser-Editor — danach `GEMINI_EDGE_FUNCTION_SLUG` in `aiProviders.js` zurückändern |
| 4 | Groq als Provider aktivieren | Code fertig, aber kein API-Key vorhanden | Falls Nutzerin einen Groq-Key bekommt: Secret setzen, `VITE_AI_PROVIDER=groq` |
| 5 | Cloudflare-Tunnel-Adresse für Ollama ist ephemeral | Bekannte Einschränkung, aktuell nicht aktiv genutzt (Gemini läuft) | Nur relevant, falls wieder auf Ollama gewechselt wird |
| 6 | Groq-Streaming | Noch nicht implementiert (nur Ollama + Gemini) | Bei Bedarf, gleiches Muster wie Gemini-SSE-Streaming übernehmen |
| 7 | Multi-User-/"jeder Teilnehmer bekommt eigenen Coach"-Vision | Mit Gemini technisch näher (Cloud statt Ein-PC-Ollama), aber noch nicht umgesetzt | Bei Bedarf besprechen |
| 8 | Plus-Button erscheint auf allen Screens, nicht nur Home | Bewusste Vereinfachung (ein globaler Button), Nutzerin hat das nicht explizit anders gewünscht | Nur ändern, falls sie das ausdrücklich anders will |
| 9 | `bereichErkennen()`-Routing (universeller Home-Coach) nur für Home | Bewusst so begrenzt — die 7 Bereichs-Chats kennen ihren Bereich schon | Bei Bedarf auf weitere "universelle" Einstiegspunkte ausweiten |
| 10 | Echte Cloud-TTS-Stimme statt Web Speech API | Nutzerin hat robotische Stimme kritisiert, Web-Speech-API-Grenzen erklärt | Nur nach explizitem Wunsch — würde laufende Kosten bedeuten (z. B. ElevenLabs, Google Cloud TTS) |

---

## 7. Ziele / Gesamtvision (unverändert)

- ADHS-freundliche, reizarme App zur Verwaltung komplexer
  Gesundheitsprotokolle — Notfallmodus für überforderte Tage.
- Ist-Zustand + Zielzustand sauber trennen und sichtbar machen.
- **KI-Coach als Ersatz für einen klassischen Online-Coach**: Nutzerin
  möchte sich mit einem persönlich benannten Coach unterhalten, der die
  Arbeit im Hintergrund erledigt, statt selbst Formulare auszufüllen —
  jetzt in 8 Bereichen umgesetzt, mit Cloud-KI (Gemini) auch unterwegs
  nutzbar, und im Home-Bereich universell (alle 7 Aktionen, nicht nur
  Gewohnheiten).
- **Gleichzeitig, gleichrangig: vollständige manuelle Nutzbarkeit ohne
  jede KI** — siehe Leitprinzip in Abschnitt 1/5. Beide Bedienwege sind
  Kernversprechen der App, nicht KI-Weg mit manuellem Fallback.
- Langfristig denkbar: Coach führt komplett durchs Onboarding, und/oder
  mehrere echte Nutzer bekommen jeweils eigene Coach-Instanzen.

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
  Unverständnis.
- **Dashboards (Supabase/Vercel) können täuschen**: ein angezeigtes
  "Name"-Feld ist nicht zwangsläufig die echte Adresse/der echte Slug —
  siehe Abschnitt 5, Gemini-Fallstrick #1. Im Zweifel selbst über die
  Screenshots nachvollziehen, was technisch wirklich passiert, nicht nur
  was die UI suggeriert.
- **Eigene Sandbox hat keinen Netzwerkzugriff nach außen** (Supabase,
  Vercel, etc. sind blockiert — bestätigt über `curl` + 403 von der
  Proxy-Policy). Live-Verifikation von Deployments/Endpunkten ist nur über
  Screenshots der Nutzerin möglich, nicht selbst per `curl`/Browser-Test.
  Ehrlich kommunizieren statt es wiederholt zu versuchen.
- **Alles außerhalb von Code sehr kleinschrittig erklären** — echte
  Klick-für-Klick-Anleitungen, keine Fachbegriffe ohne Erklärung.
- **Keine Infrastruktur-Fakten erfinden** — Hosting-URL, Konten-Zugänge,
  Modellnamen etc. im Zweifel per Web-Suche verifizieren statt zu raten
  (siehe Gemini-Modell-Fallstrick, Abschnitt 5).
- **Git-Workflow:** Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`,
  NICHT direkt auf `main` arbeiten, dann fetch+fast-forward-merge+push nach
  `main` (in dieser Session-Reihe wiederholt so autorisiert).
- **Dieses Dokument aktuell halten** — bei nächster Gelegenheit neu
  schreiben (nicht nur ergänzen), sobald sich wieder viel verändert hat.

---

**Letzte Aktualisierung:** 27.07.2026, spät abends — Coach heißt jetzt
"Aka" mit fest vorgegebener Persönlichkeit, Wissens-Basis
(`src/wissen/`) + Trackingdaten-Zusammenfassung laufen jetzt in jedem
Bereich mit, und Coach-geführtes Onboarding (Phase 1: Name/Ziele/Profil
einzeln abfragen) ist fertig umgesetzt und deployt. Leitprinzip "Manuell
UND per KI" bleibt unverändert gültig (Abschnitt 1, 5, 7, 8). Nächster
sinnvoller Ansatzpunkt: offene Punkte in Abschnitt 6 durchgehen,
insbesondere Onboarding-Begleitung Phase 2 und die tieferen
Kategorien-Schritte.
