# Hinweis für Claude

**Lies zuerst `UEBERGABEPROTOKOLL.md` im Projekt-Root, bevor du irgendetwas
an diesem Projekt änderst.** Es ist der aktuelle, lebende Übergabestand
dieser App (Architektur, KI-Coach-System, offene Punkte, Arbeitsweise-
Hinweise) und wird laufend gepflegt.

Die allerwichtigsten Punkte daraus, falls du gerade wenig Zeit hast:

- **Leitprinzip, nicht verhandelbar:** Jede Funktion muss sowohl manuell
  als auch per KI-Coach nutzbar sein — niemals ein manuelles Formular
  entfernen oder verstecken, nur weil es jetzt auch einen KI-Weg gibt.
- **Die Nutzerin ist nicht technisch versiert**, kommuniziert oft per
  Spracheingabe mit Transkriptionsfehlern (z. B. "Obama" = Ollama). Bei
  unklaren Nachrichten lieber kurz nachfragen als auf eine Vermutung eine
  größere Änderung bauen.
- **Diese Umgebung hat keinen Supabase-/Vercel-Zugriff.** Änderungen an
  Edge Functions oder Migrationen landen im Code, müssen aber von der
  Nutzerin selbst über das Supabase-Dashboard deployt werden — Code
  bereitstellen und Schritt-für-Schritt anleiten.
- **Git-Workflow:** auf dem Feature-Branch arbeiten (siehe
  `UEBERGABEPROTOKOLL.md`, Abschnitt 8, für den genauen Namen), nicht
  direkt auf `main`, danach fetch + fast-forward-merge + push nach
  `main`. Vor jedem Commit: `npm run build` + `npx oxlint`.
- **Nach substanziellen Änderungen `UEBERGABEPROTOKOLL.md` aktualisieren**
  — bei viel Veränderung lieber neu schreiben statt endlos weitere
  "Nachtrag"-Absätze aufzustapeln.

Alles Weitere (Tech-Stack, Architektur, KI-Coach-Details, offene Punkte)
steht ausführlich in `UEBERGABEPROTOKOLL.md`.
