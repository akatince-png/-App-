import { supabase } from "../lib/supabaseClient";

// Nur die Berechtigungen, die "Aka startet meine Musik" wirklich braucht —
// keine Bibliotheks-/Freundeslisten-Rechte o. ä.
const SCOPES = "user-read-playback-state user-modify-playback-state";

export function spotifyRedirectUri() {
  return `${window.location.origin}/`;
}

// client_id ist NICHT geheim (steht auch in der URL, die an Spotify geht) —
// anders als das Client-Secret, das ausschließlich in den Edge Functions
// (spotify-auth-callback, spotify-play) als Secret liegt.
export function spotifyAutorisierenUrl() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: spotifyRedirectUri(),
    scope: SCOPES,
    state: "aka_spotify_connect",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function spotifyCodeAustauschen(code, targetUserId) {
  const { data, error } = await supabase.functions.invoke("spotify-auth-callback", {
    body: { code, redirectUri: spotifyRedirectUri(), targetUserId },
  });
  if (error || data?.error) throw new Error(data?.error || error.message);
  return data;
}

// Nimmt sowohl einen vollen Spotify-Freigabe-Link
// (https://open.spotify.com/playlist/ABC123...) als auch eine
// spotify:playlist:ABC123-URI entgegen — Nutzerinnen kopieren meistens den
// Link aus der Spotify-App, nicht die interne URI-Schreibweise.
export function spotifyPlaylistUriNormalisieren(eingabe) {
  const wert = eingabe.trim();
  if (!wert) return "";
  if (wert.startsWith("spotify:playlist:")) return wert;
  const match = wert.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? `spotify:playlist:${match[1]}` : wert;
}
