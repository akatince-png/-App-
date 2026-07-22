-- Uhrzeit fürs Training nachrüsten: bisher gab es keine, deshalb landete
-- jede Trainingseinheit im Tagesplan immer unter "Sonstige Zeiten" statt
-- chronologisch einsortiert wie Peptide/Medikamente/Supplemente.
alter table public.training_sessions add column if not exists uhrzeit text;
alter table public.training_templates add column if not exists uhrzeit text;
alter table public.training_wochenplan add column if not exists uhrzeit text;
