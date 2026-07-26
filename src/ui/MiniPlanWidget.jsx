import React from "react";
import { KATEGORIE_META } from "../utils/dayItems";

/**
 * MiniPlanWidget: Kleine Doppelring-Visualisierung für einen Plan
 * Zeigt Tagesfortschritt (innerer Ring) und Wochenfortschritt (äußerer Ring)
 *
 * Props:
 * - name: string - Name des Plans (z.B. "Peptide", "Hormone")
 * - dailyCount: number - Heutige Erfüllung (z.B. 3)
 * - dailyTotal: number - Heutiges Ziel (z.B. 5)
 * - weeklyCount: number - Wochenerfüllung (z.B. 4)
 * - weeklyTotal: number - Wochenziel (z.B. 7)
 * - kategorie: string - Kategorie für Farbe (z.B. "peptid", "hormon")
 */
export default function MiniPlanWidget({ name, dailyCount, dailyTotal, weeklyCount, weeklyTotal, kategorie, unit = "" }) {
  // KATEGORIE_META-Einträge haben kein "color"-Feld (nur bg/text/dot/label) —
  // ein vorheriger Zugriff auf meta.color war deshalb immer undefined und
  // ließ die Ring-Striche unsichtbar werden (SVG-Default für stroke: "none").
  const meta = KATEGORIE_META[kategorie] || { dot: "#999" };
  const baseColor = meta.dot;

  // Berechne Prozentsätze
  const dailyPercent = dailyTotal > 0 ? (dailyCount / dailyTotal) * 100 : 0;
  const weeklyPercent = weeklyTotal > 0 ? (weeklyCount / weeklyTotal) * 100 : 0;

  // Berechne Stroke-Dasharray für die Ringe
  // Innerer Ring Umfang ≈ 2π * 14 ≈ 88
  // Äußerer Ring Umfang ≈ 2π * 22 ≈ 138
  const innerCircumference = 2 * Math.PI * 14;
  const outerCircumference = 2 * Math.PI * 22;

  const innerStrokeDash = (dailyPercent / 100) * innerCircumference;
  const outerStrokeDash = (weeklyPercent / 100) * outerCircumference;

  // Hellere Farbe für Hintergrund
  const lighterColor = baseColor + "40"; // 25% opacity

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "12px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: baseColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {name}
      </div>

      <svg
        style={{
          width: "70px",
          height: "70px",
        }}
        viewBox="0 0 60 60"
      >
        {/* Äußerer Ring Hintergrund */}
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={lighterColor}
          strokeWidth="4"
        />

        {/* Äußerer Ring Fortschritt (Woche) */}
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={baseColor}
          strokeWidth="4"
          strokeDasharray={`${outerStrokeDash} ${outerCircumference}`}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "30px 30px",
            transition: "stroke-dasharray 0.3s ease",
          }}
        />

        {/* Innerer Ring Hintergrund */}
        <circle
          cx="30"
          cy="30"
          r="14"
          fill="none"
          stroke={lighterColor}
          strokeWidth="3"
        />

        {/* Innerer Ring Fortschritt (Tag) */}
        <circle
          cx="30"
          cy="30"
          r="14"
          fill="none"
          stroke={baseColor}
          strokeWidth="3"
          strokeDasharray={`${innerStrokeDash} ${innerCircumference}`}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "30px 30px",
            transition: "stroke-dasharray 0.3s ease",
          }}
        />
      </svg>

      <div
        style={{
          fontSize: "9px",
          color: "#888",
          marginTop: "4px",
        }}
      >
        {dailyCount}{unit}/{dailyTotal}{unit} heute
      </div>
    </div>
  );
}
