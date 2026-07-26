# 📋 ÜBERGABEPROTOKOLL: MyProtocols App

## ⚠️ WICHTIG: GIT-WORKFLOW

**ALLE Arbeiten direkt auf dem `main`-Branch durchführen!** Keine Feature-Branches verwenden!

```bash
# Richtig:
git checkout main
git pull origin main
# Mache Änderungen...
git add -A
git commit -m "Beschreibung"
git push origin main

# FALSCH:
git checkout -b feature/xyz  # ❌ NICHT MACHEN!
```

---

## 🎯 Projekt-Übersicht

**MyProtocols** ist eine Web-App zur Verwaltung von Gesundheitsprotokollen mit:
- Peptid-Therapie (Injektionen)
- Hormonelle Therapie
- Supplementierung  
- Trainingsplanung
- Schlaf-Tracking
- Ernährungsplanung
- Hydration-Tracking
- Gewohnheiten (Routinen)

**Live-URL**: https://myprotocolsapp.vercel.app/

---

## 📊 Aktueller Stand (Session: 26.07.2026)

### ✅ IMPLEMENTIERT

1. **Onboarding-Flow**
   - Welcome-Folien mit Sprachumstellung (DE/EN/TR)
   - Hauptprotokoll erstellen (Name + Startdatum)
   - **NEU: Intro-Phase** - Benutzer gibt seinen Namen ein (gespeichert in localStorage)
   - Ziele auswählen (Warum mache ich das?)
   - Profil & Ausgangslage (Persönliche Daten, Messwerte)
   - Laborwerte (optional)
   - Kategorien einrichten (für jeden Plan einzeln konfigurierbar)
   - Abschluss-Screen
   - **NEU: Training-Onboarding** - Zwei-Schritt-Setup:
     1. Trainingstage wählen (WochenplanEditor)
     2. Mehrere Trainingseinheiten pro Tag hinzufügen
        - Wochentag + Uhrzeit wählen
        - Optional: Trainingsart (Krafttraining, Cardio, Bodyweight, Sonstiges)
        - Optional: Trainingsname (z.B. "Leg Day", "HIIT Session")
     - Trainingseinheiten nach Wochentag gruppiert
     - Lösch-Funktion für einzelne Einheiten

2. **HomePage**
   - Begrüßung mit **Benutzernamen** aus localStorage
   - ADHS-Modus Toggle (Normalmodus ↔ Notfallmodus 🆘)
   - Zwei große Fortschritts-Kästchen:
     - Tagesfortschritt (ProgressRing)
     - Gewohnheiten-Fortschritt (ProgressRing)
   - **NEU: Mini-Plan-Widgets** - Symmetrisches Grid mit:
     - Kleine Doppelring-Donuts für jeden Plan
     - Innerer Ring: Tagesfortschritt (hellere Farbe)
     - Äußerer Ring: Wochenfortschritt (dunklere Farbe)
     - Kategoriefarben (violett/Peptide, rosa/Hormone, grün/Supplemente, etc.)
     - Im Notfallmodus: Nur essenzielle Kategorien (Medikamente, Hormone, Hydration)
   - Emergency-Mode-Banner (gelb)
   - Quick-Task-List für offene Aufgaben
   - "Als Nächstes"-Sektion

3. **Gewohnheiten (Routinen)**
   - **Zeit-Fenster-Unterstützung**: Feste Uhrzeit ODER Von-Bis Zeitraum
   - Toggle zwischen Modus
   - Speichert `uhrzeit` oder `urzeitVon`/`urzeitBis`

4. **Wochenübersicht (Wochenuebersicht)**
   - **Drei View-Modi**:
     - Day: Einzelne Tag-Ansicht
     - Week: Tabellraster Mo-So mit Items
     - Month: Kalender mit farbigen Punkten (max. 5 pro Tag)
   - Farb-codierte Kategorien
   - Navigation für Monate (← Vorheriger Monat, › Nächster Monat)
   - **BUG BEHOBEN**: accentSoft fehlte im import (fixed)

5. **Sprachumstellung**
   - **Auf LoginView** (Anmeldeseite) - oben rechts
   - **Auf WelcomeView** (Willkommensfolien) - oben links
   - Unterstützte Sprachen: DE (Deutsch), EN (English), TR (Türkçe)
   - Persistiert in localStorage (`language`)
   - **Translations für alle Screens** (common, login, welcome, onboarding, home, etc.)

