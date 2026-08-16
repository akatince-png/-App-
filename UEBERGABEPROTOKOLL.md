# 📋 ÜBERGABEPROTOKOLL: AKA App

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 15) — Alle 8 verbliebenen Platzhalter-Themen auf Ernährungs-Niveau ausgebaut + Lexikon an Wissensbasis angebunden

Direkt im Anschluss an Teil 14. Nutzerin: Wenn der Ernährungs-Leitfaden
jetzt der umfangreichste Text der Wissensbasis ist, sollen alle anderen
Themen ebenso umfassend aufgearbeitet werden — UND die
Coaching-Unterlagen (Coachinghandbuch/Lexikon/Curriculum) sollen zur
App-Wissensbasis konsistent bleiben, damit sie nie mehr "weiß" als sie
selbst nachlesen kann. Vor dem Start per Rückfrage geklärt (Nutzerin
antwortete "alle 8 direkt nacheinander" + "beides" zu
appintern/appextern) — Details dazu unten (Commit `e52c5dd`).

**1. Acht bisherige Platzhalter-Dateien ersetzt** (jeweils mit
WebSearch-gestützter aktueller 2024-2026-Studienlage, Evidenzgrad pro
Aussage, eigenem PDF-Handbuch):
- `gewohnheiten/gewohnheiten-bei-adhs.md` — Neurowissenschaft der
  Gewohnheitsbildung, Implementation Intentions (heben ADHS-Leistung
  bei exekutiven Aufgaben auf annähernd neurotypisches Niveau), Habit
  Stacking, Environmental Design, Body Doubling, "Restart statt
  Aufholen".
- `hydration/hydration-bei-adhs.md` — Interozeptionsforschung
  (Bruton 2025), kognitive Effekte bereits milder Dehydration (~1 %
  Körpergewicht reicht), Stimulanzien-Effekt auf Durstempfinden.
- `schlaf/schlaf-bei-adhs.md` — ADHS als circadiane Rhythmusstörung,
  DLMO-Verschiebung (45 Min. Kinder/90 Min. Erwachsene), Chronotherapie-
  RCT, Restless-Legs-Syndrom (20-33 % Prävalenz bei ADHS), CBT-I,
  differenzierter Blick auf Stimulanzien-Effekt auf Schlafqualität.
- `tageslicht/tageslicht-bei-adhs.md` — Lichttherapie-Studien zu
  ADHS-Kernsymptomatik (nicht nur Schlaf), "Grün-Zeit"/Attention
  Restoration Theory bei Naturaufenthalten.
- `training/training-bei-adhs.md` — akutes Zeitfenster nach Training
  (30-60 Min. verbesserter Fokus), Vergleich Trainingsarten
  (fertigkeitsbasiert schlägt reines Ausdauertraining bei exekutiven
  Funktionen laut 2025er Netzwerk-Meta-Analyse), BDNF-Timing, ergänzt
  das gesonderte Isometrisches-Training-Wissen in coach_wissen.
- `medikamente/medikamente-bei-adhs.md` — bewusst Coaching-fokussiert
  (Einnahmetreue/Adhärenz-Forschung: nur 20-40 % Therapietreue nach 12
  Monaten, Einflussfaktoren, was nachweislich hilft), explizit KEINE
  Dosierungs-/Präparate-Empfehlungen, klare Grenzziehung zur
  ärztlichen Zuständigkeit.
- `supplemente/supplemente-bei-adhs.md` — bewusst als
  **Rahmenkonzept/Entscheidungslogik** angelegt (Mangel vs.
  Optimierung, Sicherheitsrahmen, Produktqualität/Kontamination,
  gezielte Vermarktung an ADHS-Zielgruppe laut Lancet Psychiatry 2026),
  NICHT als Wiederholung der ~25 bereits einzeln in coach_wissen
  gepflegten Supplement-Einträge (Magnesium, Zink, Omega-3, Kreatin
  usw.) — verweist stattdessen darauf, um Redundanz in der ohnehin
  riesigen Wissensbasis zu vermeiden.
- `peptide/peptide-bei-adhs.md` — größte inhaltliche Lücke (vorher
  0 Einträge in coach_wissen UND nur Platzhalter in src/wissen).
  Ordnet nach regulatorischer Kategorie (zugelassenes Medikament vs.
  Off-Label vs. unreguliertes "Research Chemical"), GLP-1-Agonisten
  und ADHS (2024er PET-Studie zu Dopamintransporter-Bindung unter
  Semaglutid, 2025er Beobachtungsstudie, aber explizit KEINE RCTs zu
  ADHS UND ein 2025er Sicherheitssignal zu Depression/Suizidalität bei
  entsprechender genetischer Veranlagung), BPC-157/TB-500
  (Tierstudien, Zulassungsstatus, Qualitätsrisiko unreguliert
  gekaufter Produkte). Strengste Coaching-Grenzen im gesamten
  Dokument (keine Bezugsquellen, keine Dosierung).

**2. In-App-Lexikon an Wissensbasis angebunden** (`utils/wissensBasis.js`,
`data/useLexikon.js`, `functions/lexikon/index.ts`): Beim Prüfen
festgestellt, dass die Lexikon-Funktion der App (📚-Icon, andere
Funktion als der KI-Chat/Aka) bisher OHNE jeden Bezug zur kuratierten
Wissensbasis antwortete — reine freie Modellantwort. Neue Funktion
`wissensBasisFuerLexikonKategorie()` liefert jetzt gezielt den
Wissenstext des passenden `src/wissen/`-Ordners zur gewählten
Lexikon-Kategorie; `useLexikon.js` schickt ihn als `kontext`-Feld mit;
die Edge Function baut ihn (falls vorhanden) in den Prompt ein. Nur 3
der 7 Lexikon-Kategorien haben einen passenden Wissens-Ordner
("Peptide", "Supplemente", "Schlafgesundheit" → `peptide/`,
`supplemente/`, `schlaf/`) — die anderen vier ("Hormone", "Anti-Aging",
"Muskelaufbau", "Haut & Haare") haben aktuell keinen eigenen
Wissensordner in dieser App und bleiben bewusst unverändert bei freier
Modellantwort, um nicht über den heute abgesteckten Rahmen
hinauszugehen. **🔴 Deploy nötig**: `functions/lexikon/index.ts` muss
manuell in Supabase neu deployt werden (kompletten Dateiinhalt in der
Edge-Function-Konsole ersetzen) — ohne Redeploy läuft die alte Version
weiter (kein Fehler, nur ohne den neuen Kontext-Effekt).

**3. Architektur-Warnung aus Teil 13/14 jetzt akut**: Die
`src/wissen/`-Sammlung ist durch diese Runde um satte 8 weitere große
Dateien gewachsen (Bundle +85 KB), alles davon fließt weiterhin
ungefiltert in JEDEN KiChat-Aufruf ein (`wissensBasisText()`,
`utils/wissensBasis.js`). Das ist jetzt kein theoretisches
"später bedenken" mehr, sondern ein realer Kosten-/Latenz-Faktor bei
jeder KI-Chat-Anfrage in der App. Empfehlung fürs nächste Mal, wenn
daran gearbeitet wird: gezielte Auswahl/Kurzfassung pro Themenbereich
statt weiter alles an jede Anfrage anzuhängen (z. B. nur den zum
gerade aktiven Protokoll-Bereich passenden Ausschnitt mitschicken,
ähnlich wie jetzt schon fürs Lexikon umgesetzt).

**4. Bewusst NICHT gemacht** (außerhalb des heute abgesteckten
Rahmens): coach_wissen (DB-Content-Library) wurde für keines der 8
Themen verändert — bestehende, bereits ausführliche Einträge dort
(Supplemente, Training/Isometrisches Training, Schlaf, Tageslicht,
Gewohnheiten, Hydration, Medikamente als "Modul"-Paare) bleiben
unangetastet und wurden nur beim Schreiben als Kontext berücksichtigt,
um Redundanz zu vermeiden. Externe, appfremde Coachinghandbuch-/
Lexikon-/Curriculum-Dokumente der Nutzerin kann ich nicht direkt
bearbeiten (kenne sie nicht) — die 8 neuen PDF-Handbücher sind die dafür
gedachte Grundlage zum eigenen Abgleich.

Build erfolgreich geprüft (`npm run build`), alle Änderungen committet
und gepusht.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 14) — Ernährungs-Leitfaden um viele Ernährungsweisen + aktuelle Studienlage erweitert

Sitzung wurde entgegen der Ankündigung in Teil 13 doch fortgesetzt:
Nutzerin sah den fertigen Leitfaden aus Teil 13, stellte klar,
intermittierendes Fasten sei "nur ein Beispiel" gewesen, und wollte
viele wissenschaftlich untersuchte Ernährungsweisen bei ADHS abgedeckt
haben — inklusive solcher, die noch früh in der Forschung stehen, aber
Potenzial zeigen, mit der **aktuellsten Studienlage**, "noch
akademischer", damit sie es gefiltert an ihre Coachees weitergeben
kann (Commit `581d40f`).

**Vorgehen:** Vor dem Schreiben mehrere Web-Recherchen zur aktuellen
(2024–2026) Studienlage durchgeführt (allgemeine Ernährungsmuster,
mediterrane Ernährung, Eliminationsdiäten/Farbstoffe/Feingold,
ketogene Ernährung, Mikrobiom/Probiotika, Omega-3, intermittierendes
Fasten, Mikronährstoffe, niedrig-glykämische Ernährung, gluten-/
kaseinfreie Ernährung, Präzisionsernährung), um nicht nur aus
Trainingswissen zu argumentieren.

**`src/wissen/ernaehrung/ernaehrung-bei-adhs.md` inhaltlich erweitert:**
- **Neuer Abschnitt 2.4** erklärt die Evidenzgrad-Logik (RCT vs.
  Meta-Analyse vs. Beobachtungsstudie vs. mechanistisch/theoretisch
  begründet) — Vokabular, das die Nutzerin auch im Coaching-Gespräch
  nutzen kann.
- **Abschnitt 2.2 (Fette/Omega-3) bewusst abgeschwächt**: eine aktuelle
  (2024/2025) Meta-Analyse (~22 Studien, ~1.800 Teilnehmende) fand
  **keinen** signifikanten Effekt von Omega-3-Supplementierung auf
  ADHS-Kernsymptome — deutlich zurückhaltender als die vorherige
  Formulierung. Ausführlich neu eingeordnet in **Abschnitt 3.9**.
- **Neuer, großer Abschnitt 3** ("Ernährungsweisen und Diät-
  Interventionen bei ADHS — aktuelle Studienlage") mit 11
  Unterabschnitten, jeweils mit Evidenzgrad-Label (Etabliert/Moderat/
  Aufkommend/Theoretisch), Mechanismus, Studienlage und
  Praxis-Einordnung: 3.1 allgemeines Ernährungsmuster (gesund vs.
  "westlich"), 3.2 mediterrane Ernährung (Ríos-Hernández 2017, Odds
  Ratio ~7 bei geringer Einhaltung), 3.3 Eliminationsdiäten/künstliche
  Farbstoffe/Feingold (Southampton-Studien, EU-Warnpflicht;
  Few-Foods-Diät mit stärkeren, aber aufwendigeren Effekten), 3.4
  niedrig-glykämische Ernährung, 3.5 ketogene Ernährung (früh, Oxford-
  RCT in Planung), 3.6 Darmmikrobiom/Probiotika (uneinheitlich), 3.7
  Mikronährstoffstatus (Eisen/Zink/Magnesium/Vitamin D), 3.8
  intermittierendes Fasten (bestehender Inhalt aus Teil 13 übernommen,
  jetzt mit explizitem Hinweis, dass direkte ADHS-Studien dazu
  praktisch fehlen), 3.9 Omega-3 neu eingeordnet, 3.10 gluten-/
  kaseinfreie Ernährung (schwache Evidenz für ADHS), 3.11
  Präzisionsernährung (Zukunftsfeld).
- Alte Abschnitte 4–8 (Mahlzeitenrhythmus, Lebensumstände, Getränke,
  Lebensmittel-Listen, Coaching-Praxis) unverändert erhalten, nur
  neu nummeriert; Abschnitt 7 um einen kurzen Verweis auf konkrete
  E-Nummern der Farbstoffe aus 3.3 ergänzt.
- **Neuer Abschnitt 9** listet die verwendeten Studien/Forschungsstränge
  als Ausgangspunkt für eigene Vertiefung.
- Datei wuchs von 301 auf 574 Zeilen. **Architektur-Hinweis aus Teil 13
  bleibt bestehen und verschärft sich**: diese Datei ist jetzt noch
  deutlicher die umfangreichste unter `src/wissen/` und fließt weiterhin
  ungefiltert in JEDEN KI-Chat der App ein (`utils/wissensBasis.js`,
  keine Vektorsuche). Beim nächsten Wachstumsschub der Wissens-Basis
  sollte über gezieltere Auswahl pro Anfrage nachgedacht werden.

**PDF-Handbuch neu erzeugt** (`build_pdf.py`, unverändert wiederverwendet)
und der Nutzerin erneut geschickt — jetzt 13 statt 7 Seiten, Aufbau/
Formatierung (Cover, Kapitel, Bullet-Listen, Fußzeile) unverändert
funktionsfähig, per pymupdf stichprobenartig visuell geprüft.

`npm run build` nach der Erweiterung erneut erfolgreich geprüft (Bundle
wuchs weiter, siehe Architektur-Hinweis oben).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 13) — Ernährungs-Wissen ausgebaut + Sitzungsabschluss

Letzte Runde der Sitzung, direkt im Anschluss an Teil 12. Zwei Themen:

**1. Härtere Sperre gegen Selbstregistrierung vertagt.** Die Nutzerin
wollte das eigentlich (Begründung: Piraterie-/Neugier-Schutz, sobald sie
öffentlich über die App spricht), hat es dann aber bewusst zurückgestellt
zugunsten des zweiten Themas unten — als offener Punkt #24 dokumentiert
(inkl. Zwischenstand: "Enable email provider" NICHT anfassen, vermuteter
"Allow new users to sign up"-Schalter unter einem "User Signups"-Bereich
auf der Hauptseite "Sign In / Providers" noch zu bestätigen).

**2. Umfassender Ernährung-bei-ADHS-Leitfaden** (Commit `38e067d`) —
Nutzerinnen-Vorgabe: nach Medikamente/Supplemente/Schlaf/Tageslicht/
isometrischem Training war Ernährung der letzte große Bereich ohne
detailliertes Hintergrundwissen. Zwei Ausgaben, ein Inhalt:
- `src/wissen/ernaehrung/ernaehrung-bei-adhs.md` ersetzt den bisherigen
  Platzhalter — wird wie jede Datei unter `src/wissen/` automatisch in
  den Hintergrundkontext des KI-Assistenten eingebunden (siehe
  `utils/wissensBasis.js`, "alles wird an jede Anfrage angehängt", keine
  Vektorsuche). **Zu bedenken für die Zukunft**: die Datei ist mit
  Abstand die umfangreichste unter `src/wissen/` (die Bundle-Größe stieg
  dadurch spürbar, ca. 15 KB) — sie fließt in JEDEN KI-Chat der App ein,
  nicht nur ernährungsbezogene. Bei weiterem Wachstum der Wissens-Basis
  (z. B. wenn Medikamente/Supplemente/Schlaf irgendwann ähnlich
  ausführlich wie hier nachgezogen werden) sollte über eine gezieltere
  Auswahl pro Anfrage nachgedacht werden, statt weiter alles an jede
  Anfrage anzuhängen.
