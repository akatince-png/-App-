import React from "react";
import { useAppData } from "../context/AppDataContext";
import { ART, QUADRANT, alltagAusMatrix, fristText } from "../utils/matrix";
import { toLocalISODate } from "../utils/dates";

// „Heute aus deiner Matrix“ (30.09., Vorschau): Die Aufgaben-Matrix aus dem
// Workflow-Bereich spiegelt sich im Tagesplan – nur Rot (JETZT) und das
// heute eingeplante Grün (PLANEN). Gelb und Grau bleiben in der Matrix,
// damit der Tag nicht voll wird. Abhaken geht direkt hier.
// datum (24.10.): Im Tagesplan der gewählte Tag – für morgen usw. erscheint,
// was dort eingeplant ist.
export default function MatrixHeuteKarte({ onOeffnen, datum = null }) {
  const { matrixAufgaben = [], matrixAufgabeSpeichern, projekte = [] } = useAppData();
  const tag = datum || new Date();
  const istHeute = toLocalISODate(tag) === toLocalISODate(new Date());
  const liste = alltagAusMatrix(matrixAufgaben, tag, { nurGeplant: !istHeute });
  if (!liste.length) return null;
  const projektName = (id) => projekte.find((p) => p.id === id)?.name;
  return (
    <section data-matrix-heute aria-label={istHeute ? "Heute aus deiner Matrix" : "Aus deiner Matrix"} style={{ marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "var(--mp-karte)", boxShadow: "var(--mp-schatten)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>🗂️ {istHeute ? "Heute aus deiner Matrix" : `Aus deiner Matrix · ${tag.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })}`}</span>
        <button type="button" onClick={onOeffnen} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 700, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
          Matrix ›
        </button>
      </div>
      {liste.map((a) => {
        const q = QUADRANT[a.quadrant];
        const fertig = !!a.erledigtAm;
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--mp-rand)" }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 9, background: q.farbe, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, opacity: fertig ? 0.55 : 1 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, textDecoration: fertig ? "line-through" : "none" }}>
                {a.uhrzeit ? `${a.uhrzeit} · ` : ""}
                {a.mitAm === toLocalISODate(tag) ? "⭐ " : ""}
                {a.erinnerung ? "🔔 " : ""}
                {a.art && a.art !== "aufgabe" ? `${ART[a.art]?.icon || ""} ` : ""}
                {a.naechsterSchritt || a.titel}
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--mp-text-muted)" }}>
                {[a.naechsterSchritt && a.titel, projektName(a.projektId), a.frist && `bis ${fristText(a.frist)}`, a.dauerMin && `${a.dauerMin} Min`].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 9, background: q.bg, color: q.schrift }}>{q.titel}</span>
            <button
              type="button"
              aria-label={`${a.titel} ${fertig ? "wieder öffnen" : "erledigt"}`}
              onClick={() => matrixAufgabeSpeichern?.({ ...a, erledigtAm: fertig ? null : new Date().toISOString() })}
              style={{ width: 34, height: 34, borderRadius: 99, border: fertig ? "none" : `2px solid ${q.farbe}`, background: fertig ? q.farbe : "transparent", color: fertig ? "#fff" : q.farbe, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
            >
              ✓
            </button>
          </div>
        );
      })}
    </section>
  );
}
