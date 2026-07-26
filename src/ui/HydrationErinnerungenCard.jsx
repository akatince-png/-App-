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

// Hydration-Erinnerungszeiten: eigene Liste konkreter Uhrzeit+Menge-Gaben
// (statt nur eines Ja/Nein-Schalters wie bei den anderen Kategorien), da der
// serverseitige Erinnerungs-Versand (send-due-reminders) genau diese Zeiten
// abfragt. Jede Gabe hat ein Datum dabei — leer heißt "läuft schon ab heute".
// Geteilt zwischen dem Hydration-Onboarding-Schritt (Ersteingabe) und
// HydrationView (laufende Pflege).
export default function HydrationErinnerungenCard() {
  const { erinnerungen, setErinnerung } = useAppData();
  const { t } = useT();
  const [zeiten, setZeiten] = useState(() => normalisiereZeiten(erinnerungen?.hydration?.zeiten));
  const [neueZeit, setNeueZeit] = useState("12:00");
  const [neueMenge, setNeueMenge] = useState("300");
  const [neuesDatum, setNeuesDatum] = useState("");

  const handleErinnerungChange = (v) => {
    setErinnerung("hydration", v ? { aktiv: true, zeiten } : false);
  };

  const zeitHinzufuegen = () => {
    if (!neueZeit) return;
    const next = [...zeiten, { zeit: neueZeit, menge: neueMenge, startDatum: neuesDatum }].sort((a, b) => a.zeit.localeCompare(b.zeit));
    setZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
    setNeueZeit("12:00");
    setNeueMenge("300");
    setNeuesDatum("");
  };
  const zeitFeldAendern = (i, feld, val) => {
    const next = zeiten.map((e, idx) => (idx === i ? { ...e, [feld]: val } : e));
    setZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
  };
  const zeitEntfernen = (i) => {
    const next = zeiten.filter((_, idx) => idx !== i);
    setZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
  };

  return (
    <>
      <ErinnerungField value={erinnerungen.hydration} onChange={handleErinnerungChange} />

      {erinnerungen.hydration && (
        <div style={{ marginTop: 12 }}>
          <Label>{t("onboarding.hydration.erinnerungszeiten.label")}</Label>
          {zeiten.map((eintrag, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1.2 }}>
                <TimeWheelField value={eintrag.zeit} onChange={(v) => zeitFeldAendern(i, "zeit", v)} />
              </div>
              <div style={{ width: 64 }}>
                <TextInput type="number" value={eintrag.menge} onChange={(v) => zeitFeldAendern(i, "menge", v)} placeholder="ml" />
              </div>
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
            <div style={{ width: 64 }}>
              <TextInput type="number" value={neueMenge} onChange={setNeueMenge} placeholder="ml" />
            </div>
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
