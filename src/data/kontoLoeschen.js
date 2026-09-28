import { supabase } from "../lib/supabaseClient";
import { edgeFunctionFehlertext } from "../utils/edgeFunctionFehler";

// Konto endgültig löschen (28.09., Edge Function konto-loeschen). Ohne
// userId: eigenes Konto. Mit userId: nur als Admin (Coachee löschen).
export async function kontoLoeschen(userId = null) {
  const { data, error } = await supabase.functions.invoke("konto-loeschen", { body: userId ? { userId } : {} });
  if (error || data?.error) return { ok: false, error: await edgeFunctionFehlertext(error, data, "Das Konto konnte nicht gelöscht werden.") };
  return { ok: true };
}
