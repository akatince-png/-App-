import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";

// Supplemente folgen seit Migration 0029 demselben Dosierungs-/Intervall-
// modell wie Medikamente und Peptide (Wochentage, konkrete Uhrzeiten,
// Intervall-Modus, eigenes Startdatum). `tageszeiten` bleibt daneben
// erhalten — ältere Einträge nutzen nur dieses Feld, und der Tagesplan
// fällt darauf zurück, wenn keine Uhrzeiten hinterlegt sind.
function rowToSupplement(r) {
  return {
    id: r.id,
    name: r.name,
    tageszeiten: r.tageszeiten || [],
    hinweis: r.hinweis || "",
    menge: r.menge || "",
    intervallTyp: r.intervall_mode || "fixed",
    intervallDays: r.intervall_days ?? 1,
    customDays: r.custom_days ?? "",
    onDays: r.on_days ?? "",
    offDays: r.off_days ?? "",
    weekdays: r.weekdays || [],
    uhrzeiten: r.uhrzeiten || [],
    eigenerStart: r.eigener_start || "",
    fotoPath: r.foto_path || null,
    // Zugehöriges (Haupt- oder Zusatz-)Protokoll — für das 🧪-Etikett und
    // das Ausblenden beendeter Zusatzprotokolle (siehe useZusatzprotokolle).
    hauptprotokollId: r.hauptprotokoll_id || null,
  };
}

function supplementToRow(neu) {
  return {
    menge: neu.menge || "",
    intervall_mode: neu.intervallTyp || "fixed",
    intervall_days: neu.intervallDays ? Number(neu.intervallDays) : null,
    custom_days: neu.customDays ? Number(neu.customDays) : null,
    on_days: neu.onDays ? Number(neu.onDays) : null,
    off_days: neu.offDays ? Number(neu.offDays) : null,
    weekdays: neu.weekdays || [],
    uhrzeiten: neu.uhrzeiten || [],
    eigener_start: neu.eigenerStart || null,
  };
}

