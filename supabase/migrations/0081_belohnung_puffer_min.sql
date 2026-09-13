-- Belohnungsfenster-Puffer (Nutzerin-Vorgabe, 12.09.): "wie viel Puffer
-- jemand bekommt" soll admin-konfigurierbar sein — Anzahl Minuten, die ein
-- Start/Erledigen nach der geplanten Uhrzeit noch als "rechtzeitig" zählt
-- und damit eine Belohnung auslöst (s. utils/belohnungZeit.js). Bewusst
-- eine einfache Spalte auf profiles statt einer eigenen Tabelle — genau ein
-- Wert pro Nutzer, gleiches Muster wie aktive_messwerte etc. Default 10
-- entspricht der von der Nutzerin für sich selbst gewünschten Vorgabe.
alter table public.profiles
  add column if not exists belohnung_puffer_min integer not null default 10;
