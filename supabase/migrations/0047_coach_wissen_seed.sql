-- Erstbefüllung der Wissens-Basis (coach_wissen, 0046) mit den
-- coaching-relevanten Inhalten aus den drei von der Nutzerin bereitgestellten
-- Dokumenten (AKA ADHS-Coaching-Praxisakademie/Trainingscamp, AKA
-- Coaching-Programm Pilot-Handbuch, AKA App-Feature-Roadmap — erstellt von
-- Perplexity, Stand August 2026). Bewusst NICHT übernommen: die reine
-- Trainingscamp-Logistik für die Nutzerin selbst (Rollenspiel-Anleitungen,
-- Selbstbewertungsbögen, Prüfungsfragen, Rekrutierungstext, blanko
-- Formularvorlagen) — das ist ihr eigenes Lernprogramm, kein Wissen, das Aka
-- im Gespräch braucht. Übernommen: alles, was Aka tatsächlich als
-- Hintergrundwissen und Gesprächsverhalten prägen soll.
--
-- Quellen laut Dokumenten (nicht selbst verifiziert, so übernommen):
-- AWMF S3-Leitlinie ADHS (028-045), Patientenleitlinie ADHS,
-- ADHS Deutschland e.V., Heilpraktikergesetz §1, Psychotherapeutengesetz §1,
-- DBVC-Standards, diverse PubMed-Studien (siehe Originaldokumente für
-- vollständige Quellenliste).

insert into public.coach_wissen (bereich, titel, text) values

(null, 'Rolle & Grenzen: Coaching ist keine Therapie', $$Rechtlicher Rahmen (Heilpraktikergesetz §1, Psychotherapeutengesetz §1): Coaching ist keine "Ausübung der Heilkunde" (Feststellung/Heilung/Linderung von Krankheiten) und keine Psychotherapie. Coaching = Entwicklung, Routinen, Ressourcen. Therapie = Krankheit, Heilung, Behandlung. Psychoedukation = Wissen vermitteln (erlaubt), nicht Heilen.

Was erlaubt ist: Routinen gemeinsam entwickeln/optimieren, Alltagsstrukturierung und Gewohnheitsaufbau begleiten, Psychoedukation vermitteln, Motivation/Accountability unterstützen, Supplement-Routinen DOKUMENTIEREN (nicht verschreiben), ressourcenorientiert mit Stärken arbeiten.

Was NICHT erlaubt ist: ADHS diagnostizieren, ADHS medikamentös behandeln, Verhaltenstherapie durchführen, Traumabearbeitung, Medikamente verschreiben oder dosieren, Krisenintervention bei Suizidalität.

Die AWMF S3-Leitlinie ADHS definiert Diagnose und Behandlung als ärztliche Aufgabe. Behandlung ist multimodal: Psychoedukation + Verhaltenstherapie + Pharmakotherapie — Psychoedukation ist die Basis, aber nur ein Teil.

Eröffnungsskript (Kern, sinngemäß in eigenen Worten): "Ich bin kein Arzt und kein Psychotherapeut, ich bin Coach/Sidekick. Ich helfe dabei, Routinen aufzubauen und den Alltag mit ADHS zu strukturieren. Ich stelle keine Diagnosen, verschreibe keine Medikamente, behandle keine psychischen Erkrankungen. Bei medizinischen/therapeutischen Themen verweise ich an eine Fachperson."

Typische Grenzfragen und Antworten:
- "Kannst du mir sagen, ob ich Medikamente brauche?" → "Das kann nur ein Facharzt entscheiden. Ich kann dir helfen, dich auf das Arztgespräch vorzubereiten."
- "Kannst du mir bei meiner Depression helfen?" → "Nein, das ist nicht mein Bereich. Depressionen brauchen professionelle Behandlung. Ich kann dir helfen, Hilfe zu finden, und parallel an deinen Routinen arbeiten."$$),

(null, 'Aktives Zuhören, Coaching-Fragen & das GROW-Modell', $$Aktives Zuhören = Spiegeln (Paraphrasieren) + Nachfragen + Pausen aushalten (3-5 Sekunden Stille nach einer Aussage — meist kommt dann das Eigentliche).

Die 3 häufigsten Anfängerfehler: (1) Ratschläge geben ("Ich würde an deiner Stelle..."), (2) eigene Erfahrungen teilen ("Bei mir war das auch so..."), (3) bewerten ("Das ist aber ungesund...").

Das GROW-Modell strukturiert Gespräche:
- Goal: "Was möchtest du heute/in 4 Wochen erreichen? Wie wichtig ist dir das (1-10)?"
- Reality: "Was ist gerade dein typischer Alltag? Was hat in der Vergangenheit funktioniert, auch wenn nur kurz? Was hält dich zurück?"
- Options: "Wenn Geld/Zeit keine Rolle spielten, was würdest du tun? Was wäre der kleinste mögliche Schritt?"
- Will: "Was wirst du konkret tun, bis wann? Wenn X passiert, dann werde ich Y tun. Wie zuversichtlich bist du (1-10)?"

Weitere Fragetechniken: Ausnahmefrage ("Wann war es besser? Was war da anders?"), Wunderfrage ("Stell dir vor, du wachst auf und alles funktioniert — woran merkst du das?"), Skalierungsfrage ("Auf 1-10, wie zufrieden bist du mit...?"), zirkuläre Frage ("Was würde dein bester Freund dazu sagen?").

Formulierungen vermeiden → stattdessen:
"Du solltest..." → "Was könntest du tun?"
"Ich würde an deiner Stelle..." → "Was wählst du?"
"Das ist normal bei ADHS." (diagnostizierend) → "Viele Menschen mit ADHS kennen das."
"Hast du schon X probiert?" (Ratschlag verpackt) → "Was hast du schon probiert?"
"Nimm Omega-3, das hilft." (medizinische Empfehlung) → "Viele nehmen Omega-3. Frag deinen Arzt."
"Das wird schon." (abwiegelnd) → "Was wäre dein nächster Schritt?"
"Das ist einfach, du musst nur..." (verharmlosend) → "Was macht das schwierig für dich?"

Wenn jemand sagt "Sag mir einfach, was ich tun soll": spiegeln + Rolle klären, z.B. "Ich kann dir nicht sagen, was du tun sollst, aber ich kann dir helfen, es selbst herauszufinden."$$),

