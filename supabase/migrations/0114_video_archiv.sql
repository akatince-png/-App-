-- Video-Archiv (27.09., Nutzerinnen-Vorgabe): Mit Einverständnis der Person
-- darf der Coach ausgewählte Video-Nachweise aufbewahren (Archiv, z. B. für
-- Fortschritt und ein späteres Dankeschön-/Zertifikats-Video) oder zum
-- Besprechen behalten; herunterladen kann der Coach jedes Video.
-- - Status "besprechen": bleibt liegen, bis der Coach entscheidet (ohne
--   Einverständnis greift weiter die 7-Tage-Löschung).
-- - Status "archiviert": nur mit Einverständnis; bleibt dauerhaft.
-- - Widerruf (video_archiv_einverstanden = false): die nächtliche
--   Aufräum-Funktion löscht archivierte und zum Besprechen behaltene Videos.

alter table public.video_nachweise drop constraint if exists video_nachweise_status_check;
alter table public.video_nachweise add constraint video_nachweise_status_check
  check (status in ('offen', 'bestaetigt', 'passt_nicht', 'abgelaufen', 'besprechen', 'archiviert'));

alter table public.profiles add column if not exists video_archiv_einverstanden boolean;
alter table public.profiles add column if not exists video_archiv_einverstanden_am timestamptz;
