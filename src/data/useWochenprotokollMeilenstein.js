import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function rowToSnapshot(r) {
  return { id: r.id, protocolId: r.protocol_id, wochenNummer: r.wochen_nummer, erstelltAm: r.erstellt_am, daten: r.daten };
}

// Verwaltet die automatisch erzeugten "Erste-Woche-Protokoll"-Snapshots —
// die eigentliche Erzeugungslogik (wann fällig, was reinkommt) lebt in
// src/utils/wochenprotokollSnapshot.js, da sie Daten aus mehreren anderen
// Hooks braucht und deshalb nicht hier, sondern von einer Komponente mit
// vollem useAppData()-Zugriff aufgerufen wird.
export function useWochenprotokollMeilenstein(userId) {
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("wochenprotokoll_snapshots").select("*").eq("user_id", userId).order("erstellt_am");
      if (!cancelled) setSnapshots((data || []).map(rowToSnapshot));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const wochenprotokollSnapshotErzeugen = useCallback(
    async (protocolId, wochenNummer, daten) => {
      const { data, error } = await supabase
        .from("wochenprotokoll_snapshots")
        .insert({ user_id: userId, protocol_id: protocolId, wochen_nummer: wochenNummer, daten })
        .select()
        .single();
      if (error) {
        // Unique-Verletzung heißt: existiert schon (z. B. zweiter Tab offen) — kein echter Fehler.
        if (error.code !== "23505") console.error(error);
        return { ok: false };
      }
      const neu = rowToSnapshot(data);
      setSnapshots((prev) => [...prev, neu]);
      return { ok: true, snapshot: neu };
    },
    [userId]
  );

  return { wochenprotokollSnapshots: snapshots, wochenprotokollSnapshotErzeugen };
}
