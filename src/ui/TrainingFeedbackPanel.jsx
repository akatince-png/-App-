import React, { useState } from "react";
import { Card, Label, Pill, PrimaryButton, TextArea, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { textMuted, danger } from "./theme";
import { TRAINING_ENERGIELEVEL_OPTIONEN, SCHMERZEN_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

// ---------------------------------------------------------------------------
// Nachbereitung: RPE/Kalorien/Energielevel/Schmerzen/Bemerkungen lassen sich
// erst NACH dem Training sinnvoll einschätzen — deshalb ein eigener, rein
// optionaler Schritt nach dem Speichern statt Pflichtfelder vorab. Aus
// TrainingView.jsx herausgelöst (13.09., Teil 60), da sowohl TrainingView
// selbst als auch das ebenfalls herausgelöste LiveWorkout.jsx sie brauchen.
// ---------------------------------------------------------------------------
export default function TrainingFeedbackPanel({ trainingId, onDone }) {
  const { trainingFeedbackSpeichern } = useAppData();
  const [rpe, setRpe] = useState("");
  const [kalorien, setKalorien] = useState("");
  const [energielevel, setEnergielevel] = useState("");
  const [schmerzen, setSchmerzen] = useState("");
  const [bemerkungen, setBemerkungen] = useState("");
  const [fehler, setFehler] = useState(null);
  const [speichertGerade, setSpeichertGerade] = useState(false);

  const speichern = async () => {
    setFehler(null);
    setSpeichertGerade(true);
    const result = await trainingFeedbackSpeichern(trainingId, { rpe, kalorien, energielevel, schmerzen, bemerkungen });
    setSpeichertGerade(false);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    onDone();
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, textAlign: "center" }}>Wie ist es gelaufen?</div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 12, textAlign: "center" }}>
        Optional — hilft dir, deinen Fortschritt nachzuvollziehen.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>RPE (1–10)</Label>
          <NumberWheelField value={rpe} onChange={setRpe} min={1} max={10} placeholder="7" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Kalorien</Label>
          <TextInput type="number" value={kalorien} onChange={setKalorien} placeholder="300" />
        </div>
      </div>
      <Label>Energielevel</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {TRAINING_ENERGIELEVEL_OPTIONEN.map((o) => (
          <Pill key={o} label={o} selected={energielevel === o} onClick={() => setEnergielevel(o)} />
        ))}
      </div>
      <Label>Schmerzen</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {SCHMERZEN_OPTIONEN.map((o) => (
          <Pill key={o} label={o} selected={schmerzen === o} onClick={() => setSchmerzen(o)} />
        ))}
      </div>
      <Label>Bemerkungen</Label>
      <TextArea value={bemerkungen} onChange={setBemerkungen} placeholder="Wie hat es sich angefühlt?" />
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={speichern} disabled={speichertGerade}>
            Speichern
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onDone} variant="ghost">
            Überspringen
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}
