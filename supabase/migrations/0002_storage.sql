-- Privater Storage-Bucket für Check-in-, Nebenwirkungs- und Blutwerte-Fotos.
-- Objekte liegen unter <user_id>/<ordner>/<dateiname>, Zugriff ist auf den
-- jeweiligen Besitzer (erstes Pfadsegment = auth.uid()) beschränkt.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photos: eigene Dateien lesen"
  on storage.objects for select
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: eigene Dateien hochladen"
  on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: eigene Dateien aktualisieren"
  on storage.objects for update
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: eigene Dateien löschen"
  on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
