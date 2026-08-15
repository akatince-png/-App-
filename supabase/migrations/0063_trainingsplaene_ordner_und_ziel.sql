-- Nutzerin-Vorgabe 15.08.: Trainingsvorlagen ("Vorlage speichern", siehe
-- training_templates) sollen sich zu Ordnern/Programmen gruppieren lassen
-- (z. B. "Push/Pull/Legs" als Ordner mit den Vorlagen "Push-Tag"/"Pull-
-- Tag"/"Legs-Tag" darin), ein Ziel-Freitext bekommen ("mit bestimmten
-- Zielen"), und sich beim Live-Start eine EIGENE Spotify-Playlist merken
-- statt nur der einen geräteweiten "training"-Playlist (spotify_anlass_
-- playlists ist bereits ein freier (user_id, anlass)-Schlüssel, dafür also
-- keine Schema-Änderung nötig — anlass wird "training-vorlage:<id>").

create table if not exists public.training_programme (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.training_programme enable row level security;
drop policy if exists "training_programme: eigene Zeilen" on public.training_programme;
create policy "training_programme: eigene Zeilen" on public.training_programme for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.training_templates add column if not exists ziel text;
alter table public.training_templates add column if not exists programm_id uuid references public.training_programme (id) on delete set null;

-- Damit ein aus einer Vorlage gestartetes Training beim Live-Start weiß,
-- welche Vorlage es war (für die Vorlagen-eigene Spotify-Playlist oben) —
-- rein informativ, ändert nichts an bestehenden Zeilen (bleibt dort null).
alter table public.training_sessions add column if not exists template_id uuid references public.training_templates (id) on delete set null;
