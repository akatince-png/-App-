# Abschluss: Team-Vergleich Sonne vs. Mond (21.09.–24.10.2026)

**Kurzfazit:** Fünf Wochen lang liefen sechs Bot-Konten täglich durch die App: zwei Teams mit je zwei Personen und zwei Einzelpersonen. Die App lief am Ende stabil. Die Punkte und die Team-Liga sind fair verteilt, die Zeit-Hinweise treffen genau die Personen, für die sie gedacht sind, und das Kernprogramm hat sich Woche für Woche wie geplant aufgebaut. Die größte Lücke liegt nicht in der App, sondern im Test selbst: Abendroutine und Tagebuch hat der Bot nie durchlaufen.

## Aufbau
| Person | Team | Rolle im Test |
|---|---|---|
| Claude | Sonne | pünktlich, sehr fleißig |
| Mia | Sonne | morgens meist ~45 Min. später |
| Jonas | Mond | Schichtarbeit (Frühschicht ab 04:30) |
| Lea | Mond | an ~3 von 5 Tagen später |
| Test 1 | – | Einzelperson ohne Team |
| Admin-Test | – | Admin-Konto, zusätzlich Coach-Livetest |

Alle Konten liefen mit 95 % Fleiß, ohne Pausentage.

## Punkte je Woche
Quelle: `_punkte_ereignisse` (dieselbe Zählung wie Rangliste und Team-Statistik). Zwischen 12. und 18.10. gab es keine Läufe. In der Woche 28.09. lagen Läufe nur an zwei gezählten Tagen.

| Woche ab | Claude | Mia | **Sonne** | Jonas | Lea | **Mond** | Test 1 | Admin-Test |
|---|---|---|---|---|---|---|---|---|
| 21.09. | 50 | 50 | **100** | 39 | 39 | **78** | 34 | 31 |
| 28.09. | 24 | 24 | **48** | 21 | 23 | **44** | 24 | 24 |
| 05.10. | 71 | 72 | **143** | 74 | 68 | **142** | 65 | 65 |
| 12.10. | – | – | – | – | – | – | – | – |
| 19.10. | 61 | 59 | **120** | 64 | 65 | **129** | 58 | 65 |

## Fairness von Punkten und Liga
- **Gleich fleißig heißt gleich viele Punkte.** In vollen Wochen liegen alle sechs Konten innerhalb von ±10 %, zum Beispiel in der Woche ab 05.10. zwischen 65 und 74 Punkten. Unterschiede kommen vom Zufall des Fleiß-Werts, nicht von der Rolle.
- **Wer später startet, verliert keine Punkte.** Mia (Ø 07:48) liegt gleichauf mit Claude (Ø 07:09). Das ist gewollt: Erledigt zählt, nicht pünktlich. Pünktlichkeit zeigt die App über die Zeit-Hinweise, ohne zu bestrafen.
- **Schichtarbeit wird nicht benachteiligt.** Jonas holt mit Frühschicht-Zeiten genauso viele Punkte wie die anderen.
- **Team-Liga:** Beide Teams lagen jede Woche nah beieinander (Abstand höchstens 22 Punkte, meist unter 10; Endstand der letzten Woche Sonne 120 : Mond 129). Die Führung wechselte: in den ersten Wochen Sonne, in der Woche 19.10. Mond. Kein Team setzt sich dauerhaft ab. In vollen Wochen erreichen beide das Wochenziel (100), in Wochen mit wenigen Lauftagen (28.09.) nicht.
- **Einzelpersonen** (Test 1, Admin-Test) sammeln genauso Punkte und erscheinen in der Personen-Rangliste. Die Team-Liga zeigt nur Teams.

