# 📋 ÜBERGABEPROTOKOLL: MyProtocols App

**Stand: 27.07.2026, später Nachmittag/Abend, Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`**

> ⚠️ **Diese Fassung ersetzt die Version vom Vormittag desselben Tages.** Seitdem kam ein sehr umfangreicher KI-Coach-Ausbau dazu (siehe Abschnitt 4/5) — die technischen Grundlagen (Architektur, Datenmodell) sind unverändert, aber Abschnitt 5 (KI-Coach) und Abschnitt 6 (offene Punkte) haben sich stark verändert und sollten komplett neu gelesen werden, nicht nur überflogen.

---

## 1. Was ist diese App?

**MyProtocols** ist eine Web-App zur Selbstverwaltung von
Gesundheitsprotokollen/Biohacking, mit besonderem Fokus auf
ADHS-Freundlichkeit (reduzierte Reizüberflutung, Notfallmodus, große
Bedienelemente, klare Sprache). Die Nutzerin ist selbst nicht technisch
versiert (kommuniziert per Spracheingabe, oft mit Transkriptionsfehlern) —
siehe Abschnitt 8 für Hinweise zur Zusammenarbeit.

Abgedeckte Lebensbereiche (jeder mit eigenem Plan/Protokoll):

- **Schlaf**, **Hydration**, **Ernährung**, **Training**, **Gewohnheiten**,
  **Supplemente**, **Medikamente/Hormone**, **Peptide**
- **Tageslicht** (⭐ neu heute) — wie viel Zeit am Tag im Freien/Tageslicht
  verbracht wird, trackbar und planbar (Tagesziel in Minuten)

Darüber liegt ein **Hauptprotokoll** (Name, Startdatum, Grund/Ziel), unter
dem alle Kategorien als **Teilprotokolle** laufen.

**Der KI-Coach** (⭐ heute von einem reinen Backend-Modul zu einer
durchgängig nutzbaren Funktion ausgebaut, siehe Abschnitt 5): Ein
persönlich benennbarer Assistent (z. B. "Coach Acker"), der in mehreren
Bereichen als echter Chat verfügbar ist — er fragt nach, schlägt vor, und
legt nach Bestätigung durch die Nutzerin selbst neue Einträge an (Rezepte,
Trainingspläne, Gewohnheiten, Supplemente, Medikamente, Ziele). Läuft
lokal über Ollama auf dem PC der Nutzerin (privat, kostenlos), mit
vorbereiteter Cloud-Option (Groq/Gemini) für später.

---

## 2. Tech-Stack (verifiziert)

- **Frontend:** React 19 + Vite 8, reines **JavaScript** (kein TypeScript
  trotz `@types/react` in devDependencies — reine Editor-Hilfe).
- **Backend/Datenbank:** Supabase (Postgres, Auth, Storage, Row Level
  Security, Edge Functions in Deno/TypeScript).
- **Hosting:** **Vercel**, Live-URL **`https://myprotocolsapp.vercel.app`**
  (heute mehrfach bestätigt). Automatischer Rebuild bei jedem Push auf
  `main` — reine Environment-Variable-Änderungen lösen KEIN automatisches
  Rebuild aus, dafür braucht es manuell "Redeploy" im Vercel-Dashboard.
