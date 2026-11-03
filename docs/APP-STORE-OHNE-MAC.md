# AKA als iPhone-/iPad-App – ohne Mac (Codemagic + TestFlight)

Stand 03.11.2026. Alles geht im Browser auf dem iPad (Safari). Ein Mac oder Xcode ist nicht nötig:
Codemagic baut die App in der Cloud auf einem Mac und lädt sie zu TestFlight hoch.

- **App-Name:** AKA
- **Bundle-ID:** `de.akaince.aka`
- **Bauplan:** `codemagic.yaml` im Repository, Workflow „AKA iOS → TestFlight“

**Wichtig:** Schlüssel, Passwörter und Zertifikate trägst du nur direkt bei Apple, Codemagic oder Supabase ein.
Nie in den Chat und nie ins Repository, denn das ist öffentlich.

---

## Teil A – Apple (einmalig, ca. 15 Minuten)

1. **App-ID anlegen**
   - developer.apple.com öffnen und anmelden.
   - Zu **Certificates, Identifiers & Profiles → Identifiers → „+“** gehen.
   - **App IDs → App** wählen, Beschreibung „AKA“ eintragen.
   - Bundle ID **Explicit**: `de.akaince.aka` eintragen.
   - Unter Capabilities den Haken bei **Push Notifications** setzen, dann Continue → Register.
2. **App in App Store Connect anlegen**
   - appstoreconnect.apple.com öffnen und zu **Apps → „+“ → Neue App** gehen.
   - Plattform **iOS**, Name **AKA**, Hauptsprache Deutsch.
   - Bundle-ID `de.akaince.aka` auswählen, SKU z. B. `aka-001`.
3. **API-Schlüssel für Codemagic erstellen**
   - In App Store Connect zu **Benutzer und Zugriff → Integrationen → App Store Connect API** gehen.
   - Unter **Team-Schlüssel → „+“** einen neuen Schlüssel anlegen: Name „Codemagic“, Zugriff **App-Manager**.
   - Die Datei `AuthKey_….p8` **herunterladen**. Das geht nur ein einziges Mal, also gut aufheben, z. B. in „Dateien“ auf dem iPad.
   - Die **Schlüssel-ID** und die **Issuer-ID** (steht oben auf der Seite) notieren.

## Teil B – Codemagic (einmalig, ca. 15 Minuten)

1. **Konto und Repository**
   - codemagic.io öffnen und **mit GitHub anmelden**.
   - **Add application** wählen, das Repository `akatince-png/-App-` auswählen.
   - Als Projekttyp „**codemagic.yaml**“ wählen.
2. **Apple-Schlüssel hinterlegen**
   - Zu **Team settings → Integrations → Developer Portal → Connect** gehen.
   - Name **genau** `AKA App Store Connect` eintragen, so heißt er auch in `codemagic.yaml`.
   - Issuer-ID und Schlüssel-ID eintragen und die `.p8`-Datei hochladen.
3. **Zertifikat erzeugen**
   - Zu **Team settings → Code signing identities → iOS certificates** gehen.
   - **Generate certificate** wählen, Typ **Apple Distribution**, Integration „AKA App Store Connect“.
   - Codemagic legt das Zertifikat selbst bei Apple an. Das Passwort, das Codemagic anzeigt, nicht weitergeben.
