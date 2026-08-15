-- Befüllung der Wissens-Basis (coach_wissen, 0046) aus dem eigenständigen
-- Curriculum "Das ADHS-Paradoxon" (Wissenschaft, Biografien, Fragebogen und
-- Coaching-Framework für Lebensrahmenbedingungen), von der Nutzerin
-- bereitgestellt. Ergänzt die 10-Protokolle-Wissensbasis (0047/0050) um das
-- Thema Person-Environment-Fit/Lebensrahmenbedingungen — bewusst als
-- bereichsübergreifende (bereich = null) Einträge, analog zu den
-- "Sonderthemen"-Einträgen in 0050, weil das Thema keinem einzelnen der 8
-- Protokoll-Bereiche zugeordnet ist.
--
-- Der zugehörige Lebensrahmenbedingungen-Fragebogen selbst ist NICHT hier,
-- sondern als eigenständiges, digital ausfüllbares Formular 11
-- ("Der Passungs-Check") in formulareVorlagen.js/AdminFormulareView.jsx
-- umgesetzt — diese Migration liefert nur das Hintergrundwissen für Akas
-- Gesprächskontext, nicht das Erhebungsinstrument selbst.

insert into public.coach_wissen (bereich, titel, text) values

(null, 'ADHS-Paradoxon: Wissenschaft — Schutzfaktoren & Person-Environment-Fit', $$Ausgangsbeobachtung: Zwei Menschen mit vergleichbarer ADHS-Ausprägung können völlig unterschiedliche Lebenswege nehmen — der eine baut ein Unternehmen auf, die andere zerbricht an Schulden, Beziehungsabbrüchen und Selbstvorwürfen. Nicht die ADHS-Diagnose selbst entscheidet über Erfolg oder Misserfolg, sondern das Zusammenspiel mehrerer Faktoren: Lebenserfolg bei ADHS ≈ interne Schutzfaktoren (Selbstverständnis, Coping, Resilienz) × externe Passung (Umgebung, Beziehungen, Arbeitsform) — nicht die Schwere der Symptomatik allein.

Schutzfaktoren aus der Forschung: Gewissenhaftigkeit und Extraversion sind mit besserem Funktionieren assoziiert. Emotionsfokussierte, adaptive Coping-Strategien hängen mit besserem Funktionieren im sozialen Umfeld zusammen. Positive Kindheitserfahrungen korrelieren mit besserem Funktionieren im Erwachsenenalter — ein Hinweis darauf, wie wichtig frühes Verständnis statt früher Beschämung ist. Verfügbare, verlässliche soziale Unterstützung wirkt konsistent protektiv. Resilienz, Mut, Selbstakzeptanz, Motivation und Neugier sind erlernbare Komponenten von Lebenserfolg, keine angeborene Glückssache.

Der Struktur-Paradox: Das ADHS-Gehirn lehnt Struktur nicht grundsätzlich ab — es lehnt schlechte Struktur ab, die nicht zu seiner Funktionsweise passt. Wenn eine Klientin "Struktur" bisher immer als Fremdkörper erlebt hat, war es wahrscheinlich die falsche Struktur, nicht zu viel oder zu wenig Struktur an sich.

Person-Environment-Fit ("Goodness of Fit") ist wahrscheinlich die wichtigste Einzelvariable für Arbeitszufriedenheit, Jobverbleib und berufliche Anpassung bei Erwachsenen mit ADHS. Selbstständigkeit und Unternehmertum korrelieren überdurchschnittlich oft mit ADHS-Merkmalen: Reizsuche, Handlungsorientierung mit wenig Vorplanung und ein starkes Autonomiebedürfnis — klassisch als Defizite gerahmt — werden im unternehmerischen Kontext zu funktionalen Stärken. Viele erfolgreiche Menschen mit ADHS wurden nicht trotz, sondern über den Weg der Selbstständigkeit erfolgreich: Sie haben sich die Umgebung gebaut, die zu ihnen passt, statt sich einer Umgebung anzupassen, die nicht passte.

Stärken-Forschung nennt wiederkehrend: Kreativität und divergentes Denken, hohe Energie und Antrieb, Hyperfokus, Abenteuerlust, Risikobereitschaft, Empathie sowie Individualität, Authentizität und Autonomie. Adaptive Strategien erfolgreicher Erwachsener mit ADHS: Medikation (wo medizinisch indiziert), Selbstkenntnis, konsequente Externalisierung von Aufgaben, klare Kommunikation, aktives Management von Ablenkung, bewusste Wahl der passenden Arbeitsform (remote, hybrid, Präsenz).

Risikoseite (damit das Bild nicht einseitig "positiv denken" suggeriert): eingeschränkter Zugang zu Diagnostik und Behandlung, unbehandelte Komorbiditäten, sozioökonomische Benachteiligung, kumulative Wirkung wiederholter Beschämung in Kindheit und Jugend. Späte oder fehlende Diagnose ist selbst ein Risikofaktor — Jahre/Jahrzehnte ohne Erklärung für die eigenen Schwierigkeiten führen häufig zu einem Selbstbild aus "ich bin faul/dumm/kaputt", das sich erst mit Diagnose und Psychoedukation auflöst.

Coaching-Relevanz: Wenn Passung der entscheidende Hebel ist, dann ist es ein legitimes und wirksames Coaching-Ziel, die Lebensrahmenbedingungen einer Klientin aktiv auf Passung zu prüfen und schrittweise zu verändern — genau wie die Protokolle die gesundheitliche Passung verbessern. Dafür gibt es ein eigenes Formular ("Der Passungs-Check", Formular 11 in den Coaching-Vorlagen).$$),

