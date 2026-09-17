-- Nutzerinnen-Vorgabe (17.09., Konsistenz-Check über alle Kategorien):
-- Mahlzeiten und Gewohnheiten bekommen ein leichtes, OPTIONALES Notiz-Feld
-- pro Tages-Eintrag (z. B. "Übelkeit nach dem Essen" / "Meditation ist
-- heute schwergefallen") — bewusst kein volles Verträglichkeits-/
-- Nebenwirkungs-Formular wie bei Medikamenten/Supplementen (passt inhaltlich
-- nicht, siehe Chat), aber wenigstens eine Notiz-Möglichkeit, damit diese
-- zwei Kategorien nicht ganz ohne jedes Feedback bleiben. `meal_logs` und
-- `routine_logs` (Gewohnheiten) hatten dafür bisher keine Spalte.
alter table public.meal_logs add column if not exists notizen text;
alter table public.routine_logs add column if not exists notizen text;
