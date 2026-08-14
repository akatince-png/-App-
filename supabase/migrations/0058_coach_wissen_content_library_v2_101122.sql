-- Vierte Ergänzungsrunde der Wissens-Basis (coach_wissen, 0046) — Auswertung
-- der von der Nutzerin überarbeiteten Neufassung der Dossiers 101-122
-- ("AKA_Content_Knowledge_Library_101122_RESEARCHED_V2.pdf"). Diese Dossiers
-- waren in 0054 wegen nachweislich leerer Platzhalter bewusst NICHT
-- übernommen worden; die Nutzerin hat ChatGPT die Inhalte überarbeiten
-- lassen und neu hochgeladen. Dieser Befund gilt für die vorliegende V2:
--
-- BEFUND ZUR QUELLENQUALITÄT DER V2-FASSUNG: Die neue Version ist kein
-- reiner Platzhalter mehr — jedes der 22 Dossiers (101-122) enthält jetzt
-- tatsächlich EINEN echten, meist evidenzgestützten Kernsatz ("Kernthese")
-- direkt unter dem Titel, teils mit konkreter Studien-/Metaanalyse-Angabe
-- (z. B. Dossier 105: "2026 meta-analysis found acute exercise moderately
-- improved inhibitory control"; Dossier 117: "meta-analysis of 48 RCTs/9,618
-- participants" zu Motivational Interviewing; Dossier 120: "meta-analysis
-- of 138 studies/19,951 participants" zu Progress-Monitoring). ABER: Die
-- acht Unterabschnitte "02 Studientyp" bis "08 Quellenapparat" sind über
-- ALLE 22 Dossiers hinweg WORTIDENTISCH (derselbe generische
-- Methodik-/Grenzen-/Dramaturgie-Text, dieselben vier PMID-Referenzen für
-- 101-111 bzw. dieselben vier ICF-Referenzen für 112-122) — sie sind also
-- Formatvorlage, keine themenspezifische Vertiefung. Für coach_wissen wurde
-- deshalb ausschließlich der jeweilige Kernsatz pro Dossier als Faktenbasis
-- verwendet, nicht der wiederholte Rahmentext. Der Abschnitt "07 Content /
-- Vortragsregie" (Hook → Alltagsszene → ... → CTA) ist wie in 0053/0054
-- reine Präsentations-Dramaturgie für ihre eigene Content-Produktion und
-- wurde konsequent nicht übernommen.
--
-- BLOCK G ("ACA / INTEGRATION / COACHING", Dossiers 112-122) — genau der im
-- Auftrag benannte Risikobereich für Business-/Curriculum-Material: Bei
-- Durchsicht zeigte sich, dass die Dossiers 112 (Erstgespräch), 113
-- (Anamnese vs. Intake), 114 (Coachingfragen statt Ratschläge), 115
-- (Aktives Zuhören), 116 (Spiegeln/Zusammenfassen) und 122 (Coachinggrenzen)
-- inhaltlich das wiederholen, was in coach_wissen bereits ausführlicher und
-- AKA-spezifisch steht: "Rolle & Grenzen: Coaching ist keine Therapie" +
-- "Rolle & Grenzen: weitere schwierige Gesprächsmomente" (0047/0050),
-- "Aktives Zuhören, Coaching-Fragen & das GROW-Modell" (0047) und
-- "Sitzungsstruktur: Intake, Follow-up, Abschluss" (0047) — diese sechs
-- Dossiers wurden NICHT übernommen, eine Wiederholung in anderen Worten
-- bringt keinen Gesprächsmehrwert und bläht die bei jeder Chat-Anfrage
-- mitgeschickte Tabelle nur auf. Ebenfalls NICHT übernommen: Dossier 105/106
-- (Team-/Einzelsport) — die Kernaussage ("keine 'beste' Sportart, Adhärenz
-- zählt mehr als Sportart-Wahl", Closed-/Open-Skill-Unterscheidung) steht
-- bereits vollständig im "Training-Modul: Vertiefung & Klienten-FAQ" (0050);
-- die neue 2026-Metaanalyse zu akuter Bewegung liefert keinen zusätzlichen
-- Coaching-relevanten Fakt gegenüber dem dort bereits erklärten
-- Dopamin-/Noradrenalin-Mechanismus.
--
-- Tatsächlich NEU und übernommen (5 Einträge, siehe unten): die
-- Alltags-/Lebensphasen-Dossiers aus Block F (Studium/Selbstständigkeit/
-- Schulzeit rückblickend, Freundschaft/Vaterschaft/Männerrollen, soziale
-- Anerkennung/"Gefühl hinterher zu sein"), eine Präzisierung zum bereits
-- bestehenden "Masking"-Lexikoneintrag (0050) auf Basis eines 2026er
-- Fachkommentars, sowie ein einziger gebündelter Eintrag zu vier
-- Coaching-Werkzeugen aus Block G (Motivational Interviewing, Zielsetzung/
-- SMART-Kritik, Verhaltensexperimente, Fortschritts-Monitoring), der
-- bewusst NUR die neuen Evidenzgrößen ergänzt, statt die bereits an anderer
-- Stelle ausführlich behandelten Grundlagen (GROW, Experiment-Methodik)
-- erneut zu erklären.
--
-- Damit bleibt diese Migration im unteren Bereich der im Auftrag genannten
-- Spanne (8-15 Zeilen) bzw. leicht darunter — das ist eine bewusste
-- Entscheidung, kein Zufall: Der Großteil von Block G ist generische
-- Coaching-Methodik, die entweder schon vorhanden ist oder (ICF-Ethikkodex-
-- Zitate, Erstgesprächs-Ablauf) näher an "wie man Coaching als Programm
-- betreibt" liegt als an Wissen, das Aka in einem einzelnen Gespräch mit der
-- Endnutzerin braucht. Alle neuen Einträge halten die etablierte Trennung
-- Fakt/Hypothese/Coaching-Beobachtung ein und enden auf eine
-- gesprächstaugliche Kernaussage bzw. Coaching-Frage. bereich = null für
-- alle fünf Einträge (allgemeines Gesprächswissen, kein eigenes Modul).

insert into public.coach_wissen (bereich, titel, text) values

(null, 'ADHS im Studium, im Beruf und beim Blick auf die eigene Schulzeit', $$Drei Lebensphasen, die im Gespräch oft mit dem falschen Erklärungsmuster verknüpft werden. Studienerfolg hängt in erster Linie von exekutiven Fähigkeiten ab — Zeitmanagement, Selbstorganisation, ein Umfeld mit ausreichend externer Struktur (Deadlines, Seminarrhythmus, feste Termine) —, nicht direkt von Intelligenz oder Motivation. Hohe Intelligenz kompensiert im Studium oft jahrelang schwache exekutive Funktionen, bis Anforderungen ohne feste Tagesstruktur (Abschlussarbeit, mehrere parallele Fristen) diese Kompensation übersteigen — ein häufiger Moment, in dem Menschen erstmals über eine ADHS-Abklärung nachdenken. Selbstständigkeit erhöht die Autonomie, entfernt aber gleichzeitig die externe Struktur, die ein Angestelltenverhältnis fast automatisch mitbringt (feste Zeiten, Vorgesetzte, Teamrhythmus) — die Forschungslage dazu ist deutlich dünner als zu ADHS im Angestelltenverhältnis allgemein, ein Coaching-System muss sich hier eher auf allgemeine Selbstregulationsforschung stützen als auf spezifische Selbstständigkeits-Studien. Der Blick zurück auf die eigene Schulzeit ("War das schon immer so?") kann helfen, wiederkehrende Muster zu erkennen, ist aber keine Diagnostik — Erinnerung ist rekonstruktiv und wird im Rückblick durch das aktuelle Selbstbild eingefärbt; eine Rückblick-Checkliste ersetzt keine fachärztliche Untersuchung.

Coaching-Takeaway: Bei "Ich schaffe es einfach nicht" in Studium oder Selbstständigkeit zuerst nach der fehlenden EXTERNEN Struktur fragen, bevor an Motivation oder Intelligenz gezweifelt wird — und ein Blick zurück dient dem Musterverstehen, nicht der Selbstdiagnose.$$),

(null, 'ADHS in Freundschaft, Vaterschaft und männlichen Rollenbildern', $$Drei miteinander verwandte Beziehungsthemen. Erwachsene mit ADHS berichten häufiger von Schwierigkeiten, Freundschaften über Zeit aktiv zu pflegen — wer sich nicht meldet, wird nicht vergessen, gerät aber leicht "aus dem Blick". Freundschaft selbst ist ein für Wohlbefinden relevanter Faktor, weshalb sich ein Coaching-Ziel eher auf sichtbare Kontakt-Systeme (feste Erinnerungen, wiederkehrende Verabredungen) richten sollte als auf das vage Ziel "sozialer werden". Elternschaft ist grundsätzlich ein Umfeld mit hoher exekutiver Last (Zeitpläne, ständige Prioritätswechsel, wenig Pufferzeit) — Elterntrainings mit ADHS-Bezug sind vor allem für Kinder und Familien insgesamt untersucht, spezifische Evidenz zu Vätern mit eigenem ADHS ist dünner. Ein realistisches Coaching-Ziel ist deshalb nicht Perfektion, sondern verlässliche, wiederholbare Routinen plus eine geübte Reparatur nach Ausrutschern (kurz ansprechen, nicht ausufernd rechtfertigen). Zu männlichen Rollenbildern zeigt die Forschung reale Unterschiede in Symptompräsentation und Begleiterkrankungen zwischen den Geschlechtern — daraus lässt sich aber NICHT ableiten, dass "Männlichkeitsnormen" ADHS verursachen oder verstärken; belastbar ist dagegen, dass Normen rund um Emotionsausdruck, Hilfesuchverhalten und Verantwortungsübernahme beeinflussen, wie offen jemand über Schwierigkeiten spricht.

Coaching-Takeaway: Bei Vätern und bei Freundschaftsthemen zuerst nach dem sichtbaren System fragen ("Wie erinnerst du dich, wie reparierst du Ausrutscher?"), nicht nach Charakter oder Willen — und Rollenbilder als Erklärung für offenes oder verschlossenes Verhalten nutzen, nie als Ursachenbehauptung für ADHS selbst.$$),

(null, 'Soziale Anerkennung und das Gefühl, im Leben "hinterher" zu sein', $$Zwei eng verwandte Selbstwert-Themen aus der Stigma- und Erwachsenen-ADHS-Forschung. Wahrgenommene und verinnerlichte Stigmatisierung ("Andere halten mich für unzuverlässig" — und schlimmer: man übernimmt dieses Bild selbst) hängt in Studien mit geringerem Selbstwert, weniger Offenheit über die eigene Situation und schlechterer Lebensqualität zusammen. Daraus lässt sich eine coaching-relevante, aber unbewiesene Arbeitshypothese ableiten: Bei manchen Menschen kann die Suche nach äußerer Anerkennung zu einem eigenen Verhaltenstreiber werden (z. B. Überarbeiten, um Zweifel an der eigenen Kompetenz zu widerlegen) — das ist eine im Gespräch beobachtbare Dynamik, keine diagnostische Aussage. Eng verwandt ist das häufig berichtete Gefühl, gemessen an Alter oder Lebensmeilensteinen "hinterher" zu sein (Job, Beziehung, Wohnsituation im Vergleich zu Gleichaltrigen) — dieses Gefühl ist subjektiv real und ernst zu nehmen, das Grübeln darüber hilft aber selten weiter. Der praktisch wirksamere Hebel ist, den Vergleich mit einer chronologischen Norm ("mit 30 sollte ich...") durch einen Vergleich mit den eigenen, konkreten und erreichbaren nächsten Schritten zu ersetzen — ein System, das Fortschritt sichtbar macht, wirkt gegen dieses Gefühl direkter als bloßer Zuspruch.

Coaching-Takeaway: Bei "Ich bin hinterher"-Aussagen nicht trösten oder relativieren, sondern von der Alters-/Vergleichsfrage weg- und zur konkreten nächsten erreichbaren Bewegung hinführen: "Woran würdest du in den nächsten zwei Wochen merken, dass es vorwärtsgeht?"$$),

(null, 'ADHS und "Masking": Vorsicht beim Übertragen aus der Autismus-Forschung', $$Präzisierung zum bestehenden Lexikon-Eintrag "Masking/Camouflaging" (0050): Das Konzept stammt überwiegend aus der Autismus-Forschung und wurde von dort auf ADHS übertragen. Ein 2026 erschienener Fachkommentar warnt ausdrücklich davor, dass sich "Camouflaging" nicht einfach 1:1 von Autismus auf ADHS übertragen lässt — die Konstruktvalidität, also ob wirklich dasselbe Phänomen gemessen wird, ist für ADHS spezifisch bislang unzureichend geklärt. Praktisch bedeutet das: Wenn jemand im Gespräch beschreibt, ständig "funktionieren zu müssen" und dabei ADHS-typisches Verhalten zu unterdrücken (Bewegungsdrang zurückhalten, exzessive Vorbereitung, permanentes Selbstmonitoring in sozialen Situationen), ist das ein reales, ernstzunehmendes und erschöpfendes Muster. Sprachlich lohnt es sich trotzdem, vorsichtiger von "Kompensationsstrategien" statt pauschal von "Masking" zu sprechen, weil Letzteres unausgesprochen ein aus einem anderen Störungsbild importiertes Erklärungsmodell mitschleppt, das für ADHS noch nicht ausreichend eigenständig belegt ist. Das ändert nichts an der grundsätzlichen Beobachtung (Menschen kompensieren, das kostet Energie, das kann zu Erschöpfung führen) — es ist eine Präzisierung der Begrifflichkeit, keine Widerlegung des Phänomens.

Coaching-Takeaway: Das Phänomen ernst nehmen und benennen, aber eher von "Strategien, mit denen du dich anstrengst, um zu funktionieren" sprechen als unreflektiert den Autismus-Fachbegriff zu übernehmen — Sprache aus einem anderen Störungsbild kann falsche Gleichsetzungen nahelegen.$$),

(null, 'Coaching-Werkzeuge vertieft: Motivational Interviewing, Zielsetzung, Verhaltensexperimente, Monitoring', $$Vier Ergänzungen mit konkreten Evidenzgrößen zu bereits bestehenden Coaching-Grundlagen (GROW-Modell, Experiment-Methodik, Sitzungsstruktur) — hier bewusst nicht erneut erklärt, sondern nur um Zahlen/Nuancen erweitert. Motivational Interviewing (MI, im Lexikon bereits kurz erwähnt) ist eine aus Suchtberatung/Psychotherapie stammende, auf Ambivalenz-Klärung spezialisierte Gesprächshaltung; eine Metaanalyse mit 48 randomisiert-kontrollierten Studien und 9.618 Teilnehmenden fand einen moderaten Gesamtvorteil gegenüber Kontrollbedingungen. Der Wirkmechanismus wird vor allem im "MI-Spirit" (Autonomie respektieren, nicht überreden) und in "Change Talk" gesehen — die Person spricht ihre eigenen Veränderungsgründe selbst aus, statt sie geliefert zu bekommen. Zur Zielformulierung zeigt die Zielsetzungsforschung insgesamt einen kleinen, aber robusten positiven Effekt auf Verhaltensänderung — entscheidend ist dabei laut Studienlage weniger, ob ein Ziel dem SMART-Schema folgt, sondern ob es bedeutsam, herausfordernd-aber-erreichbar, beobachtbar und mit einer konkreten Handlung verknüpft ist; SMART ist ein Hilfsmittel, keine Erfolgsgarantie. Verhaltensexperimente (strukturierte Tests einer konkreten Vorhersage, "Wenn ich X mache, erwarte ich Y") sind keine unkontrollierten Übungen, sondern eine Methode mit Evidenz vor allem aus der Angststörungsforschung — im Coaching-Kontext sollten sie entsprechend niedrigschwellig bleiben. Fortschritts-Monitoring hat eine breite Evidenzbasis: Eine Metaanalyse über 138 Studien und rund 19.951 Teilnehmende fand, dass Monitoring-Interventionen die Zielerreichung mäßig, aber verlässlich verbessern — das untermauert das bestehende Prinzip "Rückfall ist ein Neustart-Protokoll, kein moralisches Versagen" mit einer konkreten Evidenzgröße. Wichtig dabei: Externes Monitoring wirkt nur im Rahmen von Autonomie und klaren Absprachen — Sichtbarkeit von Fortschritt ist das Ziel, nicht Überwachung oder Abhängigkeit von externer Kontrolle.

Coaching-Takeaway: Bei Ambivalenz eher die eigenen Gründe der Person herausfragen als überzeugen wollen; bei Zielen auf Beobachtbarkeit und Anschluss an eine Handlung achten statt am SMART-Wortlaut zu kleben; Tracking so gestalten, dass Fortschritt sichtbar wird, ohne wie Kontrolle zu wirken.$$)

;
