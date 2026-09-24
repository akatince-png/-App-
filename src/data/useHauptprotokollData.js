import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Hauptprotokoll: die neue Ebene über allen Bereichen. Ein Nutzer legt zuerst
// ein benanntes Hauptprotokoll an (z. B. "Sommer 2026"), danach werden die
// einzelnen Teilprotokolle (Schlaf, Ernährung, ...) darunter eingerichtet.
// Immer nur ein Hauptprotokoll ist "active" — ein neu angelegtes archiviert
// automatisch das vorherige (gleiches Prinzip wie das bisherige
// Peptid-Protokoll-Archivieren beim "Neues Protokoll"-Knopf).
const istHaupt = (h) => (h.art || "haupt") === "haupt";

export function useHauptprotokollData(userId) {
  const [hauptprotokolle, setHauptprotokolle] = useState([]);
  const [teilprotokolle, setTeilprotokolle] = useState([]);
  // Bug-Fix (13.09., Teil 60): siehe useAtemuebungenData.js — load() hatte
  // keinen cancelled-Guard.
  const geladenAbgebrochenRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data: hp }, { data: tp }] = await Promise.all([
      supabase.from("hauptprotokolle").select("*").eq("user_id", userId).order("erstellt_am", { ascending: false }),
      supabase.from("teilprotokolle").select("*").eq("user_id", userId),
    ]);
    if (geladenAbgebrochenRef.current) return;
    setHauptprotokolle(hp || []);
    setTeilprotokolle(tp || []);
  }, [userId]);

  useEffect(() => {
    geladenAbgebrochenRef.current = false;
    load();
    return () => {
      geladenAbgebrochenRef.current = true;
    };
  }, [load]);

  // Seit Migration 0093 gibt es neben dem einen Hauptprotokoll ("art" =
  // "haupt", wie bisher) beliebig viele parallel laufende Zusatzprotokolle
  // ("zusatz", z. B. Experimente). Ältere Zeilen ohne art-Spalte zählen als
  // Hauptprotokoll.
  const aktivesHauptprotokoll = useMemo(() => hauptprotokolle.find((h) => h.status === "active" && istHaupt(h)) || null, [hauptprotokolle]);
  const zusatzprotokolle = useMemo(() => hauptprotokolle.filter((h) => h.status === "active" && !istHaupt(h)), [hauptprotokolle]);
  // Einträge beendeter (nicht übernommener) Zusatzprotokolle verschwinden aus
  // Tagesplan/Listen — siehe Filter in CoreDataContext/TrackingDataContext.
  const ausgeblendeteProtokollIds = useMemo(
    () => hauptprotokolle.filter((h) => !istHaupt(h) && h.status === "archived" && h.abschluss !== "uebernommen").map((h) => h.id),
    [hauptprotokolle]
  );

  const hauptprotokollErstellen = useCallback(
    async ({ name, beschreibung, startdatum }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) return { ok: false, error: "Bitte einen Namen eingeben." };

      // Vorheriges aktives Hauptprotokoll archivieren, bevor das neue entsteht
      // — immer nur eines aktiv, analog zum bisherigen Peptid-Archivieren.
      const bisherAktiv = hauptprotokolle.find((h) => h.status === "active" && istHaupt(h));
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
        // Bug-Fix (13.09., Teil 60): schlug bisher NUR der zweite Schritt
        // (Insert) fehl, blieb in der DB kein Hauptprotokoll mehr aktiv,
        // während der lokale State weiterhin das alte (jetzt archivierte)
        // als aktiv zeigte — ohne jede Fehleranzeige, bis später beim
        // Speichern eines Teilprotokolls unerklärliche Fehler auftraten.
        // Archivierung zurückrollen, damit DB und Oberfläche konsistent
        // bleiben.
        if (bisherAktiv) {
          const { error: rollbackError } = await supabase
            .from("hauptprotokolle")
            .update({ status: "active", archiviert_am: null })
            .eq("id", bisherAktiv.id);
          if (rollbackError) console.error(rollbackError);
        }
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
      const bestehend = teilprotokolle.find((t) => t.hauptprotokoll_id === hauptprotokollId && t.kategorie === kategorie);
      const payload = { user_id: userId, hauptprotokoll_id: hauptprotokollId, kategorie, aktiv, eigenes_startdatum: eigenerStartdatum, laufzeit_wochen: laufzeitWochen };
      // Übergang inaktiv→aktiv (oder Erstanlage aktiv): Aktivierungszeitpunkt
      // setzen, damit sich später die Woche errechnen lässt, in der dieser
      // Baustein zum Protokoll dazukam (siehe BausteineUebersicht in
      // PlaeneView.jsx). Bleibt der Baustein aktiv oder wird nur deaktiviert,
      // bleibt aktiviert_am unverändert (Spalte fehlt bewusst im Payload).
      if (aktiv && !bestehend?.aktiv) {
        payload.aktiviert_am = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from("teilprotokolle")
        .upsert(payload, { onConflict: "hauptprotokoll_id,kategorie" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setTeilprotokolle((prev) => [...prev.filter((t) => !(t.hauptprotokoll_id === hauptprotokollId && t.kategorie === kategorie)), data]);
      return { ok: true, teilprotokoll: data };
    },
    [userId, teilprotokolle]
  );

  // Endgültiges Löschen eines archivierten Hauptprotokolls — mit
  // `.eq("status", "archived")` abgesichert, damit sich darüber nie
  // versehentlich das aktive Hauptprotokoll löschen lässt. teilprotokolle
  // hängen per "on delete cascade" daran; hormones/supplements/meals/
  // routines mit hauptprotokoll_id verlieren nur die Zuordnung ("on delete
  // set null", siehe Migration 0027) — ihre eigentlichen Einträge bleiben.
  const hauptprotokollLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("hauptprotokolle").delete().eq("id", id).eq("status", "archived");
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setHauptprotokolle((prev) => prev.filter((h) => h.id !== id));
    return { ok: true };
  }, []);

  // Umbenennen (kürzeres Onboarding, 24.09.): das Protokoll wird dort schon
  // nach der Willkommensseite als "Mein Start" angelegt und erst auf der
  // Bereichswahl ggf. umbenannt.
  const hauptprotokollUmbenennen = useCallback(async (id, name) => {
    if (!id || !name?.trim()) return { ok: false, error: "Bitte einen Namen eingeben." };
    const { error } = await supabase.from("hauptprotokolle").update({ name: name.trim() }).eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setHauptprotokolle((prev) => prev.map((h) => (h.id === id ? { ...h, name: name.trim() } : h)));
    return { ok: true };
  }, []);

  // Parallel zum Hauptprotokoll — archiviert nichts.
  const zusatzprotokollErstellen = useCallback(
    async ({ name, beschreibung, startdatum, geplantesEnde }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) return { ok: false, error: "Bitte einen Namen eingeben." };
      const { data, error } = await supabase
        .from("hauptprotokolle")
        .insert({
          user_id: userId,
          name: trimmedName,
          beschreibung: beschreibung || "",
          startdatum: startdatum || toLocalISODate(new Date()),
          geplantes_ende: geplantesEnde || null,
          art: "zusatz",
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHauptprotokolle((prev) => [data, ...prev]);
      return { ok: true, zusatzprotokoll: data };
    },
    [userId]
  );

  // Zusatzprotokoll abschließen. uebernehmen = true: alle seine Einträge
  // (Supplemente, Medikamente, Mahlzeiten, Gewohnheiten) wandern ins aktive
  // Hauptprotokoll und laufen dort weiter; sonst verschwinden sie aus dem
  // Tagesplan (Verlauf/Logs bleiben unangetastet).
  const zusatzprotokollAbschliessen = useCallback(
    async (id, { uebernehmen = false } = {}) => {
      if (uebernehmen) {
        const zielId = aktivesHauptprotokoll?.id;
        if (!zielId) return { ok: false, error: "Kein aktives Hauptprotokoll zum Übernehmen." };
        const ergebnisse = await Promise.all(
          ["supplements", "hormones", "meals", "routines"].map((tabelle) =>
            supabase.from(tabelle).update({ hauptprotokoll_id: zielId }).eq("user_id", userId).eq("hauptprotokoll_id", id)
          )
        );
        const fehler = ergebnisse.find((r) => r.error)?.error;
        if (fehler) {
          console.error(fehler);
          return { ok: false, error: `Übernehmen fehlgeschlagen: ${fehler.message}` };
        }
      }
      const abschluss = uebernehmen ? "uebernommen" : "beendet";
      const archiviertAm = new Date().toISOString();
      const { error } = await supabase
        .from("hauptprotokolle")
        .update({ status: "archived", archiviert_am: archiviertAm, abschluss })
        .eq("id", id)
        .eq("art", "zusatz");
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHauptprotokolle((prev) => prev.map((h) => (h.id === id ? { ...h, status: "archived", archiviert_am: archiviertAm, abschluss } : h)));
      return { ok: true };
    },
    [userId, aktivesHauptprotokoll]
  );

  return {
    hauptprotokolle,
    teilprotokolle,
    aktivesHauptprotokoll,
    zusatzprotokolle,
    ausgeblendeteProtokollIds,
    zusatzprotokollErstellen,
    zusatzprotokollAbschliessen,
    hauptprotokollErstellen,
    teilprotokollSpeichern,
    hauptprotokollLoeschen,
    hauptprotokollUmbenennen,
  };
}
