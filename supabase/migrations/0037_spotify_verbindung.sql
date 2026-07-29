-- Spotify-Anbindung: Grundlage für "Aka startet meine Musik" (Morgenroutine,
-- Nutzerin-Vorgabe 29.07.). Speichert pro Person die Spotify-Zugangsdaten
-- (OAuth Refresh-Token) + eine Standard-Playlist, die Aka auf Zuruf/als
-- Teil einer Routine starten kann. Token-Austausch/Wiedergabe laufen
-- ausschließlich über Edge Functions (spotify-auth-callback, spotify-play)
-- mit dem Spotify-Client-Secret nur serverseitig — nie im Browser.
create table public.spotify_verbindung (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  token_laeuft_ab timestamptz,
  playlist_uri text,
  verbunden_am timestamptz not null default now()
);

alter table public.spotify_verbindung enable row level security;

create policy "spotify_verbindung: eigene Zeile" on public.spotify_verbindung for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spotify_verbindung: admin voller Zugriff" on public.spotify_verbindung for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
