import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import Timer from "./Timer";
import { cardBorder, danger, textMuted } from "./theme";
import { toLocalISODate } from "../utils/dates";
import { faelligeBausteine } from "../utils/kernprogramm";

// Morgen-Startblock (Kernprogramm ab Woche 3, 25.09.): Top 3 des Tages,
// ein erster kleiner Schritt für Nr. 1, 15 Min. daran arbeiten — danach
// die Frage im Moment: "Hast du angefangen?" (zählt, nicht fertig sein).
// Antwort "ja" hakt den Pflicht-Schritt in der Morgenroutine mit ab.
export default function Top3Karte() {
  const { kernStand, kernTop3 = {}, kernTop3Speichern, routineSchritteAlle = [], routineSchrittErledigt = {}, routineSchrittErledigtUmschalten } = useAppData();
  const heute = toLocalISODate(new Date());
  const eintrag = kernTop3[heute];
  const [punkte, setPunkte] = useState(() => [...(eintrag?.punkte || []), "", "", ""].slice(0, 3));
  const [ersterSchritt, setErsterSchritt] = useState(eintrag?.ersterSchritt || "");
  const [phase, setPhase] = useState(eintrag?.punkte?.length ? "bereit" : "planen");
  const [fehler, setFehler] = useState(null);
  const [danke, setDanke] = useState(null);

  if (!faelligeBausteine(kernStand).some((b) => b.key === "top3")) return null;
  if (danke) {
    return (
      <div role="status" style={{ marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "#EAF7F0", border: "1.5px solid #BFE5D0", fontSize: 13.5, fontWeight: 700 }}>
        {danke}
      </div>
    );
  }
  if (eintrag?.angefangen != null || new Date().getHours() >= 14) return null;

  const schritt = routineSchritteAlle.find((s) => s.kernKey === "top3");
  const antworten = async (angefangen) => {
    const r = await kernTop3Speichern(heute, { punkte, ersterSchritt, angefangen });
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    if (angefangen && schritt && !routineSchrittErledigt[`${heute}__${schritt.id}`]) routineSchrittErledigtUmschalten?.(schritt.id, heute);
    setDanke(angefangen ? "✅ Angefangen – genau darum geht's. Stark!" : "👍 Ehrlich notiert. Morgen ist ein neuer Start – vielleicht mit einem noch kleineren ersten Schritt.");
  };
  const planSpeichern = async () => {
    setFehler(null);
    if (!punkte[0].trim()) return setFehler("Mindestens Nr. 1 eintragen.");
    const r = await kernTop3Speichern(heute, { punkte, ersterSchritt });
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    setPhase("timer");
  };

  const feld = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", marginBottom: 6 };
  return (
    <section aria-label="Deine Top 3 für heute" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: "2px solid #1B2350" }}>
      <div style={{ fontWeight: 900, fontSize: 15.5 }}>📝 Deine Top 3 für heute</div>
      {phase === "planen" && (
        <>
          <div style={{ fontSize: 12, color: textMuted, margin: "4px 0 10px" }}>Drei Dinge, die heute zählen. Dann ein erster kleiner Schritt für Nr. 1.</div>
          {punkte.map((p, i) => (
            <input key={i} aria-label={`Top ${i + 1}`} value={p} placeholder={i === 0 ? "1. das Wichtigste" : `${i + 1}. (optional)`} onChange={(e) => setPunkte((x) => x.map((y, j) => (j === i ? e.target.value : y)))} style={feld} />
          ))}
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "8px 0 6px" }}>ERSTER KLEINER SCHRITT FÜR NR. 1</div>
          <input aria-label="Erster kleiner Schritt" value={ersterSchritt} placeholder="z. B. Ordner auf den Tisch legen" onChange={(e) => setErsterSchritt(e.target.value)} style={feld} />
          {fehler && <div style={{ color: danger, fontSize: 12.5 }}>{fehler}</div>}
          <div style={{ marginTop: 8 }}>
            <PrimaryButton onClick={planSpeichern}>▶ 15 Min. daran arbeiten</PrimaryButton>
          </div>
        </>
      )}
      {phase === "bereit" && (
        <>
          <div style={{ fontSize: 13.5, margin: "6px 0 10px", lineHeight: 1.5 }}>
            <b>1. {eintrag?.punkte?.[0]}</b>
            {eintrag?.ersterSchritt && <div style={{ color: textMuted }}>Erster Schritt: {eintrag.ersterSchritt}</div>}
          </div>
          <PrimaryButton onClick={() => setPhase("timer")}>▶ 15 Min. daran arbeiten</PrimaryButton>
          <button type="button" onClick={() => setPhase("frage")} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
            Schon dran gewesen ›
          </button>
        </>
      )}
      {phase === "timer" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            Nr. 1: <b>{punkte[0]}</b>
          </div>
          <Timer mode="countdown" initialSeconds={15 * 60} autoStart onFertig={() => setPhase("frage")} />
          <button type="button" onClick={() => setPhase("frage")} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>
            Früher aufhören ›
          </button>
        </div>
      )}
      {phase === "frage" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Hast du angefangen?</div>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>Das zählt – nicht, ob du fertig bist.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryButton onClick={() => antworten(true)}>✅ Ja</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => antworten(false)}>
              Noch nicht
            </PrimaryButton>
          </div>
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
        </div>
      )}
    </section>
  );
}
