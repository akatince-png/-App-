-- hormones.intervall_days war fälschlich "not null" (protocol_peptide hat
-- dieselbe Spalte korrekt nullable) — bricht das Speichern bei allen
-- Intervall-Typen außer "fixed" (custom/cycle/weekdays schicken bewusst
-- keinen Wert für dieses Feld, da es dort nicht gebraucht wird).
alter table public.hormones alter column intervall_days drop not null;
