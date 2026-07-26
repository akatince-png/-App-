import React, { useState } from "react";
import { Label, TextInput } from "./primitives";
import ErinnerungField from "./ErinnerungField";
import TimeWheelField from "./TimeWheelField";
import { accentDark, cardBorder, danger } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/translate";

// Ältere gespeicherte Erinnerungen kannten "zeiten" noch als reine
// Uhrzeit-Strings ohne Menge — hier auf das neue {zeit, menge}-Format heben,
// damit bereits gespeicherte Profile nicht abstürzen.
const normalisiereZeiten = (zeiten) =>
  Array.isArray(zeiten) ? zeiten.map((z) => (typeof z === "string" ? { zeit: z, menge: "" } : z)) : [];

// Hydration-Erinnerungszeiten: eigene Liste konkreter Uhrzeiten (statt nur
// eines Ja/Nein-Schalters wie bei den anderen Kategorien), da der
// serverseitige Erinnerungs-Versand (send-due-reminders) genau diese Zeiten
// abfragt. Geteilt zwischen dem Hydration-Onboarding-Schritt (Ersteingabe)
// und HydrationView (laufende Pflege) — beide sollen Erinnerungszeiten
// hinzufügen/ändern/entfernen können, nicht nur beim Ersteinrichten.
export default function HydrationErinnerungenCard() {
  const { erinnerungen, setErinnerung } = useAppData();
  const { t } = useT();
  const [zeiten, setZeiten] = useState(() => normalisiereZeiten(erinnerungen?.hydration?.zeiten));
  const [neueZeit, setNeueZeit] = useState("12:00");
  const [neueMenge, setNeueMenge] = useState("300");

  const handleErinnerungChange = (v) => {
    setErinnerung("hydration", v ? { aktiv: true, zeiten } : false);
  };

  const zeitHinzufuegen = () => {
    if (!neueZeit || zeiten.some((e) => e.zeit === neueZeit)) return;
    const next = [...zeiten, { zeit: neueZeit, menge: neueMenge }].sort((a, b) => a.zeit.localeCompare(b.zeit));
    setZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
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
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <TimeWheelField value={eintrag.zeit} onChange={(v) => zeitFeldAendern(i, "zeit", v)} />
              </div>
              <div style={{ width: 88 }}>
                <TextInput
                  type="number"
                  value={eintrag.menge}
                  onChange={(v) => zeitFeldAendern(i, "menge", v)}
                  placeholder={t("onboarding.hydration.menge.placeholder")}
                />
              </div>
              <button
                type="button"
                onClick={() => zeitEntfernen(i)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 6px" }}
              >
                ×
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <TimeWheelField value={neueZeit} onChange={setNeueZeit} />
            </div>
            <div style={{ width: 88 }}>
              <TextInput type="number" value={neueMenge} onChange={setNeueMenge} placeholder={t("onboarding.hydration.menge.placeholder")} />
            </div>
            <button
              type="button"
              onClick={zeitHinzufuegen}
              style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
            >
              +
            </button>
          </div>
        </div>
      )}
    </>
  );
}
