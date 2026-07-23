-- Onboarding-Umbau: generalisiertes "Zieldauer"-Feld (offen/fortlaufend vs.
-- zeitlich begrenzt) je Pläne-Kategorie. Peptide nutzen weiterhin
-- protocols.dauer_wochen, Gewohnheiten weiterhin routines.ziel_tage. Für die
-- übrigen Kategorien gibt es keine natürliche "eine Zeile pro Nutzer"-Stelle
-- für ein Ziel — ein kompaktes jsonb-Feld auf profiles ist hier einfacher
-- als sechs einzelne Tabellenänderungen (gleiches Muster wie checkins.values
-- / blutwerte_archiv.werte).
alter table public.profiles
  add column if not exists category_ziele jsonb not null default '{}'::jsonb;
