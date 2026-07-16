import { supabase } from "./supabaseClient";

const BUCKET = "photos";

/**
 * Lädt eine Bilddatei in Supabase Storage hoch, in einem nach user_id
 * getrennten Ordner, und gibt eine zeitlich befristete signierte URL zurück.
 */
export async function uploadPhoto(userId, file, folder) {
  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (uploadError) throw uploadError;

  return path;
}

/**
 * Erzeugt eine signierte, zeitlich befristete URL für einen gespeicherten Foto-Pfad.
 * Der Bucket ist privat, daher können Pfade nicht direkt öffentlich verlinkt werden.
 */
export async function getSignedPhotoUrl(path, expiresInSeconds = 60 * 60) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
