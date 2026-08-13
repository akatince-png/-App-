import React, { useMemo, useState } from "react";
import { accentSoft, cardBorder, textMain } from "./theme";

// Freitextfeld mit Tipp-Vorschlägen aus einer festen Liste (z. B.
// Übungsnamen) — Vorschläge sind Hilfe, keine Pflicht: freie Eingabe
// bleibt jederzeit möglich, nichts wird gegen die Liste validiert.
//
// mehrfach: für Felder, in denen mehrere Einträge kommagetrennt in einem
// Textfeld gesammelt werden (z. B. "Bankdrücken, Klimmzüge, ..." — siehe
// WochenplanEditor.jsx). Vorschläge beziehen sich dann nur auf das gerade
// getippte letzte Segment nach dem letzten Komma; eine Auswahl ersetzt nur
// dieses Segment und hängt ", " an, damit direkt der nächste Eintrag
// weitergetippt werden kann, statt die bisherige Liste zu überschreiben.
export default function AutocompleteInput({ value, onChange, options, placeholder, mehrfach = false }) {
  const [fokussiert, setFokussiert] = useState(false);

  const { praefix, aktuellesSegment } = useMemo(() => {
    if (!mehrfach) return { praefix: "", aktuellesSegment: value || "" };
    const teile = (value || "").split(",");
    const letztes = teile[teile.length - 1];
    const davor = teile.slice(0, -1).join(",");
    return { praefix: davor ? `${davor}, ` : "", aktuellesSegment: letztes.trimStart() };
  }, [value, mehrfach]);

  const treffer = useMemo(() => {
    const query = aktuellesSegment.trim().toLowerCase();
    if (!query) return options.slice(0, 8);
    return options.filter((o) => o.toLowerCase().includes(query)).slice(0, 8);
  }, [aktuellesSegment, options]);

  const auswaehlen = (o) => onChange(mehrfach ? `${praefix}${o}, ` : o);

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
              onMouseDown={() => auswaehlen(o)}
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
