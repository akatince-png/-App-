import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowZuFortschritt(f) {
  if (!f) return { wert: null, erledigt: false, erledigtAm: null, notiz: "", dauerMinuten: null };
  return {
    wert: f.wert,
    erledigt: f.erledigt,
    erledigtAm: f.erledigt_am,
    notiz: f.notiz || "",
    dauerMinuten: f.dauer_minuten,
  };
}

function rowZuQuest(q, fortschrittByQuestId) {
  return {
    id: q.id,
    probandId: q.proband_id,
    fuerAlle: q.proband_id === null,
    titel: q.titel,
    beschreibung: q.beschreibung || "",
    typ: q.typ,
    zielAnzahl: q.ziel_anzahl,
    einheit: q.einheit || "",
    gueltigBis: q.gueltig_bis || "",
    aktiv: q.aktiv,
    erstelltAm: q.erstellt_am,
    fortschritt: rowZuFortschritt(fortschrittByQuestId[q.id]),
  };
}

// Freiwillige Sonderaufgaben zusätzlich zum Pflicht-Protokoll (siehe
// 0070_quests.sql). Coachee-Sicht: aktive, für sie sichtbare Quests (eigene
// + Rundruf-Quests) inkl. ihrem eigenen Fortschritt. Anlegen/Verwalten/
// Auswerten läuft NICHT über diesen Hook, sondern über die admin*-
// Funktionen unten (analog coachNachrichtSenden in useCoacheeNachrichten.js
// — die Admin agiert für beliebige/mehrere Coachees, nicht für eine feste
// userId).
export function useQuestData(userId) {
  const [quests, setQuests] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: questRows }, { data: fortschrittRows }] = await Promise.all([
      supabase
        .from("quests")
        .select("*")
        .eq("aktiv", true)
        .or(`proband_id.eq.${userId},proband_id.is.null`)
        .order("erstellt_am", { ascending: false }),
      supabase.from("quest_fortschritt").select("*").eq("user_id", userId),
    ]);
    const fortschrittByQuestId = {};
    for (const f of fortschrittRows || []) fortschrittByQuestId[f.quest_id] = f;
    setQuests((questRows || []).map((q) => rowZuQuest(q, fortschrittByQuestId)));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // patch kann wert/notiz/dauerMinuten/erledigt enthalten — ein Upsert, weil
  // bei Rundruf-Quests beim ersten Speichern noch keine Zeile existiert.
  const questFortschrittSpeichern = useCallback(
    async (questId, patch) => {
      const row = { quest_id: questId, user_id: userId, aktualisiert_am: new Date().toISOString() };
      if (patch.wert !== undefined) row.wert = patch.wert === "" ? null : Number(patch.wert);
      if (patch.notiz !== undefined) row.notiz = patch.notiz?.trim() || null;
      if (patch.dauerMinuten !== undefined) row.dauer_minuten = patch.dauerMinuten === "" ? null : Number(patch.dauerMinuten);
      if (patch.erledigt !== undefined) {
        row.erledigt = patch.erledigt;
        row.erledigt_am = patch.erledigt ? new Date().toISOString() : null;
      }
      const { data, error } = await supabase
        .from("quest_fortschritt")
        .upsert(row, { onConflict: "quest_id,user_id" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, fortschritt: rowZuFortschritt(data) } : q)));
      return { ok: true };
    },
    [userId]
  );

  return { quests, questFortschrittSpeichern };
}

// --- Admin-seitig: Anlegen/Archivieren/Auswerten, für beliebige/alle
// Coachees gleichzeitig — bewusst eigenständige Funktionen statt Teil des
// Hooks oben (der ist an eine feste userId gebunden). Genutzt in
// AdminQuestsView.jsx. ---

export async function adminQuestErstellen({ titel, beschreibung, typ, zielAnzahl, einheit, probandId, gueltigBis }) {
  if (!titel?.trim()) return { ok: false, error: "Bitte einen Titel eingeben." };
  const istAnzahl = typ === "anzahl";
  const row = {
    proband_id: probandId || null,
    titel: titel.trim(),
    beschreibung: beschreibung?.trim() || null,
    typ: istAnzahl ? "anzahl" : "einfach",
    ziel_anzahl: istAnzahl && zielAnzahl ? Number(zielAnzahl) : null,
    einheit: istAnzahl ? einheit?.trim() || null : null,
    gueltig_bis: gueltigBis || null,
  };
  const { data, error } = await supabase.from("quests").insert(row).select().single();
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, quest: data };
}

export async function adminQuestArchivieren(id) {
  const { error } = await supabase.from("quests").update({ aktiv: false }).eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Alle Quests (inkl. archivierte, für die Auswertung) + Fortschritt ALLER
// Coachees dazu. Namen/E-Mails kommen bewusst NICHT von hier (auth.users
// ist für den Browser-Client nicht direkt lesbar) — der Aufrufer führt das
// Ergebnis mit admin_liste_probanden() zusammen (gleiche Technik wie
// AdminCoachUebersichtView.jsx).
export async function adminQuestListe() {
  const [{ data: questRows, error: questError }, { data: fortschrittRows, error: fortschrittError }] = await Promise.all([
    supabase.from("quests").select("*").order("erstellt_am", { ascending: false }),
    supabase.from("quest_fortschritt").select("*"),
  ]);
  if (questError) {
    console.error(questError);
    return { ok: false, error: questError.message };
  }
  if (fortschrittError) console.error(fortschrittError);
  return { ok: true, quests: questRows || [], fortschritt: fortschrittRows || [] };
}
