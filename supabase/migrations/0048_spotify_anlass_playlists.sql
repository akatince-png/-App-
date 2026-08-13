-- Nutzerinnen-Vorgabe 13.08.: die bereits vorhandenen, frei benannten
-- Spotify-Playlists (0038_spotify_playlists.sql) sollen zusätzlich fest
-- bestimmten Anlässen zuordenbar sein — Morgenroutine, Abendroutine,
-- Training, Gewohnheiten — statt sich nur auf Akas Rate-Logik im Chat
-- (SPOTIFY_PLAY-Marker) zu verlassen. "Anlass" ist bewusst freier Text
-- statt eines festen Enums, damit später weitere Anlässe dazukommen können,
-- ohne Schema-Änderung — aktuell nutzt der Code die vier Werte
-- 'morgenroutine', 'abendroutine', 'training', 'gewohnheiten'.
create table public.spotify_anlass_playlists (
  user_id uuid not null references auth.users (id) on delete cascade,
  anlass text not null,
  playlist_id uuid not null references public.spotify_playlists (id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  primary key (user_id, anlass)
);

create index spotify_anlass_playlists_user_idx on public.spotify_anlass_playlists (user_id);

alter table public.spotify_anlass_playlists enable row level security;

create policy "spotify_anlass_playlists: eigene Zeilen" on public.spotify_anlass_playlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spotify_anlass_playlists: admin voller Zugriff" on public.spotify_anlass_playlists for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
