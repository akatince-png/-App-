-- Fotos für Mahlzeiten/Rezepte — nutzt denselben privaten "photos"-Bucket
-- und dieselben RLS-Policies wie Medikamenten-/Peptid-Fotos (Migration
-- 0002), nur mit eigenem Ordner-Präfix ("mahlzeiten"). Kein neuer Bucket,
-- keine neuen Policies nötig.
alter table public.meals add column if not exists foto_path text;
