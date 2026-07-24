-- Cardio-Unterart (Laufen/Fahrradfahren/Springseilspringen/Sonstiges) +
-- gewählter Modus (Strecke/Intervall/Sprints bzw. Dauer/Intervall) statt
-- eines einzigen generischen Cardio-Formulars für alle Cardio-Arten.
alter table public.training_sessions add column if not exists cardio_art text;
alter table public.training_sessions add column if not exists cardio_modus text;
alter table public.training_templates add column if not exists cardio_art text;
alter table public.training_templates add column if not exists cardio_modus text;
