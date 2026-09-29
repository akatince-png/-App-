import React from "react";
import { useAppData } from "../context/AppDataContext";
import { ETAPPEN_NAME, WOCHEN, datumKurz } from "../utils/kernprogramm";
import { routineTagesStatus } from "../utils/routineStatus";
import { toLocalISODate } from "../utils/dates";

// Startseite (25.09., Vorschau freigegeben): wo stehe ich im AKA-Coaching?
// Einführung: "Woche 2 von 4 – Bewegung" mit dem, was neu dazukommt.
// Erhaltung: "Etappe 2 · Woche 6 von 8". Antippen öffnet die Übersicht.
export function EtappenBalken({ stand, hell = true }) {
  const aktuell = stand.woche;
  return (
    <div
      style={{ display: "flex", gap: 4, margin: "10px 0 6px" }}
      aria-hidden="true"
    >
      {[1, 2, 3, 4].map((w) => (
        <i
          key={w}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 4,
            background:
              w < aktuell
                ? "#5CC3A8"
                : w === aktuell
                  ? "var(--mp-accent)"
                  : hell
                    ? "color-mix(in srgb, #E4E6EE var(--mp-flaeche), var(--mp-karte))"
                    : "rgba(255,255,255,.22)",
          }}
        />
      ))}
    </div>
  );
}

// Routine-Start direkt auf der Karte (29.09., Nutzerin: „Ich finde die
// Stoppuhr nicht, das Konzept ist nicht wiederzuerkennen“): bis 14 Uhr die
// Morgen-, danach die Abendroutine. Ein Tipp startet den geführten Ablauf
// mit Stoppuhr; ist die Routine heute schon durch, steht dort ein Häkchen.
const ROUTINE_TEXT = { morgen: "Morgenroutine", abend: "Abendroutine" };
function aktuelleRoutine(jetzt = new Date()) {
  return jetzt.getHours() < 14 ? "morgen" : "abend";
}

function RoutineStart({ onRoutineStart }) {
  const {
    routineSchritte,
    routineDurchlaeufe,
    routineSchrittErledigt,
    routineEinstellungen,
  } = useAppData();
  if (!onRoutineStart) return null;
  const routine = aktuelleRoutine();
  const status = routineTagesStatus(routine, toLocalISODate(new Date()), {
    routineSchritte,
    routineDurchlaeufe,
    routineSchrittErledigt,
  });
  if (status.anzahlGesamt === 0) return null;
  const abendAb = routineEinstellungen?.abend?.startZeit?.slice(0, 5);
  if (status.abgeschlossen)
    return (
      <div
        data-routine-geschafft={routine}
        style={{
          marginTop: 12,
          padding: "11px 14px",
          borderRadius: 16,
          background:
            "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-rand-dunkel))",
          color:
            "color-mix(in srgb, #1F7A68 var(--mp-schrift), var(--mp-schrift-hell))",
          fontSize: 13.5,
          fontWeight: 800,
        }}
      >
        ✓ {ROUTINE_TEXT[routine]} heute geschafft
        {routine === "morgen"
          ? ` · Abendroutine ${abendAb ? `ab ${abendAb} Uhr` : "heute Abend"}`
          : ""}
      </div>
    );
  return (
    <button
      type="button"
      className="mp-tap"
      data-routine-start={routine}
      onClick={() => onRoutineStart(routine)}
      style={{
        width: "100%",
        marginTop: 12,
        minHeight: 50,
        border: "none",
        borderRadius: 16,
        background: "var(--mp-accent)",
        color: "#fff",
        fontSize: 15.5,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow:
          "0 6px 14px color-mix(in srgb, var(--mp-accent) 30%, transparent)",
      }}
    >
      ▶ {ROUTINE_TEXT[routine]} starten
      <span
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 600,
          opacity: 0.9,
          marginTop: 1,
        }}
      >
        {status.anzahlErledigt > 0
          ? `${status.anzahlErledigt} von ${status.anzahlGesamt} Schritten erledigt · `
          : `${status.anzahlGesamt} Schritte · `}
        mit Stoppuhr
      </span>
    </button>
  );
}