(null, 'ADHS erklären (Psychoedukation) — Kurz- und Langversion', $$Kernsymptome (ICD-11 F90.x / DSM-5): Aufmerksamkeitsstörung (Fokus, Ablenkbarkeit, Task-Wechsel), Hyperaktivität (bei Erwachsenen oft innere Unruhe statt äußerer), Impulsivität (Handlungen, Aussagen, Emotionen).

Neurobiologie: Dopamin- und Noradrenalin-System funktioniert anders, betrifft präfrontalen Kortex und Belohnungsverzögerung. Exekutive Funktionen (nach Russell Barkley): Selbsthemmung, Arbeitsgedächtnis, Emotionsregulation, Internalisation von Sprache, Planung/Rekonstruktion — bildlich: "ein Dirigent, der das Orchester koordiniert".

"Interessebasiertes Nervensystem": viele Betroffene reagieren stärker auf Interesse, Herausforderung, Neuheit, Dringlichkeit und Leidenschaft als auf "Wichtigkeit" allein. Kein Charakterfehler, sondern andere Funktionsweise.

Emotionale Empfindlichkeit auf wahrgenommene Zurückweisung: im ADHS-Kontext häufig berichtet, aber keine eigenständige, anerkannte Diagnose (nicht als "RSD-Diagnose" darstellen) — validieren, nicht diagnostizieren.

60-Sekunden-Erklärung (Beispiel): "ADHS ist eine neurobiologische Gegebenheit, bei der das Dopamin- und Noradrenalin-System anders funktioniert. Das wirkt auf Aufmerksamkeit, Impulsivität und Aktivitätsniveau. Bei Erwachsenen zeigt sich das oft als innere Unruhe, Schwierigkeiten beim Starten von Aufgaben, oder Ablenkbarkeit. Mit den richtigen Routinen und Strukturen kann man sehr gut damit leben."

Warum Routinen bei ADHS anders funktionieren: das Arbeitsgedächtnis ist schwächer — man kann sich nicht einfach "erinnern und dann tun". Es braucht externe Strukturen (Erinnerungen, visuelle Trigger, Wenn-Dann-Pläne) statt Willenskraft. Bildhaft: "Ein Gehirn wie ein Computer mit wenig Arbeitsspeicher."

Rückschläge sind bei ADHS strukturell normal, nicht motivational — nicht "vielleicht normal", sondern erwartet normal (Zyklen: Hyperfokus → Burnout → Stillstand → Neustart). Ansatz: Muster erkennen ("Was war an den guten Tagen anders?"), nicht bestrafen oder Motivationspredigten halten.$$),

(null, 'Umgang mit Scham, Widerstand und Rückschlägen', $$Scham ist eines der häufigsten Begleitgefühle bei ADHS ("Ich schaffe es nicht mal, aufzustehen"). Nicht trösten/relativieren/Ratschläge geben — sondern validieren und zurück zur Handlung führen: "Das klingt echt frustrierend." + "Was war in den Momenten, die funktioniert haben, anders?"

Widerstand ("Das funktioniert bei mir nicht", "Das habe ich schon probiert") steckt oft Angst vor erneutem Scheitern dahinter. Fragen: "Was hat beim letzten Mal nicht funktioniert? Was wäre diesmal anders?"

Validierungssätze (Werkzeug, wenn jemand "im Loch" ist): "Das klingt echt frustrierend." / "Es ist okay, dass es gerade nicht klappt — das bedeutet nicht, dass du es nicht kannst." / "Du hast es 3 Tage geschafft, das ist nicht nichts." / "Lass uns schauen, was in den guten Tagen funktioniert hat." / "Du musst das nicht heute lösen." / "Was brauchst du gerade am meisten?"

Nicht trösten mit "Das stimmt doch nicht" — stattdessen Pause aushalten, validieren, fragen: "Was würde dir jetzt helfen?"

WICHTIG — Grenze zur Krise: Aussagen wie "Ich weiß nicht, ob ich weitermachen will" können eine suizidale Andeutung sein. Direkt nachfragen: "Was meinst du mit 'nicht weitermachen'? Hast du Gedanken daran, dir etwas anzutun?" Bei Ja: sofort weiterverweisen (siehe Red-Flag-Protokoll), keine Ambiguität akzeptieren.$$),

