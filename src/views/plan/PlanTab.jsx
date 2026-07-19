import React, { useState } from "react";
import { Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../../ui/primitives";
import { SimpleLineChart } from "../../ui/charts";
import DosierungFields from "../../ui/DosierungFields";
import { SignedPhoto } from "../../ui/SignedPhoto";
import { accentDark, accentSoft, blue, cardBorder, danger, textMuted } from "../../ui/theme";
import { NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN } from "../../constants";
import { describeInterval } from "../../utils/schedule";
import { fmtDate, keyOf, sameDay, toLocalISODate } from "../../utils/dates";
import { useAppData } from "../../context/AppDataContext";

const PROTOKOLL_TYPEN = [
  { id: "peptide", label: "💉 Peptide" },
  { id: "schlaf", label: "😴 Schlaf" },
  { id: "hormon", label: "🧪 Hormone" },
  { id: "weitere", label: "➕ Weitere" },
];

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

function hormonIntervallGueltig(d) {
  if (d.intervallTyp === "custom") return !!d.customDays && Number(d.customDays) > 0;
  if (d.intervallTyp === "cycle") return !!d.onDays && Number(d.onDays) > 0 && d.offDays !== "";
  if (d.intervallTyp === "weekdays") return (d.weekdays || []).length > 0;
  return true;
}

function HormonSection() {
  const { hormone, hormonDosierung, hormonHinzufuegen, hormonEntfernen, setHormonFoto, hormonErledigt, toggleHormonErledigt, hormonPlan } =
    useAppData();
  const [neuesHormon, setNeuesHormon] = useState(NEUES_HORMON_LEER);
  const today = new Date();

  const handleChange = (feld, val) => {
    setNeuesHormon((prev) => {
      if (feld === "intervallPreset") return { ...prev, intervallTyp: "fixed", intervallDays: val };
      return { ...prev, [feld]: val };
    });
  };

  const submit = () => {
    hormonHinzufuegen(neuesHormon);
    setNeuesHormon(NEUES_HORMON_LEER);
  };

  const handleHormonFoto = (name, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHormonFoto(name, file);
    e.target.value = "";
  };

  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Neues Hormon / Präparat hinzufügen</div>
        <Label>Name</Label>
        <TextInput value={neuesHormon.name} onChange={(v) => handleChange("name", v)} placeholder="z. B. Testosteron Enantat" />

        <DosierungFields value={neuesHormon} onChange={handleChange} mengePlaceholder="z. B. 100 mg" />

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

function formatZeitpunkt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function PeptideSection() {
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
    <>
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
    </>
  );
}
