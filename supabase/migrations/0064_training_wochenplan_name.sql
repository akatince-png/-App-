-- Nutzerin-Vorgabe 15.08.: eine Wochenplan-Einheit (mehrere Trainingsarten
-- in fester Reihenfolge kombinierbar, siehe WochenplanEditor.jsx) soll sich
-- benennen lassen ("Montagsworkout", "Brustworkout", "ISO-Training", ...) —
-- bisher gab es dafür kein Feld, nur die Kombination der Trainingsarten
-- selbst diente als Anzeigename.
alter table public.training_wochenplan add column if not exists name text;
