-- Peptid-Protokolle (Tabelle protocols) waren die einzige Kategorie, die noch
-- nicht mit dem Hauptprotokoll verknüpft war (siehe 0027_hauptprotokolle.sql).
-- Nullable und forward-only wie bei den anderen Kategorien: bestehende
-- Zeilen bleiben unverändert, verknüpft wird ab jetzt beim Anlegen eines
-- neuen Hauptprotokolls (siehe useProtocolData.verknuepfeMitHauptprotokoll).
alter table public.protocols add column if not exists hauptprotokoll_id uuid references public.hauptprotokolle (id) on delete set null;
