import { supabase } from "../lib/supabaseClient";
import { EINSTELLUNG, etappenAenderungen, tageZwischen, wiederholungAb, zeileZuProgramm, zeileZuTeilnahme } from "../utils/programme";
import { toLocalISODate } from "../utils/dates";
import { plusTage } from "../utils/schichtplan";
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

// ---- Pausieren, Woche wiederholen, persönliche Einstellungen (26.09.) ----

async function etappenRoh(userId) {
  const { data } = await supabase.from("coaching_etappen").select("id, nummer, start, ende").eq("user_id", userId).order("nummer");
  return data || [];
}

async function etappenAnwenden(aenderungen) {
  for (const a of aenderungen) {
    const { error } = await supabase.from("coaching_etappen").update({ start: a.start, ende: a.ende }).eq("id", a.id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
  }
  return { ok: true };
}

// Pausieren merkt sich den Tag; beim Fortsetzen rückt alles um die Pause nach hinten.
export async function programmPausieren(userId, programmId, teilnahme) {
  const einstellungen = { ...(teilnahme?.einstellungen || {}), pauseSeit: toLocalISODate(new Date()) };
  return teilnahmeSetzen(userId, programmId, { status: "pausiert", einstellungen });
}

export async function programmFortsetzen(userId, programmId, teilnahme) {
  const heute = toLocalISODate(new Date());
  const { pauseSeit, ...rest } = teilnahme?.einstellungen || {};
  const tage = pauseSeit ? Math.max(0, tageZwischen(pauseSeit, heute)) : 0;
  const einstellungen = { ...rest };
  if (tage > 0 && programmId === EINSTELLUNG) {
    const r = await etappenAnwenden(etappenAenderungen(await etappenRoh(userId), heute, tage, "pause"));
    if (!r.ok) return r;
    // Noch ausstehende Wiederholungen rücken mit.
    einstellungen.verschiebungen = (rest.verschiebungen || []).map((v) => (v.ab >= pauseSeit ? { ...v, ab: plusTage(v.ab, tage) } : v));
  }
  return teilnahmeSetzen(userId, programmId, { status: "laufend", einstellungen });
}

// Laufende Woche wiederholen: ab dem Tag nach dem Ende dieser Woche.
export async function wocheWiederholen(userId, teilnahme, stand) {
  const ab = wiederholungAb(stand);
  if (!ab) return { ok: false, error: "Gerade läuft keine Woche." };
  const liste = teilnahme?.einstellungen?.verschiebungen || [];
  if (liste.some((v) => v.ab === ab)) return { ok: true };
  const r = await etappenAnwenden(etappenAenderungen(await etappenRoh(userId), ab, 7, "wiederholung"));
  if (!r.ok) return r;
  const einstellungen = { ...(teilnahme?.einstellungen || {}), verschiebungen: [...liste, { etappeId: stand.etappe.id, ab, tage: 7, woche: stand.gesamtWoche }] };
  return teilnahmeSetzen(userId, EINSTELLUNG, { einstellungen });
}

// Noch nicht begonnene Wiederholung zurücknehmen.
export async function wiederholungZuruecknehmen(userId, teilnahme, v) {
  if (v.ab <= toLocalISODate(new Date())) return { ok: false, error: "Die Wiederholung läuft schon." };
  const r = await etappenAnwenden(etappenAenderungen(await etappenRoh(userId), v.ab, -7, "wiederholung"));
  if (!r.ok) return r;
  const einstellungen = { ...(teilnahme?.einstellungen || {}), verschiebungen: (teilnahme?.einstellungen?.verschiebungen || []).filter((x) => x.ab !== v.ab) };
  return teilnahmeSetzen(userId, EINSTELLUNG, { einstellungen });
}

// Persönliche Einstellungen: ausgelassene Bausteine + Notiz.
export async function persoenlichSpeichern(userId, programmId, teilnahme, { ausgelassen, notiz }) {
  const einstellungen = { ...(teilnahme?.einstellungen || {}), ausgelassen: ausgelassen || [] };
  return teilnahmeSetzen(userId, programmId, { einstellungen, notiz: notiz ?? "" });
}
