-- Response-System: nach jeder bestätigten Einnahme im Tagesplan lässt sich
-- optional festhalten, wie es lief — nicht nur bei Peptiden (das gibt es
-- schon über peptide_logs), sondern auch bei Medikamenten und Supplementen.
-- Feedback landet direkt auf der bestehenden Log-Zeile (gleiches Muster wie
-- peptide_logs), statt in einer neuen generischen Tabelle.
alter table public.hormone_logs
  add column vertraeglichkeit text,
  add column wirkung text,
  add column nebenwirkungen text[] not null default '{}',
  add column notizen text;

alter table public.supplement_logs
  add column wirkung text,
  add column nebenwirkungen text[] not null default '{}',
  add column notizen text;

-- Hydration: kein einzelner "Bestätigen"-Moment (laufende Tagesmenge statt
-- fester Dosen) — deshalb kein Tagesplan-Eintrag, sondern ein optionaler
-- Tages-Check-in direkt auf der bestehenden hydration_logs-Zeile.
alter table public.hydration_logs
  add column elektrolyte boolean not null default false,
  add column durstgefuehl text,
  add column bemerkung text;

-- Schlaf: erweitert den bestehenden Tageseintrag um optionale Detailfragen.
alter table public.sleep_entries
  add column schlafqualitaet text,
  add column einschlafzeit text,
  add column durchgeschlafen boolean,
  add column erholt boolean,
  add column traeume text,
  add column bemerkungen text;
