// Supabase Edge Function: Konto endgültig löschen (28.09., Apple-Richtlinie
// 5.1.1(v) + DSGVO Art. 17, Nutzerin: „sofort selbst löschen“).
//
// - Ohne `userId` im Body: die aufrufende Person löscht ihr eigenes Konto.
// - Mit `userId`: nur Admins, und nur Konten, die selbst kein Admin sind
//   (Coach löscht auf Wunsch eine Coachee).
// Ablauf: eigene Dateien in allen privaten Speichern löschen, dann den
// Zugang (auth.users). Alle Tabellen hängen per ON DELETE CASCADE bzw.
// SET NULL an auth.users/profiles, damit verschwinden alle Einträge mit.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BUCKETS = ["photos", "profilbilder", "nachweise"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Alle Dateien unter `<userId>/…` (rekursiv) auflisten.
async function dateienVon(admin, bucket, pfad) {
  const ergebnis = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(pfad, { limit: 1000, offset });
    if (error || !data?.length) break;
    for (const eintrag of data) {
      const voll = `${pfad}/${eintrag.name}`;
      if (eintrag.id === null) ergebnis.push(...(await dateienVon(admin, bucket, voll)));
      else ergebnis.push(voll);
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return ergebnis;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht angemeldet." });
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Nicht angemeldet." });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const zielId = body?.userId || caller.id;

    if (zielId !== caller.id) {
      const { data: ich } = await admin.from("profiles").select("is_admin").eq("id", caller.id).maybeSingle();
      if (!ich?.is_admin) return json({ error: "Nur Admins dürfen andere Konten löschen." });
      const { data: ziel } = await admin.from("profiles").select("is_admin").eq("id", zielId).maybeSingle();
      if (ziel?.is_admin) return json({ error: "Admin-Konten können hier nicht gelöscht werden." });
    }

    let dateien = 0;
    for (const bucket of BUCKETS) {
      const liste = await dateienVon(admin, bucket, zielId);
      for (let i = 0; i < liste.length; i += 100) {
        const teil = liste.slice(i, i + 100);
        const { error } = await admin.storage.from(bucket).remove(teil);
        if (error) return json({ error: `Dateien konnten nicht gelöscht werden (${bucket}): ${error.message}` });
        dateien += teil.length;
      }
    }

    const { error: loeschFehler } = await admin.auth.admin.deleteUser(zielId);
    if (loeschFehler) return json({ error: loeschFehler.message });

    return json({ ok: true, dateien });
  } catch (err) {
    return json({ error: err?.message || "Unbekannter Fehler." });
  }
});