## Wirkung der Zeit-Hinweise (Grenzwert: 3 von 5 Tagen > 30 Min. später, dann 1 Woche Ruhe)
| Person | Morgenroutine geplant | Ø Start | Tage > 30 Min. später | Hinweis erschienen |
|---|---|---|---|---|
| Claude | 07:00 | 07:09 | 0 | nein ✔ |
| Mia | 07:00 | 07:48 | 17 von 17 | ja ✔ |
| Lea | 07:00 | 07:36 | 10 von 16 | ja ✔ |
| Jonas | 07:00 (Schicht ab 04:30) | 05:55 | 5 von 14 | laut Tagesberichten nein |
| Test 1 | 07:00 | 07:07 | 0 | nein ✔ |
| Admin-Test | 07:00 | 07:07 | 0 | nein ✔ |

Die Grenzwerte treffen genau die beiden, die wirklich regelmäßig später anfangen. Die Woche Ruhe nach einem Hinweis verhindert, dass die Person täglich ermahnt wird. Bei Jonas ist der Schnitt (05:55) wenig aussagekräftig: An Frühschicht-Tagen startet er um 04:30, an freien Tagen (Wochenende) gegen 08:00. Die fünf „späten“ Tage sind genau diese freien Tage, Ende September drei hintereinander (26., 27., 29.09.). In den Tagesberichten wurde für ihn kein Zeit-Hinweis gemeldet. Ob die Schichtkarte das bewusst verhindert, ist nicht gezielt geprüft – das sollte vor echten Testern einmal nachgesehen werden, damit Schichtarbeitende an freien Tagen nicht ermahnt werden. Empfehlung: Die Grenzwerte so lassen.

## Kernprogramm (Etappe 1, 28.09.–25.10.)
- Die Pflicht-Schritte kamen Woche für Woche bei allen sechs Konten dazu: W1 fünf, W2 sieben, W3 neun, W4 elf.
- In der Coach-Übersicht stand jede Woche der richtige Kurzstatus „🧭 Einführung · W…“. Seit 23.10. erscheint wie geplant „💬 Etappen-Gespräch fällig“.
- Die Morgenroutine wurde an allen Lauftagen abgeschlossen. Die Abendroutine und das Tagebuch hat der Bot **nie** durchlaufen (bekannte Lücke). Für diese beiden Bereiche gibt es also keine Testerfahrung.

## Stabilität über die Zeit
- In den ersten Wochen fanden die Läufe App-Fehler, die jeweils behoben wurden (Einzelheiten in den Tagesberichten). In den letzten Wochen gab es keine App-Fehler mehr.
- Wiederkehrende Störungen kamen von außen: einzelne 502-Antworten der Test-Umgebung, und Nachladefehler, wenn während eines Laufs eine neue App-Version erschien. Seitdem gilt: während der Läufe nichts veröffentlichen.
- Ein offener kleiner Befund: „Dein Coach hat geschrieben“ blieb bei Jonas zweimal nach dem Lesen stehen (08.10., 22.10.). Das ist noch nicht geklärt.
- Ablauf-Pannen lagen bei mir, nicht bei der App: Am 21.10. ist ein Lauf ausgefallen, am 22.10. wurde das Sperren der Konten verspätet nachgeholt.

## Empfehlungen
1. **Abendroutine und Tagebuch in den Bot aufnehmen,** bevor echte Tester starten. Das ist die größte Testlücke.
2. **„Coach hat geschrieben“-Hinweis** gezielt untersuchen, und prüfen, wie die Zeit-Hinweise mit freien Tagen von Schichtarbeitenden umgehen.
3. **Grenzwerte der Zeit-Hinweise beibehalten.**
4. **Punkte und Liga unverändert lassen.** Sie sind fair, und kein Team setzt sich dauerhaft ab.
5. **Kurzfassung der Routinen** (seit 24.10.) im Bot mitprüfen, also einmal pro Woche die „⚡ Kurz“-Variante.
6. Für den Live-Start den Bot nicht täglich, sondern als feste Prüfung vor jeder Veröffentlichung laufen lassen (Punkt 2 der vorgemerkten Live-Start-Liste).

## Frage an die Nutzerin
Soll der tägliche Test weiterlaufen? Mein Vorschlag: täglich bis die Abendroutine im Bot ist, danach als Prüfung vor jeder Veröffentlichung.