6. **ADHS/Emergency-Modus**
   - Toggle-Button (blaue Farbverlauf = Normal, rote Farbverlauf = Notfall)
   - Im Notfallmodus:
     - Nur 3 essenzielle Kategorien anzeigen: Medikamente, Hormone, Hydration
     - Warnen-Banner: "💛 Heute nur Basics: Medikamente + Wasser. Alles andere ist Bonus. Kein Druck!"
     - Vereinfachte Task-Liste (QuickTaskList)
     - Mini-Widgets filtern auf essenzielle Pläne
   - Persistiert in localStorage (`adhs_mode`)

7. **UI/UX-Verbesserungen**
   - Alle Home-Buttons standardisiert: 44×44px (WCAG-konform)
   - Cancel-Buttons in Onboarding (konsistentes Styling)
   - ProgressRing-Größe: 110px
   - Größere Fonts für bessere Lesbarkeit
   - ADHS-freundliche Komponenten: ADHSModeToggle, QuickTaskList, GraceDayCard

---

## 🏗️ Architektur & Dateistruktur

### Wichtige Verzeichnisse

```
src/
├── views/                    # Haupt-Seiten-Komponenten
│   ├── HomeView.jsx          # Startseite mit Widgets ⭐
│   ├── LoginView.jsx         # Anmeldeseite mit Sprachumstellung
│   ├── WelcomeView.jsx       # Willkommensfolien
│   ├── WochenuebersichtView.jsx  # Wochenplan mit 3 Modi
│   ├── GewohnheitenView.jsx  # Routinen mit Zeit-Fenster
│   ├── TrainingView.jsx      # Trainingsplanung
│   ├── onboarding/
│   │   ├── OnboardingFlow.jsx  # Zentraler Onboarding-Orchestrator
│   │   ├── OnboardingIntroView.jsx  # Namensingabe ⭐
│   │   ├── HauptprotokollErstellenView.jsx
│   │   ├── OnboardingZieleView.jsx
│   │   ├── OnboardingProfilView.jsx
│   │   ├── OnboardingLaborwerteView.jsx
│   │   ├── OnboardingCategoriesView.jsx  # Nutzt OnboardingTrainingSetupView
│   │   ├── OnboardingTrainingSetupView.jsx  # ⭐ NEU: Zwei-Schritt-Training-Setup
│   │   └── OnboardingCompletionView.jsx
│   └── ... (weitere Views für andere Kategorien)
├── ui/
│   ├── primitives.jsx        # Button, TextInput, Card, Label, etc.
│   ├── MiniPlanWidget.jsx    # Neue Doppelring-Widgets ⭐
│   ├── ProgressRing.jsx      # Großer Fortschritts-Ring
│   ├── ADHSModeToggle.jsx    # ADHS-Modus-Schalter ⭐
│   ├── QuickTaskList.jsx     # Task-Liste für Notfallmodus ⭐
│   ├── GraceDayCard.jsx      # Grace-Day-Card ⭐
│   └── ... (weitere UI-Komponenten)
├── context/
│   ├── AppDataContext.jsx    # Zentrale Datenverwaltung
│   └── AuthContext.jsx       # Authentifizierung (Supabase)
├── i18n/
│   ├── translate.ts          # useT() Hook + LanguageContext
│   ├── LanguageContext.jsx   # Sprach-Provider
│   └── dict/
│       ├── common.js         # Gemeinsame Texte
│       ├── login.js          # Login-Texte
│       ├── welcome.js        # Welcome-Texte
│       ├── onboarding.js     # Onboarding-Texte
│       ├── home.js           # Homepage-Texte
│       ├── mehr.js           # Mehr-Tab-Texte
│       └── ... (weitere Sprachen)
├── utils/
│   ├── dates.ts              # Datums-Utilities (addDays, sameDay, etc.)
│   ├── dayItems.ts           # buildDayItems() + KATEGORIE_META ⭐
│   ├── adhsStorage.ts        # ADHS-Mode & Sound-Persistierung
│   ├── schedule.ts           # Dosierungs-Intervalle
│   ├── motivation.ts         # statusText() für Motivations-Meldungen
│   └── ... (weitere Utilities)
├── constants.ts              # Globale Konstanten (ZIELE, TRAININGSARTEN, etc.)
└── index.css                 # Globale Styles + ADHS-Modus-Animationen
```

