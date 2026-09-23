import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { buildDosePlan, coerceDoseFeldWert, spaltenTeilmenge } from "../utils/schedule";
import { toLocalISODate } from "../utils/dates";

function rowToDosierung(row) {
  return {
    id: row.id,
    menge: row.menge || "",
    intervallTyp: row.intervall_mode || "fixed",
    intervallDays: row.intervall_days || 7,
    customDays: row.custom_days != null ? String(row.custom_days) : "",
    onDays: row.on_days != null ? String(row.on_days) : "",
    offDays: row.off_days != null ? String(row.off_days) : "",
    weekdays: row.weekdays || [],
    eigenerStart: row.eigener_start || "",
    uhrzeiten: row.uhrzeiten?.length ? row.uhrzeiten.map((t) => t.slice(0, 5)) : ["20:00"],
    fotoPath: row.foto_path || null,
    bacWasser: row.bac_wasser_ml != null ? String(row.bac_wasser_ml) : "",
    spruehstoesse: row.spruehstoesse != null ? String(row.spruehstoesse) : "",
  };
}

// Peptid-Spalten (protocol_peptide) sind eine Teilmenge der vollständigen
// Zuordnung aus utils/schedule.js — protocol_peptide hat keine
// Cannabis-Detailspalten (die gibt es nur bei hormones, siehe
// useHormoneData.js). Einmalig definiert, damit Spaltennamen nie mehr
// unabhängig auseinanderdriften können (13.09., Teil 60).
const DOSE_FELD_TO_COLUMN = spaltenTeilmenge(["menge", "customDays", "onDays", "offDays", "eigenerStart", "weekdays", "uhrzeiten", "bacWasser", "spruehstoesse"]);

// (bewusst eine eigene, kleinere Menge statt DOSE_NUMERISCHE_FELDER_VOLLSTAENDIG
// aus utils/schedule.js zu importieren — die enthält auch Cannabis-Felder,
// die es bei Peptiden gar nicht gibt.)
const NUMERIC_FELDER = new Set(["customDays", "onDays", "offDays", "bacWasser", "spruehstoesse"]);

const DEFAULT_DOSIERUNG = {
  menge: "",
  intervallTyp: "fixed",
  intervallDays: 7,
  customDays: "",
  onDays: "",
  offDays: "",
  weekdays: [],
  eigenerStart: "",
  uhrzeiten: ["20:00"],
  fotoPath: null,
  bacWasser: "",
  spruehstoesse: "",
};

