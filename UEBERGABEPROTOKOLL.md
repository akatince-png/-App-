# 📋 ÜBERGABEPROTOKOLL: MyProtocols App

**Stand: 26.07.2026 (Ende Arbeitstag), Branch `claude/app-uebergabeprotokoll-improvements-03r3b3`**

> ⚠️ **Diese Fassung ersetzt eine ältere Version dieser Datei.** Die alte
> Fassung beschrieb teils einen anderen, nicht mehr existierenden Codestand
> (z. B. eine Datei `OnboardingTrainingSetupView.jsx`, die inzwischen
> gelöscht wurde, TypeScript-Dateiendungen, wo tatsächlich reines
> JavaScript verwendet wird, und Datenbank-Tabellennamen, die nicht mit dem
> echten Schema übereinstimmten). Diese Fassung wurde direkt gegen den
> aktuellen Code und die echten Migrationen geprüft. **Trotzdem gilt:**
> Infrastruktur-Fakten wie die genaue Live-URL oder der Hosting-Anbieter
> stehen nicht im Code selbst — die als "laut Nutzerin bestätigt"
> markierten Punkte sind verifiziert, alles andere in diesem Bereich bitte
> vor Gebrauch nochmal mit der Nutzerin abgleichen.

---

## 1. Was ist diese App?

**MyProtocols** ist eine Web-App zur Selbstverwaltung von
Gesundheits-/Biohacking-Protokollen, mit besonderem Fokus auf
ADHS-Freundlichkeit (reduzierte Reizüberflutung, "Notfallmodus" mit nur den
wichtigsten Aufgaben, große Bedienelemente, klare Sprache). Die Nutzerin,
für die diese App gebaut wird, ist selbst nicht technisch versiert
(kommuniziert per Spracheingabe, oft mit Transkriptionsfehlern) — die App
muss entsprechend einfach bedienbar sein, und die Kommunikation mit ihr
entsprechend geduldig und in einfacher Sprache erfolgen (siehe Abschnitt 8).

Abgedeckte Bereiche ("Kategorien", jede mit eigenem Plan/Protokoll):

- **Schlaf** — Bett-/Aufwachzeiten, mehrere Blöcke möglich (z. B. Woche vs. Wochenende)
- **Hydration** — Tagesziel in ml, mehrere Erinnerungszeiten mit Menge + optionalem Startdatum
- **Ernährung** — Mahlzeiten mit Zutaten, Wochentag-Zuordnung, Kalorien-/Makro-Übersicht
- **Training** — Mehrere Einheiten pro Wochentag möglich, mit Trainingsart(en), Sätzen/Wiederholungen, Übungen, Warm-up/Cool-down
- **Gewohnheiten** — freie Routinen mit fester Uhrzeit oder Zeitfenster, Zieltage
- **Supplemente** — Dosierung, Einnahmeart, Intervall (täglich/Zyklus/feste Wochentage)
- **Medikamente/Hormone** — wie Supplemente, zusätzlich Kategorie (z. B. "Hormone")
- **Peptide** — eigener Auswahl-Katalog + Dosierung, inkl. Foto der Präparate

Darüber liegt ein **Hauptprotokoll** (Name, Startdatum, Grund/Ziel), unter
dem alle Kategorien als **Teilprotokolle** laufen (aktiv/inaktiv, eigenes
Startdatum, Laufzeit). Es kann mehrere Hauptprotokolle geben (z. B. für
verschiedene Phasen).

**Aktueller Zusatzbaustein (heute begonnen):** Ein optionales **KI-Coach-Modul**
soll perspektivisch einen "Morgen-Impuls", KI-gestützte Trainingsplan- und
Ernährungsvorschläge liefern — lokal über Ollama (Datenschutz/Kosten) mit der
Option, später auf eine Cloud-API umzuschalten. Siehe Abschnitt 5.

---

## 2. Tech-Stack (verifiziert)

- **Frontend:** React 19 + Vite 8, reines **JavaScript** (`.js`/`.jsx`,
  **kein TypeScript** trotz `@types/react` in devDependencies — die sind
  nur für Editor-Autovervollständigung, es gibt keine `.ts`/`.tsx`-Dateien
  und kein `tsconfig.json`).