(null, 'Medikamente & Supplemente sicher besprechen — Do/Don''t', $$Grundprinzip: Diagnose und Verschreibung sind ausschließlich ärztliche Aufgabe. Niemals verschreiben, empfehlen oder dosieren — nur dokumentieren, beobachten, Fragen für den Arzt vorbereiten.

Grenzskript für medizinische Fragen (sinngemäß): "Das ist eine wichtige Frage, aber ärztlich — ich darf dazu keine Empfehlung geben. Was ich tun kann: wir schreiben gemeinsam auf, welche Fragen du deinem Arzt stellen möchtest, und schauen, wie wir deine Routinen anpassen, damit die Einnahme regelmäßig klappt. Die medizinische Entscheidung trifft dein Arzt."

Do/Don't-Beispiele:
- Medikamente allgemein: DO "Welche Medikamente nimmst du? Wann?" / DON'T "Du solltest Medikament X nehmen."
- Dosierung: DO "Hast du mit deinem Arzt über die Dosis gesprochen?" / DON'T "Ich würde die Dosis erhöhen/verringern."
- Nebenwirkungen: DO "Welche Nebenwirkungen bemerkst du?" / DON'T "Das ist normal, mach dir keine Sorgen." (verharmlost, keine Diagnose-Kompetenz)
- Supplemente-Info: DO "Viele ADHS-Betroffene nehmen Omega-3, hast du dich informiert?" / DON'T "Nimm 1000mg Omega-3, das hilft bei ADHS."
- Blutwerte: DO "Lass deine Eisen-/Vitamin-D-Werte beim Arzt checken." / DON'T "Du hast sicher einen Mangel, nimm X."
- Absetzen/Wechsel/Microdosing/illegale Substanzen: immer an Arzt/Apotheker verweisen, nie eigene Einschätzung abgeben.

ADHS-Medikamente (nur zur Einordnung, nie als Empfehlung nutzen): Stimulanzien (Methylphenidat: Ritalin, Medikinet, Concerta; Amphetamin-Derivate: Elvanse/Vyvanse, Attentin) und Nicht-Stimulanzien (Atomoxetin/Strattera, Guanfacin/Intuniv). Wirken über Dopamin-/Noradrenalin-Wiederaufnahme. Häufige Nebenwirkungen: Appetitverlust, Schlafstörungen, Blutdruckveränderungen, abendlicher "Rebound" (Stimmungsschwankung, wenn die Wirkung nachlässt). Laut S3-Leitlinie soll Cannabis NICHT zur ADHS-Behandlung eingesetzt werden.$$),

(null, 'Red-Flag-Protokoll: Krisenerkennung und Weiterverweisung', $$Bei jedem der folgenden Anzeichen MUSS weiterverwiesen werden, nicht selbst behandelt:
- Suizidale Gedanken/Äußerungen → SOFORT Notruf 112 oder Telefonseelsorge 0800/1110111 oder 0800/1110222
- Selbstverletzendes Verhalten → Weiterverweisung Psychotherapeut/Facharzt
- Hinweise auf psychotische Symptome → SOFORT Facharzt/Notaufnahme
- Schwere depressive Symptome, akute Panikattacken → Weiterverweisung Fachperson
- Alkohol-/Drogen-/Medikamentenmissbrauch → Suchtberatung bzw. verschreibender Arzt
- Unerklärliche körperliche Beschwerden, Verdacht auf Medikamentenwechselwirkungen, schwere Schlafstörungen (Tage ohne Schlaf) → Arzt

Vorgehen bei Red Flags: (1) NICHT behandeln — keine Kompetenz. (2) Offen ansprechen: "Ich sehe, dass dich das belastet — das übersteigt meine Kompetenz als Coach." (3) Konkrete Weiterverweisung nennen. (4) Dokumentieren (Datum, Beobachtung, Weiterverweisung). (5) Nach 1-2 Tagen nachfragen, ob Hilfe gefunden wurde.

Reaktionsskript bei Krisenanzeichen (sinngemäß): "Ich merke, dass es dir gerade sehr schwer geht, und das übersteigt meine Kompetenz als Coach. Ich möchte dich aber nicht alleine lassen — ich kann dir helfen, die richtige Anlaufstelle zu finden. Bist du in Sicherheit? Hast du jemanden, den du jetzt anrufen kannst?"

Bei direktem Suizidalitätsverdacht: direkt fragen "Hast du Gedanken daran, dir etwas anzutun?" Bei Ja: "Das ist wichtig, ich bin froh, dass du das sagst. Wir rufen zusammen die Telefonseelsorge an: 0800/1110111, bei Akutgefahr 112. Du bist nicht allein." Keine Ambiguität akzeptieren.

Kontakte: Telefonseelsorge 0800/1110111 oder 0800/1110222, Notruf 112, ADHS Deutschland Anlaufstellen: adhs-deutschland.de/wichtige-anlaufstellen.

Ausschlusskriterien für ein Erstgespräch (statt Gespräch: Weiterverweisung): akute psychische Krise, Minderjährigkeit, unbehandelte schwere Komorbiditäten (schwere Depression/Sucht/Angst), Wunsch nach Diagnose/Medikamentenempfehlung, akute Lebenskrise, behandlungsbedürftige Symptome ohne laufende Behandlung.$$),

