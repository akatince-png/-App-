-- Gewohnheiten: optionales Mengen-/Einheitenfeld (z. B. "20 Seiten",
-- "10 Minuten") zusätzlich zum bereits vorhandenen Namen und Ziel-Tage-Feld —
-- die Tabelle heißt weiterhin "routines" (siehe 0006/0016).
alter table public.routines
  add column if not exists menge text not null default '';
