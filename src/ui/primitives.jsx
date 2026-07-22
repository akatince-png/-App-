import React from "react";
import { accent, accentDark, accentSoft, blue, blueSoft, bg, card, cardBorder, danger, shadow, success, textMain, textMuted } from "./theme";
import { STEP_TITLES } from "../constants";

export function Shell({ children }) {
  return (
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
  );
}

export function Stepper({ step }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {STEP_TITLES.map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            background: i <= step ? accent : "#D9EEE7",
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

export function PrimaryButton({ children, onClick, disabled, variant = "accent" }) {
  const styles = {
    accent: { background: disabled ? "#B7D8D1" : accent, color: "#fff" },
    success: { background: disabled ? "#B7D8D1" : success, color: "#fff" },
    ghost: { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` },
  };
  return (
    <button
      className="mp-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: 52,
        padding: "14px 18px",
        borderRadius: 16,
        border: "none",
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export function CheckRow({ label, checked, onToggle }) {
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
        background: checked ? accentSoft : "#FAFBFA",
        cursor: "pointer",
        border: `1px solid ${checked ? accent : cardBorder}`,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: checked ? 600 : 500 }}>{label}</span>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `2px solid ${checked ? accent : "#C6CBCF"}`,
          background: checked ? accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {checked ? "✓" : ""}
      </div>
    </div>
  );
}

export function Pill({ label, selected, onClick }) {
  return (
    <button
      className="mp-tap"
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: 20,
        fontSize: 12.5,
        fontWeight: 600,
        minHeight: 38,
        border: `1px solid ${selected ? accent : cardBorder}`,
        background: selected ? accent : "#FAFBFA",
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

export function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      className="mp-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
}

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
    erledigt: { c: accentDark, bg: accentSoft, l: "Erledigt" },
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