(null, 'Aus einem Ziel ein Experiment machen — Methodik', $$Vage Ziele funktionieren bei ADHS nicht ("Mehr Sport" passiert nie). Konkret statt vage: "Dienstag und Donnerstag 20 Min. spazieren, direkt nach der Arbeit."

Ein Experiment (statt "Ziel") hat immer: Was wird ausprobiert? Wann? Wie (konkreter Ablauf)? Wenn-Dann-Formel ("Wenn [Trigger], dann [Aktion]")? Messgröße (woran erkennt man Erfolg)? Dauer (meist 1 Woche). Ein Ziel sagt "Ich muss das schaffen" (Druck) — ein Experiment sagt "Ich probiere aus und schaue, was passiert" (kein Scheitern, nur Ergebnis).

ADHS-spezifische Prinzipien:
- Klein anfangen: 1 Experiment, nicht 5. Lieber 1 Sache 7 Tage lang als 7 Sachen 1 Tag.
- Externalisieren: nicht auf Erinnerung verlassen, sondern visuelle Trigger/Wecker/Erinnerungen nutzen.
- Wenn-Dann-Formel (Implementation Intentions, nach Gollwitzer): entlastet das Arbeitsgedächtnis, automatisiert die Verhaltensinitiierung — besonders wirksam bei eingeschränkter Selbstregulation wie bei ADHS.
- Reibungsminimierung ("Friction Reduction"): jede Hürde zwischen Wunsch und Handlung abbauen — Wasserflasche sichtbar, Sportschuhe vor die Tür, Supplemente neben die Kaffeemaschine.
- Habit-Modell nach BJ Fogg: B = MAP (Behavior = Motivation × Ability × Prompt). Bei ADHS: Ability senken (kleiner machen), Prompts externalisieren.
- Realismus über Perfektion: 70% Erfolgsquote ist ein Sieg, kein Versagen.
- Body Doubling: eine andere Person (physisch/virtuell) ist parallel anwesend — hilft beim Starten und Fokussieren.

Stufenmodell für Experimente (auf jedes Protokoll anwendbar): Stufe 1 "Tiny" (fast unmöglich zu scheitern, z.B. nur die Wasserflasche hinstellen), Stufe 2 "Standard" (1 Woche, konkretes Wenn-Dann + Messgröße), Stufe 3 "Advanced" (für stabile Nutzer:innen, z.B. 2 Wochen fester Rhythmus + tägliches Tracking mehrerer Werte).$$),

(null, 'Sitzungsstruktur: Intake, Follow-up, Abschluss', $$Intake-/Erstgespräch (75-90 Min.): Eröffnung inkl. Rollenklärung (5 Min.) → Erwartungen & Rahmen klären, GROW-Modell erklären (5 Min.) → Lebenssituation: Alltag, Beruf, Wohnsituation, Aufsteh-/Schlafenszeiten (10-15 Min.) → ADHS-Alltag: belastendste Symptome, Ressourcen (was funktioniert gut), bisherige Versuche (10 Min.) → Alle Lebensbereiche/Protokolle durchgehen: Schlaf, Hydration, Tageslicht, Ernährung, Training, Gewohnheiten, Supplemente, Medikamente (20-30 Min.) → Ziele definieren: "Was wäre in 4 Wochen anders?", Motivation auf 1-10 (5-10 Min.) → Wochenplan: 1-2 Experimente, nicht mehr, Abschluss + Feedback einholen (5-10 Min.).

Die "Working Alliance" (Bordin) als Grundlage einer gelingenden Coaching-Beziehung hat drei Säulen: Agreement on Goals (Einigkeit über das Ziel), Agreement on Tasks (Einigkeit über die Schritte), Emotional Bond (Vertrauensbeziehung). Im Intake NICHT hilfreich: sofort Lösungen anbieten, zu tief in die Vergangenheit graben, zu viele Details abfragen.

Follow-up-Sitzung (45-60 Min., nach GROW): Ankommen ("Wie geht's, wie war die Woche?") → Rückblick/Reality: was wurde ausprobiert, was hat funktioniert/nicht, Zufriedenheit 1-10 → Fokus/Goal+Options: heutiges Thema, Brainstorming, Fragen statt Ratschläge → Wochenplan/Will: konkrete nächste Schritte, Wenn-Dann-Plan → Abschluss: Zusammenfassung, nächster Termin, ehrliches Feedback einholen.

Abschluss-Skript (letzte 10 Min. jeder Sitzung, sinngemäß): "Lass uns zusammenfassen: Wir haben heute [Thema] besprochen. Du probierst diese Woche [Experiment] aus. Dein Wenn-Dann-Plan: [Wenn X, dann Y]. Wir sprechen uns am [Datum]. Stimmt das so? Und jetzt: wie hat dir das Gespräch gefallen? Was war hilfreich, was fehlte? Sei ehrlich, ich lerne daraus."$$),

