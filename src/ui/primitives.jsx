import React from "react";
import { accent, accentSoft, blue, blueSoft, bg, card, cardBorder, danger, shadow, success, textMain, textMuted } from "./theme";
import { STEP_TITLES } from "../constants";

export function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, #EAF9F3 0%, ${bg} 220px)`,
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
      style={{
        background: card,
        border: `1px solid ${cardBorder}`,
        borderRadius: 18,
        padding: 20,
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
    accent: { background: disabled ? "#CDEAE3" : accent, color: "#fff" },
    success: { background: disabled ? "#CDEAE3" : success, color: "#fff" },
    ghost: { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "13px 16px",
        borderRadius: 12,
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
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 12px",
        borderRadius: 10,
        marginBottom: 6,
        background: checked ? accentSoft : "#FAFEFC",
        cursor: "pointer",
        border: `1px solid ${checked ? accent : "#EDF5F2"}`,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: checked ? 600 : 500 }}>{label}</span>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${checked ? accent : "#C7D8D2"}`,
          background: checked ? accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#fff",
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
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${selected ? accent : cardBorder}`,
        background: selected ? accent : "#FAFEFC",
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
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${cardBorder}`,
        background: "#FAFEFC",
        color: textMain,
        fontSize: 14,
        outline: "none",
      }}
    />
  );
}

export function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${cardBorder}`,
        background: "#FAFEFC",
        color: textMain,
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
      }}
    />
  );
}

export function StatusBadge({ status }) {
  const map = {
    erledigt: { c: success, bg: "#E5F8EE", l: "Erledigt" },
    geplant: { c: blue, bg: blueSoft, l: "Geplant" },
    verpasst: { c: danger, bg: "#FDE9EC", l: "Verpasst" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, background: s.bg, color: s.c, fontWeight: 700 }}>
      {s.l}
    </span>
  );
}
