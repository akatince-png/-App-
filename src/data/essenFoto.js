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

// Hochladen immer in den Ordner der ANGEMELDETEN Person (Speicherregeln +
// Pfadprüfung der Function). Im "Verwalten als"-Modus ist das der Admin –
// die Erkennung funktioniert dann trotzdem; das Foto selbst wird nicht an
// den Eintrag der verwalteten Person gehängt (sie könnte es nicht sehen).
async function eigeneId(fallback) {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || fallback;
}

export async function essenFotoAuswerten(userId, file, art, text) {
  const bild = await verkleinern(file);
  const fotoPath = await uploadPhoto(await eigeneId(userId), bild, "essen");
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

// Präparat per Foto (25.09.): Supplement-Dose oder Medikamenten-Packung,
// optional mit "3 Kapseln davon". art: "supplement" | "medikament".
// Liefert { name, form, menge, portion, inhaltsstoffe: [{ name, menge, einheit }], hinweis }.
export async function praeparatFotoAuswerten(userId, file, art, text) {
  const bild = await verkleinern(file);
  const ich = await eigeneId(userId);
  const fotoPath = await uploadPhoto(ich, bild, art === "medikament" ? "medikamente" : "supplemente");
  const { data, error } = await supabase.functions.invoke("essen-scan", { body: { fotoPath, mediaType: bild.type || "image/jpeg", art, text } });
  if (error || data?.error) throw new Error(await edgeFunctionFehlertext(error, data, "Das Foto konnte nicht ausgewertet werden."));
  const p = data.praeparat || {};
  return {
    name: p.name || "",
    form: p.form || "",
    menge: p.menge || "",
    portion: p.portion || "",
    hinweis: p.hinweis || "",
    inhaltsstoffe: (p.inhaltsstoffe || []).filter((s) => s?.name).map((s) => ({ name: s.name, menge: Number(s.menge) || 0, einheit: s.einheit || "" })),
    fotoPath: ich === userId ? fotoPath : null,
  };
}