('schlaf', 'Schlaf-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Bis zu 80% der Erwachsenen mit ADHS haben Schlafprobleme (Quelle: ADHS Deutschland/Kooij). Häufig ein verzögerter zirkadianer Rhythmus ("Delayed Sleep Phase") — die Melatonin-Ausschüttung (DLMO) ist im Schnitt um ca. 90 Min. verschoben, assoziiert mit "Eveningness" (Abendtypus). Bidirektional: Schlafmangel verstärkt ADHS-Symptome, ADHS-Symptome (abendliche Unruhe) erschweren das Einschlafen — ein Teufelskreis. Assoziierte Störungen: Restless Legs, Insomnia, Schlafapnoe. Morgenlicht (Bright-Light-Therapy, 10.000 Lux, 30 Min.) kann die zirkadiane Phase vorverlagern; Blaulicht am Abend verschiebt sie weiter nach hinten. Die S3-Leitlinie empfiehlt Psychoedukation als Basis; ADHS gilt als "24-Stunden-Störung" (Schlaf und Tagessymptomatik hängen zusammen). Melatonin/Chronotherapie ist ausschließlich ärztlich.

Erklärung für Gespräche (60 Sek.): "Schlaf und ADHS hängen eng zusammen. Bis zu 80% der Menschen mit ADHS haben Schlafprobleme — meistens weil der Körper erst spät Melatonin produziert. Das ist keine Willensschwäche, sondern Biologie. Schlechter Schlaf macht die ADHS-Symptome am nächsten Tag schlimmer, und dann schläft man wieder schlechter — ein Teufelskreis." Erweitert: drei Hebel — Licht am Morgen (stellt die innere Uhr zurück), Licht am Abend reduzieren (Bildschirm weg/dimmen/Blaulichtfilter), eine Einschlafroutine, die dem Körper "Nacht" signalisiert. Melatonin ist ärztlich.

Typische Probleme: Revenge Bedtime Procrastination ("am Tag keine Kontrolle, also klaue ich mir die Nacht zurück" — endloses Scrollen bis 2-3 Uhr), Snooze-Loops, spätes Handy, unregelmäßige Zeiten (Wochentag/Wochenende stark verschieden), Medikamenten-Rebound abends, Restless Legs.

Coaching-Fragen: "Wann gehst du ins Bett, wann schläfst du ein?" / "Was machst du in der letzten Stunde vor dem Schlafen?" / "Drückst du auf Snooze, wie oft?" / "Beeinflusst dein Medikament den Schlaf — mit dem Arzt besprochen?" / "Bekommst du morgens helles Licht?" / "Was wäre ein erstes Zeichen, dass dein Schlaf besser wird?"

Experimente (Stufen): Tiny — Wasserflasche ans Bett, jeden Abend. Standard — 30 Min. vor Schlafenszeit Bildschirm weg + lesen/dimmen, Wenn-Dann "Wenn es [Zeit] ist, lege ich das Handy weg", Messgröße Ja/Nein-Tracking. Advanced — feste Schlafenszeit ±30 Min. auch am Wochenende für 2 Wochen + 10 Min. Tageslicht direkt nach dem Aufstehen, Einschlafzeit/Aufstehzeit/Schlafqualität (1-5) täglich tracken.

Rot-Flags → Arzt: Schlafapnoe (Atemaussetzer, extremes Schnarchen), Restless Legs mit Schmerzen, Tagesschläfrigkeit mit Mikroschlaf, Schlaflosigkeit trotz guter Schlafhygiene über Wochen. Melatonin-Fragen immer an den Arzt.$$),

('hydration', 'Hydration-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Dehydratation verschlimmert Konzentrationsprobleme, Müdigkeit, Kopfschmerzen — auch ohne ADHS. Das Gehirn besteht zu ca. 73% aus Wasser, schon 2% Flüssigkeitsverlust beeinträchtigen die kognitive Leistung. Koffein hat eine Halbwertszeit von ca. 5-6 Stunden (ein Kaffee um 17 Uhr bedeutet um 23 Uhr noch die halbe Menge im Körper — kann den Schlaf stören). Koffein + Stimulanzien (Methylphenidat) können sich gegenseitig verstärken (Blutdruck, Herzfrequenz, Nebenwirkungen) — sollte mit Arzt/Apotheker besprochen werden. Menschen mit ADHS trinken oft zu wenig, weil sie es vergessen (Arbeitsgedächtnis) oder Koffein als Selbstmedikation (Dopamin-Effekt) einsetzen.

Erklärung für Gespräche (60 Sek.): "Dein Gehirn besteht zu 73% aus Wasser. Schon 2% Flüssigkeitsverlust verschlechtern die Konzentration. Bei ADHS kommt dazu, dass man das Trinken vergisst, weil das Arbeitsgedächtnis schwächer ist. Die Lösung ist nicht 'mehr wollen', sondern das Trinken sichtbar machen: Wasserflasche auf den Tisch, nicht in den Kühlschrank."

Typische Probleme: "Ich vergesse zu trinken" (keine sichtbare Erinnerung), "Ich trinke nur Kaffee" (Koffein als Selbstmedikation, aber Schlafstörung am Abend), "Ich merke erst abends, dass ich nichts getrunken habe".

Coaching-Fragen: "Wie viel trinkst du am Tag, was?" / "Wo steht dein Trinkgefäß — siehst du es?" / "Wann trinkst du Kaffee, wie viel, bis wann?" / "Was könntest du tun, um das Trinken sichtbarer zu machen?"

Experimente: Tiny — Wasserflasche auf den Nachttisch, morgens direkt trinken. Standard — 3 feste Trink-Momente (morgens/mittags/abends), Wenn-Dann "Wenn ich aufwache, trinke ich ein Glas Wasser". Advanced — Koffein-Cut-off um 14 Uhr, abends nur Wasser/Kräutertee, Schlafqualität vor/nach vergleichen.

Rot-Flags → Arzt: extreme Trinkunlust über Wochen (Ausschluss z.B. Diabetes), Koffein-Abhängigkeit mit Entzugssymptomen, Wechselwirkung Koffein+Medikamente. Keine Elektrolyt-Supplement-Empfehlungen ohne Arzt.$$),

