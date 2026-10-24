-- MIT = Most Important Task (24.10., Nutzerin: Begriffe aus dem
-- Zeitmanagement). Bis zu 3 Aufgaben je Tag als ⭐ MIT markierbar; sie
-- stehen oben im Tagesplan und auf der Tafel und werden in der Abendroutine
-- (Tagesabschluss) für morgen gewählt. mit_am = der Tag, für den sie MIT ist.
alter table public.matrix_aufgaben add column if not exists mit_am date;
