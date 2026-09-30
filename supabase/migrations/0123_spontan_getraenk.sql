-- Spontan-Einträge (30.09., Nutzerin: „all diese Sachen müssen zu den
-- geschehenen Uhrzeiten als Ereignisse in die Wochenpläne und dokumentiert
-- werden“): Getränke aus dem Kreis-Schnellmenü bekommen eine eigene Zeile
-- mit Uhrzeit und Menge (die Tagessumme in hydration bleibt wie bisher).
alter table public.spontan_eintraege drop constraint if exists spontan_eintraege_art_check;
alter table public.spontan_eintraege add constraint spontan_eintraege_art_check check (art in ('nickerchen', 'einnahme', 'getraenk'));
alter table public.spontan_eintraege add column if not exists menge_ml integer check (menge_ml is null or menge_ml between 1 and 5000);
