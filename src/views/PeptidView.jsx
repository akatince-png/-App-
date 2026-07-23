import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../ui/primitives";
import DosierungFields from "../ui/DosierungFields";
import DosisBearbeitenPanel from "../ui/DosisBearbeitenPanel";
import { SignedPhoto } from "../ui/SignedPhoto";
import { accentSoft, accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { EINNAHMEARTEN, NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN } from "../constants";
import { describeInterval } from "../utils/schedule";
import { fmtDate, keyOf, sameDay } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const NEUES_PEPTID_LEER = {
  name: "",
  einnahmeart: "Injektion",
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

const DOSIS_FELDER = ["menge", "customDays", "onDays", "offDays", "eigenerStart", "weekdays", "uhrzeiten"];

function formatZeitpunkt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PeptidView({ onHome }) {
  const {
    plan,
    erledigt,
    feedback,
    saveFeedback,
    skipFeedback,
    peptide,
    dosierung,
    einnahmeart,
    addCustomPreparat,
    togglePeptid,
    setEinnahmeart,
    setDose,
    setPeptidFoto,
    aenderungVermerken,
  } = useAppData();
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });
  const [neuesPeptid, setNeuesPeptid] = useState(NEUES_PEPTID_LEER);
  const [peptidError, setPeptidError] = useState(null);
  const [dosisEditOffen, setDosisEditOffen] = useState(null);

  const handleNeuesPeptidChange = (feld, val) =>
    setNeuesPeptid((p) => (feld === "intervallPreset" ? { ...p, intervallTyp: "fixed", intervallDays: val } : { ...p, [feld]: val }));

  const submitNeuesPeptid = async () => {
    setPeptidError(null);
    const name = neuesPeptid.name.trim();
    const result = await addCustomPreparat(name, neuesPeptid.einnahmeart);
    if (!result?.ok) {
      setPeptidError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setDose(name, "menge", neuesPeptid.menge);
    setDose(name, "uhrzeiten", neuesPeptid.uhrzeiten);
    if (neuesPeptid.intervallTyp === "fixed") setDose(name, "intervallPreset", neuesPeptid.intervallDays);
    else {
      setDose(name, "intervallTyp", neuesPeptid.intervallTyp);
      DOSIS_FELDER.forEach((feld) => {
        if (feld !== "menge" && feld !== "uhrzeiten") setDose(name, feld, neuesPeptid[feld]);
      });
    }
    aenderungVermerken({
      kategorie: "peptid",
      itemName: name,
      aktion: "hinzugefügt",
      detail: `${neuesPeptid.einnahmeart} · ${neuesPeptid.menge || "–"}`,
    });
    setNeuesPeptid(NEUES_PEPTID_LEER);
  };

  const handleEntfernen = (p) => {
    aenderungVermerken({ kategorie: "peptid", itemName: p, aktion: "entfernt", detail: dosierung[p]?.menge || "" });
    togglePeptid(p);
  };

  const handleDosisSpeichern = (p, entwurf, grund) => {
    const vorher = dosierung[p];
    const aenderungen = [];
    if (entwurf.menge !== vorher.menge) aenderungen.push(`Menge: ${vorher.menge || "–"} → ${entwurf.menge || "–"}`);
    if (entwurf.intervallTyp !== vorher.intervallTyp || entwurf.intervallDays !== vorher.intervallDays) {
      aenderungen.push(`Intervall: ${describeInterval(vorher)} → ${describeInterval(entwurf)}`);
    }
    if (JSON.stringify(entwurf.uhrzeiten) !== JSON.stringify(vorher.uhrzeiten)) {
      aenderungen.push(`Uhrzeit: ${(vorher.uhrzeiten || []).join(", ")} → ${(entwurf.uhrzeiten || []).join(", ")}`);
    }
    if (aenderungen.length > 0) {
      aenderungVermerken({ kategorie: "peptid", itemName: p, aktion: "geändert", detail: aenderungen.join("; "), grund });
    }
    DOSIS_FELDER.forEach((feld) => {
      if (JSON.stringify(entwurf[feld]) !== JSON.stringify(vorher[feld])) setDose(p, feld, entwurf[feld]);
    });
    if (entwurf.intervallTyp === "fixed" && (entwurf.intervallTyp !== vorher.intervallTyp || entwurf.intervallDays !== vorher.intervallDays)) {
      setDose(p, "intervallPreset", entwurf.intervallDays);
    } else if (entwurf.intervallTyp !== vorher.intervallTyp) {
      setDose(p, "intervallTyp", entwurf.intervallTyp);
    }
    setDosisEditOffen(null);
  };

  const handleFoto = (name, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPeptidFoto(name, file);
    e.target.value = "";
  };

  const today = new Date();
  const heuteDosen = plan.filter((d) => sameDay(d.date, today));
  const kommendeDosen = plan.filter((d) => d.date > today && !sameDay(d.date, today)).slice(0, 8);

  const statusOf = (dose) => {
    const k = keyOf(dose.date, dose.peptid, dose.uhrzeit);
    if (erledigt[k]) return "erledigt";
    if (dose.date < today && !sameDay(dose.date, today)) return "verpasst";
    return "geplant";
  };

  const openFeedback = (dose) => {
    setFeedbackOpen(keyOf(dose.date, dose.peptid, dose.uhrzeit));
    setDraftFeedback({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));

  const handleSave = (dose) => {
    saveFeedback(dose, draftFeedback);
    setFeedbackOpen(null);
  };
  const handleSkip = (dose) => {
    skipFeedback(dose);
    setFeedbackOpen(null);
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>💉 Peptide</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Neues Peptid hinzufügen</div>
        <Label>Name</Label>
        <TextInput value={neuesPeptid.name} onChange={(v) => handleNeuesPeptidChange("name", v)} placeholder="z. B. BPC-157" />

        <Label>Einnahmeart</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {EINNAHMEARTEN.map((a) => (
            <Pill key={a} label={a} selected={neuesPeptid.einnahmeart === a} onClick={() => handleNeuesPeptidChange("einnahmeart", a)} />
          ))}
        </div>

        <DosierungFields value={neuesPeptid} onChange={handleNeuesPeptidChange} mengePlaceholder="z. B. 0,25 mg" />

        {peptidError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{peptidError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submitNeuesPeptid} disabled={!neuesPeptid.name.trim()}>
            + Zum Protokoll hinzufügen
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Heute</div>
      <Card style={{ marginBottom: 14 }}>
        {heuteDosen.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Heute steht nichts an. 🌿</div>}
        {heuteDosen.map((dose, i) => {
          const st = statusOf(dose);
          const k = keyOf(dose.date, dose.peptid, dose.uhrzeit);
          const isOpen = feedbackOpen === k;
          const fb = feedback[k];
          return (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < heuteDosen.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {dose.peptid} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {dose.uhrzeit}</span>
                  </div>
                  <div style={{ fontSize: 12, color: textMuted }}>{dose.menge}</div>
                </div>
                {st === "erledigt" ? (
                  <StatusBadge status="erledigt" />
                ) : (
                  <button
                    onClick={() => openFeedback(dose)}
                    style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: "#0FB8A3", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Injizieren
                  </button>
                )}
              </div>

              {st === "erledigt" && fb && (
                <div style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
                  {formatZeitpunkt(fb.erledigtAt) && <>Injiziert am {formatZeitpunkt(fb.erledigtAt)} · </>}
                  {fb.staerke && fb.staerke !== "Keine" ? <>Nebenwirkungen: {fb.nebenwirkungen.join(", ") || "—"} ({fb.staerke})</> : "Keine Nebenwirkungen gemeldet"}
                </div>
              )}

              {isOpen && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Wie war es seit der letzten Injektion?</div>
                  <Label>Welche Nebenwirkungen hattest du?</Label>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {NEBENWIRKUNGEN_OPTIONEN.map((n) => (
                      <Pill key={n} label={n} selected={draftFeedback.nebenwirkungen.includes(n)} onClick={() => toggleDraftNebenwirkung(n)} />
                    ))}
                  </div>
                  <Label>Wie stark?</Label>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {STAERKE_OPTIONEN.map((s) => (
                      <Pill key={s} label={s} selected={draftFeedback.staerke === s} onClick={() => setDraftFeedback((p) => ({ ...p, staerke: s }))} />
                    ))}
                  </div>
                  <Label>Notizen (optional)</Label>
                  <TextArea value={draftFeedback.notizen} onChange={(v) => setDraftFeedback((p) => ({ ...p, notizen: v }))} placeholder="Hier kannst du alles aufschreiben..." />
                  <Label>Foto (optional) — z. B. Rötung oder Knubbel an der Einstichstelle</Label>
                  <input
                    type="file"
                    accept="image/*"
                    id={`nebenwirkung-foto-${k}`}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setDraftFeedback((p) => ({ ...p, fotoFile: file, fotoPreview: URL.createObjectURL(file) }));
                    }}
                  />
                  <label
                    htmlFor={`nebenwirkung-foto-${k}`}
                    style={{ display: "block", textAlign: "center", padding: "9px", borderRadius: 10, border: `1.5px dashed #0FB8A3`, background: "#fff", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 4 }}
                  >
                    📷 Foto aufnehmen
                  </label>
                  {draftFeedback.fotoPreview && (
                    <img src={draftFeedback.fotoPreview} alt="Nebenwirkung" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1 }}>
                      <PrimaryButton onClick={() => handleSkip(dose)} variant="ghost">
                        Überspringen
                      </PrimaryButton>
                    </div>
                    <div style={{ flex: 1 }}>
                      <PrimaryButton onClick={() => handleSave(dose)} variant="success">
                        Speichern
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Nächste Tage</div>
      <Card style={{ marginBottom: 14 }}>
        {kommendeDosen.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Keine weiteren Termine.</div>}
        {kommendeDosen.map((dose, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < kommendeDosen.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {fmtDate(dose.date)} · {dose.peptid} <span style={{ fontWeight: 600, color: textMuted, fontSize: 11 }}>· {dose.uhrzeit}</span>
              </div>
              <div style={{ fontSize: 11, color: textMuted }}>{dose.menge}</div>
            </div>
            <StatusBadge status={statusOf(dose)} />
          </div>
        ))}
      </Card>

      {Object.keys(feedback).length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Feedback</div>
          <Card style={{ marginBottom: 14 }}>
            {Object.entries(feedback).map(([k, fb], i, arr) => (
              <div key={k} style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {k.split("__")[1]} {formatZeitpunkt(fb.erledigtAt) && <span style={{ fontWeight: 500, color: textMuted }}>· {formatZeitpunkt(fb.erledigtAt)}</span>}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {fb.staerke && fb.staerke !== "Keine" ? `${fb.nebenwirkungen.join(", ") || "—"} (${fb.staerke})` : "Keine Nebenwirkungen"}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {peptide.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Peptid-Protokoll verwalten</div>
          <Card>
            {peptide.map((p, i) => (
              <div
                key={p}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: i < peptide.length - 1 ? `1px solid ${cardBorder}` : "none" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                  {dosierung[p]?.fotoPath && <SignedPhoto path={dosierung[p].fotoPath} alt={p} size={34} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>
                      {dosierung[p]?.menge} · {einnahmeart[p] || "Injektion"} · {describeInterval(dosierung[p])} ·{" "}
                      {(dosierung[p]?.uhrzeiten || []).join(" & ")}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <select
                        value={einnahmeart[p] || "Injektion"}
                        onChange={(e) => {
                          const vorher = einnahmeart[p] || "Injektion";
                          if (e.target.value !== vorher) {
                            aenderungVermerken({ kategorie: "peptid", itemName: p, aktion: "geändert", detail: `Einnahmeart: ${vorher} → ${e.target.value}` });
                          }
                          setEinnahmeart(p, e.target.value);
                        }}
                        style={{ fontSize: 11, border: `1px solid ${cardBorder}`, borderRadius: 6, padding: "2px 4px", color: textMuted }}
                      >
                        {EINNAHMEARTEN.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setDosisEditOffen(dosisEditOffen === p ? null : p)}
                      style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0, marginTop: 6 }}
                    >
                      {dosisEditOffen === p ? "Dosis-Bearbeitung schließen" : "Dosis bearbeiten"}
                    </button>
                    {dosisEditOffen === p && (
                      <DosisBearbeitenPanel dosierung={dosierung[p]} onSpeichern={(entwurf, grund) => handleDosisSpeichern(p, entwurf, grund)} />
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="file" accept="image/*" id={`peptid-foto-${p}`} style={{ display: "none" }} onChange={(e) => handleFoto(p, e)} />
                  <label htmlFor={`peptid-foto-${p}`} style={{ cursor: "pointer", fontSize: 16 }} title="Foto hinzufügen">
                    📷
                  </label>
                  <button onClick={() => handleEntfernen(p)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
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
