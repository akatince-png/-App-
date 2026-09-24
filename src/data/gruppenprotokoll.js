import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Gruppenprotokolle (24.09., Nutzerinnen-Freigabe der Vorschau): ein Team
// führt zusätzlich zu den eigenen Protokollen ein gemeinsames Protokoll mit
// gemeinsamen Bausteinen (jede Person hakt selbst ab) und Gruppen-Quests
// (Team-Ziel über alle Mitglieder). Anlegen/Beenden nur durch Admins.
// Datenbank: supabase/migrations/0096_gruppenprotokolle.sql.

// Auswählbare Bausteine — die ersten fünf zählen automatisch aus den
// vorhandenen Daten jeder Person, "eigen" wird im Gruppenprotokoll abgehakt.
export const AUTO_BAUSTEINE = [
  { art: "morgenroutine", name: "Morgenroutine abschließen", icon: "🌅" },
  { art: "abendroutine", name: "Abendroutine abschließen", icon: "🌙" },
  { art: "trinkziel", name: "Trinkziel erreichen", icon: "💧" },
  { art: "tageslicht", name: "Tageslicht-Ziel erreichen", icon: "☀️" },
  { art: "tagesraetsel", name: "Tagesrätsel lösen", icon: "🧩" },
];

export const DAUER_OPTIONEN = [
  { id: "1w", label: "1 Woche", tage: 7 },
  { id: "3w", label: "3 Wochen", tage: 21 },
  { id: "1m", label: "1 Monat", tage: 30 },
  { id: "offen", label: "offen", tage: null },
];

function plusTage(iso, tage) {
  const [j, m, t] = iso.split("-").map(Number);
  const d = new Date(j, m - 1, t);
  d.setDate(d.getDate() + tage);
  return toLocalISODate(d);
}

export function enddatumAus(start, tage) {
  return tage ? plusTage(start, tage - 1) : null;
}

// "Tag 9 von 21" bzw. "Tag 9" bei offenem Ende.
export function tagImProtokoll(gp, heute = toLocalISODate(new Date())) {
  const [j, m, t] = gp.startdatum.split("-").map(Number);
  const [hj, hm, ht] = heute.split("-").map(Number);
  const tag = Math.round((new Date(hj, hm - 1, ht) - new Date(j, m - 1, t)) / 86400000) + 1;
  let gesamt = null;
  if (gp.enddatum) {
    const [ej, em, et] = gp.enddatum.split("-").map(Number);
    gesamt = Math.round((new Date(ej, em - 1, et) - new Date(j, m - 1, t)) / 86400000) + 1;
  }
  return { tag: Math.max(1, tag), gesamt };
}

// Aus den Status-Zeilen (gruppenprotokoll_status) eine handliche Form:
// Mitglieder (inkl. solcher ohne Treffer) und "wer hat was wann geschafft".
export function statusAufbereiten(zeilen) {
  const mitglieder = new Map();
  const erledigt = new Set();
  for (const z of zeilen || []) {
    if (!mitglieder.has(z.user_id)) mitglieder.set(z.user_id, { userId: z.user_id, vorname: z.vorname, profilbildPfad: z.profilbild_pfad, privat: !!z.privat });
    if (z.baustein_id && z.datum) erledigt.add(`${z.user_id}|${z.baustein_id}|${z.datum}`);
  }
  return { mitglieder: [...mitglieder.values()], erledigt };
}

// Enddatum überschritten, aber vom Coach noch nicht beendet: bleibt auf der
// Team-Seite als "abgeschlossen" sichtbar, aber nicht mehr zum Abhaken.
export function istAbgelaufen(gp, heute = toLocalISODate(new Date())) {
  return !!gp.enddatum && gp.enddatum < heute;
}

export function werHatHeute(status, bausteinId, datum) {
  return status.mitglieder.filter((m) => status.erledigt.has(`${m.userId}|${bausteinId}|${datum}`));
}

// Fortschritt einer Gruppen-Quest: alle "geschafft"-Einträge des Bausteins
// über alle Mitglieder und Tage; ohne Baustein alle Bausteine zusammen.
export function questFortschritt(quest, status, userId) {
  let gesamt = 0;
  let eigen = 0;
  for (const key of status.erledigt) {
    const [uid, bid] = key.split("|");
    if (quest.baustein_id && bid !== quest.baustein_id) continue;
    gesamt++;
    if (uid === userId) eigen++;
  }
  return { gesamt, eigen, ziel: quest.ziel_anzahl, geschafft: gesamt >= quest.ziel_anzahl };
}

