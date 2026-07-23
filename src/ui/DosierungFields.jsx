import React from "react";
import { Label, Pill, TextInput } from "./primitives";
import { danger, textMuted } from "./theme";
import { INTERVALL_TYPEN, WOCHENTAGE } from "../constants";
import TimeWheelField from "./TimeWheelField";

/**
 * Wiederverwendbare Dosierungs-Felder: Menge, Intervall (fest/individuell/
 * Zyklus/Wochentage), eine oder mehrere Uhrzeiten pro Tag, eigenes Startdatum.
 * `onChange(feld, wert)` funktioniert für Peptide (setDose) genauso wie für
 * einen lokalen Hormon-Entwurf (setState) — "intervallPreset" setzt Modus +
 * Tage in einem Schritt, alle anderen Felder werden 1:1 durchgereicht.
 */
export default function DosierungFields({ value, onChange, showMenge = true, mengePlaceholder = "z. B. 0,25 mg" }) {
  const v = value || {};
  const intervallTyp = v.intervallTyp || "fixed";
  const uhrzeiten = v.uhrzeiten?.length ? v.uhrzeiten : ["20:00"];

  const setUhrzeit = (idx, val) => {
    const next = [...uhrzeiten];
    next[idx] = val;
    onChange("uhrzeiten", next);
  };
  const addUhrzeit = () => onChange("uhrzeiten", [...uhrzeiten, "08:00"]);
  const removeUhrzeit = (idx) => {
    const next = uhrzeiten.filter((_, i) => i !== idx);
    onChange("uhrzeiten", next.length ? next : ["20:00"]);
  };
  const toggleWeekday = (day) => {
    const current = v.weekdays || [];
    const next = current.includes(day) ? current.filter((x) => x !== day) : [...current, day];
    onChange("weekdays", next);
  };

  return (
    <>
      {showMenge && (
        <>
          <Label>Menge</Label>
          <TextInput placeholder={mengePlaceholder} value={v.menge || ""} onChange={(val) => onChange("menge", val)} />
        </>
      )}

      <Label>Intervall</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {INTERVALL_TYPEN.map((opt) => {
          const selected = opt.mode === "fixed" ? intervallTyp === "fixed" && v.intervallDays === opt.days : intervallTyp === opt.mode;
          return (
            <Pill
              key={opt.label}
              label={opt.label}
              selected={selected}
              onClick={() => (opt.mode === "fixed" ? onChange("intervallPreset", opt.days) : onChange("intervallTyp", opt.mode))}
            />
          );
        })}
      </div>

      {intervallTyp === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 13, color: textMuted }}>Alle</span>
          <div style={{ width: 70 }}>
            <TextInput type="number" value={v.customDays || ""} onChange={(val) => onChange("customDays", val)} placeholder="3" />
          </div>
          <span style={{ fontSize: 13, color: textMuted }}>Tage</span>
        </div>
      )}

      {intervallTyp === "cycle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <div style={{ width: 60 }}>
            <TextInput type="number" value={v.onDays || ""} onChange={(val) => onChange("onDays", val)} placeholder="5" />
          </div>
          <span style={{ fontSize: 13, color: textMuted }}>Tage on,</span>
          <div style={{ width: 60 }}>
            <TextInput type="number" value={v.offDays || ""} onChange={(val) => onChange("offDays", val)} placeholder="2" />
          </div>
          <span style={{ fontSize: 13, color: textMuted }}>Tage off — wiederholt sich</span>
        </div>
      )}

      {intervallTyp === "weekdays" && (
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
          {WOCHENTAGE.map((day) => (
            <Pill key={day} label={day} selected={(v.weekdays || []).includes(day)} onClick={() => toggleWeekday(day)} />
          ))}
        </div>
      )}

      <Label>Uhrzeit(en)</Label>
      {uhrzeiten.map((zeit, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <TimeWheelField value={zeit} onChange={(val) => setUhrzeit(i, val)} />
          </div>
          {uhrzeiten.length > 1 && (
            <button
              type="button"
              onClick={() => removeUhrzeit(i)}
              style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 6px" }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addUhrzeit}
        style={{
          padding: "7px 12px",
          borderRadius: 10,
          border: "1px dashed #C7D8D2",
          background: "transparent",
          color: textMuted,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        + weitere Uhrzeit (z. B. morgens &amp; abends)
      </button>

      <Label>Eigenes Startdatum (optional)</Label>
      <TextInput type="date" value={v.eigenerStart || ""} onChange={(val) => onChange("eigenerStart", val)} />
      <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Leer lassen = startet mit dem allgemeinen Startdatum des Protokolls.</div>
    </>
  );
}