- **KI:** Lokales Ollama auf dem Windows-PC der Nutzerin (Modell aktuell:
  `qwen2.5:7b`), angebunden über `src/services/` (siehe Abschnitt 5).
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk`.

---

## 3. Architektur & wichtige Konzepte

### Verzeichnisstruktur (Auszug, verifiziert)

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus, ⭐ globaler Coach-Knopf
│   ├── TageslichtView.jsx         ⭐ NEU
│   ├── HydrationView.jsx, NutritionView.jsx, TrainingView.jsx,
│   │   GewohnheitenView.jsx, SupplementeView.jsx, MedikamenteView.jsx
│   │   → alle ⭐ heute um eine KiChat-Coach-Karte erweitert (siehe Abschnitt 5)
│   ├── onboarding/                Onboarding-Flow (Ist-Zustand-Fragen, Kategorien-Setup)
│   └── plan/                      PlaeneView (Tab-Hub für alle Kategorien), MehrTab (KI-Coach-Test + Coach-Name)
├── ui/
│   ├── primitives.jsx             Card, Label, TextInput, TextArea, PrimaryButton, Pill, ...
│   ├── KiChat.jsx                 ⭐ NEU: wiederverwendbare Chat-Oberfläche für den KI-Coach
│   ├── HydrationErinnerungenCard.jsx, WochenplanEditor.jsx, TimeWheelField.jsx, ...
├── services/
│   ├── aiProviders.js             Low-Level: Ollama/Groq/Gemini, Mehrfach-Turn-Gespräche (messages statt einzelner prompt)
│   └── aiService.js               Domänenfunktionen (siehe Abschnitt 5 für die vollständige Liste)
├── utils/
│   ├── coachStorage.js            ⭐ NEU: localStorage für den gewählten Coach-Namen
│   ├── dayItems.js                buildDayItems() + KATEGORIE_META (inkl. ⭐ tageslicht)
│   ├── kalorien.js                Mifflin-St-Jeor
├── context/AppDataContext.jsx     Zentrale Datenverwaltung — kombiniert ALLE data/use*.js-Hooks (inkl. ⭐ useTageslichtData)
└── constants.js                   TRAININGSARTEN, WOCHENTAGE, PLAENE_TABS (inkl. ⭐ tageslicht), ...
```

### Datenbank — neue Tabellen seit der letzten Fassung

`tageslicht_logs` (datum, minuten pro Tag), `tageslicht_settings`
(ziel_minuten, Standard 30) — Migration `0033_tageslicht.sql`, gleicher
Aufbau wie `hydration_logs`/`hydration_settings`.

### Design-Bereinigung (heute)

14 Dateien (Onboarding + einige ältere Views: Login, Welcome, Peptide,
Medikamente, GraceDayCard, QuickTaskList, LaborwerteCard,
WoechentlicheCheckinsCard) verwendeten noch fest codierte Farben aus einer
älteren Palette (`#0FB8A3` Teal, `#E5E7EB` Grau) statt der aktuellen
`theme.js`-Token (`accent`, `cardBorder`). Jetzt überall vereinheitlicht —
falls in Zukunft neue Komponenten entstehen: **immer** Farben aus
`src/ui/theme.js` importieren, nie Hex-Werte direkt in den Style schreiben.

---

## 4. Was wurde in dieser Session-Reihe verändert? (chronologisch nach Thema)

*(Punkte 1–9 stammen vom Vormittag desselben Tages, siehe vorherige
Protokoll-Fassung für Details — hier nur die Überschriften. Ab Punkt 10
neu seit dem Nachmittag.)*

1. Branch-Divergenz-Bereinigung
2. Trainings-Onboarding neu gebaut (Mehrfach-Einheiten pro Wochentag)
3. Zeit-Eingabe vereinheitlicht (natives `<input type="time">`)
4. Mini-Widgets repariert & erweitert (immer sichtbar, grau wenn ungenutzt)
5. Alte Formulardaten beim Onboarding geleert (`frisch`-Prop-Muster)
6. Kalorien-/Grundumsatz-Berechnung (Mifflin-St-Jeor)
7. Server-seitiges Push-Erinnerungssystem für Hydration (Edge Function + pg_cron)
8. Hydration-Erinnerungs-UI vereinheitlicht (geteilte Komponente, Datum+Speichern-Button)
9. Ist-Zustand-Fragen im Onboarding (Schlaf/Hydration/Ernährung/Training/Gewohnheiten) + Detailanzeige auf Abschluss-Screen
10. **KI-Coach-Servicemodul angelegt** (`src/services/aiProviders.js` + `aiService.js`) — Ollama/Groq/Gemini-Anbindung, austauschbar über `VITE_AI_PROVIDER`-ENV-Variable. Erste Testfunktion `morgenImpuls()` im Mehr-Tab.
11. **Coach-Name/Persona**: localStorage-Speicher (`utils/coachStorage.js`), einstellbar im Mehr-Tab, wird in jede KI-Anfrage als Rollenbeschreibung eingebettet.
12. **Design-Bereinigung** (siehe Abschnitt 3).
13. **Neuer Lebensbereich Tageslicht** (siehe Abschnitt 3) — DB, Hook, View, Onboarding-Schritt, Mini-Widget, Navigation.
14. **Echte Chat-Funktion statt Einmal-Vorschlag**: `aiProviders.js`/`sendeAnfrage()` von einzelnem `prompt` auf vollen Gesprächsverlauf (`messages`) umgestellt — das Modell kann sich jetzt an frühere Antworten halten. Neue wiederverwendbare Komponente `ui/KiChat.jsx` (Chat-Verlauf, Eingabefeld, optionaler "Übernehmen"-Knopf mit Ergebnisanzeige).
15. **KiChat in sieben Bereichen eingebaut** — überall nach demselben sicheren Muster: frei mit dem Coach reden/nachfragen lassen, erst nach explizitem "Übernehmen"-Tap wird wirklich gespeichert:
    - **Training**: Trainingsplan besprechen → Einheiten in den Wochenplan übernehmen.
    - **Gewohnheiten**: neue Gewohnheit besprechen (Uhrzeit/Zeitfenster, Menge, Zieltage) → anlegen.
    - **Ernährung**: Rezeptvorschläge besprechen (kennt KFA/Gewicht/Kalorienziel automatisch) → als Mahlzeiten anlegen.
    - **Hydration**: Tagesziel + Erinnerungszeiten besprechen → Ziel setzen, neue Zeiten an bestehende anhängen.
    - **Tageslicht**: Tagesziel besprechen → setzen.
    - **Supplemente**: neues Supplement besprechen (Tageszeiten, Hinweis) → anlegen.
    - **Medikamente**: neues Medikament/Hormon besprechen (volle Dosierungslogik: Menge, Kategorie, Einnahmeart, Intervall, Uhrzeiten) → anlegen.
