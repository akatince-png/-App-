import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Profilbilder (24.09., Nutzerinnen-Wunsch): freiwilliges Foto im Profil,
// sichtbar für die Person selbst, Admin/Coach und das eigene Team (Regeln:
// supabase/migrations/0094_profilbilder.sql). Privater Bucket — angezeigt
// wird über kurzlebige signierte Links.
const BUCKET = "profilbilder";
const MAX_KANTE = 512;

// Handyfotos sind oft mehrere MB groß: vor dem Hochladen quadratisch
// zuschneiden (Mitte) und auf 512 px verkleinern — reicht für Avatare,
// spart Speicher und Ladezeit.
export async function bildVerkleinern(datei) {
  const url = URL.createObjectURL(datei);
  try {
    const bild = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Das Bild konnte nicht gelesen werden."));
      img.src = url;
    });
    const kante = Math.min(bild.naturalWidth, bild.naturalHeight);
    const ziel = Math.min(MAX_KANTE, kante);
    const canvas = document.createElement("canvas");
    canvas.width = ziel;
    canvas.height = ziel;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bild, (bild.naturalWidth - kante) / 2, (bild.naturalHeight - kante) / 2, kante, kante, 0, 0, ziel, ziel);
    return await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Das Bild konnte nicht umgewandelt werden."))), "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function profilbildHochladen(userId, datei, alterPfad) {
  if (!datei?.type?.startsWith("image/")) return { ok: false, error: "Bitte ein Foto auswählen." };
  let blob;
  try {
    blob = await bildVerkleinern(datei);
  } catch (e) {
    return { ok: false, error: e.message };
  }
  // Neuer Dateiname bei jedem Wechsel — sonst zeigen Caches das alte Bild.
  const pfad = `${userId}/profil-${Date.now()}.jpg`;
  const { error: uploadFehler } = await supabase.storage.from(BUCKET).upload(pfad, blob, { contentType: "image/jpeg", upsert: false });
  if (uploadFehler) {
    console.error(uploadFehler);
    return { ok: false, error: "Hochladen fehlgeschlagen. Bitte nochmal versuchen." };
  }
  const { error: profilFehler } = await supabase.from("profiles").update({ profilbild_pfad: pfad }).eq("id", userId);
  if (profilFehler) {
    console.error(profilFehler);
    await supabase.storage.from(BUCKET).remove([pfad]);
    return { ok: false, error: "Das Foto konnte nicht gespeichert werden." };
  }
  if (alterPfad) await supabase.storage.from(BUCKET).remove([alterPfad]);
  urlCache.delete(alterPfad);
  return { ok: true, pfad };
}

export async function profilbildEntfernen(userId, pfad) {
  const { error } = await supabase.from("profiles").update({ profilbild_pfad: null }).eq("id", userId);
  if (error) {
    console.error(error);
    return { ok: false, error: "Entfernen fehlgeschlagen." };
  }
  if (pfad) await supabase.storage.from(BUCKET).remove([pfad]);
  urlCache.delete(pfad);
  return { ok: true };
}

// Signierte Links 1 h gültig, im Speicher zwischengespeichert, damit Listen
// (Rangliste, Team) nicht bei jedem Rendern neu anfragen.
const urlCache = new Map(); // pfad -> { url, bis }

export function useProfilbildUrl(rohPfad) {
  const pfad = typeof rohPfad === "string" && rohPfad ? rohPfad : null;
  const [url, setUrl] = useState(() => {
    const c = pfad && urlCache.get(pfad);
    return c && c.bis > Date.now() ? c.url : null;
  });
  useEffect(() => {
    if (!pfad) {
      setUrl(null);
      return undefined;
    }
    const c = urlCache.get(pfad);
    if (c && c.bis > Date.now()) {
      setUrl(c.url);
      return undefined;
    }
    let abgebrochen = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(pfad, 3600)
      .then(({ data, error }) => {
        if (abgebrochen || error || !data?.signedUrl) return;
        urlCache.set(pfad, { url: data.signedUrl, bis: Date.now() + 55 * 60 * 1000 });
        setUrl(data.signedUrl);
      });
    return () => {
      abgebrochen = true;
    };
  }, [pfad]);
  return url;
}
