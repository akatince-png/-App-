import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Gruppen-Atem-Sessions (25.09., Vorschau freigegeben): der Coach plant
// Termin, Team und Übung; alle atmen ab start_um im selben Takt
// (AtemFuehrung mit startUm). Teilnahmen mit Stimmung vorher/nachher.
// Geladen werden Sessions von gestern bis in 14 Tagen — als Coachee nur
// die des eigenen Teams (RLS), als Admin alle.
function zeileZuSession(r) {
  return { id: r.id, teamId: r.team_id, uebungKey: r.uebung_key, dauerMinuten: r.dauer_minuten, startUm: r.start_um, erstelltVon: r.erstellt_von };
}

export function useAtemSessions(userId) {
  const [sessions, setSessions] = useState([]);
  const [teilnahmen, setTeilnahmen] = useState([]);

  const laden = useCallback(async () => {
    if (!userId) return;
    const von = new Date(Date.now() - 86400000).toISOString();
    const bis = new Date(Date.now() + 14 * 86400000).toISOString();
    const { data, error } = await supabase.from("atem_sessions").select("*").gte("start_um", von).lte("start_um", bis).order("start_um");
    if (error) {
      console.error(error);
      return;
    }
    const liste = (data || []).map(zeileZuSession);
    setSessions(liste);
    if (liste.length) {
      const { data: t } = await supabase
        .from("atem_session_teilnahmen")
        .select("session_id, user_id, beigetreten_um, gefuehl_vorher, gefuehl_nachher")
        .in("session_id", liste.map((s) => s.id));
      setTeilnahmen((t || []).map((r) => ({ sessionId: r.session_id, userId: r.user_id, vorher: r.gefuehl_vorher, nachher: r.gefuehl_nachher })));
    } else setTeilnahmen([]);
  }, [userId]);

  useEffect(() => {
    laden();
  }, [laden]);

  // Coach plant eine Session und lädt alle Team-Mitglieder per Push ein.
  const atemSessionPlanen = useCallback(
    async ({ teamId, uebungKey, dauerMinuten, startUm, uebungName }) => {
      const { data, error } = await supabase
        .from("atem_sessions")
        .insert({ team_id: teamId, uebung_key: uebungKey, dauer_minuten: Number(dauerMinuten) || 10, start_um: startUm, erstellt_von: userId })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setSessions((prev) => [...prev, zeileZuSession(data)].sort((a, b) => (a.startUm < b.startUm ? -1 : 1)));
      const { data: mitglieder } = await supabase.from("profiles").select("id").eq("team_id", teamId);
      const zeit = new Date(startUm).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      for (const m of mitglieder || []) {
        supabase.functions
          .invoke("send-team-push", { body: { art: "coach", empfaengerId: m.id, text: `👥 Gemeinsam atmen: ${zeit} · ${uebungName} · ${Number(dauerMinuten) || 10} Min.` } })
          .then(({ error: e }) => e && console.warn("Push nicht verschickt:", e.message));
      }
      return { ok: true, session: zeileZuSession(data) };
    },
    [userId]
  );

  const atemSessionLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("atem_sessions").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    setSessions((prev) => prev.filter((s) => s.id !== id));
    return { ok: true };
  }, []);

  const atemSessionTeilnehmen = useCallback(
    async (sessionId, felder = {}) => {
      const row = { session_id: sessionId, user_id: userId };
      if ("vorher" in felder) row.gefuehl_vorher = felder.vorher;
      if ("nachher" in felder) row.gefuehl_nachher = felder.nachher;
      const { error } = await supabase.from("atem_session_teilnahmen").upsert(row, { onConflict: "session_id,user_id" });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setTeilnahmen((prev) => {
        const alt = prev.find((t) => t.sessionId === sessionId && t.userId === userId) || { sessionId, userId };
        return [...prev.filter((t) => t !== alt), { ...alt, ...felder }];
      });
      return { ok: true };
    },
    [userId]
  );

  return { atemSessions: sessions, atemTeilnahmen: teilnahmen, atemSessionsNeuLaden: laden, atemSessionPlanen, atemSessionLoeschen, atemSessionTeilnehmen };
}

// Welche Session ist gerade "dran" (15 Min. vorher bis zum Ende)?
export function aktuelleSession(sessions, jetzt = Date.now()) {
  return (sessions || []).find((s) => {
    const start = new Date(s.startUm).getTime();
    return jetzt >= start - 15 * 60000 && jetzt <= start + s.dauerMinuten * 60000;
  });
}
