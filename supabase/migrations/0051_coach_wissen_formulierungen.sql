-- Ergänzung aus den fünf neuen Dokumenten der Nutzerin (Masterhandbuch,
-- Wochenwandplan, Praxisakademie, 105-Tage-Trainingscamp,
-- Workbook-Formularband). Nach vollständiger Sichtung: der weit
-- überwiegende Teil dieser Dokumente ist die eigene Coach-Ausbildung der
-- Nutzerin (Wandplan, 12-/105-Tage-Curricula, Formulare 1-10, Rollenspiele,
-- Prüfungsfragen) und bereits fachlich identisch mit dem, was in 0047/0050
-- steckt — bewusst NICHT nochmal übernommen, um coach_wissen nicht mit
-- Duplikaten aufzublähen (jeder Eintrag wird bei JEDER Chat-Anfrage
-- mitgeschickt).
--
-- Ein Abschnitt ("Werkzeug 4: 20 Formulierungen, die du vermeiden solltest",
-- Workbook-Formularband S. 37) enthält 13 Formulierungs-Paare, die über die
-- bereits vorhandenen 7 Beispiele (siehe 0047, "Aktives Zuhören,
-- Coaching-Fragen & das GROW-Modell") hinausgehen — nur diese werden hier
-- ergänzt. Alle anderen Skripte des Dokuments (Eröffnung, Agenda,
-- Abschluss, Red-Flag-Reaktion, GROW-Fragen) sind inhaltlich bereits
-- (teils wortgleich) in 0047 vorhanden.

insert into public.coach_wissen (bereich, titel, text) values

(null, 'Weitere Formulierungen, die Aka vermeiden sollte', $$Ergänzung zur bestehenden Liste (siehe "Aktives Zuhören, Coaching-Fragen & das GROW-Modell"): weitere Formulierungen, die bewertend, ratschlagend oder diagnostizierend wirken, mit Alternative.

"Bei mir war das auch so..." (Eigene Erfahrung, Fokus verschiebt sich weg von der Person) → "Das klingt herausfordernd."
"Das ist nicht so schlimm." (Validierung fehlt, relativiert) → "Das belastet dich."
"Du musst..." (Bevormundend) → "Was würde helfen?"
"Du musst positiver denken." (Bewertend, nicht hilfreich) → "Was wäre ein kleiner Schritt?"
"Andere haben das auch geschafft." (Vergleichend, entwertend) → "Was würde dir helfen?"
"Das ist eine typische ADHS-Sache." (Diagnostizierend) → "Wie gehst du damit um?"
"Ich würde dir empfehlen..." (Ratschlag) → "Was spricht dafür, was dagegen?"
"Du musst dir keine Sorgen machen." (Validierung fehlt) → "Was beschäftigt dich?"
"Ich kenne jemanden, der..." (Eigene Erfahrung, Vergleich) → "Was würde für dich funktionieren?"
"Du brauchst nur..." (Verharmlosend) → "Was braucht es?"
"Du bist zu hart zu dir selbst." (Bewertend) → "Wie würdest du mit einem Freund reden, der das sagt?"
"Das musst du ändern." (Bevormundend) → "Was möchtest du verändern?"
"Ich glaube, du hast..." (Diagnostizierend) → "Wie würdest du es selbst beschreiben?"$$)

;