export function useSupplementData(userId, hauptprotokollId, belohnungPufferMin) {
  const [supplemente, setSupplemente] = useState([]);
  const [supplementErledigt, setSupplementErledigt] = useState({});
  // Siehe useGewohnheitenData.js: verhindert, dass schnelles Doppeltippen
  // denselben veralteten State liest und dadurch einen Toggle-Tap verliert.
  const pendingErledigtRef = useRef({});
  const [supplementErledigtAt, setSupplementErledigtAt] = useState({});
  const [supplementFeedback, setSupplementFeedback] = useState({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: rows }, { data: logs }] = await Promise.all([
        supabase.from("supplements").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("supplement_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setSupplemente((rows || []).map(rowToSupplement));
      const nextErledigt = {};
      const nextErledigtAt = {};
      const nextFeedback = {};
      (logs || []).forEach((row) => {
        const k = `${row.log_date}__${row.supplement_id}__${row.tageszeit}`;
        nextErledigt[k] = row.erledigt;
        nextErledigtAt[k] = row.erledigt_at || null;
        nextFeedback[k] = {
          wirkung: row.wirkung || "",
          nebenwirkungen: row.nebenwirkungen || [],
          notizen: row.notizen || "",
        };
      });
      setSupplementErledigt(nextErledigt);
      setSupplementErledigtAt(nextErledigtAt);
      setSupplementFeedback(nextFeedback);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const supplementHinzufuegen = useCallback(
    async (neuesSupplement) => {
      if (!neuesSupplement.name.trim()) return { ok: false, error: "Bitte einen Namen eingeben." };
      // Ein Supplement braucht mindestens eine Zeitangabe, damit es im
      // Tagesplan auftauchen kann — entweder konkrete Uhrzeiten (neu) oder
      // die groben Tageszeiten (bestehende Einträge/ältere Masken).
      const hatZeitangabe = (neuesSupplement.uhrzeiten || []).length > 0 || (neuesSupplement.tageszeiten || []).length > 0;
      if (!hatZeitangabe) return { ok: false, error: "Bitte mindestens eine Uhrzeit oder Tageszeit wählen." };
      const { data, error } = await supabase
        .from("supplements")
        .insert({
          user_id: userId,
          hauptprotokoll_id: hauptprotokollId || null,
          name: neuesSupplement.name,
          tageszeiten: neuesSupplement.tageszeiten || [],
          hinweis: neuesSupplement.hinweis || "",
          ...supplementToRow(neuesSupplement),
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setSupplemente((prev) => [...prev, rowToSupplement(data)]);
      return { ok: true };
    },
    [userId, hauptprotokollId]
  );

  // Bug-Fix (alle Funktionen unten): bei einem Fehlschlag des Updates zeigte
  // die Oberfläche trotzdem dauerhaft den neuen (nicht gespeicherten) Stand,
  // bis zum nächsten Neuladen — jetzt Rollback auf den vorherigen Stand.
  const supplementAendern = useCallback(async (id, felder) => {
    let vorher;
    setSupplemente((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        vorher = s;
        return { ...s, ...felder };
      })
    );
    const { error } = await supabase.from("supplements").update(felder).eq("id", id);
    if (error) {
      console.error(error);
      if (vorher) setSupplemente((prev) => prev.map((s) => (s.id === id ? vorher : s)));
    }
  }, []);

  const supplementEntfernen = useCallback(async (id) => {
    // Bug-Fix: bei Fehlschlag verschwand das Supplement trotzdem sofort aus
    // der Liste, bis zum nächsten Neuladen — wirkte wie gelöscht, tauchte
    // dann aber wieder auf, ohne jede Fehlermeldung.
    let vorherigesSupplement;
    let vorherigerIndex;
    setSupplemente((prev) => {
      vorherigerIndex = prev.findIndex((s) => s.id === id);
      vorherigesSupplement = prev[vorherigerIndex];
      return prev.filter((s) => s.id !== id);
    });
    const { error } = await supabase.from("supplements").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigesSupplement) {
        setSupplemente((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigesSupplement);
          return next;
        });
      }
    }
  }, []);

  // Foto vom Präparat (Fläschchen/Packung) — analog zu setHormonFoto/
  // setPeptidFoto, jetzt auch für Supplemente (Nutzerinnen-Vorgabe, 13.08.).
  const setSupplementFoto = useCallback(
    async (id, file) => {
      try {
        const path = await uploadPhoto(userId, file, "praeparate");
        let vorherigerPfad;
        setSupplemente((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            vorherigerPfad = s.fotoPath;
            return { ...s, fotoPath: path };
          })
        );
        const { error } = await supabase.from("supplements").update({ foto_path: path }).eq("id", id);
        if (error) {
          console.error(error);
          setSupplemente((prev) => prev.map((s) => (s.id === id ? { ...s, fotoPath: vorherigerPfad } : s)));
        }
      } catch (err) {
        console.error(err);
      }
    },
    [userId]
  );

  const toggleSupplementErledigt = useCallback(
    async (datum, id, zeit) => {
      const k = `${datum}__${id}__${zeit}`;
      const aktuellerWert = k in pendingErledigtRef.current ? pendingErledigtRef.current[k] : supplementErledigt[k];
      const nextVal = !aktuellerWert;
      const vorherigeErledigtAt = supplementErledigtAt[k] ?? null;
      pendingErledigtRef.current[k] = nextVal;
      const nowIso = new Date().toISOString();
      setSupplementErledigt((prev) => ({ ...prev, [k]: nextVal }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nextVal ? nowIso : null }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: id, log_date: datum, tageszeit: zeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        pendingErledigtRef.current[k] = aktuellerWert;
        setSupplementErledigt((prev) => ({ ...prev, [k]: aktuellerWert }));
        setSupplementErledigtAt((prev) => ({ ...prev, [k]: vorherigeErledigtAt }));
        return;
      }
      // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): nur beim Abhaken, nicht
      // beim Rückgängigmachen, und nur innerhalb des Admin-Puffers nach der
      // geplanten Uhrzeit.
      if (nextVal && istRechtzeitig(zeit, belohnungPufferMin)) {
        const supplementName = supplemente.find((s) => s.id === id)?.name || "Supplement";
        feuereBelohnung({ text: `„${supplementName}" genommen`, icon: "capsule", punkte: 1 });
      }
    },
    [supplementErledigt, supplementErledigtAt, userId, belohnungPufferMin, supplemente]
  );

  const saveSupplementFeedback = useCallback(
    async (dose, draftFeedback) => {
      const k = `${dose.datum}__${dose.id}__${dose.zeit}`;
      const nowIso = new Date().toISOString();
      const record = { wirkung: draftFeedback.wirkung, nebenwirkungen: draftFeedback.nebenwirkungen, notizen: draftFeedback.notizen };
      const vorherErledigt = supplementErledigt[k];
      const vorherErledigtAt = supplementErledigtAt[k] ?? null;
      const vorherFeedback = supplementFeedback[k];
      setSupplementErledigt((prev) => ({ ...prev, [k]: true }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nowIso }));
      setSupplementFeedback((prev) => ({ ...prev, [k]: record }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: dose.id, log_date: dose.datum, tageszeit: dose.zeit, erledigt: true, erledigt_at: nowIso, ...record },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        setSupplementErledigt((prev) => ({ ...prev, [k]: vorherErledigt }));
        setSupplementErledigtAt((prev) => ({ ...prev, [k]: vorherErledigtAt }));
        setSupplementFeedback((prev) => ({ ...prev, [k]: vorherFeedback }));
      }
    },
    [userId, supplementErledigt, supplementErledigtAt, supplementFeedback]
  );

  const skipSupplementFeedback = useCallback(
    async (dose) => {
      const k = `${dose.datum}__${dose.id}__${dose.zeit}`;
      const nowIso = new Date().toISOString();
      const vorherErledigt = supplementErledigt[k];
      const vorherErledigtAt = supplementErledigtAt[k] ?? null;
      setSupplementErledigt((prev) => ({ ...prev, [k]: true }));
      setSupplementErledigtAt((prev) => ({ ...prev, [k]: nowIso }));
      const { error } = await supabase.from("supplement_logs").upsert(
        { user_id: userId, supplement_id: dose.id, log_date: dose.datum, tageszeit: dose.zeit, erledigt: true, erledigt_at: nowIso },
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        setSupplementErledigt((prev) => ({ ...prev, [k]: vorherErledigt }));
        setSupplementErledigtAt((prev) => ({ ...prev, [k]: vorherErledigtAt }));
        return;
      }
      // Siehe skipHormonFeedback: Tagesplan-"Bestätigen" läuft hierüber und
      // löste bisher nie das Belohnungsfenster aus.
      if (!vorherErledigt && istRechtzeitig(dose.zeit, belohnungPufferMin)) {
        const supplementName = supplemente.find((s) => s.id === dose.id)?.name || "Supplement";
        feuereBelohnung({ text: `„${supplementName}" genommen`, icon: "capsule", punkte: 1 });
      }
    },
    [userId, supplementErledigt, supplementErledigtAt, belohnungPufferMin, supplemente]
  );

  // Bestätigt alle noch offenen Supplemente einer Tageszeit an einem Tag auf einmal
  // (z. B. "Morgens" komplett abhaken), ohne bereits erledigte anzufassen.
  const confirmAlleTageszeit = useCallback(
    async (datum, zeit, ids) => {
      const offene = ids.filter((id) => !supplementErledigt[`${datum}__${id}__${zeit}`]);
      if (offene.length === 0) return;
      const nowIso = new Date().toISOString();
      setSupplementErledigt((prev) => {
        const next = { ...prev };
        offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = true));
        return next;
      });
      setSupplementErledigtAt((prev) => {
        const next = { ...prev };
        offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = nowIso));
        return next;
      });
      const { error } = await supabase.from("supplement_logs").upsert(
        offene.map((id) => ({ user_id: userId, supplement_id: id, log_date: datum, tageszeit: zeit, erledigt: true, erledigt_at: nowIso })),
        { onConflict: "supplement_id,log_date,tageszeit" }
      );
      if (error) {
        console.error(error);
        // Waren zuvor unerledigt (offene = noch nicht erledigt), also einfach
        // auf "nicht erledigt" zurücksetzen statt einen komplexeren
        // Vorher-Snapshot pro Eintrag zu führen.
        setSupplementErledigt((prev) => {
          const next = { ...prev };
          offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = false));
          return next;
        });
        setSupplementErledigtAt((prev) => {
          const next = { ...prev };
          offene.forEach((id) => (next[`${datum}__${id}__${zeit}`] = null));
          return next;
        });
      }
    },
    [supplementErledigt, userId]
  );

  return {
    supplemente,
    supplementHinzufuegen,
    supplementAendern,
    supplementEntfernen,
    setSupplementFoto,
    supplementErledigt,
    supplementErledigtAt,
    toggleSupplementErledigt,
    confirmAlleTageszeit,
    supplementFeedback,
    saveSupplementFeedback,
    skipSupplementFeedback,
  };
}
