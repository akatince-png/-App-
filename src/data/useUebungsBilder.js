import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BUCKET = "uebungsbilder";

// Übungsbilder (13.08., Nachtrag): schwarz-weiße Illustrationen, von der
// Nutzerin in Canva erstellt, einer Übung (per exaktem Namen aus
// KRAFTUEBUNGEN/BODYWEIGHT_UEBUNGEN, constants.js) zugeordnet. Anders als
// die bestehende Foto-Infrastruktur (src/lib/storage.js, privater
// "photos"-Bucket, pro Nutzer:in) ist das hier eine GETEILTE, öffentliche
// Bibliothek — jede Person sieht dieselben Bilder im Live-Trainings-Screen.
export function useUebungsBilder(userId) {
  const [uebungsBilder, setUebungsBilder] = useState({}); // { [name]: bild_url }

  const laden = useCallback(async () => {
    const { data } = await supabase.from("uebungs_bilder").select("name, bild_url");
    setUebungsBilder(Object.fromEntries((data || []).map((r) => [r.name, r.bild_url])));
  }, []);

  useEffect(() => {
    if (!userId) return;
    laden();
  }, [userId, laden]);

  const uebungsBildHochladen = useCallback(
    async (name, file) => {
      const ext = file.name?.split(".").pop() || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/png",
      });
      if (uploadError) return { ok: false, error: uploadError.message };

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error } = await supabase
        .from("uebungs_bilder")
        .upsert({ name, bild_url: pub.publicUrl }, { onConflict: "name" });
      if (error) return { ok: false, error: error.message };

      setUebungsBilder((prev) => ({ ...prev, [name]: pub.publicUrl }));
      return { ok: true };
    },
    []
  );

  const uebungsBildEntfernen = useCallback(async (name) => {
    await supabase.from("uebungs_bilder").delete().eq("name", name);
    setUebungsBilder((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  return { uebungsBilder, uebungsBildHochladen, uebungsBildEntfernen };
}
