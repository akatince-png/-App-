import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Eigenständiger, kleiner Protokollbereich "Atemübungen" (16.08.) — bewusst
// nicht in die Zeitplanung/Erinnerungs-Infrastruktur der neun etablierten
// Bereiche (Schlaf, Training, ...) eingebaut, siehe Übergabeprotokoll.
export function useAtemuebungenData(userId) {
  const [atemuebungen, setAtemuebungen] = useState([]);
  const [atemuebungLogs, setAtemuebungLogs] = useState([]);
  // Bug-Fix (13.09., Teil 60): anders als die meisten Lade-Hooks in
  // src/data/ hatte load() bisher keinen cancelled-Guard — eine spät
  // auflösende Antwort (z. B. React-StrictMode-Doppel-Mount im Dev-Modus
  // oder ein schneller Nutzerwechsel im "Verwalten als"-Modus) konnte noch
  // State setzen, obwohl die Komponente/der Nutzerwechsel längst vorbei war.
  const geladenAbgebrochenRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: rows }, { data: logs }] = await Promise.all([
      supabase.from("atemuebungen").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("atemuebung_logs").select("*").eq("user_id", userId).order("erstellt_am", { ascending: false }).limit(50),
    ]);
    if (geladenAbgebrochenRef.current) return;
    setAtemuebungen(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || "🌬️",
        einatmenSek: r.einatmen_sek,
        haltenSek: r.halten_sek,
        ausatmenSek: r.ausatmen_sek,
        dauerMinuten: r.dauer_minuten,
      }))
    );
    setAtemuebungLogs(
      (logs || []).map((l) => ({
        id: l.id,
        name: l.name,
        dauerSek: l.dauer_sek,
        ausAkutmodus: l.aus_akutmodus,
        gefuehlDanach: l.gefuehl_danach,
        erstelltAm: l.erstellt_am,
      }))
    );
  }, [userId]);

  useEffect(() => {
    geladenAbgebrochenRef.current = false;
    load();
    return () => {
      geladenAbgebrochenRef.current = true;
    };
  }, [load]);

  const atemuebungHinzufuegen = useCallback(
    async (neu) => {
      const name = neu.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("atemuebungen")
        .insert({
          user_id: userId,
          name,
          icon: neu.icon || "🌬️",
          einatmen_sek: neu.einatmenSek || 4,
          halten_sek: neu.haltenSek ?? 4,
          ausatmen_sek: neu.ausatmenSek || 6,
          dauer_minuten: neu.dauerMinuten || 3,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setAtemuebungen((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          icon: data.icon,
          einatmenSek: data.einatmen_sek,
          haltenSek: data.halten_sek,
          ausatmenSek: data.ausatmen_sek,
          dauerMinuten: data.dauer_minuten,
        },
      ]);
      return { ok: true, id: data.id };
    },
    [userId]
  );

  const atemuebungEntfernen = useCallback(async (id) => {
    // Bug-Fix: bei Fehlschlag verschwand die Atemübung trotzdem sofort aus
    // der Liste, bis zum nächsten Neuladen — wirkte wie gelöscht, tauchte
    // dann aber wieder auf, ohne jede Fehlermeldung.
    let vorherigeUebung;
    let vorherigerIndex;
    setAtemuebungen((prev) => {
      vorherigerIndex = prev.findIndex((a) => a.id === id);
      vorherigeUebung = prev[vorherigerIndex];
      return prev.filter((a) => a.id !== id);
    });
    const { error } = await supabase.from("atemuebungen").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigeUebung) {
        setAtemuebungen((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigeUebung);
          return next;
        });
      }
    }
  }, []);

  // aufAkutmodus: kennzeichnet Sitzungen, die aus dem Akutmodus heraus
  // gestartet wurden (AkutModusPanel.jsx), für spätere Auswertung.
  const atemuebungAbschliessen = useCallback(
    async (uebung, dauerSek, { ausAkutmodus = false, gefuehlDanach = null } = {}) => {
      const { data, error } = await supabase
        .from("atemuebung_logs")
        .insert({
          user_id: userId,
          atemuebung_id: uebung?.id || null,
          name: uebung?.name || "Atemübung",
          dauer_sek: Math.round(dauerSek),
          aus_akutmodus: ausAkutmodus,
          gefuehl_danach: gefuehlDanach,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setAtemuebungLogs((prev) => [
        { id: data.id, name: data.name, dauerSek: data.dauer_sek, ausAkutmodus: data.aus_akutmodus, gefuehlDanach: data.gefuehl_danach, erstelltAm: data.erstellt_am },
        ...prev,
      ]);
      return { ok: true };
    },
    [userId]
  );

  return { atemuebungen, atemuebungLogs, atemuebungHinzufuegen, atemuebungEntfernen, atemuebungAbschliessen };
}
