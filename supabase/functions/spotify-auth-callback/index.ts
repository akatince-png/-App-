// Tauscht den von Spotify per OAuth zurückgegebenen "code" gegen ein
// Access-/Refresh-Token-Paar — muss serverseitig laufen, weil dafür das
// SPOTIFY_CLIENT_SECRET nötig ist, das niemals im Browser landen darf.
// Wird von src/services/spotify.js direkt nach der Rückkehr von
// accounts.spotify.com aufgerufen (siehe useSpotifyOAuthCallback in
// AuthenticatedApp.jsx).
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

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return json({ error: "SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET sind auf dem Server nicht gesetzt." }, 500);
    }

    const { code, redirectUri, targetUserId } = await req.json();
    if (!code || !redirectUri) return json({ error: "code und redirectUri sind Pflichtfelder." }, 400);

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return json({ error: tokenData.error_description || "Spotify hat den Code abgelehnt." }, 400);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // targetUserId: falls der Admin gerade "verwaltet" (Verwalten-als-Modus)
    // und die Verbindung für die Probandin/den Probanden herstellt, statt
    // für sich selbst — sonst greift wie üblich der eigene Account.
    let userId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      const { data: callerProfile } = await adminClient.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (!callerProfile?.is_admin) return json({ error: "Nur Admins dürfen für eine andere Person verbinden." }, 403);
      userId = targetUserId;
    }

    const ablauf = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const { error } = await adminClient.from("spotify_verbindung").upsert({
      user_id: userId,
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token,
      token_laeuft_ab: ablauf,
    });
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message || "Unbekannter Fehler." }, 500);
  }
});
