import React from "react";
import { Card, Label, Pill, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { useAppData } from "../context/AppDataContext";

// "Persönliche Daten"-Karte, geteilt zwischen ProfilTab (laufende Pflege)
// und dem "Profil & Ausgangslage"-Schritt im Onboarding (Ersteingabe) — siehe
// LaborwerteFelder für dasselbe Muster.
export default function PersoenlicheDatenCard() {
  const { personalData, setPersonal } = useAppData();

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Persönliche Daten</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Geschlecht</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["Weiblich", "Männlich", "Divers"].map((g) => (
            <Pill key={g} label={g} selected={personalData.geschlecht === g} onClick={() => setPersonal("geschlecht", g)} />
          ))}
        </div>
        <Label>Geburtsdatum</Label>
        <TextInput type="date" value={personalData.geburtsdatum} onChange={(v) => setPersonal("geburtsdatum", v)} />
        <Label>Größe (cm)</Label>
        <NumberWheelField value={personalData.groesse} onChange={(v) => setPersonal("groesse", v)} min={100} max={220} placeholder="175" />
        <Label>Gewicht Start (kg)</Label>
        <TextInput type="number" value={personalData.gewichtStart} onChange={(v) => setPersonal("gewichtStart", v)} placeholder="85" />
      </Card>
    </>
  );
}
