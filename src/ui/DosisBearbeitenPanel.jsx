import React, { useState } from "react";
import { PrimaryButton } from "./primitives";
import DosierungFields from "./DosierungFields";
import GrundEingabe from "./GrundEingabe";
import { cardBorder } from "./theme";

// Geteiltes Inline-Bearbeiten-Panel für Peptid- und Medikamenten-Dosierung —
// gleiche Felder (DosierungFields), gleiches Toggle-dann-Formular-Muster,
// nur die Speicherfunktion unterscheidet sich je Kategorie (übergibt der
// Aufrufer via onSpeichern).
export default function DosisBearbeitenPanel({ dosierung, onSpeichern }) {
  const [entwurf, setEntwurf] = useState(dosierung);
  const [grund, setGrund] = useState("");

  const handleChange = (feld, val) =>
    setEntwurf((p) => (feld === "intervallPreset" ? { ...p, intervallTyp: "fixed", intervallDays: val } : { ...p, [feld]: val }));

  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
      <DosierungFields value={entwurf} onChange={handleChange} mengePlaceholder="z. B. 0,25 mg" />
      <GrundEingabe grund={grund} onChange={setGrund} />
      <div style={{ marginTop: 10 }}>
        <PrimaryButton
          onClick={() => {
            onSpeichern(entwurf, grund);
            setGrund("");
          }}
        >
          Speichern
        </PrimaryButton>
      </div>
    </div>
  );
}
