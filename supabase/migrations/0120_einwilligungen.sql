-- Einwilligungen (28.09., Vorbereitung App-Store-Antrag, Nutzerin freigegeben):
-- Datenschutz / Gesundheitsdaten nach Art. 9 DSGVO (Pflicht für Coachees)
-- und KI-Funktionen (freiwillig, Apple-Richtlinie 5.1.2(i)). Zeitstempel
-- statt Ja/Nein, damit nachweisbar ist, wann zugestimmt wurde; Widerruf der
-- KI-Einwilligung setzt ki_einwilligung_am wieder auf null. Nur neue Spalten.
alter table public.profiles add column if not exists datenschutz_einwilligung_am timestamptz;
alter table public.profiles add column if not exists datenschutz_version text;
alter table public.profiles add column if not exists ki_einwilligung_am timestamptz;
