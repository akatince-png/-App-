import React, { useState } from "react";
import PlastikSymbol from "./PlastikSymbol";

// Aufklappbarer Abschnitt (04.10., Nutzerin: „die Coachee-Ansicht cleaner
// gestalten“): „Mehr“ war acht Bildschirme lang. Jetzt eine ruhige Liste mit
// Symbol, Titel und einer Zeile Inhalt – erst beim Antippen klappt der Inhalt auf.
export default function Abschnitt({
  id,
  icon,
  farbe,
  titel,
  sub,
  children,
  startOffen = false,
  warnung = false,
}) {
  const [offen, setOffen] = useState(startOffen);
  return (
    <div data-abschnitt={id} style={{ marginBottom: 10 }}>
      <button
        type="button"
        className="mp-tap"
        aria-expanded={offen}
        data-abschnitt-kopf={id}
        onClick={() => setOffen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
          border: warnung
            ? "1px solid color-mix(in srgb, #C24545 40%, transparent)"
            : "none",
          borderRadius: offen ? "20px 20px 8px 8px" : 20,
          padding: "12px 14px",
          background: "var(--mp-karte)",
          boxShadow: "var(--mp-schatten)",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
        }}
      >
        <PlastikSymbol
          icon={icon}
          farbe={farbe}
          size={36}
          eckig
          stufe="flach"
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 800,
              color: warnung ? "#C24545" : undefined,
            }}
          >
            {titel}
          </span>
          {sub && (
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--mp-text-muted)",
                marginTop: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sub}
            </span>
          )}
        </span>
        <span
          style={{
            transform: offen ? "rotate(90deg)" : "none",
            transition: "transform .2s",
            color: "var(--mp-text-muted)",
            display: "inline-flex",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </button>
      {offen && <div style={{ padding: "12px 2px 6px" }}>{children}</div>}
    </div>
  );
}

// Kleine Unterüberschrift innerhalb eines Abschnitts.
export function Unterpunkt({ children }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        margin: "4px 2px 8px",
        color: "var(--mp-text-muted)",
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {children}
    </div>
  );
}

// Zeile, die eine andere Seite öffnet – gleicher Look wie ein Abschnitt.
export function LinkZeile({ icon, farbe, titel, sub, onClick, data }) {
  return (
    <button
      type="button"
      className="mp-tap"
      onClick={onClick}
      {...(data ? { [`data-${data}`]: true } : {})}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        border: "none",
        borderRadius: 20,
        padding: "12px 14px",
        marginBottom: 10,
        background: "var(--mp-karte)",
        boxShadow: "var(--mp-schatten)",
        cursor: "pointer",
        fontFamily: "inherit",
        color: "inherit",
      }}
    >
      <PlastikSymbol icon={icon} farbe={farbe} size={36} eckig stufe="flach" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>
          {titel}
        </span>
        {sub && (
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--mp-text-muted)",
              marginTop: 1,
            }}
          >
            {sub}
          </span>
        )}
      </span>
      <span
        style={{ color: "var(--mp-text-muted)", fontSize: 20, lineHeight: 1 }}
      >
        ›
      </span>
    </button>
  );
}
