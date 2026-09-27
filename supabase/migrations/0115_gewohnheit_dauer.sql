-- Bild-Tagesplan (27.09.): Gewohnheiten bekommen eine Dauer ("🧺 Wäsche · 30 Min"),
-- damit die Blöcke in der Zeitleiste passend hoch sind und der Timer weiß,
-- wie lange er laufen soll. Optional – ohne Angabe gelten 15 Minuten.
alter table public.routines add column if not exists dauer_min int check (dauer_min is null or (dauer_min > 0 and dauer_min <= 600));
