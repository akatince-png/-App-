-- Nutzerin-Vorgabe 15.08.: Bodyweight-Intervall, Cardio-Intervall und das
-- neue Isometrisches Training brauchen im Wochenplan (wiederkehrende
-- Trainingstage) dieselben Intervall-Felder, die es beim Einzeltraining
-- schon gibt (siehe training_sessions.intervall_arbeit_sek/-pause_sek,
-- training_templates dito) — bisher war das dort schlicht nicht vorgesehen.
alter table public.training_wochenplan add column if not exists intervall_arbeit_sek integer;
alter table public.training_wochenplan add column if not exists intervall_pause_sek integer;
alter table public.training_wochenplan add column if not exists runden integer;
