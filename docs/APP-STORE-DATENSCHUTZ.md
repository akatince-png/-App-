# App Store: Datenschutz-Vorbereitung (Stand 28.09.2026)

Ziel der Nutzerin: Antrag bei Apple Mitte der Woche ab 05.10.2026. Hier steht, was im Code erledigt ist, was **du** noch eintragen oder entscheiden musst, und was du in App Store Connect bei „App-Datenschutz“ ankreuzt.

> Hinweis: Die Texte sind nach bestem Wissen entworfen, aber **keine Rechtsberatung**. Datenschutzerklärung und Impressum bitte vor dem Antrag fachlich prüfen lassen (siehe Go-Live-Checkliste A1 im Übergabeprotokoll).

## 1. Im Code erledigt

| Apple-/DSGVO-Anforderung | Umsetzung |
|---|---|
| Datenschutzerklärung in der App und als Web-Adresse | Mehr → Datenschutz & Konto, Anmeldeseite (Links unten), öffentlich unter **https://akaapp.vercel.app/datenschutz.html** (wird bei jedem Build aus `src/utils/rechtstexte.js` erzeugt) |
| Impressum | In der App und unter https://akaapp.vercel.app/impressum.html |
| Einwilligung Gesundheitsdaten (Art. 9 DSGVO) | Einmaliger Schritt „Bevor es losgeht“ für jede Coachee, Zeitstempel + Version in `profiles` (Migration 0120) |
| KI nur mit ausdrücklicher Zustimmung (Apple 5.1.2(i)) | Freiwilliges Häkchen beim Start, jederzeit in Mehr umschaltbar. Ohne Zustimmung gehen **keine** Daten an Google Gemini / Google Text-to-Speech / Groq (Sperre in `utils/kiEinwilligung.js`, geprüft vor jedem KI-Aufruf); alles andere funktioniert per Hand |
| Konto in der App löschen (Apple 5.1.1(v)) | Mehr → Konto löschen (Bestätigung „LÖSCHEN“). Edge Function `konto-loeschen` löscht Dateien in allen privaten Speichern und den Zugang; alle Tabellen hängen per Cascade daran. Coach kann im Verwalten-Modus das Konto einer Coachee löschen |
| Kein Tracking | Keine Werbe-/Analyse-SDKs; Datenschutz-Manifest `ios/App/App/PrivacyInfo.xcprivacy` mit `NSPrivacyTracking = false` |
| Berechtigungs-Texte | Kamera (inkl. Dienstplan), Fotos, Mikrofon, Spracherkennung in `Info.plist` |
| Schriften ohne Google | Inter/Poppins liegen jetzt in der App (`@fontsource`), keine IP-Übermittlung an Google Fonts |

## 2. Was du noch tun musst (vor dem Antrag)

1. ~~Deine Angaben eintragen~~ – erledigt 29.09. (Name, Anschrift, E-Mail, Aufsichtsbehörde Niedersachsen). Telefon/Rechtsform optional.
2. **Texte prüfen lassen** (Anwalt/Datenschutz), besonders wegen Gesundheitsdaten.
3. **Auftragsverarbeitungsverträge (AVV/DPA)** abschließen bzw. akzeptieren: Supabase, Vercel, Google (Gemini, Text-to-Speech), Groq. Meist als Online-Formular im jeweiligen Konto.
4. ~~Freigabe Datenbank-Änderung und Edge Function `konto-loeschen`~~ – erledigt 28.09.
5. **Test-Zugang für Apples Prüfer:** ein eigenes Coachee-Konto mit Beispieldaten (Einwilligung vorab erteilt), Zugangsdaten gibst **du** in App Store Connect unter „App-Prüfung“ ein – nie in den Chat.
6. **Testkonten aus Ranglisten nehmen** (Go-Live-Checkliste A5), damit der Prüfer keine Fantasie-Teams sieht.
7. Optional, aber empfohlen: **Supabase Pro** (tägliche Sicherungen) und **eigener E-Mail-Versand (SMTP)** für Einladungen.

## 3. App Store Connect → App-Datenschutz: was ankreuzen

„Erfassen Sie oder Ihre Drittanbieter Daten?“ → **Ja**.
Für **jeden** Punkt unten gilt: **mit der Identität verknüpft: Ja** · **für Tracking verwendet: Nein** · Zweck: **App-Funktionalität** (bei Gesundheit/Fitness zusätzlich keine weiteren Zwecke).

| Kategorie in App Store Connect | Datentyp | Warum |
|---|---|---|
| Kontaktinformationen | Name, E-Mail-Adresse | Konto, Einladung durch den Coach |
| Gesundheit & Fitness | Gesundheit, Fitness | Medikation, Supplemente, Schlaf, Stimmung, Laborwerte, Gewicht, Training, Ernährung |
| Benutzerinhalte | Fotos oder Videos | Profilbild, Fotos von Präparaten/Laborwerten/Essen, Video-Nachweise |
| Benutzerinhalte | Andere Benutzerinhalte | Tagebuch, Nachrichten an den Coach, Kalender, Dienstplan |
| Identifikatoren | Benutzer-ID | Konto-ID in der Datenbank |
| Identifikatoren | Geräte-ID | Push-Token für Erinnerungen |
| Diagnose | Absturzdaten, Andere Diagnosedaten | Fehlerprotokolle (nur falls Fehler-Monitoring aktiv ist – sonst weglassen) |

**Nicht** ankreuzen: Standort, Kontakte, Browserverlauf, Suchverlauf, Käufe, Finanzdaten, sensible Daten wie ethnische Herkunft (Gesundheit hat eine eigene Kategorie), Werbedaten.

Datenschutz-URL: `https://akaapp.vercel.app/datenschutz.html`

## 4. Hinweise für die Prüfung

- **Kategorie:** „Gesundheit & Fitness“ oder „Lifestyle“, **keine** Heils- oder Wirkversprechen in Beschreibung und Screenshots (Richtlinie 1.4.1).
- **Medizinprodukt:** AKA diagnostiziert und behandelt nicht; in Beschreibung und App steht „keine Therapie, kein Medizinprodukt“. Rechtlich endgültig klären lassen (Go-Live A1).
- **KI:** In der Prüfnotiz erwähnen: „KI-Funktionen (Google Gemini, Groq) nur nach ausdrücklicher, freiwilliger Einwilligung; ohne Einwilligung werden keine Daten an KI-Dienste übermittelt.“
- **Konto löschen:** In der Prüfnotiz den Weg nennen: „Mehr → Datenschutz & Konto → Konto löschen“.
- **Registrierung:** Es gibt keine offene Registrierung (Einladung durch Coach). Deshalb braucht der Prüfer das Testkonto aus Punkt 2.5.

## 5. Noch offen / später

- Datenexport für Nutzer:innen (Art. 20 DSGVO, „Daten mitnehmen“) – derzeit per Anfrage an die Datenschutz-E-Mail.
- Programmteile von jsDelivr (Kamera-Zähler, Dienstplan-Texterkennung) ebenfalls in die App legen, dann entfällt auch diese IP-Übermittlung.
- Serverseitige Prüfung der KI-Einwilligung in den Edge Functions (zusätzlich zur Sperre in der App).
