# AKA als iPhone-App (Capacitor) – Anleitung für den Mac

Stand 27.09.2026. Die Web-App ist mit **Capacitor 8** als iOS-Projekt vorbereitet (Ordner `ios/`).
Der komplette App-Code bleibt derselbe. Capacitor verpackt ihn in eine echte iPhone-App.

## Was schon erledigt ist (ohne Mac)
- `capacitor.config.json`:
  - App-ID `de.aka.app`: bitte prüfen, sie muss zur App-ID im Apple-Developer-Konto passen, bei Bedarf hier und in Xcode ändern.
  - Name „AKA“, Hintergrund Nachtblau.
- iOS-Projekt `ios/App` (Swift Package Manager, kein CocoaPods nötig).
- Datenschutz-Texte für die Berechtigungen in `ios/App/App/Info.plist`: Kamera, Mikrofon, Spracherkennung, Fotos.
- Skripte: `npm run ios:sync` (baut die Web-App und kopiert sie ins iOS-Projekt), `npm run ios:open` (öffnet Xcode).

## Was am Mac zu tun ist
1. Xcode installieren (App Store) und das Repository klonen, dann `npm install`.
2. `npm run ios:sync` und danach `npm run ios:open`.
3. In Xcode:
   - Target „App“ → Signing & Capabilities → Team (Apple-Developer-Konto) wählen.
   - Bundle Identifier prüfen.
   - Unter Signing & Capabilities muss **Push Notifications** stehen (die Datei `App.entitlements` ist schon da; falls Xcode meckert: „+ Capability“ → Push Notifications).
