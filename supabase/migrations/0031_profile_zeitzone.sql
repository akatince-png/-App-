-- Für den zeitgesteuerten Erinnerungs-Versand (pg_cron, siehe
-- 0032_erinnerungs_versand.sql) muss serverseitig bekannt sein, in welcher
-- Zeitzone eine eingetragene Uhrzeit ("08:00") gemeint ist — der Server
-- selbst rechnet in UTC. Wird beim Laden des Profils automatisch aus dem
-- Browser gesetzt (siehe useProfileData.js), nicht Teil des Onboardings.
alter table public.profiles add column if not exists zeitzone text;
