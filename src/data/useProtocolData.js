import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { addDays } from "../utils/dates";

function rowToDosierung(row) {
  return {
    menge: row.menge || "",
    intervallDays: row.intervall_mode === "custom" ? "custom" : row.intervall_days,
    customDays: row.custom_days != null ? String(row.custom_days) : "",
    eigenerStart: row.eigener_start || "",
    uhrzeit: row.uhrzeit ? row.uhrzeit.slice(0, 5) : "20:00",
  };
}

const DOSE_FELD_TO_COLUMN = {
  menge: "menge",
  customDays: "custom_days",
  eigenerStart: "eigener_start",
  uhrzeit: "uhrzeit",
};

export function useProtocolData(userId) {
  const [loading, setLoading] = useState(true);
  const [protocolId, setProtocolId] = useState(null);
  const [ziele, setZieleState] = useState([]);
  const [peptide, setPeptideState] = useState([]);
  const [einnahmeart, setEinnahmeartState] = useState({});
  const [dosierung, setDosierungState] = useState({});
  const [startdatum, setStartdatumState] = useState(new Date().toISOString().slice(0, 10));
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
      let { data: active } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) {
        const { data: created, error } = await supabase
          .from("protocols")
          .insert({ user_id: userId, ziele: [], startdatum: new Date().toISOString().slice(0, 10), dauer_wochen: 12, notizen: "" })
          .select()
          .single();
        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }
        active = created;
      }

      const { data: peptideRows } = await supabase
        .from("protocol_peptide")
        .select("*")
        .eq("protocol_id", active.id)
        .order("created_at");

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

      await loadArchived();
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loadArchived]);

  const toggleZiel = useCallback(
    (z) => {
      setZieleState((prev) => {
        const next = prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z];
        if (protocolId) {
          supabase
            .from("protocols")
            .update({ ziele: next })
            .eq("id", protocolId)
            .then(({ error }) => error && console.error(error));
        }
        return next;
      });
    },
    [protocolId]
  );

  const addPeptidRow = useCallback(
    async (name, art) => {
      if (!protocolId) return;
      const { error } = await supabase.from("protocol_peptide").insert({
        protocol_id: protocolId,
        user_id: userId,
        name,
        einnahmeart: art,
        menge: "",
        intervall_mode: "fixed",
        intervall_days: 7,
        uhrzeit: "20:00",
      });
      if (error) {
        console.error(error);
        return;
      }
      setPeptideState((prev) => [...prev, name]);
      setEinnahmeartState((prev) => ({ ...prev, [name]: art }));
      setDosierungState((prev) => ({ ...prev, [name]: { menge: "", intervallDays: 7, customDays: "", eigenerStart: "", uhrzeit: "20:00" } }));
    },
    [protocolId, userId]
  );

  const removePeptidRow = useCallback(
    async (name) => {
      if (!protocolId) return;
      setPeptideState((prev) => prev.filter((x) => x !== name));
      const { error } = await supabase.from("protocol_peptide").delete().eq("protocol_id", protocolId).eq("name", name);
      if (error) console.error(error);
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
    (name, art) => {
      const trimmed = name.trim();
      if (!trimmed || peptide.includes(trimmed)) return;
      addPeptidRow(trimmed, art);
    },
    [peptide, addPeptidRow]
  );

  const setDose = useCallback(
    (peptid, feld, val) => {
      setDosierungState((prev) => ({ ...prev, [peptid]: { ...prev[peptid], [feld]: val } }));
      if (!protocolId) return;
      let patch;
      if (feld === "intervallDays") {
        patch = val === "custom" ? { intervall_mode: "custom" } : { intervall_mode: "fixed", intervall_days: val };
      } else {
        const column = DOSE_FELD_TO_COLUMN[feld];
        if (!column) return;
        patch = { [column]: val === "" ? null : val };
      }
      supabase
        .from("protocol_peptide")
        .update(patch)
        .eq("protocol_id", protocolId)
        .eq("name", peptid)
        .then(({ error }) => error && console.error(error));
    },
    [protocolId]
  );

  const setStartdatum = useCallback(
    (v) => {
      setStartdatumState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ startdatum: v })
          .eq("id", protocolId)
          .then(({ error }) => error && console.error(error));
      }
    },
    [protocolId]
  );

  const setDauer = useCallback(
    (v) => {
      setDauerState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ dauer_wochen: parseInt(v, 10) || 12 })
          .eq("id", protocolId)
          .then(({ error }) => error && console.error(error));
      }
    },
    [protocolId]
  );

  const setNotizen = useCallback(
    (v) => {
      setNotizenState(v);
      if (protocolId) {
        supabase
          .from("protocols")
          .update({ notizen: v })
          .eq("id", protocolId)
          .then(({ error }) => error && console.error(error));
      }
    },
    [protocolId]
  );

  const effectiveDays = useCallback(
    (p) => {
      const d = dosierung[p];
      if (d?.intervallDays === "custom") return Number(d.customDays) || 7;
      return d?.intervallDays || 7;
    },
    [dosierung]
  );

  const plan = useMemo(() => {
    const totalDays = (parseInt(dauer, 10) || 12) * 7;
    const dosen = [];
    peptide.forEach((p) => {
      const days = effectiveDays(p);
      const eigenerStart = dosierung[p]?.eigenerStart;
      const start = new Date(eigenerStart || startdatum);
      for (let d = 0; d < totalDays; d += days) {
        dosen.push({
          date: addDays(start, Math.round(d)),
          peptid: p,
          menge: dosierung[p]?.menge || "",
          uhrzeit: dosierung[p]?.uhrzeit || "20:00",
        });
      }
    });
    dosen.sort((a, b) => a.date - b.date || a.uhrzeit.localeCompare(b.uhrzeit));
    return dosen;
  }, [peptide, dosierung, startdatum, dauer, effectiveDays]);

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
      .insert({ user_id: userId, ziele: [], startdatum: new Date().toISOString().slice(0, 10), dauer_wochen: 12, notizen: "" })
      .select()
      .single();
    if (createErr) {
      console.error(createErr);
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

  const intervallGueltig = useCallback(
    (p) => {
      const d = dosierung[p];
      if (!d?.menge) return false;
      if (d?.intervallDays === "custom") return !!d?.customDays && Number(d.customDays) > 0;
      return !!d?.intervallDays;
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
    addCustomPreparat,
    dosierung,
    setDose,
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
  };
}
