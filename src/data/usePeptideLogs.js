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
        const k = `${new Date(row.dose_date).toDateString()}__${row.peptid_name}`;
        nextErledigt[k] = row.erledigt;
        nextFeedback[k] = {
          nebenwirkungen: row.nebenwirkungen || [],
          staerke: row.staerke || "",
          notizen: row.notizen || "",
          foto: row.foto_path || null,
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
      const k = keyOf(dose.date, dose.peptid);
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
      };
      setFeedback((prev) => ({ ...prev, [k]: record }));
      setErledigt((prev) => ({ ...prev, [k]: true }));

      const { error } = await supabase.from("peptide_logs").upsert(
        {
          protocol_id: protocolId,
          user_id: userId,
          peptid_name: dose.peptid,
          dose_date: toLocalISODate(dose.date),
          erledigt: true,
          nebenwirkungen: draftFeedback.nebenwirkungen,
          staerke: draftFeedback.staerke || null,
          notizen: draftFeedback.notizen,
          foto_path: fotoPath,
        },
        { onConflict: "protocol_id,peptid_name,dose_date" }
      );
      if (error) console.error(error);
    },
    [protocolId, userId]
  );

  const skipFeedback = useCallback(
    async (dose) => {
      const k = keyOf(dose.date, dose.peptid);
      setErledigt((prev) => ({ ...prev, [k]: true }));
      const { error } = await supabase.from("peptide_logs").upsert(
        {
          protocol_id: protocolId,
          user_id: userId,
          peptid_name: dose.peptid,
          dose_date: toLocalISODate(dose.date),
          erledigt: true,
        },
        { onConflict: "protocol_id,peptid_name,dose_date" }
      );
      if (error) console.error(error);
    },
    [protocolId, userId]
  );

  return { erledigt, feedback, saveFeedback, skipFeedback };
}