- Inhaltlich behandelt: warum Ernährung bei ADHS überhaupt relevant ist
  (Neurotransmitter-Bausteine, Blutzucker, Darm-Hirn-Achse), die drei
  Makronährstoffe im Detail, intermittierendes Fasten differenziert
  (Pro/Contra spezifisch für ADHS, wann es trotzdem infrage kommt), warum
  regelmäßige Mahlzeiten meist die bessere Standardempfehlung sind,
  wann sich der Ernährungsbedarf je nach Lebensumständen ändert
  (Training, Medikamenten-Titration, Stress, Zyklus, Schlafmangel),
  Getränke, sowie Lebensmittel-/Getränkelisten (empfehlenswert/eher
  meiden) je Kategorie.
- Zusätzlich als eigenständiges PDF-Handbuch erstellt und der Nutzerin
  direkt geschickt ("Ernährung bei ADHS — Handbuch", 7 Seiten,
  reportlab-generiert) — bewusst NICHT in die bestehende
  `coach_wissen`-Content-Library (DB-gestützt, siehe Migrationen
  `coach_wissen_*`) eingepflegt, das hat die Nutzerin explizit auf später
  vertagt ("kann man später irgendwie reinhängen").

Sitzung von der Nutzerin für den Moment beendet ("das wäre echt noch das,
was du machen sollst ... bis ich die nächsten Tage wieder zu dir komme").

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 12) — Einladungssystem statt offener Registrierung + wählbarer Onboarding-Umfang

Direkt im Anschluss an Teil 11, ausgelöst durch zwei Beobachtungen der
Nutzerin beim Testen: (1) ihr Testkonto landete im kurzen Steckbrief-
Onboarding statt der vollen Einrichtung, (2) dabei kam heraus, dass der
Login-Screen noch einen offenen "Registrieren"-Tab hatte — jede beliebige
Person mit der URL hätte sich dort selbst ein Konto anlegen können, ganz
ohne Einladung. Beides jetzt behoben (Commit `c2044af`).

**1. Selbstregistrierung entfernt.** `LoginView.jsx` hat nur noch
"Anmelden", `AuthContext.signUp` wurde komplett entfernt. Konten entstehen
jetzt ausschließlich über die Admin — entweder direkt mit gesetztem
Passwort ("+ Neuen Zugang anlegen") oder per Einladung (siehe unten).
**Wichtig, das reicht allein noch nicht:** die Entfernung der UI verhindert
nicht, dass jemand mit Kenntnissen direkt die Supabase-API anspricht (der
öffentliche Anon-Key steckt sowieso im Browser-Bundle). Für einen
wirklich dichten Riegel sollte die Nutzerin zusätzlich einmalig in Supabase
→ Authentication → Sign In / Providers → Email die Option "Enable email
signups" deaktivieren (nur Einladungen/von Admin angelegte Konten bleiben
dann überhaupt möglich).

**2. Wählbarer Onboarding-Umfang je Coachee** (Nutzerinnen-Vorgabe: "ich
möchte verschiedene Coaching-Modelle anbieten, manche werden mehr selbst
geführt, manche komplett von mir geleitet"):
- Neue Spalte `profiles.onboarding_modus` ("kurz"/"lang", Standard
  "kurz" — bisheriges Verhalten bleibt der Default). Steuert in
  `OnboardingFlow.jsx`, ob eine Coachee beim EIGENEN Durchlauf nur den
  kurzen Steckbrief sieht (wie bisher) oder die volle Kategorie-
  Einrichtung, die sonst nur die Admin im "Verwalten"-Modus sieht.
  Wirkt sich NICHT aus, wenn die Admin sowieso per "Verwalten" alles
  vorher selbst einrichtet — dann bleibt es wie gehabt bei "kein
  Onboarding mehr nötig", unabhängig vom gewählten Modus.
- Wählbar an drei Stellen: beim Anlegen ("+ Neuen Zugang anlegen"), bei
  einer Einladung (siehe unten), und nachträglich direkt in der
  Kontenliste (kleiner "Onboarding: Kurz/Lang"-Knopf, nur sichtbar
  solange die Person ihr Onboarding noch nicht abgeschlossen hat).

**3. Einladung per E-Mail** (Nutzerinnen-Vorgabe: "dass ich jemandem einen
Link schicke ... er nur darüber reinkommt"):
- Neue Edge Function `admin-invite-proband` — nutzt Supabases eingebaute
  `auth.admin.inviteUserByEmail()`, verschickt die Standard-Einladungs-
  Mail von Supabase (Vorlage im Supabase-Dashboard unter Authentication →
  Email Templates anpassbar, aber nicht zwingend nötig). **Muss die
  Nutzerin noch manuell anlegen und deployen** (komplett neue Funktion,
  wie schon bei `send-team-push` in Teil 9/10).
- Neue Admin-UI "✉️ Coachee einladen" (Name, E-Mail, Kurz/Lang-Wahl).
- Neue `InviteAcceptView.jsx`: fängt den Klick auf den Einladungs-Link ab
  (URL-Parameter `type=invite`, dieselbe Weiche greift auch für
  `type=recovery` — es gibt also nebenbei jetzt auch eine funktionierende
  Landing-Page für "Passwort vergessen"-Links, falls die Nutzerin sowas
  später mal manuell über Supabase auslöst) und lässt die Person sich
  selbst ein Passwort setzen, bevor die eigentliche App startet.
- **Muss die Nutzerin einmalig prüfen**: Supabase → Authentication → URL
  Configuration → "Site URL" muss auf die echte App-URL zeigen
  (`akaapp.vercel.app` oder die tatsächliche Domain), sonst führt der
  Link in der Einladungs-Mail ins Leere.

**Nicht end-to-end testbar aus diesem Sandbox** (kein Netzwerkzugriff auf
Supabase) — die Nutzerin sollte einmal eine echte Testeinladung an sich
selbst (oder eine Zweit-E-Mail) verschicken und den kompletten Ablauf
durchklicken, bevor sie das für echte Coachees nutzt.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 11) — Test-Coachee-Zugangsdaten sichtbar (separates Login statt nur "Verwalten")

Direkt im Anschluss an Teil 10. Nutzerinnen-Vorgabe: sie will die App auch
"aus der Coacheeperspektive" nutzen können, mit einem SEPARATEN Zugang statt
über ihren eigenen Admin-Zugang. Wichtige Klarstellung dabei: "Verwalten
als" leistet das NICHT — dabei bleibt `istAdminModus` technisch immer
`true` (`proband !== null || isAdmin`), man sieht dort also absichtlich
weiterhin die Admin-Ansicht (Assistent statt Coachee-Startseite mit
Quests/Rangliste/Team-Karte), damit die Admin für die Person einrichten
kann, ohne deren Sicht simulieren zu müssen.

Behoben (Commit `d479304`): der in Teil 10 gebaute "🧪 Test-Coachee
erstellen"-Knopf zeigt die generierte E-Mail + das Passwort jetzt direkt
an (mit Kopieren-Knopf), statt sie wie beim normalen "+ Neuen Zugang
anlegen"-Formular zu verstecken. Damit kann sich die Nutzerin in einem
privaten/separaten Browser-Tab wirklich als Nicht-Admin-Person einloggen
und die echte Coachee-Ansicht sehen.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 10) — Teams-Deploy: drei Fixes beim Ausführen gefunden + Test-Coachee-Knopf

Direkt im Anschluss an Teil 9, während die Nutzerin die neue Teams-
Migration (0073) tatsächlich ausgeführt hat. Alle vier Punkte sind reine
Reaktionen auf konkrete Fehler/Wünsche beim Testen, keine neuen Features
über das in Teil 9 Beschriebene hinaus (außer Punkt 4).

1. **Migration 0073 lief zunächst nicht** (`ERROR: 42703: column "team_id"
   does not exist`): eigener Bug — die "teams: eigenes Team lesen"-Policy
   referenziert `profiles.team_id` in ihrer USING-Klausel, stand im Skript
   aber VOR der Zeile, die diese Spalte erst anlegt. Reihenfolge korrigiert
   (Commit `906e4af`).
2. **Danach neuer Fehler** (`ERROR: 42703: column qf.angenommen does not
   exist`, beim Anlegen von `quest_rangliste()`): die Nutzerin hatte die
   ursprüngliche Quests-Migration (0070) schon VOR dem späteren Ergänzen
   der `angenommen`-Spalte (Teil 7) ausgeführt — ihr lief also eine ältere
   Version. `0073_teams.sql` holt die Spalte jetzt selbst mit `if not
   exists` nach, statt sich auf einen bestimmten Vor-Deploy-Stand zu
   verlassen (Commit `ef1245b`).
3. **UI-Bug in `AdminTeamsView.jsx`**: der "Team löschen"-Knopf (ohne
   Breitenbegrenzung, `PrimaryButton` ist standardmäßig 100% breit) hat
   sich über die komplette Kartenbreite gezogen und den Teamnamen verdeckt.
   Mit `width: 120` in einem Wrapper-Div behoben, analog zum "Anlegen"-
   Knopf direkt darüber, der von Anfang an korrekt eingefasst war (Commit
   `3cc9733`).
4. **Neuer Wunsch beim Testen**: die Nutzerin hat noch keine echten
   Coachees, wollte aber Profile/Protokolle/Quests/Teams selbst
   durchklicken können, ohne für jeden Testzugang manuell E-Mail/Passwort
   einzutippen ODER eine KI regelmäßig Einträge simulieren zu lassen
   ("das ist jetzt zu groß und zu aufwendig, das ist nicht der Plan").
   Neuer Knopf "🧪 Test-Coachee erstellen" im Admin-Dashboard, direkt neben
   "+ Neuen Zugang anlegen" — ein Klick legt mit zufälliger E-Mail/
   Passwort und fortlaufendem Namen ("Test 1", "Test 2", ...) ein Konto
   an, das ausschließlich über "Verwalten" bedient wird (niemand muss sich
   je damit einloggen). Nutzt die bereits deployte `admin-create-proband`-
   Funktion, keine neue Migration/Edge Function nötig (Commit `c85fa6e`).
   **Bewusst nicht gebaut**: ein Lösch-Knopf für Testkonten — das wäre eine
   nicht rückgängig machbare Aktion samt Kaskaden-Löschung aller Daten
   dieser Person; Aufräumen aktuell nur direkt in Supabase (`auth.users`).

**Arbeitsweise-Hinweis der Nutzerin (16.08., wörtlich sinngemäß):** noch
vorsichtiger sein, keine Bugs/Fehlermasken einbauen oder unbeteiligte
Bereiche anfassen, UND das Übergabeprotokoll nach JEDER Änderung sofort
nachziehen statt am Ende in einer großen Runde — Kontingent-Sorge, falls
später doch nochmal viel repariert werden muss. Ab sofort entsprechend
disziplinierter dokumentieren.

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 9) — Quest-Rangliste + Teams: Coachees können sich vergleichen und gegenseitig motivieren

Direkt im Anschluss an Teil 8, zwei Aufträge in Folge: erst eine
Quest-Rangliste (Commit `30d5eb7`), dann — noch in derselben Runde —
Teams, weil die Nutzerin die Rangliste nicht global (alle Coachees sehen
alle), sondern gruppenweise wollte, plus eine neue, größere Funktion:
Motivationsnachrichten zwischen Coachees samt Push (Commit `6ef2051`).

**Quest-Rangliste** (`0072_quest_rangliste.sql`, dann durch Teams-Migration
ersetzt, siehe unten): neue security-definer-Funktion `quest_rangliste()`
liefert Name + Anzahl abgeschlossener Quests je Coachee — sichtbar auf der
Startseite (eigene Zeile hervorgehoben) und oben in der
Quests-Verwaltung. Gibt bewusst nur aggregierte Zahlen zurück, keine
Notizen/Detail-Inhalte anderer Coachees.

