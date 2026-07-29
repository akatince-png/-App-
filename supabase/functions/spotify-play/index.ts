// Startet Spotify-Wiedergabe (Standard-Playlist oder eine übergebene URI)
// für die aufrufende Person — erneuert das Access-Token bei Bedarf über
// das gespeicherte Refresh-Token. Braucht ein aktives Wiedergabegerät
// (Spotify-App auf dem Handy muss zumindest kürzlich geöffnet gewesen
// sein) — ohne das lehnt Spotify mit 404 "NO_ACTIVE_DEVICE" ab, das geben
// wir als verständliche Fehlermeldung durch.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function frischesAccessToken(adminClient, verbindung) {
  const nochGueltig = verbindung.token_laeuft_ab && new Date(verbindung.token_laeuft_ab).getTime() - Date.now() > 60_000;
  if (nochGueltig) return verbindung.access_token;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: verbindung.refresh_token }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error_description || "Spotify-Token konnte nicht erneuert werden.");

  const ablauf = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  await adminClient
    .from("spotify_verbindung")
    .update({ access_token: tokenData.access_token, token_laeuft_ab: ablauf, ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}) })
    .eq("user_id", verbindung.user_id);

  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht angemeldet." }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Nicht angemeldet." }, 401);

    const { targetUserId, playlistUri } = await req.json().catch(() => ({}));
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      const { data: callerProfile } = await adminClient.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (!callerProfile?.is_admin) return json({ error: "Nur Admins dürfen für eine andere Person abspielen." }, 403);
      userId = targetUserId;
    }

    const { data: verbindung, error: ladeFehler } = await adminClient
      .from("spotify_verbindung")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (ladeFehler) return json({ error: ladeFehler.message }, 500);
    if (!verbindung) return json({ error: "Spotify ist noch nicht verbunden." }, 400);

    const uri = playlistUri || verbindung.playlist_uri;
    if (!uri) return json({ error: "Keine Playlist hinterlegt." }, 400);

    const accessToken = await frischesAccessToken(adminClient, verbindung);

    const playRes = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: uri }),
    });

    if (playRes.status === 204) return json({ ok: true });

    if (playRes.status === 404) {
      return json({ error: "Kein aktives Spotify-Gerät gefunden. Bitte einmal die Spotify-App auf dem Handy öffnen und erneut versuchen." }, 400);
    }
    const fehlerText = await playRes.text();
    return json({ error: fehlerText || "Spotify hat die Wiedergabe abgelehnt." }, playRes.status);
  } catch (err) {
    return json({ error: err.message || "Unbekannter Fehler." }, 500);
  }
});
