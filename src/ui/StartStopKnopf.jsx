import React from "react";
import { useAppData } from "../context/AppDataContext";
import { plastikFarbe } from "./plastik";

// Ein Tipp startet, ein Tipp beendet (26.10., Nutzerin: „starten, und ab dem
// Zeitpunkt wird dokumentiert … beim Beenden die Endzeit, nicht manuell“).
// Für Matrix-Aufgaben und Termine im Bild-Tagesplan.
const stil = (farbe) => ({ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12, fontWeight: 800, ...plastikFarbe(farbe, "flach"), cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" });
const jetztUhr = () => new Date().toTimeString().slice(0, 5);

export function AufgabeStartStop({ aufgabe: a, farbe }) {
  const { matrixAufgabeSpeichern } = useAppData();
  if (a.gestartetAm)
    return (
      <button type="button" className="mp-tap" data-aufgabe-stop onClick={() => matrixAufgabeSpeichern?.({ ...a, erledigtAm: new Date().toISOString(), ausgefallen: false })} style={stil(farbe)}>
        ■ Beenden
      </button>
    );
  return (
    <button type="button" className="mp-tap" data-aufgabe-go onClick={() => matrixAufgabeSpeichern?.({ ...a, gestartetAm: new Date().toISOString() })} style={stil(farbe)}>
      ▶ Start
    </button>
  );
}

export function TerminStartStop({ eintrag, datum, rueckmeldung: r, farbe }) {
  const { alltagRueckmelden } = useAppData();
  if (r?.status === "wahrgenommen" && r.start && !r.ende)
    return (
      <button type="button" className="mp-tap" data-termin-stop onClick={() => alltagRueckmelden?.(eintrag.id, datum, { ...r, ende: jetztUhr() })} style={stil(farbe)}>
        ■ Beenden
      </button>
    );
  return (
    <button type="button" className="mp-tap" data-termin-go onClick={() => alltagRueckmelden?.(eintrag.id, datum, { status: "wahrgenommen", start: jetztUhr(), ende: null, notiz: r?.notiz || null })} style={stil(farbe)}>
      ▶ Start
    </button>
  );
}
