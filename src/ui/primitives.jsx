import React, { useState } from "react";
import { blue, blueSoft, bg, card, cardBorder, danger, shadow, success, successSoft, textMain, textMuted, aufhellen, hexZuRgba } from "./theme";
import { BereichColorProvider, useBereichColor } from "./BereichColorContext";

// `bereich` (optional, z. B. "training", "hydration" — Schlüssel aus
// KATEGORIE_META in utils/dayItems.js): färbt PrimaryButton/Pill/CheckRow/
// Stepper innerhalb dieses Screens automatisch in der Farbe des jeweiligen
// Lebensbereichs statt der generischen Marken-Akzentfarbe — ein Prop statt
// jeden einzelnen Button manuell einzufärben.
export function Shell({ children, bereich }) {
  return (
    <BereichColorProvider bereich={bereich}>
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          color: textMain,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: "flex",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
      </div>
    </BereichColorProvider>
  );
}

export function Stepper({ step, total }) {
  const { accent: bereichAccent } = useBereichColor();
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            background: i <= step ? bereichAccent : "#EBEBE8",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div
      className="mp-card"
      style={{
        background: card,
        border: `1px solid ${cardBorder}`,
        borderRadius: 24,
        padding: 22,
        boxShadow: shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Farbverlauf + farbiger Glow-Schatten + Press-Animation statt einer
// flachen Einfarb-Fläche (Nutzerinnen-Vorgabe, 28.07.: wirkte "flach,
// undynamisch" — Vorbild ist der Notfallmodus-Knopf auf Home, siehe
// ADHSModeToggle.jsx). Gilt automatisch für jede Bereichsfarbe aus
// KATEGORIE_META, nicht nur den generischen Akzent.
export function PrimaryButton({ children, onClick, disabled, variant = "accent", style }) {
  const { accent: bereichAccent } = useBereichColor();
  const [gedrueckt, setGedrueckt] = useState(false);
  const basisFarbe = variant === "success" ? success : bereichAccent;
  const styles = {
    accent: {
      background: disabled ? "#D8D8D3" : `linear-gradient(135deg, ${basisFarbe}, ${aufhellen(basisFarbe, 20)})`,
      color: "#fff",
      boxShadow: disabled ? "none" : `0 8px 20px ${hexZuRgba(basisFarbe, 0.32)}`,
    },
    success: {
      background: disabled ? "#D8D8D3" : `linear-gradient(135deg, ${basisFarbe}, ${aufhellen(basisFarbe, 20)})`,
      color: "#fff",
      boxShadow: disabled ? "none" : `0 8px 20px ${hexZuRgba(basisFarbe, 0.32)}`,
    },
    ghost: { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` },
  };
  return (
    <button
      type="button"
      className="mp-btn"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setGedrueckt(true)}
      onMouseUp={() => setGedrueckt(false)}
      onMouseLeave={() => setGedrueckt(false)}
      onTouchStart={() => setGedrueckt(true)}
      onTouchEnd={() => setGedrueckt(false)}
      style={{
        width: "100%",
        minHeight: 52,
        padding: "14px 18px",
        borderRadius: 16,
        border: "none",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: 0.2,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: gedrueckt && !disabled ? "scale(0.97)" : "scale(1)",
        transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms ease",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function CheckRow({ label, checked, onToggle }) {
  const { accent: bereichAccent, accentSoft: bereichAccentSoft } = useBereichColor();
  return (
    <div
      className="mp-tap"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 14px",
        borderRadius: 14,
        marginBottom: 8,
        minHeight: 48,
        background: checked ? bereichAccentSoft : "#FAFBFA",
        cursor: "pointer",
        border: `1px solid ${checked ? bereichAccent : cardBorder}`,
        transition: "background 150ms ease, border-color 150ms ease",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: checked ? 600 : 500 }}>{label}</span>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `2px solid ${checked ? bereichAccent : "#C6CBCF"}`,
          background: checked ? bereichAccent : "transparent",
          boxShadow: checked ? `0 3px 8px ${hexZuRgba(bereichAccent, 0.35)}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#fff",
          flexShrink: 0,
          transition: "background 150ms ease, box-shadow 150ms ease",
        }}
      >
        {checked ? "✓" : ""}
      </div>
    </div>
  );
}

export function Pill({ label, selected, onClick }) {
  const { accent: bereichAccent } = useBereichColor();
  return (
    <button
      type="button"
      className="mp-tap"
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: 20,
        fontSize: 12.5,
        fontWeight: 600,
        minHeight: 38,
        border: `1px solid ${selected ? bereichAccent : cardBorder}`,
        background: selected ? bereichAccent : "#FAFBFA",
        color: selected ? "#fff" : textMuted,
        cursor: "pointer",
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {label}
    </button>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: 12, color: textMuted, marginBottom: 6, marginTop: 14, fontWeight: 600 }}>{children}</div>
  );
}

export const TextInput = React.forwardRef(function TextInput({ value, onChange, placeholder, type = "text", onKeyPress }, ref) {
  return (
    <input
      ref={ref}
      className="mp-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: 46,
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${cardBorder}`,
        background: "#FAFBFA",
        color: textMain,
        fontSize: 14.5,
        outline: "none",
      }}
    />
  );
});

export function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      className="mp-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${cardBorder}`,
        background: "#FAFBFA",
        color: textMain,
        fontSize: 14.5,
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
      }}
    />
  );
}

export function StatusBadge({ status }) {
  const map = {
    erledigt: { c: success, bg: successSoft, l: "Erledigt" },
    geplant: { c: blue, bg: blueSoft, l: "Geplant" },
    verpasst: { c: danger, bg: "#F9E9E9", l: "Verpasst" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: s.bg, color: s.c, fontWeight: 700 }}>
      {s.l}
    </span>
  );
}
