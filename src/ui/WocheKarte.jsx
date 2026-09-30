import React from "react";
import PlastikSymbol from "./PlastikSymbol";
import SchnellIcon from "./SchnellIcon";
import { plastikFarbe, plastikHell } from "./plastik";
import { fontHeading, textMuted } from "./theme";
import { sameDay } from "../utils/dates";

// Wochen-Kalender auf der Startseite (30.09., Nutzerin: „einen Kalender auf
// dem Hauptmenü, damit wir direkt in unsere Woche reingucken können“):
// Mo–So nebeneinander, je Tag farbige Streifen für Geplantes und gepunktete
// für spontan Passiertes. Tippen öffnet den Kalender.
const WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_STREIFEN = 6;

export default function WocheKarte({
  tage = [],
  heute = new Date(),
  onOeffnen,
}) {
  const heuteTag = tage.find((t) => sameDay(t.datum, heute));
  const geplant = heuteTag
    ? heuteTag.bloecke.filter((b) => !b.ereignis).length
    : 0;
  const spontan = heuteTag
    ? heuteTag.bloecke.filter((b) => b.ereignis).length
    : 0;
  return (
    <div
      data-woche-karte
      style={{
        background: "var(--mp-karte)",
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        boxShadow: "var(--mp-schatten)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <PlastikSymbol icon="kalender" farbe="#7A63B0" size={34} eckig />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontFamily: fontHeading, fontSize: 17, fontWeight: 800 }}
          >
            Deine Woche
          </div>
          <div style={{ fontSize: 12.5, color: textMuted, fontWeight: 600 }}>
            Heute {geplant} geplant
            {spontan ? ` · ${spontan} spontan festgehalten` : ""}
          </div>
        </div>
        <button
          type="button"
          className="mp-tap"
          onClick={onOeffnen}
          style={{
            border: "none",
            borderRadius: 99,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            ...plastikHell(),
          }}
        >
          Kalender ›
        </button>
      </div>
      <button
        type="button"
        onClick={onOeffnen}
        aria-label="Woche im Kalender öffnen"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 5,
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
        }}
      >
        {tage.map((t, i) => {
          const istHeute = sameDay(t.datum, heute);
          const streifen = t.bloecke.slice(0, MAX_STREIFEN);
          return (
            <div
              key={i}
              data-woche-tag={istHeute ? "heute" : undefined}
              style={{
                borderRadius: 16,
                padding: "7px 3px 8px",
                minHeight: 118,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: istHeute
                  ? "color-mix(in srgb, #EEF1FF var(--mp-flaeche), var(--mp-rand-dunkel))"
                  : "transparent",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: textMuted }}>
                {WT[i]}
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 99,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13.5,
                  fontWeight: 800,
                  marginBottom: 3,
                  ...(istHeute ? plastikFarbe("#3F63D8", "flach") : {}),
                }}
              >
                {t.datum.getDate()}
              </span>
              {streifen.map((b) => (
                <span
                  key={b.key}
                  title={b.titel}
                  style={{
                    width: "100%",
                    height: 7,
                    borderRadius: 99,
                    background: b.ereignis ? "transparent" : b.farbe?.dot,
                    border: b.ereignis
                      ? `1.5px dashed ${b.farbe?.dot}`
                      : "none",
                    opacity: b.done && !b.ereignis ? 0.4 : 1,
                    boxSizing: "border-box",
                  }}
                />
              ))}
              {t.bloecke.length > MAX_STREIFEN && (
                <span
                  style={{ fontSize: 10, fontWeight: 800, color: textMuted }}
                >
                  +{t.bloecke.length - MAX_STREIFEN}
                </span>
              )}
            </div>
          );
        })}
      </button>
      {heuteTag && spontan > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
        >
          {heuteTag.bloecke
            .filter((b) => b.ereignis)
            .slice(-4)
            .map((b) => (
              <span
                key={b.key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 99,
                  background: b.farbe?.bg,
                  color: b.farbe?.text,
                }}
              >
                <SchnellIcon name={b.symbol} size={12} strich={2.4} />
                {String(Math.floor(b.start / 60)).padStart(2, "0")}:
                {String(b.start % 60).padStart(2, "0")} {b.titel}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
