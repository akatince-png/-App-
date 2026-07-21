import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton, StatusBadge, TextInput } from "../ui/primitives";
import DosierungFields from "../ui/DosierungFields";
import { SignedPhoto } from "../ui/SignedPhoto";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { describeInterval } from "../utils/schedule";
import { fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const NEUES_HORMON_LEER = {
  name: "",
  menge: "",
  intervallTyp: "fixed",
  intervallDays: 7,
  customDays: "",
  onDays: "",
  offDays: "",
  weekdays: [],
  eigenerStart: "",
  uhrzeiten: ["20:00"],
};

function hormonIntervallGueltig(d) {
  if (d.intervallTyp === "custom") return !!d.customDays && Number(d.customDays) > 0;
  if (d.intervallTyp === "cycle") return !!d.onDays && Number(d.onDays) > 0 && d.offDays !== "";
  if (d.intervallTyp === "weekdays") return (d.weekdays || []).length > 0;
  return true;
}

export default function HormonView({ onHome }) {
  const { hormone, hormonDosierung, hormonHinzufuegen, hormonEntfernen, setHormonFoto, hormonErledigt, toggleHormonErledigt, hormonPlan } =
    useAppData();
  const [neuesHormon, setNeuesHormon] = useState(NEUES_HORMON_LEER);
  const [hormonError, setHormonError] = useState(null);
  const today = new Date();

  const handleChange = (feld, val) => {
    setNeuesHormon((prev) => {
      if (feld === "intervallPreset") return { ...prev, intervallTyp: "fixed", intervallDays: val };
      return { ...prev, [feld]: val };
    });
  };

  const submit = async () => {
    setHormonError(null);
    const result = await hormonHinzufuegen(neuesHormon);
    if (!result?.ok) {
      setHormonError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeuesHormon(NEUES_HORMON_LEER);
  };

  const handleHormonFoto = (name, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHormonFoto(name, file);
    e.target.value = "";
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>⚗️ Hormone / Off-Label</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Neues Hormon / Präparat hinzufügen</div>
        <Label>Name</Label>
        <TextInput value={neuesHormon.name} onChange={(v) => handleChange("name", v)} placeholder="z. B. Testosteron Enantat" />

        <DosierungFields value={neuesHormon} onChange={handleChange} mengePlaceholder="z. B. 100 mg" />

        {hormonError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{hormonError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neuesHormon.name.trim() || !hormonIntervallGueltig(neuesHormon)}>
            + Zum Protokoll hinzufügen
          </PrimaryButton>
        </div>
      </Card>

      {hormone.length === 0 ? (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch nichts im Hormon-Protokoll — leg oben dein erstes Präparat an.</div>
        </Card>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Heute</div>
          <Card style={{ marginBottom: 14 }}>
            {hormonPlan.filter((d) => sameDay(d.date, today)).length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Heute steht nichts an. 🌿</div>}
            {hormonPlan
              .filter((d) => sameDay(d.date, today))
              .map((dose, i, arr) => {
                const k = `${toLocalISODate(dose.date)}__${dose.name}__${dose.uhrzeit}`;
                const done = !!hormonErledigt[k];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {dose.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {dose.uhrzeit}</span>
                      </div>
                      <div style={{ fontSize: 12, color: textMuted }}>{dose.menge}</div>
                    </div>
                    {done ? (
                      <StatusBadge status="erledigt" />
                    ) : (
                      <button
                        onClick={() => toggleHormonErledigt(toLocalISODate(dose.date), dose.name, dose.uhrzeit)}
                        style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: "#0FB8A3", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Bestätigen
                      </button>
                    )}
                  </div>
                );
              })}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Nächste Tage</div>
          <Card style={{ marginBottom: 14 }}>
            {hormonPlan.filter((d) => d.date > today && !sameDay(d.date, today)).slice(0, 8).length === 0 && (
              <div style={{ fontSize: 13, color: textMuted }}>Keine weiteren Termine.</div>
            )}
            {hormonPlan
              .filter((d) => d.date > today && !sameDay(d.date, today))
              .slice(0, 8)
              .map((dose, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {fmtDate(dose.date)} · {dose.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 11 }}>· {dose.uhrzeit}</span>
                  </div>
                  <div style={{ fontSize: 12, color: textMuted }}>{dose.menge}</div>
                </div>
              ))}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Hormon-Protokoll verwalten</div>
          <Card style={{ marginBottom: 14 }}>
            {hormone.map((h, i) => (
              <div key={h} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < hormone.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {hormonDosierung[h]?.fotoPath && <SignedPhoto path={hormonDosierung[h].fotoPath} alt={h} size={34} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{h}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>
                      {hormonDosierung[h]?.menge} · {describeInterval(hormonDosierung[h])} · {(hormonDosierung[h]?.uhrzeiten || []).join(" & ")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="file" accept="image/*" id={`hormon-foto-${h}`} style={{ display: "none" }} onChange={(e) => handleHormonFoto(h, e)} />
                  <label htmlFor={`hormon-foto-${h}`} style={{ cursor: "pointer", fontSize: 16 }} title="Foto hinzufügen">
                    📷
                  </label>
                  <button onClick={() => hormonEntfernen(h)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </Shell>
  );
}
