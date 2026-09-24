# Dauertest mit dem festen Testkonto „Claude Dauertest“

Wunsch der Nutzerin (23.09.2026): Claude behält ein eigenes Testkonto,
klickt damit **jeden Tag einmal alles durch** und prüft dabei auch die
**Langzeitfolgen**, also ob sich Daten über Tage und Wochen richtig
aufbauen: Serien, Punkte, Level, Abzeichen, „Deine Welt“, Verlauf,
Wochenübersicht und Wochenprotokolle.

## Das Konto

| | |
|---|---|
| E-Mail | `claude.dauertest@example.com` |
| User-ID | `6ad98595-c05e-47e1-910a-2c6840d922e9` |
| Rolle | normale Coachee (`is_admin = false`), Vorname „Claude Dauertest“ |
| Start | 23.09.2026, Protokoll „Dauertest ab 23.09.“ |
| Eingerichtet | Vitamin D3 (morgens), Magnesium (abends), Gewohnheiten „10 Minuten Spaziergang“ (12:30) und „5 Minuten lesen“ (21:00), Morgenroutine (Wasser trinken, Zähne putzen, 5 Min. Bewegung), Abendroutine (Handy weglegen, Brain Dump) |

### Zweites Konto „Mia Dauertest“ (seit 24.09.2026)

| | |
|---|---|
| E-Mail | `claude.dauertest2@example.com` |
| User-ID | `4100a127-9593-4d8a-8920-d452e96ccb36` |
| Rolle | Coachee, weiblich, Steckbrief: 32, Grafikdesignerin, ADHS seit 2 Jahren |
| Eingerichtet | Medikinet adult 20 mg (08:00), Omega-3 (morgens), Eisen (abends), Gewohnheiten „15 Min. Yoga“ (18:00) und „Tagebuch schreiben“ (20:30), Morgenroutine (Fenster auf, Medikament, Frühstück), Abendroutine (Tee, Handy weg), Trinkziel 2000 ml |

Beide Konten bilden das **„Test-Team Dauertest“** und haben je zwei Team-Quests („3× Morgenroutine“, „Tagesrätsel an 3 Tagen“, gültig bis Sonntag). Neue Quests für die Folgewochen legt Claude beim Lauf per SQL an (`quests.proband_id` = Testkonto — nie `null`, sonst sehen alle echten Coachees sie).

**Nicht löschen.** Die Nutzerin sieht das Konto in ihrer Admin-Liste und
kann es über „Verwalten als“ ansehen.

Das Passwort wird **nirgends gespeichert**. Jeder Lauf setzt ein neues
Zufallspasswort per SQL (Supabase-Connector):

```sql
update auth.users set encrypted_password = extensions.crypt('<neues-zufallspasswort>', extensions.gen_salt('bf'))
where email = 'claude.dauertest@example.com';
```

(Falls `extensions.crypt` nicht existiert, das Schema weglassen: `crypt(...)` / `gen_salt(...)`.)

## Täglicher Ablauf

1. `git fetch origin main` und auf den Stand von `main` wechseln, dann `npm ci`, falls nötig.
2. Neues Zufallspasswort setzen (siehe oben).
3. Durchlauf starten (der TLS-Proxy-Pin der Cloud-Umgebung wird automatisch aus /root/.ccr/ca-bundle.crt berechnet):
   ```bash
   AKA_TEST_PW='<passwort>' node scripts/dauertest/tageslauf.mjs
   # zweites Konto:
   AKA_TEST_EMAIL=claude.dauertest2@example.com AKA_TEST_PW='<passwort>' AKA_OUT=dauertest-out/<datum>-mia node scripts/dauertest/tageslauf.mjs
   ```
   Ergebnis: `dauertest-out/<datum>/bericht.json` plus Fotos (von git ignoriert).
   Das Skript
   - meldet sich an und misst dabei, ob die App nach dem Login hängt;
   - hakt im Tagesplan alles ab, was schon dran ist. Einzelne Punkte lässt es reproduzierbar aus, und jeder 7. Tag (Tag 5, 12, 19, …) ist ein Pausentag;
   - läuft die Morgenroutine einmal durch;
   - trägt 2–4 Gläser Wasser ein;
   - löst das Tagesrätsel (5 Fragen), nimmt Quests an und trägt Fortschritt ein (ab 3 → abschließen);
   - besucht die Team-Seite, schickt Ruhigen eine Motivationsnachricht, öffnet die Team-Liga;
   - tippt große Belohnungsfenster weg (bleiben absichtlich stehen);
   - öffnet alle Bereiche und sammelt Abstürze, Konsolenfehler und fehlgeschlagene Anfragen.
4. **Fotos ansehen** (mindestens Home vorher/nachher, Tagesplan, Erfolge, Verlauf, Wochenübersicht) und auf UX-Auffälligkeiten achten.
5. **Langzeit-Prüfung in der Datenbank** (Supabase-Connector, nur lesend):
   - Einträge des Testkontos pro Tabelle und Tag. Wachsen die Logs Tag für Tag wie erwartet? Gibt es Duplikate?
   - Stimmen Serie, Punkte und Level auf Home mit dem überein, was die Logs hergeben? Nach einem Pausentag darf die Serie reißen, die Punkte dürfen aber nicht sinken.
   - Neue Abzeichen in `errungenschaften`, Wochenprotokoll-Snapshots nach Wochenwechsel.
6. **Bericht schreiben**: `docs/dauertest/<datum>.md` mit Kurzfazit, Befunden (Bug oder UX) und Zahlenverlauf (Punkte, Serie, Level, Einträge). Nach `main` pushen (reiner Doku-Commit).
7. **Echte Bugs** (Absturz, falsche Daten): klein und eindeutig → beheben wie jede Änderung (Feature-Branch, volle Testkette, dann `main`). Größer oder unklar → nur im Bericht festhalten und der Nutzerin melden.
8. Keine Daten des Testkontos löschen oder „aufräumen“. Genau diese Daten sind der Langzeittest.
