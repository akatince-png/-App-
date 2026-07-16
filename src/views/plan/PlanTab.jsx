import React, { useState } from "react";
import { Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../../ui/primitives";
import { SimpleLineChart } from "../../ui/charts";
import { accentDark, accentSoft, blue, cardBorder, textMuted } from "../../ui/theme";
import { INTERVALL_OPTIONEN, NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN } from "../../constants";
import { fmtDate, keyOf, sameDay, toLocalISODate } from "../../utils/dates";
import { useAppData } from "../../context/AppDataContext";

const PROTOKOLL_TYPEN = [
  { id: "peptide", label: "💉 Peptide" },
  { id: "schlaf", label: "😴 Schlaf" },
  { id: "hormon", label: "🧪 Hormone" },
  { id: "weitere", label: "➕ Weitere" },
];

export default function PlanTab({ protokollTyp, setProtokollTyp }) {
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {PROTOKOLL_TYPEN.map((t) => (
          <button
            key={t.id}
            onClick={() => setProtokollTyp(t.id)}
            style={{
              padding: "7px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${protokollTyp === t.id ? accentDark : cardBorder}`,
              background: protokollTyp === t.id ? accentDark : "#fff",
              color: protokollTyp === t.id ? "#fff" : textMuted,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {protokollTyp === "hormon" && <HormonSection />}
      {protokollTyp === "weitere" && <WeitereSection />}
      {protokollTyp === "schlaf" && <SchlafSection />}
      {protokollTyp === "peptide" && <PeptideSection />}
    </>
  );
}

function WeitereSection() {
  return (
    <Card style={{ marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Weitere Substanzen — bald verfügbar</div>
      <div style={{ fontSize: 12, color: textMuted }}>
        Für alle, deren Fokus nicht bei Peptiden liegt: eigene Präparate, Tabletten, Pulver & Co.
      </div>
    </Card>
  );
}

function HormonSection() {
  const { hormone, hormonDosierung, hormonHinzufuegen, hormonEntfernen, hormonErledigt, toggleHormonErledigt, hormonPlan } = useAppData();
  const [neuesHormon, setNeuesHormon] = useState({
    name: "",
    menge: "",
    intervallDays: 7,
    customDays: "",
    eigenerStart: "",
    uhrzeit: "20:00",
  });
  const today = new Date();

  const submit = () => {
    hormonHinzufuegen(neuesHormon);
    setNeuesHormon({ name: "", menge: "", intervallDays: 7, customDays: "", eigenerStart: "", uhrzeit: "20:00" });
  };

  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Neues Hormon / Präparat hinzufügen</div>
        <Label>Name</Label>
        <TextInput value={neuesHormon.name} onChange={(v) => setNeuesHormon((p) => ({ ...p, name: v }))} placeholder="z. B. Testosteron Enantat" />
        <Label>Menge</Label>
        <TextInput value={neuesHormon.menge} onChange={(v) => setNeuesHormon((p) => ({ ...p, menge: v }))} placeholder="z. B. 100 mg" />
        <Label>Intervall</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {INTERVALL_OPTIONEN.map((opt) => (
            <Pill key={opt.label} label={opt.label} selected={neuesHormon.intervallDays === opt.days} onClick={() => setNeuesHormon((p) => ({ ...p, intervallDays: opt.days }))} />
          ))}
        </div>
        {neuesHormon.intervallDays === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: textMuted }}>Alle</span>
            <div style={{ width: 70 }}>
              <TextInput type="number" value={neuesHormon.customDays} onChange={(v) => setNeuesHormon((p) => ({ ...p, customDays: v }))} placeholder="10" />
            </div>
            <span style={{ fontSize: 13, color: textMuted }}>Tage</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label>Eigenes Startdatum (optional)</Label>
            <TextInput type="date" value={neuesHormon.eigenerStart} onChange={(v) => setNeuesHormon((p) => ({ ...p, eigenerStart: v }))} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Erinnerungs-Uhrzeit</Label>
            <TextInput type="time" value={neuesHormon.uhrzeit} onChange={(v) => setNeuesHormon((p) => ({ ...p, uhrzeit: v }))} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neuesHormon.name.trim() || (neuesHormon.intervallDays === "custom" && !neuesHormon.customDays)}>
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
                const k = `${toLocalISODate(dose.date)}__${dose.name}`;
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
                        onClick={() => toggleHormonErledigt(toLocalISODate(dose.date), dose.name)}
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
                    {fmtDate(dose.date)} · {dose.name}
                  </div>
                  <div style={{ fontSize: 12, color: textMuted }}>{dose.menge}</div>
                </div>
              ))}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Hormon-Protokoll verwalten</div>
          <Card style={{ marginBottom: 14 }}>
            {hormone.map((h, i) => (
              <div key={h} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < hormone.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{h}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>
                    {hormonDosierung[h]?.menge} ·{" "}
                    {hormonDosierung[h]?.intervallDays === "custom" ? `alle ${hormonDosierung[h]?.customDays} Tage` : INTERVALL_OPTIONEN.find((o) => o.days === hormonDosierung[h]?.intervallDays)?.label}
                  </div>
                </div>
                <button onClick={() => hormonEntfernen(h)} style={{ border: "none", background: "transparent", color: "#F2596A", fontSize: 16, cursor: "pointer" }}>
                  ×
                </button>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function SchlafSection() {
  const { schlafEintraege, schlafHinzufuegen, schlafDurchschnitt7Tage } = useAppData();
  const [neuerSchlafEintrag, setNeuerSchlafEintrag] = useState({ datum: new Date().toISOString().slice(0, 10), stunden: "" });

  const submit = () => {
    schlafHinzufuegen(neuerSchlafEintrag);
    setNeuerSchlafEintrag({ datum: new Date().toISOString().slice(0, 10), stunden: "" });
  };

  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🌙 Und, wie hast du geschlafen?</div>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Trag's ein, bevor der Tag dich einholt — dauert 10 Sekunden.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Datum</Label>
            <TextInput type="date" value={neuerSchlafEintrag.datum} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, datum: v }))} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Stunden</Label>
            <TextInput type="number" value={neuerSchlafEintrag.stunden} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, stunden: v }))} placeholder="7,2" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <PrimaryButton onClick={submit}>Eintrag hinzufügen</PrimaryButton>
        </div>
      </Card>

      {schlafEintraege.length > 0 && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{schlafDurchschnitt7Tage ?? "—"} h</div>
                <div style={{ fontSize: 11, color: textMuted }}>Ø letzte 7 Tage</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{schlafEintraege.length}</div>
                <div style={{ fontSize: 11, color: textMuted }}>Einträge gesamt</div>
              </div>
            </div>
            {schlafEintraege.length >= 2 && <SimpleLineChart data={schlafEintraege.slice(-14)} dataKey="stunden" stroke={blue} />}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Letzte Einträge</div>
          <Card style={{ marginBottom: 14 }}>
            {schlafEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}>
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <span style={{ fontWeight: 700 }}>{e.stunden} h</span>
                </div>
              ))}
          </Card>
        </>
      )}
    </>
  );
}

