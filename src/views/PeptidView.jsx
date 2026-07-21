import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea } from "../ui/primitives";
import { accentSoft, accentDark, cardBorder, textMuted } from "../ui/theme";
import { NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN } from "../constants";
import { fmtDate, keyOf, sameDay } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

function formatZeitpunkt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PeptidView({ onHome }) {
  const { plan, erledigt, feedback, saveFeedback, skipFeedback } = useAppData();
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });

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
    </Shell>
  );
}
