-- Übungsbilder: schwarz-weiße Illustrationen zu den Kraft-/Bodyweight-
-- Übungen (KRAFTUEBUNGEN/BODYWEIGHT_UEBUNGEN in constants.js), von der
-- Nutzerin in Canva erstellt und über eine neue Admin-Ansicht hochgeladen.
-- Sichtbar für ALLE Nutzer:innen im Live-Trainings-Screen (TrainingView.jsx)
-- — eine geteilte Referenz-Bibliothek, keine privaten Fotos (anders als der
-- bestehende private "photos"-Bucket, Migration 0002). Deshalb ein eigener,
-- ÖFFENTLICHER Bucket statt der bestehenden privaten Foto-Infrastruktur.

insert into storage.buckets (id, name, public)
values ('uebungsbilder', 'uebungsbilder', true)
on conflict (id) do nothing;

create policy "uebungsbilder: admin hochladen"
  on storage.objects for insert
  with check (bucket_id = 'uebungsbilder' and public.is_admin(auth.uid()));

create policy "uebungsbilder: admin aktualisieren"
  on storage.objects for update
  using (bucket_id = 'uebungsbilder' and public.is_admin(auth.uid()));

create policy "uebungsbilder: admin löschen"
  on storage.objects for delete
  using (bucket_id = 'uebungsbilder' and public.is_admin(auth.uid()));

-- Name = exakte Übungsbezeichnung aus KRAFTUEBUNGEN/BODYWEIGHT_UEBUNGEN
-- (constants.js) — dient als Schlüssel zum Zuordnen, keine eigene ID nötig
-- im Frontend.
create table public.uebungs_bilder (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bild_url text not null,
  erstellt_am timestamptz not null default now()
);

alter table public.uebungs_bilder enable row level security;

create policy "uebungs_bilder: alle angemeldeten lesen" on public.uebungs_bilder for select
  using (auth.uid() is not null);

create policy "uebungs_bilder: admin voller Zugriff" on public.uebungs_bilder for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
