import React, { useState } from "react";
import PlastikSymbol from "./PlastikSymbol";
import SchnellIcon from "./SchnellIcon";
import { KATEGORIE_META, ROUTINE_META } from "../utils/dayItems";
import { istZuFrueh } from "../utils/fruehAbhaken";
import { plastikFarbe, plastikHell } from "./plastik";
import { fontHeading, textMuted } from "./theme";

// „Heute“ auf der Startseite (30.09., Nutzerin: „wir sehen unseren Tagesplan
// und können den abhaken auf dem Home-Bildschirm“): die nächsten offenen
// Punkte mit Bereichs-Symbol, ein Tipp zum Abhaken. Was sich nicht mit einem
// Tipp erledigen lässt (Training, Workflow, Zeitblock), öffnet den Tagesplan.
// Zu früh abgehakt → dieselbe Rückfrage wie im Tagesplan.
const SICHTBAR = 5;

export default function HeutePlanKarte({
  items = [],
  tagStr,
  direkt,
  onToggle,
  onOpenPlan,
  eingebettet = false,
  children = null,
}) {
  const [frage, setFrage] = useState(null);
  const offen = items
    .filter((i) => !i.done)
    .sort((a, b) => (a.uhrzeit || "99").localeCompare(b.uhrzeit || "99"));
  const erledigt = items.length - offen.length;
  const anteil = items.length ? erledigt / items.length : 0;

  const tippen = (item) => {
    if (direkt(item) && istZuFrueh(item, tagStr)) return setFrage(item.key);
    setFrage(null);
    onToggle(item);
  };

  return (
    <div
      data-heute-plan
      style={
        eingebettet
          ? { marginBottom: 6 }
          : {
              background: "var(--mp-karte)",
              borderRadius: 24,
              padding: 16,
              marginBottom: 16,
              boxShadow: "var(--mp-schatten)",
            }
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <PlastikSymbol icon="liste" farbe="#3F63D8" size={eingebettet ? 30 : 34} eckig />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontFamily: fontHeading, fontSize: 17, fontWeight: 800 }}
          >
            Heute
          </div>
          <div style={{ fontSize: 12.5, color: textMuted, fontWeight: 600 }}>
            {items.length
              ? `${erledigt} von ${items.length} erledigt`
              : "Für heute ist nichts geplant"}
          </div>
        </div>
        <button
          type="button"
          className="mp-tap"
          onClick={onOpenPlan}
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
          Tagesplan ›
        </button>
      </div>
      {children}
      {items.length > 0 && (
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background:
              "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-rand-dunkel))",
            overflow: "hidden",
            marginBottom: offen.length ? 10 : 0,
          }}
        >
          <div
            style={{
              width: `${Math.round(anteil * 100)}%`,
              height: "100%",
              borderRadius: 99,
              ...plastikFarbe("#2FA36B", "flach"),
              transition: "width .4s ease",
            }}
          />
        </div>
      )}
      {items.length > 0 && !offen.length && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            textAlign: "center",
            padding: "6px 0 2px",
          }}
        >
          Alles erledigt für heute ✓
        </div>
      )}
      {offen.slice(0, SICHTBAR).map((item) => {
        const meta =
          KATEGORIE_META[item.kategorie] ||
          ROUTINE_META[item.kategorie] ||
          KATEGORIE_META.gewohnheit;
        const farbe = item.farbe?.dot || meta.dot;
        const kannDirekt = direkt(item);
        return (
          <div
            key={item.key}
            data-heute-punkt={item.key}
            style={{
              padding: "7px 0",
              borderTop:
                "1px solid color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-rand-dunkel))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PlastikSymbol
                kategorie={item.kategorie}
                farbe={farbe}
                size={34}
                stufe="flach"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}
                >
                  {item.uhrzeit ? `${item.uhrzeit} · ` : ""}
                  {meta.label || ""}
                </div>
              </div>
              <button
                type="button"
                className="mp-tap"
                aria-label={
                  kannDirekt ? `${item.name} erledigt` : `${item.name} öffnen`
                }
                onClick={() => tippen(item)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 99,
                  border: "none",
                  flexShrink: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...plastikHell(),
                  color: farbe,
                  outline: `2px solid ${farbe}55`,
                  outlineOffset: -2,
                }}
              >
                <SchnellIcon
                  name={kannDirekt ? "haken" : "play"}
                  size={kannDirekt ? 20 : 15}
                  strich={2.6}
                />
              </button>
            </div>
            {frage === item.key && (
              <div
                data-frueh-frage
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 14,
                  background:
                    "color-mix(in srgb, #FFF6E0 var(--mp-flaeche), var(--mp-karte))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                „{item.name}“ ist erst um {item.uhrzeit} Uhr geplant. Sicher,
                dass du es schon erledigt hast?
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setFrage(null)}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: 99,
                      padding: "9px 10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      ...plastikHell(),
                    }}
                  >
                    Noch nicht
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFrage(null);
                      onToggle(item);
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: 99,
                      padding: "9px 10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      ...plastikFarbe(farbe, "flach"),
                    }}
                  >
                    Ja, erledigt
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {offen.length > SICHTBAR && (
        <button
          type="button"
          onClick={onOpenPlan}
          style={{
            border: "none",
            background: "transparent",
            color: textMuted,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "8px 0 0",
          }}
        >
          + {offen.length - SICHTBAR} weitere im Tagesplan
        </button>
      )}
    </div>
  );
}
