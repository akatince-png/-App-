-- Getränk über den Tag in Portionen (26.10., Nutzerin: „1,5-l-Shake über den
-- Tag verteilt … die ersten 250 ml“). getraenk_ml = Gesamtmenge; je Tag
-- zählt supplement_logs.menge_ml mit, erledigt sobald erreicht. (eingespielt)
alter table public.supplements add column if not exists getraenk_ml integer;
alter table public.supplement_logs add column if not exists menge_ml integer;