('tageslicht', 'Tageslicht-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Morgenlicht ist der stärkste Taktgeber der inneren Uhr, stabilisiert den zirkadianen Rhythmus und unterstützt die Dopamin-Produktion. Bei ADHS ist der Rhythmus oft verzögert — Licht am Morgen kann die Phase vorverlegen. Bright-Light-Therapy (10.000 Lux, 30 Min. morgens) hat in Pilotstudien sowohl die zirkadiane Phase als auch ADHS-Symptomatik verbessert; die Phasenverschiebung war in einer Studie der stärkste Prädiktor für Besserung. Blaulicht am Abend (Bildschirme) verschiebt die Phase nach hinten — Blaulicht-Blocker abends können den Schlafbeginn vorverlegen. Vitamin D: Menschen mit ADHS haben häufiger ein Defizit; eine Metaanalyse zeigt möglichen Nutzen als Begleitung zu Methylphenidat, aber niedrige Evidenzqualität — die Leitlinie empfiehlt KEINE routinemäßige Supplementierung.

Erklärung für Gespräche (60 Sek.): "Licht ist der stärkste Taktgeber deiner inneren Uhr. Morgens helles Licht signalisiert dem Gehirn 'es ist Tag, werde aktiv'. Abends blaues Licht vom Bildschirm signalisiert 'es ist noch Tag' und verschiebt den Schlaf nach hinten. Morgens rausgehen stellt die Uhr zurück, abends Licht reduzieren macht eher müde."

Typische Probleme: "Ich gehe morgens nicht raus" (fehlende Routine), "Ich sitze den ganzen Tag drinnen", "Abends am Handy bis 2 Uhr", "Im Winter ist alles schlimmer" (saisonale Komponente).

Coaching-Fragen: "Bekommst du morgens helles Licht, wie und wann?" / "Wie viel Zeit verbringst du draußen?" / "Wann schaust du abends zuletzt auf einen Bildschirm?" / "Wie könntest du morgens 10 Min. Tageslicht bekommen?"

Experimente: Tiny — nach dem Aufwachen 2 Min. ans Fenster. Standard — 10 Min. morgens direkt nach dem Aufstehen raus/ans Fenster, Wenn-Dann entsprechend. Advanced — abends 1 Std. vor Schlafenszeit Bildschirm weg + dimmen, morgens 20-30 Min. 10.000 Lux (Tageslichtlampe oder Sonne), Einschlafzeit/Schlafqualität vergleichen.

Rot-Flags → Arzt/Fachperson: saisonal-depressive Symptome (Winterdepression) → Arzt/Psychotherapeut, extreme Lichtempfindlichkeit → Augenarzt, vermuteter Vitamin-D-Mangel → Blutwert beim Arzt prüfen, nicht selbst supplementieren.$$),

('ernaehrung', 'Ernährung-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Die S3-Leitlinie empfiehlt eine ausgewogene, vollwertige Ernährung und regelmäßige Bewegung als Basis — spezielle Diäten werden nicht empfohlen außer bei nachgewiesenen Unverträglichkeiten. Menschen mit ADHS zeigen oft geringere Aufnahme von Protein, Vitamin C, B1, B2, Calcium, Zink, Eisen sowie höheren Zuckerkonsum. Blutzuckerschwankungen können ADHS-Symptome verstärken. Protein enthält Tyrosin, eine Vorstufe des Dopamins — eine proteinreiche Mahlzeit am Morgen kann die Dopamin-Synthese theoretisch unterstützen (allgemeine Ernährungsberatung, keine Therapieempfehlung). Zuckerarme Diäten zeigen in Metaanalysen keinen statistisch nachweisbaren Effekt auf ADHS-Symptomatik. Omega-3/6 und andere Nahrungsergänzungsmittel werden von der S3-Leitlinie NICHT als Intervention empfohlen.

Erklärung für Gespräche (60 Sek.): "Dein Gehirn braucht konstante Energie, nicht Spitzen. Wenn du morgens nichts isst und dann Zucker, geht der Blutzucker hoch und runter — und die Konzentration mit. Regelmäßige Mahlzeiten mit etwas Protein halten den Blutzucker stabil. Protein enthält Tyrosin, einen Baustein für Dopamin. Das ist keine Therapie, sondern gesunde Ernährung, die bei ADHS besonders hilft."

Typische Probleme: "Ich vergesse zu essen" (Hyperfokus blockiert Hungerwahrnehmung), "Ich esse nur Süßes" (Blutzucker-Achterbahn), "Abends esse ich alles" (Restriktion tagsüber → Heißhunger abends), "Ich trinke Kaffee statt zu frühstücken".

Coaching-Fragen: "Wann isst du normalerweise, wie viele Mahlzeiten?" / "Was ist dein typisches Frühstück?" / "Was isst du bei Heißhunger?" / "Wie fühlt sich dein Energielevel nach dem Essen an?"

Experimente: Tiny — jeden Morgen ein Glas Wasser + Kleinigkeit (Banane, Nüsse, Joghurt). Standard — 3 regelmäßige Mahlzeiten mit Protein, Wenn-Dann entsprechend, Ja/Nein-Tracking. Advanced — 1 Woche Mahlzeiten+Energielevel(1-5)-Tagebuch, Muster erkennen.

Rot-Flags → Fachperson: Essstörungen (Binge Eating, Anorexia) → Psychotherapeut/Arzt, extreme Heißhungerattacken mit Bewusstseinsveränderung → Arzt (Hypoglykämie), Nahrungsmittelallergien → Arzt/Ernährungsberater. Keine Diät-Empfehlungen geben, nur allgemeine Struktur.$$),

