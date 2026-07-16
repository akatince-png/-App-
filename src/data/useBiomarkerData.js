import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";

export function useBiomarkerData(userId) {
  const [biomarker, setBiomarkerState] = useState({});
  const [blutwerteArchiv, setBlutwerteArchiv] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [ocrSuccessCount, setOcrSuccessCount] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: markers }, { data: archiv }] = await Promise.all([
        supabase.from("biomarkers").select("name, value").eq("user_id", userId),
        supabase.from("blutwerte_archiv").select("datum, werte").eq("user_id", userId).order("datum", { ascending: false }),
      ]);
      if (cancelled) return;
      const next = {};
      (markers || []).forEach((m) => (next[m.name] = m.value));
      setBiomarkerState(next);
      setBlutwerteArchiv((archiv || []).map((a) => ({ datum: a.datum, werte: a.werte })));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setBiomarkerWert = useCallback(
    (name, val) => {
      setBiomarkerState((prev) => ({ ...prev, [name]: val }));
      supabase
        .from("biomarkers")
        .upsert({ user_id: userId, name, value: val, updated_at: new Date().toISOString() }, { onConflict: "user_id,name" })
        .then(({ error }) => error && console.error(error));
    },
    [userId]
  );

  const handleBlutwertFoto = useCallback(
    async (file) => {
      setOcrLoading(true);
      setOcrError(null);
      setOcrSuccessCount(null);
      try {
        const fotoPath = await uploadPhoto(userId, file, "blutwerte");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("blutwerte-scan", {
          body: { fotoPath, mediaType: file.type || "image/jpeg" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error || data?.error) throw new Error(data?.error || error.message);

        const entries = Object.entries(data.werte);
        setBiomarkerState((prev) => {
          const next = { ...prev };
          entries.forEach(([k, v]) => (next[k] = String(v)));
          return next;
        });
        for (const [k, v] of entries) {
          await supabase
            .from("biomarkers")
            .upsert({ user_id: userId, name: k, value: String(v), updated_at: new Date().toISOString() }, { onConflict: "user_id,name" });
        }

        const datum = new Date().toISOString().slice(0, 10);
        await supabase.from("blutwerte_archiv").insert({ user_id: userId, datum, werte: data.werte, foto_path: fotoPath });
        setBlutwerteArchiv((prev) => [{ datum, werte: data.werte }, ...prev]);
        setOcrSuccessCount(entries.length);
      } catch (err) {
        console.error(err);
        setOcrError("Werte konnten nicht automatisch erkannt werden — bitte manuell eintragen.");
      } finally {
        setOcrLoading(false);
      }
    },
    [userId]
  );

  return { biomarker, setBiomarkerWert, blutwerteArchiv, handleBlutwertFoto, ocrLoading, ocrError, ocrSuccessCount };
}