- **Backend/Datenbank:** Supabase (Postgres, Auth, Storage, Row Level
  Security, Edge Functions in Deno/TypeScript).
- **Linting:** `oxlint` (`npm run lint`).
- **Kein eigener Node-/Express-Server** — die App ist ein reiner statischer
  Vite-Build, der direkt gegen Supabase spricht. Alles, was serverseitig
  laufen muss (Cron-Jobs, geheime API-Keys), läuft über Supabase Edge
  Functions, nicht über einen eigenen Server.
- **Hosting/Deployment:** **Vercel**, laut Nutzerin heute bestätigt (Adresse
  endet auf `.vercel.app`). Die genaue Live-URL wurde in dieser Session
  nicht neu bestätigt (die alte Protokoll-Fassung nannte
  `https://myprotocolsapp.vercel.app/` — plausibel, aber bitte einmal mit
  der Nutzerin gegenchecken, bevor man sich darauf verlässt). Es liegt
  zusätzlich eine `netlify.toml` im Repo (vermutlich Überbleibsel eines
  früheren Versuchs, aktuell ungenutzt).
  - Vercel baut automatisch bei jedem Push auf `main` neu — ABER: reine
    Änderungen an Environment Variables lösen KEIN automatisches Rebuild
    aus, dafür braucht es manuell "Redeploy" im Vercel-Dashboard.
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk` (aus einer früheren
  Session bestätigt, als die Cron-Migration korrigiert wurde).

---

## 3. Architektur & wichtige Konzepte

### Verzeichnisstruktur (verifiziert, Stand heute)

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus
│   ├── HydrationView.jsx, NutritionView.jsx, TrainingView.jsx, ...
│   ├── onboarding/
│   │   ├── OnboardingFlow.jsx           Orchestriert die Onboarding-Phasen
│   │   ├── OnboardingIntroView.jsx
│   │   ├── HauptprotokollErstellenView.jsx
│   │   ├── OnboardingZieleView.jsx
│   │   ├── OnboardingProfilView.jsx      inkl. Grundumsatz-Anzeige (Mifflin-St Jeor)
│   │   ├── OnboardingLaborwerteView.jsx
│   │   ├── OnboardingCategoriesView.jsx  Kategorien-Setup + Ist-Zustand-Fragen ⭐ heute erweitert
│   │   ├── OnboardingCompletionView.jsx  Abschluss-Screen mit Detailanzeige ⭐ heute erweitert
│   │   └── categorySteps.js              CATEGORY_STEPS-Reihenfolge (siehe unten)
│   └── plan/                     Tabs für "Mehr"/Profil/Statistik/Archiv/Community
├── ui/                            Wiederverwendbare Komponenten
│   ├── primitives.jsx             Card, Label, TextInput, TextArea, PrimaryButton, Pill, ...
│   ├── MiniPlanWidget.jsx          Doppelring-Widget, jetzt aktiv/inaktiv + Tap-Navigation
│   ├── HydrationErinnerungenCard.jsx  Geteilt zwischen Onboarding & HydrationView
│   ├── WochenplanEditor.jsx        Mehrfach-Trainingseinheiten-Builder
│   ├── TimeWheelField.jsx          Native <input type="time">, groß gestylt
│   ├── NumberWheelField.jsx / WheelPicker.jsx  Custom Scroll-Wheel (bewusst NICHT nativ)
│   └── ...
├── context/
│   ├── AppDataContext.jsx         Zentrale Datenverwaltung — kombiniert ALLE data/use*.js-Hooks
│   └── AuthContext.jsx
├── data/                          Ein Hook pro Datenbereich (useHydrationData.js, useMealData.js, ...)
├── services/                      ⭐ NEU heute: aiProviders.js, aiService.js (KI-Coach)
├── i18n/
│   ├── translate.ts               useT() Hook (t() für dict/, tLabel() für labels/)
│   ├── dict/                      Übersetzungstexte pro Screen (common, login, welcome, onboarding, home, ...)
│   └── labels/                    Übersetzungen für Konstanten-Werte (core, onboarding, substanzen, tagesplan, training)
├── utils/
│   ├── dayItems.js                 buildDayItems() + KATEGORIE_META (siehe unten)
│   ├── adhsStorage.js               ADHS-Notfallmodus-Persistierung (localStorage)
│   ├── widgetPrefs.js               ⭐ "Alle Widgets anzeigen"-Präferenz (localStorage)
│   ├── kalorien.js                  ⭐ Mifflin-St-Jeor-Grundumsatz-Berechnung
│   └── ...
├── lib/                            supabaseClient.js, storage.js (Foto-Upload), pushConfig.js (VAPID Key)
└── constants.js                    TRAININGSARTEN, WOCHENTAGE, PEPTIDE_OPTIONEN, ...
```

