import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { keyOf, toLocalISODate } from "../utils/dates";

export function usePeptideLogs(userId, protocolId) {
  const [erledigt, setErledigt] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    if (!protocolId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("peptide_logs").select("*").eq("protocol_id", protocolId);
      if (cancelled || !data) return;
      const nextErledigt = {};
      const nextFeedback = {};
      data.forEach((row) => {
        const k = keyOf(new Date(row.dose_date), row.peptid_name, row.uhrzeit);
        nextErledigt[k] = row.erledigt;
        nextFeedback[k] = {
          nebenwirkungen: row.nebenwirkungen || [],
          staerke: row.staerke || "",
          notizen: row.notizen || "",
          foto: row.foto_path || null,
          erledigtAt: row.erledigt_at || null,
        };
      });
      setErledigt(nextErledigt);
      setFeedback(nextFeedback);
    })();
    return () => {
      cancelled = true;
    };
  }, [protocolId]);

  const saveFeedback = useCallback(
    async (dose, draftFeedback) => {
      const k = keyOf(dose.date, dose.peptid, dose.uhrzeit);
      const nowIso = new Date().toISOString();
      let fotoPath = null;
      if (draftFeedback.fotoFile) {
        try {
          fotoPath = await uploadPhoto(userId, draftFeedback.fotoFile, "nebenwirkungen");
        } catch (err) {
          console.error(err);
        }
      }
      const record = {
        nebenwirkungen: draftFeedback.nebenwirkungen,
        staerke: draftFeedback.staerke,
        notizen: draftFeedback.notizen,
        foto: fotoPath,
        erledigtAt: nowIso,
      };
      setFeedback((prev) => ({ ...prev, [k]: record }));
      setErledigt((prev) => ({ ...prev, [k]: true }));

      const { error } = await supabase.from("peptide_logs").upsert(
        {
          protocol_id: protocolId,
          user_id: userId,
          peptid_name: dose.peptid,
          dose_date: toLocalISODate(dose.date),
          uhrzeit: dose.uhrzeit,
          erledigt: true,
          erledigt_at: nowIso,
          nebenwirkungen: draftFeedback.nebenwirkungen,
          staerke: draftFeedback.staerke || null,
          notizen: draftFeedback.notizen,
          foto_path: fotoPath,
        },
        { onConflict: "protocol_id,peptid_name,dose_date,uhrzeit" }
      );
      if (error) console.error(error);
    },
    [protocolId, userId]
  );

  const skipFeedback = useCallback(
    async (dose) => {
      const k = keyOf(dose.date, dose.peptid, dose.uhrzeit);
      const nowIso = new Date().toISOString();
      setErledigt((prev) => ({ ...prev, [k]: true }));
      setFeedback((prev) => ({ ...prev, [k]: { ...prev[k], erledigtAt: nowIso } }));
      const { error } = await supabase.from("peptide_logs").upsert(
        {
          protocol_id: protocolId,
          user_id: userId,
          peptid_name: dose.peptid,
          dose_date: toLocalISODate(dose.date),
          uhrzeit: dose.uhrzeit,
          erledigt: true,
          erledigt_at: nowIso,
        },
        { onConflict: "protocol_id,peptid_name,dose_date,uhrzeit" }
      );
      if (error) console.error(error);
    },
    [protocolId, userId]
  );

  return { erledigt, feedback, saveFeedback, skipFeedback };
}
