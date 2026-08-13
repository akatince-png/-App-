-- Peptide werden keine eigene Kategorie/kein eigener Reiter mehr, sondern
-- eine Kategorie innerhalb von Medikamente (Nutzerinnen-Vorgabe, 13.08.:
-- "als separaten Reiter aufzustellen, wo wir doch schon Medikamente
-- inklusive Hormone und Off-Label-Produkte haben, halte ich für absurd").
--
-- Bewusst NICHT destruktiv: protocols/protocol_peptide/peptide_logs werden
-- NICHT gelöscht, nur kopiert — falls beim Umzug etwas nicht passt, ist
-- nichts verloren. Nur das AKTUELL AKTIVE Peptid-Protokoll wird übernommen
-- (Nutzerinnen-Entscheidung, 13.08.) — archivierte/vergangene Protokoll-
-- Zyklen bleiben unangetastet in den alten Tabellen, tauchen aber nicht in
-- der neuen Medikamente-Ansicht auf (das Konzept "mehrere Protokoll-Zyklen"
-- gibt es bei hormones/hormone_logs nicht, dort ist alles eine durchgehende
-- Liste).
--
-- protocol_peptide/hormones und peptide_logs/hormone_logs haben sich seit
-- 0001 parallel weiterentwickelt (0003: uhrzeiten-Array, on_days/off_days/
-- weekdays/foto_path; 0022: menge) und haben inzwischen praktisch identische
-- Spalten — die Kopie unten ist deshalb ein direktes 1:1-Mapping, keine
-- Umformung nötig.

-- 1. Fehlende Spalten ergänzen, die peptide_logs hat, hormone_logs aber nicht.
alter table public.hormone_logs add column if not exists staerke text;
alter table public.hormone_logs add column if not exists foto_path text;

-- 2. "Peptid" als gültige Medikamenten-Kategorie zulassen.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.hormones'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kategorie%'
  loop
    execute format('alter table public.hormones drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.hormones
  add constraint hormones_kategorie_check
  check (kategorie in ('Hormone', 'Peptid', 'Blutdruck', 'Diabetes', 'Cholesterin', 'Schmerzmittel', 'Sonstige'));

-- 3. Substanzen aus dem aktuell aktiven Peptid-Protokoll nach hormones kopieren.
insert into public.hormones (
  user_id, name, kategorie, einnahmeart, menge, intervall_mode, intervall_days, custom_days,
  eigener_start, uhrzeiten, on_days, off_days, weekdays, foto_path
)
select
  pp.user_id, pp.name, 'Peptid', pp.einnahmeart, pp.menge, pp.intervall_mode, pp.intervall_days, pp.custom_days,
  pp.eigener_start, pp.uhrzeiten, pp.on_days, pp.off_days, pp.weekdays, pp.foto_path
from public.protocol_peptide pp
join public.protocols p on p.id = pp.protocol_id and p.status = 'active'
on conflict (user_id, name) do nothing;

-- 4. Zugehörige Dosis-Logs nach hormone_logs kopieren.
insert into public.hormone_logs (
  user_id, hormone_name, dose_date, uhrzeit, erledigt, nebenwirkungen, staerke, notizen, foto_path, menge, erledigt_at
)
select
  pl.user_id, pl.peptid_name, pl.dose_date, pl.uhrzeit, pl.erledigt, pl.nebenwirkungen, pl.staerke, pl.notizen,
  pl.foto_path, pl.menge, pl.erledigt_at
from public.peptide_logs pl
join public.protocols p on p.id = pl.protocol_id and p.status = 'active'
on conflict (user_id, hormone_name, dose_date, uhrzeit) do nothing;