Anmerkung: `src/i18n/translate.ts` ist tatsächlich eine `.ts`-Datei (einzige
Ausnahme) — ändert nichts daran, dass der Rest reines JS ist.

### Datenbank (Supabase Postgres) — echte Tabellen

`profiles`, `protocols`, `protocol_peptide`, `peptide_logs`, `hormones`,
`hormone_logs`, `supplements`, `supplement_logs`, `meals`,
`meal_ingredients`, `meal_logs`, `meal_wochenplan`, `training_templates`,
`training_wochenplan`, `training_sessions`, `routines`, `routine_logs`,
`routine_peptide_items`, `routine_hormon_items`, `routine_supplement_items`,
`routine_meal_items`, `hydration_settings`, `hydration_logs`,
`drink_recipes`, `drink_recipe_ingredients`, `drink_logs`, `sleep_entries`,
`biomarkers`, `blutwerte_archiv`, `checkins`, `custom_messwerte`,
`aenderungsprotokoll`, `hauptprotokolle`, `teilprotokolle`,
`wochenprotokoll_snapshots`, `push_subscriptions`.

Wiederkehrendes Muster: mehrere Kategorien speichern flexible
Einstellungen nicht in eigenen Spalten, sondern als `jsonb` auf
`profiles`: **`profiles.category_ziele`** (Zieldauer + jetzt auch
Ist-Zustand-Antworten je Kategorie, siehe unten) und
**`profiles.erinnerungen`** (Erinnerungs-Ein/Aus bzw. bei Hydration die
konkrete Zeitenliste).

### Zentrale Konzepte

- **`AppDataContext` / `useAppData()`** (`src/context/AppDataContext.jsx`):
  Ein einziger Context, der alle `data/use*.js`-Hooks zusammenführt
  (`...profileData, ...protocolData, ...hydrationData, ...` usw.). Jede
  View holt sich daraus, was sie braucht.
- **`KATEGORIE_META`** (`src/utils/dayItems.js`): Farben/Labels pro
  Kategorie — Felder sind `bg`, `text`, `dot`, `label` (**kein** `color`-Feld
  — ein früherer Bug griff fälschlich auf `meta.color` zu, ist behoben).
- **`useT()`** (`src/i18n/translate.ts`): `t("dict.key", {var})` für feste
  Übersetzungstexte, `tLabel("Wert")` für freie/konstante Strings.
  Sprachen: DE/EN/TR.
- **ADHS-Notfallmodus** (`src/utils/adhsStorage.js`): Toggle, persistiert in
  localStorage, blendet auf der Startseite alles bis auf die essenziellen
  Kategorien aus.
- **Mini-Widgets-Sichtbarkeit** (`src/utils/widgetPrefs.js`, ⭐ neu):
  Unabhängig vom ADHS-Modus — ein zweiter Schalter, ob NICHT eingerichtete
  Kategorien als graues, antippbares Widget trotzdem sichtbar sind (Default:
  ja — relevant für künftige Freischaltung einzelner Bereiche/Monetarisierung).
- **`categorySteps.js`** — echte, aktuelle Reihenfolge des
  Onboarding-Kategorien-Schritts: `schlaf → hydration → ernaehrung →
  training → gewohnheiten → supplemente → medikamente → peptide`. Biomarker
  ist bewusst KEIN Kategorie-Schritt mehr (eigener Schritt vorher, da
  "Ausgangslage" statt "Plan").

---

## 4. Was wurde in dieser Session-Reihe verändert? (chronologisch nach Thema)

