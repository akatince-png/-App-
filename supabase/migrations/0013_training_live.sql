-- Live-Workout-Modus: eine Trainingseinheit kann jetzt "geplant" (erledigt =
-- false) angelegt und danach live durchgeführt werden, statt nur im
-- Nachhinein dokumentiert zu werden. Bestehende Zeilen bleiben unberührt
-- (Default true = weiterhin "erledigt", wie bisher).
alter table public.training_sessions add column if not exists erledigt boolean not null default true;

-- Intervall-Konfiguration für HIIT/Cardio-Intervalle (Arbeits-/Pausenzeit in
-- Sekunden; Rundenzahl nutzt die bereits vorhandene Spalte "runden").
alter table public.training_sessions add column if not exists intervall_arbeit_sek integer;
alter table public.training_sessions add column if not exists intervall_pause_sek integer;
