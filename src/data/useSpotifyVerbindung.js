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
  // Getrennt von spotifyFehler (Wiedergabefehler): der Fehler beim
  // Verbinden selbst (spotifyCodeAustauschen in AuthenticatedApp.jsx) wurde
  // bisher nur in der Browser-Konsole geloggt und war für die Nutzerin
  // unsichtbar — "es verbindet sich nicht mehr" ließ sich so nicht
  // diagnostizieren. Jetzt in MehrTab.jsx sichtbar.
  const [spotifyVerbindungFehler, setSpotifyVerbindungFehler] = useState(null);
  // Anlass → zugeordnete Playlist (13.08., Nachtrag): { morgenroutine:
  // { playlistId, name, uri }, abendroutine: {...}, training: {...},
  // gewohnheiten: {...} } — siehe 0048_spotify_anlass_playlists.sql.
  const [spotifyAnlaesse, setSpotifyAnlaesse] = useState({});

  const spotifyVerbindungNeuLaden = useCallback(async () => {
    if (!userId) return;
    const [{ data: verbindung }, { data: playlists }, { data: zuordnungen }] = await Promise.all([
      supabase.from("spotify_verbindung").select("user_id, auto_play_token").eq("user_id", userId).maybeSingle(),
      supabase.from("spotify_playlists").select("id, name, uri").eq("user_id", userId).order("erstellt_am"),
      supabase.from("spotify_anlass_playlists").select("anlass, playlist_id, spotify_playlists(name, uri)").eq("user_id", userId),
    ]);
    setSpotifyVerbunden(!!verbindung);
    setSpotifyAutoPlayToken(verbindung?.auto_play_token || null);
    setSpotifyPlaylists(playlists || []);
    setSpotifyAnlaesse(
      Object.fromEntries(
        (zuordnungen || []).map((z) => [z.anlass, { playlistId: z.playlist_id, name: z.spotify_playlists?.name, uri: z.spotify_playlists?.uri }])
      )
    );
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
    // Löscht per on-delete-cascade auch etwaige Anlass-Zuordnungen dieser
    // Playlist serverseitig — Client-Zustand muss deshalb mit nachziehen.
    setSpotifyAnlaesse((prev) => Object.fromEntries(Object.entries(prev).filter(([, v]) => v.playlistId !== id)));
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

  // Ordnet eine bestehende Playlist einem festen Anlass zu (Morgenroutine,
  // Abendroutine, Training, Gewohnheiten) — separat von Akas Rate-Logik im
  // Chat. Upsert, weil pro (user, anlass) immer nur eine Zuordnung gilt.
  const spotifyAnlassSetzen = useCallback(
    async (anlass, playlistId) => {
      const { error } = await supabase
        .from("spotify_anlass_playlists")
        .upsert({ user_id: userId, anlass, playlist_id: playlistId }, { onConflict: "user_id,anlass" });
      if (error) return { ok: false, error: error.message };
      await spotifyVerbindungNeuLaden();
      return { ok: true };
    },
    [userId, spotifyVerbindungNeuLaden]
  );

  const spotifyAnlassEntfernen = useCallback(
    async (anlass) => {
      await supabase.from("spotify_anlass_playlists").delete().eq("user_id", userId).eq("anlass", anlass);
      setSpotifyAnlaesse((prev) => {
        const next = { ...prev };
        delete next[anlass];
        return next;
      });
    },
    [userId]
  );

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

  // Hintergrund-Steuerung während eines laufenden Intervall-Timers (14.08.,
  // Nutzerin-Vorgabe) — bewusst OHNE spotifyTestet/spotifyFehler-UI-State:
  // das sind automatische Sync-Aufrufe im Sekundentakt, kein einzelner
  // Nutzer-Tastendruck, den man mit einer Fehleranzeige unterbrechen sollte.
  // Fehler landen nur in der Konsole, der Timer läuft in jedem Fall weiter.
  const spotifyPausieren = useCallback(async () => {
    const { error } = await supabase.functions.invoke("spotify-play", { body: { targetUserId: userId, action: "pause" } });
    if (error) console.error(error);
  }, [userId]);

  const spotifyFortsetzen = useCallback(async () => {
    const { error } = await supabase.functions.invoke("spotify-play", { body: { targetUserId: userId, action: "resume" } });
    if (error) console.error(error);
  }, [userId]);

  const spotifyLautstaerke = useCallback(
    async (prozent) => {
      const { error } = await supabase.functions.invoke("spotify-play", { body: { targetUserId: userId, action: "volume", volumePercent: prozent } });
      if (error) console.error(error);
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
    spotifyPausieren,
    spotifyFortsetzen,
    spotifyLautstaerke,
    spotifyTestet,
    spotifyFehler,
    spotifyVerbindungFehler,
    setSpotifyVerbindungFehler,
    spotifyVerbindungNeuLaden,
    spotifyAutoPlayToken,
    spotifyAutoPlayTokenErzeugen,
    spotifyAnlaesse,
    spotifyAnlassSetzen,
    spotifyAnlassEntfernen,
  };
}
