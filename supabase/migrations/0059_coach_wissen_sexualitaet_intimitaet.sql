-- Nachtrag zur vierten Ergänzungsrunde (0056-0058): Die Nutzerin bat darum,
-- die Themen, die in den ChatGPT-überarbeiteten Content-Library-Quellen
-- noch fehlten, selbst (statt erneut über ChatGPT) auszuarbeiten — mit
-- explizitem Verweis darauf, nicht noch einmal zurück in den Chat gehen zu
-- wollen. Nach systematischer Durchsicht aller Ausschlussgründe in
-- 0053/0054/0056/0057/0058 zeigt sich: Fast jeder Ausschluss war entweder
-- ein echtes Duplikat einer bereits vorhandenen coach_wissen-Aussage oder
-- Business-/Coaching-Curriculum-Material (bewusst nie für Aka gedacht) —
-- beides sind keine "fehlenden" Inhalte, sondern korrekte Ausschlüsse.
--
-- Der EINE tatsächliche Inhalts-Void (Quelle liefert nachweislich nichts,
-- kein Duplikat vorhanden): Dossier 88 "ADHS und Sexualität/Intimität"
-- (0057 dokumentiert: "im Eröffnungssatz und im gesamten Dossier kein
-- einziger extrahierbarer Fakt"). Dieser Eintrag stammt daher NICHT aus
-- einer Quelldatei, sondern aus eigenem Wissen — entsprechend vorsichtiger
-- formuliert als die quellenbasierten Einträge: keine erfundenen PMIDs,
-- Teilnehmerzahlen oder Effektgrößen, wo keine sichere Erinnerung an eine
-- konkrete Studie besteht, stattdessen hedged-generelle Formulierungen
-- ("mehrere Studien deuten auf", "in der klinischen Literatur beschrieben")
-- und ein expliziter Hinweis auf die insgesamt dünne Evidenzlage zu diesem
-- Thema. Wie bei den bestehenden Block-F-Einträgen (0057) ausschließlich
-- Fakten/Muster, keine Sexualtherapie-Technik — Verweis an Fachpersonal
-- bleibt bei tatsächlichem Bedarf. bereich = null (allgemeines
-- Gesprächswissen, wie die übrigen Block-F-Einträge).

insert into public.coach_wissen (bereich, titel, text) values

(null, 'ADHS, Sexualität und Intimität: dünne, aber vorhandene Forschungslage', $$ADHS und Sexualität gehört zu den am wenigsten beforschten Themenfeldern der Erwachsenen-ADHS-Literatur — anders als bei Beruf, Beziehung oder Finanzen gibt es hier kaum groß angelegte, belastbare Studien, und die vorhandene Forschung konzentriert sich stärker auf Risikoverhalten als auf Intimität oder Beziehungsqualität. Mehrere Studien, darunter Langzeit-Verlaufsuntersuchungen von Kindern mit ADHS bis ins Erwachsenenalter, deuten auf einen Zusammenhang zwischen ADHS-Impulsivität und früherem sexuellem Erstkontakt sowie einem höheren Anteil ungeschützten Geschlechtsverkehrs — ein plausibler, aber nicht in jeder Studie gleich starker Befund, der sich am ehesten über die allgemeine Impulskontrollproblematik erklären lässt, nicht über einen sexualitätsspezifischen Mechanismus. Auf der medikamentösen Seite werden für Stimulanzien vereinzelt Veränderungen der Libido berichtet, in beide Richtungen und individuell sehr unterschiedlich — eine systematische, gut quantifizierte Studienlage dazu fehlt bislang, anders als etwa bei SSRI, wo sexuelle Nebenwirkungen deutlich besser dokumentiert sind. In der klinischen Literatur werden zudem wiederkehrend zwei ADHS-typische Muster beschrieben: Ablenkbarkeit bzw. Gedankenabschweifen während intimer Momente sowie eine intensive, aber oft kurzlebige "Hyperfocus"-Phase zu Beginn neuer Beziehungen — beides klinische Beobachtungen, keine durch kontrollierte Studien belegten Effekte. Sexualität ist ausdrücklich kein Coaching-Therapiefeld: Bei sexuellen Funktionsstörungen, zwanghaftem Verhalten oder Beziehungskrisen gilt wie bei anderen sensiblen Themen die Weiterverweisung an Fachpersonal (Sexualtherapie, Paartherapie, je nach Anliegen auch Urologie/Gynäkologie) statt eigenständiger Bearbeitung im Coaching.

Coaching-Takeaway: Bei diesem Thema besonders zurückhaltend bleiben — es gibt kaum harte Evidenz, auf die man sich stützen kann; im Gespräch geht es höchstens um sichtbare Alltagsmuster (Ablenkbarkeit, bewusst eingeplante Nähe-Zeit als Paar), nie um Sexualtherapie oder Diagnostik.$$)

;
