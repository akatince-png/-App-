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
4. App-Icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset` → 1024×1024-Bild einsetzen (Logo `public/logo-mark.png` als Vorlage).
5. Auf einem echten iPhone testen (Kabel oder WLAN): Anmelden, Tagesplan, Kamera-Zählung, Video-Nachweis, Diktieren.
6. Product → Archive → Distribute App → App Store Connect → zuerst **TestFlight**.

## App Store Connect (Webseite)
- Neue App anlegen, Kategorie „Gesundheit & Fitness“ oder „Lifestyle“ (ohne medizinische Versprechen).
- **Testzugang für Apples Prüfer** (Login ist Pflicht): ein Testkonto mit Beispieldaten angeben.
- Datenschutz-URL und Datenschutz-Angaben: Supabase (EU) speichert Gesundheits-/Lebensstil-Daten; Kamera-Bilder zum Zählen bleiben auf dem Gerät; Video-Nachweise nur mit Zustimmung/Löschfristen.
- Bildschirmfotos (6,7" und 6,5"), Beschreibung, Stichwörter.
- **Geld:** Werden digitale Abos in der App verkauft, verlangt Apple In-App-Kauf. 1:1-Coaching durch echte Menschen ist meist ausgenommen (Richtlinie 3.1.3) – vor Preisen in der App klären.

## Bekannte Punkte für die native App (nächste Schritte)
- **Push-Erinnerungen:** Web-Push läuft in der iOS-App nicht. Nötig ist `@capacitor/push-notifications` + APNs-Schlüssel, und `send-due-reminders`/`send-push` müssen APNs ansprechen (siehe `UEBERGABEPROTOKOLL.md`, Abschnitt 12).
- **Diktieren:** Die Web-Spracherkennung gibt es in der iOS-WebView nicht zuverlässig, eventuell ist ein Capacitor-Plugin für Spracherkennung nötig.
- **Links aus E-Mails** (Einladung, Passwort): Deep Links/Universal Links einrichten, sonst öffnen sie im Browser.
- **Timer bei gesperrtem Handy:** erst mit lokalen Benachrichtigungen (`@capacitor/local-notifications`).
- Nach jeder Code-Änderung: `npm run ios:sync`, dann in Xcode neu bauen.