*(Diese Liste fasst nicht nur den heutigen Tag zusammen, sondern die
gesamte Entwicklung seit der letzten funktionierenden Übergabe, soweit aus
dem Gesprächsverlauf rekonstruierbar.)*

1. **Branch-Divergenz-Bereinigung:** Ein Merge-Versuch nach `main` deckte
   24 unbekannte parallele Commits auf; der eigene Branch wurde komplett neu
   gegen den echten `main`-Stand aufgebaut, alle bisherigen Änderungen neu
   umgesetzt.
2. **Trainings-Onboarding neu gebaut:** Alte, kaputte
   `OnboardingTrainingSetupView.jsx` (rief nicht existierende Funktionen
   auf) gelöscht. Neuer Mehrfach-Einheiten-Builder
   (`WochenplanEditor.jsx` + `useTrainingTemplates.js`): pro Wochentag
   mehrere Trainingseinheiten mit kombinierbaren Trainingsarten,
   Sätzen/Wiederholungen, Übungen (Freitext), Warm-up/Cool-down. DB-Migration
   `0030_training_wochenplan_einheiten.sql`.
3. **Zeit-Eingabe vereinheitlicht:** `TimeWheelField.jsx` nutzt jetzt
   überall ein natives, groß gestyltes `<input type="time">` (nach zwei
   Kehrtwenden in der Abstimmung mit der Nutzerin — das war ein reines
   Missverständnis, technisch unverändert seit der zweiten Umsetzung).
   `NumberWheelField`/`WheelPicker` bleiben bewusst der Custom-Scroll-Wheel
   für Zahlen (Sätze, Wiederholungen etc.), inkl. Haptik
   (`navigator.vibrate`). Sekunden-Anzeige-Bug in `useMealData.js` behoben
   (`.slice(0,5)` auf die Uhrzeit).
4. **Mini-Widgets repariert & erweitert:** Drei echte Bugs behoben (falscher
   `meta.color`-Zugriff statt `meta.dot`; kaputter Notfallmodus-Filter;
   Hydration-Widget hydrierte nie wegen falscher Datenmodell-Annahme).
   Danach erweitert: ALLE Kategorie-Widgets immer sichtbar (grau/entsättigt
   wenn nicht eingerichtet), antippbar (springt ins jeweilige Menü), eigener
   Sichtbarkeits-Schalter unabhängig vom ADHS-Modus
   (`widgetPrefs.js`), Hydration-Widget mit "+200ml"-Schnellzugriff direkt
   auf der Startseite.
5. **Alte Formulardaten beim Onboarding geleert** (nicht-destruktiv — echte
   Daten bleiben erhalten, nur die Eingabemasken starten leer): Hydration
   ml, persönliche Daten, Laborwerte — via neuem `frisch`-Prop-Muster auf
   `PersoenlicheDatenCard.jsx` / `LaborwerteFelder.jsx` / `LaborwerteCard.jsx`.
6. **Kalorien-/Grundumsatz-Berechnung** (`src/utils/kalorien.js`,
   Mifflin-St-Jeor-Formel): Anzeige im Profil-Onboarding-Schritt und in
   `NutritionView.jsx` (editierbares Kalorienziel + Prozent-Abweichung,
   gespeichert in `category_ziele.ernaehrung.kalorienZiel`).
