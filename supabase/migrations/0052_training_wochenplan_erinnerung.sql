-- Bisher galt der Trainings-Push (profiles.erinnerungen.training, siehe
-- MehrTab.jsx) nur global für alle Wochenplan-Einheiten auf einmal.
-- Nutzerin-Vorgabe (14.08.): sie möchte Erinnerungen auch für einzelne
-- Trainingstage separat an-/ausschalten können, direkt im Wochenplan.
-- Neue Spalte je Einheit, Default true (an), damit bereits bestehende
-- Einheiten sich nicht unbemerkt stumm schalten. send-due-reminders prüft
-- jetzt zusätzlich zum globalen Schalter auch diese Spalte pro Zeile.
alter table public.training_wochenplan add column if not exists erinnerung_aktiv boolean not null default true;
