import { supabase } from "../lib/supabaseClient";
import { grundTyp, nachweisPfad } from "../utils/videoNachweis";

// Video-Nachweise (27.09., Migration 0113): hochladen (Person), ansehen +
// bestätigen (Coach). Nach der Bestätigung wird das Video sofort gelöscht.
const BUCKET = "nachweise";

export async function nachweisHochladen(userId, blob, { art, bezugId, titel, dauerSek }) {
  const id = crypto.randomUUID();
  const pfad = nachweisPfad(userId, id, blob.type);
  const { error: e1 } = await supabase.storage.from(BUCKET).upload(pfad, blob, { contentType: grundTyp(blob.type), upsert: false });
  if (e1) {
    console.error(e1);
    return { ok: false, error: e1.message };
  }
  const { error: e2 } = await supabase.from("video_nachweise").insert({ id, user_id: userId, art, bezug_id: bezugId ? String(bezugId) : null, titel, pfad, dauer_sek: dauerSek || null });
  if (e2) {
    console.error(e2);
    await supabase.storage.from(BUCKET).remove([pfad]);
    return { ok: false, error: e2.message };
  }
  return { ok: true, id };
}

export async function nachweiseLaden({ nurOffen = true } = {}) {
  let q = supabase.from("video_nachweise").select("*").order("created_at", { ascending: false }).limit(100);
  if (nurOffen) q = q.eq("status", "offen").not("pfad", "is", null);
  const { data, error } = await q;
  if (error) console.error(error);
  return data || [];
}

export async function nachweisUrl(pfad) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pfad, 600);
  if (error) return null;
  return data?.signedUrl || null;
}

// Coach: bestätigen oder "passt nicht" → Video löschen, Eintrag bleibt.
export async function nachweisEntscheiden(n, status) {
  const { data: auth } = await supabase.auth.getUser();
  if (n.pfad) {
    const { error } = await supabase.storage.from(BUCKET).remove([n.pfad]);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
  }
  const { error } = await supabase
    .from("video_nachweise")
    .update({ status, pfad: null, bestaetigt_von: auth?.user?.id || null, bestaetigt_am: new Date().toISOString(), geloescht_am: new Date().toISOString() })
    .eq("id", n.id);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
