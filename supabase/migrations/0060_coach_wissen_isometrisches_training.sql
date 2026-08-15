-- Nutzerin-Vorgabe 15.08.: zwei selbst erstellte Dossiers ("Neuro-Reset"
-- Morgenroutine-Protokoll + Isometrie-Wissensdatenbank) in coach_wissen
-- einarbeiten, als Grundlage für einen neuen Trainingsbereich
-- "Isometrisches Training" (separate Migration/Code-Änderung).
--
-- WICHTIG zur Quelleneinordnung: Beide PDFs sind Coaching-eigene Dossiers
-- ohne Studien-Zitate (keine PMIDs, keine konkreten Stichprobengrößen) —
-- anders als die bisherigen Content-Library-Migrationen (0053 ff.). Der
-- neurobiologische Wirkmechanismus (Yielding vs. Overcoming, propriozeptive
-- Reizüberflutung, Dopamin-/Noradrenalin-Kaskade) ist ein plausibles,
-- aus allgemeiner Trainingsphysiologie abgeleitetes Modell, aber KEINE
-- durch ADHS-spezifische klinische Studien direkt belegte Aussage — im
-- Eintrag entsprechend als Hypothese/Wirkmodell gekennzeichnet, nicht als
-- gesicherter Fakt. Die allgemeine ADHS-Neurobiologie (PFC-Hypoaktivität,
-- Dopamintransporter-Dichte) deckt sich mit dem bereits vorhandenen
-- Training-Modul (0047) und wird hier nicht wiederholt. Das konkrete
-- Übungs-Protokoll (Türrahmen-Druck, Wall Sit, Handgebet mit Sekunden-/
-- Wiederholungszahlen) ist Trainingsinhalt für die neue App-Funktion,
-- nicht Gesprächswissen für Aka — daher hier nur das Wirkmodell in
-- Kurzform, keine Übungsanleitung.
--
-- Neu ergänzt: Sicherheitshinweis zu Blutdruckanstieg bei maximaler
-- isometrischer Anspannung — in keinem der beiden Quell-PDFs erwähnt,
-- aber ein etablierter, sicherheitsrelevanter Fakt zu isometrischem
-- Training generell (Valsalva-Manöver-Risiko), der bei "100% Kraft"-
-- Anweisungen wie im Quell-PDF nicht fehlen darf.

insert into public.coach_wissen (bereich, titel, text) values

('training', 'Isometrisches Training bei ADHS: Wirkmodell und Einordnung', $$Isometrisches Training (Muskelanspannung ohne Bewegung, physikalisch wird keine Arbeit verrichtet, W = F×s mit s = 0) lässt sich in zwei Formen unterteilen: Yielding (Halten gegen eine Last, z. B. Wandsitz) und Overcoming (Drücken/Ziehen gegen einen unbeweglichen Widerstand, z. B. gegen einen Türrahmen). Das Wirkmodell für ADHS ist plausibel, aber wichtig einzuordnen: Es handelt sich um eine aus allgemeiner Trainingsphysiologie abgeleitete Hypothese, nicht um eine durch ADHS-spezifische klinische Studien direkt belegte Aussage. Die Grundidee: Overcoming-Isometrie soll durch maximale, schlagartige Rekrutierung motorischer Einheiten einen kurzen Noradrenalin-/Dopamin-Anstieg auslösen — ein ähnlicher Mechanismus wie bei anderen intensiven Bewegungsreizen, die im Training-Modul bereits beschrieben sind (Sport erhöht generell Dopamin-/Noradrenalin-Freisetzung). Yielding-Isometrie wirkt eher über propriozeptives Feedback und verlangsamte Atmung beruhigend und kann die Frustrationstoleranz unterstützen. Ein praktischer, gut begründbarer Vorteil gegenüber klassischem Training: Isometrische Übungen brauchen oft nur Sekunden bis wenige Minuten, kein Umziehen und keinen Schweißaufwand — das senkt die Einstiegshürde ("exekutive Blockade", das häufigste Problem bei ADHS und Sport) spürbar, unabhängig davon, wie stark der Neurotransmitter-Effekt im Einzelfall ausfällt. Sicherheitshinweis: Maximale isometrische Anspannung kann den Blutdruck kurzzeitig deutlich erhöhen (Pressatmung/Valsalva-Effekt) — bei bekannten Herz-Kreislauf-Erkrankungen, unklarem Bluthochdruck oder in der Schwangerschaft vorab ärztlich abklären, nicht ungeprüft mit "100 % Kraft" einsteigen.

Coaching-Takeaway: Isometrisches Training eignet sich als niedrigschwelliger Morgen-Einstieg (2-4 Minuten, kein Umziehen nötig) — im Gespräch eher betonen, dass "kurz und machbar" bei ADHS oft wirksamer ist als "lang und intensiv", statt eine bestimmte Übung als Wundermittel zu verkaufen.$$)

;
