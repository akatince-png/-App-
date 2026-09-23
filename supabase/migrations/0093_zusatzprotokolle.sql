-- Parallele Zusatzprotokolle (Nutzerinnen-Wunsch 23.09.2026): neben dem
-- einen laufenden Hauptprotokoll sollen weitere Protokolle parallel laufen
-- können — z. B. ein Experiment ("4 Wochen Magnesium abends testen"), das
-- nicht Teil des festen Hauptprotokolls werden soll.
--
-- art:            'haupt' (wie bisher, immer nur eines aktiv) | 'zusatz'
--                 (beliebig viele gleichzeitig aktiv)
-- geplantes_ende: optionales Enddatum eines Zusatzprotokolls (nur Anzeige/
--                 Erinnerung, beendet nichts automatisch)
-- abschluss:      wie ein Zusatzprotokoll beendet wurde — 'beendet' (seine
--                 Einträge verschwinden aus dem Tagesplan, Verlauf bleibt)
--                 oder 'uebernommen' (Einträge wurden ins Hauptprotokoll
--                 übernommen und laufen dort weiter)
-- Bestehende Zeilen bekommen art = 'haupt' → keinerlei Verhaltensänderung.
alter table public.hauptprotokolle add column if not exists art text not null default 'haupt';
alter table public.hauptprotokolle add column if not exists geplantes_ende date;
alter table public.hauptprotokolle add column if not exists abschluss text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hauptprotokolle_art_check') then
    alter table public.hauptprotokolle add constraint hauptprotokolle_art_check check (art in ('haupt', 'zusatz'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hauptprotokolle_abschluss_check') then
    alter table public.hauptprotokolle add constraint hauptprotokolle_abschluss_check check (abschluss is null or abschluss in ('beendet', 'uebernommen'));
  end if;
end $$;
