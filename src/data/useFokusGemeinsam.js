import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Gemeinsam fokussieren / Body Doubling (27.09.): Sitzungen (eigene + die
// geteilten des Teams, RLS) und vom Coach geplante Runden. Geladen wird
// ein Fenster von gestern bis in 14 Tagen; alle 30 Sek. neu, solange die
// Seite offen ist, damit man sieht, wer gerade dazukommt.
const zuSitzung = (r) => ({
  id: r.id,
  userId: r.user_id,
  rundeId: r.runde_id,
  ziel: r.ziel || "",
  dauerMinuten: r.dauer_minuten,
  startUm: r.start_um,
  beendetUm: r.beendet_um,
  ergebnis: r.ergebnis,
  teilen: r.teilen,
});
const zuRunde = (r) => ({ id: r.id, teamId: r.team_id, titel: r.titel || "", dauerMinuten: r.dauer_minuten, startUm: r.start_um, erstelltVon: r.erstellt_von });

export function useFokusGemeinsam(userId) {
  const [fokusSitzungen, setSitzungen] = useState([]);
  const [fokusRunden, setRunden] = useState([]);

  const laden = useCallback(async () => {
    if (!userId) return;
    const von = new Date(Date.now() - 86400000).toISOString();
    const bis = new Date(Date.now() + 14 * 86400000).toISOString();
    const [s, r, eigene] = await Promise.all([
      supabase.from("fokus_sitzungen").select("*").gte("start_um", von).order("start_um"),
      supabase.from("fokus_runden").select("*").gte("start_um", von).lte("start_um", bis).order("start_um"),
      // Eigene ältere Sitzungen für Punkte/Gehirn (letzte 90 Tage).
      supabase.from("fokus_sitzungen").select("*").eq("user_id", userId).gte("start_um", new Date(Date.now() - 90 * 86400000).toISOString()).lt("start_um", von),
    ]);
    if (s.error || r.error) {
      console.error(s.error || r.error);
      return;
    }
    setSitzungen([...(eigene.data || []), ...(s.data || [])].map(zuSitzung));
    setRunden((r.data || []).map(zuRunde));
  }, [userId]);

  useEffect(() => {
    laden();
  }, [laden]);

  const fokusStarten = useCallback(
    async ({ ziel = "", dauerMinuten = 25, rundeId = null, teilen = true }) => {
      const { data, error } = await supabase
        .from("fokus_sitzungen")
        .insert({ user_id: userId, ziel: String(ziel).trim() || null, dauer_minuten: Number(dauerMinuten) || 25, runde_id: rundeId, teilen })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const s = zuSitzung(data);
      setSitzungen((prev) => [...prev, s]);
      return { ok: true, sitzung: s };
    },
    [userId]
  );

  // Ergebnis eintragen (beendet die Sitzung). Auch "Heute nicht" zählt.
  const fokusAbschliessen = useCallback(async (id, ergebnis) => {
    const felder = { ergebnis, beendet_um: new Date().toISOString() };
    const { error } = await supabase.from("fokus_sitzungen").update(felder).eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setSitzungen((prev) => prev.map((s) => (s.id === id ? { ...s, ergebnis, beendetUm: felder.beendet_um } : s)));
    return { ok: true };
  }, []);

  // Coach plant eine Runde (team null = alle) und lädt per Push ein.
  const fokusRundePlanen = useCallback(
    async ({ teamId = null, titel = "", dauerMinuten = 25, startUm }) => {
      const { data, error } = await supabase
        .from("fokus_runden")
        .insert({ team_id: teamId || null, titel: titel.trim() || null, dauer_minuten: Number(dauerMinuten) || 25, start_um: startUm, erstellt_von: userId })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const runde = zuRunde(data);
      setRunden((prev) => [...prev, runde].sort((a, b) => (a.startUm < b.startUm ? -1 : 1)));
      let q = supabase.from("profiles").select("id").eq("is_admin", false);
      if (teamId) q = q.eq("team_id", teamId);
      const { data: personen } = await q;
      const zeit = new Date(startUm).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      for (const p of personen || []) {
        supabase.functions
          .invoke("send-team-push", { body: { art: "coach", empfaengerId: p.id, text: `🎯 Gemeinsam fokussieren: ${zeit} · ${Number(dauerMinuten) || 25} Min.${titel.trim() ? ` · ${titel.trim()}` : ""}` } })
          .then(({ error: e }) => e && console.warn("Push nicht verschickt:", e.message));
      }
      return { ok: true, runde };
    },
    [userId]
  );

  const fokusRundeLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("fokus_runden").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setRunden((prev) => prev.filter((r) => r.id !== id));
    return { ok: true };
  }, []);

  const eigeneFokusSitzungen = useMemo(() => fokusSitzungen.filter((s) => s.userId === userId), [fokusSitzungen, userId]);

  return { fokusSitzungen, eigeneFokusSitzungen, fokusRunden, fokusNeuLaden: laden, fokusStarten, fokusAbschliessen, fokusRundePlanen, fokusRundeLoeschen };
}
