import React from "react";
import { PrimaryButton } from "./primitives";
import { cardBorder, textMain, textMuted } from "./theme";
import { uebungGewichtText, uebungWiederholungenText } from "./UebungenEditor";

// Antippbare Vorschau einer Trainingseinheit (14.08., Nutzerin-Vorgabe): in
// Home/Tagesplan steht bei Training jetzt nur noch "X Übungen" statt der
// vollen Liste (siehe trainingKompaktDetail in utils/dayItems.js) — wer
// wissen will, was konkret ansteht, tippt drauf und sieht hier eine
// übersichtliche Tabelle, OHNE das Training gleich starten zu müssen.
// Bottom-Sheet statt eigener Seite, damit kein neues Routing nötig ist und
// "nur mal kurz reingucken" sich auch so anfühlt.
export default function TrainingVorschau({ art, name, uhrzeit, uebungen, warmup, cooldown, onSchliessen, onStarten }) {
  const liste = (uebungen || []).filter((u) => u.name);
  return (
    <div
      onClick={onSchliessen}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(21, 24, 26, 0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px 22px 0 0",
          padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{name ? `${art} · ${name}` : art}</div>
            {uhrzeit && <div style={{ fontSize: 12.5, color: textMuted, marginTop: 2 }}>{uhrzeit} Uhr</div>}
          </div>
          <button
            type="button"
            onClick={onSchliessen}
            aria-label="Schließen"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 16, cursor: "pointer", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {warmup?.aktiv && (
          <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 6 }}>
            🔥 Warm-up{warmup.dauerMin ? ` · ${warmup.dauerMin} Min.` : ""}
          </div>
        )}

        {liste.length > 0 ? (
          <div style={{ border: `1px solid ${cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", padding: "8px 10px", background: "#FAFBFA", fontSize: 11, fontWeight: 700, color: textMuted }}>
              <div style={{ flex: 1 }}>Übung</div>
              <div style={{ width: 46, textAlign: "center" }}>Sätze</div>
              <div style={{ width: 60, textAlign: "center" }}>Wdh.</div>
              <div style={{ width: 64, textAlign: "right" }}>Gewicht</div>
            </div>
            {liste.map((u, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 10px",
                  borderTop: `1px solid ${cardBorder}`,
                  fontSize: 13,
                  color: textMain,
                }}
              >
                <div style={{ flex: 1, fontWeight: 700 }}>{u.name}</div>
                <div style={{ width: 46, textAlign: "center" }}>{u.saetze || "–"}</div>
                <div style={{ width: 60, textAlign: "center" }}>{uebungWiederholungenText(u) || "–"}</div>
                <div style={{ width: 64, textAlign: "right", color: textMuted }}>{uebungGewichtText(u) || "–"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: textMuted, textAlign: "center", padding: "12px 0" }}>Keine einzelnen Übungen hinterlegt.</div>
        )}

        {cooldown?.aktiv && (
          <div style={{ fontSize: 12.5, color: textMuted, marginTop: 8 }}>
            🧊 Cool-down{cooldown.dauerMin ? ` · ${cooldown.dauerMin} Min.` : ""}
          </div>
        )}

        {onStarten && (
          <div style={{ marginTop: 16 }}>
            <PrimaryButton onClick={onStarten}>▶️ Training starten</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
