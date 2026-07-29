import React, { useState } from "react";
import { Label, PrimaryButton, TextInput } from "./primitives";
import ErinnerungField from "./ErinnerungField";
import TimeWheelField from "./TimeWheelField";
import { danger } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/translate";

// Ältere gespeicherte Erinnerungen kannten "zeiten" noch als reine
// Uhrzeit-Strings ohne Menge — hier auf das neue {zeit, menge, startDatum}-
// Format heben, damit bereits gespeicherte Profile nicht abstürzen.
const normalisiereZeiten = (zeiten) =>
  Array.isArray(zeiten) ? zeiten.map((z) => (typeof z === "string" ? { zeit: z, menge: "", startDatum: "" } : z)) : [];

// Erinnerungszeiten-Liste: eigene Liste konkreter Uhrzeiten (statt nur eines
// Ja/Nein-Schalters wie bei den Dosierungs-Kategorien), da der serverseitige
// Erinnerungs-Versand (send-due-reminders) genau diese Zeiten abfragt.
// Ursprünglich nur für Hydration gebaut, jetzt verallgemeinert (29.07.) für
// Tageslicht/Schlaf — Kategorien ohne feste Dosierungs-/Wochenplan-Uhrzeit,
// bei denen die Person die Erinnerungszeit(en) frei selbst festlegt.
// Jede Gabe hat ein Startdatum dabei — leer heißt "läuft schon ab heute".
// Geteilt zwischen dem jeweiligen Onboarding-Schritt (Ersteingabe) und der
// laufenden Pflege in der Bereichs-Ansicht selbst.
//
// Props:
// - kategorie: Schlüssel in `erinnerungen` (z. B. "hydration", "tageslicht", "schlaf")
// - labelKey: i18n-Key für die Beschriftung der Liste
// - mengeLabel: optional — Platzhalter/Einheit für ein zusätzliches
//   Mengenfeld (z. B. "ml" bei Hydration); weggelassen bei Kategorien ohne
//   sinnvolle Menge (Tageslicht, Schlaf)
// - mengeStandard: Startwert fürs Mengenfeld
// - zeitStandard: Startwert für eine neue Uhrzeit
export default function ZeitErinnerungenCard({ kategorie, labelKey, mengeLabel, mengeStandard = "", zeitStandard = "12:00" }) {
  const { erinnerungen, setErinnerung } = useAppData();
  const { t } = useT();
  const [zeiten, setZeiten] = useState(() => normalisiereZeiten(erinnerungen?.[kategorie]?.zeiten));
  const [neueZeit, setNeueZeit] = useState(zeitStandard);
  const [neueMenge, setNeueMenge] = useState(mengeStandard);
  const [neuesDatum, setNeuesDatum] = useState("");

  const handleErinnerungChange = (v) => {
    setErinnerung(kategorie, v ? { aktiv: true, zeiten } : false);
  };

  const zeitHinzufuegen = () => {
    if (!neueZeit) return;
    const eintrag = { zeit: neueZeit, startDatum: neuesDatum };
    if (mengeLabel) eintrag.menge = neueMenge;
    const next = [...zeiten, eintrag].sort((a, b) => a.zeit.localeCompare(b.zeit));
    setZeiten(next);
    setErinnerung(kategorie, { aktiv: true, zeiten: next });
    setNeueZeit(zeitStandard);
    setNeueMenge(mengeStandard);
    setNeuesDatum("");
  };
  const zeitFeldAendern = (i, feld, val) => {
    const next = zeiten.map((e, idx) => (idx === i ? { ...e, [feld]: val } : e));
    setZeiten(next);
    setErinnerung(kategorie, { aktiv: true, zeiten: next });
  };
  const zeitEntfernen = (i) => {
    const next = zeiten.filter((_, idx) => idx !== i);
    setZeiten(next);
    setErinnerung(kategorie, { aktiv: true, zeiten: next });
  };

  return (
    <>
      <ErinnerungField value={erinnerungen[kategorie]} onChange={handleErinnerungChange} />

      {erinnerungen[kategorie] && (
        <div style={{ marginTop: 12 }}>
          <Label>{t(labelKey)}</Label>
          {zeiten.map((eintrag, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1.2 }}>
                <TimeWheelField value={eintrag.zeit} onChange={(v) => zeitFeldAendern(i, "zeit", v)} />
              </div>
              {mengeLabel && (
                <div style={{ width: 64 }}>
                  <TextInput type="number" value={eintrag.menge} onChange={(v) => zeitFeldAendern(i, "menge", v)} placeholder={mengeLabel} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <TextInput type="date" value={eintrag.startDatum || ""} onChange={(v) => zeitFeldAendern(i, "startDatum", v)} />
              </div>
              <button
                type="button"
                onClick={() => zeitEntfernen(i)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1.2 }}>
              <TimeWheelField value={neueZeit} onChange={setNeueZeit} />
            </div>
            {mengeLabel && (
              <div style={{ width: 64 }}>
                <TextInput type="number" value={neueMenge} onChange={setNeueMenge} placeholder={mengeLabel} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <TextInput type="date" value={neuesDatum} onChange={setNeuesDatum} />
            </div>
            <div style={{ width: 22 }} />
          </div>
          <PrimaryButton onClick={zeitHinzufuegen}>Speichern</PrimaryButton>
        </div>
      )}
    </>
  );
}
