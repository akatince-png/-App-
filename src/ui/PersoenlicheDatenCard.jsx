import React from "react";
import { Card, Label, Pill, TextInput } from "./primitives";
import NumberWheelField from "./NumberWheelField";
import { useAppData } from "../context/AppDataContext";
import { useFrischWert } from "./useFrischWert";

// "Persönliche Daten"-Karte, geteilt zwischen ProfilTab (laufende Pflege)
// und dem "Profil & Ausgangslage"-Schritt im Onboarding (Ersteingabe) — siehe
// LaborwerteFelder für dasselbe Muster (useFrischWert.js).
export default function PersoenlicheDatenCard({ frisch = false }) {
  const { personalData, setPersonal } = useAppData();
  const [anzeige, lokalAendern] = useFrischWert(personalData, frisch, {
    geschlecht: "",
    geburtsdatum: "",
    groesse: "",
    gewichtStart: "",
  });

  const aendern = (feld, val) => {
    lokalAendern((prev) => ({ ...prev, [feld]: val }));
    setPersonal(feld, val);
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Persönliche Daten</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Geschlecht</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["Weiblich", "Männlich", "Divers"].map((g) => (
            <Pill key={g} label={g} selected={anzeige.geschlecht === g} onClick={() => aendern("geschlecht", g)} />
          ))}
        </div>
        <Label>Geburtsdatum</Label>
        <TextInput type="date" value={anzeige.geburtsdatum} onChange={(v) => aendern("geburtsdatum", v)} />
        <Label>Größe (cm)</Label>
        <NumberWheelField value={anzeige.groesse} onChange={(v) => aendern("groesse", v)} min={100} max={220} placeholder="175" />
        <Label>Gewicht Start (kg)</Label>
        <TextInput type="number" value={anzeige.gewichtStart} onChange={(v) => aendern("gewichtStart", v)} placeholder="85" />
      </Card>
    </>
  );
}
