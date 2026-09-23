import React, { useState } from "react";
import { Label, Pill, PrimaryButton, TextArea } from "./primitives";
import { accentDark, accentSoft, cardBorder, textMuted } from "./theme";
import { NEBENWIRKUNGEN_OPTIONEN, VERTRAEGLICHKEIT_OPTIONEN, WIRKUNG_OPTIONEN } from "../constants";

// Ein-Tipp-Rückmeldung nach dem Abhaken (UX-Review 23.09.): Vorher öffnete
// "Bestätigen" im Tagesplan ein komplettes Formular (Verträglichkeit,
// Wirkung, acht Nebenwirkungen, Notizen) mit vorausgewähltem "Ja"/"Gut" —
// das widersprach dem Versprechen "einmal antippen und abgehakt" und
// verfälschte die Auswertung, weil die Vorauswahl ungeprüft mitgespeichert
// wurde. Jetzt: der Punkt ist mit dem ersten Tipp bereits erledigt (siehe
// TagesplanView.jsx), diese Karte fragt danach nur noch optional mit EINEM
// Tipp nach der Wirkung. Das ausführliche Formular gibt es weiterhin über
// "Details notieren" — nichts ist weggefallen, nur nichts mehr Pflicht.
const SCHNELL_WIRKUNG = [
  { wert: "Ja", label: "👍 Gespürt" },
  { wert: "Etwas", label: "🤏 Ein bisschen" },
  { wert: "Nein", label: "➖ Nichts gemerkt" },
];

const LEER = { vertraeglichkeit: "", wirkung: "", nebenwirkungen: [], notizen: "" };

export default function SchnellFeedback({ kategorie, istInjektion = false, onSpeichern, onSchliessen }) {
  const [details, setDetails] = useState(false);
  const [entwurf, setEntwurf] = useState(LEER);

  // Einstichstellen-Rötung ergibt nur bei Injektionen Sinn — bei Vitamin D
  // o. Ä. wirkte die Option eher verwirrend als hilfreich.
  const nebenwirkungen = istInjektion ? NEBENWIRKUNGEN_OPTIONEN : NEBENWIRKUNGEN_OPTIONEN.filter((n) => n !== "Rötung an Einstichstelle");
  const toggleNebenwirkung = (n) =>
    setEntwurf((p) => ({ ...p, nebenwirkungen: p.nebenwirkungen.includes(n) ? p.nebenwirkungen.filter((x) => x !== n) : [...p.nebenwirkungen, n] }));

  const linkStil = { border: "none", background: "transparent", padding: "6px 2px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };

  if (!details) {
    return (
      <div role="group" aria-label="Kurze Rückmeldung" style={{ marginTop: 12, padding: "12px 14px", borderRadius: 16, background: accentSoft, border: `1px solid ${cardBorder}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: accentDark, marginBottom: 8 }}>
          ✓ Erledigt! <span style={{ fontWeight: 600, color: textMuted }}>Wirkung bemerkt? (optional)</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {SCHNELL_WIRKUNG.map((w) => (
            <Pill key={w.wert} label={w.label} selected={false} onClick={() => onSpeichern({ ...LEER, wirkung: w.wert })} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 2 }}>
          <button type="button" className="mp-tap" onClick={() => setDetails(true)} style={{ ...linkStil, color: accentDark }}>
            Nebenwirkung / Details notieren
          </button>
          <button type="button" className="mp-tap" onClick={onSchliessen} style={{ ...linkStil, color: textMuted }}>
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: accentSoft, border: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{kategorie === "hormon" ? "Wie war die Einnahme?" : "Wie war's?"}</div>

      {kategorie === "hormon" && (
        <>
          <Label>Verträglichkeit</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {VERTRAEGLICHKEIT_OPTIONEN.map((v) => (
              <Pill key={v} label={v} selected={entwurf.vertraeglichkeit === v} onClick={() => setEntwurf((p) => ({ ...p, vertraeglichkeit: p.vertraeglichkeit === v ? "" : v }))} />
            ))}
          </div>
        </>
      )}

      <Label>Wirkung bemerkt?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {WIRKUNG_OPTIONEN.map((w) => (
          <Pill key={w} label={w} selected={entwurf.wirkung === w} onClick={() => setEntwurf((p) => ({ ...p, wirkung: p.wirkung === w ? "" : w }))} />
        ))}
      </div>

      <Label>Nebenwirkungen</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {nebenwirkungen.map((n) => (
          <Pill key={n} label={n} selected={entwurf.nebenwirkungen.includes(n)} onClick={() => toggleNebenwirkung(n)} />
        ))}
      </div>

      <Label>Notizen (optional)</Label>
      <TextArea value={entwurf.notizen} onChange={(v) => setEntwurf((p) => ({ ...p, notizen: v }))} placeholder="Hier kannst du alles aufschreiben..." />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onSchliessen} variant="ghost">
            Abbrechen
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={() => onSpeichern(entwurf)} variant="success">
            Speichern
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