**Teams** (`0073_teams.sql`, Nutzerinnen-Vorgabe wörtlich: "dass sich
Coachees ... in Teams zusammengesetzt werden und dann nur diese Teams die
Dinge voneinander sehen können ... dass man sich untereinander auch
Motivation gibt ... Push Nachrichten senden kann"):
- Neue Tabelle `teams` + Spalte `profiles.team_id` — **ein Team pro
  Coachee** (V1-Entscheidung, keine Mehrfach-Mitgliedschaft; für eine
  überschaubare Coaching-Gruppe ausreichend, einfacher als eine n:m-Tabelle).
- `quest_rangliste()` ist jetzt team-bewusst: Admin sieht weiterhin alle
  Coachees, eine Coachee MIT Team sieht nur ihre Team-Kolleg:innen, eine
  Coachee OHNE Team sieht nur sich selbst (kein Rundum-Vergleich ohne
  Team-Zuordnung — genau die geforderte Einschränkung).
- Neue Admin-Ansicht `AdminTeamsView.jsx` ("👥 Teams verwalten" im
  Admin-Dashboard): Teams anlegen/löschen, Coachees per Antippen einem
  Team zuordnen oder entfernen.
- Neue Hilfsfunktion `gleiches_team(a, b)` (security definer) — Grundlage
  für die RLS-Policies der neuen Peer-Nachrichten.
- **Motivationsnachrichten zwischen Team-Kolleg:innen**: neue Tabelle
  `team_nachrichten` (1:1, nicht an die Admin gerichtet — das bleibt
  `coachee_nachrichten`), RLS erlaubt Senden nur innerhalb desselben Teams.
  Neue Karte auf der Startseite (`TeamKarte.jsx`, nur sichtbar mit
  Team-Zuordnung): Team-Kollegin auswählen, Nachricht schreiben, senden.
- **Push-Zustellung dafür**: neue Edge Function `send-team-push` — muss
  die Nutzerin noch **manuell in Supabase anlegen und deployen** (siehe
  Abschnitt 10, ist eine KOMPLETT NEUE Funktion, nicht nur ein Redeploy
  einer bestehenden). Läuft mit dem Service-Role-Key (braucht Zugriff auf
  `push_subscriptions` der Zielperson, die der aufrufende Client per RLS
  nicht lesen dürfte), prüft aber vorher serverseitig per `gleiches_team()`,
  dass Sender:in und Empfänger:in wirklich im selben Team sind — sonst
  könnte im Prinzip jede angemeldete Person jeder anderen eine Push
  schicken, nur weil beide dieselbe App nutzen.

**Bewusst NICHT in dieser Runde umgesetzt:**
- **Team-vs-Team-Vergleich** (Gesamtwertung eines Teams gegen ein anderes,
  z. B. Summe/Schnitt der Quest-Abschlüsse) — die Nutzerin nannte das
  explizit ("diese gesamte Bewertung ... im Gruppenkontext bewertet werden
  können"), umgesetzt ist bisher nur der Vergleich EINZELNER Coachees
  INNERHALB ihres Teams. Eine echte Team-Gesamtwertung wäre eine weitere,
  kleinere Ergänzung (im Kern nur eine neue Aggregations-Funktion +
  Ansicht) — noch offen.
- **Vergleich beim normalen Protokoll** (nicht nur Quests) — weiterhin
  offen, siehe Teil 6/7. Keine verlässliche, faire Einzelzahl über alle
  Kategorien hinweg vorhanden (Training/Ernährung/Supplemente/... laufen
  sehr unterschiedlich), bräuchte eine eigene Klärungsrunde, WAS genau
  verglichen werden soll, bevor es gebaut wird.
- Broadcast-Nachrichten ans ganze Team (statt nur 1:1) — aktuell nur
  Person-zu-Person, analog zum bisherigen `coachee_nachrichten`-Muster.
- Kein Opt-out/Privatsphäre-Einstellung für einzelne Coachees, die evtl.
  nicht verglichen werden wollen — bisher ist die Team-Zuordnung rein eine
  Admin-Entscheidung, die Coachee selbst hat keine Möglichkeit, sich aus
  der Rangliste/den Vergleichen auszublenden.

---

## 🔴 Update 16.08.2026, Fortsetzung (Teil 8) — Routinen-Bug bestätigt: wieder eine fehlende Migration + Vorab-Hinweis war versteckt

Direkt im Anschluss an Teil 7. Die in Teil 7 sichtbar gemachte Fehlermeldung
bestätigte die dortige Vermutung: **`Could not find the table
'public.routine_schritte' in the schema cache`** — Migration 0041
(`routine_schritte`, `routine_durchlaeufe`) und vermutlich auch 0044
(`routine_einstellungen`) wurden nie in der echten Datenbank ausgeführt,
obwohl im Übergabeprotokoll als "deployt" notiert. **Exakt dasselbe Muster
wie der `profiles.erinnerungen`-Bug aus Teil 5** — einzelne Migrationen
beim manuellen Durchklicken übersprungen, ohne dass es auffiel, weil auch
hier nur `console.error()` statt einer sichtbaren Fehlermeldung lief (erst
durch den Teil-7-Fix überhaupt sichtbar geworden). Behoben mit neuer
Migration `0071_routine_tabellen_nachholen.sql` (holt alle drei Tabellen +
RLS-Policies nach, idempotent mit `if not exists`/`drop policy if
exists` geschrieben) — **muss die Nutzerin noch manuell in der
Supabase-SQL-Konsole ausführen**.

**Empfehlung für den nächsten Sitzungsstart:** Da jetzt zweimal
unabhängig voneinander Migrationen "als deployt" galten, aber nie liefen,
lohnt sich ein einmaliger Rundum-Check aller ~71 Migrationen gegen die
echte Datenbank (z. B. `select table_name from information_schema.tables
where table_schema = 'public'` mit der Nutzerin abgleichen, oder alle
Tabellennamen aus den `create table`-Anweisungen der Migrationsdateien
extrahieren und gegenprüfen), statt weiter einzeln nachzujagen, sobald
ein Fehler auffällt.

Zusätzlich, aus derselben Nutzerinnen-Vorgabe: Der Vorab-Hinweis
(15/30/45/60 Min. vorher erinnert werden, zusätzlich zum Signal beim
eigentlichen Start — für Gewohnheiten, Training, Mahlzeiten, Supplemente,
Workflow) existierte technisch schon (`VorlaufFeld.jsx`), war aber in
`KategorieErinnerung.jsx` und `WochenplanEditor.jsx` (Training) hinter dem
"Erinnerung: Ja"-Schalter versteckt — die Minuten-Auswahl erschien erst
nach dem Umschalten, was die Nutzerin wiederholt übersehen hat. Jetzt
immer sichtbar, eine Vorlauf-Auswahl aktiviert die Erinnerung von sich aus
mit. Außerdem 45-Minuten-Option ergänzt (bisher nur 15/30/60/120).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 7) — Quests: Annehmen/Ablehnen + Benachrichtigung + Tagesplan/Gewohnheiten, Routinen-Bug gefunden

Direkt im Anschluss an Teil 6, noch selbe Sitzung, zwei Meldungen der
Nutzerin.

**1. Routinen-Bug** (Screenshot: Morgen-/Abendroutine-Schritte-Editor unter
"Routinen"): Vorschlags-Pills ("Wasser trinken" etc.) und das manuelle
"Neuer Schritt"-Feld liefen ins Leere — kein Fehler, keine Bestätigung,
einfach nichts. Die Verdrahtung (`RoutineSchritteEditor.jsx` →
`routineSchrittHinzufuegen()` in `useRoutinen.js`) ist korrekt, aber die
Speicherfunktion meldete einen Fehler bisher nur per `console.error()` —
exakt dasselbe Silent-Failure-Muster wie beim `erinnerungen`-Bug in Teil 5
(Offener Punkt #13). **Nicht abschließend geklärt, ob die zugrunde
liegende Ursache ebenfalls eine fehlende Migration ist** (0041/0044
`routine_*`-Tabellen) — das lässt sich aus diesem Sandbox heraus nicht
gegen die echte Datenbank prüfen. Behoben: `RoutineSchritteEditor.jsx`
zeigt jetzt den tatsächlichen Fehlertext an, statt ihn verschluckt zu
lassen. **Nächster Schritt bei erneutem Auftreten:** den jetzt sichtbaren
Fehlertext im Chat mitteilen — verrät sofort, ob es eine fehlende Tabelle,
eine RLS-Policy oder etwas anderes ist (gleiche Diagnosetechnik wie in
Teil 5).

**2. Quests erweitert** (Nutzerinnen-Vorgabe, wörtlich zusammengefasst):
Coachees sollen über eine neue Quest per Nachricht benachrichtigt werden,
sie annehmen oder ablehnen können, und eine angenommene Quest soll
zusätzlich zur Startseite auch im Tagesplan und unter Gewohnheiten
auftauchen. Umgesetzt (Commit `b7b2911`):
- `quest_fortschritt` hat jetzt eine `angenommen`-Spalte (tri-state: noch
  unbeantwortet/angenommen/abgelehnt) — Migration `0070_quests.sql`
  entsprechend angepasst (siehe unten, **von der Nutzerin noch nicht
  ausgeführt**, daher direkt in der bestehenden Datei ergänzt statt eine
  neue Migration draufzusetzen).
- `adminQuestErstellen()` verschickt nach dem Anlegen automatisch eine
  Nachricht über den bestehenden Kontaktweg (`coachee_nachrichten`, siehe
  0045) — bei einer Rundruf-Quest an alle aktuellen Coachees einzeln.
- Neue geteilte Komponente `ui/QuestsKarte.jsx` (aus `HomeView.jsx`
  herausgezogen, dort dupliziert gewesen): zeigt auf der Startseite ALLE
  sichtbaren Quests inkl. Annehmen/Ablehnen-Einladung; in
  `GewohnheitenView.jsx` und `TagesplanView.jsx` (nur "heute") nur die
  bereits angenommenen, noch offenen Quests, ohne Einladungs-UI.
- `AdminQuestsView.jsx`: Fortschritts-Tabelle unterscheidet jetzt
  "Noch nicht reagiert" / "Abgelehnt" / "Angenommen · in Arbeit" /
  "Erledigt". Button "Archivieren" in "Entfernen" umbenannt (Funktion
  unverändert — Quest verschwindet bei Coachees, bleibt für die Auswertung
  in der Admin-Ansicht sichtbar).

Weiterhin bewusst NICHT umgesetzt (unverändert seit Teil 6): Rangliste/
Konkurrenz zwischen Coachees, automatische Kopplung an echte
Protokoll-Werte (satzgenaue Bestätigung bei Training).

---

## ⚠️ Update 16.08.2026, Fortsetzung (Teil 6) — KI-Chat kann jetzt wirklich eintragen + neues Feature "Quests"

Direkt im Anschluss an Teil 5, noch selbe Sitzung. Zwei Aufträge der
Nutzerin: (1) "die KI ... sagte mir, dass sie selber die Einträge nicht
vornehmen kann ... das war nicht die Idee der ganzen Sache" — der
"Übernehmen"-Mechanismus im Chat (`KiChat.jsx` → `on Uebernehmen`-Callback)
existierte zwar schon für einige Bereiche, aber Workflow/Schlaf fehlten im
universellen Coach komplett, und mehrere `*AusChat`-Extraktoren in
`aiService.js` fragten die KI nach weniger Feldern ab, als die zugehörige
Speicherfunktion eigentlich braucht — die KI hat dann (korrekterweise)
gesagt, sie könne nicht speichern, statt unvollständig zu speichern.
(2) Neues Feature "Quests": freiwillige Sonderaufgaben, die die Coach ihren
Coachees zusätzlich zum Pflicht-Protokoll stellen kann.

### Teil A: Chat-Übernahme lückenlos gemacht

- `f117d31`: Workflow-Presets/-Pläne sind jetzt per Chat anlegbar
  (`workflowAusChat`, neue `handleWorkflowUebernehmen` in
  `GewohnheitenView.jsx`), und der universelle Coach (Home/Tagesplan/
  Wochenübersicht) kennt jetzt auch `schlaf` und `workflow` als Ziel-Bereich
  (`useUniversellerCoach.js`, vorher fehlten beide in
  `bereichErkennen()`/der Switch-Routing-Tabelle, obwohl die dedizierten
  Ansichten dafür längst funktionierten).
- `24f552d`: Der konkrete Auslöser der Nutzerin — Trainingsplan-Chat
  (`trainingsplanAusChat`) fehlten bei Intervall-/isometrischem Training die
  Felder `uhrzeit`/`intervallArbeitSek`/`intervallPauseSek`/`runden`, obwohl
  `wochenplanHinzufuegen()` sie längst unterstützt. Genau diese Felder sind
  bei "5 Sek. halten, 4 Sek. Pause, 5 Runden" aber der eigentliche Inhalt der
  Übung — ohne sie konnte die KI nichts Sinnvolles speichern.
- `9708d21`: Danach alle **übrigen** `*AusChat`-Extraktoren im Hintergrund
  gegen ihre jeweilige Speicherfunktion geprüft (nicht nur gegen die
  DB-Spalten, sondern gegen das, was die Funktion tatsächlich verwendet).
  Ergebnis — drei weitere echte Lücken gefunden und behoben:
  - **`supplementAusChat`**: fehlten `menge` + das komplette
    Intervall-System (`intervallTyp`, `intervallDays`, `customDays`,
    `onDays`/`offDays`, `weekdays`, `eigenerStart`, `uhrzeiten`) — dieselben
    Felder, die Medikamente/Peptide im Chat längst nutzen. Betrifft auch
    `SupplementeView.jsx` und `useUniversellerCoach.js` (beide haben die
    KI-Antwort manuell destrukturiert, mussten also ebenfalls erweitert
    werden, sonst wären die neu erfassten Felder eine Ebene tiefer wieder
    stillschweigend verlorengegangen).
  - **`medikamentAusChat`**: `kategorie`-Enum fehlte `"Peptid"`, obwohl das
    seit der Zusammenführung von Peptiden in `hormones` (Migration 0042)
    eine vollwertige Kategorie ist.
  - **`workflowAusChat`**: fehlten `gueltigVon`/`gueltigBis`
    (Gültigkeitszeitraum), ergänzt inkl. der beiden Aufrufer.
  - Geprüft und bereits vollständig befunden: `gewohnheitAusChat`,
    `routineAusChat`, `hydrationAusChat`, `tageslichtAusChat`,
    `ernaehrungsplanAusChat`, `laborwerteAusChat`, `peptidAusChat`,
    `schlafAusChat`.

Build + `oxlint` nach jedem Schritt sauber (20 Warnungen, alle
vorbestehend, keine Fehler).

### Teil B: Neues Feature "Quests" (freiwillige Sonderaufgaben)

Nutzerinnen-Vorgabe (wörtlich, wichtig für die Einordnung des V1-Scopes):
"diese Woche machen wir drei Sätze isometrisches Training und das soll sone
freiwillige Aufgabe sein ... falls sie Interesse dran haben" — plus, in
einer ausführlicheren Antwort auf Rückfrage: Abschluss soll je nach
Quest-Art unterschiedlich funktionieren (einfach / mit Zielzahl),
beim Abschließen sollen Dauer + was gemacht wurde + Freitext an die Coach
gemeldet werden, und langfristig sollen Coachees **sowohl beim normalen
Protokoll als auch bei Quests gegeneinander antreten können** (ihre eigene
Formulierung: "ein bösen Konkurrenz-Gedanke, gleichzeitig eine gewisse
Gruppendynamik/Team für eine Gemeinschafts-Geschichte").

**V1 umgesetzt** (Commit `c3d2c16`):
- Neue Tabellen `quests` + `quest_fortschritt`
  (`supabase/migrations/0070_quests.sql`, **muss die Nutzerin noch manuell
  in der Supabase-SQL-Konsole ausführen**, siehe Abschnitt 10).
- Admin legt eine Quest an (Titel, Beschreibung, Typ "einfach" oder "mit
  Zielzahl" + Einheit, Ziel = alle Coachees oder eine einzelne Person,
  optional Gültig-bis-Datum) über den neuen Menüpunkt "🎯 Quests verwalten"
  im Admin-Dashboard (`AdminQuestsView.jsx`).
- Coachee sieht offene Quests auf der Startseite (neue `QuestsKarte` in
  `HomeView.jsx`), kann bei Zielzahl-Quests laufend einen Stand speichern,
  und beim Abschließen optional Dauer (Minuten) + Freitext-Notiz angeben.
  Admin sieht alle Meldungen pro Coachee in `AdminQuestsView.jsx`.
- Datenmodell/Hook: `src/data/useQuestData.js` — `useQuestData(userId)` für
  die Coachee-Seite (RLS lässt jede Coachee eigene + Rundruf-Quests sehen),
  plus eigenständige `adminQuest*`-Funktionen (analog
  `coachNachrichtSenden`) für die Admin-Seite, da die Admin nicht an eine
  feste userId gebunden ist.

**Bewusst NICHT in V1** (transparent an die Nutzerin kommuniziert, nicht
stillschweigend weggelassen — gleiches Vorgehen wie bei der
Baustein-Versionierung in Teil 3):
- **Rangliste/Vergleich zwischen Coachees**, weder für Quests noch fürs
  normale Protokoll. Der Wunsch nach "Konkurrenz" UND "Gruppendynamik/Team"
  gleichzeitig ist noch nicht aufgelöst — das ist ein eigenes, größeres
  Feature (braucht eine Definition, was genau verglichen wird, ob anonym
  oder mit Namen, ob pro Woche oder insgesamt) und sollte in einer eigenen
  Runde mit der Nutzerin konkretisiert werden, bevor es gebaut wird.
- **Automatische Kopplung an echte Protokoll-Werte** (z. B. jeden
  geloggten Trainingssatz automatisch mitzählen statt manueller Meldung,
  oder "jeder einzelne Satz muss bestätigt werden" bei Trainings-Quests) —
  V1 nutzt eine manuelle Fortschritts-/Abschlussmeldung durch die Coachee,
  das deckt die genannten Beispiele (Wasser, Aufstehzeit, Leute treffen)
  bereits vollständig ab, aber nicht die feingranulare Satz-für-Satz-
  Bestätigung bei Training.
- Kein Nachfass-/Erinnerungs-Push für offene Quests (anders als beim
  Pflicht-Protokoll) — bewusst weggelassen, damit "freiwillig" nicht durch
  Erinnerungsdruck konterkariert wird; könnte bei Bedarf ergänzt werden.

---

## 🔴 Update 16.08.2026, nachts (Teil 5) — Erinnerungen liefen NIE wirklich: zwei stille Fehlerquellen gefunden + behoben

Letzte Runde vor Zugangsende der Nutzerin. Direkt im Anschluss an Teil 4
(VAPID-Fix), noch in derselben Nacht. Committet: `17ec1fd` (Morgenroutine/
Abendroutine/Workflow-Erinnerungen), `b104732` (Vorab-Hinweis direkt in
jeder Kategorie-Ansicht statt nur unter Mehr — neue Komponente
`ui/KategorieErinnerung.jsx`, eingebunden in `GewohnheitenView.jsx`,
`RoutineTabView.jsx`, `NutritionView.jsx`, `MedikamenteView.jsx`,
`SupplementeView.jsx`, `ZeitErinnerungenCard.jsx`, `WochenplanEditor.jsx`).

**Ausgangspunkt:** Nutzerin legte testweise eine Gewohnheit mit Uhrzeit in
2–3 Minuten an, schaltete die Erinnerung dafür ein — keine
Push-Benachrichtigung kam an, obwohl der VAPID-Fix aus Teil 4 bestätigt
funktionierte (Test-Erinnerung-Button lief). Zwei **voneinander
unabhängige**, beide stille (keine Fehlermeldung für die Nutzerin
sichtbare) Fehlerquellen gefunden, gemeinsam per Screenshots/Supabase-Logs
im Chat durchdiagnostiziert:

### Fehler 1: `CRON_SECRET`-Mismatch — der automatische Versand lief seit jeher gegen 401

`send-due-reminders → Invocations` zeigte: pg_cron ruft zuverlässig jede
Minute auf, aber **fast jeder Aufruf wurde mit 401 abgelehnt**. Ursache:
Migration `0032_erinnerungs_versand.sql` legt den Cron-Job mit einem fest
im SQL-Text eingetragenen `x-cron-secret`-Header an — dieser Wert ist eine
**zweite, unabhängige Kopie** desselben Geheimnisses neben dem
`CRON_SECRET`-Supabase-Secret der Funktion. Beide müssen exakt
übereinstimmen; taten sie (aus unbekanntem Grund, vermutlich beim
ursprünglichen Einrichten) nicht. Da Supabase gespeicherte Secrets nicht
wieder anzeigt, war ein direkter Abgleich unmöglich — stattdessen neuen
Zufallswert erzeugt und **beide Seiten synchron neu gesetzt**:
`CRON_SECRET`-Secret aktualisiert UND Migration 0032 mit demselben neuen
Wert erneut ausgeführt (`cron.schedule()` mit bestehendem Job-Namen
ersetzt den alten Job automatisch, kein vorheriges `unschedule` nötig).

**Wichtige Nebenerkenntnis fürs Debuggen:** Nach dem Secret-Wechsel allein
blieb es zunächst bei 401 — die Funktion liest `Deno.env.get("CRON_SECRET")`
nur einmal beim Modul-Start, ein reines Secret-Update erzwingt keinen
Neustart einer bereits "warmgehaltenen" Instanz. Erst ein manueller
Redeploy (Code-Tab → Deploy, ohne Code-Änderung) hat den neuen Wert
tatsächlich eingelesen. **Für künftige Secret-Änderungen an dieser
Funktion: immer zusätzlich neu deployen, nicht nur das Secret speichern.**

Diagnostiziert am Ende sauber isoliert über den **"Test"-Button** direkt
auf der Funktionsseite (oben rechts, neben Docs/Download) — damit lässt
sich die Funktion mit frei wählbaren Headern aufrufen, unabhängig vom
nächsten Cron-Tick. Sehr nützlich fürs schnelle Verifizieren, ohne jedes
Mal eine Minute zu warten.

### Fehler 2: `profiles.erinnerungen` — die Spalte existierte in der echten Datenbank gar nicht

Nach dem Secret-Fix kam über den Test-Button ein neuer 500er:
`{ code: "42703", message: "column profiles.erinnerungen does not exist" }`.
Per `select column_name from information_schema.columns where
table_name = 'profiles'` verifiziert: **Migration `0025_erinnerungen.sql`
wurde nie ausgeführt**, obwohl spätere UND frühere Migrationen auf
`profiles` (`category_ziele` aus 0018, `steckbrief` aus 0045, ...)
nachweislich liefen — vermutlich einfach beim manuellen Durchklicken der
~69 Migrationen eine einzelne übersprungen. Behoben durch Nachholen von
Migration 0025 (`alter table public.profiles add column if not exists
erinnerungen jsonb not null default '{}'::jsonb;`).

**Das ist der eigentlich alarmierende Teil:** Diese fehlende Spalte hat
**seit Migration 0025 (vor Wochen) niemals einen sichtbaren Fehler
erzeugt**, weil:
- Das Laden der Erinnerungen über `.select("*")` läuft
  (`useProfileData.js`) — eine fehlende Spalte erscheint da einfach als
  `undefined`, kein Fehler.
- Das Speichern (`setErinnerung()`, gleiche Datei) wirft zwar einen
  PostgREST-Fehler zurück, der wird aber nur mit
  `.then(({ error }) => error && console.error(error))` in die
  Browser-Konsole geloggt — **nirgends der Nutzerin angezeigt**, und der
  lokale React-State wird trotzdem optimistisch aktualisiert, sodass die
  UI (Pill auf "Ja", Vorlauf-Auswahl sichtbar) völlig normal aussah.

**Praktische Konsequenz:** Jede Erinnerungs-Einstellung, die je in der App
vorgenommen wurde (nicht nur heute Abend), ist wahrscheinlich **nie in der
Datenbank angekommen**. Die Nutzerin wurde gebeten, nach dem Fix alle
gewünschten Erinnerungen (Gewohnheiten, Training, Hydration, Vorab-Zeiten,
Morgenroutine/Abendroutine, Workflow, ...) noch einmal neu einzustellen —
das war ausdrücklich noch NICHT erledigt, als die Sitzung endete (sie
wollte das am nächsten Tag nachholen). **Ein künftiger Agent sollte beim
nächsten Sitzungsstart als Erstes nachfragen, ob sie das schon gemacht
hat, und falls nicht, aktiv daran erinnern**, sonst bleibt der ganze
heutige Push-Fix wirkungslos.

**Empfehlung für einen künftigen Agenten (nicht mehr umgesetzt, da die
Sitzung zu Ende ging):** Das stille Verschlucken von Speicherfehlern in
`useProfileData.js` (`setErinnerung` und vermutlich weitere `set*`-
Funktionen nach demselben "optimistic update + `.then(error =>
console.error)`"-Muster) ist ein struktureller Schwachpunkt — er hat genau
diesen Bug wochenlang unsichtbar gehalten. Es lohnt sich, mindestens für
`setErinnerung()` (und stichprobenartig ähnliche Stellen) einen sichtbaren
Fehlerhinweis zu ergänzen, statt nur in der Konsole zu loggen, damit ein
fehlgeschlagener Speichervorgang künftig auffällt, statt erst durch
zufälliges Live-Testen entdeckt zu werden.

**Status bei Sitzungsende:** Beide Fixes bestätigt (Test-Button liefert
`{"ok":true, ...}` statt Fehler). Automatischer Versand sollte ab jetzt
technisch funktionieren, **sobald die Nutzerin ihre Erinnerungen neu
eingestellt hat** (s. o.) — ein Live-Test mit echter Push-Zustellung zu
einer geplanten Uhrzeit stand bei Sitzungsende noch aus.

## ⚠️ Update 15.08.2026, nachts (Teil 4) — Aufwachzeit-Spotify, Sekunden-Ticken, konfigurierbarer Vorab-Hinweis

Direkt im Anschluss an Teil 3, noch vor 16.08. Committet: `d938e7f` (Spotify
zur Aufwachzeit) + ein weiterer Commit für die beiden Punkte unten (main +
Feature-Branch synchron).

1. **Automatischer Spotify-Start zur Aufwachzeit** (`send-due-reminders/
   index.ts`) — analog zum bestehenden Bettzeit-Block, Quelle ist
   `category_ziele.schlaf.bloecke[].aufwachzeit`, Auslöser die Playlist-
   Zuordnung über `SpotifyAnlassPicker(anlass="morgenroutine")`. Braucht ein
   aktives Spotify-Gerät (kann kein schlafendes Gerät wecken) — Kurzbefehl
   kurz vor der Aufwachzeit empfohlen. Details siehe Commit-Message.
2. **Sound-Frage der Nutzerin geklärt** (keine Code-Änderung nötig, reine
   Plattform-Grenze): Web-Push-Benachrichtigungen (`public/sw.js`,
   `showNotification()`) können auf keiner Plattform einen eigenen
   Sound/eine eigene Datei bekommen — die Notifications-API kennt kein
   `sound`-Feld, nur `silent`. Es spielt immer der System-Standardton. Das
   ist der Grund, warum es dafür keine Einstellung in der App gibt/geben
   kann — kein fehlendes Feature, sondern Browser-/OS-Limitierung.
3. **Sekunden-Ticken beim isometrischen Training** (`utils/beep.js`:
   `playTick()`, `ui/Timer.jsx`: neue Prop `tickJedeSekunde`, verdrahtet in
   `TrainingView.jsx` bei `session.art === "Isometrisches Training"`) — ein
   leiser Klick bei jeder vollen Sekunde während Halten UND Pause, zusätzlich
   zum bestehenden Start-/Ende-Piep pro Phase (der war schon da, nur ohne
   Sekunden dazwischen).
4. **Vorab-Hinweis ("Gleich dran") konfigurierbar statt fest 15 Min.**
   (Nutzerinnen-Vorgabe: "vor einem Training/einer Gewohnheit... muss ich
   einstellen können, wie viele Minuten vorher") — neue Komponente
   `ui/VorlaufFeld.jsx`, eingebunden in `MehrTab.jsx` unter jeder Kategorie
   in der "Erinnerungen"-Übersicht. Wert landet in
   `profiles.erinnerungen[kategorie].vorlaufMinuten` (bestehende jsonb-
   Spalte, **keine neue Migration nötig**). `send-due-reminders/index.ts`
   liest den Wert über `vorlaufFuer()` mit Fallback auf die alte feste
   Konstante `VORLAUF_MINUTEN = 15`.
   - "1 Tag"/"2 Tage vorher" gibt's nur bei **Training** und **Ernährung**
     (echter Wochenplan mit Wochentag) — dafür neue Funktion
     `verschobeneUhrzeitMitTag()`, die den Tages-Versatz zurückgibt, damit
     der Vorab-Check bei Vorläufen über Mitternacht hinweg den WOCHENTAG
     VON MORGEN prüft statt versehentlich heute nochmal.
   - Bei den übrigen Kategorien (Gewohnheiten, Peptide/Medikamente/
     Supplemente, Hydration/Tageslicht/Schlaf-Zeitenliste) bewusst nur
     Minuten/Stunden wählbar — die wiederholen sich täglich, ein "1 Tag
     vorher" wäre dort gleichbedeutend mit "jeden Tag zur selben Zeit" und
     würde nur eine doppelte Benachrichtigung zum selben Zeitpunkt erzeugen.
   - Wake-Time (Aufwachzeit, Punkt 1 oben) ist bewusst **nicht** Teil davon —
     lief noch nie über das `erinnerungen`-System, sondern über die
     Schlaf-Blöcke, und ein Vorlauf vorm Aufwachen ergibt naturgemäß keinen
     Sinn (Nutzerinnen-Vorgabe: "nur beim Aufwachen ist das nicht
     realistisch").

**Offen für den nächsten Agenten:** Kalenderverbindung (Nutzerin erwähnte
das nur als vage Alternative, "keine Ahnung") — nicht umgesetzt, kein
konkreter Auftrag. Falls gewünscht: eigenes Thema, vermutlich .ics-Export
oder eine echte Google/Apple-Calendar-Anbindung, deutlich größerer Umbau.

### 🔴 Nachtrag, noch später: Push-Benachrichtigungen liefen nie — VAPID-Key fehlte

Beim Testen von `send-push` (manueller Test-Button) kam durchgehend
"Failed to send a request to the Edge Function". Ursache im Log (Supabase →
Edge Functions → send-push → Errors): `Error: No key set
vapidDetails.publicKey` — die Funktion stürzt schon beim Modul-Start ab
(`webpush.setVapidDetails(...)` in Zeile 12), noch bevor sie überhaupt
antworten kann. Grund: **`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` waren als
Supabase-Secret nie gesetzt** — Custom-Secrets-Liste enthielt nur
CRON_SECRET/GEMINI_API_KEY/SPOTIFY_*/GOOGLE_TTS_API_KEY. Betrifft
`send-due-reminders` identisch (derselbe Aufruf ganz oben in der Datei) —
Web-Push ist also seit Projektbeginn nie tatsächlich verschickt worden,
nur alles DRUMHERUM (Subscriptions speichern, UI) hat funktioniert.

**Behoben:** neues VAPID-Schlüsselpaar erzeugt (`npx web-push
generate-vapid-keys`), Public Key in `src/lib/pushConfig.js` eingetragen
und committet. **Die Nutzerin muss den Private Key noch selbst als Secret
`VAPID_PRIVATE_KEY` (und den Public Key als `VAPID_PUBLIC_KEY`) unter
Supabase → Edge Functions → Secrets eintragen** — der Private Key wurde ihr
im Chat mitgeteilt, steht bewusst nirgends im Repo. Nach dem Secret-Eintrag
sollte sie testweise "Erinnerungen deaktivieren" → erneut aktivieren
(neue Subscription mit dem neuen Public Key, alte wäre mit dem alten Key
ohnehin nutzlos) und dann "Test-Erinnerung senden" probieren.

**✅ Bestätigt funktionierend** (Screenshot: echte Push-Benachrichtigung
kam an) — nachdem beide Secrets korrekt gesetzt waren (drei Fehlversuche
beim manuellen Abtippen der Base64-Werte auf dem iPad, siehe Chat: "No key
set" → "must be URL safe Base 64" → "should be 65 bytes" → hat sich beim
Abtippen jedes Mal minimal verändert; gelöst mit einer kleinen Artifact-
Seite mit Kopieren-Knopf statt manuellem Markieren/Abtippen).

**Ton-Frage der Nutzerin geklärt (zweites Mal, jetzt endgültig):** eigene
Sounds pro Erinnerung sind mit Web-Push technisch nicht möglich, auf
keiner Plattform (keine `sound`-Option in der Notification-API). Einzige
Differenzierung: das Emoji im Text (🏋️ Training, 💧 Hydration, 🌱
Gewohnheit, ⏳ Vorab-Hinweis, ❗ Nachfass, ...). Nur mit einer nativen App
(Xcode/App Store) wäre das möglich — bewusst nicht der eingeschlagene Weg.

### Nachtrag: Morgenroutine, Abendroutine, Workout-Flow bekommen jetzt auch Erinnerungen

Nutzerin-Vorgabe direkt im Anschluss: die drei fehlten noch komplett im
Erinnerungssystem. Neu in `send-due-reminders/index.ts`:
- **Morgenroutine/Abendroutine** (🌅/🌆): Quelle ist
  `routine_einstellungen.start_zeit` (der Zeitrahmen-Start, den man beim
  Einrichten der Routine unter "Routinen" pflegt) — täglich, kein
  Wochentag-Feld vorhanden, deshalb wie Gewohnheiten ohne Tages-Versatz.
- **Workout-Flow** (🔁): Quelle ist `workflow_plaene` (echter Wochenplan mit
  `wochentage[]` + `uhrzeit`, plus optionalem Gültigkeits-Zeitraum
  `gueltig_von`/`gueltig_bis` und eigenem `aktiv`-Schalter pro Plan) —
  strukturell wie Training/Ernährung behandelt, inkl. Tages-Versatz bei
  mehrtägigem Vorlauf (`verschobeneUhrzeitMitTag`).

Alle drei nur Erinnerung + Vorab-Hinweis, **kein Nachfass-Fenster** — es
gibt keine Log-Tabelle, die einen Durchlauf eindeutig einer bestimmten
geplanten Uhrzeit zuordnet (anders als bei Training/Ernährung/Dosierung).

UI: bewusst NICHT in `categorySteps.js` (das sind die 8 Onboarding-
Kategorien mit eigenen Einrichtungs-Screens) — stattdessen eigene, kleine
Liste `WEITERE_ERINNERUNGEN` direkt in `MehrTab.jsx`, hängt an dieselbe
"Erinnerungen"-Karte dran und nutzt dieselbe Vorlauf-Logik/UI
(`VorlaufFeld.jsx`) wie die bestehenden Kategorien.

**Noch nicht deployt** — auch hier muss die Nutzerin `send-due-reminders`
nochmal im Supabase-Dashboard aktualisieren (siehe oben, Code-Tab, Deploy).

## ⚠️ Update 15.08.2026, spätabends (Teil 3) — Baustein-Versionierung + tote View entfernt

Letzte Runde dieser Sitzung, Nutzerin hat ab 16.08. keinen Zugang mehr.
Committet als `f6f2677`, `7ea39c7`, `e0f191c` (main + Feature-Branch synchron):

1. **`PeptidView.jsx` gelöscht** — Karteileiche seit der Peptid/Medikamente-
   Zusammenlegung (0042), von nirgends mehr importiert. Peptide laufen
   ausschließlich über `MedikamenteView.jsx`.
2. **Versionierung der Protokoll-Bausteine** (der Punkt, der in Teil 2 noch
   bewusst verschoben wurde): neue Tabelle `baustein_versionen` (Migration
   0069, **inklusive Admin-RLS-Policy** nach dem Muster von
   `0035_admin_dashboard.sql` — ohne die würde "Version festhalten" im
   "Verwalten als"-Modus an der Datenbank scheitern, weil `auth.uid()` dabei
   weiterhin die Admin-ID ist). Hook: `useBausteinVersionen.js`
   (`versionFesthalten`, `versionLoeschen`).
   - In `MehrTab.jsx` (`AktuellesProtokoll`) hat jeder Baustein jetzt einen
     📌-Button: hält die aktuell geltenden Werte als JSON-Snapshot fest
     (`snapshotFuer()` mappt Kategorie → Felder aus den jeweiligen
     Kategorie-Hooks — bei neuen Kategorien in `BAUSTEINE_KATEGORIEN` diese
     Funktion mit erweitern), mit optionaler Notiz per `window.prompt`.
   - Sichtbar unter Archiv → Protokolle, neue Sektion
     "🗂️ Baustein-Versionen" (`ProtokollLogView.jsx`), aufklappbar je
     Eintrag, mit generischem Snapshot-Renderer (`VersionSnapshot`) statt
     eigener Formatierung pro Kategorie, sowie löschbar.
   - **Bewusste Vereinfachung**, der Nutzerin so erklärt und von ihr
     akzeptiert: manuelle Snapshots per Knopfdruck, kein automatisches
     Diffing/Versionieren bei jeder einzelnen Änderung in den
     Kategorie-Views selbst (SchlafView, TrainingView, ...) — das hätte eine
     einheitliche Versionierung über alle unterschiedlichen Datenmodelle
     hinweg gebraucht, ein größerer Umbau als in dieser Sitzung machbar.
     Falls die Nutzerin künftig "automatisch bei jeder Änderung eine Version
     anlegen" möchte, wäre der nächste Schritt, `snapshotFuer()` + einen
     Aufruf von `versionFesthalten` in die jeweiligen Kategorie-Views
     einzubauen (z. B. vor jedem `setDose`/`wochenplanHinzufuegen`/...).

**Migration 0069 muss die Nutzerin noch im Supabase-SQL-Editor ausführen**
(Wortlaut siehe Datei `supabase/migrations/0069_baustein_versionen.sql`),
sonst schlägt "Version festhalten" mit einem Datenbankfehler fehl (Tabelle
existiert dann nicht).

**Backcheck am Ende dieser Sitzung:** `npm run build` + kompletter
`npx oxlint` liefen sauber, keine neuen Warnungen/Fehler.

---

## ⚠️ Update 15.08.2026, abends (Teil 2) — Feedback-Runde nach dem ersten Update

Direkt im Anschluss an das Update weiter unten kam noch eine Feedback-Runde
der Nutzerin zur UI-Platzierung der neuen "Bausteine"-Funktion, plus der
Wunsch nach einem Backcheck vor Sitzungsende (sie hat morgen, 16.08., keinen
Zugang mehr zu Claude). Zusätzlich committet als `4b41925` und `f6f2677`
(beide bereits fast-forward-gemerged nach `main`):

1. **"Aktuelles Protokoll" (Bausteine an-/abschalten) von Archiv → Protokolle
   nach Mehr verschoben.** Begründung der Nutzerin: Archiv soll ausschließlich
   abgeschlossene/archivierte Protokolle zeigen (nur ansehen + löschen,
   nichts editierbar), das laufende Protokoll gehört dort nicht hin — jetzt
   direkt sichtbar (nicht eingeklappt) unter Mehr, oberhalb von "Sprache"
   (`MehrTab.jsx`, Komponente `AktuellesProtokoll`).
2. **"Zu deinem Peptid-Protokoll"-Button entfernt** (`PlanView.jsx`, war am
   Ende jeder Archiv-Unterseite sichtbar, führte zu `setView("medikamente")`
   — veraltete Terminologie, Nutzerin empfand es als Sackgasse/Schleife).
   `onEditProtocol`-Prop dafür auch aus `AuthenticatedApp.jsx` entfernt.
3. **`PeptidView.jsx` komplett gelöscht** — seit der Peptid/Medikamente-
   Zusammenlegung (Migration 0042) von nirgends mehr importiert, reine
   Karteileiche. Peptide werden ausschließlich noch über
   `MedikamenteView.jsx` verwaltet.
4. **Alte Test-Einträge sind jetzt löschbar:**
   `gewichtEntfernen(datum)` in `useCheckinData.js` (Check-in-Verlauf,
   ArchivTab) und `aenderungEntfernen(id)` in `useAenderungsprotokoll.js`
   (Tagesverlauf, ProtokollLogView) — vorher gab es dafür keine Möglichkeit,
   die Nutzerin hatte sich über liegengebliebenes Test-Rauschen aus früheren
   Sitzungen beschwert.

**Bewusst NICHT umgesetzt** (Nutzerin einverstanden, für eine künftige,
ausgeruhte Sitzung vorgesehen): eine echte **Versionierung** pro Baustein
— alte Konfiguration bleibt archiviert erhalten, eine neue wird beim
Bearbeiten aktiv, sichtbar im Archiv als Verlauf. Das bräuchte für jeden
Baustein-Typ (Schlaf, Training, Ernährung, …) eine eigene Historie der
tatsächlichen Einstellungen — die haben aktuell alle unterschiedliche
Datenstrukturen, kein einheitliches Modell. Eigenes, größeres
Architektur-Thema, absichtlich verschoben statt spät abends reingequetscht.

**Backcheck vor Sitzungsende (15.08., ca. 22 Uhr) durchgeführt:**
`npm run build` und `npx oxlint` (komplettes Projekt, nicht nur geänderte
Dateien) liefen sauber durch — keine neuen Warnungen/Fehler durch die
heutigen Änderungen, nur bereits vorher bestehende harmlose
`react-refresh`/`no-unused-vars`-Warnungen in unberührten Dateien. Alle
View-IDs zwischen `AuthenticatedApp.jsx` (`ARCHIV_VIEW_IDS`) und
`PlanView.jsx` (`TABS`) wurden gegengeprüft, stimmen überein. Kein
verbliebener Verweis auf "Peptid-Protokoll" im UI-Text (nur noch in
Code-Kommentaren und `i18n/dict/peptid.js`, dort harmlos ungenutzt).

**Ausstehende SQL-Migrationen zum Zeitpunkt dieses Updates:** Die Nutzerin
hat 0066 (`coach_wissen`-Einträge ADHS-Paradoxon), 0067
(`teilprotokolle`-Kategorie-Check inkl. "tageslicht") und 0068
(`teilprotokolle.aktiviert_am`) im Verlauf dieser Sitzung im Supabase-
SQL-Editor bestätigt ausgeführt zu haben. Für die Änderungen aus diesem
Teil-2-Update war keine weitere Migration nötig (nur bestehende
Spalten/Tabellen verwendet).

---

## ⚠️ Update 15.08.2026 — Hinweis zur Dokumentationslücke + heutige Änderungen

**Dieses Dokument war bei Sitzungsbeginn nur bis Migration 0049 aktuell,
tatsächlich lag der Code-Stand aber schon bei Migration 0065** (u. a.
mehrere `coach_wissen_content_library`-Migrationen, Projekte/Zeitblöcke,
Trainingsplan-Ordner, Coach-Übersicht — zwischen 14.08. und 15.08. muss also
mindestens eine weitere, hier nicht dokumentierte Sitzung stattgefunden
haben). Der Rest dieses Dokuments unterhalb dieses Updates spiegelt nur den
Stand vom 14.08. wider und ist an mehreren Stellen veraltet (z. B. Abschnitt
9, Migrationstabelle). Ein künftiger Agent sollte bei Gelegenheit den echten
Verlauf zwischen 0050 und 0065 aus der Git-Historie rekonstruieren und
dieses Dokument komplett neu schreiben, statt auf dem 14.08.-Stand
aufzusetzen.

**Was diese Sitzung (15.08.) hinzugefügt hat**, direkt auf Migration 0065
aufsetzend, committet als `9801536` auf `main` und
`claude/google-cloud-tts-api-key-yc49xp` (identisch, wie gewohnt
fast-forward-gemerged):

1. **Wissens-Basis erweitert** (Migration 0066,
   `0066_coach_wissen_adhs_paradoxon.sql`, von der Nutzerin noch im
   Supabase-Dashboard auszuführen): drei neue `coach_wissen`-Einträge
   (bereich = null, wie die "Sonderthemen" aus 0050) aus dem von der
   Nutzerin bereitgestellten Curriculum "Das ADHS-Paradoxon" — (a)
   Schutzfaktoren & Person-Environment-Fit, (b) biografische Beispiele
   (Biles, Phelps, Branson, Neeleman), (c) das zugehörige Coaching-Framework
   für Lebensrahmenbedingungen (thematische Reihenfolge, Dreischritt
   Ist-/Ziel-Zustand/erster Schritt).
2. **Formular 11 "Der Passungs-Check"** in `formulareVorlagen.js` ergänzt —
   der Lebensrahmenbedingungen-Fragebogen aus demselben Curriculum (10
   Lebensbereiche + Auswertung), technisch identisch zu den bestehenden 10
   Formularen (schema-getrieben über `AdminFormulareView.jsx`, keine
   Code-Änderung dort nötig, keine DB-Persistenz, PDF-Export). Die Nutzerin
   wollte ihn selbst als erste "Coachee" durcharbeiten.
3. **Protokolle/Hauptprotokolle endgültig löschbar** (`ArchivTab.jsx`,
   `protokollLoeschen` in `useProtocolData.js`,
   `hauptprotokollLoeschen` in `useHauptprotokollData.js`): Sicherheitsabfrage
   nennt jeweils den Namen bzw. die Peptidliste des Protokolls, löscht nur
   archivierte (nie das aktive) Protokoll/Hauptprotokoll. War vorher gar
   nicht möglich, die Nutzerin hatte sich über liegengebliebene
   Test-Protokolle beschwert.

**Wichtige Falle in dieser Sitzung, für künftige Agenten relevant:** Diese
App hat vor dem Vercel/Supabase-Umbenennungsschritt (siehe Abschnitt 2) noch
ältere, ungepflegte Branches im selben Repo (`claude/claude-md-docs-pxv4bm`,
`claude/app-uebergabeprotokoll-*`), die noch den alten Projektnamen
"MyProtocols" tragen und NICHT mit der Live-App unter `akaapp.vercel.app`
übereinstimmen — trotz identischem GitHub-"About"-Link. Eine vorherige
Instanz dieser Sitzung hatte versehentlich auf so einem veralteten Branch
gearbeitet, bevor der Fehler anhand eines App-Screenshots der Nutzerin
auffiel. **Vor jeder Änderung sicherstellen, dass tatsächlich auf `main`
bzw. dem in diesem Dokument genannten Feature-Branch gearbeitet wird**, im
Zweifel `git log -1` / Screenshot der Nutzerin gegenchecken statt sich auf
den GitHub-Default-Branch oder das Repo-"About"-Feld zu verlassen.

---

**Stand: 14.08.2026, vormittags — Branch `claude/google-cloud-tts-api-key-yc49xp`**

Ursprünglich am 13.08. komplett neu geschrieben (statt weiterer
Nachtrag-Absätze), am 14.08. weitergepflegt statt erneut komplett neu
verfasst — die Sitzung vom 13.08. wurde in einem neuen Chat fortgesetzt.
Ziel dieses Dokuments bleibt: ein neuer Agent soll die App vollständig
verstehen und genau dort weitermachen können, wo diese Sitzung endete, ohne
dass die Nutzerin irgendetwas noch einmal erklären muss. Die alte, sehr viel
detailliertere Tag-für-Tag-Historie (bis 31.07.) bleibt über die Git-Historie
dieser Datei einsehbar, falls einzelne frühere Entscheidungen im Detail
nachvollzogen werden müssen.

**Kurzstand 14.08. für den ganz schnellen Einstieg:** Die Nutzerin wollte
das Spotify-Verbindungsproblem heute bewusst pausieren (siehe offener Punkt
1) und stattdessen an Übungsbildern für den Trainings-Katalog arbeiten
(Abschnitt 5) — das ist ebenfalls kurzfristig pausiert, weil ihre
Canva-Premium-Nutzung gerade nicht funktioniert. Migration 0049 lässt sie
sich parallel gerade im Supabase-Dashboard ausführen. Bei Sitzungsbeginn
freundlich nachfragen, woran sie heute arbeiten möchte, statt automatisch
eines der beiden pausierten Themen wieder aufzugreifen.

---

## 1. Was ist AKA?

**AKA** (Claim: "Deine exekutive rechte Hand") ist eine React+Supabase-Web-App
zur Selbstverwaltung von Gesundheitsprotokollen, mit starkem Fokus auf
ADHS-Freundlichkeit (reduzierte Reizüberflutung, Notfallmodus, große
Bedienelemente, klare Sprache, kleine Schritte statt Überforderung). Läuft
heute als **PWA** ("Zum Home-Bildschirm hinzufügen") — keine native App im
App Store, siehe Abschnitt 12 für den Plan dorthin.

> ⭐ **Leitprinzip, nicht verhandelbar:** Jede Funktion muss sowohl manuell
> als auch per KI-Assistent ("Aka") nutzbar sein. Niemals ein manuelles
> Formular entfernen oder verstecken, nur weil es jetzt auch einen KI-Weg
> gibt. Der Assistenten-Orb öffnet sich nur auf Tap, nie von selbst.

**Die Nutzerin ist nicht technisch versiert** und kommuniziert überwiegend per
Spracheingabe (oft mit Tippfehlern/abgehackten Sätzen von Diktierfunktionen)
und per Screenshot vom iPad — Transkriptionsfehler sind normal und meist an
einer kleinen Verwechslung zu erkennen, nicht an grundsätzlichem
Unverständnis (Beispiele aus mehreren Sitzungen: "Acker"/"Ecker" = Aka,
"smartifer" = Spotify). Bei unklaren/abgeschnittenen Nachrichten lieber kurz
nachfragen als eine größere Änderung auf eine Vermutung zu bauen. Sie hat auf
dem iPad öfter Schwierigkeiten mit Kopieren/Einfügen (aus Dateien UND beim
manuellen Abtippen langer Werte wie API-Keys) — bei kurzen, exakten Werten
(Base64-Schlüssel o. Ä.) hilft eine kleine Artifact-Seite mit
"Kopieren"-Knopf zuverlässiger als "markieren und kopieren" oder Abtippen.

### Geschäftsmodell-Pivot (seit 13.08., zentral für alles Weitere)

Die App wird **nicht mehr primär von jeder Person komplett selbst
eingerichtet**. Die Nutzerin selbst tritt als **Coach/Admin** auf und richtet
die meisten Bereiche für ihre **Coachees** (Klient:innen) über den
bestehenden "Verwalten als"-Modus stellvertretend ein. Coachees durchlaufen
nur noch ein reduziertes Onboarding (Profil + Ziel + kurzer Steckbrief) und
nutzen die App zur reinen Ausführung (Routinen, Logging) — kein KI-Assistent,
kein "+"-Button, stattdessen eine Nachrichtenfunktion an die Coachin. Details
in Abschnitt 6.

Parallel dazu baut die Nutzerin ihre eigene Coaching-Praxis auf
(12-Wochen-Selbsttrainingsprogramm "AKA ADHS-Coaching-Praxisakademie", erste
Pilotgespräche mit realen Menschen geplant) und füttert währenddessen **Aka**
(den KI-Assistenten) parallel mit dem coaching-relevanten Wissen, das sie
sich selbst erarbeitet — mit dem ausdrücklichen Ziel, dass Aka langfristig
selbstständig Coachings mitbetreuen kann. **Der Coachee darf nie erfahren,
dass die Coachin im Hintergrund mit Aka arbeitet.**

---

## 2. Tech-Stack

- **Frontend:** React 19 + Vite 8, reines JavaScript (kein TypeScript).
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security, Edge
  Functions in Deno/TypeScript).
- **Hosting:** Vercel. **Aktuelle, bestätigte Live-Adresse:
  `https://akaapp.vercel.app`** (eine ältere Notiz nannte noch
  `myprotocolsapp.vercel.app` — Stand vor der Umbenennung zu "AKA"; im
  Zweifel bei der Nutzerin nachfragen). Automatischer Rebuild bei jedem Push
  auf `main`.
- **KI (Chat-Assistent "Aka"):** Google Gemini (`gemini-3.6-flash`, Vorsicht:
  Gemini-Modellnamen veralten schnell), angebunden über Supabase-Edge-
  Function-Proxy (`gemini-chat`). Ollama/Groq sind im Code vorbereitet
  (`groq-chat`-Function existiert), aber nicht als aktiver Standard-Provider
  geschaltet.
- **KI (weitere, unabhängig vom Chat-Assistenten):** Anthropic Claude, direkt
  über zwei eigene Edge Functions — `lexikon` (Lexikon-Fragen beantworten)
  und `blutwerte-scan` (Laborwerte per Foto auslesen, Bild kommt nie roh vom
  Client, sondern als Storage-Pfad im privaten `photos`-Bucket).
- **Sprachausgabe:** Google Cloud Text-to-Speech (WaveNet, Stimme
  `de-DE-Wavenet-B`), mit automatischem Rückfall auf die Browser-eigene Web
  Speech API, falls die Cloud-Funktion mal nicht erreichbar ist.
- **Musik:** Spotify Web API (OAuth + Wiedergabe-Steuerung, Abschnitt 8).
- **Web Push:** VAPID-Protokoll über die `web-push`-npm-Bibliothek
  (Deno-Edge-Function-seitig) + die Browser-eigene Notifications-/Push-API
  (client-seitig, `public/sw.js`). Funktioniert erst seit heute Abend
  tatsächlich (Abschnitt 7) — vorher fehlte das Server-Secret komplett.
- **Supabase-Projekt-Ref:** `xdajxswaclukstteafnk`.

---

## 3. Architektur

```
src/
├── views/                        Haupt-Seiten
│   ├── HomeView.jsx               Startseite, Mini-Widgets, ADHS-Modus
│   ├── TageslichtView.jsx, HydrationView.jsx, NutritionView.jsx,
│   │   TrainingView.jsx, GewohnheitenView.jsx, SupplementeView.jsx,
│   │   MedikamenteView.jsx, SchlafView.jsx    8 Protokoll-Bereiche
│   ├── RoutineTabView.jsx         Morgen-/Abendroutine (eigene Reiter)
│   ├── LexikonView.jsx            Freies Nachschlagen über Claude
│   ├── admin/                     AdminDashboardView, AdminWissenView,
│   │                               AdminFormulareView, AdminUebungsBilderView,
│   │                               AdminCoachUebersichtView
│   ├── onboarding/                Onboarding-Flow (siehe Abschnitt 6)
│   └── plan/                      PlaeneView (Tab-Hub), MehrTab (Coach-Name,
│                                   Sprache, Erinnerungen, Spotify, Konto,
│                                   Bausteine/Protokoll-Verwaltung)
├── ui/
│   ├── primitives.jsx             Shell, Card, PrimaryButton, Pill, CheckRow
│   ├── BereichColorContext.jsx    Bereichseigene Akzentfarbe je Screen
│   ├── KiChat.jsx                 Wiederverwendbare Chat-Oberfläche
│   ├── SpotifyAnlassPicker.jsx    Playlist-Zuordnung je Anlass
│   ├── RoutineAblauf.jsx          Geführter Morgen-/Abendroutine-Screen
│   ├── Timer.jsx                  Stoppuhr/Countdown/Intervall (Training,
│   │                               isometrisches Halten mit Sekunden-Ticken)
│   ├── WorkflowTimer.jsx          Pomodoro-artiger Arbeits-/Pause-Timer
│   ├── VorlaufFeld.jsx            Vorab-Hinweis-Auswahl je Erinnerungs-
│   │                               Kategorie (Minuten/Stunden/Tage)
│   └── WochenplanEditor.jsx       Training/Ernährung-Wochenplan
├── services/
│   ├── aiProviders.js             Low-Level Ollama/Groq/Gemini
│   └── aiService.js               Domänenfunktionen, Formular-Extraktoren
├── data/                          Ein use*.js-Hook pro Datenbereich (u. a.
│                                   useRoutinen.js, useWorkflowData.js,
│                                   useBausteinVersionen.js,
│                                   usePushNotifications.js)
├── context/
│   ├── AppDataContext.jsx         Zentrale Datenverwaltung, kombiniert alle Hooks
│   ├── AdminContext.jsx           "Verwalten als"-Zustand (proband)
│   └── AuthContext.jsx            Supabase-Session
└── lib/
    └── pushConfig.js               VAPID Public Key fürs Web-Push-Abo
public/
└── sw.js                          Service Worker — zeigt eingehende Pushes an
supabase/
├── migrations/                    0001–0069, siehe Abschnitt 9
└── functions/
    ├── gemini-chat/                Sicherer Gemini-Proxy — AKTIV
    ├── groq-chat/                  Groq-Proxy, vorbereitet, nicht aktiv geschaltet
    ├── text-to-speech/             Google Cloud TTS-Proxy — AKTIV
    ├── lexikon/                    Claude-gestütztes Lexikon — AKTIV
    ├── blutwerte-scan/             Laborwerte aus Foto per Claude Vision — AKTIV
    ├── spotify-auth-callback/      OAuth-Code-Austausch
    ├── spotify-play/               Wiedergabe starten (Login ODER Auto-Play-Token)
    ├── send-push/                  Manueller Push-Test-Button (Nutzer-JWT) — AKTIV
    ├── send-due-reminders/         Cron-Job für alle Push-Erinnerungen — AKTIV
    └── admin-create-proband/       Neues Coachee-Konto anlegen
```

### Design-System

Plain CSS + Tokens aus `src/ui/theme.js`:
`accent = "#6366F1"` (Indigo, Marken-Akzent), `success = "#0E7C66"`,
`danger = "#C24545"`, `textMain = "#15181A"`, `textMuted = "#6B7178"`,
`bg = card = "#FFFFFF"`. Hilfsfunktionen `aufhellen()`/`hexZuRgba()` erzeugen
Verlaufs-/Glow-Farbtöne für `PrimaryButton` (135°-Zweifarben-Verlauf +
farbiger Schatten + Press-Animation) zur Laufzeit aus jeder Bereichsfarbe.

**Bereichsfarben** (`KATEGORIE_META` in `src/utils/dayItems.js` —
`{bg, text, dot}` je Kategorie, gesteuert über `BereichColorContext.jsx` via
`<Shell bereich="training">`):

| Bereich | dot-Farbe |
|---|---|
| Medikamente (`hormon`, inkl. Peptide) | `#8B5CB0` (Lila) |
| Supplemente | `#B8863D` (Gold) |
| Ernährung (`mahlzeit`) | `#C17A54` (Terrakotta) |
| Training | `#CC5145` (Rot) |
| Gewohnheiten (`gewohnheit`) | `#3E8E8A` (Teal) |
| Hydration | `#4A93B8` (Blau) |
| Tageslicht | `#D9A62E` (Gelb) |
| Schlaf | `#5B5FA6` (Indigo) |
| Notfallmodus | `#C24545` (Rot) |
| Morgenroutine (eigene, nicht in `KATEGORIE_META`) | `#E08A3E` |
| Abendroutine (eigene, nicht in `KATEGORIE_META`) | `#4E6690` |

Logo: `public/logo-mark.png` (Gehirn-Symbol), App-Icons unter `public/icons/`.

---

## 4. KI-Assistent "Aka"

Persona: **Sidekick, ausdrücklich kein "Coach"** (das Wort ist komplett aus
der sichtbaren App entfernt). Standardname `"Aka"`, individuell umbenennbar
(`coachStorage.js`). Zwei Ebenen: im Hintergrund unaufdringlich wie ein guter
Butler, im Gespräch präsent und motivierend, nie bevormundend, erzeugt kein
schlechtes Gewissen.

**"Background Brain"** — bei jeder Chat-Anfrage automatisch mitgeschickt:
- `src/wissen/**/*.md` — statische Wissensbasis (braucht Deploy für Änderungen)
- `coach_wissen`-Tabelle (DB-gestützt, live editierbar unter Admin → "📚
  Wissens-Basis verwalten", kein Deploy nötig) — mittlerweile mit weit über
  16 Einträgen aus der Coaching-Praxisakademie der Nutzerin bestückt, u. a.
  auch das ADHS-Paradoxon-Curriculum (siehe Abschnitt 6)
- `admin_notizen` (Hintergrundwissen ODER zugestellte Nachricht je Proband)
- Aggregierte Trackingdaten der letzten 2-4 Wochen
- Erkannte Auffälligkeiten (Trainingslücken, Korrelationen zwischen Bereichen)
- Namen aller gespeicherten Spotify-Playlists (Aka kann sie per
  `[[SPOTIFY_PLAY:<Name>]]`-Marker im Gespräch selbst starten)

**Sicherheitsmodell:** Der Assistent kann niemals eigenständig etwas
speichern — immer erst chatten, dann tippt die Person explizit auf
"Übernehmen", erst dann läuft die ganz normale App-Funktion.

**Coach-geführtes Onboarding:** zwei Modi (Frage-für-Frage /
Frei-erzählen), plus Coach-Begleitung bei Laborwerten und allen
Kategorie-Schritten — nur im Admin-/Verwalten-als-Modus (siehe Abschnitt 6).

**Separates Lexikon** (`LexikonView.jsx`, eigene Edge Function `lexikon`,
Claude statt Gemini): freies Nachschlagen von Begriffen unabhängig vom
eigentlichen Coaching-Gespräch, kein Zugriff auf persönliche Trackingdaten.

---

## 5. Die 8 Protokoll-Bereiche + Routinen + Training + Workout-Flow

Schlaf, Hydration, Ernährung, Training, Gewohnheiten, Supplemente,
Medikamente (inkl. Peptide, seit 13.08. datentechnisch zusammengelegt — kein
eigener Reiter mehr), Tageslicht. Darüber liegt ein **Hauptprotokoll** (Name,
Startdatum), unter dem alle Kategorien als **Teilprotokolle** laufen
(`hauptprotokolle`/`teilprotokolle`-Tabellen). Jeder Baustein einzeln
an-/abschaltbar ohne den kompletten Onboarding-Assistenten neu zu
durchlaufen (`MehrTab.jsx`), und seit dem 15.08. **versionierbar**: über
einen 📌-Button hält man die aktuell geltenden Werte eines Bausteins als
Snapshot fest (`baustein_versionen`-Tabelle, `useBausteinVersionen.js`),
sichtbar unter Archiv → Protokolle. Bewusst manuell per Knopfdruck, kein
automatisches Diffing bei jeder Änderung.

**Morgen-/Abendroutine** (eigene Reiter im "Alle Pläne"-Bereich, zusätzlich
zu den Tagesplan-Karten): frei benannte Schritte mit geplanter Dauer,
geführter Ablauf-Screen mit Countdown + Vorwarnton (`RoutineAblauf.jsx`),
editierbarer Zeitrahmen (`routine_einstellungen`) mit Überlappungs-Erkennung
(andere geplante Punkte, die in den Zeitrahmen fallen, werden zur Übernahme
als Routine-Schritt vorgeschlagen). Haben seit heute (15.08.) eine eigene
Push-Erinnerung zum Zeitrahmen-Start (Abschnitt 7). **Inhaltliche
ADHS-Vorgaben für eine "richtige" Morgen-/Abendroutine sind bewusst noch
nicht vorgegeben** — die Nutzerin wollte das erst nach eigener Recherche
gemeinsam festlegen; noch nicht nachgezogen.

**Training:** Live-Workout-Screen mit Satz-/Pausen-Timer, Wochenplan mit
Mehrfachauswahl von Wochentagen/Trainingsarten, großer Übungskatalog
(`KRAFTUEBUNGEN`/`BODYWEIGHT_UEBUNGEN` in `constants.js`, ~200 Einträge).
**Isometrisches Training** hat einen eigenen Intervall-Timer-Modus
(Halten/Pause, z. B. 5 Sek. halten/4 Sek. Pause) mit Vorbereitungs-Countdown,
Start-/Ende-Piep pro Phase UND (seit heute) einem leisen Sekunden-Ticken
während Halten/Pause (`Timer.jsx`, `tickJedeSekunde`-Prop, `playTick()` in
`utils/beep.js`).

**Workout-Flow** (`workflow_plaene`/`workflow_presets`, seit 15.08.): frei
konfigurierbare Arbeits-/Pause-Intervall-Presets (Pomodoro-artig,
`WorkflowTimer.jsx`), die sich — wie Training/Ernährung — festen Wochentagen
und Uhrzeiten zuordnen lassen, wahlweise mit einem Gültigkeits-Zeitraum
(ab Datum X, oder zwischen X und Y, oder unbegrenzt). Haben seit heute
ebenfalls eine eigene Push-Erinnerung (Abschnitt 7).

### Übungsbilder — Infrastruktur fertig, Inhalte fehlen noch

Im Live-Trainings-Screen kann zu jeder Übung ein Bild angezeigt werden:
öffentliche Tabelle `uebungs_bilder` (name eindeutig, bild_url) + Storage-
Bucket `uebungsbilder`. Admin-Ansicht `AdminUebungsBilderView.jsx` ("🖼️
Übungsbilder verwalten") erlaubt Hochladen eines Bildes pro Übung;
`TrainingView.jsx`s `LiveWorkout` zeigt es automatisch an, sobald eines
existiert. **Die eigentlichen Bilder fehlen weiterhin** — sollten von der
Nutzerin in Canva erstellt werden (einheitlicher Schwarz-Weiß-
Illustrationsstil, dafür existiert eine Prompt-Liste für alle ~200 Übungen,
nicht im Repo), war zuletzt wegen Problemen mit ihrer Canva-Premium-Nutzung
pausiert — Stand bei Sitzungsstart erfragen.

---

## 6. Coach/Coachee-Modell

`istAdminModus = proband !== null || isAdmin` — diese Formel entscheidet
überall (KiChat.jsx, OnboardingFlow.jsx, AuthenticatedApp.jsx, HomeView.jsx),
ob gerade eine echte Admin-Sitzung (eigenes Konto ODER "Verwalten als")
läuft oder eine restriktive Coachee-Sitzung.

- **Onboarding für Coachees reduziert:** nur Profil (Name/Alter/
  Körperwerte) + Ziel + kurzer **Steckbrief** (`profiles.steckbrief` jsonb):
  Supplemente ja/nein, Sport-Erfahrung, Sport-Menge. Laborwerte/Routinen/die
  8 Kategorie-Schritte entfallen komplett für Coachees, bleiben im
  Admin-/Verwalten-als-Modus unverändert vollständig.
- **KI-Assistent (Aka) und "+"-Button ("Neues Protokoll") sind für Coachees
  komplett ausgeblendet** — zentrales Gate in `KiChat.jsx`
  (`if (!istAdminModus) return null`) bzw. in `AuthenticatedApp.jsx`s
  `zeigeFab`.
- **Nachrichtenfunktion Coachee → Coach** ersetzt den KI-Assistenten für
  Coachees: Tabelle `coachee_nachrichten`, Karte auf `HomeView.jsx`
  ("Nachricht an deinen Coach"), Admin-Dashboard hat ein "Nachrichten"-Panel
  pro Proband (Lesen/als-gelesen-Markieren). `AdminCoachUebersichtView.jsx`
  zeigt der Coachin zusätzlich Trainingsplan + Aktivität je Coachee.
- **Wissens-Basis-Verwaltung ("Aka lernt mit"):** DB-gestützte Tabelle
  `coach_wissen` (`bereich` nullable, `titel`, `text`) — Admin trägt
  jederzeit direkt aus der App neues Wissen ein (`AdminWissenView.jsx`,
  Knopf im Admin-Dashboard "📚 Wissens-Basis verwalten"). Fließt in JEDEN
  Gesprächskontext von Aka ein (gefiltert nach `bereich`, `null`/leer = gilt
  überall). Inhaltlich mittlerweile deutlich gewachsen: die ursprünglichen
  16 destillierten Einträge aus den drei Praxisakademie-Dokumenten (Rolle &
  Grenzen, aktives Zuhören/GROW, ADHS-Psychoedukation, Red-Flag-
  Krisenprotokoll, Experiment-Methodik, ...) PLUS eine umfangreiche
  "Content-Library" (mehrere Migrationen, grob nach Themenblöcken 01-40,
  41-80, 60-80, 81-100, 101-122 nummeriert) PLUS Spezialthemen wie
  Sexualität/Intimität, isometrisches Training und das ADHS-Paradoxon
  (Schutzfaktoren, Person-Environment-Fit, biografische Beispiele wie Biles/
  Phelps/Branson/Neeleman, zugehöriges Coaching-Framework für
  Lebensrahmenbedingungen). Bewusst NICHT übernommen: die reine
  Trainingslogistik der Nutzerin selbst (Rollenspiel-Anleitungen,
  Prüfungsfragen, Formularvorlagen).
- **Bewusst NICHT umgesetzt:** automatisches Lernen aus individuellen
  Coachee-Protokolldaten (Datenschutz-/Einwilligungsfrage — Daten einer
  Person würden anderen Coachees zugutekommen). Vorschlag für später: ein
  von der Admin selbst geschriebenes "Fazit" bei Protokoll-Abschluss statt
  roher Coachee-Daten — noch nicht gebaut.
- **Digitale Coaching-Vorlagen** (`AdminFormulareView.jsx`, erreichbar über
  Admin-Dashboard "📋 Coaching-Vorlagen"): alle Formulare aus der
  Praxisakademie (Erstkontakt, Intake, Routinen-Profil, Sitzungsprotokoll
  GROW, Wochenplan, Red-Flag-Checkliste, Selbstreflexion, Beobachterbogen,
  Einwilligung, Feedbackbogen, Passungs-Check/Lebensrahmenbedingungen) digital
  ausfüllbar + als PDF exportierbar. Schema-getrieben
  (`src/data/formulareVorlagen.js`, generischer Feld-Renderer), PDF-Export
  über dieselbe `exportElementAsPdf()`-Pipeline wie die Wochenübersicht.
  Rein für die Coachin selbst, komplett getrennt von App-Daten der Coachees
  und von `coach_wissen`. **Keine Datenbank-Persistenz** — Werte bleiben nur
  im Browser-Zustand, solange die Ansicht offen ist; PDF-Export ist die Art,
  sie dauerhaft zu sichern.

---

## 7. Erinnerungs-/Push-System

**Technisch jetzt vollständig repariert (16.08., nachts), aber die
Nutzerin muss ihre Erinnerungen noch neu einstellen** — drei
unabhängige, alle stille (keine Fehlermeldung sichtbar) Fehlerquellen
nacheinander gefunden, siehe Teil 4 + Teil 5 der Update-Chronik oben für
die volle Diagnose-Geschichte:
1. `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` waren nie als Supabase-Secret
   gesetzt → `send-push`/`send-due-reminders` stürzten bei jedem Aufruf
   sofort ab. Neues Schlüsselpaar erzeugt, behoben.
2. `CRON_SECRET` im Cron-Job-SQL (Migration 0032) und im Supabase-Secret
   stimmten nicht überein → automatischer Versand lief seit jeher gegen
   401. Beide Seiten synchron auf einen neuen Wert gesetzt, behoben.
3. Migration `0025_erinnerungs.sql` (Spalte `profiles.erinnerungen`)
   wurde nie ausgeführt → jede je vorgenommene Erinnerungs-Einstellung
   verpuffte unsichtbar (Laden über `select("*")`, Speichern nur mit
   `console.error` statt sichtbarem Fehler, siehe `useProfileData.js`
   `setErinnerung()`). Migration nachgeholt, behoben.

**Offener Punkt, wichtig für den nächsten Sitzungsstart:** Weil Fehler 3
lange unbemerkt blieb, sind alle bisherigen Erinnerungs-Einstellungen der
Nutzerin nie in der Datenbank angekommen. Sie wollte sie am 16.08. selbst
neu einstellen (Gewohnheiten, Training, Hydration, Vorab-Zeiten,
Morgenroutine/Abendroutine, Workflow, ...) — bei Sitzungsende noch nicht
erledigt. Bitte nachfragen, ob das inzwischen geschehen ist, und ob ein
Live-Test (echte Push-Zustellung zu einer geplanten Uhrzeit) erfolgreich
war.

**`send-due-reminders`** (pg_cron, einmal pro Minute) deckt inzwischen
**12 Kategorien** ab, je mit bis zu drei Erinnerungs-Arten:
1. Erinnerung zur geplanten Uhrzeit selbst.
2. **Vorab-Hinweis** ("Gleich dran") — Zeitspanne **pro Kategorie frei
   wählbar** (`ui/VorlaufFeld.jsx`, `MehrTab.jsx`): Aus, 5/10/15/30 Min.,
   1-2 Std., bei Training/Ernährung/Workout-Flow zusätzlich 1-2 Tage (nur
   dort sinnvoll, weil die anderen Kategorien täglich wiederkehren — "1 Tag
   vorher" wäre dort gleichbedeutend mit "jeden Tag zur selben Zeit").
   Gespeichert in der bestehenden `profiles.erinnerungen`-jsonb-Spalte
   (`{aktiv, vorlaufMinuten}` je Kategorie), Rückfallwert 15 Min.
3. **Nachfass-Hinweis** 10 Min. danach, falls noch nicht bestätigt — nur bei
   Kategorien mit einer eindeutigen "erledigt"-Log-Tabelle (Peptide/
   Medikamente/Supplemente, Gewohnheiten, Training, Ernährung). Fehlt bei
   Hydration/Tageslicht/Schlaf-Zeitenliste sowie bei den drei neuesten
   Kategorien unten.

Die 12 Kategorien: Hydration, Tageslicht, Schlaf (eigene Zeiten-Liste),
Peptide, Medikamente, Supplemente (Dosierungsschema mit Intervall-Logik),
Gewohnheiten, Training, Ernährung (Wochenplan), sowie **neu seit heute**:
Morgenroutine, Abendroutine (Zeitrahmen-Start aus `routine_einstellungen`)
und Workout-Flow (`workflow_plaene`, inkl. Wochentag + optionalem
Gültigkeits-Zeitraum). Mehrere gleichzeitig fällige Erinnerungen werden zu
einer einzigen Push-Nachricht gebündelt (`merken()`/`faellig`-Map).

**Eigene Sounds pro Erinnerung sind technisch NICHT möglich** — das ist
keine Lücke in dieser App, sondern eine harte Grenze von Web-Push: keine
Browser-Engine (Safari/Chrome/Firefox) bietet eine `sound`-Option in der
Notification-API, es spielt immer der System-Standardton. Unterscheidbar
sind Erinnerungen nur über das Emoji im Text (🏋️ Training, 💧 Hydration,
🌱 Gewohnheit, 🌅 Morgenroutine, 🌆 Abendroutine, 🔁 Workout-Flow, ⏳ Vorab,
❗ Nachfass, ...). Eigene Sounds gingen nur mit einer nativen App — siehe
Abschnitt 12.

**Automatischer Spotify-Start** läuft ebenfalls über `send-due-reminders`,
unabhängig vom Push-System, aber im selben Cron-Tick: zur Bettzeit (1 Min.
danach) und zur Aufwachzeit (exakt), jeweils nur falls über
`SpotifyAnlassPicker` eine Playlist zugeordnet wurde — siehe Abschnitt 8.

---

## 8. Spotify-Integration

### Was fertig gebaut ist

- OAuth-Verbindung (`spotify-auth-callback`), Wiedergabe-Steuerung
  (`spotify-play`), mehrere frei benannte Playlists
  (`spotify_playlists`-Tabelle), Aka kann im Gespräch selbst eine passende
  Playlist starten (`[[SPOTIFY_PLAY:<Name>]]`-Marker).
- **Auto-Play-Schlüssel** für externe Automationen (iOS-Kurzbefehl) ohne
  normale Anmeldung — `spotify_verbindung.auto_play_token`, Aufruf per
  `?token=...` an `spotify-play`.
- **Playlist-Zuordnung je Anlass** (`spotify_anlass_playlists`:
  user_id, anlass, playlist_id, Komponente `SpotifyAnlassPicker.jsx`):
  Morgenroutine, Abendroutine, Training, ein allgemeiner
  "gewohnheiten"-Anlass (manuell per "Jetzt testen" ausgelöst) — UND, seit
  15.08., **automatischer serverseitiger Start ohne offene App**: zur
  Bettzeit (`anlass="schlaf"`, SchlafView.jsx, 1 Min. nach der konfigurierten
  Schlafenszeit) und zur Aufwachzeit (`anlass="morgenroutine"`, exakt zur
  Zeit aus `category_ziele.schlaf.bloecke[].aufwachzeit`). Läuft über
  `send-due-reminders` mit dem gespeicherten Refresh-Token — braucht ein
  aktives Spotify-Gerät (kann kein schlafendes Gerät wecken), ein
  Kurzbefehl, der Spotify kurz vorher einmal öffnet, ist empfehlenswert.

### 🔴 Zuletzt offen (Stand 14.08.) — Status heute nicht erneut geprüft

**Symptom (14.08.):** Beim Versuch, Spotify über "Mehr → Musik → Mit
Spotify verbinden" neu zu koppeln, landete die Nutzerin nach der Anmeldung
immer wieder auf der AKA-Seite, ohne dass die App "verbunden" anzeigte.
Vollständig ausgeschlossen wurden: Redirect-URI, `VITE_SPOTIFY_CLIENT_ID`,
Freigabeliste im Spotify-Dashboard, der Navigations-Mechanismus, der
gesamte Code-Pfad (`spotify-auth-callback` mehrfach zeilenweise geprüft),
sowie eine neu autorisierte App-Verbindung. Diagnose damals: die Schleife
trat innerhalb des verschachtelten "Mit Apple anmelden"-Schritts auf
Spotifys eigener Seite auf, vermutlich eine iOS/WebKit-Restriktion bei
verschachtelten Drittanbieter-Logins — **außerhalb dessen, was im Code
dieser App behoben werden kann**.

**Aber:** die Nutzerin hat seither erfolgreich Spotify-Wiedergabe genutzt
(automatischer Start zur Bettzeit/Aufwachzeit wurde heute getestet), es ist
also unklar, ob das Verbindungsproblem in der Zwischenzeit von selbst
verschwunden ist (z. B. durch ein iOS-Update) oder ob die bestehende
Verbindung nur nie erneuert werden musste. **Bei Bedarf zuerst nachfragen,
ob eine NEUE Verbindung überhaupt noch nötig ist**, bevor das alte Problem
erneut angegangen wird — möglicherweise erledigt sich das von selbst.

---

## 9. Migrationen

**Stand 15.08., spätabends: 0001–0069, alle als deployt/bestätigt
dokumentiert.** Diese Tabelle nennt nur die neuesten/für einen neuen Agenten
wichtigsten — für die vollständige Historie: `ls supabase/migrations/`.

| # | Datei | Inhalt |
|---|---|---|
| 0061 | `training_wochenplan_intervall.sql` | Intervall-Felder für isometrisches Training im Wochenplan |
| 0062 | `workflow_presets_und_plaene.sql` | Workout-Flow: Presets + Zeitplanung |
| 0063 | `trainingsplaene_ordner_und_ziel.sql` | Ordnerstruktur/Ziel für Trainingspläne |
| 0064 | `training_wochenplan_name.sql` | Freier Name je Wochenplan-Eintrag |
| 0065 | `coach_uebersicht.sql` | Grundlage für `AdminCoachUebersichtView.jsx` |
| 0066 | `coach_wissen_adhs_paradoxon.sql` | ADHS-Paradoxon-Wissenseinträge |
| 0067 | `teilprotokolle_tageslicht.sql` | Tageslicht als Teilprotokoll-Kategorie |
| 0068 | `teilprotokolle_aktiviert_am.sql` | Aktivierungs-Zeitpunkt je Baustein |
| 0069 | `baustein_versionen.sql` | Versionierung der Protokoll-Bausteine (📌-Snapshots) |
| 0070 | `quests.sql` | Neue Tabellen `quests` + `quest_fortschritt` fürs Quests-Feature (Teil 6/7) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |
| 0071 | `routine_tabellen_nachholen.sql` | Holt `routine_schritte`/`routine_durchlaeufe`/`routine_einstellungen` nach, die trotz 0041/0044 nie in der echten DB existierten (Teil 8) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |
| 0072 | `quest_rangliste.sql` | Erste Version der Quest-Rangliste-Funktion (Teil 9) — **durch 0073 ersetzt, muss NICHT separat ausgeführt werden** |
| 0073 | `teams.sql` | Teams (`teams`, `profiles.team_id`), `gleiches_team()`, team-bewusste `quest_rangliste()`, `team_nachrichten` + RLS, `admin_liste_probanden()` um `team_id` erweitert (Teil 9) | ✅ Erfolgreich ausgeführt (Teil 10) |
| 0074 | `coachee_einladung.sql` | `profiles.onboarding_modus` ("kurz"/"lang"), `admin_liste_probanden()` um `onboarding_modus` erweitert (Teil 12) — **noch nicht deployt, Nutzerin muss sie manuell in der SQL-Konsole ausführen** |

**Kein separates VAPID-Migrations-Skript nötig** für den Push-Fix heute —
das war ein reines Supabase-Secret, keine Schema-Änderung.

**⚠️ Migration 0025 (`erinnerungen`-Spalte auf `profiles`) fehlte trotz
"0001–0069 alle deployt"-Status** — erst am 16.08. nachts bemerkt und
nachgeholt (siehe Abschnitt 7 / Teil 5 der Chronik). Falls beim nächsten
Sitzungsstart Zweifel an anderen "als deployt markierten" Migrationen
bestehen: im Zweifel per `select column_name from information_schema.
columns where table_name = '<tabelle>'` direkt gegenchecken, statt sich
allein auf frühere Notizen in diesem Dokument zu verlassen — das
Silent-Failure-Verhalten der App (Abschnitt 7) hätte eine fehlende Spalte
sonst nie auffallen lassen.

---

## 10. Offene Punkte

| # | Thema | Status |
|---|---|---|
| 0 | Nutzerin muss alle Erinnerungs-Einstellungen neu vornehmen (waren wegen fehlender DB-Spalte nie gespeichert, s. Abschnitt 7) + Live-Test der Push-Zustellung | 🔴 Wichtigster offener Punkt — bei nächstem Sitzungsstart zuerst danach fragen |
| 1 | Spotify-"Verbinden" hing zuletzt (14.08.) in einer Anmelde-Schleife | 🟡 Unklar, ob noch aktuell — seither erfolgreiche Wiedergabe beobachtet, siehe Abschnitt 8. Vor erneutem Debugging erst prüfen, ob überhaupt noch nötig |
| 2 | Übungsbilder: Inhalte (Canva-Bilder) fehlen noch | 🟡 Pausiert — Code/Infrastruktur fertig (Abschnitt 5), Canva-Premium-Problem der Nutzerin zuletzt ungelöst |
| 3 | Gemini-429-Kontingentproblem (nur 20 Freianfragen/Tag) | 🔴 Offen seit mehreren Sitzungen, Stand erneut erfragen |
| 4 | Inhaltliche ADHS-Vorgaben für Morgen-/Abendroutine | Zurückgestellt, Nutzerin wollte selbst recherchieren |
| 5 | "Fazit"-Feld bei Protokoll-Abschluss statt automatischem Lernen aus Coachee-Daten | Nur als Vorschlag im Raum |
| 6 | Per-Gewohnheit-Playlist-Zuordnung | Bewusste Scope-Entscheidung |
| 7 | Groq als aktiver Provider | Zurückgestellt, Code vorbereitet |
| 8 | Sprachauswahl (DE/EN/TR) auf den Assistenten selbst ausweiten | Nur UI-Texte mehrsprachig |
| 9 | Sprechgeschwindigkeit der Cloud-Stimme einstellbar | Google-Cloud-TTS unterstützt `speakingRate`, noch nicht angebunden |
| 10 | Nachfass-Hinweis für Morgenroutine/Abendroutine/Workout-Flow | Fehlt bewusst — keine passende "erledigt"-Log-Tabelle, siehe Abschnitt 7 |
| 11 | Kalenderverbindung (Google/Apple Calendar oder .ics-Export) | Nur als vage Idee erwähnt, kein konkreter Auftrag |
| 12 | Native App (Xcode/App Store) | Gewünschtes Fernziel der Nutzerin — siehe Abschnitt 12 |
| 13 | `useProfileData.js`-Speicherfehler nur in der Browser-Konsole geloggt, nie sichtbar (Muster: optimistic update + `.then(error => console.error(error))`) | 🟡 Empfohlen, aber nicht umgesetzt — hat den Erinnerungen-Bug (Abschnitt 7) wochenlang unsichtbar gehalten. Mindestens `setErinnerung()` sollte Fehler sichtbar zurückmelden, stichprobenartig auf ähnliche `set*`-Funktionen prüfen |
| 14 | Migration `0070_quests.sql` muss die Nutzerin noch manuell in der Supabase-SQL-Konsole ausführen | 🔴 Ohne das laufen die neuen Menüpunkte "🎯 Quests" (Admin) bzw. die Quest-Karte auf der Startseite (Coachee) auf einen Datenbankfehler |
| 15 | Quests-Rangliste zwischen Coachees | ✅ Umgesetzt (Teil 9, team-bewusst) — Vergleich beim normalen Protokoll (nicht nur Quests) weiterhin offen, siehe #21 |
| 16 | Quests: satzgenaue Bestätigung bei Trainings-Quests (statt manueller Gesamt-Meldung) | Aus der Nutzerinnen-Vorgabe genannt, in V1 bewusst vereinfacht auf eine manuelle Fortschritts-/Abschlussmeldung, siehe Teil 6 |
| 17 | Migration `0071_routine_tabellen_nachholen.sql` muss die Nutzerin noch manuell in der Supabase-SQL-Konsole ausführen | 🔴 Ursache des Routinen-Bugs aus Teil 7 bestätigt (Teil 8): `routine_schritte` fehlte komplett in der DB. Ohne diese Migration lassen sich weiterhin keine Morgen-/Abendroutine-Schritte anlegen |
| 18 | Rundum-Check aller Migrationen gegen die echte Datenbank | Empfohlen (Teil 8) — zum zweiten Mal eine "als deployt" notierte Migration, die nie lief (nach `erinnerungen` in Teil 5 jetzt `routine_*`-Tabellen). Einmaliger Abgleich statt weiter einzeln nachzujagen |
| 19 | Migration `0073_teams.sql` ausführen | ✅ Erledigt (Teil 10, nach den drei dort beschriebenen Fixes erfolgreich gelaufen) |
| 20 | Edge Function `send-team-push` anlegen und deployen | ✅ Erledigt (Teil 10) — noch nicht live end-to-end getestet (Nachricht senden + tatsächliche Push-Zustellung an ein zweites Gerät), sollte bei Gelegenheit einmal verifiziert werden |
| 21 | Team-vs-Team-Gesamtwertung + Vergleich beim normalen Protokoll (nicht nur Quests) | Von der Nutzerin genannt ("diese gesamte Bewertung ... im Gruppenkontext"), in Teil 9 bewusst noch nicht umgesetzt — Team-Gesamtwertung ist ein kleinerer nächster Schritt (neue Aggregations-Funktion), Protokoll-Vergleich braucht weiterhin eine Klärungsrunde, WAS genau als faire Einzelzahl über alle Kategorien hinweg gelten soll |
| 22 | Migration `0074_coachee_einladung.sql` ausführen | ✅ Erledigt (Nutzerin hat den Text am 16.08. direkt aus dem Chat in die SQL-Konsole eingefügt und ausgeführt) |
| 23 | Edge Function `admin-invite-proband` anlegen und deployen | ✅ Erledigt (16.08., Text direkt aus dem Chat eingefügt) |
| 24 | Harte serverseitige Sperre gegen Selbstregistrierung (nicht nur UI-Entfernung) | 🟡 Von der Nutzerin gewünscht (16.08., Begründung: Piraterie-/Neugier-Schutz, sobald sie öffentlich über die App spricht, z. B. YouTube), aber für heute vertagt — kein akutes Risiko, das "Registrieren"-Tab-Entfernen deckt den praktischen Fall schon ab. Beim Versuch, "Enable email signups" zu finden, stellte sich heraus: im Email-Provider-Unterfenster (Sign In / Providers → Email) gibt es nur "Enable email provider" — **den NICHT ausschalten, das kappt die komplette E-Mail-Anmeldung inkl. der eigenen**. Vermutet, aber noch nicht bestätigt: ein separater "Allow new users to sign up"-Schalter unter einem "User Signups"-Abschnitt ganz oben auf der Hauptseite "Sign In / Providers" (vor der Anbieter-Liste, außerhalb des Email-Unterfensters) — das als Erstes prüfen, bevor an eine datenbankseitige Lösung gedacht wird. Falls der Schalter dort tatsächlich existiert: ausschalten, sollte die Selbstregistrierung serverseitig komplett blockieren, ohne Login/Invite/Verwalten-Flows zu berühren. Falls nicht auffindbar: mit der Nutzerin klären, ob eine eigene (aufwendigere, aus dem Sandbox nicht testbare) DB-seitige Absicherung gewünscht ist. |
| 25 | Supabase → Authentication → URL Configuration → Site URL prüfen | Muss auf die echte App-URL zeigen, sonst landet der Link in der Einladungs-Mail (Teil 12) ins Leere |
| 26 | Einladungs-Ablauf einmal komplett end-to-end testen (echte Test-E-Mail) | Aus dem Sandbox nicht möglich (kein Netzwerkzugriff auf Supabase), sollte die Nutzerin einmal selbst durchklicken, bevor sie es für echte Coachees nutzt |
| 27 | Edge Function `lexikon` neu deployen | ✅ Erledigt (16.08., Text direkt aus dem Chat eingefügt) — der kuratierte Kontext aus der Wissensbasis (Peptide/Supplemente/Schlafgesundheit) ist damit live |
| 28 | Wissensbasis-Größe (`src/wissen/`) — gezielte Auswahl statt "alles an jede Anfrage anhängen" | 🟡 Nach Teil 15 kein theoretisches Later-Thema mehr, sondern realer Kosten-/Latenz-Faktor bei jedem KiChat-Aufruf (9 umfangreiche Themen-Dateien plus Ernährung). Für das Lexikon bereits gezielte Auswahl pro Kategorie umgesetzt (Teil 15) — Vorbild für eine ähnliche Lösung bei KiChat |

---

## 11. Wichtige Hinweise für den nächsten Agenten — Arbeitsweise

- **Manuell UND per KI, nie nur eins von beidem** — bei jeder Änderung
  prüfen, ob das manuelle Formular noch genauso vollständig funktioniert.
- **Die Nutzerin ist nicht technisch versiert**, spricht oft per
  Spracherkennung. Bei Screenshots genau hinschauen — oft eine kleine
  Verwechslung, kein grundsätzliches Unverständnis. Bei unklaren/
  abgeschnittenen Nachrichten kurz nachfragen statt zu raten.
- **Diese Sandbox hat keinen direkten Netzwerkzugriff auf das Supabase-
  Dashboard.** Migrationen/Edge-Function-Änderungen landen im Code, müssen
  aber von der Nutzerin manuell über das Supabase-Dashboard ausgeführt
  werden (SQL-Editor bzw. Edge-Functions-Code-Tab + Deploy). SQL/Code am
  besten **sowohl als Datei als auch als reinen Text im Chat**
  bereitstellen — je nachdem, was auf dem iPad gerade zuverlässiger
  funktioniert (variiert). Bei kurzen, exakten Werten (Secrets/Keys) hilft
  eine kleine selbst gebaute Kopieren-Knopf-Seite (Artifact) mehr als
  Chat-Text, weil manuelles Markieren/Abtippen auf dem Tablet leicht
  minimal verfälscht (siehe Push-Fix-Historie oben — drei fehlgeschlagene
  Versuche, jedes Mal ein anderer Tippfehler).
- **Live-Verifikation nur über Screenshots der Nutzerin möglich** (inkl.
  Supabase-Dashboard-Logs, die sie bei Bedarf durchklicken kann) — bei
  hartnäckigen Bugs lohnt sich systematisches, schrittweises
  Ausschlussverfahren mit ihrer Hilfe, aber auch die Bereitschaft, ehrlich
  zu sagen "das liegt außerhalb des Codes", statt endlos weiterzusuchen,
  wenn die Evidenz das nahelegt (Beispiel: Spotify-Loop, Abschnitt 8).
- **Git-Workflow:** i. d. R. auf einem Feature-Branch arbeiten, dann
  fast-forward nach `main` mergen und pushen (Vercel deployt automatisch bei
  Push auf `main`). Vor jedem Commit, der JS/JSX/TS berührt: `npm run
  build` + `npx oxlint <geänderte Dateien>` — beides muss sauber
  durchlaufen. Supabase Edge Functions werden NICHT automatisch deployt
  (kein CI/CD dafür eingerichtet) — jede Änderung an einer
  `supabase/functions/*/index.ts` muss die Nutzerin zusätzlich manuell im
  Dashboard nachziehen.
- **Neue Migrationsdateien** fortlaufend nummeriert ablegen (aktuell zuletzt
  `0069_...`), reine Datenmigrationen (kein Schema-Change) genauso wie
  Schema-Änderungen.
- **Dieses Dokument aktuell halten** — bei viel Veränderung lieber die
  betroffenen Abschnitte 1-12 direkt überarbeiten, statt nur oben in der
  Update-Chronik neue Absätze aufzustapeln (die Chronik ganz oben in diesem
  Dokument bleibt trotzdem wertvoll als Detail-Historie einzelner
  Sitzungen — beides ergänzt sich).

---

## 12. Zukunftsplan: Eine echte native App über Xcode

Die Nutzerin möchte AKA langfristig als **echte native iOS-App** (App
Store), nicht mehr nur als PWA. Das ist ein bewusst separates, größeres
Vorhaben — hier der Fahrplan für einen künftigen Agenten (oder Entwickler
mit Xcode-Zugang), plus was sich dadurch konkret verbessert.

### Warum überhaupt — was eine native App tatsächlich löst

- **Eigene Benachrichtigungs-Sounds pro Kategorie** (die in dieser Sitzung
  mehrfach gewünschte, mit Web-Push technisch unmögliche Funktion) — native
  Apps können über APNs (Apple Push Notification service) den `sound`-Wert
  im Push-Payload auf eine im App-Bundle mitgelieferte Audiodatei setzen,
  pro Benachrichtigungstyp unterschiedlich.
- **Zuverlässigere Hintergrund-Aktionen** (z. B. der Spotify-Auto-Play zur
  Aufwachzeit, der aktuell ein "aktives Gerät" voraussetzt) — native Apps
  haben mehr Hintergrund-Ausführungsrechte als eine im Browser laufende PWA.
- **App-Store-Präsenz** — leichter auffindbar/vertrauenswürdiger für
  Coachees als "zum Home-Bildschirm hinzufügen".
- **Echte Vibrations-/Haptik-Muster**, native UI-Komponenten (Datepicker,
  Kamera-Zugriff für Laborwert-Scans ohne Browser-Umweg), Widgets,
  potenziell Apple Watch-Anbindung für Trainings-Timer.

### Realistischer Weg — KEIN kompletter Neubau nötig

Der komplette bestehende React-Code muss **nicht** verworfen werden. Zwei
sinnvolle Wege, absteigend nach Aufwand:

1. **Capacitor (empfohlen als erster Schritt).** Verpackt die bestehende
   React-App fast unverändert in eine native iOS-Hülle (WebView + native
   Brücken-APIs). Vorteil: der komplette bestehende Code (alle Views, Hooks,
   die Supabase-Anbindung) bleibt exakt so bestehen — nur der Zugriff auf
   native Features (Push über APNs statt Web-Push, Kamera, Haptik) läuft
   über zusätzliche Capacitor-Plugins statt Browser-APIs. Braucht einen Mac
   mit Xcode zum Bauen/Signieren/Einreichen, aber keine Neuentwicklung der
   App selbst. Realistischster erster Schritt für dieses Projekt.
2. **Echte native Neuentwicklung (SwiftUI) oder React Native.** Deutlich
   größerer Aufwand — jede View, jeder Hook müsste in Swift/React-Native neu
   gebaut werden. Nur sinnvoll, falls Capacitor an echte Grenzen stößt
   (z. B. Performance bei sehr komplexen Screens) oder die Nutzerin explizit
   eine "richtige" native Optik will, die sich mit einer WebView nicht
   erreichen lässt.

**Empfehlung für den Einstieg:** Capacitor. Das liefert die von der
Nutzerin konkret gewünschten Verbesserungen (App-Store, eigene Sounds über
APNs) mit dem kleinsten Umbau, ohne den bestehenden, funktionierenden
Code wegzuwerfen.

### Was dafür konkret nötig ist (grober Fahrplan, keiner der Schritte ist begonnen)

1. **Ein Mac mit Xcode** — zwingende Voraussetzung, iOS-Apps lassen sich
   nicht ohne Apple-Toolchain bauen/signieren (das war der ganze Grund,
   warum diese Sitzung bewusst den PWA-Weg gegangen ist).
2. **Apple Developer Account** (99 $/Jahr) für Code-Signing und
   App-Store-Einreichung.
3. `npx cap init` + `npx cap add ios` im bestehenden Repo, `vite build`
   Output als WebView-Inhalt einbinden.
4. **Push-Migration von Web-Push (VAPID) auf APNs**: eigenes Zertifikat/Key
   bei Apple, `send-due-reminders`/`send-push` müssten für iOS-Clients
   APNs statt `web-push` ansprechen (Payload-Format ist unterschiedlich) —
   realistisch als Zweigleisigkeit (Web-Push für evtl. weiterhin
   existierende Browser-Nutzer, APNs für die native App) oder als klarer
   Schnitt, falls die PWA komplett abgelöst wird.
5. Sound-Dateien pro Erinnerungs-Kategorie festlegen/produzieren (aktuell
   nur unterschiedliche Emojis im Text, siehe Abschnitt 7) und im
   App-Bundle mitliefern.
6. App-Icons/Screenshots/Store-Listing vorbereiten, TestFlight-Beta vor dem
   eigentlichen Store-Release.
7. Datenschutzerklärung/App-Store-Datenschutzangaben (Supabase-Datenhaltung,
   Gesundheitsdaten-Kategorie beachten — Apple prüft das bei
   Gesundheits-Apps genauer als bei anderen Kategorien).

**Nicht vergessen:** Das Coach/Coachee-Geschäftsmodell (Abschnitt 6) bleibt
davon unberührt — eine native App ändert nichts an der Architektur
(Supabase-Backend, Admin-/Verwalten-als-Modus), nur an der Hülle und den
nativen Zusatzmöglichkeiten.
