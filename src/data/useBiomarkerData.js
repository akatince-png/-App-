import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { toLocalISODate } from "../utils/dates";
import { edgeFunctionFehlertext } from "../utils/edgeFunctionFehler";

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
        supabase.from("blutwerte_archiv").select("id, datum, werte").eq("user_id", userId).order("datum", { ascending: false }),
      ]);
      if (cancelled) return;
      const next = {};
      (markers || []).forEach((m) => (next[m.name] = m.value));
      setBiomarkerState(next);
      setBlutwerteArchiv((archiv || []).map((a) => ({ id: a.id, datum: a.datum, werte: a.werte })));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Bug-Fix: bei einem Fehlschlag des Upserts zeigte die Oberfläche trotzdem
  // dauerhaft den neuen (nicht gespeicherten) Wert, bis zum nächsten
  // Neuladen — jetzt Rollback auf den vorherigen Stand bei einem Fehler.
  const setBiomarkerWert = useCallback(
    (name, val) => {
      let vorher;
      setBiomarkerState((prev) => {
        vorher = prev[name];
        return { ...prev, [name]: val };
      });
      supabase
        .from("biomarkers")
        .upsert({ user_id: userId, name, value: val, updated_at: new Date().toISOString() }, { onConflict: "user_id,name" })
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setBiomarkerState((prev) => ({ ...prev, [name]: vorher }));
          }
        });
    },
    [userId]
  );

  const handleBlutwertFoto = useCallback(
    async (file) => {
      setOcrLoading(true);
      setOcrError(null);
      setOcrSuccessCount(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        // In den Ordner der angemeldeten Person (25.09.): im "Verwalten als"-
        // Modus scheiterte sonst schon das Hochladen (fremder Ordner).
        const fotoPath = await uploadPhoto(session?.user?.id || userId, file, "blutwerte");
        const { data, error } = await supabase.functions.invoke("blutwerte-scan", {
          body: { fotoPath, mediaType: file.type || "image/jpeg" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error || data?.error) throw new Error(await edgeFunctionFehlertext(error, data, "Werte konnten nicht automatisch erkannt werden."));

        const entries = Object.entries(data.werte);
        setBiomarkerState((prev) => {
          const next = { ...prev };
          entries.forEach(([k, v]) => (next[k] = String(v)));
          return next;
        });
        // Bug-Fix (13.09.): Supabase wirft bei einem Query-Fehler nicht,
        // sondern liefert { data, error } zurück — der Fehler wurde hier
        // bisher gar nicht geprüft (der try/catch lief einfach durch), die
        // Oberfläche meldete "erfolgreich erkannt", obwohl z. B. eine
        // RLS-Regel den Insert/Upsert abgelehnt hatte.
        for (const [k, v] of entries) {
          const { error: upsertError } = await supabase
            .from("biomarkers")
            .upsert({ user_id: userId, name: k, value: String(v), updated_at: new Date().toISOString() }, { onConflict: "user_id,name" });
          if (upsertError) throw new Error(upsertError.message);
        }

        const datum = toLocalISODate(new Date());
        const { data: inserted, error: insertError } = await supabase
          .from("blutwerte_archiv")
          .insert({ user_id: userId, datum, werte: data.werte, foto_path: (session?.user?.id || userId) === userId ? fotoPath : null })
          .select()
          .single();
        if (insertError) throw new Error(insertError.message);
        setBlutwerteArchiv((prev) => [{ id: inserted.id, datum, werte: data.werte }, ...prev]);
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

  // Bisher gab's im Blutwerte-Verlauf gar keine Löschmöglichkeit
  // (Nutzerin-Vorgabe, 12.09.: Mehrfachauswahl für alle Archiv-Bereiche,
  // nicht nur die, die schon eine Einzel-Löschfunktion hatten) — Rollback
  // auf den vorherigen Stand bei einem Fehler, gleiches Muster wie überall
  // sonst in dieser Datei.
  const blutwertEntfernen = useCallback(
    async (id) => {
      let vorherigerEintrag;
      let vorherigerIndex;
      setBlutwerteArchiv((prev) => {
        vorherigerIndex = prev.findIndex((a) => a.id === id);
        vorherigerEintrag = prev[vorherigerIndex];
        return prev.filter((a) => a.id !== id);
      });
      const { error } = await supabase.from("blutwerte_archiv").delete().eq("id", id).eq("user_id", userId);
      if (error) {
        console.error(error);
        if (vorherigerEintrag) {
          setBlutwerteArchiv((prev) => {
            const next = [...prev];
            next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigerEintrag);
            return next;
          });
        }
      }
    },
    [userId]
  );

  return { biomarker, setBiomarkerWert, blutwerteArchiv, blutwertEntfernen, handleBlutwertFoto, ocrLoading, ocrError, ocrSuccessCount };
}