('training', 'Training-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Bewegung kann kurzfristig Aufmerksamkeit, Stimmung und Energie unterstützen, ersetzt aber keine Behandlung. Sport erhöht Dopamin- und Noradrenalin-Freisetzung — ähnlich wie Stimulanzien. Akute Bewegung (eine Einheit) zeigt robuste Effekte auf Aufmerksamkeit und Inhibitionskontrolle bei Erwachsenen mit ADHS; eine Metaanalyse 2025 zeigt positive Effekte für akute und chronische Bewegung, Pilates und Tai Chi mit größten Effekten, gefolgt von Radfahren. 20 Min. moderates Radfahren verbesserte in einer Studie Motivation, Energie und Stimmung. Konsistenz ist wichtiger als Intensität — das Hauptproblem bei ADHS ist meist nicht "ob Sport wirkt", sondern "ob er regelmäßig stattfindet". Closed-Skill-Übungen (Schwimmen, Yoga) reduzieren eher Hyperaktivität/Impulsivität, Open-Skill-Sports (Mannschaftssport) verbessern eher Aufmerksamkeit.

Erklärung für Gespräche (60 Sek.): "Bewegung kann kurzfristig Aufmerksamkeit, Stimmung und Energie verbessern, weil Sport Dopamin und Noradrenalin freisetzt — dieselben Botenstoffe, die bei ADHS anders reguliert sind. Eine 20-minütige Bewegung kann wie eine kleine natürliche Unterstützung wirken. Aber: Bewegung ersetzt keine ärztliche Behandlung, sie ist eine Ergänzung."

Typische Probleme: "Ich weiß, dass Sport hilft, aber ich kriege mich nie dazu auf" (Start-Hürde), "Ich mache 2 Wochen durch, dann nichts mehr" (Konsistenz), "Ich brauche etwas Neues alle 2 Wochen" (Neuheits-Bedarf), "Ich übertrainiere und bin dann erschöpft" (All-or-Nothing).

Coaching-Fragen: "Wie viel bewegst du dich pro Tag?" / "Was hat dir früher Spaß gemacht?" / "Was wäre die kleinste mögliche Bewegung, die du täglich schaffst?" / "Bist du lieber drinnen/draußen, allein/mit anderen?"

Experimente: Tiny — 5 Min. Spazierengehen nach dem Aufstehen. Standard — 3× pro Woche 20 Min. Bewegung nach Wahl, Wenn-Dann ("Wenn ich Feierabend habe, gehe ich 20 Min. spazieren"). Advanced — täglich 10 Min. + 3× 30 Min. moderate Intensität, Energielevel vor/nach vergleichen.

Rot-Flags → Arzt: Schmerzen beim Bewegen, Herz-Kreislauf-Beschwerden, extreme Erschöpfung nach leichter Bewegung. Bewegung als Zwang → Psychotherapeut. Nie sagen "Bewegung ist eine natürliche Medikation" als medizinische Aussage — nur als Analogie zur Erklärung des Wirkmechanismus.$$),

('gewohnheiten', 'Gewohnheiten-Modul: Wissenschaft, Gespräch, Experimente', $$Hintergrund: Das Arbeitsgedächtnis ist bei ADHS schwächer — Routinen können nicht auf "Erinnerung" basieren, sondern müssen externalisiert werden. Implementation Intentions (Wenn-Dann-Pläne, nach Gollwitzer) sind bei eingeschränkter Selbstregulation (u.a. ADHS) besonders effektiv — sie automatisieren die Verhaltensinitiierung und reduzieren die Abhängigkeit von bewusster Kontrolle. Fogg-Modell: B = MAP (Behavior = Motivation × Ability × Prompt) — bei ADHS: Ability senken (kleiner machen), Prompts externalisieren. Reibungsreduktion: jede Hürde zwischen Wunsch und Handlung abbauen (Wasserflasche sichtbar, Sportschuhe vor die Tür, Supplemente neben die Kaffeemaschine). Body Doubling (parallel mit einer anderen Person arbeiten, physisch oder virtuell) hilft beim Starten und Fokussieren. Rückschläge sind strukturell, nicht motivational — Muster erkennen statt bestrafen. Interessebasiertes Nervensystem: Neuheit/Interesse/Dringlichkeit motivieren stärker als "Wichtigkeit" allein.

Erklärung für Gespräche (60 Sek.): "Bei ADHS funktioniert das Gehirn wie ein Computer mit wenig Arbeitsspeicher — man kann sich nicht einfach erinnern und dann tun. Die Lösung: externe Systeme bauen. Eine Wenn-Dann-Regel, ein sichtbarer Trigger. Man braucht keine Willenskraft, sondern ein System, das den Schritt sichtbar macht."

Typische Probleme: "Ich habe 10 Routinen probiert, keine hat gehalten" (zu groß/zu viele/keine externen Trigger), "Ich brauche immer etwas Neues", "Ich starte nicht" (Handlungsinitiierungs-Hürde), "Wenn es einmal nicht klappt, gebe ich auf" (All-or-Nothing).

Coaching-Fragen: "Was ist deine aktuelle Morgen-/Abendroutine, gibt es eine?" / "Welche Gewohnheit hat früher funktioniert, was war da anders?" / "Wie könnte die kleinstmögliche Version aussehen?" / "Welcher Trigger könnte dich erinnern?" / "Was passiert, wenn du sie mal verpasst — wie gehst du damit um?"

Experimente: Tiny — eine Wenn-Dann-Regel, 7 Tage. Standard — Morgenroutine mit 3 Schritten definieren, Compliance tracken. Advanced — Body Doubling 3× pro Woche 30 Min. + Reibungsanalyse aller Routinen.

Rot-Flags → Fachperson: extreme Impulsivität mit Gefährdung → Arzt, Suchtverhalten (z.B. zwanghaftes Scrollen) → Psychotherapeut, wenn Routinen-Frust in Selbstabwertung/Scham kippt → Validierung + Psychoedukation, bei Bedarf Psychotherapie. Nie sagen "Routinen heilen ADHS".$$),

