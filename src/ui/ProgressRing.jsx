import React, { useId } from "react";
import { accent, textMain } from "./theme";

// Verdunkelt eine Hex-Farbe für den zweiten Gradient-Stop, statt für jede
// Ring-Farbe eine eigene "Dark"-Variante im Theme pflegen zu müssen.
function darken(hex, amount = 0.32) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 255) * (1 - amount)));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

// Tachometer-artiger Fortschrittsring: Gradient statt Volltonfarbe, sanftes
// Glühen um den Bogen, und ein pulsierender Punkt am aktuellen Stand — damit
// diese Ringe (die einzigen kräftig farbigen Elemente der App) lebendig statt
// starr wirken, auch ohne dass gerade etwas abgehakt wird.
export default function ProgressRing({ done, total, size = 76, stroke = 8, color = accent }) {
  const pct = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const dark = darken(color);
  const gradientId = useId();
  const glowId = useId();

  const angleDeg = pct * 360 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const dotX = cx + r * Math.cos(angleRad);
  const dotY = cy + r * Math.sin(angleRad);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={stroke * 0.45} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}22`} strokeWidth={stroke} />
      {pct > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={`url(#${glowId})`}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
        />
      )}
      {pct > 0 && <circle cx={dotX} cy={dotY} r={stroke * 0.65} fill={dark} className="mp-ring-dot" />}
      <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.24} fontWeight="800" fill={textMain}>
        {total > 0 ? `${Math.round(pct * 100)}%` : "—"}
      </text>
    </svg>
  );
}
