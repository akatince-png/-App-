import React, { useState } from "react";
import { Shell, Card, Stepper, CheckRow, Label, TextInput, TextArea, Pill, PrimaryButton } from "../ui/primitives";
import DosierungFields from "../ui/DosierungFields";
import { SignedPhoto } from "../ui/SignedPhoto";
import { accentDark, accentSoft, cardBorder, textMuted } from "../ui/theme";
import { EINNAHMEARTEN, PEPTIDE_OPTIONEN, STEP_TITLES, ZIELE } from "../constants";
import { describeInterval } from "../utils/schedule";
import { useAppData } from "../context/AppDataContext";

export default function ProtocolFormView({ step, setStep, onFinish }) {
  const {
    ziele,
    toggleZiel,
    peptide,
    togglePeptid,
    einnahmeart,
    addCustomPreparat,
    dosierung,
    setDose,
    setPeptidFoto,
    startdatum,
    setStartdatum,
    dauer,
    setDauer,
    notizen,
    setNotizen,
    intervallGueltig,
  } = useAppData();

  const [customPreparatName, setCustomPreparatName] = useState("");
  const [customEinnahmeart, setCustomEinnahmeart] = useState("Tablette");

  const handleAddCustomPreparat = () => {
    addCustomPreparat(customPreparatName, customEinnahmeart);
    setCustomPreparatName("");
  };

  const handlePeptidFoto = (p, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPeptidFoto(p, file);
    e.target.value = "";
  };

  const canNext = () => {
    if (step === 0) return ziele.length > 0;
    if (step === 1) return peptide.length > 0;
    if (step === 2) return peptide.every(intervallGueltig);
    return true;
  };
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Shell>
      <div style={{ fontSize: 12, color: "#0A9384", marginBottom: 4, fontWeight: 700 }}>Schritt {step + 1} / 5</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>{STEP_TITLES[step]}</div>
      <Stepper step={step} />

      <Card style={{ marginBottom: 14 }}>
        {step === 0 && (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>Warum beginnst du dieses Protokoll?</div>
            {ZIELE.map((z) => (
              <CheckRow key={z} label={z} checked={ziele.includes(z)} onToggle={() => toggleZiel(z)} />
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>Wähle die Peptide für dein Protokoll</div>
            {PEPTIDE_OPTIONEN.map((p) => (
              <CheckRow key={p} label={p} checked={peptide.includes(p)} onToggle={() => togglePeptid(p)} />
            ))}

            {peptide
              .filter((p) => !PEPTIDE_OPTIONEN.includes(p))
              .map((p) => (
                <CheckRow key={p} label={`${p} (${einnahmeart[p] || "Eigenes"})`} checked={true} onToggle={() => togglePeptid(p)} />
              ))}

            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}` }}>
              <Label>Eigenes Präparat hinzufügen</Label>
              <TextInput value={customPreparatName} onChange={setCustomPreparatName} placeholder="z. B. Vitamin D Tropfen" />
              <Label>Einnahmeart</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {EINNAHMEARTEN.map((a) => (
                  <Pill key={a} label={a} selected={customEinnahmeart === a} onClick={() => setCustomEinnahmeart(a)} />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <PrimaryButton onClick={handleAddCustomPreparat} disabled={!customPreparatName.trim()} variant="ghost">
                  + Hinzufügen
                </PrimaryButton>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 4 }}>Lege Dosierung und Intervall fest</div>
            {peptide.length === 0 && (
              <div style={{ fontSize: 13, color: textMuted, marginTop: 12 }}>Kein Peptid ausgewählt — geh einen Schritt zurück.</div>
            )}
            {peptide.map((p) => (
              <div key={p} style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p}</div>
                  {dosierung[p]?.fotoPath && <SignedPhoto path={dosierung[p].fotoPath} alt={p} size={36} />}
                </div>

                <DosierungFields value={dosierung[p]} onChange={(feld, val) => setDose(p, feld, val)} />

                <Label>Foto des Präparats (optional) — hilft, Hersteller/Charge auseinanderzuhalten</Label>
                <input type="file" accept="image/*" id={`praeparat-foto-${p}`} style={{ display: "none" }} onChange={(e) => handlePeptidFoto(p, e)} />
                <label
                  htmlFor={`praeparat-foto-${p}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "9px",
                    borderRadius: 10,
                    border: "1.5px dashed #0FB8A3",
                    background: "#fff",
                    color: accentDark,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  📷 {dosierung[p]?.fotoPath ? "Foto ersetzen" : "Foto aufnehmen"}
                </label>
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Label>Startdatum</Label>
            <TextInput type="date" value={startdatum} onChange={setStartdatum} />
            <Label>Dauer (Wochen)</Label>
            <TextInput type="number" value={dauer} onChange={setDauer} placeholder="12" />
            <Label>Notizen & Details (optional)</Label>
            <TextArea value={notizen} onChange={setNotizen} placeholder="Persönliche Notizen zum Protokoll..." />
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 10 }}>Bitte prüfe deine Angaben:</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <b>Ziele:</b> {ziele.join(", ") || "—"}
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <b>Peptide:</b>
              <ul style={{ margin: "4px 0 0 0", paddingLeft: 18 }}>
                {peptide.map((p) => (
                  <li key={p}>
                    {p} — {dosierung[p]?.menge || "?"}, {describeInterval(dosierung[p])}, {(dosierung[p]?.uhrzeiten || ["20:00"]).join(" & ")}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <b>Start:</b> {startdatum} · <b>Dauer:</b> {dauer} Wochen
            </div>
            {notizen && (
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <b>Notizen:</b> {notizen}
              </div>
            )}
          </>
        )}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        {step > 0 && (
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={back} variant="ghost">
              Zurück
            </PrimaryButton>
          </div>
        )}
        <div style={{ flex: 1 }}>
          {step < 4 ? (
            <PrimaryButton onClick={next} disabled={!canNext()}>
              Weiter
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={onFinish} variant="success">
              Protokoll starten
            </PrimaryButton>
          )}
        </div>
      </div>
    </Shell>
  );
}
