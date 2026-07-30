import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Verwaltet den Verbindungsstatus + die Standard-Playlist für "Aka startet
// meine Musik" (siehe 0037_spotify_verbindung.sql). Der eigentliche
// OAuth-Austausch läuft separat über spotifyCodeAustauschen()
// (src/services/spotify.js), aufgerufen einmalig nach der Rückkehr von
// Spotify — hier nur Lesen/Playlist pflegen/Wiedergabe anstoßen.
export function useSpotifyVerbindung(userId) {
  const [spotifyVerbunden, setSpotifyVerbunden] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]); // [{ id, name, uri }]
  const [spotifyAutoPlayToken, setSpotifyAutoPlayToken] = useState(null);
  const [spotifyTestet, setSpotifyTestet] = useState(false);
  const [spotifyFehler, setSpotifyFehler] = useState(null);

  const spotifyVerbindungNeuLaden = useCallback(async () => {
    if (!userId) return;
    const [{ data: verbindung }, { data: playlists }] = await Promise.all([
      supabase.from("spotify_verbindung").select("user_id, auto_play_token").eq("user_id", userId).maybeSingle(),
      supabase.from("spotify_playlists").select("id, name, uri").eq("user_id", userId).order("erstellt_am"),
    ]);
    setSpotifyVerbunden(!!verbindung);
    setSpotifyAutoPlayToken(verbindung?.auto_play_token || null);
    setSpotifyPlaylists(playlists || []);
  }, [userId]);

  useEffect(() => {
    spotifyVerbindungNeuLaden();
  }, [spotifyVerbindungNeuLaden]);

  const spotifyPlaylistHinzufuegen = useCallback(
    async (name, uri) => {
      const { data, error } = await supabase
        .from("spotify_playlists")
        .insert({ user_id: userId, name: name.trim(), uri })
        .select("id, name, uri")
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setSpotifyPlaylists((prev) => [...prev, data]);
      return { ok: true };
    },
    [userId]
  );

  const spotifyPlaylistLoeschen = useCallback(async (id) => {
    await supabase.from("spotify_playlists").delete().eq("id", id);
    setSpotifyPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const spotifyVerbindungTrennen = useCallback(async () => {
    await supabase.from("spotify_verbindung").delete().eq("user_id", userId);
    await supabase.from("spotify_playlists").delete().eq("user_id", userId);
    setSpotifyVerbunden(false);
    setSpotifyPlaylists([]);
    setSpotifyAutoPlayToken(null);
  }, [userId]);

  // Erzeugt (bzw. ersetzt) den langlebigen Auto-Play-Schlüssel für externe
  // Automationen (z. B. einen iOS-Kurzbefehl) — siehe spotify-play Edge
  // Function. Neu erzeugen macht den vorherigen Schlüssel ungültig, falls er
  // mal weitergegeben wurde und zurückgezogen werden soll.
  const spotifyAutoPlayTokenErzeugen = useCallback(async () => {
    const zufallsBytes = crypto.getRandomValues(new Uint8Array(24));
    const token = Array.from(zufallsBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { error } = await supabase.from("spotify_verbindung").update({ auto_play_token: token }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    setSpotifyAutoPlayToken(token);
    return { ok: true };
  }, [userId]);

  // playlistUri: explizit, wenn Aka im Chat eine bestimmte Playlist erkannt
  // hat (siehe KiChat.jsx, SPOTIFY_PLAY-Marker) — ohne Angabe nutzt die
  // Edge Function die hinterlegte Standard-Playlist (falls vorhanden).
  const spotifyAbspielen = useCallback(
    async (playlistUri) => {
      setSpotifyTestet(true);
      setSpotifyFehler(null);
      const { data, error } = await supabase.functions.invoke("spotify-play", {
        body: { targetUserId: userId, ...(playlistUri ? { playlistUri } : {}) },
      });
      setSpotifyTestet(false);
      if (error || data?.error) {
        setSpotifyFehler(data?.error || error.message);
        return { ok: false };
      }
      return { ok: true };
    },
    [userId]
  );

  return {
    spotifyVerbunden,
    spotifyPlaylists,
    spotifyPlaylistHinzufuegen,
    spotifyPlaylistLoeschen,
    spotifyVerbindungTrennen,
    spotifyAbspielen,
    spotifyTestet,
    spotifyFehler,
    spotifyVerbindungNeuLaden,
    spotifyAutoPlayToken,
    spotifyAutoPlayTokenErzeugen,
  };
}
