import React, { useState } from "react";
import { cardBorder, textMain, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";

// Aktion-Werte, die eine STRUKTURELLE Änderung an einem Baustein/Eintrag
// beschreiben (Dosis geändert, Schritt hinzugefügt/entfernt, Version
// festgehalten) — im Unterschied zu "erledigt"/"ausgefallen"/"Ausnahme
// zurückgenommen", die eine tatsächliche Handlung AN EINEM TAG beschreiben.
export const VERLAUF_AKTIONEN = ["geändert", "hinzugefügt", "entfernt", "Version festgehalten"];

function datumUhrzeit(iso) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Retro-Perspektive für Coaches (Nutzerinnen-Vorgabe, 17.09.): "Die
// Veränderung selber ... soll lediglich im Protokoll einsehbar sein, nicht
// im Tagesverlauf ... damit ich später nachvollziehen kann als Coach, was
// die Leute wann, wie, wo gemacht haben oder wir gemeinsam entschieden
// haben." Der Tagesverlauf (ProtokollLogView.jsx) zeigt seitdem nur noch
// die tatsächlichen Tagesereignisse (erledigt/ausgefallen) — diese
// Komponente ist der neue, einzige Ort für die STRUKTURELLE Änderungs-
// Historie EINES konkreten Eintrags (z. B. "Testosteron": 10mg → 20mg am
// 17.09.). Liest `protokollEintraege` direkt aus dem AppDataContext (schon
// vollständig geladen, keine zusätzliche Abfrage nötig) und filtert rein
// clientseitig nach kategorie+itemName — dieselbe Datenquelle wie der
// Tagesverlauf, nur anders gefiltert/dargestellt, kein separates
// Datenmodell.
export default function ItemVerlauf({ kategorie, itemName }) {
  const { protokollEintraege } = useAppData();
  const [offen, setOffen] = useState(false);

  const eintraege = (protokollEintraege || []).filter(
    (e) => e.kategorie === kategorie && e.itemName === itemName && VERLAUF_AKTIONEN.includes(e.aktion)
  );

  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        style={{
          border: "none",
          background: "transparent",
          color: textMuted,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          padding: 0,
        }}
      >
        🕐 Verlauf{eintraege.length > 0 ? ` (${eintraege.length})` : ""} {offen ? "▲" : "▼"}
      </button>
      {offen && (
        <div style={{ marginTop: 6, borderTop: `1px solid ${cardBorder}`, paddingTop: 6 }}>
          {eintraege.length === 0 ? (
            <div style={{ fontSize: 11.5, color: textMuted, fontStyle: "italic" }}>Noch keine Änderungen protokolliert.</div>
          ) : (
            eintraege.map((e) => (
              <div key={e.id} style={{ padding: "5px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: 11, color: textMuted }}>
                  {datumUhrzeit(e.erstelltAm)} · <span style={{ fontWeight: 700, color: textMain }}>{e.aktion}</span>
                </div>
                {e.detail && <div style={{ fontSize: 12, color: textMain, marginTop: 1 }}>{e.detail}</div>}
                {e.grund && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1, fontStyle: "italic" }}>„{e.grund}"</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
