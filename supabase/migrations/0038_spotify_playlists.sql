-- Mehrere benannte Spotify-Playlists pro Person (Nutzerin-Vorgabe 29.07.):
-- "Morgenroutine", "Chillen abends", "Notfallmodus/Erholung", "Training",
-- "Arbeit/Workflow" o. ä. — frei benennbar, KEINE festen Kategorien im
-- Code. Aka ordnet im Gespräch selbstständig zu (siehe KiChat.jsx,
-- SPOTIFY_PLAY-Marker), indem der Name jeder Playlist als Kontext
-- mitgeschickt wird und die KI den passendsten auswählt.
create table public.spotify_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  uri text not null,
  erstellt_am timestamptz not null default now()
);

create index spotify_playlists_user_idx on public.spotify_playlists (user_id);

alter table public.spotify_playlists enable row level security;

create policy "spotify_playlists: eigene Zeilen" on public.spotify_playlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spotify_playlists: admin voller Zugriff" on public.spotify_playlists for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