16. **Globaler Coach-Zugang auf der Startseite**: neuer Knopf direkt unter der Begrüßung in `HomeView.jsx` — öffnet denselben Chat, beantwortet allgemeine Fragen und kann (wie im Gewohnheiten-Bereich) direkt neue Gewohnheiten anlegen.
17. **Ollama übers Internet erreichbar gemacht** (Cloudflare Quick Tunnel, siehe Abschnitt 5) — die Nutzerin kann den KI-Coach jetzt auch vom Handy/Tablet aus nutzen, nicht nur auf dem PC, auf dem Ollama läuft.

---

## 5. KI-Coach — vollständiger technischer Überblick (heutiger Stand)

### Architektur

- `src/services/aiProviders.js` — Low-Level-Transport. `sendeAnfrage({system, messages, json})` nimmt den **vollen Gesprächsverlauf** entgegen (nicht nur die letzte Nachricht), einheitlich für alle drei Provider (Ollama `/api/chat`, Groq OpenAI-kompatibel, Gemini mit eigenem `contents`-Format). Provider-Wahl über `VITE_AI_PROVIDER`, Modell über `VITE_AI_MODEL`, Basis-URL über `VITE_AI_BASE_URL` (alle als Vercel-Environment-Variablen gesetzt).
- `src/services/aiService.js` — Domänenfunktionen, alle nutzen `mitPersona(coachName, rollenbeschreibung)` um den gewählten Coach-Namen einzubetten:
  - `morgenImpuls()` — Fließtext-Morgenimpuls (Testfunktion im Mehr-Tab).
  - `coachChat({systemPrompt, verlauf, coachName})` — generischer freier Chat-Turn, von `KiChat.jsx` intern genutzt.
  - Pro Bereich ein Funktionspaar **„…Vorschlag/…AusChat"**: `trainingsplanAusChat`, `ernaehrungsplanAusChat`, `gewohnheitAusChat`, `hydrationAusChat`, `tageslichtAusChat`, `supplementAusChat`, `medikamentAusChat` — nehmen jeweils den Gesprächsverlauf entgegen und liefern strukturiertes JSON **im exakten Format**, das die jeweilige `…Hinzufuegen()`/`…Setzen()`-Funktion aus `AppDataContext` erwartet.
- `src/ui/KiChat.jsx` — wiederverwendbare Chat-Oberfläche (Props: `systemPrompt`, `einleitung`, `onUebernehmen`, `uebernehmenLabel`, `renderErgebnis`). Zwei Phasen bewusst getrennt: frei reden (Fließtext) vs. auf Tap strukturiert zusammenfassen (JSON) — vermeidet, dass das Modell mitten im Gespräch zwischen beidem hin- und herspringen muss.
- `src/utils/coachStorage.js` — Coach-Name nur in localStorage, kein Server-Roundtrip.

