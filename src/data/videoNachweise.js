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

// ---- Archiv (27.09.) ----

// Coach: Video behalten (zum Besprechen oder im Archiv) – Datei bleibt.
export async function nachweisBehalten(n, status) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("video_nachweise").update({ status, bestaetigt_von: auth?.user?.id || null, bestaetigt_am: new Date().toISOString() }).eq("id", n.id);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Coach: Datei löschen, Eintrag behalten (Status bleibt bzw. wird gesetzt).
export async function nachweisDateiLoeschen(n, status = n.status) {
  return nachweisEntscheiden(n, status);
}

export async function nachweisDownloadUrl(pfad, dateiname) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pfad, 600, { download: dateiname });
  if (error) return null;
  return data?.signedUrl || null;
}

// Archiv einer Person (Coach): behaltene Videos mit Datei.
export async function archivLaden(userId) {
  const { data, error } = await supabase
    .from("video_nachweise")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["besprechen", "archiviert"])
    .not("pfad", "is", null)
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return data || [];
}

export async function einverstaendnisLaden(userIds) {
  if (!userIds?.length) return {};
  const { data } = await supabase.from("profiles").select("id, video_archiv_einverstanden").in("id", userIds);
  return Object.fromEntries((data || []).map((r) => [r.id, r.video_archiv_einverstanden]));
}

// Person: Einverständnis geben oder widerrufen.
export async function einverstaendnisSetzen(userId, ja) {
  const { error } = await supabase.from("profiles").update({ video_archiv_einverstanden: !!ja, video_archiv_einverstanden_am: new Date().toISOString() }).eq("id", userId);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