---

## 🎨 Kategorien & Farben (KATEGORIE_META)

**Datei**: `src/utils/dayItems.ts`

```javascript
KATEGORIE_META = {
  peptid: { color: "#8b5cf6", dot: "#a78bfa", name: "Peptide" },
  hormon: { color: "#ec4899", dot: "#f472b6", name: "Hormone" },
  medikament: { color: "#ef4444", dot: "#f87171", name: "Medikamente" },
  supplement: { color: "#10b981", dot: "#6ee7b7", name: "Supplemente" },
  mahlzeit: { color: "#f59e0b", dot: "#fbbf24", name: "Mahlzeiten" },
  training: { color: "#ef4444", dot: "#f87171", name: "Training" },
  schlaf: { color: "#6366f1", dot: "#a5b4fc", name: "Schlaf" },
  hydration: { color: "#06b6d4", dot: "#67e8f9", name: "Hydration" },
  gewohnheit: { color: "#0fb8a3", dot: "#5eead4", name: "Gewohnheiten" },
}
```

**Wichtig**: Diese Farben werden überall verwendet - in Widgets, Punkte, Ringen, Borders!

---

## 🔑 Wichtige Konzepte & Funktionen

### 1. **buildDayItems(date, appData)**
- **Datei**: `src/utils/dayItems.ts`
- Sammelt ALLE Items für einen Tag aus allen Kategorien
- Kombiniert verschiedene Datenquellen (plan, hormonPlan, supplemente, etc.)
- Fügt Status hinzu (`done`, `kategorie`, `name`, `uhrzeit`)
- **Wird sehr häufig verwendet** - z.B. bei Home-Berechnung

### 2. **useT() Hook**
- **Datei**: `src/i18n/translate.ts`
- Gibt `t()` + `tLabel()` + `lang` zurück
- `t("key")` = Übersetzter Text aus `dict/*.js`
- `tLabel("Wert")` = Übersetzter Label aus `labels/*.js` (für Konstanten)
- **Alle Views müssen useT() verwenden!**

### 3. **useLanguage() Context**
- **Datei**: `src/i18n/LanguageContext.jsx`
- Gibt `{ lang, setLang }` zurück
- `lang` = aktuell Sprache (z.B. "de", "en", "tr")
- `setLang("en")` = Wechselt Sprache (persistiert in localStorage)

### 4. **ADHS-Modus-Persistierung**
- **Datei**: `src/utils/adhsStorage.ts`
- `getADHSMode()` = boolean aus localStorage
- `saveADHSMode(bool)` = speichert in localStorage
- Key: `adhs_mode`

### 5. **Mini-Plan-Widget-Daten**
- Berechnet tägliche Erfüllung (z.B. 3 von 5 Peptiden)
- Berechnet wöchentliche Erfüllung (z.B. 4 von 7 Tage)
- Im Notfallmodus werden nur essenzielle Kategorien gezeigt
- Lädt ALLE 7 Tage durch, um Wochenstatistik zu berechnen

### 6. **OnboardingTrainingSetupView - Training-Zwei-Schritt-Setup** ⭐
**Datei**: `src/views/onboarding/OnboardingTrainingSetupView.jsx`

```javascript
// Props:
{
  trainingWochenplan,        // array von {wochentag, ...}
  wochenplanSetzen,          // callback(wochentag)
  wochenplanEntfernen,       // callback(wochentag)
  trainingTemplates,         // array
  onDone,                    // callback()
  onBack,                    // callback()
}

// State (intern):
trainingsEinheiten = [
  {
    id: "Mo-08:00-timestamp",
    wochentag: "Mo",
    uhrzeit: "08:00",
    art: "Krafttraining",     // optional
    name: "Leg Day",          // optional
  },
  ...
]
```

**Funktionalität**:
1. **Schritt 1**: Wochentage auswählen (via WochenplanEditor)
   - Nutzt bestehende Komponente
   - Speichert in `trainingWochenplan`

2. **Schritt 2**: Trainingseinheiten hinzufügen
   - **Wochentag**: Pill-Auswahl (zeigt verfügbare Trainingstage)
   - **Uhrzeit**: TimeInput (HH:MM)
   - **Trainingsart** (optional): Pills von TRAININGSARTEN
     - Werte: "Krafttraining", "Cardio", "Bodyweight", "Sonstiges"
   - **Trainingsname** (optional): TextInput-Feld
   - **Button**: "+ Trainingseinheit hinzufügen"
     - Nur aktiv wenn wochentag + uhrzeit gesetzt

