import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { activeDoseDays } from "../utils/schedule";

function rowToDosierung(row) {
  return {
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
  };
}

const DOSE_FELD_TO_COLUMN = {
  menge: "menge",
  customDays: "custom_days",
  onDays: "on_days",
  offDays: "off_days",
  eigenerStart: "eigener_start",
  weekdays: "weekdays",
  uhrzeiten: "uhrzeiten",
};

const NUMERIC_FELDER = new Set(["customDays", "onDays", "offDays"]);

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
        uhrzeiten: ["20:00"],
      });
      if (error) {
        console.error(error);
        return;
      }
      setPeptideState((prev) => [...prev, name]);
      setEinnahmeartState((prev) => ({ ...prev, [name]: art }));
      setDosierungState((prev) => ({ ...prev, [name]: { ...DEFAULT_DOSIERUNG } }));
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
      if (feld === "intervallPreset") {
        setDosierungState((prev) => ({ ...prev, [peptid]: { ...prev[peptid], intervallTyp: "fixed", intervallDays: val } }));
        if (protocolId) {
          supabase
            .from("protocol_peptide")
            .update({ intervall_mode: "fixed", intervall_days: val })
            .eq("protocol_id", protocolId)
            .eq("name", peptid)
            .then(({ error }) => error && console.error(error));
        }
        return;
      }

      setDosierungState((prev) => ({ ...prev, [peptid]: { ...prev[peptid], [feld]: val } }));
      if (!protocolId) return;

      if (feld === "intervallTyp") {
        supabase
          .from("protocol_peptide")
          .update({ intervall_mode: val })
          .eq("protocol_id", protocolId)
          .eq("name", peptid)
          .then(({ error }) => error && console.error(error));
        return;
      }

      const column = DOSE_FELD_TO_COLUMN[feld];
      if (!column) return;
      let value = val;
      if (NUMERIC_FELDER.has(feld)) value = val === "" ? null : Number(val);
      else if (feld === "eigenerStart") value = val === "" ? null : val;

      supabase
        .from("protocol_peptide")
        .update({ [column]: value })
        .eq("protocol_id", protocolId)
        .eq("name", peptid)
        .then(({ error }) => error && console.error(error));
    },
    [protocolId]
  );

  const setPeptidFoto = useCallback(
    async (peptid, file) => {
      if (!protocolId) return;
      try {
        const path = await uploadPhoto(userId, file, "praeparate");
        setDosierungState((prev) => ({ ...prev, [peptid]: { ...prev[peptid], fotoPath: path } }));
        const { error } = await supabase
          .from("protocol_peptide")
          .update({ foto_path: path })
          .eq("protocol_id", protocolId)
          .eq("name", peptid);
        if (error) console.error(error);
      } catch (err) {
        console.error(err);
      }
    },
    [protocolId, userId]
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

  const plan = useMemo(() => {
    const totalDays = (parseInt(dauer, 10) || 12) * 7;
    const dosen = [];
    peptide.forEach((p) => {
      const d = dosierung[p];
      if (!d) return;
      const dates = activeDoseDays(d, startdatum, totalDays);
      const zeiten = d.uhrzeiten?.length ? d.uhrzeiten : ["20:00"];
      dates.forEach((date) => {
        zeiten.forEach((uhrzeit) => {
          dosen.push({ date, peptid: p, menge: d.menge || "", uhrzeit });
        });
      });
    });
    dosen.sort((a, b) => a.date - b.date || a.uhrzeit.localeCompare(b.uhrzeit));
    return dosen;
  }, [peptide, dosierung, startdatum, dauer]);

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
    addCustomPreparat,
    dosierung,
    setDose,
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
  };
}
