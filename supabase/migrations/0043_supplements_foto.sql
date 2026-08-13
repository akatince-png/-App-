-- Foto pro Supplement (Fläschchen/Packung) — Medikamente und Peptide hatten
-- das schon (foto_path seit Migration 0003), Supplemente bisher nicht.
-- Nutzerinnen-Vorgabe (13.08.): Foto-Möglichkeit soll für ALLE Kategorien
-- gelten (Supplemente, Medikamente, Peptide, Hormone), nicht nur für einen
-- Teil davon.
alter table public.supplements add column if not exists foto_path text;
