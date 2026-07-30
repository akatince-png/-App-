-- Langlebiger "Auto-Play-Schlüssel" pro Person: erlaubt es, Aka OHNE ganz
-- normale Anmeldung (deren Sitzungs-Token nach ~1 Std. abläuft) von außen
-- zum Abspielen der Standard-Playlist zu bewegen — z. B. per iOS-Kurzbefehl,
-- der morgens automatisch die spotify-play Edge Function aufruft, nachdem
-- er Spotify geöffnet (und damit als "aktives Gerät" angemeldet) hat.
-- Nutzerin-Vorgabe 31.07.: komplette Automatik ohne neue Hardware, nur mit
-- dem, was schon da ist (Tablet/Handy + bestehender Kurzbefehl).
alter table public.spotify_verbindung
  add column auto_play_token text unique;

-- Keine neue RLS-Policy nötig: die bestehende "spotify_verbindung: eigene
-- Zeile"-Policy (for all, auth.uid() = user_id) deckt Lesen/Schreiben dieser
-- neuen Spalte bereits ab. Die spotify-play Edge Function liest den
-- Schlüssel ausschließlich über den Service-Role-Client (umgeht RLS
-- ohnehin), wenn kein normaler Auth-Header mitgeschickt wird.