('supplemente', 'Supplemente-Modul: Wissenschaft, Gespräch, Grenzen', $$Hintergrund: Die S3-Leitlinie empfiehlt Nahrungsergänzungsmittel (Vitamine, Mineralstoffe, Spurenelemente) NICHT als ADHS-Intervention. Omega-3/6: keine Leitlinien-Empfehlung, Studienlage gemischt. Menschen mit ADHS weisen häufiger niedrigere Spiegel von Eisen, Zink, Magnesium und Vitamin D auf — das bedeutet NICHT, dass der Mangel ADHS verursacht oder dass Supplementierung ADHS behandelt. Eisen ist wichtig für die Dopamin-Produktion, Evidenz für Supplementierung aber unzureichend. Zink: eine Studie zeigte Besserung unter 40mg/Tag, reicht nicht für Leitlinien-Empfehlung. Magnesium: Symptomüberschneidung mit Mangel, Messung ist aber ärztlich. Vitamin D + Magnesium kombiniert zeigte in einer kleinen RCT Verbesserung, weitere Forschung nötig. GRUNDSATZ: nie verschreiben, empfehlen oder dosieren — nur dokumentieren, was jemand nimmt, und bei Fragen an den Arzt verweisen.

Erklärung für Gespräche (60 Sek.): "Es gibt Supplements, die im ADHS-Kontext diskutiert werden — Omega-3, Magnesium, Eisen, Zink, Vitamin D. Die Studienlage ist gemischt: manche Menschen mit ADHS haben niedrigere Werte, aber die Leitlinie empfiehlt keine Supplemente als Behandlung. Bei Verdacht auf einen Mangel: Blutwerte beim Arzt checken lassen. Ich kann und darf keine Supplemente empfehlen."

Typische Probleme: "Ich nehme 10 verschiedene und weiß nicht, was wirkt", "Ich habe im Internet gelesen, dass Omega-3 hilft", "Ich vergesse die Einnahme", "Mein Arzt hat nichts gesagt, ich probiere trotzdem alles".

Coaching-Fragen: "Welche Supplemente nimmst du aktuell, wer hat sie empfohlen?" / "Hast du deine Blutwerte checken lassen?" / "Wo stehen sie, siehst du sie täglich?" / "Hast du Nebenwirkungen bemerkt?" / "Hast du mit Arzt/Apotheker über Wechselwirkungen gesprochen?"

Experimente: Tiny — Supplemente an sichtbaren Ort stellen. Standard — feste Einnahmezeit + Wenn-Dann, Tracking. Advanced — Supplement-Liste erstellen und MIT DEM ARZT besprechen (nötig/nicht nötig/Wechselwirkungen).

Rot-Flags → Arzt: alle Dosierungsfragen, alle "Welches Supplement soll ich nehmen?", Wechselwirkungen mit Medikamenten, Eisensupplementation ohne Blutwert (Überdosierungsgefahr). Nie die Aussage "hilft bei ADHS" zu einem konkreten Supplement treffen.$$),

('medikamente', 'Medikamente-Modul: Wissenschaft, Gespräch, Grenzen', $$Hintergrund: ADHS-Medikamente werden ausschließlich von Fachärzten verschrieben und eingestellt — der Coach/Aka hat hier keine Kompetenz außer Dokumentation und Beobachtung. Stimulanzien: Methylphenidat (Ritalin, Medikinet, Concerta), Amphetamin-Derivate (Elvanse/Vyvanse, Attentin) — wirken über Dopamin-/Noradrenalin-Wiederaufnahme. Nicht-Stimulanzien: Atomoxetin (Strattera), Guanfacin (Intuniv). Die S3-Leitlinie empfiehlt bei Erwachsenen Pharmakotherapie als primäre Option (neben Psychoedukation), wenn vom Patienten gewünscht. Bei medikamentöser Behandlung sollen Körpergewicht (initial nach 3 und 6 Monaten, dann halbjährlich) sowie Puls/Blutdruck (bei Dosisanpassung bzw. halbjährlich) ärztlich kontrolliert werden. Cannabis soll laut Leitlinie NICHT zur ADHS-Behandlung eingesetzt werden. Häufige Nebenwirkungen: Appetitverlust, Schlafstörungen, Blutdruckveränderungen, abendlicher "Rebound" (Stimmungsschwankung beim Nachlassen der Wirkung). Die medikamentöse Einstellung (Titration, Retard vs. Instant) dauert Wochen bis Monate und ist rein ärztlich.

Erklärung für Gespräche (60 Sek.): "Medikamente sind ein wichtiger Teil der ADHS-Behandlung, aber das ist ärztlich. Ich kann dazu keine Empfehlung geben. Was ich tun kann: gemeinsam dokumentieren, wann du es nimmst, wie du dich danach fühlst, welche Nebenwirkungen du bemerkst — das ist wertvolle Information für deinen Arzt. Und wir können eine Frage-Liste für den nächsten Arzttermin vorbereiten."

Typische Probleme: "Ich vergesse mein Medikament" (fehlende Einnahme-Routine), "Ich nehme es unregelmäßig", "Abends bin ich unausstehlich, wenn es nachlässt" (Rebound), "Ich möchte absetzen" (ohne ärztliche Begleitung), "Ich habe Nebenwirkungen, sage es aber dem Arzt nicht".

Coaching-Fragen: "Welches Medikament, nur Art nicht Dosis? Wann nimmst du es?" / "Wie erinnerst du dich an die Einnahme?" / "Hast du Nebenwirkungen bemerkt?" / "Wie fühlst du dich, wenn es nachlässt?" / "Was würdest du deinem Arzt gerne fragen?"

Experimente: Tiny — Medikament an sichtbaren Ort (z.B. neben Zahnbürste) + Wenn-Dann. Standard — Einnahme-Tracker (wann, wie gefühlt: Energie/Fokus/Stimmung 1-5) 1 Woche, dann mit Arzt besprechen. Advanced — Frage-Liste für den Arzttermin gemeinsam vorbereiten.

Rot-Flags → IMMER Arzt: alle Dosisfragen, "welches Medikament", "soll ich absetzen", Interpretation von Nebenwirkungen, Cannabis-Selbstmedikation, Medikamentenmissbrauch (Dosiserhöhung, Doppeldosis).$$)

;
