// Supabase Edge Function: löscht Video-Nachweise, die nach 7 Tagen noch
// nicht bestätigt wurden (27.09., Nutzerinnen-Vorgabe: Speicher sparen).
// Wird täglich per pg_cron aufgerufen; Schutz über x-cron-secret, das in
// public.cron_konfig (name = "nachweise-aufraeumen") steht.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TAGE = 7;

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const geschickt = req.headers.get("x-cron-secret");
  const { data: konfig } = await admin.from("cron_konfig").select("wert").eq("name", "nachweise-aufraeumen").maybeSingle();
  if (!geschickt || !konfig?.wert || geschickt !== konfig.wert) {
    return new Response(JSON.stringify({ error: "Nicht autorisiert." }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const grenze = new Date(Date.now() - TAGE * 86400000).toISOString();
  const { data: alte, error } = await admin.from("video_nachweise").select("id, pfad, status").not("pfad", "is", null).lt("created_at", grenze).limit(500);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  let geloescht = 0;
  if (alte?.length) {
    const { error: e2 } = await admin.storage.from("nachweise").remove(alte.map((a) => a.pfad as string));
    if (e2) return new Response(JSON.stringify({ error: e2.message }), { status: 500 });
    for (const a of alte) {
      await admin
        .from("video_nachweise")
        .update({ pfad: null, geloescht_am: new Date().toISOString(), ...(a.status === "offen" ? { status: "abgelaufen" } : {}) })
        .eq("id", a.id);
      geloescht++;
    }
  }
  return new Response(JSON.stringify({ ok: true, geloescht }), { headers: { "Content-Type": "application/json" } });
});
