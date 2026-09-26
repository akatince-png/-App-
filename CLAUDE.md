# Hinweis für Claude

> **Projekt-Identität — zuerst lesen:** Dies ist **AKA**, die ADHS-
> Management-/Tracking-/Coaching-App (ursprünglich als Peptid-Tracker
> gedacht) — React + Vite + Supabase, gedacht für **eine erwachsene
> Nutzerin**. Es gibt ein **komplett separates** zweites Repo,
> `akatince-png/Kidnapp` ("Arcanova"), eine reine HTML/JS-Kinder-App für
> ADHS-Routinen (Morgen-/Abendroutine, Sternenenergie, Eltern-Dashboard).
> Beide Apps drehen sich um ADHS und ähneln sich thematisch — das hat
> schon zu Verwechslungen geführt. Bevor du hier etwas änderst: prüfe,
> dass du wirklich in diesem Repo bist (React/Vite/JSX-Dateien unter
> `src/`, nicht eine einzelne `index.html`) und nicht versehentlich
> Kontext/Aufgaben aus dem Kidnapp/Arcanova-Repo hierher überträgst.

**Lies zuerst `UEBERGABEPROTOKOLL.md` im Projekt-Root, bevor du irgendetwas
an diesem Projekt änderst.** Es ist der aktuelle, lebende Übergabestand
dieser App (Architektur, KI-Coach-System, offene Punkte, Arbeitsweise-
Hinweise) und wird laufend gepflegt.

Die allerwichtigsten Punkte daraus, falls du gerade wenig Zeit hast:

- **Philosophie (Nutzerin, 26.09.):** AKA ist eine Lifestyle-App für
  Menschen mit ADHS. Sie hilft beim Aufbau von Struktur und bündelt
  vorhandene Strukturen in einer App, auf dem interessantesten,
  benutzerfreundlichsten und effizientesten Weg: zeigen statt erklären,
  wenige Schritte. Programme (z. B. das 8-Wochen-Kernprogramm) sind
  austauschbare Pakete. Details stehen oben in `UEBERGABEPROTOKOLL.md`.
- **Leitprinzip, nicht verhandelbar:** Jede Funktion muss sowohl manuell
  als auch per KI-Coach nutzbar sein — niemals ein manuelles Formular
  entfernen oder verstecken, nur weil es jetzt auch einen KI-Weg gibt.
- **Das ganze Leben mit ADHS, alle Bausteine gleichwertig (Nutzerinnen-
  Vorgabe 25.09., präzisiert):** Medikation ist **ein** Weg unter vielen,
  nicht der Mittelpunkt. Gleichrangig: Bewegung/Sport, Ernährung,
  Supplemente, Schlaf, Tageslicht, Atemübungen, Hormone (z. B. TRT),
  körperliche Gesundheit. Die Nutzerin ist überzeugt, dass die richtigen
  Rahmenbedingungen (Umfeld, Ernährung, Supplemente, Tagesablauf) viel
  bewirken, teils Medikamente ersetzen können. Deshalb soll die App
  auch den **Kontext** erfassbar machen: wo, wann, mit wem, was gegessen,
  wie lange. Keinen Bereich in Texten, Reihenfolgen oder Vorgaben über die
  anderen stellen. Innerhalb eines Bereichs darf die Vorgabe dem
  häufigsten Fall folgen (z. B. neues Medikament = ADHS-Medikation,
  täglich), alle anderen Fälle genauso leicht erfassbar. Keine Heils- oder
  Wirkversprechen in App-Texten.
- **Admin/Coach-Seite gleichwertig testen und verschlanken (Nutzerinnen-
  Vorgabe 24.09.):** Nicht nur Gruppen und Einzelpersonen, auch das
  Admin-Konto und seine Abläufe regelmäßig live testen: Ergebnisse der
  Coachees durchsehen, Korrekturen vornehmen, mit Coachees kommunizieren.
  Dabei denselben Blick anlegen wie bei der Coachee-Seite: ADHS-tauglich,
  wenige Schritte, abspecken und verfeinern. Kommunikation läuft heute in
  der App; WhatsApp ist eine spätere Option (Datenschutz beachten), siehe
  `UEBERGABEPROTOKOLL.md`, Abschnitt „Aktueller Stand“.
- **Die Nutzerin ist nicht technisch versiert**, kommuniziert oft per
  Spracheingabe mit Transkriptionsfehlern (z. B. "Obama" = Ollama,
  "Acker"/"Ecker" = "Aka" — der App-interne KI-Coach-Name). Bei unklaren
  Nachrichten lieber kurz nachfragen als auf eine Vermutung eine größere
  Änderung bauen.
- **Supabase-Zugriff (seit 23.09.2026):** Ist der Supabase-Connector in
  der Sitzung aktiv (`mcp__Supabase__*`-Tools), kann direkt gegen das
  echte Projekt geprüft und migriert werden — Details in
  `UEBERGABEPROTOKOLL.md`, Teil 121. Produktive DB-Änderungen vorher mit
  der Nutzerin abstimmen. Ohne Connector gilt weiter: Migrationen/Edge
  Functions landen im Code, die Nutzerin spielt sie selbst ein.
- **Vor jeder Arbeit `git fetch origin main`:** Der Sitzungs-Arbeitszweig
  kann auf einem uralten Stand basieren — `main` ist immer maßgeblich.
- **Git-Workflow:** auf dem Feature-Branch arbeiten (siehe
  `UEBERGABEPROTOKOLL.md`, Abschnitt 8, für den genauen Namen), nicht
  direkt auf `main`, danach fetch + fast-forward-merge + push nach
  `main`. Vor jedem Commit: `npm run build` + `npx oxlint`.
- **Nach substanziellen Änderungen `UEBERGABEPROTOKOLL.md` aktualisieren**
  — bei viel Veränderung lieber neu schreiben statt endlos weitere
  "Nachtrag"-Absätze aufzustapeln.

Alles Weitere (Tech-Stack, Architektur, KI-Coach-Details, offene Punkte)
steht ausführlich in `UEBERGABEPROTOKOLL.md`.
