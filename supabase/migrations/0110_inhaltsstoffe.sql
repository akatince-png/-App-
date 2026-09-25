-- Präparat per Foto (25.09., Nutzerinnen-Vorgabe): Dose/Packung abfotografieren
-- ("3 Kapseln davon") → Inhaltsstoffe je Einnahme werden mitgespeichert,
-- z. B. [{"name":"Magnesium","menge":450,"einheit":"mg"}]. Manuell genauso
-- editierbar; bestehende Einträge bleiben leer.
alter table public.supplements add column if not exists inhaltsstoffe jsonb not null default '[]'::jsonb;
alter table public.hormones add column if not exists inhaltsstoffe jsonb not null default '[]'::jsonb;
