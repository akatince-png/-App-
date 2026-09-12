-- Cannabis als eigene Medikamente-Kategorie (Nutzerin-Vorgabe, 12.09.):
-- THC-/CBD-Prozentangabe sowie Konsumform-Details (Tabak/Filter beim
-- Rauchen einer Blüte, Temperatur beim Verdampfen, Tropfenzahl bei Öl) sind
-- zusätzliche, nur für diese eine Kategorie relevante Felder — gleiches
-- Muster wie die bereits bestehenden Peptid-spezifischen Felder
-- bac_wasser_ml/spruehstoesse auf derselben Tabelle (Migration 0077): eine
-- gemeinsame Tabelle für alle Medikamente/Hormone/Peptide/Cannabis statt
-- einer eigenen Tabelle pro Kategorie, mit optionalen, kategoriespezifischen
-- Spalten, die für alle anderen Kategorien einfach leer bleiben. Menge
-- (Gramm/Tropfen/Kapseln pro Einnahme), Intervall und Uhrzeit(en) laufen wie
-- bei jedem anderen Medikament über die schon vorhandenen generischen Felder
-- menge/intervall_*/uhrzeiten — dafür braucht es keine neue Spalte.
alter table public.hormones
  add column cannabis_thc_prozent numeric,
  add column cannabis_cbd_prozent numeric,
  add column cannabis_tabak_menge text,
  add column cannabis_filter text,
  add column cannabis_temperatur_grad numeric,
  add column cannabis_tropfen integer;