7. **Server-seitiges Push-Erinnerungssystem für Hydration** (funktioniert
   auch bei geschlossener App/PWA):
   - Neue Edge Function `supabase/functions/send-due-reminders/index.ts` —
     per `x-cron-secret`-Header abgesichert, liest `profiles.zeitzone` +
     `profiles.erinnerungen.hydration.zeiten` (`{zeit, menge, startDatum?}`),
     vergleicht mit lokaler Uhrzeit/Datum der Nutzerin (via `Intl`), schickt
     Web-Push.
   - Migration `0031_profile_zeitzone.sql` (neue Spalte) +
     `useProfileData.js` erfasst die Zeitzone automatisch beim Laden
     (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
   - Migration `0032_erinnerungs_versand.sql` — `pg_cron`/`pg_net`,
     minütlicher Aufruf der Edge Function.
   - Manuelles Deployment über das Supabase-Dashboard wurde mit der
     Nutzerin Schritt für Schritt durchgeführt (mehrere Stolpersteine:
     Entry-Point musste `index.ts` heißen, Funktionsname musste exakt
     `send-due-reminders` sein, Platzhalter in der Migration mussten durch
     echte Projekt-Ref/Secret ersetzt werden).
8. **Hydration-Erinnerungs-UI vereinheitlicht:** Neue geteilte Komponente
   `HydrationErinnerungenCard.jsx` (vorher nur im Onboarding, jetzt auch in
   `HydrationView.jsx`). Iterativ vereinfacht auf Wunsch der Nutzerin: pro
   Zeile Uhrzeit + Menge (ml) + Datum + Löschen, darunter ein neuer Eintrag
   mit explizitem **"Speichern"**-Button (kein reines "+"-Icon mehr, damit
   das Abspeichern sich bestätigt anfühlt).
   - **Offen/bekannte Lücke:** Der Code der Edge Function unterstützt
     `startDatum` bereits, aber der letzte bekannte Stand ist, dass die
     Nutzerin die aktualisierte Function noch **nicht neu deployt** hat —
     unklar, ob das inzwischen nachgeholt wurde. Bitte im nächsten Gespräch
     nachfragen bzw. prüfen.
9. **Ist-Zustand-Fragen im Onboarding** (heute, ⭐):
   - `OnboardingCategoriesView.jsx`: neue `ISTZUSTAND_FRAGEN`-Konfiguration
     für genau 5 Kategorien — **Schlaf, Hydration, Ernährung, Training,
     Gewohnheiten** (bewusst NICHT Peptide/Hormone/Medikamente/Supplemente —
     Nutzerin-Entscheidung: das deckt sich schon mit Grund/Ziel des
     Hauptprotokolls). Antworten werden in
     `category_ziele[kategorie].istZustand` gespeichert.
   - `OnboardingCompletionView.jsx`: Abschluss-Screen zeigt jetzt pro
     Kategorie die Ist-Zustand-Antworten, die gewählte Zieldauer, und (wo
     ohne Zusatzabfrage verfügbar, z. B. bei Schlaf) grobe Plan-Inhalte an.
10. **KI-Coach-Servicemodul** (heute, ⭐ NEU, noch nicht in UI eingebunden):
    - `src/services/aiProviders.js` — Low-Level-Anbindung an Ollama (lokal,
      `/api/chat`, JSON-Mode via `format: "json"`), Groq (OpenAI-kompatibel,
      Bearer-Token) und Google Gemini (eigenes Format), Provider-Wahl
      ausschließlich über `VITE_AI_PROVIDER`-ENV-Variable.
    - `src/services/aiService.js` — drei App-Funktionen:
      `morgenImpuls()` (Fließtext-Motivationsimpuls),
      `trainingsplanVorschlag()` (JSON, 1:1 kompatibel zu
      `wochenplanHinzufuegen()`), `ernaehrungsplanVorschlag()` (JSON,
      Zutaten-Struktur kompatibel zu `mahlzeitHinzufuegen()`). Robustes
      JSON-Parsing auch ohne strikten Provider-JSON-Mode.
    - `.env.example` um `VITE_AI_PROVIDER`/`VITE_AI_MODEL`/`VITE_AI_BASE_URL`/
      `VITE_AI_API_KEY` erweitert.
    - **Noch nicht erledigt:** Kein UI-Aufruf irgendwo eingebaut (nur das
      Modul selbst, wie von der Nutzerin explizit gewünscht — "NUR das
      Modul"). Die Umgebungsvariable ist im Vercel-Projekt der Nutzerin noch
      nicht bestätigt gesetzt (siehe Abschnitt 6).

---

## 5. KI-Coach-Modul — technischer Kurzüberblick für den nächsten Agenten

- Datei-Layout: `src/services/aiProviders.js` (Transport) +
  `src/services/aiService.js` (Domänenfunktionen + JSON-Parsing).
- Provider-Wahl über `VITE_AI_PROVIDER` (`ollama` | `groq` | `gemini`),
  Modellname über `VITE_AI_MODEL`, optional `VITE_AI_BASE_URL` (Standard je
  Provider hinterlegt) und `VITE_AI_API_KEY` (nur Cloud-Provider).
- **Sicherheitsaspekt, noch nicht gelöst:** Bei Cloud-Providern (Groq/Gemini)
  würde ein clientseitig gesetzter `VITE_AI_API_KEY` im Browser-Bundle
  landen und wäre für jeden einsehbar. Für den aktuellen lokalen
  Ollama-Betrieb unkritisch (kein Key nötig), aber **bevor** die App auf
  Groq/Gemini umgestellt wird, sollte der Aufruf stattdessen über eine
  Supabase Edge Function laufen (Muster existiert schon:
  `supabase/functions/lexikon`, `supabase/functions/blutwerte-scan` rufen
  beide serverseitig die Anthropic API mit einem nur dort sichtbaren
  Secret auf) — das ist noch nicht umgesetzt, nur als nächster Schritt
  vorgemerkt.
- **CORS bei Ollama:** Ollama blockt standardmäßig Browser-Anfragen von
  fremden Origins. Die Nutzerin muss Ollama mit einer erlaubten Origin
  starten (`OLLAMA_ORIGINS=<ihre-vercel-adresse> ollama serve` o. Ä.) — noch
  nicht durchgeführt, siehe Abschnitt 6.
- **Wichtige Einschränkung, die der Nutzerin erklärt wurde:** Damit die
  Live-Seite Ollama erreichen kann, muss sie im Browser auf **demselben
  Computer** geöffnet werden, auf dem Ollama gerade läuft — "localhost"
  bedeutet immer "dieses Gerät", nicht irgendein Server im Internet. Von
  einem anderen Gerät (Handy, anderer PC) aus wird das nicht funktionieren.

---

## 6. Offene Punkte — konkret, mit nächstem Schritt

| # | Thema | Status | Nächster Schritt |
|---|-------|--------|-------------------|
| 1 | KI-Coach: `VITE_AI_PROVIDER=ollama` bei Vercel eintragen | Anleitung gegeben, Ausführung durch Nutzerin nicht bestätigt | Bei Nutzerin nachfragen, ob erledigt; ggf. Redeploy in Vercel anstoßen (Env-Var-Änderung baut NICHT automatisch neu) |
| 2 | Ollama-CORS (`OLLAMA_ORIGINS`) für die Vercel-Adresse freigeben | Noch nicht begonnen | Der Nutzerin sehr konkret zeigen, wie sie Ollama mit dieser Einstellung startet (vermutlich Terminal nötig — vorher klären, ob sie das schon mal gemacht hat) |
| 3 | KI-Coach-Modul in echte UI einbinden (Morgen-Widget, Trainings-/Ernährungs-Vorschlag-Button) | Bewusst noch nicht gemacht (Nutzerin wollte nur das Modul zuerst) | Auf Wunsch der Nutzerin als nächstes angehen |
| 4 | `send-due-reminders` Edge Function mit `startDatum`-Unterstützung neu deployen | Code ist im Repo, Deployment-Status bei der Nutzerin unklar | Nachfragen/prüfen, ggf. Deployment-Schritte erneut gemeinsam durchgehen |
| 5 | Push-Erinnerungen auf andere Kategorien ausweiten (Gewohnheiten/Supplemente/Medikamente/Peptide/Training) | Von der Nutzerin bewusst zurückgestellt, kein aktueller Auftrag | Nur nach explizitem Wunsch angehen — größerer Umbau |
| 6 | "Speichern dauert manchmal lange" | Untersucht, kein eindeutiger Bug gefunden (vermutlich Netzwerklatenz), Optimistic-UI als mögliche Abhilfe vorgeschlagen, nicht umgesetzt | Nur bei erneuter Beschwerde vertiefen |
| 7 | Live-URL/Hosting-Fakten in diesem Dokument nochmal mit Nutzerin bestätigen | Vercel als Anbieter heute bestätigt, genaue URL nicht neu verifiziert | Bei Gelegenheit einmal kurz fragen/prüfen und hier eintragen |

*(Ältere, generische Roadmap-Punkte aus der vorherigen Protokoll-Fassung —
Mobile-Responsiveness, Export-Funktionalität, Statistiken/Reports,
allgemeine Benachrichtigungen — wurden in dieser Session nicht erneut mit
der Nutzerin bestätigt und daher hier nicht als aktueller Auftrag
übernommen. Falls relevant, bei ihr nachfragen statt sie als gegeben
anzunehmen.)*

---

## 7. Ziele / Gesamtvision (so weit erkennbar)

- Eine für ADHS-Betroffene alltagstaugliche, reizarme App zur Verwaltung
  komplexer Gesundheitsprotokolle (Peptide/Hormone/Supplemente/Training/
  Schlaf/Ernährung/Hydration/Gewohnheiten) — mit Notfallmodus für
  überforderte Tage.
- Jüngerer Schwerpunkt: **Ist-Zustand + Zielzustand** sauber trennen und
  beides sichtbar machen (Onboarding-Fragen + Abschluss-Übersicht), damit
  später echte Verbesserungen messbar sind — nicht nur Einnahme-Tracking.
- Hinweise auf künftige **Monetarisierungs-/Freischaltungs-Stufen**: Das
  "immer alle Widgets sichtbar, aber grau wenn nicht eingerichtet"-Muster
  wurde bewusst so gebaut, dass es sich für eine spätere Freischaltung
  einzelner Bereiche eignet.
- Neuer Baustein: ein **KI-Coach** ("Roboter") für Motivation
  (Morgen-Impuls) und strukturierte Plan-Vorschläge (Training, Ernährung),
  aus Datenschutz-/Kostengründen zunächst lokal über Ollama, mit späterer
  Cloud-Option.

---

## 8. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Die Nutzerin ist nicht technisch versiert** und tippt/spricht oft per
  Spracherkennung (auf einem iPad o. Ä.) — das führt zu Transkriptionsfehlern
  bei Fachbegriffen (Beispiele aus dieser Session: "Obama" = Ollama,
  "Nettify" = Netlify, "Feed AI Provide gleich Ullamann" =
  "VITE_AI_PROVIDER=ollama"). Wohlwollend interpretieren, bei Unklarheit
  lieber kurz nachfragen als falsch raten.
- **Alles außerhalb von Code (Dashboards, Einstellungsseiten) sehr
  kleinschrittig erklären** — keine Fachbegriffe ohne Erklärung, echte
  Klick-für-Klick-Anleitungen, keine Annahmen über Vorwissen (z. B. weiß
  sie nicht automatisch, was "Terminal" oder "Environment Variable"
  bedeutet).
- **Keine Infrastruktur-Fakten erfinden oder aus altem Kontext übernehmen,
  ohne sie zu kennzeichnen.** Genau dieser Fehler (altes Protokoll behauptete
  Fakten, die nicht mehr stimmten) war der Auslöser für dieses neue
  Dokument. Hosting-Anbieter, Live-URL, Konten-Zugänge etc. stehen nicht im
  Code — im Zweifel nachfragen statt vermuten als Fakt darstellen.
- **Git-Workflow dieser Session-Reihe:** Arbeit erfolgt auf einem von der
  Umgebung vorgegebenen Branch (aktuell
  `claude/app-uebergabeprotokoll-improvements-03r3b3`), NICHT direkt auf
  `main`. Ein Merge/Push nach `main` erfolgt nur nach expliziter Freigabe
  der Nutzerin in der jeweiligen Sitzung — eine ältere Anweisung in der
  Vorversion dieses Dokuments ("immer direkt auf main arbeiten") ist damit
  überholt und sollte nicht mehr befolgt werden.
- **Die Nutzerin setzt gelegentlich harte Zeitlimits** (z. B. "25 Minuten",
  "bis 18:50 Uhr") — sobald der Auftrag klar ist, direkt umsetzen statt
  weitere Rückfragen zu stellen.
- **Dieses Dokument aktuell halten:** Am Ende größerer Arbeitsblöcke lohnt
  es sich, dieses Protokoll neu zu erzeugen (nicht nur zu ergänzen), damit
  es nicht wieder wie die Vorversion langsam von der Realität abweicht.

---

**Letzte Aktualisierung:** 26.07.2026, direkt vor Feierabend der Nutzerin.
**Nächster offener Punkt laut letztem Gespräch:** Vercel-Environment-Variable
für den KI-Coach eintragen (Abschnitt 6, Punkt 1) und danach Ollama-CORS
einrichten (Punkt 2).
