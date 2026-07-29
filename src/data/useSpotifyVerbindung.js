import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Verwaltet den Verbindungsstatus + die Standard-Playlist für "Aka startet
// meine Musik" (siehe 0037_spotify_verbindung.sql). Der eigentliche
// OAuth-Austausch läuft separat über spotifyCodeAustauschen()
// (src/services/spotify.js), aufgerufen einmalig nach der Rückkehr von
// Spotify — hier nur Lesen/Playlist pflegen/Wiedergabe anstoßen.
export function useSpotifyVerbindung(userId) {
  const [spotifyVerbunden, setSpotifyVerbunden] = useState(false);
  const [spotifyPlaylistUri, setSpotifyPlaylistUriState] = useState("");
  const [spotifyTestet, setSpotifyTestet] = useState(false);
  const [spotifyFehler, setSpotifyFehler] = useState(null);

  const spotifyVerbindungNeuLaden = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("spotify_verbindung").select("playlist_uri").eq("user_id", userId).maybeSingle();
    setSpotifyVerbunden(!!data);
    setSpotifyPlaylistUriState(data?.playlist_uri || "");
  }, [userId]);

  useEffect(() => {
    spotifyVerbindungNeuLaden();
  }, [spotifyVerbindungNeuLaden]);

  const spotifyPlaylistSpeichern = useCallback(
    async (uri) => {
      setSpotifyPlaylistUriState(uri);
      const { error } = await supabase.from("spotify_verbindung").update({ playlist_uri: uri }).eq("user_id", userId);
      if (error) console.error(error);
    },
    [userId]
  );

  const spotifyVerbindungTrennen = useCallback(async () => {
    await supabase.from("spotify_verbindung").delete().eq("user_id", userId);
    setSpotifyVerbunden(false);
    setSpotifyPlaylistUriState("");
  }, [userId]);

  const spotifyAbspielen = useCallback(async () => {
    setSpotifyTestet(true);
    setSpotifyFehler(null);
    const { data, error } = await supabase.functions.invoke("spotify-play", { body: { targetUserId: userId } });
    setSpotifyTestet(false);
    if (error || data?.error) {
      setSpotifyFehler(data?.error || error.message);
      return { ok: false };
    }
    return { ok: true };
  }, [userId]);

  return {
    spotifyVerbunden,
    spotifyPlaylistUri,
    spotifyPlaylistSpeichern,
    spotifyVerbindungTrennen,
    spotifyAbspielen,
    spotifyTestet,
    spotifyFehler,
    spotifyVerbindungNeuLaden,
  };
}