(null, 'ADHS-Paradoxon: Biografische Beispiele (Biles, Phelps, Branson, Neeleman)', $$Diese vier Beispiele stammen aus öffentlich zugänglichen, von den jeweiligen Personen selbst bestätigten Angaben zu ihrer ADHS-Diagnose — keine vollständigen Biografien, kein Beleg dafür, dass Erfolg "typisch" für ADHS ist, sondern Illustrationen der oben beschriebenen Mechanismen.

Simone Biles — früh diagnostiziert, früh die passende Umgebung gefunden: Bereits im Kindesalter mit ADHS diagnostiziert, nimmt seitdem Methylphenidat. Als ihre medizinischen Daten 2016 durch einen Hackerangriff öffentlich wurden, reagierte sie offensiv statt beschämt ("Ich habe ADHS und nehme seit meiner Kindheit Medikamente dafür. Das ist nichts, wofür ich mich schäme."). Zeigt zwei Faktoren in Reinform: frühe Diagnose plus Behandlung (kein jahrelanger Leidensweg mit falscher Selbstzuschreibung) und eine hochstrukturierte, auf Wiederholung und körperliche Auslastung ausgelegte Umgebung (Spitzensport) — Person-Environment-Fit im Wortsinn.

Michael Phelps — Struktur als Rettung, und die Grenzen davon: Diagnose mit 9 Jahren. Schwimmen wurde zum entscheidenden Ventil ("im Wasser habe sich sein Kopf beruhigt, dort habe er sich zum ersten Mal in Kontrolle gefühlt") — Person-Environment-Fit über Bewegung. Wichtig für ein ehrliches Bild: Erfolg schützt nicht automatisch vor Krise. Nach jeder Olympiade fiel Phelps in eine Depression, 2014 sprach er offen davon, "dem Suizid ins Auge gesehen" zu haben — er beschreibt, wie er lange Gefühle wegdrückte statt sie zu verarbeiten. Zeigt: die passende Umgebung zu finden ist ein wichtiger, aber kein alleiniger Faktor, psychische Gesundheit bleibt auch bei äußerem Erfolg ein eigenständiges Thema.

Richard Branson — Schulversagen als Ausgangspunkt, nicht als Endpunkt: Verließ die Schule mit 15 ohne Abschluss. Ausgeprägte Legasthenie erst mit Anfang zwanzig diagnostiziert, sprach später auch offen über eine ADHS-Diagnose ("Ich hätte weder ein Magazin gegründet noch Virgin aufgebaut, wenn ich nicht legasthenisch gewesen wäre."). Coping-Prinzip: konsequent Aufgaben an andere delegieren, für die er selbst nicht die Stärke hat, sich auf große Linien statt Detailarbeit konzentrieren — "externe Strukturen bauen statt an ihnen scheitern".

David Neeleman — das Kernbeispiel für Spätdiagnose: JetBlue-Gründer, erst 2002 als Erwachsener — nach der Gründung mehrerer erfolgreicher Unternehmen — offiziell diagnostiziert. Erste Reaktion: Erleichterung ("Ich dachte einfach nur: wow, das bin ich."). Vorher hatte er geglaubt, er sei "dumm", obwohl er längst erfolgreich war. Seine Haltung danach: "Wenn du mir eine Wunderpille gäbst, die das verschwinden lässt — ich würde sie nicht nehmen." Führungsprinzip "staff your weaknesses" — Menschen um sich aufbauen, die genau dort stark sind, wo er es nicht ist, statt an den eigenen Schwächen zu arbeiten. Zeigt: der Wendepunkt ist nicht zwingend "ich werde geheilt", sondern "ich verstehe endlich, was hier die ganze Zeit passiert ist" — oft erst spät, nachdem bereits mühsam Erfolge erzielt wurden.

Was alle vier gemeinsam haben: (1) Verstehen statt Selbstvorwurf — ob früh oder spät, der Moment, in dem "ich bin faul" durch "mein Gehirn arbeitet anders" ersetzt wird, ist ein wiederkehrender Wendepunkt. (2) Stärken nutzen statt nur Defizite reparieren. (3) Die Umgebung aktiv gestalten statt sich einer schlecht passenden anzupassen. (4) Erfolg ist kein Endpunkt — psychische Gesundheit bleibt eigenständig relevant.$$),

