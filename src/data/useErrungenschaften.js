import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { berechneErrungenschaften } from "../utils/errungenschaften";

// Lädt/vergibt Abzeichen für den Punkte-/Streak-Bereich "Erfolge"
// (Nutzerin-Vorgabe, 11.09.). Punkte/Streaks selbst werden nicht in der DB
// gehalten, sondern bei jedem Aufruf aus den schon geladenen Kategorie-
// Daten berechnet (siehe utils/errungenschaften.js) — nur neu erreichte
// Abzeichen werden dauerhaft in `errungenschaften` festgehalten, damit sie
// nicht wieder verschwinden, sobald ein Streak später reißt.
//
// `quellen` wird bewusst NICHT direkt aus useAppData() durchgereicht,
// sondern von der aufrufenden Stelle aus den einzelnen, stabilen Feldern
// zusammengesetzt (siehe ErfolgeTab.jsx) — der AppDataContext-Wert selbst
// ist kein memoisiertes Objekt und würde bei jeder Neuberechnung einen
// unnötigen Durchlauf auslösen.
export function useErrungenschaften(userId, quellen) {
  const [verdiente, setVerdiente] = useState(null); // null = noch nicht geladen; sonst badge_key -> erreicht_am (ISO)
  const [neueBadgeKeys, setNeueBadgeKeys] = useState(new Set());

  const berechnung = useMemo(
    () => berechneErrungenschaften(quellen),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      quellen.supplementErledigt,
      quellen.mahlzeitErledigt,
      quellen.hormonErledigt,
      quellen.gewohnheitErledigt,
      quellen.trainingEintraege,
      quellen.routineDurchlaeufe,
      quellen.schlafEintraege,
      quellen.atemuebungLogs,
      quellen.hydrationEintraege,
      quellen.hydrationZielMl,
      quellen.tageslichtEintraege,
      quellen.tageslichtZielMinuten,
      quellen.denkpauseErgebnisse,
      quellen.eigeneGruppenLogs,
    ]
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("errungenschaften").select("badge_key, erreicht_am").eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        console.error(error);
        return;
      }
      const next = {};
      (data || []).forEach((row) => (next[row.badge_key] = row.erreicht_am));
      setVerdiente(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || verdiente === null) return;
    const fehlend = [...berechnung.erreichteBadgeKeys].filter((k) => !(k in verdiente));
    if (fehlend.length === 0) return;
    let cancelled = false;
    (async () => {
      const jetzt = new Date().toISOString();
      const rows = fehlend.map((badge_key) => ({ user_id: userId, badge_key, erreicht_am: jetzt }));
      const { error } = await supabase.from("errungenschaften").upsert(rows, { onConflict: "user_id,badge_key", ignoreDuplicates: true });
      if (cancelled) return;
      if (error) {
        console.error(error);
        return;
      }
      setVerdiente((prev) => {
        const next = { ...prev };
        fehlend.forEach((k) => (next[k] = jetzt));
        return next;
      });
      setNeueBadgeKeys(new Set(fehlend));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, berechnung.erreichteBadgeKeys, verdiente]);

  return { ...berechnung, verdiente: verdiente || {}, ladend: verdiente === null, neueBadgeKeys };
}
