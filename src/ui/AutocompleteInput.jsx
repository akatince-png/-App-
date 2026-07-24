import React, { useMemo, useState } from "react";
import { accentSoft, cardBorder, textMain } from "./theme";

// Freitextfeld mit Tipp-Vorschlägen aus einer festen Liste (z. B.
// Übungsnamen) — Vorschläge sind Hilfe, keine Pflicht: freie Eingabe
// bleibt jederzeit möglich, nichts wird gegen die Liste validiert.
export default function AutocompleteInput({ value, onChange, options, placeholder }) {
  const [fokussiert, setFokussiert] = useState(false);

  const treffer = useMemo(() => {
    const query = (value || "").trim().toLowerCase();
    if (!query) return options.slice(0, 8);
    return options.filter((o) => o.toLowerCase().includes(query)).slice(0, 8);
  }, [value, options]);

  const zeigeVorschlaege = fokussiert && treffer.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        className="mp-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFokussiert(true)}
        onBlur={() => setTimeout(() => setFokussiert(false), 150)}
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
      {zeigeVorschlaege && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 10,
            background: "#fff",
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {treffer.map((o) => (
            <div
              key={o}
              onMouseDown={() => onChange(o)}
              style={{
                padding: "10px 14px",
                fontSize: 13.5,
                color: textMain,
                cursor: "pointer",
                borderBottom: `1px solid ${cardBorder}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = accentSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
