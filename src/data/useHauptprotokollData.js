import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Hauptprotokoll: die neue Ebene über allen Bereichen. Ein Nutzer legt zuerst
// ein benanntes Hauptprotokoll an (z. B. "Sommer 2026"), danach werden die
// einzelnen Teilprotokolle (Schlaf, Ernährung, ...) darunter eingerichtet.
// Immer nur ein Hauptprotokoll ist "active" — ein neu angelegtes archiviert
// automatisch das vorherige (gleiches Prinzip wie das bisherige
// Peptid-Protokoll-Archivieren beim "Neues Protokoll"-Knopf).
export function useHauptprotokollData(userId) {
  const [hauptprotokolle, setHauptprotokolle] = useState([]);
  const [teilprotokolle, setTeilprotokolle] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: hp }, { data: tp }] = await Promise.all([
      supabase.from("hauptprotokolle").select("*").eq("user_id", userId).order("erstellt_am", { ascending: false }),
      supabase.from("teilprotokolle").select("*").eq("user_id", userId),
    ]);
    setHauptprotokolle(hp || []);
    setTeilprotokolle(tp || []);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const aktivesHauptprotokoll = useMemo(() => hauptprotokolle.find((h) => h.status === "active") || null, [hauptprotokolle]);

  const hauptprotokollErstellen = useCallback(
    async ({ name, beschreibung, startdatum }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) return { ok: false, error: "Bitte einen Namen eingeben." };

      // Vorheriges aktives Hauptprotokoll archivieren, bevor das neue entsteht
      // — immer nur eines aktiv, analog zum bisherigen Peptid-Archivieren.
      const bisherAktiv = hauptprotokolle.find((h) => h.status === "active");
      if (bisherAktiv) {
        await supabase.from("hauptprotokolle").update({ status: "archived", archiviert_am: new Date().toISOString() }).eq("id", bisherAktiv.id);
      }

      const { data, error } = await supabase
        .from("hauptprotokolle")
        .insert({ user_id: userId, name: trimmedName, beschreibung: beschreibung || "", startdatum: startdatum || toLocalISODate(new Date()) })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHauptprotokolle((prev) => [data, ...prev.map((h) => (h.id === bisherAktiv?.id ? { ...h, status: "archived" } : h))]);
      return { ok: true, hauptprotokoll: data };
    },
    [userId, hauptprotokolle]
  );

  // Ein Teilprotokoll je (Hauptprotokoll, Kategorie) — hält nur aktiv/
  // eigenes Startdatum/Laufzeit; die bereichsspezifischen Detaildaten bleiben
  // weiterhin in category_ziele/hydration_settings/etc.
  const teilprotokollSpeichern = useCallback(
    async (hauptprotokollId, kategorie, { aktiv = true, eigenerStartdatum = null, laufzeitWochen = null } = {}) => {
      if (!hauptprotokollId) return { ok: false, error: "Kein aktives Hauptprotokoll." };
      const { data, error } = await supabase
        .from("teilprotokolle")
        .upsert(
          { user_id: userId, hauptprotokoll_id: hauptprotokollId, kategorie, aktiv, eigenes_startdatum: eigenerStartdatum, laufzeit_wochen: laufzeitWochen },
          { onConflict: "hauptprotokoll_id,kategorie" }
        )
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setTeilprotokolle((prev) => [...prev.filter((t) => !(t.hauptprotokoll_id === hauptprotokollId && t.kategorie === kategorie)), data]);
      return { ok: true, teilprotokoll: data };
    },
    [userId]
  );

  return {
    hauptprotokolle,
    teilprotokolle,
    aktivesHauptprotokoll,
    hauptprotokollErstellen,
    teilprotokollSpeichern,
  };
}