3. **Anzeige der Einheiten**:
   - Nach Wochentag gruppiert
   - Nach Uhrzeit sortiert
   - Jede Einheit zeigt: `08:00 Uhr · Leg Day` + Trainingsart
   - Lösch-Button (×) für jede Einheit

**Validierung**:
- `wochentag` und `uhrzeit` sind required
- `art` und `name` sind optional
- Eindeutige IDs basierend auf wochentag + uhrzeit + timestamp

---

## 🌐 Vercel-Deployment

**Live URL**: https://myprotocolsapp.vercel.app/

- Vercel deployt automatisch bei Push zu `main`-Branch
- Build-Kommando: `npm run build`
- Deployment dauert typischerweise 2-5 Minuten
- **WICHTIG**: Dev-Server (`npm run dev`) läuft auf localhost:5173 und ist NICHT die Live-App!

### Häufige Deployment-Probleme:
1. **Änderungen nicht sichtbar** → Browser-Cache leeren (Ctrl+Shift+R) oder Hard Refresh
2. **Alte Version wird angezeigt** → `git push origin main` vergessen?
3. **Build fehler** → `npm run build` lokal testen vor Push

---

## 🔄 Onboarding-Flow (DetailView)

```
WelcomeView (3 Folien)
  ↓
HauptprotokollErstellenView (Name + Datum)
  ↓
OnboardingIntroView (Benutzername eingeben) ⭐ NEU
  ↓
OnboardingZieleView (Ziele auswählen)
  ↓
OnboardingProfilView (Geschlecht, Geburtsdatum, Größe, Startgewicht, Messungen)
  ↓
OnboardingLaborwerteView (Blutbild hochladen, optional)
  ↓
OnboardingCategoriesView (Für jede Kategorie: Einrichten oder überspringen)
  ├─ Schlaf
  ├─ Hydration
  ├─ Ernährung
  ├─ Training
  ├─ Gewohnheiten
  ├─ Supplemente
  ├─ Medikamente
  ├─ Peptid-Plan
  ├─ Hormone
  └─ Biomarker
  ↓
OnboardingCompletionView (Glückwunsch!)
```

**Wichtig**: `OnboardingFlow.jsx` orchestriert alles mit `phase`-State

---

## 💾 Datenspeicherung

### localStorage
- `user_name` → Benutzername (aus OnboardingIntroView)
- `language` → Sprache (DE/EN/TR)
- `adhs_mode` → ADHS-Notfall-Modus (boolean)
- `sound_enabled` → Sound-Einstellungen (boolean)

### Supabase (Cloud-Datenbank)
- **Tabellen**:
  - `users` → Benutzer
  - `protocols` → Hauptprotokolle
  - `peptides` → Peptid-Pläne
  - `hormones` → Hormon-Pläne
  - `supplements` → Supplemente
  - `training` → Trainingseinträge
  - Und weitere...
- **Auth**: Supabase Auth (Email/Passwort)

---

## 🎯 Zeit-Fenster für Gewohnheiten

**Implementierung in GewohnheitenView.jsx**:

```javascript
// LEERE_GEWOHNHEIT mit Zeit-Feldern:
{
  name: "",
  urzeitModus: "fixed",        // "fixed" oder "range"
  uhrzeit: "08:00",            // Für "fixed"-Modus
  urzeitVon: "08:00",          // Für "range"-Modus
  urzeitBis: "10:00",          // Für "range"-Modus
  ...
}
```

**UI**:
- Toggle-Buttons: "Feste Uhrzeit" ↔ "Zeitfenster"
- Bei "Feste Uhrzeit": Zeigt nur `uhrzeit`
- Bei "Zeitfenster": Zeigt `urzeitVon` bis `urzeitBis`

---

## ⚙️ ADHS-Modus - Was ändert sich?

| Aspekt | Normal | Notfall 🆘 |
|--------|--------|-----------|
| **Angezeigter Banner** | Keine | "💛 Heute nur Basics..." |
| **Kategorien sichtbar** | Alle | Nur Medikamente + Hormone + Hydration |
| **Task-Liste** | Standard (angezeigt) | QuickTaskList (kompakt, visuell) |
| **Mini-Widgets** | Alle Plans | Nur essenzielle |
| **Farbe des Buttons** | Blau (✨) | Rot (🆘) |

