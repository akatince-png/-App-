# 📋 ÜBERGABEPROTOKOLL: MyProtocols App

**Stand: 27.07.2026, Abend, Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`**

> ⚠️ **Diese Fassung ersetzt die Version vom späten Nachmittag desselben Tages.** Seitdem: KI-Coach läuft jetzt produktiv über **Gemini in der Cloud** (nicht mehr nur lokales Ollama), großer Design-Umbau (Home-Button, Plus-Button, animierter Coach-Orb), Performance-Fixes. Abschnitt 5 (KI-Coach) und Abschnitt 6 (offene Punkte) komplett neu lesen.

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

**Der KI-Coach**: Ein persönlich benennbarer Assistent (z. B. "Coach
Acker"), der in 8 Bereichen als echter Chat verfügbar ist — er fragt nach,
schlägt vor, und legt nach Bestätigung durch die Nutzerin selbst neue
Einträge an (Rezepte, Trainingspläne, Gewohnheiten, Supplemente,
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
  `medikamentAusChat`), alle nutzen `mitPersona()` für den Coach-Namen.
- `src/ui/KiChat.jsx` — geschlossen: zeigt nur `CoachOrb` + "{Name} fragen"
  als Trigger-Zeile. Offen: Bottom-Sheet-Modal mit Chat-Verlauf,
  Mikrofon/Texteingabe, optionalem "Übernehmen"-Knopf. Tap auf den
  geschlossenen Orb startet automatisch die Spracherkennung.

### Wo der Coach heute verfügbar ist

Home, Training, Gewohnheiten, Ernährung, Hydration, Tageslicht,
Supplemente, Medikamente. **Noch nicht:** Schlaf, Peptide, Onboarding
selbst.

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
| 2 | KI-geführte Onboarding-Konversation | Bewusst zurückgestellt — größter Einzel-Umbau | Nur nach explizitem Auftrag, eigene Sitzung einplanen |
| 3 | Gemini-Edge-Function sauber unter `gemini-chat` statt `clever-worker` neu deployen | Funktioniert wie es ist, aber unschöner Name/Slug-Mismatch | Nur bei Gelegenheit, z. B. via Supabase CLI statt Browser-Editor — danach `GEMINI_EDGE_FUNCTION_SLUG` in `aiProviders.js` zurückändern |
| 4 | Groq als Provider aktivieren | Code fertig, aber kein API-Key vorhanden | Falls Nutzerin einen Groq-Key bekommt: Secret setzen, `VITE_AI_PROVIDER=groq` |
| 5 | Cloudflare-Tunnel-Adresse für Ollama ist ephemeral | Bekannte Einschränkung, aktuell nicht aktiv genutzt (Gemini läuft) | Nur relevant, falls wieder auf Ollama gewechselt wird |
| 6 | Groq-Streaming | Noch nicht implementiert (nur Ollama + Gemini) | Bei Bedarf, gleiches Muster wie Gemini-SSE-Streaming übernehmen |
| 7 | Multi-User-/"jeder Teilnehmer bekommt eigenen Coach"-Vision | Mit Gemini technisch näher (Cloud statt Ein-PC-Ollama), aber noch nicht umgesetzt | Bei Bedarf besprechen |
| 8 | Plus-Button erscheint auf allen Screens, nicht nur Home | Bewusste Vereinfachung (ein globaler Button), Nutzerin hat das nicht explizit anders gewünscht | Nur ändern, falls sie das ausdrücklich anders will |

---

## 7. Ziele / Gesamtvision (unverändert)

- ADHS-freundliche, reizarme App zur Verwaltung komplexer
  Gesundheitsprotokolle — Notfallmodus für überforderte Tage.
- Ist-Zustand + Zielzustand sauber trennen und sichtbar machen.
- **KI-Coach als Ersatz für einen klassischen Online-Coach**: Nutzerin
  möchte sich mit einem persönlich benannten Coach unterhalten, der die
  Arbeit im Hintergrund erledigt, statt selbst Formulare auszufüllen —
  jetzt in 8 Bereichen umgesetzt, mit Cloud-KI (Gemini) auch unterwegs
  nutzbar.
- Langfristig denkbar: Coach führt komplett durchs Onboarding, und/oder
  mehrere echte Nutzer bekommen jeweils eigene Coach-Instanzen.

---

## 8. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

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

**Letzte Aktualisierung:** 27.07.2026, Abend — Gemini-Coach bestätigt
funktionsfähig (Nutzerin: "Es funktioniert, der Coach antwortet"). Nächster
sinnvoller Ansatzpunkt: offene Punkte in Abschnitt 6 durchgehen.
