import React, { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { supabase } from "../lib/supabaseClient";
import { aufMomentHoeren } from "../utils/momentFrageBus";
import { faelligeBausteine } from "../utils/kernprogramm";

// Kurze Frage direkt nach dem Abhaken (25.09.): "Eiweiß dabei?" bei einer
// Mahlzeit — nur wenn der Baustein Ernährung im Kernprogramm schon dran ist.
// Ein Tipp, verschwindet nach 12 s von selbst (Antwort bleibt dann offen).
export default function MomentFrageHost() {
  const { kernStand } = useAppData();
  const [frage, setFrage] = useState(null);
  const ernaehrungDran = faelligeBausteine(kernStand).some((b) => b.key === "mahlzeiten");

  useEffect(
    () =>
      aufMomentHoeren((m) => {
        if (m.art === "mahlzeit" && ernaehrungDran) setFrage(m);
      }),
    [ernaehrungDran]
  );
  useEffect(() => {
    if (!frage) return;
    const t = setTimeout(() => setFrage(null), 12000);
    return () => clearTimeout(t);
  }, [frage]);

  if (!frage) return null;
  const antworten = async (eiweiss) => {
    const f = frage;
    setFrage(null);
    const { error } = await supabase.from("meal_logs").update({ eiweiss }).eq("user_id", f.userId).eq("meal_id", f.mealId).eq("log_date", f.datum).eq("tageszeit", f.tageszeit);
    if (error) console.error(error);
  };
  const knopf = { flex: 1, border: "none", borderRadius: 12, padding: "11px 10px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" };
  return (
    <div role="dialog" aria-label="Kurze Frage" style={{ position: "fixed", left: 12, right: 12, bottom: 86, zIndex: 60, maxWidth: 460, margin: "0 auto", background: "#fff", borderRadius: 18, padding: 14, boxShadow: "0 12px 34px rgba(20,23,26,.22)", border: "1.5px solid #E4E6EE" }}>
      <div style={{ fontWeight: 900, fontSize: 15 }}>🍳 War bei „{frage.name}“ Eiweiß dabei?</div>
      <div style={{ fontSize: 12, color: "#6B7178", margin: "2px 0 10px" }}>z. B. Ei, Quark, Joghurt, Fisch, Fleisch, Tofu, Hülsenfrüchte</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => antworten(true)} style={{ ...knopf, background: "#1B2350", color: "#fff" }}>
          Ja
        </button>
        <button type="button" onClick={() => antworten(false)} style={{ ...knopf, background: "#EEF4FF", color: "#2D6FD6" }}>
          Nein
        </button>
      </div>
    </div>
  );
}
