import React from "react";
import { STUFEN, stufeVon } from "../utils/prioritaet";

// Ampel-Punkt (03.10.): zeigt, wie streng ein Punkt ist – siehe utils/prioritaet.js.
export default function AmpelPunkt({ item, stufe, mitText = true }) {
  const s = stufe || stufeVon(item);
  return (
    <span
      data-ampel={s.id}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.2,
        textTransform: "uppercase",
        opacity: 0.95,
      }}
    >
      <i
        style={{
          width: 9,
          height: 9,
          borderRadius: 99,
          background: `radial-gradient(circle at 35% 30%, #fff8 0, transparent 55%), ${s.farbe}`,
          boxShadow: `0 0 0 2px ${s.farbe}33, 0 1px 3px ${s.farbe}99`,
          flexShrink: 0,
        }}
      />
      {mitText && s.label}
    </span>
  );
}

export function AmpelLegende() {
  return (
    <div
      data-ampel-legende
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
        margin: "0 0 12px",
        color: "var(--mp-text-muted)",
      }}
    >
      {Object.values(STUFEN).map((s) => (
        <AmpelPunkt key={s.id} stufe={s} />
      ))}
    </div>
  );
}