---

## 🚀 Nächste Schritte (Roadmap)

### Sofort (von anderen Chats):
1. ✅ Mini-Widgets implementieren (FERTIG)
2. ✅ Training-Onboarding: Zwei-Schritt-Setup (FERTIG)
3. ⚠️ Weitere ADHS-Optimierungen möglich
4. ⚠️ SQL-Schema-Änderungen können nötig sein (benötigt DBA-Zugriff)

### Mittelfristig:
- [ ] Mobile-Responsiveness optimieren
- [ ] Export-Funktionalität erweitern
- [ ] Statistiken & Reports
- [ ] Benachrichtigungen

---

## 🐛 Bekannte Bugs & Fixes

| Bug | Status | Fix |
|-----|--------|-----|
| accentSoft nicht importiert in WochenuebersichtView | ✅ BEHOBEN | Added `accentSoft` zu imports |
| TextInput onKeyPress Handler fehlte | ✅ BEHOBEN | Added `onKeyPress` prop zu TextInput |
| PrimaryButton style prop fehlte | ✅ BEHOBEN | Added `style` prop zu PrimaryButton |
| KRAFT_UEBUNGEN falscher Import-Name | ✅ BEHOBEN | OnboardingTrainingSetupView nutzt nur TRAININGSARTEN |

---

## 📌 Wichtigste Files für Änderungen

1. **HomeView.jsx** - Startseite, Widgets, ADHS-Logik
2. **OnboardingFlow.jsx** - Onboarding-Orchestration
3. **OnboardingCategoriesView.jsx** - Kategorien-Setup mit Training ⭐
4. **OnboardingTrainingSetupView.jsx** - ⭐ NEU: Training-Zwei-Schritt-Setup
5. **WochenuebersichtView.jsx** - Wochenplan, Monatsplan
6. **MiniPlanWidget.jsx** - Mini-Doppelring-Widgets
7. **KATEGORIE_META in dayItems.ts** - Farben & Metadaten
8. **LoginView.jsx** - Anmeldeseite & Sprachumstellung
9. **i18n/LanguageContext.jsx** - Sprach-Management

---

## 📚 TypeScript/JavaScript Notes

- **Nutzt React Hooks**: `useState`, `useContext`, `useMemo`, `useCallback`
- **Utilities sind .ts/.tsx-Dateien** (TypeScript)
- **Views sind .jsx-Dateien** (JavaScript mit JSX)
- **CSS**: Inline-Styles (keine separate CSS-Dateien außer index.css)
- **Build-Tool**: Vite (schneller als Webpack)

---

## ✅ Checkliste für nächsten Chat

Wenn Du diesen Prompt in einem neuen Chat öffnest:

- [ ] Dieses Protokoll komplett lesen
- [ ] **Git-Workflow verstanden**: IMMER auf `main` arbeiten!
- [ ] KATEGORIE_META verstehen (Farben, Metadaten)
- [ ] useT() Hook & Sprach-System verstehen
- [ ] ADHS-Modus-Filterung verstehen
- [ ] buildDayItems() Funktion verstehen
- [ ] Vercel-Deployment-Prozess verstehen
- [ ] localStorage-Keys kennen
- [ ] MiniPlanWidget-Komponent kennen

---

## 🎓 Für den nächsten Agent

Arbeite IMMER so:

```bash
# 1. Repo klonen/aktualisiieren
git fetch origin main
git checkout main
git pull origin main

# 2. Änderungen machen
# (edit files...)

# 3. Build testen
npm run build

# 4. Committen & Pushen
git add -A
git commit -m "Klare Beschreibung der Änderung"
git push origin main

# 5. Auf Vercel-Deployment warten (2-5 Min)
# 6. Live-URL testen: https://myprotocolsapp.vercel.app/
```

**NIEMALS**:
- ❌ Feature-Branches erstellen
- ❌ Auf anderen Branches arbeiten
- ❌ `git push --force` verwenden
- ❌ Commits ohne Tests amenden

---

**Erstellt**: 26.07.2026  
**Letzte Aktualisierung**: Mit Training-Onboarding Zwei-Schritt-Setup  
**Status**: Production-Ready ✅  
**Vercel-URL**: https://myprotocolsapp.vercel.app/

---

**Viel Erfolg beim Weitermachen! 🚀**
