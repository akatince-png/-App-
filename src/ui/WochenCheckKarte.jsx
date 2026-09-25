import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { danger, textMuted } from "./theme";
import { STIMMUNGEN } from "../utils/tagebuch";
import { AENDERUNGEN, STOERUNGEN, bilanzAusAppData, schwaechsterBaustein, wochenCheckWoche } from "../utils/kernprogramm";
import { plusTage } from "../utils/schichtplan";
import { toLocalISODate } from "../utils/dates";

// Wochen-Check in der Erhaltung (25.09., Vorschau freigegeben): sonntags
// 2 Minuten. Ein wackelnder Baustein, was gestört hat, EINE kleine
// Änderung für nächste Woche, Stimmung der Woche. Der Coach sieht es.
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

export default function WochenCheckKarte() {
  const appData = useAppData();
  const { kernStand, kernWochenChecks = [], kernWochenCheckSpeichern } = appData;
  const heute = toLocalISODate(new Date());
  const ws = wochenCheckWoche(kernStand, heute, kernWochenChecks);
  const schwach = useMemo(() => (ws ? schwaechsterBaustein(bilanzAusAppData(appData, ws, plusTage(ws, 6), heute)) : null), [ws, appData, heute]);
  const [stoerung, setStoerung] = useState([]);
  const [aenderung, setAenderung] = useState(null);
  const [stimmung, setStimmung] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [fertig, setFertig] = useState(false);

  if (fertig) {
    return (
      <div role="status" style={{ marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "#EAF7F0", border: "1.5px solid #BFE5D0", fontSize: 13.5, fontWeight: 700 }}>
        🔁 Wochen-Check gespeichert – dein Coach sieht ihn. Gute neue Woche!
      </div>
    );
  }
  if (!ws) return null;

  const speichern = async () => {
    setFehler(null);
    if (!stimmung) return setFehler("Bitte noch antippen, wie die Woche lief.");
    const r = await kernWochenCheckSpeichern(ws, { kernKey: schwach?.key || null, stoerung, aenderung, stimmung });
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    setFertig(true);
  };

  return (
    <section aria-label="Wochen-Check" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: "2px solid #2E9C86" }}>
      <div style={{ fontWeight: 900, fontSize: 15.5 }}>🔁 Wochen-Check · 2 Minuten</div>
      {schwach ? (
        <>
          <div style={{ fontSize: 13, background: "#FFF6E0", borderRadius: 12, padding: "8px 10px", margin: "8px 0" }}>
            {schwach.icon} <b>{schwach.name}</b> hat diese Woche an {schwach.erledigt} von {schwach.von} Tagen geklappt.
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>WAS HAT GESTÖRT?</div>
          <div role="group" aria-label="Was hat gestört?" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STOERUNGEN.map((s) => (
              <button key={s} type="button" aria-pressed={stoerung.includes(s)} style={chip(stoerung.includes(s))} onClick={() => setStoerung((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>EINE KLEINE ÄNDERUNG FÜR NÄCHSTE WOCHE</div>
          <div role="group" aria-label="Eine kleine Änderung" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AENDERUNGEN.map((s) => (
              <button key={s} type="button" aria-pressed={aenderung === s} style={chip(aenderung === s)} onClick={() => setAenderung(aenderung === s ? null : s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, background: "#EAF7F0", borderRadius: 12, padding: "8px 10px", margin: "8px 0" }}>💪 Alle Bausteine liefen diese Woche stabil.</div>
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WIE LIEF DIE WOCHE INSGESAMT?</div>
      <div role="group" aria-label="Wie lief die Woche?" style={{ display: "flex", justifyContent: "space-between" }}>
        {STIMMUNGEN.map((s) => (
          <button
            key={s.wert}
            type="button"
            aria-label={s.label}
            aria-pressed={stimmung === s.wert}
            onClick={() => setStimmung(s.wert)}
            style={{ fontSize: 28, border: "none", borderRadius: 14, padding: 6, cursor: "pointer", background: stimmung === s.wert ? "#FFF1D6" : "transparent", outline: stimmung === s.wert ? "2px solid #E0A21B" : "none" }}
          >
            {s.emoji}
          </button>
        ))}
      </div>
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={speichern}>Fertig</PrimaryButton>
      </div>
    </section>
  );
}
