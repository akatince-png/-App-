-- Medikamente brauchen wie Peptide eine Einnahmeart (Injektion, Tablette,
-- Nasenspray, ...), damit im Tagesplan die richtige Einnahmeform bestätigt
-- werden kann (z. B. Testosteron injiziert, HCG je nach Präparat oral).
alter table public.hormones
  add column einnahmeart text not null default 'Injektion';

-- Peptid-Details: BAC-Wasser-Menge zum Anmischen von Pulver-Peptiden, sowie
-- Sprühstöße pro Gabe bei Nasenspray-Einnahmeart.
alter table public.protocol_peptide
  add column bac_wasser_ml numeric,
  add column spruehstoesse integer;