4. App-Icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset` → 1024×1024-Bild einsetzen (Logo `public/logo-mark.png` als Vorlage).
5. Auf einem echten iPhone testen (Kabel oder WLAN): Anmelden, Tagesplan, Kamera-Zählung, Video-Nachweis, Diktieren.
6. Product → Archive → Distribute App → App Store Connect → zuerst **TestFlight**.

## Push-Erinnerungen einrichten (einmalig, ca. 10 Minuten)
Der Code ist fertig (Stand 27.09.): Die iPhone-App meldet sich bei Apple an, die Server-Funktionen schicken über Apple. Es fehlt nur der Schlüssel von Apple – den trägst **du selbst** ein, er gehört nie in den Chat oder in den Code.
1. developer.apple.com → Certificates, Identifiers & Profiles → **Keys** → „+“.
2. Name z. B. „AKA Push“, Haken bei **Apple Push Notifications service (APNs)** → Continue → Register.
3. Die Datei `AuthKey_XXXXXXXXXX.p8` herunterladen (geht nur einmal – gut aufheben). Die **Key ID** steht daneben.
4. Die **Team ID** steht oben rechts unter „Membership details“.
5. Supabase → Project Settings → Edge Functions → **Secrets** → drei Einträge anlegen:
   - `APNS_KEY_ID` = die Key ID
   - `APNS_TEAM_ID` = die Team ID
   - `APNS_PRIVATE_KEY` = den kompletten Inhalt der .p8-Datei (mit einem Texteditor öffnen, alles kopieren, inklusive der BEGIN/END-Zeilen)
   - Nur falls die App-ID nicht `de.aka.app` ist: `APNS_BUNDLE_ID` = eure App-ID.
6. Auf dem iPhone in der App: Mehr → Erinnerungen aktivieren → „Test senden“.

Was passiert technisch: Das Gerät landet in `push_subscriptions` mit `endpoint = "apns:<Geräteschlüssel>"`. `send-push`, `send-due-reminders` und `send-team-push` nutzen gemeinsam `supabase/functions/_shared/push.ts`: Web-Geräte über Web-Push, iPhones über Apple. Testläufe aus Xcode und echte App-Store-Installationen werden automatisch unterschieden.

Der **Fokus-Timer** meldet sich in der iPhone-App auch bei gesperrtem Handy (lokale Mitteilung, kein Server nötig).

## App Store Connect (Webseite)
- Neue App anlegen, Kategorie „Gesundheit & Fitness“ oder „Lifestyle“ (ohne medizinische Versprechen).
- **Testzugang für Apples Prüfer** (Login ist Pflicht): ein Testkonto mit Beispieldaten angeben.
- Datenschutz-URL und Datenschutz-Angaben: Supabase (EU) speichert Gesundheits-/Lebensstil-Daten; Kamera-Bilder zum Zählen bleiben auf dem Gerät; Video-Nachweise nur mit Zustimmung/Löschfristen.
- Bildschirmfotos (6,7" und 6,5"), Beschreibung, Stichwörter.
- **Geld:** Werden digitale Abos in der App verkauft, verlangt Apple In-App-Kauf. 1:1-Coaching durch echte Menschen ist meist ausgenommen (Richtlinie 3.1.3) – vor Preisen in der App klären.

## Bekannte Punkte für die native App (nächste Schritte)
- ~~Push-Erinnerungen~~ und ~~Timer bei gesperrtem Handy~~: erledigt (27.09.), siehe oben. Offen nur der Apple-Schlüssel.
- **Diktieren:** Die Web-Spracherkennung gibt es in der iOS-WebView nicht zuverlässig, eventuell ist ein Capacitor-Plugin für Spracherkennung nötig.
- **Links aus E-Mails** (Einladung, Passwort): Deep Links/Universal Links einrichten, sonst öffnen sie im Browser.
- Nach jeder Code-Änderung: `npm run ios:sync`, dann in Xcode neu bauen.

## TestFlight für die Forschungsphase (Entscheidung der Nutzerin 28.09.)

Statt die App öffentlich in den App Store zu stellen, bekommen die Coachees sie über **TestFlight** (Apples Test-App). Die App ist nicht öffentlich zu finden, nur wer den Link hat, kann sie installieren. Die Datenschutz-Teile (Einwilligung, Konto löschen, Datenschutzerklärung) sind trotzdem drin.

**Einmalig vorbereiten**
1. Apple-Developer-Konto (99 €/Jahr) und ein Mac mit Xcode.
2. App Store Connect → **Meine Apps → „+“ → Neue App**: Plattform iOS, Name „AKA“, Sprache Deutsch, Bundle-ID `de.aka.app` (muss zur App-ID im Developer-Konto passen), SKU z. B. `aka-001`.
3. Am Mac (siehe „Was am Mac zu tun ist“ oben): `npm install`, `npm run ios:sync`, `npm run ios:open`, in Xcode das Team wählen.

**Eine Version hochladen**
1. Xcode: oben als Ziel „Any iOS Device“ wählen → **Product → Archive**.
2. Im Fenster „Organizer“: **Distribute App → App Store Connect → Upload**. Die Frage nach Verschlüsselung ist schon beantwortet (`ITSAppUsesNonExemptEncryption = false`, die App nutzt nur normales HTTPS).
3. Nach 10–30 Minuten erscheint die Version in App Store Connect unter **TestFlight**.
4. Für jede neue Version in Xcode unter Target „App“ → General die **Build**-Nummer um 1 erhöhen (1, 2, 3 …). Eine Version läuft 90 Tage.

**Testinformationen (TestFlight → Testinformationen)**
- Beschreibung, was getestet werden soll, z. B. „ADHS-Alltagsbegleiter im Pilot-Coaching“.
- Feedback-E-Mail: deine Adresse.
- Datenschutz-URL: `https://akaapp.vercel.app/datenschutz.html`
- **Anmeldedaten für die Beta-Prüfung:** ein eigenes Test-Coachee-Konto mit Beispieldaten. Die Zugangsdaten gibst **du** dort ein, nie in den Chat.
- Prüfnotiz: „Keine offene Registrierung, Zugang per Einladung durch den Coach. KI-Funktionen nur nach freiwilliger Einwilligung. Konto löschen: Mehr → Datenschutz & Konto.“

**Coachees einladen (externe Tester)**
1. TestFlight → **Externe Tests → „+“** → Gruppe „Coachees“ anlegen.
2. Die hochgeladene Version zur Gruppe hinzufügen → **Zur Prüfung senden**. Apples Beta-Prüfung dauert meist 1–2 Tage (nur bei der ersten Version einer Gruppe bzw. bei größeren Änderungen).
3. Danach **Öffentlichen Link aktivieren** (Anzahl begrenzbar) und den Link an die Coachees schicken.
4. Die Coachees laden die App **TestFlight** aus dem App Store, tippen auf den Link → „Installieren“. Anmelden wie gewohnt mit dem Zugang, den du ihnen als Coach anlegst.

**Interne Tester** (bis 100, ohne Prüfung) sind nur Personen, die du unter „Benutzer und Zugriff“ in dein App-Store-Connect-Konto aufnimmst – gut für dich selbst und Mitarbeitende, für Coachees ist der öffentliche Link einfacher.

**Später für den öffentlichen App Store:** siehe `docs/APP-STORE-DATENSCHUTZ.md` (Impressum vollständig, Auftragsverarbeitungsverträge, fachliche Prüfung der Texte, Datenschutz-Angaben ankreuzen).
