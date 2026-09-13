import React, { useState } from "react";
import { Label, Pill } from "./primitives";
import VorlaufFeld from "./VorlaufFeld";
import { danger } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/translate";

// Erinnerung + Vorab-Hinweis EINER Kategorie, direkt eingebettet in deren
// eigene Ansicht — nicht nur zentral unter Mehr → Erinnerungen. Nutzerin-
// Vorgabe (15.08., spätabends): "ich hatte grade bei der Gewohnheit nicht
// die Möglichkeit, den Vorlauf einzustellen — das solltest du bei allen
// Möglichkeiten mit einbauen." Dieselbe Logik/Datenablage wie in MehrTab.jsx
// (CATEGORY_STEPS-Liste), hier wiederverwendbar für Kategorien mit eigener
// Ansicht, die vorher gar keine oder nur eine Ja/Nein-Erinnerung ohne
// Vorlauf-Auswahl hatten.
//
// Der Vorab-Hinweis war bisher hinter "Erinnerung: Ja" versteckt (erst nach
// dem Umschalten sichtbar) — Nutzerin fand ihn wiederholt nicht (16.08.:
// "ich hab immer noch nicht sehen können, dass ich das einstelle"). Jetzt
// immer sichtbar: eine Vorlauf-Auswahl aktiviert die Erinnerung von sich aus
// mit (siehe setVorlauf unten), kein zweiter Schritt mehr nötig.
export default function KategorieErinnerung({ kategorie, label, mitTagen = false }) {
  const { erinnerungen, setErinnerung } = useAppData();
  const { t } = useT();
  const [fehler, setFehler] = useState(null);
  const wert = erinnerungen[kategorie];
  const vorlaufMinuten = wert && typeof wert === "object" ? wert.vorlaufMinuten : undefined;

  const speichern = async (naechsterWert) => {
    setFehler(null);
    const result = await setErinnerung(kategorie, naechsterWert);
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  const setVorlauf = (minuten) => {
    const bestehend = wert && typeof wert === "object" ? wert : {};
    speichern({ ...bestehend, aktiv: true, vorlaufMinuten: minuten });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Label>{label}</Label>
        <Pill label={wert ? t("common.erinnerung.ja") : t("common.erinnerung.nein")} selected={!!wert} onClick={() => speichern(!wert)} />
      </div>
      <VorlaufFeld value={vorlaufMinuten} onChange={setVorlauf} mitTagen={mitTagen} />
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