export default function KernprogrammKarte({ onOeffnen, onRoutineStart }) {
  const { kernStand: stand, trainingWochenplan = [] } = useAppData();
  if (!stand) return null;
  if (!stand.aktiv) {
    // Programm-Modul (26.09.): Teilnahme wartet, bis der Coach den Start festlegt.
    if (stand.wartet)
      return (
        <div style={{ ...karte, cursor: "default" }} data-kern-wartet>
          <div style={klein}>DEIN AKA-COACHING</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>
            🧭 Deine Einstellungsphase
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--mp-text-muted)",
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            Deinen Start legst du mit deinem Coach fest. Los geht&apos;s am
            Abend – mit deiner ersten Abendroutine.
          </div>
        </div>
      );
    if (stand.pausiert)
      return (
        <div style={{ ...karte, cursor: "default" }} data-kern-pausiert>
          <div style={klein}>DEIN AKA-COACHING</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>
            ⏸ Gerade pausiert
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--mp-text-muted)",
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            Kein Druck. Wenn es weitergeht, machst du genau da weiter, wo du
            aufgehört hast.
          </div>
        </div>
      );
    if (!stand.geplant) return null;
    return (
      <button
        type="button"
        className="mp-tap"
        onClick={onOeffnen}
        style={karte}
      >
        <div style={klein}>DEIN AKA-COACHING</div>
        <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>
          🧭 Startet am {datumKurz(stand.geplant.start)} abends
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--mp-text-muted)",
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          Los geht&apos;s mit deiner ersten Abendroutine. Woche 1:{" "}
          {WOCHEN[1].text}
        </div>
        <div
          style={{
            marginTop: 10,
            fontWeight: 800,
            fontSize: 13.5,
            color: "var(--mp-accent-text)",
          }}
        >
          Deine 8 Wochen ansehen ›
        </div>
      </button>
    );
  }
  const einfuehrung = !stand.erhaltung;
  const w = WOCHEN[stand.woche];
  const sportFehlt =
    stand.einfuehrungWoche >= 2 && trainingWochenplan.length === 0;
  return (
    <div style={{ ...karte, cursor: "default" }} data-kern-karte>
      <button
        type="button"
        className="mp-tap"
        onClick={onOeffnen}
        style={innen}
        aria-label="AKA-Kernprogramm öffnen"
        data-kern-woche={stand.gesamtWoche}
      >
        <div style={klein}>
          {einfuehrung
            ? `AKA-KERNPROGRAMM · WOCHE ${stand.woche} VON 4`
            : `ETAPPE ${stand.etappe.nummer} · ${ETAPPEN_NAME.erhaltung.toUpperCase()} · WOCHE ${stand.gesamtWoche} VON ${stand.etappe.nummer * 4}`}
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 17,
            marginTop: 8,
            letterSpacing: -0.2,
          }}
        >
          {stand.gespraechFaellig
            ? "💬 Gespräch mit deinem Coach steht an"
            : einfuehrung
              ? `${w.icon} Diese Woche: ${w.titel}`
              : "🔁 Dranbleiben – nichts Neues dazu"}
        </div>
        <EtappenBalken stand={stand} />
        <div
          style={{
            fontSize: 12.5,
            color: "var(--mp-text-muted)",
            lineHeight: 1.45,
          }}
        >
          {stand.gespraechFaellig
            ? `Etappe ${stand.etappe.nummer} endet ${datumKurz(stand.etappe.ende)}. Ihr schaut gemeinsam, was bleibt und was angepasst wird.`
            : einfuehrung
              ? w.text
              : "Alle Bausteine laufen weiter. Was nicht passt, stellst du mit deinem Coach um."}
        </div>
        <div
          style={{
            marginTop: 10,
            fontWeight: 800,
            fontSize: 13.5,
            color: "var(--mp-accent-text)",
          }}
        >
          {sportFehlt ? "🏋️ Sportart wählen ›" : "Übersicht ›"}
        </div>
      </button>
      {!stand.gespraechFaellig && (
        <RoutineStart onRoutineStart={onRoutineStart} />
      )}
    </div>
  );
}

// Design 2.0 (29.09., Nutzerin: „wirkt alt“): helle, ruhige Karte statt
// dunklem Block mit gelbem Knopf; Farbe nur im Etiketten-Chip und im Balken.
const karte = {
  width: "100%",
  textAlign: "left",
  display: "block",
  marginBottom: 14,
  borderRadius: 22,
  padding: 16,
  background: "var(--mp-karte)",
  color: "var(--mp-text)",
  border: "1px solid rgba(16, 24, 40, 0.05)",
  boxShadow: "var(--mp-schatten)",
  cursor: "pointer",
  fontFamily: "inherit",
};
const innen = {
  width: "100%",
  textAlign: "left",
  display: "block",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontFamily: "inherit",
};
const klein = {
  display: "inline-block",
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: 0.4,
  color: "var(--mp-accent-dark-text)",
  background: "var(--mp-accent-soft)",
  borderRadius: 99,
  padding: "3px 9px",
};
