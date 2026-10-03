import React, { useMemo } from "react";
import WocheKarte from "./WocheKarte";
import PlastikSymbol from "./PlastikSymbol";
import SchnellIcon from "./SchnellIcon";
import { plastikFarbe, plastikHell } from "./plastik";
import { addDays, sameDay } from "../utils/dates";
import { monatsRaster } from "../utils/kalender";
import { bereichSymbol } from "../utils/bereichSymbol";

// Kalender im Überblick (30.09., Nutzerin: „die Wochenansicht darf unten
// erscheinen, je nach Tag, Woche, Monat oder Gesamt, wenn ich ‚Bereiche
// einzeln ansehen‘ anklicke – aber nicht so groß oben“). Tag = Ablauf mit
// Uhrzeiten, Woche = Mo–So, Monat = Monatsraster, Gesamt = Hinweis + Kalender.
const zeit = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function KalenderKnopf({ onOeffnen, text = "Ganzer Kalender ›" }) {
  return (
    <button
      type="button"
      className="mp-tap"
      onClick={onOeffnen}
      style={{
        display: "block",
        margin: "10px auto 0",
        border: "none",
        borderRadius: 99,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "inherit",
        ...plastikHell(),
      }}
    >
      {text}
    </button>
  );
}

function TagAblauf({ bloecke, onOeffnen }) {
  return (
    <div data-kalender-tag style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>
        Heute im Ablauf
      </div>
      {!bloecke.length && (
        <div style={{ fontSize: 12.5, opacity: 0.75 }}>
          Heute steht nichts mit Uhrzeit an.
        </div>
      )}
      {bloecke.map((b) => (
        <div
          key={b.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 0",
            opacity: b.done && !b.ereignis ? 0.55 : 1,
          }}
        >
          <span
            style={{ width: 40, fontSize: 12, fontWeight: 800, opacity: 0.8 }}
          >
            {zeit(b.start)}
          </span>
          <PlastikSymbol
            icon={
              b.symbol ||
              bereichSymbol(
                b.art === "routine"
                  ? b.titel.startsWith("Abend")
                    ? "abendroutine"
                    : "morgenroutine"
                  : b.art,
              )
            }
            farbe={b.farbe?.dot || "#8A90A6"}
            size={22}
            stufe="flach"
          />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {b.titel}
            {b.ereignis ? (
              <span style={{ fontWeight: 600, opacity: 0.7 }}> · spontan</span>
            ) : b.done ? (
              " ✓"
            ) : (
              ""
            )}
          </span>
        </div>
      ))}
      <KalenderKnopf onOeffnen={onOeffnen} text="Tag im Kalender ›" />
    </div>
  );
}

function MonatRaster({ heute, bloeckeFuer, onOeffnen }) {
  const wochen = useMemo(
    () => monatsRaster(heute.getFullYear(), heute.getMonth()),
    [heute],
  );
  return (
    <div data-kalender-monat style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>
        {heute.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 3,
          fontSize: 10.5,
          fontWeight: 700,
          opacity: 0.7,
          textAlign: "center",
          marginBottom: 3,
        }}
      >
        {WT.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      {wochen.map((woche, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 3,
            marginBottom: 3,
          }}
        >
          {woche.map((d, j) => {
            if (!d) return <span key={j} />;
            const bl = bloeckeFuer(d);
            const spontan = bl.filter((b) => b.ereignis).length;
            const istHeute = sameDay(d, heute);
            return (
              <span
                key={j}
                style={{
                  borderRadius: 10,
                  padding: "4px 0 5px",
                  textAlign: "center",
                  background: "rgba(var(--gk-rgb, 20, 30, 60), 0.06)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: 22,
                    height: 22,
                    borderRadius: 99,
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 800,
                    ...(istHeute ? plastikFarbe("#3F63D8", "flach") : {}),
                  }}
                >
                  {d.getDate()}
                </span>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    marginTop: 2,
                    minHeight: 5,
                  }}
                >
                  {bl
                    .filter((b) => !b.ereignis)
                    .slice(0, 3)
                    .map((b) => (
                      <i
                        key={b.key}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 9,
                          background: b.farbe?.dot,
                        }}
                      />
                    ))}
                  {spontan > 0 && (
                    <i
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 9,
                        border: "1px dashed currentColor",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </span>
              </span>
            );
          })}
        </div>
      ))}
      <KalenderKnopf onOeffnen={onOeffnen} />
    </div>
  );
}

export default function ZeitraumKalender({
  zeitraum,
  bloeckeFuer,
  heute = new Date(),
  onOeffnen,
}) {
  const tage = useMemo(() => {
    if (zeitraum !== "woche") return [];
    const montag = addDays(
      new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()),
      -((heute.getDay() + 6) % 7),
    );
    return Array.from({ length: 7 }, (_, i) => ({
      datum: addDays(montag, i),
      bloecke: bloeckeFuer(addDays(montag, i)),
    }));
  }, [zeitraum, heute, bloeckeFuer]);
  if (zeitraum === "tag")
    return <TagAblauf bloecke={bloeckeFuer(heute)} onOeffnen={onOeffnen} />;
  if (zeitraum === "woche")
    return (
      <WocheKarte tage={tage} heute={heute} onOeffnen={onOeffnen} eingebettet />
    );
  if (zeitraum === "monat")
    return (
      <MonatRaster
        heute={heute}
        bloeckeFuer={bloeckeFuer}
        onOeffnen={onOeffnen}
      />
    );
  return (
    <div
      style={{
        marginTop: 10,
        fontSize: 12.5,
        opacity: 0.85,
        textAlign: "center",
      }}
    >
      <SchnellIcon name="kalender" size={18} />
      <div style={{ marginTop: 4 }}>
        Alles seit deinem Start findest du im Kalender und im Verlauf.
      </div>
      <KalenderKnopf onOeffnen={onOeffnen} />
    </div>
  );
}
