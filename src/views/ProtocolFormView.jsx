import React, { useState } from "react";
import { Shell, Card, Stepper, CheckRow, Label, TextInput, TextArea, Pill, PrimaryButton } from "../ui/primitives";
import { accentSoft, cardBorder, textMuted } from "../ui/theme";
import { EINNAHMEARTEN, INTERVALL_OPTIONEN, PEPTIDE_OPTIONEN, STEP_TITLES, ZIELE } from "../constants";
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

  const canNext = () => {
    if (step === 0) return ziele.length > 0;
    if (step === 1) return peptide.length > 0;
    if (step === 2) return peptide.every(intervallGueltig);
    return true;
  };
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const intervallLabel = (p) => {
    const d = dosierung[p];
    if (d?.intervallDays === "custom") return `Alle ${d.customDays || "?"} Tage`;
    return INTERVALL_OPTIONEN.find((o) => o.days === d?.intervallDays)?.label || "?";
  };

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
              <div key={p} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p}</div>
                <Label>Menge</Label>
                <TextInput placeholder="z. B. 0,25 mg" value={dosierung[p]?.menge || ""} onChange={(v) => setDose(p, "menge", v)} />
                <Label>Intervall</Label>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {INTERVALL_OPTIONEN.map((opt) => (
                    <Pill
                      key={opt.label}
                      label={opt.label}
                      selected={dosierung[p]?.intervallDays === opt.days}
                      onClick={() => setDose(p, "intervallDays", opt.days)}
                    />
                  ))}
                </div>
                {dosierung[p]?.intervallDays === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: textMuted }}>Alle</span>
                    <div style={{ width: 70 }}>
                      <TextInput
                        type="number"
                        value={dosierung[p]?.customDays || ""}
                        onChange={(v) => setDose(p, "customDays", v)}
                        placeholder="3"
                      />
                    </div>
                    <span style={{ fontSize: 13, color: textMuted }}>Tage</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Label>Eigenes Startdatum (optional)</Label>
                    <TextInput type="date" value={dosierung[p]?.eigenerStart || ""} onChange={(v) => setDose(p, "eigenerStart", v)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label>Erinnerungs-Uhrzeit</Label>
                    <TextInput type="time" value={dosierung[p]?.uhrzeit || "20:00"} onChange={(v) => setDose(p, "uhrzeit", v)} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
                  Leer lassen = startet mit dem allgemeinen Startdatum des Protokolls.
                </div>
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
                    {p} — {dosierung[p]?.menge || "?"}, {intervallLabel(p)}
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