(null, 'ADHS-Paradoxon: Coaching-Framework für Lebensrahmenbedingungen', $$Einordnung: Die Protokolle erheben die gesundheitliche Passung (Schlaf, Ernährung, Bewegung, ...). Der ergänzende Lebensrahmenbedingungen-Fragebogen ("Der Passungs-Check", Formular 11 in den Coaching-Vorlagen) erhebt die lebensweltliche Passung: Beziehung, Arbeit, Wohnraum, sozialer Kreis, Finanzen, Ziele. Beide zusammen ergeben ein vollständiges Bild von Person-Environment-Fit. Wie bei den Protokoll-Formularen gilt: reines Erhebungsinstrument für den Coach, kein diagnostisches Instrument — bei Themen jenseits von Alltagscoaching (Schulden, akute Beziehungsgewalt, arbeitsrechtliche Fragen) an die passende Fachstelle verweisen.

Grundprinzip: dieselbe Logik wie bei den Protokollen — nicht alle Lebensbereiche gleichzeitig bearbeiten, sondern schrittweise, ein Bereich nach dem anderen. Ziel ist nicht, der Klientin ihr Leben aus der Hand zu nehmen, sondern gemeinsam Rahmenbedingungen zu schaffen, die zu ihr passen — nach demselben Ist-Zustand-→-Ziel-Zustand-Prinzip wie beim GROW-Modell.

Empfohlene thematische Reihenfolge (nach Hebelwirkung und Einstiegshürde, niedrigschwellig zuerst): (1) Wohnraum & Umgebung — niedrigschwelligster Einstieg, eine Ecke neu gestalten liefert in Tagen spürbare Wirkung. (2) Hobbys & Freizeit — risikoarme, aktivierende Frage, gibt Energie zurück vor schwierigeren Themen. (3) Sozialer Kreis — bewusstmachen, welche Kontakte auftanken/auslaugen, erste kleine Grenzen setzen. (4) Beziehung & Partnerschaft — komplexer, emotional dichter, erst angehen wenn Stabilität in 1–3 erreicht ist. (5) Arbeit & Beruf — komplexeste, meist existenzangst-auslösendste Kategorie, deshalb bewusst zuletzt, eine Monate- statt Wochen-Frage.

Konkretes Vorgehen pro Bereich, derselbe Dreischritt: (1) Ist-Zustand erheben, ohne zu bewerten. (2) Ziel-Zustand konkret formulieren — nicht "ich will glücklicher sein", sondern "ich will bis [Datum] X erreicht haben". (3) Ersten kleinen Schritt mit Zeitrahmen festlegen, nach demselben Tiny-Standard-Advanced-Prinzip wie in den Protokoll-Modulen.

Praxisbeispiel einer mehrjährigen Transformation (Coach mit eigener ADHS-Diagnose, über rund drei Jahre, nicht Wochen): feste Sport-Ecke eingerichtet, damit Bewegung keine Extra-Entscheidung braucht; Supplemente in vorbereiteten Dosen sichtbar platziert; Möbel selbst gebaut, Wohnraum bewusst minimalistisch statt zufällig vollgestellt; Freundeskreis aktiv überprüft, auslaugende Kontakte reduziert; Job und Hobbys verändert, damit sie zur eigenen Arbeitsweise passen. Kein Schritt war spektakulär für sich — die Wirkung entstand durch die Summe vieler einzelner, zueinander passender Veränderungen über Zeit.

Grenzen: ersetzt keine Paartherapie, keine Berufsberatung, keine Schuldnerberatung, keine professionelle Wohnraumberatung. Die Rolle bleibt: Fragen stellen, Ist-Zustand sichtbar machen, gemeinsam kleine nächste Schritte formulieren — nicht selbst Lösungen für diese Fachbereiche liefern.$$)

;
