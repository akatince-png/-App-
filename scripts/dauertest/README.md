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

### Team-Vergleich (24.09.–24.10.2026, Wunsch der Nutzerin)

Zwei Test-Teams mit bewusst **unterschiedlichen Lebensbereichen und unterschiedlichem Fleiß**. Ziel: sehen, wie sich Punkte, Serien, Team-Wochenziel und Liga verhalten, wenn nicht alle dieselben Bereiche haben.

| Person | E-Mail | Team | Bereiche | Nicht dabei | Fleiß (`AKA_FLEISS`) | Pausentag-Versatz |
|---|---|---|---|---|---|---|
| Claude Dauertest | `claude.dauertest@example.com` | Sonne | Supplemente, Gewohnheiten, Morgen-/Abendroutine, Wasser | Medikamente, Training, Ernährung | 0.83 | 0 |
| Mia Dauertest (w, 32, Grafikdesignerin) | `claude.dauertest2@example.com` | Sonne | Medikamente (Medikinet), Supplemente, Gewohnheiten (Yoga, Tagebuch), Routinen, Wasser (2 l) | Training, Ernährung | 0.90 | 2 |
| Jonas Dauertest (m, 27, Student) | `claude.dauertest3@example.com` | Mond | Training (Mo/Mi/Fr Kraft, Sa Lauf), Ernährung (3 Mahlzeiten täglich), Wasser (3 l), Bildschirmzeit (120 Min.) | Medikamente, Supplemente, Routinen | 0.65 | 4 |
| Lea Dauertest (w, 41, Buchhalterin, 2 Kinder) | `claude.dauertest4@example.com` | Mond | Medikamente (Elvanse), Morgenroutine, Tageslicht (30 Min.), Gewohnheit (Abendspaziergang) | Training, Supplemente, Ernährung | 0.95 | 6 |

Alle vier haben je zwei Team-Quests pro Woche (Mo neu anlegen, `proband_id` = Testkonto, **nie `null`**).

Aufruf je Person (Passwort vorher per SQL neu setzen):

```bash
AKA_TEST_EMAIL=<email> AKA_TEST_PW='<pw>' AKA_FLEISS=<fleiß> AKA_PAUSE_VERSATZ=<versatz> AKA_OUT=dauertest-out/<datum>-<name> node scripts/dauertest/tageslauf.mjs
```

Im Tagesbericht festhalten: Punkte je Person (Home = Team-Seite?), Team-Wochenziel, Liga-Ø beider Teams, Serien. **Am 24.10.** Abschluss-Vergleich schreiben (Verlauf je Team/Person, Auffälligkeiten: z. B. ob Personen mit mehr eingerichteten Bereichen automatisch mehr Punkte sammeln und die Liga dadurch verzerrt wird).

**Nicht löschen.** Die Nutzerin sieht das Konto in ihrer Admin-Liste und
kann es über „Verwalten als“ ansehen.

Das Passwort wird **nirgends gespeichert**. Jeder Lauf setzt ein neues
Zufallspasswort per SQL (Supabase-Connector):

```sql
update auth.users set encrypted_password = extensions.crypt('<neues-zufallspasswort>', extensions.gen_salt('bf'))
where email = 'claude.dauertest@example.com';
```

(Falls `extensions.crypt` nicht existiert, das Schema weglassen: `crypt(...)` / `gen_salt(...)`.)

## Admin-Testkonto (seit 24.09.2026, Nutzerinnen-Wunsch)

`claude.admintest@example.com` („Claude Admin-Test“) ist ein Admin-Konto ohne Team, damit auch der Admin-Bereich live getestet wird. Die Rangliste ist ausgeblendet, damit es nirgends mitgezählt wird. **Nicht löschen.**

- **Passwort:** wird wie oben je Lauf per SQL gesetzt. Die Admin-Rechte schützt ein Trigger (`profiles_is_admin_schutz`), deshalb darf sie nur ein bestehender Admin vergeben.
- **Skript:** `scripts/dauertest/adminlauf.mjs` öffnet alle Admin- und normalen Ansichten und legt ein „Probe-Team Admin-Test“ mit Gruppenprotokoll an. Danach sieht es den Stand an, beendet das Protokoll, sieht sich per „Verwalten“ fünf Ansichten von Jonas an (ohne etwas zu ändern) und löscht das Probe-Team über die Oberfläche wieder. Befunde landen in `befunde.json`.

```bash
AKA_TEST_PW='<pw>' node scripts/dauertest/adminlauf.mjs
```


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
