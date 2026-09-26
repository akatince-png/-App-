import React, { useCallback, useEffect, useState } from "react";
import { PrimaryButton } from "../../ui/primitives";
import { cardBorder, danger, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { toLocalISODate } from "../../utils/dates";
import { plusTage } from "../../utils/schichtplan";
import { zeileZuEssen } from "../../data/useEssen";
import { ZIELARTEN, ZIEL_STANDARD, aktuellesGewicht, makroZiele, tagesWerte, verhaeltnis } from "../../utils/essenRechner";

// Ernährung einer Person für den Coach (25.09., Vorschau freigegeben):
// Durchschnitt der letzten 7 Tage – Eiweiß in g/kg gegen das Ziel,
// Kalorien, Omega-6 : 3, Fisch-Tage – und Ziele setzen ("vom Coach
// empfohlen", die Person sieht und bestätigt sie).
const fmt = (n) => String(Math.round(Number(n) * 10) / 10).replace(".", ",");
const feld = { border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "6px 8px", fontSize: 13.5, fontFamily: "inherit", width: 70 };

export default function ErnaehrungCoach({ personId, vorname, onChat }) {
  const heute = toLocalISODate(new Date());
  const [d, setD] = useState(null);
  const [bearbeiten, setBearbeiten] = useState(null);
  const [fehler, setFehler] = useState(null);

  const laden = useCallback(async () => {
    const seit = plusTage(heute, -6);
    const [pr, ch, es, me, zu, lo] = await Promise.all([
      supabase.from("profiles").select("category_ziele, gewicht_start").eq("id", personId).maybeSingle(),
      supabase.from("checkins").select("datum, values").eq("user_id", personId).order("datum"),
      supabase.from("essen_eintraege").select("*").eq("user_id", personId).gte("datum", seit),
      supabase.from("meals").select("id, name").eq("user_id", personId),
      supabase.from("meal_ingredients").select("meal_id, name, menge, menge_gramm").eq("user_id", personId),
      supabase.from("meal_logs").select("log_date, meal_id, tageszeit, erledigt").eq("user_id", personId).gte("log_date", seit),
    ]);
    const mahlzeiten = (me.data || []).map((m) => ({ ...m, zutaten: (zu.data || []).filter((z) => z.meal_id === m.id).map((z) => ({ name: z.name, menge: z.menge, mengeGramm: z.menge_gramm })) }));
    const mahlzeitErledigt = {};
    (lo.data || []).forEach((r) => r.erledigt && (mahlzeitErledigt[`${r.log_date}__${r.meal_id}__${r.tageszeit}`] = true));
    setD({
      ziele: pr.data?.category_ziele || {},
      // Gewicht steckt in checkins.values (jsonb), nicht in einer eigenen Spalte (Fund Dauertest 26.09.: 400).
      gewicht: aktuellesGewicht((ch.data || []).map((r) => ({ datum: r.datum, ...r.values })), { gewichtStart: pr.data?.gewicht_start }),
      quelle: { essenEintraege: (es.data || []).map(zeileZuEssen), mahlzeiten, mahlzeitErledigt },
    });
  }, [personId, heute]);

  useEffect(() => {
    laden();
  }, [laden]);

  if (!d) return null;
  const zielE = d.ziele.ernaehrung || {};
  const z = makroZiele(zielE, d.gewicht, zielE.kalorienZiel);
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(heute, -i - 1)).map((t) => tagesWerte(t, d.quelle));
  const mitDaten = tage.filter((t) => t.anzahl > 0);
  const schnitt = (k) => (mitDaten.length ? mitDaten.reduce((s, t) => s + t[k], 0) / mitDaten.length : 0);
  const eiweissProKg = d.gewicht && mitDaten.length ? schnitt("eiweiss") / d.gewicht : null;
  const ratio = verhaeltnis(
    tage.reduce((s, t) => s + t.omega6, 0),
    tage.reduce((s, t) => s + t.omega3, 0)
  );
  const fischTage = tage.filter((t) => t.epaDha >= 500).length;
  const eiweissOk = eiweissProKg != null && eiweissProKg >= z.eiweissGProKg * 0.9;

  const speichern = async () => {
    setFehler(null);
    const neu = { ...d.ziele, ernaehrung: { ...zielE, ...bearbeiten, vomCoach: true } };
    const { error } = await supabase.from("profiles").update({ category_ziele: neu }).eq("id", personId);
    if (error) return setFehler(error.message);
    setBearbeiten(null);
    laden();
  };

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cardBorder}`, padding: "10px 12px", marginBottom: 10, background: "#fff" }} data-ernaehrung-coach>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>🍽️ ERNÄHRUNG · Ø LETZTE 7 TAGE{zielE.ziel ? ` · ZIEL ${ZIELARTEN.find((x) => x[0] === zielE.ziel)?.[1]?.toUpperCase() || ""}` : ""}</div>
      {mitDaten.length === 0 ? (
        <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>Noch nichts eingetragen.</div>
      ) : (
        <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.7 }}>
          🥚 {eiweissProKg != null ? `${fmt(eiweissProKg)} g/kg` : `${fmt(schnitt("eiweiss"))} g`}{" "}
          <span style={{ color: eiweissOk ? "#1E8E5A" : "#C27A00" }}>{eiweissOk ? "✓" : `(Ziel ${fmt(z.eiweissGProKg)})`}</span> · 🔥 {Math.round(schnitt("kcal"))} kcal
          {z.kcal ? ` (Ziel ${z.kcal})` : ""}
          <br />
          ⚖️ Ω6 : 3 {ratio == null ? "–" : `${fmt(ratio)} : 1`}{" "}
          {ratio != null && <span style={{ color: ratio <= z.omega6zu3Max ? "#1E8E5A" : "#E0352B" }}>{ratio <= z.omega6zu3Max ? "✓" : "▲"}</span>} · 🐟 Fisch-Tage {fischTage}/{z.fischProWoche} · an {mitDaten.length} von 7 Tagen eingetragen
        </div>
      )}
      {!eiweissOk && mitDaten.length > 0 && (
        <button
          type="button"
          onClick={() => onChat(`Hallo${vorname ? ` ${vorname}` : ""}, ich habe auf deine Ernährung geschaut: Eiweiß lag zuletzt im Schnitt bei ${eiweissProKg != null ? `${fmt(eiweissProKg)} g pro kg` : `${fmt(schnitt("eiweiss"))} g`}. Wollen wir schauen, wo sich leicht mehr einbauen lässt, z. B. beim Frühstück?`)}
          style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}
        >
          Ansprechen ›
        </button>
      )}
      {bearbeiten ? (
        <div style={{ marginTop: 8, borderTop: `1px solid ${cardBorder}`, paddingTop: 8, fontSize: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: "center" }}>
            <span>Eiweiß g/kg</span>
            <input aria-label="Eiweiß g/kg" type="number" step="0.1" value={bearbeiten.eiweissGProKg} onChange={(e) => setBearbeiten((b) => ({ ...b, eiweissGProKg: Number(e.target.value) }))} style={feld} />
            <span>Fett %</span>
            <input aria-label="Fett %" type="number" value={bearbeiten.fettProzent} onChange={(e) => setBearbeiten((b) => ({ ...b, fettProzent: Number(e.target.value) }))} style={feld} />
            <span>Kalorien</span>
            <input aria-label="Kalorien" type="number" value={bearbeiten.kalorienZiel ?? ""} onChange={(e) => setBearbeiten((b) => ({ ...b, kalorienZiel: e.target.value === "" ? null : Number(e.target.value) }))} style={feld} />
            <span>Omega-3 EPA/DHA mg</span>
            <input aria-label="Omega-3 mg" type="number" value={bearbeiten.omega3Mg} onChange={(e) => setBearbeiten((b) => ({ ...b, omega3Mg: Number(e.target.value) }))} style={feld} />
            <span>Ω6 : 3 höchstens</span>
            <input aria-label="Omega-6 zu 3" type="number" value={bearbeiten.omega6zu3Max} onChange={(e) => setBearbeiten((b) => ({ ...b, omega6zu3Max: Number(e.target.value) }))} style={feld} />
          </div>
          <div style={{ fontSize: 12, color: textMuted, margin: "6px 0" }}>Die Person sieht „von deinem Coach empfohlen“.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryButton onClick={speichern}>Speichern</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setBearbeiten(null)}>
              Abbrechen
            </PrimaryButton>
          </div>
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setBearbeiten({ ...ZIEL_STANDARD, ...zielE })}
          style={{ display: "block", border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}
        >
          🎯 Ziele setzen ›
        </button>
      )}
    </div>
  );
}
