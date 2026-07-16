# Peptid Protokoll

Peptid-/Hormon-/Supplement-Protokoll-App. Vite + React im Frontend, Supabase
für Auth, Datenbank und Foto-Storage, zwei Supabase Edge Functions für die
KI-Funktionen (Lexikon-Fragen & Blutwerte-Scan über die Anthropic API).

## 1. Voraussetzungen

- Node.js 20+
- Ein kostenloses [Supabase](https://supabase.com)-Projekt
- Optional für die Edge Functions: [Supabase CLI](https://supabase.com/docs/guides/cli) und ein Anthropic API Key

## 2. Supabase-Projekt einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Datenbankschema anlegen: Inhalt von `supabase/migrations/0001_init.sql` und
   danach `supabase/migrations/0002_storage.sql` im Supabase SQL Editor
   ausführen (oder mit der Supabase CLI: `supabase db push`, wenn das Projekt
   per `supabase link` verbunden ist). Das legt alle Tabellen inkl. Row Level
   Security an, sowie den privaten Storage-Bucket `photos` für Check-in-,
   Nebenwirkungs- und Blutwerte-Fotos.
3. Unter **Authentication → Providers** ist "Email" standardmäßig aktiv – das
   reicht für die E-Mail/Passwort-Anmeldung der App. Für den lokalen Test
   kann man unter **Authentication → Settings** die E-Mail-Bestätigung
   vorübergehend deaktivieren, damit neue Konten sofort nutzbar sind.
4. Unter **Project Settings → API** die **Project URL** und den
   **anon public key** kopieren – die werden im nächsten Schritt gebraucht.

## 3. Edge Functions deployen (Lexikon & Blutwerte-Scan)

Die KI-Aufrufe an `api.anthropic.com` laufen serverseitig über zwei Supabase
Edge Functions (`supabase/functions/lexikon` und
`supabase/functions/blutwerte-scan`), damit der Anthropic API Key nie im
Frontend-Code oder im Browser landet.

```bash
supabase login
supabase link --project-ref <dein-projekt-ref>

# Anthropic API Key als Secret hinterlegen (nur serverseitig sichtbar)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

supabase functions deploy lexikon
supabase functions deploy blutwerte-scan
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` sind in
Supabase Edge Functions automatisch als Umgebungsvariablen verfügbar, dafür
ist kein manuelles Setzen nötig.

## 4. Lokal starten

```bash
npm install
cp .env.example .env
# .env öffnen und VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY eintragen
npm run dev
```

Die App läuft danach unter `http://localhost:5173`. Über den Link
"Noch kein Konto? Jetzt registrieren" auf dem Login-Screen kann ein erstes
Konto angelegt werden.

## 5. Deployment (Vercel oder Netlify)

Das Projekt ist ein reines statisches Vite-Build (`npm run build` →
`dist/`), beide Plattformen erkennen Vite automatisch.

### Vercel

1. Repository in Vercel importieren.
2. Framework Preset: **Vite** (Build Command `npm run build`, Output
   Directory `dist` – wird i. d. R. automatisch erkannt).
3. Unter **Environment Variables** setzen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

### Netlify

1. Repository in Netlify importieren.
2. Build Command: `npm run build`, Publish Directory: `dist`.
3. Unter **Site configuration → Environment variables** setzen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

Die Supabase Edge Functions werden unabhängig vom Frontend-Hosting direkt bei
Supabase deployt (siehe Schritt 3) – dort ist nichts weiter zu konfigurieren.

## Projektstruktur

```
src/
  constants.js          Statische Optionen (Peptide, Ziele, Kategorien, ...)
  ui/                    Geteilte UI-Bausteine (Card, Pill, Buttons, Charts, ...)
  context/               AuthContext (Supabase Auth) & AppDataContext (Datenzugriff)
  data/                  Ein Hook pro Datenbereich (Profil, Protokoll, Hormone, ...)
  views/                 Screens (Login, Dashboard, Lexikon, Supplemente, ...)
  views/plan/             Die sechs Tabs innerhalb von "Dein Plan"
supabase/
  migrations/             SQL-Schema inkl. Row Level Security & Storage-Policies
  functions/              Edge Functions für Lexikon & Blutwerte-Scan
```

## Hinweis zum Lexikon & Blutwerte-Scan

Beide Funktionen geben laut Prompt ausdrücklich **keine Dosierungsempfehlungen
oder medizinischen Handlungsanweisungen**, sondern nur allgemeine,
informative Fakten. Das ist in den Edge-Function-Prompts fest verankert.
