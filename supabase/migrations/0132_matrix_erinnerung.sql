-- Erinnerungen für Matrix-Aufgaben (24.10., Nutzerin: Termine und Vorhaben
-- aus der Matrix sollen im Tagesplan/Kalender stehen und an sie erinnern).
-- null = keine Erinnerung; 'zeit' = zur Uhrzeit, '15'/'60' = so viele
-- Minuten vorher, 'morgens' = um 08:00 am geplanten Tag (bzw. Frist-Tag).
-- Verschickt von der Edge Function send-alltag-reminders.
alter table public.matrix_aufgaben add column if not exists erinnerung text;
alter table public.matrix_aufgaben add constraint matrix_aufgaben_erinnerung_check check (erinnerung is null or erinnerung in ('zeit', '15', '60', 'morgens'));
