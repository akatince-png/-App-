-- Dritte Ergänzungsrunde der Wissens-Basis (coach_wissen, 0046) — Auswertung
-- der beiden restlichen Teile der von der Nutzerin hochgeladenen "AKA
-- Content & Knowledge Library" (drei PDFs mit insgesamt 122 nummerierten
-- Wissens-Dossiers zu ADHS/Gesundheit/Supplementen). Dossiers 01-40 wurden
-- parallel in einer separaten Migration (0053) ausgewertet; diese Migration
-- deckt Dossiers 41-80 und 81-122 ab.
--
-- WICHTIGER BEFUND ZUR QUELLENLAGE (unbedingt für künftige Ergänzungen
-- beachten): Die beiden PDFs sind qualitativ sehr unterschiedlich dicht.
-- Dossiers 41-60 ("RESEARCH EDITION") enthalten tatsächlich ausgearbeitete
-- Inhalte mit Mechanismus, WHO-/DGE-/NIH-ODS-Referenzen und teils konkreten
-- Studienangaben (z. B. Glycin-RCT mit 3g vor dem Schlafengehen, L-Theanin-
-- Metaanalyse 2026 mit 31 RCTs/1.168 Erwachsenen). Dossiers 61-122 (der
-- gesamte Rest von Datei 1 ab Seite "61-100" sowie die komplette zweite
-- Datei "81-122") bestehen dagegen NACHWEISLICH nur aus Themen-Platzhaltern:
-- Das Dokument selbst sagt es wörtlich ("Das Ausgangsmaterial liefert hier
-- den Dossier-Auftrag, aber noch keine fertige Evidenzsynthese" bzw. "Die
-- Quelle liefert hier den Themenplatz ... sie enthält nicht für jedes Thema
-- bereits eine vollständige Forschungssynthese") und wiederholt für JEDES
-- der ca. 45 Themen (u. a. NAC, Acetyl-L-Carnitin, CoQ10, Urolithin A,
-- Supplement-Stacking, alle F-Themen "ADHS und Partnerschaft/Scham/Trauma/
-- Geld/Karriere/..." bis "ADHS und das Gefühl, hinterher zu sein", sowie
-- alle G-Themen zur Coaching-Methodik) denselben generischen Textbaustein
-- ohne einen einzigen konkreten Fakt, Studienwert oder Mechanismus-Detail.
-- Diese Dossiers wurden daher BEWUSST NICHT übernommen — nicht weil sie
-- redundant wären, sondern weil sie schlicht keinen extrahierbaren Inhalt
-- enthalten. Für coach_wissen wurden ausschließlich Fakten aus tatsächlich
-- ausgearbeiteten Dossiers übernommen, nichts aus eigenem Wissen ergänzt.
--
-- Zusätzlich NICHT übernommen (echter Inhalt vorhanden, aber Duplikat):
-- Dossiers 61-70 wiederholen exakt die bereits in 41-45 behandelten Themen
-- (Glycin, Vitamin D, Eisen/Ferritin, Zink, B-Vitamine, B12, Folat, Jod,
-- Selen, Kalium) ohne neue Fakten — Vitamin D/Eisen/Zink/B12/Folat wurden
-- laut Aufgabenstellung bereits in 0053 (Dossiers 01-40) behandelt. Melatonin
-- (Dossiers 54/55/59/74) liefert inhaltlich nichts über das hinaus, was
-- coach_wissen im "Schlaf-Modul: Vertiefung & Klienten-FAQ" (0050) bereits
-- sagt ("Melatonin ist kein Beruhigungsmittel, sondern ein Zeitgeber-Signal,
-- falsches Timing kann die Phase verschieben"). Koffein als Supplement-Thema
-- (Dossiers 56/57/60/79) bringt gegenüber dem bestehenden Hydration-Modul
-- (Adenosin-Mechanismus, Halbwertszeit, Stimulanzien-Interaktion) keinen
-- neuen Fakt außer einer Umformulierung ("Netto-Effekt über 24 Stunden") —
-- zu dünn für einen eigenen Eintrag, der bei jeder Chat-Anfrage mitgeschickt
-- wird. Magnesiumbisglycinat (Dossier 72) und das zweite Kreatin-Dossier (85)
-- sind ebenfalls reine Platzhalter ohne konkrete Aussage.
--
-- Was tatsächlich übernommen wurde: 13 neue Supplement-/Nährstoff-Einträge
-- aus den Dossiers 41-56, die inhaltlich vollständig sind UND bislang in
-- coach_wissen fehlten (bestätigt per grep: es gab bisher keine
-- Einzel-Supplement-Fakten, nur das allgemeine "Supplemente-Modul" ohne
-- Wirkstoff-Details). Damit wird gezielt die von der Nutzerin priorisierte
-- Lücke geschlossen ("ergänze bitte Informationen ... zu den Supplementen").
-- Alle Einträge halten die im Projekt etablierte Trennung Fakt/Hypothese/
-- persönliche Erfahrung/medizinische Aussage ein, enthalten keine
-- Dosierungsempfehlungen und enden jeweils auf eine coaching-taugliche
-- Kernaussage. bereich = 'supplemente' (bestehender Wert aus 0047/0050,
-- keine neuen bereich-Werte eingeführt).
--
-- Bewusst weggelassen (pro Dossier-Vorlage, wie in 0047/0050 bereits
-- etabliert): Vortragsentwurf (Redemanuskript für Content), Experiment/
-- Beobachtungsprotokoll (Recherche-Selbstversuch für die Content-Erstellung
-- der Nutzerin), Coaching-Lernfunktion (Frageliste zur eigenen
-- Coach-Ausbildung) und Content-Engine/Querverbindung (Social-Media-Ideen)
-- — das ist ihr eigenes Content-Business, kein Gesprächswissen für Aka.

insert into public.coach_wissen (bereich, titel, text) values

('supplemente', 'Jod: Schilddrüse, Müdigkeit und Differenzialdiagnostik', $$Jod ist Baustein der Schilddrüsenhormone, die zahlreiche Stoffwechsel- und Entwicklungsprozesse beeinflussen. Wichtig für das Gespräch: "müde und unkonzentriert" ist ein sehr unspezifisches Symptombild — es kann ADHS sein, ein Jodmangel mit Schilddrüsenunterfunktion, oder etwas ganz anderes. Aus dem Mechanismus "Jod → Schilddrüse → Stoffwechsel" folgt NICHT automatisch "mehr Jod = mehr Energie/Konzentration", wenn die Versorgung bereits ausreicht. WHO führt Jodmangel als weltweit relevantes Ernährungsproblem, die DGE nennt Referenzwerte für die Zufuhr — beides sind Versorgungsaussagen, keine ADHS-Wirksamkeitsbelege. Es gibt keine spezifische Humanevidenz, dass Jod-Supplementierung ADHS-Symptome bei ausreichender Versorgung verbessert.

Praktisch bedeutsam ist vor allem die Differenzialdiagnostik: Wenn jemand von anhaltender Müdigkeit und Konzentrationsproblemen berichtet, lohnt sich die Frage nach Ursache, bevor voreilig "das ist eben ADHS" oder "das ist eben Jodmangel" geschlossen wird — beides kann sich symptomatisch stark ähneln, die Abklärung (inkl. Schilddrüsenwerte) ist ärztlich. Keine Jod-Hochdosierung auf Verdacht; stattdessen Ernährungsanamnese und bei begründetem Verdacht ärztliche Schilddrüsenabklärung anregen.

Coaching-Takeaway: Ein Supplement ist kein Diagnoseinstrument — bei unspezifischen Symptomen wie Müdigkeit/Konzentrationsproblemen zuerst nach der eigentlichen Ursache fragen (und an den Arzt verweisen), statt vorschnell auf ein einzelnes Nährstoffthema zu springen.$$),

('supplemente', 'Selen: enger Sicherheitsbereich trotz essenzieller Funktion', $$Selen ist Bestandteil mehrerer Selenoproteine, unter anderem Enzyme der antioxidativen Abwehr und der Umwandlung von Schilddrüsenhormonen. Die physiologische Rolle ist klar belegt — daraus folgt aber nicht automatisch, dass eine zusätzliche Supplementierung bei bereits ausreichender Versorgung einen Zusatznutzen bringt. Selen ist ein besonders anschauliches Beispiel dafür, dass "essenziell" nicht "beliebig hoch dosierbar" bedeutet: Der Sicherheitsbereich zwischen ausreichender Versorgung und Überdosierung ist bei Selen vergleichsweise schmal. WHO/DGE führen Selen als Mikronährstoff mit Referenz- bzw. Schätzwerten, nicht als "Optimierungsdosis" für kognitive oder ADHS-Zwecke — spezifische ADHS-Evidenz für Selen liegt nicht vor.

Relevant für die Praxis: Wer bereits mehrere Nahrungsergänzungsmittel nimmt (z. B. Multivitamin plus Einzelpräparate), sollte die Gesamtzufuhr über alle Produkte hinweg im Blick behalten, statt Selen isoliert zu betrachten — Überversorgung entsteht meist durch Kumulation aus mehreren Quellen, nicht durch ein einzelnes Produkt allein.

Coaching-Takeaway: "Wichtig für den Körper" ist keine Berechtigung für "viel hilft viel" — bei Selen sollte eher die Frage stehen, ob überhaupt ein Mangel oder eine medizinische Notwendigkeit besteht, nicht wie man es in den Alltag "optimierend" einbaut.$$),

('supplemente', 'Kupfer: Eisenstoffwechsel und die Zink-Kupfer-Wechselwirkung', $$Kupfer ist für mehrere Enzymsysteme sowie den Eisenstoffwechsel relevant. Der für Coaching-Gespräche wichtigste Punkt: Zink und Kupfer können sich bei hoher, chronischer Supplementzufuhr gegenseitig beeinflussen — wer über längere Zeit hochdosiert Zink supplementiert (z. B. weil es im ADHS-Kontext häufig diskutiert wird), kann dadurch indirekt den Kupferstatus verschieben. Das ist ein Grund, Supplemente nicht isoliert ("Was macht Zink?"), sondern als Gesamtsystem zu betrachten ("Was macht die Kombination all meiner Präparate über Zeit?"). Die DGE führt für Kupfer einen Schätzbereich, keine "Optimierungsdosis" — Status und Sicherheit stehen vor Stack-Erweiterung.

Für ein Coaching-Gespräch bedeutet das konkret: Bei jemandem, der bereits Zink nimmt (ob aus eigener Initiative oder nach ärztlicher Empfehlung), lohnt sich nach längerer Einnahmedauer die Frage, ob und wie oft Blutwerte kontrolliert wurden — nicht um selbst etwas zu bewerten, sondern um die Frage überhaupt sichtbar zu machen.

Coaching-Takeaway: Supplemente wirken nicht in Isolation — bei länger laufender Einnahme (insbesondere Zink) gehört die Frage nach der Gesamtzufuhr und möglichen Wechselwirkungen mit anderen Mineralstoffen ins Arztgespräch, nicht ins eigenständige Nachjustieren.$$),

('supplemente', 'Spurenelemente in Mikromengen: Mangan, Chrom, Molybdän', $$Mangan, Chrom und Molybdän sind an unterschiedlichen Enzym- und Stoffwechselprozessen beteiligt und werden in der Ernährungswissenschaft meist gemeinsam als "Spurenelemente" geführt, weil der Bedarf jeweils sehr gering ist. Ihre physiologische Notwendigkeit ist unbestritten — das ist aber kein Beleg für einen kognitiven oder ADHS-spezifischen Zusatznutzen bei Supplementierung. Die DGE führt für alle drei Referenz- bzw. Schätzwerte; diese sind Versorgungsangaben, keine Wirksamkeitsdosen für "mehr Fokus" oder ähnliche Claims.

Der praktisch wichtigste Punkt: Gerade weil die auf dem Etikett angegebenen Mengen klein wirken, entsteht leicht der Eindruck "das kann ja nicht schaden". Kleine Mengen können aber physiologisch durchaus relevant sein, und alle drei Spurenelemente sind häufig bereits in Multivitamin- oder Mineralstoff-Kombipräparaten enthalten — ein zusätzliches Einzelpräparat kann so unbemerkt zu einer deutlich höheren Gesamtzufuhr führen, als beabsichtigt.

Coaching-Takeaway: Bei Wunsch nach einem weiteren Einzelpräparat lohnt sich zuerst ein Blick auf bereits vorhandene Multivitamin-/Mineralstoffprodukte ("Ist das nicht schon drin?") statt einfach zu ergänzen — und die Frage, welcher konkrete Effekt eigentlich erreicht werden soll.$$),

('supplemente', 'Kalium: Elektrolyt mit engem Sicherheitsfenster', $$Kalium ist ein zentraler Elektrolyt für Membranpotenziale, Nervenleitung und Muskelkontraktion. WHO betont einen kaliumreichen Ernährungsstil als günstig für den Blutdruck, weist aber ausdrücklich auch auf Risiken hin: Bei kaliumhaltigen Salzersatzstoffen kann es bei gefährdeten Personen (u. a. bei eingeschränkter Nierenfunktion oder bestimmten Medikamenten) zu einer gefährlichen Kaliumüberladung (Hyperkaliämie) kommen. Kalium ist damit ein Beispiel für ein Elektrolyt, bei dem "mehr Elektrolyte = mehr Leistung" eine gefährliche Vereinfachung wäre — Nierenfunktion, bestehende Medikation (z. B. bestimmte Blutdruck- oder Herzmedikamente) und die Gesamtzufuhr aus Ernährung plus Supplementen bestimmen gemeinsam, ob eine zusätzliche Kaliumzufuhr überhaupt sicher ist.

Für ein Coaching-Gespräch bedeutet das: Bei Interesse an Elektrolyt-/Mineralstoffpräparaten (z. B. im Kontext von Sport oder "Energie") ist Kalium kein Thema für Selbstversuche mit höheren Mengen — hier braucht es vorab eine ärztliche Einschätzung, sobald Nieren-, Herz- oder Medikationsfragen im Raum stehen.

Coaching-Takeaway: Kalium aus der normalen Ernährung dokumentieren ist unproblematisch; eine gezielte, höher dosierte Kalium-Supplementierung gehört wegen der Sicherheitsrelevanz konsequent ins Arztgespräch, nie ins eigenständige Ausprobieren.$$),

('supplemente', 'Calcium: Knochen, Vitamin D und Interaktionen', $$Calcium ist an Knochenmineralisation, Muskelkontraktion, Nervenfunktion und diversen Signalprozessen beteiligt. Vitamin D beeinflusst den Calciumhaushalt maßgeblich — beide Themen hängen eng zusammen und sollten nicht getrennt betrachtet werden. Calcium ist ein gutes Beispiel dafür, dass ein für den Körper unverzichtbarer Nährstoff trotzdem nicht automatisch für jeden Menschen ein sinnvolles Supplement ist: Ernährung, Absorption, Vitamin-D-Status und die Gesamtversorgung müssen zusammen betrachtet werden, nicht Calcium isoliert. WHO stellt Calcium in den Kontext einer vielfältigen, nährstoffreichen Ernährung; die DGE führt Referenzwerte, keine "Zusatznutzen-Dosis" für kognitive Themen — spezifische ADHS-Evidenz für Calcium gibt es nicht.

Praktisch relevant: Wer bereits Vitamin D supplementiert (ein im ADHS-Kontext häufiger diskutiertes Thema), sollte wissen, dass Calcium und Vitamin D physiologisch zusammenwirken — eine gemeinsame Betrachtung beider Werte beim Arzt ist sinnvoller als getrennte Einzelentscheidungen.

Coaching-Takeaway: Erst die Calciumzufuhr aus der normalen Ernährung grob einschätzen (Milchprodukte, bestimmtes Gemüse, angereicherte Lebensmittel), dann erst über ein Supplement nachdenken — und Vitamin-D-Status und Calciumfrage gemeinsam statt getrennt ansprechen.$$),

('supplemente', 'Vitamin C: Mangelkorrektur ist keine ADHS-Behandlung', $$Vitamin C ist an Kollagenbildung, antioxidativen Funktionen und weiteren Stoffwechselprozessen beteiligt. Der zentrale Punkt für Gespräche: Eine ausreichende Versorgung sicherzustellen ist etwas grundsätzlich anderes als ein zusätzlicher kognitiver Effekt bei ohnehin ausreichender Versorgung. WHO betont, dass Mikronährstoffmängel klinisch relevante Folgen haben können und eine vielfältige Ernährung die Basis der Versorgung bildet — das ist eine Aussage über Mangelvermeidung, keine Aussage über ADHS-Wirksamkeit. Für einen darüber hinausgehenden kognitiven Nutzen bei Menschen ohne Mangel braucht es eigene, ADHS-spezifische Humanstudien mit klinischen Endpunkten — allgemeine antioxidative Mechanismen allein reichen als Beleg nicht aus.

Diese Unterscheidung ist im Alltag besonders wichtig, weil Vitamin C häufig mit pauschalen "Immunsystem/Energie/Fokus"-Werbeversprechen beworben wird, die weit über die tatsächliche Studienlage hinausgehen.

Coaching-Takeaway: Bei einem konkret gehörten Vitamin-C-Versprechen lohnt sich die Rückfrage "Geht es dabei um einen nachgewiesenen Mangel oder um ein allgemeines Wohlfühl-/Leistungsversprechen?" — das schärft den Blick, ohne selbst eine medizinische Bewertung abzugeben.$$),

('supplemente', 'Vitamin A & Vitamin E: fettlösliche Vitamine, Nutzen vs. Überdosierung', $$Vitamin A und Vitamin E sind fettlöslich und werden deshalb im Körper anders gehandhabt als wasserlösliche Vitamine wie Vitamin C: Bei dauerhaft hoher Zufuhr können sie sich anreichern, statt einfach ausgeschieden zu werden. Vitamin A (in Form von Retinoiden) ist wichtig für Sehen, Zelldifferenzierung und Immunfunktion, kann bei Überdosierung aber die Leber belasten — wichtig ist dabei auch die Unterscheidung zwischen Beta-Carotin aus Lebensmitteln, Retinol im Supplement und pharmakologisch wirksamen Retinoid-Medikamenten, die nicht einfach austauschbar sind. Vitamin E wirkt als Bestandteil antioxidativer Schutzsysteme (Tocopherole/Tocotrienole) — auch hier gilt: "Oxidation ist schlecht, Antioxidans ist gut, also mehr Antioxidans ist besser" ist ein Kurzschluss, Biologie funktioniert nicht wie ein Lautstärkeregler, der sich beliebig weit aufdrehen lässt. Für beide Vitamine gibt es keine belastbare ADHS-spezifische Wirksamkeitsevidenz bei ausreichender Versorgung; NIH ODS und WHO führen sie primär unter Versorgungs- und Sicherheitsaspekten.

Coaching-Takeaway: Bei fettlöslichen Vitaminen (A, E, und auch D, K) ist "viel hilft viel" riskanter als bei wasserlöslichen — Dauereinnahme hoher Dosen ohne nachgewiesenen Mangel gehört ärztlich begleitet, nicht auf eigene Faust "optimiert".$$),

('supplemente', 'Vitamin K: Gerinnung und die wichtigste Medikamenten-Interaktion', $$Vitamin K ist an der Aktivierung bestimmter Proteine beteiligt, die für Blutgerinnung und Knochenstoffwechsel wichtig sind. Der praktisch wichtigste Punkt für ein Coaching-Gespräch: Veränderungen der Vitamin-K-Zufuhr können bei Personen, die gerinnungshemmende Medikamente einnehmen (z. B. klassische Vitamin-K-Antagonisten wie Marcumar/Phenprocoumon), klinisch relevant werden — die Wirkung des Medikaments hängt hier direkt mit der Vitamin-K-Zufuhr zusammen. NIH ODS führt Vitamin K deshalb ausdrücklich mit Fokus auf Arzneimittelinteraktionen, nicht als eigenständiges "Wellness-Supplement".

Das zeigt exemplarisch, warum ein Supplement-Stack nicht nur eine Ernährungsfrage ist: Sobald Medikamente im Spiel sind, wird aus "Was ist gesund?" eine individuelle Nutzen-Risiko-Abwägung, die nur ärztlich getroffen werden kann.

Coaching-Takeaway: Bei jeder Person mit gerinnungshemmender Medikation ist eine eigenständige Änderung der Vitamin-K-Zufuhr (auch über Nahrungsergänzung oder plötzliche Ernährungsumstellung) ein Rot-Flag-Thema — hier gilt: dokumentieren und die behandelnde Fachperson einbeziehen, nie selbst anpassen.$$),

('supplemente', 'L-Tyrosin: Dopamin-Vorstufe ist nicht gleich Dopamin-Wirkung', $$Tyrosin ist die biochemische Vorstufe der Katecholamin-Synthese (u. a. Dopamin, Noradrenalin) und wird deshalb im ADHS-Kontext oft als "Fokus-Supplement" beworben. Der zentrale Denkfehler, den dieses Thema veranschaulicht: "Vorstufe von X" bedeutet nicht automatisch "mehr X" und erst recht nicht automatisch "bessere Wirkung von X im Alltag". Der Stoffwechselweg ist reguliert — mehr Ausgangsstoff (Substrat) führt nicht unbegrenzt zu mehr Neurotransmitterwirkung, und der Kontext (Stresslevel, Schlafmangel, Ausgangsversorgung) kann die Antwort verändern. Für eine seriöse Bewertung braucht es kontrollierte Humanstudien, die nach Population, Stresszustand, konkretem kognitivem Test, Dosis und tatsächlichem Alltagsoutcome unterscheiden — allgemeine Kognitionsforschung an gesunden, häufig gestressten/schlafdeprivierten Personen ist nicht automatisch auf ADHS übertragbar.

Diese Unterscheidung ist ein gutes Werkzeug, um im Gespräch überzogene Supplement-Versprechen einzuordnen: "Tyrosin erhöht Dopamin, deshalb wirkt es bei ADHS" überspringt mehrere notwendige Beweisschritte (Biomarker-Veränderung → tatsächlicher Alltagseffekt → ADHS-spezifischer Nutzen).

Coaching-Takeaway: Bei einem gehörten Tyrosin-Claim lieber fragen "Welche konkrete Situation soll sich dadurch verändern?" als "Wie erhöhe ich meinen Dopaminspiegel?" — das lenkt zurück zu etwas, das tatsächlich beobachtbar und besprechbar ist.$$),

('supplemente', 'Glycin: Schlaf-Supplement mit dünner, aber realer Studienbasis', $$Glycin wirkt als Neurotransmitter und ist an verschiedenen physiologischen Prozessen beteiligt; im Schlafkontext wird u. a. eine Rolle bei der Temperaturregulation diskutiert. Anders als bei manchen anderen "Trend-Supplementen" gibt es hier tatsächlich eine konkrete, zitierfähige Humanstudie: eine randomisierte, placebokontrollierte Studie mit 3 Gramm Glycin vor dem Schlafengehen bei gesunden Erwachsenen mit teilweiser Schlafrestriktion. Wichtig für die Einordnung: Eine einzelne interessante Studie an einer bestimmten Population (hier: gesunde, aber schlafrestriktierte Erwachsene) ist kein Freifahrtschein für eine allgemeine Schlaf- oder gar ADHS-Empfehlung — es bleibt offen, wer genau untersucht wurde, warum diese Personen zu wenig schliefen, was konkret gemessen wurde, und ob sich das auf eine andere Situation (z. B. ADHS-bedingte Einschlafprobleme) übertragen lässt. Kinderstudien zu ähnlichen Substanzen (u. a. Sarcosin) sind davon strikt zu trennen — Namensähnlichkeit zwischen Substanzen ist kein Beleg für vergleichbare Wirkung.

Coaching-Takeaway: Glycin ist eines der besser untersuchten Schlaf-Supplemente, aber "besser untersucht" heißt hier "eine placebokontrollierte Studie an einer speziellen Gruppe", nicht "belegt für alle" — bei Interesse eher die zugrundeliegende Schlafproblematik gemeinsam anschauen als das Supplement isoliert empfehlen.$$),

('supplemente', 'GABA oral: Warum ein hemmender Neurotransmitter nicht einfach als Kapsel wirkt', $$GABA ist im zentralen Nervensystem der wichtigste hemmende (inhibitorische) Neurotransmitter — daraus entsteht die intuitive, aber verkürzte Werbelogik "GABA wirkt beruhigend im Gehirn, also beruhigt eine GABA-Kapsel". Das Problem: Damit oral eingenommenes GABA im Gehirn wirken könnte, müsste es aufgenommen, im Körper verteilt und die Blut-Hirn-Schranke überwinden — Rezeptorwirkung, Aufnahme, Verteilung und tatsächliche Erreichbarkeit am Wirkort sind mehrere getrennte Schritte, und ein plausibler Rezeptormechanismus allein ist kein Wirksamkeitsbeleg. In Humanstudien werden oft subjektiver Stress oder periphere physiologische Marker gemessen — solche Ergebnisse dürfen nicht automatisch als "zentrale (Gehirn-)Wirkung" verkauft werden, wenn gar keine zentrale Wirkung nachgewiesen wurde. Es fehlt aktuell die belastbare Humanevidenz, die diese "pharmakokinetische Brücke" zwischen Mechanismus und tatsächlichem Effekt beim Menschen schließt.

Coaching-Takeaway: Bei "GABA beruhigt das Gehirn"-Werbeaussagen lohnt sich die Frage "Was genau wurde in der Studie gemessen — ein Gefühl, ein Blutwert, oder eine echte Gehirnwirkung?" als einfaches, alltagstaugliches Werkzeug gegen Marketing-Versprechen.$$),

('supplemente', 'L-Theanin: Ruhiger Fokus laut Meta-Analyse, aber unsichere klinische Relevanz', $$L-Theanin wird meist mit "ruhigem Fokus" ("calm focus") beworben, oft in Kombination mit Koffein. Es gibt hierzu tatsächlich eine relativ aktuelle und vergleichsweise umfangreiche Evidenzbasis: eine Meta-Analyse aus 2026 mit 31 randomisiert-kontrollierten Studien und 1.168 gesunden erwachsenen Teilnehmenden untersuchte kurzfristige Aufmerksamkeitseffekte. Wichtig für die Einordnung: Die untersuchten Effekte waren kurzfristig, die Studienpopulation waren gesunde Erwachsene (nicht spezifisch Menschen mit ADHS), und die klinische Relevanz — ob sich das im Alltag tatsächlich spürbar auf Leistungsfähigkeit auswirkt — bleibt unsicher. Ein plausibler neurophysiologischer Mechanismus erklärt zudem nicht automatisch eine bessere Alltagsleistung; die Kombination mit Koffein muss zudem als eigene, gesonderte Intervention betrachtet werden, nicht einfach als "L-Theanin plus etwas Koffein". "Calm Focus" ist außerdem kein einheitlicher, messbarer Endpunkt, sondern ein Marketingbegriff, der weniger Stress, bessere Aufmerksamkeit, weniger Fehler, besseren Schlaf oder nur ein anderes subjektives Gefühl bedeuten kann.

Coaching-Takeaway: L-Theanin gehört zu den besser (aber nicht ADHS-spezifisch) untersuchten "sanften" Supplementen — bei Interesse lohnt sich die Rückfrage "Was genau bedeutet 'ruhiger Fokus' für dich konkret messbar?", bevor daraus eine pauschale Empfehlung wird.$$)

;