4. **App-Einstellungen hinterlegen**
   - In der App unter **Environment variables** eine neue Gruppe **`aka_web`** anlegen.
   - Dieselben Werte wie bei Vercel eintragen (Vercel → Projekt → Settings → Environment Variables):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_AI_PROVIDER` und `VITE_AI_MODEL`
     - falls vorhanden: `VITE_SPOTIFY_CLIENT_ID`, `VITE_SENTRY_DSN`
   - Bei jedem Eintrag den Haken **Secret** setzen.

## Teil C – Eine Version bauen

1. In Codemagic die App öffnen und auf **Start new build** tippen.
2. Branch `main` und Workflow **AKA iOS → TestFlight** wählen, dann Start.
3. Der Build dauert etwa 15–25 Minuten.
   - **Grün:** Die App ist automatisch bei App Store Connect hochgeladen.
   - **Rot:** Das Fehlerprotokoll steht unter dem roten Schritt. Kopier mir den Text oder mach einen Screenshot. Bitte nur den Fehlertext, keine Schlüssel.
4. Nach weiteren 10–30 Minuten erscheint die Version in App Store Connect unter **TestFlight**.

Codemagic zählt die Build-Nummer selbst hoch. Für jede neue Version einfach wieder „Start new build“ tippen.
Der kostenlose Tarif hat 500 Build-Minuten im Monat. Das reicht für viele Versionen.

## Push-Erinnerungen in der iPhone-App (einmalig)

Push in der iPhone-App läuft über Apple, nicht über den Browser. Dafür braucht Supabase einen Apple-Push-Schlüssel.
Wie das geht, steht in `docs/APP-STORE.md` im Abschnitt „Push-Erinnerungen einrichten“.
Die Bundle-ID `de.akaince.aka` ist im Code schon voreingestellt.

## Teil D – Auf dem iPad testen (TestFlight)

1. In App Store Connect zu **TestFlight** gehen und beim neuen Build eventuell die **Exportbestimmungen** bestätigen.
   Die App nutzt nur normales HTTPS, das ist im Code schon so hinterlegt.
2. **Interne Tests → „+“** wählen, Gruppe „Ich“ anlegen und dich selbst als Testerin hinzufügen.
   Interne Tests brauchen keine Prüfung durch Apple.
3. Auf dem iPad die App **TestFlight** aus dem App Store laden. Die Einladung kommt per E-Mail.
   Dann in TestFlight AKA **installieren**.
4. **Das bitte testen:**
   - Anmelden
   - Tagesplan und Abhaken
   - Morgen- und Abendroutine
   - Kamera (Präparat-Foto)
   - Erinnerungen unter Mehr → Erinnerungen aktivieren → „Test senden“. Das geht erst mit dem Apple-Push-Schlüssel, siehe oben.
   - Konto löschen **nur mit einem Testkonto**

## Teil E – Coachees einladen und später der öffentliche App Store

- **Coachees über TestFlight:**
  - Unter **Externe Tests** eine Gruppe „Coachees“ anlegen, die Version hinzufügen und **zur Prüfung senden**. Apples Beta-Prüfung dauert meist 1–2 Tage.
  - Danach den **öffentlichen Link** aktivieren und an die Coachees schicken.
- **Angaben für Apples Prüfung:**
  - **Datenschutz-URL:** https://akaapp.vercel.app/datenschutz
  - **Impressum:** https://akaapp.vercel.app/impressum
  - **Anmeldedaten für die Prüfung:** ein eigenes Test-Coachee-Konto mit Beispieldaten. Die Zugangsdaten trägst du bei Apple ein, nie im Chat.
  - **Prüfnotiz:** „Keine offene Registrierung, Zugang per Einladung durch den Coach. KI-Funktionen nur nach freiwilliger Einwilligung. Konto löschen: Mehr → Datenschutz & Konto. Lifestyle-App ohne medizinische Versprechen.“
  - **Kategorie:** „Gesundheit & Fitness“ oder „Lifestyle“.
- **Öffentlicher App Store:** Was dafür noch fehlt, steht in `docs/APP-STORE-DATENSCHUTZ.md`: Impressum vollständig, Auftragsverarbeitungsverträge, fachliche Prüfung der Texte, Datenschutz-Angaben bei Apple, Bildschirmfotos.

## Bekannt: was in der iPhone-App anders ist

- **Diktieren:** Die Spracheingabe des Browsers fehlt in der iOS-App teilweise. Tippen geht immer.
  Falls nötig, kommt später ein eigenes Plugin dazu.
- **Links aus E-Mails** (Einladung, Passwort vergessen) öffnen im Browser, nicht in der App.
  Dort einfach anmelden, danach geht es in der App weiter.
- **Neue Versionen:** Jede Änderung an der App braucht einen neuen Build in Codemagic.
  Die Web-Version unter akaapp.vercel.app aktualisiert sich weiter von selbst.
