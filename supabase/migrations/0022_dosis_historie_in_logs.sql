-- Historische Dosis pro Log-Eintrag: bisher wurde bei "erledigt"/Feedback
-- nur ein Boolean + Zusatzinfos gespeichert, die angezeigte Menge kam aus
-- dem aktuell gültigen Dosierungs-Stand (peptide/hormones), der live neu
-- berechnet wird. Änderte man die Dosis nachträglich, zeigten bereits
-- protokollierte Tage rückwirkend die NEUE Menge statt der tatsächlich
-- genommenen — genau das darf laut Nutzer nicht passieren: eine Änderung
-- muss dokumentiert werden, ohne die Historie vorheriger Tage zu
-- überschreiben. Menge wird deshalb jetzt zum Zeitpunkt des Abhakens direkt
-- auf den Log-Eintrag geschrieben (Snapshot), nicht mehr live nachgerechnet.
alter table public.peptide_logs add column if not exists menge text;
alter table public.hormone_logs add column if not exists menge text;
