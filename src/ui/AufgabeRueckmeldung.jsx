import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { aufMorgen, inDenPool } from "../utils/tagesabschluss";
import { aufgabeZeitText, uhr } from "../utils/termin";

// Aufgabe aus der Matrix im Tagesplan (26.10., Nutzerin: „ganz normal
// abhaken, bestätigen, ob es ausgefallen ist … dokumentieren, wann ich es
// gestartet und beendet habe, egal ob es sich nach der geplanten Zeit
// richtet“). 26.10. mittags: Start und Ende per Tipp mit der echten Uhrzeit
// (Nutzerin: „nicht nur manuell eingeben“); Zeiten nur bei Bedarf ändern.
const knopf = (farbe, aktiv = true) => ({ flex: 1, border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: aktiv ? farbe : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: aktiv ? "#fff" : "var(--mp-text)" });
const feld = { border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "7px 9px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit", width: 110 };

const jetztUhr = () => new Date().toTimeString().slice(0, 5);
// Uhrzeit „HH:MM“ am Tag `datum` als ISO-Zeitpunkt.
const zuIso = (datum, hhmm) => (hhmm ? new Date(`${datum}T${hhmm}:00`).toISOString() : null);

export default function AufgabeRueckmeldung({ aufgabe: a, datum, onFertig }) {
  const { matrixAufgabeSpeichern } = useAppData();
  const [modus, setModus] = useState(null);
  const [start, setStart] = useState(uhr(a.gestartetAm) || a.uhrzeit || "");
  const [ende, setEnde] = useState(uhr(a.erledigtAm) || jetztUhr());
  const [fehler, setFehler] = useState(null);
  const speichern = async (neu) => {
    setFehler(null);
    const r = await matrixAufgabeSpeichern?.(neu);
    if (r?.ok === false) return setFehler(r.error);
    onFertig?.();
  };

  if (a.erledigtAm && modus !== "erledigt") {
    return (
      <div data-aufgabe-rueckmeldung style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{aufgabeZeitText(a)}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!a.ausgefallen && (
            <button type="button" onClick={() => setModus("erledigt")} style={{ ...knopf("", false), flex: "0 0 auto", padding: "9px 12px" }}>
              🕐 Zeiten ändern
            </button>
          )}
          <button type="button" onClick={() => speichern({ ...a, erledigtAm: null, ausgefallen: false })} style={{ ...knopf("", false), flex: "0 0 auto", padding: "9px 12px" }}>
            ↩︎ Zurücknehmen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-aufgabe-rueckmeldung style={{ textAlign: "left" }}>
      {!modus && !a.gestartetAm && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" data-aufgabe-start onClick={() => speichern({ ...a, gestartetAm: new Date().toISOString() })} style={knopf("var(--mp-accent)")}>
            ▶ Jetzt starten
          </button>
          <button type="button" data-aufgabe-erledigt onClick={() => setModus("erledigt")} style={knopf("#2E9C6E")}>
            ✓ Schon erledigt
          </button>
          <button type="button" data-aufgabe-faellt-aus onClick={() => setModus("aus")} style={knopf("#8A90A6")}>
            ✕ Fällt aus
          </button>
        </div>
      )}
      {!modus && a.gestartetAm && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>▶ Läuft seit {uhr(a.gestartetAm)} Uhr</div>
          <button type="button" data-aufgabe-beenden onClick={() => speichern({ ...a, erledigtAm: new Date().toISOString(), ausgefallen: false })} style={knopf("#2E9C6E")}>
            ■ Jetzt beenden
          </button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" data-aufgabe-erledigt onClick={() => setModus("erledigt")} style={{ ...knopf("", false), flex: "0 0 auto", padding: "8px 12px" }}>
              🕐 Zeiten ändern
            </button>
            <button type="button" onClick={() => speichern({ ...a, gestartetAm: null })} style={{ ...knopf("", false), flex: "0 0 auto", padding: "8px 12px" }}>
              ↩︎ Start zurücknehmen
            </button>
          </div>
        </div>
      )}
      {modus === "erledigt" && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              Begonnen um
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Begonnen um" style={feld} />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              Fertig um
              <input type="time" value={ende} onChange={(e) => setEnde(e.target.value)} aria-label="Fertig um" style={feld} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" data-aufgabe-speichern onClick={() => speichern({ ...a, gestartetAm: zuIso(datum, start), erledigtAm: zuIso(datum, ende) || new Date().toISOString(), ausgefallen: false })} style={knopf("#2E9C6E")}>
              ✓ Speichern
            </button>
            <button type="button" onClick={() => setModus(null)} style={{ ...knopf("", false), flex: "0 0 auto", padding: "10px 12px" }}>
              Zurück
            </button>
          </div>
        </div>
      )}
      {modus === "aus" && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Was passiert damit?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => speichern({ ...aufMorgen(a, new Date(`${datum}T12:00:00`)), gestartetAm: null })} style={knopf("var(--mp-accent)")}>
              → Morgen
            </button>
            <button type="button" onClick={() => speichern({ ...inDenPool(a), gestartetAm: null })} style={knopf("#E0A21B")}>
              ⏸ Später
            </button>
            <button type="button" data-aufgabe-ausgefallen onClick={() => speichern({ ...a, ausgefallen: true, erledigtAm: new Date().toISOString(), mitAm: a.mitAm })} style={knopf("#8A90A6")}>
              ✕ Entfällt ganz
            </button>
          </div>
          <button type="button" onClick={() => setModus(null)} style={{ border: "none", background: "transparent", padding: 0, fontSize: 12.5, fontWeight: 700, color: "var(--mp-text-muted)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            ‹ Zurück
          </button>
        </div>
      )}
      {fehler && <div role="alert" style={{ fontSize: 12.5, color: "#C0392B", marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
