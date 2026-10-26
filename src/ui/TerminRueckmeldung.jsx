import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";

// Termin rückmelden (26.10., Nutzerin: „Termin wahrgenommen, bis wann hat er
// gedauert … oder abgesagt/ausgefallen – kleinteilig dokumentieren“).
// Im Bild-Tagesplan und in den Kalender-Details.
const knopf = (farbe, aktiv) => ({ flex: 1, border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: aktiv ? farbe : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: aktiv ? "#fff" : "var(--mp-text)" });
const feld = { border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "7px 9px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };

export default function TerminRueckmeldung({ eintrag, datum, onFertig }) {
  const { alltagErledigt = {}, alltagRueckmelden } = useAppData();
  const jetzt = alltagErledigt[`${eintrag.id}|${datum}`] || null;
  const [status, setStatus] = useState(jetzt?.status || null);
  const [ende, setEnde] = useState(jetzt?.ende || eintrag.ende || "");
  const [notiz, setNotiz] = useState(jetzt?.notiz || "");
  const [fehler, setFehler] = useState(null);

  const speichern = async (r) => {
    setFehler(null);
    const ergebnis = await alltagRueckmelden?.(eintrag.id, datum, r);
    if (ergebnis?.ok === false) return setFehler(ergebnis.error);
    onFertig?.();
  };

  return (
    <div data-termin-rueckmeldung style={{ textAlign: "left" }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Wie lief der Termin?</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" aria-pressed={status === "wahrgenommen"} onClick={() => setStatus("wahrgenommen")} style={knopf("#2E9C6E", status === "wahrgenommen")}>
          ✓ Wahrgenommen
        </button>
        <button type="button" aria-pressed={status === "ausgefallen"} onClick={() => setStatus("ausgefallen")} style={knopf("#8A90A6", status === "ausgefallen")}>
          ✕ Abgesagt / ausgefallen
        </button>
      </div>
      {status && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {status === "wahrgenommen" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              Gedauert bis
              <input type="time" value={ende} onChange={(e) => setEnde(e.target.value)} aria-label="Gedauert bis" style={{ ...feld, width: 110 }} />
            </label>
          )}
          <input value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder={status === "ausgefallen" ? "Warum? (optional)" : "Notiz, z. B. wie es war (optional)"} aria-label="Notiz zum Termin" style={feld} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" data-rueckmeldung-speichern onClick={() => speichern({ status, ende: status === "wahrgenommen" ? ende : null, notiz })} style={knopf("var(--mp-accent)", true)}>
              Speichern
            </button>
            {jetzt && (
              <button type="button" onClick={() => speichern(null)} style={{ ...knopf("", false), flex: "0 0 auto", padding: "10px 12px" }}>
                ↩︎ Zurücknehmen
              </button>
            )}
          </div>
        </div>
      )}
      {fehler && <div role="alert" style={{ fontSize: 12.5, color: "#C0392B", marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
