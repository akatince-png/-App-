import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { edgeFunctionFehlertext } from "../utils/edgeFunctionFehler";

// Essen per Foto (25.09.): Foto verkleinern (Handyfotos sind oft > 5 MB),
// in den privaten Bucket laden, Edge Function "essen-scan" auswerten lassen.
// art: "etikett" (Nährwerttabelle + "2 Scheiben") oder "mahlzeit" (Teller).
async function verkleinern(file, maxSeite = 1600) {
  try {
    const bitmap = await createImageBitmap(file);
    const f = Math.min(1, maxSeite / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * f);
    canvas.height = Math.round(bitmap.height * f);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "essen.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export async function essenFotoAuswerten(userId, file, art, text) {
  const bild = await verkleinern(file);
  const fotoPath = await uploadPhoto(userId, bild, "essen");
  const { data, error } = await supabase.functions.invoke("essen-scan", { body: { fotoPath, mediaType: bild.type || "image/jpeg", art, text } });
  if (error || data?.error) throw new Error(await edgeFunctionFehlertext(error, data, "Das Foto konnte nicht ausgewertet werden."));
  return (data.posten || []).map((p) => ({
    text: p.name,
    name: p.name,
    gramm: Number(p.gramm) || 0,
    annahme: p.annahme,
    geschaetzt: true,
    foto: fotoPath,
    werte: { kcal: Math.round(p.kcal), eiweiss: p.eiweiss, fett: p.fett, kh: p.kh, zucker: p.zucker, ballast: p.ballast, omega3: Math.round(p.omega3), epaDha: Math.round(p.epaDha), omega6: Math.round(p.omega6) },
  }));
}
