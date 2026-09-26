import { supabase } from "../lib/supabaseClient";
import { EINSTELLUNG, zeileZuProgramm, zeileZuTeilnahme } from "../utils/programme";
import { kernprogrammStarten } from "./kernprogrammAdmin";

// Coach-Seite des Programm-Moduls (26.09., Migration 0112): Katalog an/aus,
// Teilnahmen je Person (freischalten, starten, pausieren, beenden).

export async function programmeUndTeilnahmenLaden(personIds) {
  const [{ data: p, error: e1 }, { data: t, error: e2 }, { data: tabs }] = await Promise.all([
    supabase.from("programme").select("*").order("reihenfolge"),
    personIds?.length ? supabase.from("programm_teilnahmen").select("*").in("user_id", personIds) : Promise.resolve({ data: [] }),
    personIds?.length ? supabase.from("profiles").select("id, vorstellung_tabs").in("id", personIds) : Promise.resolve({ data: [] }),
  ]);
  if (e1 || e2) console.error(e1 || e2);
  const tabsByUser = {};
  (tabs || []).forEach((r) => r.vorstellung_tabs?.length && (tabsByUser[r.id] = r.vorstellung_tabs));
  return { programme: (p || []).map(zeileZuProgramm), teilnahmen: (t || []).map(zeileZuTeilnahme), tabsByUser };
}

// Programm für alle an/aus bzw. "neue bekommen es automatisch".
export async function programmEinstellen(programmId, { aktiv, fuerNeue }) {
  const felder = {};
  if (aktiv !== undefined) felder.aktiv = aktiv;
  if (fuerNeue !== undefined) felder.fuer_neue = fuerNeue;
  const { error } = await supabase.from("programme").update(felder).eq("id", programmId);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Teilnahme anlegen oder ändern (Status, Start, Notiz, Einstellungen).
export async function teilnahmeSetzen(userId, programmId, felder) {
  const { data: auth } = await supabase.auth.getUser();
  const row = { user_id: userId, programm_id: programmId, updated_at: new Date().toISOString(), erstellt_von: auth?.user?.id || null };
  if (felder.status !== undefined) row.status = felder.status;
  if (felder.start !== undefined) row.start = felder.start;
  if (felder.notiz !== undefined) row.notiz = felder.notiz;
  if (felder.einstellungen !== undefined) row.einstellungen = felder.einstellungen;
  const { error } = await supabase.from("programm_teilnahmen").upsert(row, { onConflict: "user_id,programm_id" });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Programm für eine oder mehrere Personen starten. Die Einstellungsphase
// legt zusätzlich Etappe 1 des Kernprogramms an (Start = der Abend dieses
// Tages, mit der ersten Abendroutine).
export async function programmStarten(personIds, programmId, start) {
  if (!personIds.length) return { ok: true, anzahl: 0 };
  if (programmId === EINSTELLUNG) {
    const r = await kernprogrammStarten(personIds, start);
    if (!r.ok) return r;
  }
  for (const id of personIds) {
    const r = await teilnahmeSetzen(id, programmId, { status: "laufend", start });
    if (!r.ok) return r;
  }
  return { ok: true, anzahl: personIds.length };
}