export function useProtocolData(userId) {
  const [loading, setLoading] = useState(true);
  const [protocolId, setProtocolId] = useState(null);
  const [ziele, setZieleState] = useState([]);
  const [peptide, setPeptideState] = useState([]);
  const [einnahmeart, setEinnahmeartState] = useState({});
  const [dosierung, setDosierungState] = useState({});
  const [startdatum, setStartdatumState] = useState(toLocalISODate(new Date()));
  const [dauer, setDauerState] = useState("12");
  const [notizen, setNotizenState] = useState("");
  const [abgeschlosseneProtokolle, setAbgeschlosseneProtokolle] = useState([]);

  const loadArchived = useCallback(async () => {
    const { data: archived } = await supabase
      .from("protocols")
      .select("id, ziele, dauer_wochen, notizen, archived_at, injektionen_snapshot")
      .eq("user_id", userId)
      .eq("status", "archived")
      .order("archived_at", { ascending: false });
    if (!archived?.length) {
      setAbgeschlosseneProtokolle([]);
      return;
    }
    const { data: peptideRows } = await supabase
      .from("protocol_peptide")
      .select("protocol_id, name")
      .in(
        "protocol_id",
        archived.map((p) => p.id)
      );
    setAbgeschlosseneProtokolle(
      archived.map((p) => ({
        id: p.id,
        datum: (p.archived_at || "").slice(0, 10),
        peptide: (peptideRows || []).filter((r) => r.protocol_id === p.id).map((r) => r.name),
        ziele: p.ziele || [],
        dauer: String(p.dauer_wochen),
        injektionen: p.injektionen_snapshot ?? 0,
      }))
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // App-Start (Dauertest 23.09.): Peptide gleich mit einbetten statt als
      // zweite, nacheinander laufende Abfrage — die Startseite wartet auf
      // diesen Ladevorgang, jede eingesparte Runde zählt.
      let { data: active } = await supabase
        .from("protocols")
        .select("*, protocol_peptide(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "protocol_peptide", ascending: true })
        .limit(1)
        .maybeSingle();

      if (!active) {
        const { data: created, error } = await supabase
          .from("protocols")
          .insert({ user_id: userId, ziele: [], startdatum: toLocalISODate(new Date()), dauer_wochen: 12, notizen: "" })
          .select()
          .single();
        if (error) {
          // Bug-Fix (Teil 40): Wenn zwei Ladevorgänge gleichzeitig "kein
          // aktives Protokoll" sehen (React-StrictMode-Doppel-Mount, zwei
          // offene Tabs), schlägt der zweite Insert dank des partiellen
          // Unique-Index aus Migration 0078 mit 23505 fehl — statt das als
          // Fehler zu behandeln, einfach das inzwischen vom ersten Aufruf
          // angelegte aktive Protokoll nachladen.
          if (error.code === "23505") {
            const { data: existing, error: reloadError } = await supabase
              .from("protocols")
              .select("*")
              .eq("user_id", userId)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (reloadError || !existing) {
              console.error(reloadError || error);
              setLoading(false);
              return;
            }
            active = existing;
          } else {
            console.error(error);
            setLoading(false);
            return;
          }
        } else {
          active = created;
        }
      }

      // Frisch angelegtes/nachgeladenes Protokoll hat keine eingebetteten
      // Peptide — nur dann (selten) separat nachfragen.
      const peptideRows = Array.isArray(active.protocol_peptide)
        ? active.protocol_peptide
        : (await supabase.from("protocol_peptide").select("*").eq("protocol_id", active.id).order("created_at")).data;

      if (cancelled) return;

      setProtocolId(active.id);
      setZieleState(active.ziele || []);
      setStartdatumState(active.startdatum);
      setDauerState(String(active.dauer_wochen));
      setNotizenState(active.notizen || "");

      const nextEinnahmeart = {};
      const nextDosierung = {};
      (peptideRows || []).forEach((row) => {
        nextEinnahmeart[row.name] = row.einnahmeart;
        nextDosierung[row.name] = rowToDosierung(row);
      });
      setPeptideState((peptideRows || []).map((r) => r.name));
      setEinnahmeartState(nextEinnahmeart);
      setDosierungState(nextDosierung);

      // Login-Tempo (Dauertest 23.09.): archivierte Protokolle braucht erst
      // das Archiv, nicht die Startseite — nicht mehr darauf warten, bevor
      // die App aus dem Ladebildschirm kommt (war die dritte von drei
      // nacheinander laufenden Abfragen, die den Start aufgehalten haben).
      loadArchived();
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loadArchived]);

  // Bug-Fix (alle vier Funktionen unten): bei einem Fehlschlag des Updates
  // zeigte die Oberfläche trotzdem dauerhaft den neuen (nicht gespeicherten)
  // Wert, bis zum nächsten Neuladen — jetzt Rollback auf den vorherigen
  // Stand bei einem Fehler.
  const toggleZiel = useCallback(
    (z) => {
      let vorher;
      let next;
      setZieleState((prev) => {
        vorher = prev;
        next = prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z];
        return next;
      });
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ ziele: next })
          .eq("id", protocolId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setZieleState(vorher);
            }
          });
      }
    },
    [protocolId]
  );

  const addPeptidRow = useCallback(
    async (name, art) => {
      if (!protocolId) return { ok: false, error: "Protokoll noch nicht bereit." };
      const { data, error } = await supabase
        .from("protocol_peptide")
        .insert({
          protocol_id: protocolId,
          user_id: userId,
          name,
          einnahmeart: art,
          menge: "",
          intervall_mode: "fixed",
          intervall_days: 7,
          uhrzeiten: ["20:00"],
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        if (error.code === "23505") {
          const { data: rows } = await supabase.from("protocol_peptide").select("*").eq("protocol_id", protocolId).order("created_at");
          const nextEinnahmeart = {};
          const nextDosierung = {};
          (rows || []).forEach((row) => {
            nextEinnahmeart[row.name] = row.einnahmeart;
            nextDosierung[row.name] = rowToDosierung(row);
          });
          setPeptideState((rows || []).map((r) => r.name));
          setEinnahmeartState(nextEinnahmeart);
          setDosierungState(nextDosierung);
          return { ok: false, error: `"${name}" war schon gespeichert — deine Liste wurde aktualisiert.` };
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setPeptideState((prev) => [...prev, name]);
      setEinnahmeartState((prev) => ({ ...prev, [name]: art }));
      setDosierungState((prev) => ({ ...prev, [name]: { ...DEFAULT_DOSIERUNG, id: data.id } }));
      return { ok: true };
    },
    [protocolId, userId]
  );

  const removePeptidRow = useCallback(
    async (name) => {
      if (!protocolId) return;
      // Bug-Fix (13.09.): bei Fehlschlag verschwand der Eintrag trotzdem
      // sofort aus der Liste, bis zum nächsten Neuladen — spiegelt jetzt
      // exakt das Rollback-Muster von hormonEntfernen() in useHormoneData.js.
      let vorherigeDosierung;
      setPeptideState((prev) => prev.filter((x) => x !== name));
      setDosierungState((prev) => {
        vorherigeDosierung = prev[name];
        const next = { ...prev };
        delete next[name];
        return next;
      });
      const { error } = await supabase.from("protocol_peptide").delete().eq("protocol_id", protocolId).eq("name", name);
      if (error) {
        console.error(error);
        setPeptideState((prev) => (prev.includes(name) ? prev : [...prev, name]));
        setDosierungState((prev) => ({ ...prev, [name]: vorherigeDosierung }));
      }
    },
    [protocolId]
  );

  const togglePeptid = useCallback(
    (p) => {
      if (peptide.includes(p)) removePeptidRow(p);
      else addPeptidRow(p, "Injektion");
    },
    [peptide, addPeptidRow, removePeptidRow]
  );

  const addCustomPreparat = useCallback(
    async (name, art) => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "Bitte einen Namen eingeben." };
      if (peptide.includes(trimmed)) return { ok: false, error: "Dieses Peptid ist schon in deiner Liste." };
      return addPeptidRow(trimmed, art);
    },
    [peptide, addPeptidRow]
  );

  // Bug-Fix (13.09.): bei einem Fehlschlag des Updates zeigte die Oberfläche
  // trotzdem dauerhaft den neuen (nicht gespeicherten) Wert, bis zum
  // nächsten Neuladen — spiegelt jetzt exakt das Rollback-Muster von
  // setHormonEinnahmeart()/setHormonDose() in useHormoneData.js, das hier
  // beim ursprünglichen Nachrüsten übersehen wurde.
  const setEinnahmeart = useCallback(
    (peptid, art) => {
      let vorher;
      setEinnahmeartState((prev) => {
        vorher = prev[peptid];
        return { ...prev, [peptid]: art };
      });
      if (!protocolId) return;
      supabase
        .from("protocol_peptide")
        .update({ einnahmeart: art })
        .eq("protocol_id", protocolId)
        .eq("name", peptid)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setEinnahmeartState((prev) => ({ ...prev, [peptid]: vorher }));
          }
        });
    },
    [protocolId]
  );

  const setDose = useCallback(
    (peptid, feld, val) => {
      if (feld === "intervallPreset") {
        let vorher;
        setDosierungState((prev) => {
          vorher = prev[peptid];
          return { ...prev, [peptid]: { ...prev[peptid], intervallTyp: "fixed", intervallDays: val } };
        });
        if (protocolId) {
          supabase
            .from("protocol_peptide")
            .update({ intervall_mode: "fixed", intervall_days: val })
            .eq("protocol_id", protocolId)
            .eq("name", peptid)
            .then(({ error }) => {
              if (error) {
                console.error(error);
                setDosierungState((prev) => ({ ...prev, [peptid]: vorher }));
              }
            });
        }
        return;
      }

      let vorher;
      setDosierungState((prev) => {
        vorher = prev[peptid];
        return { ...prev, [peptid]: { ...prev[peptid], [feld]: val } };
      });
      if (!protocolId) return;

      if (feld === "intervallTyp") {
        supabase
          .from("protocol_peptide")
          .update({ intervall_mode: val })
          .eq("protocol_id", protocolId)
          .eq("name", peptid)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setDosierungState((prev) => ({ ...prev, [peptid]: vorher }));
            }
          });
        return;
      }

      const column = DOSE_FELD_TO_COLUMN[feld];
      if (!column) return;
      const value = coerceDoseFeldWert(feld, val, NUMERIC_FELDER);

      supabase
        .from("protocol_peptide")
        .update({ [column]: value })
        .eq("protocol_id", protocolId)
        .eq("name", peptid)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setDosierungState((prev) => ({ ...prev, [peptid]: vorher }));
          }
        });
    },
    [protocolId]
  );

  // Wie setDose(), aber für mehrere Felder auf einmal — ein einzelner
  // DB-Aufruf statt einem pro geändertem Feld. Ein Dosis-Speichern-Tap
  // ändert oft Menge + Intervall + Uhrzeiten gleichzeitig; mit setDose()
  // wären das bis zu 7-8 sequentielle Netzwerk-Roundtrips für einen einzigen
  // Speichervorgang gewesen.
  const setDoseBatch = useCallback(
    (peptid, felder) => {
      let localPatch = {};
      const dbPatch = {};

      Object.entries(felder).forEach(([feld, val]) => {
        if (feld === "intervallPreset") {
          localPatch = { ...localPatch, intervallTyp: "fixed", intervallDays: val };
          dbPatch.intervall_mode = "fixed";
          dbPatch.intervall_days = val;
          return;
        }
        if (feld === "intervallTyp") {
          localPatch = { ...localPatch, intervallTyp: val };
          dbPatch.intervall_mode = val;
          return;
        }
        const column = DOSE_FELD_TO_COLUMN[feld];
        if (!column) return;
        localPatch = { ...localPatch, [feld]: val };
        dbPatch[column] = coerceDoseFeldWert(feld, val, NUMERIC_FELDER);
      });

      let vorher;
      setDosierungState((prev) => {
        vorher = prev[peptid];
        return { ...prev, [peptid]: { ...prev[peptid], ...localPatch } };
      });
      if (!protocolId || Object.keys(dbPatch).length === 0) return;

      supabase
        .from("protocol_peptide")
        .update(dbPatch)
        .eq("protocol_id", protocolId)
        .eq("name", peptid)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setDosierungState((prev) => ({ ...prev, [peptid]: vorher }));
          }
        });
    },
    [protocolId]
  );

  const setPeptidFoto = useCallback(
    async (peptid, file) => {
      if (!protocolId) return;
      let vorher;
      try {
        const path = await uploadPhoto(userId, file, "praeparate");
        setDosierungState((prev) => {
          vorher = prev[peptid];
          return { ...prev, [peptid]: { ...prev[peptid], fotoPath: path } };
        });
        const { error } = await supabase
          .from("protocol_peptide")
          .update({ foto_path: path })
          .eq("protocol_id", protocolId)
          .eq("name", peptid);
        if (error) {
          console.error(error);
          setDosierungState((prev) => ({ ...prev, [peptid]: vorher }));
        }
      } catch (err) {
        console.error(err);
      }
    },
    [protocolId, userId]
  );

  const setStartdatum = useCallback(
    (v) => {
      const vorher = startdatum;
      setStartdatumState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ startdatum: v })
          .eq("id", protocolId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setStartdatumState(vorher);
            }
          });
      }
    },
    [protocolId, startdatum]
  );

  const setDauer = useCallback(
    (v) => {
      const vorher = dauer;
      setDauerState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ dauer_wochen: parseInt(v, 10) || 12 })
          .eq("id", protocolId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setDauerState(vorher);
            }
          });
      }
    },
    [protocolId, dauer]
  );

  const setNotizen = useCallback(
    (v) => {
      const vorher = notizen;
      setNotizenState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ notizen: v })
          .eq("id", protocolId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setNotizenState(vorher);
            }
          });
      }
    },
    [protocolId, notizen]
  );

  const plan = useMemo(
    () => buildDosePlan(peptide, dosierung, startdatum, dauer, (p, d, date, uhrzeit) => ({ date, peptid: p, menge: d.menge || "", uhrzeit })),
    [peptide, dosierung, startdatum, dauer]
  );

  const protokollArchivieren = useCallback(async () => {
    if (!protocolId) return;
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("protocols")
      .update({ status: "archived", archived_at: nowIso, injektionen_snapshot: plan.length })
      .eq("id", protocolId);
    if (error) {
      console.error(error);
      return;
    }
    const { data: created, error: createErr } = await supabase
      .from("protocols")
      .insert({ user_id: userId, ziele: [], startdatum: toLocalISODate(new Date()), dauer_wochen: 12, notizen: "" })
      .select()
      .single();
    if (createErr) {
      console.error(createErr);
      // Bug-Fix (13.09., Teil 60): schlug bisher NUR der zweite Schritt
      // (Insert des neuen Protokolls) fehl, war in der DB kein Peptid-
      // Protokoll mehr aktiv, obwohl der lokale State (protocolId) weiterhin
      // auf das jetzt archivierte zeigte — Archivierung zurückrollen, damit
      // DB und Oberfläche konsistent bleiben.
      const { error: rollbackError } = await supabase
        .from("protocols")
        .update({ status: "active", archived_at: null, injektionen_snapshot: null })
        .eq("id", protocolId);
      if (rollbackError) console.error(rollbackError);
      return;
    }
    setProtocolId(created.id);
    setZieleState([]);
    setPeptideState([]);
    setEinnahmeartState({});
    setDosierungState({});
    setStartdatumState(created.startdatum);
    setDauerState(String(created.dauer_wochen));
    setNotizenState("");
    await loadArchived();
  }, [protocolId, plan.length, userId, loadArchived]);

  // Endgültiges Löschen eines archivierten Protokolls — bewusst mit
  // `.eq("status", "archived")` abgesichert, damit sich darüber nie
  // versehentlich das aktive Protokoll löschen lässt. protocol_peptide/
  // peptide_logs hängen per "on delete cascade" daran und verschwinden mit.
  const protokollLoeschen = useCallback(async (id) => {
    const { error } = await supabase.from("protocols").delete().eq("id", id).eq("status", "archived");
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setAbgeschlosseneProtokolle((prev) => prev.filter((p) => p.id !== id));
    return { ok: true };
  }, []);

  // Verknüpft das aktuell aktive Peptid-Protokoll nachträglich mit einem
  // neu angelegten Hauptprotokoll. Bewusst kein Feld im Insert der aktiven
  // Protokoll-Zeile (die entsteht oft schon vor der Hauptprotokoll-Auswahl,
  // z. B. direkt nach dem Login) — stattdessen ruft
  // HauptprotokollErstellenView dies direkt nach hauptprotokollErstellen auf.
  const verknuepfeMitHauptprotokoll = useCallback(
    async (hauptprotokollId) => {
      if (!protocolId) return { ok: true };
      const { error } = await supabase.from("protocols").update({ hauptprotokoll_id: hauptprotokollId }).eq("id", protocolId);
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [protocolId]
  );

  const intervallGueltig = useCallback(
    (p) => {
      const d = dosierung[p];
      if (!d?.menge) return false;
      if (d.intervallTyp === "custom") return !!d.customDays && Number(d.customDays) > 0;
      if (d.intervallTyp === "cycle") return !!d.onDays && Number(d.onDays) > 0 && d.offDays !== "";
      if (d.intervallTyp === "weekdays") return (d.weekdays || []).length > 0;
      return !!d.intervallDays;
    },
    [dosierung]
  );

  return {
    loading,
    protocolId,
    ziele,
    toggleZiel,
    peptide,
    togglePeptid,
    einnahmeart,
    setEinnahmeart,
    addCustomPreparat,
    dosierung,
    setDose,
    setDoseBatch,
    setPeptidFoto,
    startdatum,
    setStartdatum,
    dauer,
    setDauer,
    notizen,
    setNotizen,
    plan,
    intervallGueltig,
    abgeschlosseneProtokolle,
    protokollArchivieren,
    protokollLoeschen,
    verknuepfeMitHauptprotokoll,
  };
}
