-- Video-Nachweise (27.09., Nutzerinnen-Vorgabe): kurze Clips (bis 20 Sek.,
-- mit Countdown 5-4-3-2-1 vor der Aufnahme) als Nachweis bei Training,
-- Quests und Gruppenprotokollen. Nur der Coach (Admin) sieht und bestätigt.
-- Nach der Bestätigung (oder "passt nicht") wird das Video sofort gelöscht,
-- der Nachweis-Eintrag bleibt. Unbestätigte Videos werden nach 7 Tagen
-- gelöscht (Edge Function "nachweise-aufraeumen", täglich per pg_cron).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nachweise', 'nachweise', false, 26214400, array['video/webm', 'video/mp4', 'video/quicktime'])
on conflict (id) do nothing;

drop policy if exists "nachweise: eigene hochladen" on storage.objects;
create policy "nachweise: eigene hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'nachweise' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "nachweise: lesen (selbst, Admin)" on storage.objects;
create policy "nachweise: lesen (selbst, Admin)" on storage.objects
  for select to authenticated
  using (bucket_id = 'nachweise' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid())));

drop policy if exists "nachweise: löschen (selbst, Admin)" on storage.objects;
create policy "nachweise: löschen (selbst, Admin)" on storage.objects
  for delete to authenticated
  using (bucket_id = 'nachweise' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid())));

create table if not exists public.video_nachweise (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  art text not null check (art in ('training', 'quest', 'gruppe')),
  bezug_id text,
  titel text not null,
  datum date not null default current_date,
  pfad text,
  dauer_sek int,
  status text not null default 'offen' check (status in ('offen', 'bestaetigt', 'passt_nicht', 'abgelaufen')),
  bestaetigt_von uuid references auth.users (id) on delete set null,
  bestaetigt_am timestamptz,
  geloescht_am timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists video_nachweise_user_idx on public.video_nachweise (user_id, created_at desc);
create index if not exists video_nachweise_offen_idx on public.video_nachweise (status, created_at) where pfad is not null;
alter table public.video_nachweise enable row level security;
drop policy if exists "video_nachweise: eigene lesen" on public.video_nachweise;
create policy "video_nachweise: eigene lesen" on public.video_nachweise for select using (auth.uid() = user_id);
drop policy if exists "video_nachweise: eigene anlegen" on public.video_nachweise;
create policy "video_nachweise: eigene anlegen" on public.video_nachweise for insert with check (auth.uid() = user_id and status = 'offen');
drop policy if exists "video_nachweise: admin voller Zugriff" on public.video_nachweise;
create policy "video_nachweise: admin voller Zugriff" on public.video_nachweise for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Tägliches Aufräumen (3:17 Uhr UTC): Edge Function "nachweise-aufraeumen"
-- (verify_jwt aus, Schutz über x-cron-secret aus cron_konfig).
insert into public.cron_konfig (name, wert) values ('nachweise-aufraeumen', encode(extensions.gen_random_bytes(24), 'hex')) on conflict (name) do nothing;
select cron.schedule('nachweise-aufraeumen-taeglich', '17 3 * * *', $$
  select net.http_post(
    url := 'https://xdajxswaclukstteafnk.supabase.co/functions/v1/nachweise-aufraeumen',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select wert from public.cron_konfig where name = 'nachweise-aufraeumen')),
    body := '{}'::jsonb
  );
$$);