export function useGruppenprotokolle(userId, teamId) {
  const [gruppenprotokolle, setGruppenprotokolle] = useState([]);
  const [eigeneGruppenLogs, setEigeneGruppenLogs] = useState([]);
  const abgebrochen = useRef(false);

  const load = useCallback(async () => {
    if (!userId || !teamId) {
      setGruppenprotokolle([]);
      setEigeneGruppenLogs([]);
      return;
    }
    const { data: gps, error } = await supabase.from("gruppenprotokolle").select("*").eq("team_id", teamId).eq("status", "active").order("erstellt_am");
    if (abgebrochen.current) return;
    if (error) {
      console.error(error);
      return;
    }
    const ids = (gps || []).map((g) => g.id);
    if (ids.length === 0) {
      setGruppenprotokolle([]);
      setEigeneGruppenLogs([]);
      return;
    }
    const heute = toLocalISODate(new Date());
    const [{ data: bausteine }, { data: quests }, { data: logs }, ...statusListe] = await Promise.all([
      supabase.from("gruppen_bausteine").select("*").in("gruppenprotokoll_id", ids).order("reihenfolge"),
      supabase.from("gruppen_quests").select("*").in("gruppenprotokoll_id", ids).order("erstellt_am"),
      supabase.from("gruppen_baustein_logs").select("baustein_id, datum").eq("user_id", userId),
      // Nach dem Enddatum zählt nichts mehr dazu (Quest-Stand bleibt stehen).
      ...gps.map((g) => supabase.rpc("gruppenprotokoll_status", { p_gp: g.id, p_von: g.startdatum, p_bis: g.enddatum && g.enddatum < heute ? g.enddatum : heute })),
    ]);
    if (abgebrochen.current) return;
    setEigeneGruppenLogs((logs || []).map((l) => ({ bausteinId: l.baustein_id, datum: l.datum })));
    setGruppenprotokolle(
      gps.map((g, i) => ({
        ...g,
        abgelaufen: istAbgelaufen(g, heute),
        bausteine: (bausteine || []).filter((b) => b.gruppenprotokoll_id === g.id),
        quests: (quests || []).filter((q) => q.gruppenprotokoll_id === g.id),
        // "stand" = wer hat wann was geschafft ("status" bleibt active/archived)
        stand: statusAufbereiten(statusListe[i]?.data),
      }))
    );
  }, [userId, teamId]);

  useEffect(() => {
    abgebrochen.current = false;
    load();
    // Zurück in die App (Handy entsperrt, Tab gewechselt) → Stand auffrischen,
    // die anderen im Team haken ja in der Zwischenzeit weiter ab.
    const sichtbar = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", sichtbar);
    return () => {
      abgebrochen.current = true;
      document.removeEventListener("visibilitychange", sichtbar);
    };
  }, [load]);

  // Eigene Gruppen-Gewohnheit (art "eigen") für heute ab-/anhaken.
  const gruppenBausteinUmschalten = useCallback(
    async (bausteinId, datum = toLocalISODate(new Date())) => {
      const schonDa = eigeneGruppenLogs.some((l) => l.bausteinId === bausteinId && l.datum === datum);
      const { error } = schonDa
        ? await supabase.from("gruppen_baustein_logs").delete().eq("baustein_id", bausteinId).eq("user_id", userId).eq("datum", datum)
        : await supabase.from("gruppen_baustein_logs").insert({ baustein_id: bausteinId, user_id: userId, datum });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      await load();
      return { ok: true, erledigt: !schonDa };
    },
    [eigeneGruppenLogs, userId, load]
  );

  return { gruppenprotokolle, eigeneGruppenLogs, gruppenBausteinUmschalten, gruppenprotokolleNeuLaden: load };
}

// --- Admin: anlegen, auflisten, beenden (wie adminTeam* in useTeamData.js) ---

export async function adminGruppenprotokolleListe(teamId) {
  const { data, error } = await supabase
    .from("gruppenprotokolle")
    .select("*, gruppen_bausteine(*), gruppen_quests(*)")
    .eq("team_id", teamId)
    .order("erstellt_am", { ascending: false });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, gruppenprotokolle: data || [] };
}

// bausteine: [{ art, name, icon }], quests: [{ titel, bausteinIndex|null, zielAnzahl, belohnung }]
export async function adminGruppenprotokollAnlegen({ teamId, name, ziel, dauerTage, bausteine, quests, erstelltVon }) {
  if (!name?.trim()) return { ok: false, error: "Bitte einen Namen eingeben." };
  if (!bausteine?.length) return { ok: false, error: "Bitte mindestens einen Baustein wählen." };
  const start = toLocalISODate(new Date());
  const { data: gp, error } = await supabase
    .from("gruppenprotokolle")
    .insert({ team_id: teamId, name: name.trim(), ziel: ziel?.trim() || null, startdatum: start, enddatum: enddatumAus(start, dauerTage), erstellt_von: erstelltVon || null })
    .select()
    .single();
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  const { data: gespeicherteBausteine, error: bFehler } = await supabase
    .from("gruppen_bausteine")
    .insert(bausteine.map((b, i) => ({ gruppenprotokoll_id: gp.id, art: b.art, name: b.name.trim(), icon: b.icon || null, reihenfolge: i })))
    .select();
  if (bFehler) {
    console.error(bFehler);
    await supabase.from("gruppenprotokolle").delete().eq("id", gp.id);
    return { ok: false, error: bFehler.message };
  }
  const sortiert = [...(gespeicherteBausteine || [])].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const questZeilen = (quests || [])
    .filter((q) => q.titel?.trim() && Number(q.zielAnzahl) > 0)
    .map((q) => ({
      gruppenprotokoll_id: gp.id,
      titel: q.titel.trim(),
      baustein_id: q.bausteinIndex != null ? sortiert[q.bausteinIndex]?.id || null : null,
      ziel_anzahl: Number(q.zielAnzahl),
      belohnung: q.belohnung?.trim() || null,
    }));
  if (questZeilen.length) {
    const { error: qFehler } = await supabase.from("gruppen_quests").insert(questZeilen);
    if (qFehler) {
      console.error(qFehler);
      return { ok: false, error: qFehler.message };
    }
  }
  return { ok: true, gruppenprotokoll: gp };
}

export async function adminGruppenprotokollBeenden(id) {
  const { error } = await supabase.from("gruppenprotokolle").update({ status: "archived", enddatum: toLocalISODate(new Date()) }).eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