### Wo der Coach heute überall verfügbar ist

Home (global), Training, Gewohnheiten, Ernährung, Hydration, Tageslicht,
Supplemente, Medikamente. **Noch nicht:** Schlaf, Peptide, Onboarding
selbst (siehe Abschnitt 6).

### Sicherheitsmodell (bewusste Entscheidung, bitte beibehalten)

Der Coach kann **niemals** eigenständig etwas speichern — jede Aktion
läuft über: (1) frei chatten, (2) Nutzerin tippt explizit auf einen
"Übernehmen/Anlegen/Setzen"-Knopf, (3) erst dann wird über die ganz normale
App-Funktion (dieselbe, die auch das manuelle Formular aufruft)
gespeichert. Kein direkter Datenbankzugriff durch die KI, kein
Code-Zugriff. Die Nutzerin hat das explizit so gewünscht ("kein
uneingeschränkter Zugriff, aber er soll die Funktionen nutzen können, die
ich als Nutzerin auch nutze").

### Ollama-Erreichbarkeit — drei mögliche Zustände

1. **Nur lokal** (`VITE_AI_BASE_URL` nicht gesetzt, Standard
   `http://localhost:11434`): funktioniert nur, wenn die Live-Seite auf
   demselben Computer geöffnet wird, auf dem Ollama läuft.
2. **Heimnetz** (nicht umgesetzt, nur besprochen): Ollama im selben WLAN
   erreichbar machen, für andere Geräte der Nutzerin zuhause.
3. **Cloudflare Quick Tunnel** (⭐ heute umgesetzt, aktueller Zustand):
   `cloudflared tunnel --url http://localhost:11434` auf dem PC gestartet,
   erzeugt eine öffentliche, zufällige `*.trycloudflare.com`-Adresse, in
   Vercel als `VITE_AI_BASE_URL` hinterlegt. **Wichtige Einschränkungen:**
   - Die Adresse ist **nicht dauerhaft** — bei jedem Neustart des
     `cloudflared`-Befehls (oder PC-Neustart) entsteht eine neue Adresse,
     die dann erneut in Vercel eingetragen und redeployt werden muss.
   - Das cmd-Fenster mit `cloudflared` muss die ganze Zeit offen/laufend
     bleiben, sonst ist die Adresse tot.
   - Ollama selbst hat **kein eingebautes Passwort** — die Nutzerin hat
     das Sicherheitsrisiko bewusst und ausdrücklich in Kauf genommen
     ("vorübergehend unsicher, kümmere mich später darum") — falls das
     Thema wieder aufkommt: sie wollte KEINE Portfreigabe am Router,
     sondern genau diesen Tunnel-Ansatz, weil er die Heim-IP nicht direkt
     offenlegt.

---

## 6. Offene Punkte — konkret, mit nächstem Schritt

| # | Thema | Status | Nächster Schritt |
|---|-------|--------|-------------------|
| 1 | Weitere Bereiche für KiChat (Schlaf, Peptide) | Noch nicht umgesetzt | Nach demselben Muster wie die 7 bestehenden Bereiche, bei Bedarf |
| 2 | KI-geführte Onboarding-Konversation (Coach stellt sich direkt nach Namenseingabe vor, begleitet Schritt für Schritt) | Bewusst zurückgestellt — größter Einzel-Umbau, verändert die Architektur des Einstiegs-Flows | Nur nach explizitem Auftrag angehen, eigene Sitzung dafür einplanen |
| 3 | Cloudflare-Tunnel-Adresse ist ephemeral | Bekannte Einschränkung, kein Bug | Falls die Nutzerin dauerhaften Zugriff will: benannter Cloudflare Tunnel (Konto nötig) oder Umstieg auf Cloud-Provider (Groq) besprechen |
| 4 | Sicherheit des KI-Zugriffs (kein Passwort auf Ollama) | Von der Nutzerin bewusst und ausdrücklich zurückgestellt | Nur ansprechen, wenn sie selbst das Thema wieder aufbringt — nicht von sich aus mahnen, sie weiß es |
| 5 | `send-due-reminders` Edge Function mit `startDatum`-Unterstützung neu deployen | Unklar, ob inzwischen erledigt (letzter bekannter Stand: nein) | Bei Gelegenheit nachfragen/prüfen |
| 6 | Push-Erinnerungen auf andere Kategorien ausweiten | Von der Nutzerin bewusst zurückgestellt | Nur nach explizitem Wunsch |
| 7 | Multi-User-/"jeder Teilnehmer bekommt eigenen Coach"-Vision | Technisch erklärt (aktuell: nur 1 Person kann den Live-KI-Zugriff nutzen, das ist die Nutzerin selbst über ihren PC) — Coach-Name/Persona-Feature ist der Teil davon, der schon funktioniert | Bei Bedarf: Umstieg auf Cloud-Provider oder dauerhaften Tunnel für echten Mehrnutzer-Betrieb besprechen |

---

## 7. Ziele / Gesamtvision (aktualisiert)

- ADHS-freundliche, reizarme App zur Verwaltung komplexer
  Gesundheitsprotokolle — Notfallmodus für überforderte Tage.
- Ist-Zustand + Zielzustand sauber trennen und sichtbar machen.
- Hinweise auf künftige Monetarisierungs-/Freischaltungsstufen (immer
  alle Widgets sichtbar, grau wenn nicht eingerichtet).
- **KI-Coach als Ersatz für einen klassischen Online-Coach**: Die Nutzerin
  möchte, dass Nutzer nicht selbst aufwendige Formulare/Pläne ausfüllen
  müssen, sondern sich mit einem persönlich benannten Coach ("digitaler
  Mitarbeiter") unterhalten, der die Arbeit im Hintergrund erledigt — genau
  das ist mit dem KiChat-Muster (Abschnitt 5) die Grundlage dafür, jetzt in
  7 Bereichen umgesetzt, erweiterbar auf den Rest der App.
- Langfristig denkbar: der Coach führt komplett durchs Onboarding (siehe
  offener Punkt 2), und/oder mehrere echte Nutzer bekommen jeweils eigene,
  zuverlässig erreichbare Coach-Instanzen (siehe offener Punkt 7).

---

## 8. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Die Nutzerin ist nicht technisch versiert**, spricht oft per
  Spracherkennung — Transkriptionsfehler bei Fachbegriffen sind normal
  (Beispiele: "Obama" = Ollama, "Nettify" = Netlify, "cloudflare tunnel"
  wurde korrekt verstanden nachdem konkrete Copy-Paste-Befehle gegeben
  wurden). Bei Screenshots/Fotos von Bildschirmen: genau hinschauen, oft
  liegt der Fehler an einer kleinen Verwechslung (z. B. `https://` statt
  `http://` bei lokalen Diensten), nicht an grundsätzlichem Unverständnis.
- **Alles außerhalb von Code sehr kleinschrittig erklären** — echte
  Klick-für-Klick-Anleitungen, keine Fachbegriffe ohne Erklärung.
- **Keine Infrastruktur-Fakten erfinden** — Hosting-URL, Konten-Zugänge
  etc. stehen nicht im Code, im Zweifel nachfragen/verifizieren lassen statt
  zu vermuten.
- **Git-Workflow:** Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`,
  NICHT direkt auf `main` arbeiten. Merge/Push nach `main` erst nach
  Freigabe der Nutzerin — sie hat das heute mehrfach pauschal für
  "weiterarbeiten, bis das Kontingent aufgebraucht ist" erteilt, das gilt
  aber nur für diese eine Sitzung, nicht automatisch für künftige.
- **Große Anfragen kommen oft gebündelt** (mehrere Wünsche in einer
  Nachricht) — beim Umsetzen: klar priorisieren, ehrlich sagen was heute
  geht und was nicht, lieber weniger sauber fertigstellen als alles
  gleichzeitig halb bauen.
- **Dieses Dokument aktuell halten** — bei nächster Gelegenheit neu
  schreiben (nicht nur ergänzen), sobald sich wieder viel verändert hat.

---

**Letzte Aktualisierung:** 27.07.2026, Nachmittag/Abend — Nutzerin hat
angewiesen, autonom weiterzuarbeiten ("bis unser Nutzungskontingent
aufgebraucht ist"). Nächster sinnvoller Ansatzpunkt beim nächsten Gespräch:
offene Punkte in Abschnitt 6 durchgehen, insbesondere prüfen ob der
Cloudflare-Tunnel noch läuft (Adresse ändert sich bei Neustart).