function PeptideSection() {
  const { plan, erledigt, feedback, saveFeedback, skipFeedback } = useAppData();
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });

  const today = new Date();
  const heuteDosen = plan.filter((d) => sameDay(d.date, today));
  const kommendeDosen = plan.filter((d) => d.date > today && !sameDay(d.date, today)).slice(0, 8);

  const statusOf = (dose) => {
    const k = keyOf(dose.date, dose.peptid);
    if (erledigt[k]) return "erledigt";
    if (dose.date < today && !sameDay(dose.date, today)) return "verpasst";
    return "geplant";
  };

  const openFeedback = (dose) => {
    setFeedbackOpen(keyOf(dose.date, dose.peptid));
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
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Heute</div>
      <Card style={{ marginBottom: 14 }}>
        {heuteDosen.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Heute steht nichts an. 🌿</div>}
        {heuteDosen.map((dose, i) => {
          const st = statusOf(dose);
          const k = keyOf(dose.date, dose.peptid);
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
                {fmtDate(dose.date)} · {dose.peptid}
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
                <div style={{ fontSize: 12, fontWeight: 700 }}>{k.split("__")[1]}</div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {fb.staerke && fb.staerke !== "Keine" ? `${fb.nebenwirkungen.join(", ") || "—"} (${fb.staerke})` : "Keine Nebenwirkungen"}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}
