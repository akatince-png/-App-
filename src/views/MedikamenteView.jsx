import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import DosierungFields from "../ui/DosierungFields";
import DosisBearbeitenPanel from "../ui/DosisBearbeitenPanel";
import { SignedPhoto } from "../ui/SignedPhoto";
import AutocompleteInput from "../ui/AutocompleteInput";
import { accentSoft, cardBorder, danger, textMuted } from "../ui/theme";
import { EINNAHMEARTEN, MEDIKAMENTE_KATEGORIEN, NEBENWIRKUNGEN_OPTIONEN, PEPTIDE_OPTIONEN, VERTRAEGLICHKEIT_OPTIONEN, WIRKUNG_OPTIONEN } from "../constants";
import { describeInterval } from "../utils/schedule";
import { fmtDate, sameDay, toLocalISODate, verspaetungText } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import { KATEGORIE_META } from "../utils/dayItems";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe — Medikamente
// sind Lila, passend zu den bunten Home-Mini-Widgets.
const { dot: accent, text: accentDark } = KATEGORIE_META.hormon;

const DOSIS_FELDER = ["menge", "customDays", "onDays", "offDays", "eigenerStart", "weekdays", "uhrzeiten"];

const NEUES_MEDIKAMENT_LEER = {
  name: "",
  menge: "",
  kategorie: "Hormone",
  einnahmeart: "Injektion",
  intervallTyp: "fixed",
  intervallDays: 7,
  customDays: "",
  onDays: "",
  offDays: "",
  weekdays: [],
  eigenerStart: "",
  uhrzeiten: ["20:00"],
};

function intervallGueltig(d) {
  if (d.intervallTyp === "custom") return !!d.customDays && Number(d.customDays) > 0;
  if (d.intervallTyp === "cycle") return !!d.onDays && Number(d.onDays) > 0 && d.offDays !== "";
  if (d.intervallTyp === "weekdays") return (d.weekdays || []).length > 0;
  return true;
}

export default function MedikamenteView({ onHome, embedded = false }) {
  const {
    hormone,
    hormonDosierung,
    hormonHinzufuegen,
    hormonEntfernen,
    setHormonFoto,
    setHormonKategorie,
    setHormonEinnahmeart,
    setHormonDoseBatch,
    hormonErledigt,
    hormonFeedback,
    saveHormonFeedback,
    skipHormonFeedback,
    hormonPlan,
    aenderungVermerken,
  } = useAppData();
  const [neuesMedikament, setNeuesMedikament] = useState(NEUES_MEDIKAMENT_LEER);
  const [medikamentError, setMedikamentError] = useState(null);
  const [dosisEditOffen, setDosisEditOffen] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ vertraeglichkeit: "", wirkung: "", nebenwirkungen: [], notizen: "" });
  const today = new Date();

  const openFeedback = (k) => {
    setFeedbackOpen(k);
    setDraftFeedback({ vertraeglichkeit: "", wirkung: "", nebenwirkungen: [], notizen: "" });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));
  // Lückenloses Tagesprotokoll (Nutzerinnen-Vorgabe 28.07.): jede
  // Bestätigung wird — inkl. Verspätung gegenüber der geplanten Uhrzeit —
  // im bereichsübergreifenden Änderungsprotokoll vermerkt.
  const protokollZeile = (dose, feedback) => {
    const verspaetung = verspaetungText(dose.uhrzeit);
    const teile = [verspaetung];
    if (feedback?.vertraeglichkeit) teile.push(`Verträglichkeit: ${feedback.vertraeglichkeit}`);
    if (feedback?.wirkung) teile.push(`Wirkung: ${feedback.wirkung}`);
    if ((feedback?.nebenwirkungen || []).length > 0) teile.push(`Nebenwirkungen: ${feedback.nebenwirkungen.join(", ")}`);
    if (feedback?.notizen) teile.push(feedback.notizen);
    return teile.filter(Boolean).join(" · ");
  };

  const handleFeedbackSave = (dose) => {
    saveHormonFeedback(dose, draftFeedback);
    aenderungVermerken({ kategorie: "hormon", itemName: dose.name, aktion: "erledigt", detail: protokollZeile(dose, draftFeedback) });
    setFeedbackOpen(null);
  };
  const handleFeedbackSkip = (dose) => {
    skipHormonFeedback(dose);
    aenderungVermerken({ kategorie: "hormon", itemName: dose.name, aktion: "erledigt", detail: protokollZeile(dose, null) });
    setFeedbackOpen(null);
  };

  const handleChange = (feld, val) => {
    setNeuesMedikament((prev) => {
      if (feld === "intervallPreset") return { ...prev, intervallTyp: "fixed", intervallDays: val };
      return { ...prev, [feld]: val };
    });
  };

  const submit = async () => {
    setMedikamentError(null);
    const result = await hormonHinzufuegen(neuesMedikament);
    if (!result?.ok) {
      setMedikamentError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    aenderungVermerken({
      kategorie: "hormon",
      itemName: neuesMedikament.name,
      aktion: "hinzugefügt",
      detail: `${neuesMedikament.kategorie} · ${neuesMedikament.menge || "–"}`,
    });
    setNeuesMedikament(NEUES_MEDIKAMENT_LEER);
  };

  // Übergabe an <KiChat onUebernehmen>: legt das im Gespräch besprochene
  // Medikament über denselben Weg an wie das manuelle Formular unten.
  const handleMedikamentUebernehmen = async (verlauf) => {
    const m = await AIService.medikamentAusChat({ verlauf, coachName: getCoachName() });
    const payload = {
      name: m.name,
      menge: m.menge || "",
      kategorie: m.kategorie || "Sonstige",
      einnahmeart: m.einnahmeart || "Tablette (oral)",
      intervallTyp: m.intervallTyp || "fixed",
      intervallDays: m.intervallDays || 1,
      customDays: m.customDays || "",
      onDays: m.onDays || "",
      offDays: m.offDays || "",
      weekdays: m.weekdays || [],
      eigenerStart: m.eigenerStart || "",
      uhrzeiten: m.uhrzeiten?.length ? m.uhrzeiten : ["20:00"],
    };
    const result = await hormonHinzufuegen(payload);
    if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken({ kategorie: "hormon", itemName: m.name, aktion: "hinzugefügt", detail: `${payload.kategorie} · ${payload.menge || "–"}` });
    return payload;
  };

  const handleFoto = (name, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHormonFoto(name, file);
    e.target.value = "";
  };

  const handleEntfernen = (h) => {
    aenderungVermerken({
      kategorie: "hormon",
      itemName: h,
      aktion: "entfernt",
      detail: `${hormonDosierung[h]?.menge || "–"}`,
    });
    hormonEntfernen(h);
  };

  const handleDosisSpeichern = (h, entwurf, grund) => {
    const vorher = hormonDosierung[h];
    const aenderungen = [];
    if (entwurf.menge !== vorher.menge) aenderungen.push(`Menge: ${vorher.menge || "–"} → ${entwurf.menge || "–"}`);
    if (entwurf.intervallTyp !== vorher.intervallTyp || entwurf.intervallDays !== vorher.intervallDays) {
      aenderungen.push(`Intervall: ${describeInterval(vorher)} → ${describeInterval(entwurf)}`);
    }
    if (JSON.stringify(entwurf.uhrzeiten) !== JSON.stringify(vorher.uhrzeiten)) {
      aenderungen.push(`Uhrzeit: ${(vorher.uhrzeiten || []).join(", ")} → ${(entwurf.uhrzeiten || []).join(", ")}`);
    }
    if (aenderungen.length > 0) {
      aenderungVermerken({ kategorie: "hormon", itemName: h, aktion: "geändert", detail: aenderungen.join("; "), grund });
    }
    const felder = {};
    DOSIS_FELDER.forEach((feld) => {
      if (JSON.stringify(entwurf[feld]) !== JSON.stringify(vorher[feld])) felder[feld] = entwurf[feld];
    });
    if (entwurf.intervallTyp === "fixed" && (entwurf.intervallTyp !== vorher.intervallTyp || entwurf.intervallDays !== vorher.intervallDays)) {
      felder.intervallPreset = entwurf.intervallDays;
    } else if (entwurf.intervallTyp !== vorher.intervallTyp) {
      felder.intervallTyp = entwurf.intervallTyp;
    }
    if (Object.keys(felder).length > 0) setHormonDoseBatch(h, felder);
    setDosisEditOffen(null);
  };

  const nachKategorie = MEDIKAMENTE_KATEGORIEN.map((kat) => ({
    kat,
    namen: hormone.filter((h) => (hormonDosierung[h]?.kategorie || "Hormone") === kat),
  })).filter((g) => g.namen.length > 0);

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="💊 Medikamente" onHome={onHome} />
      )}

      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Sag, welches Medikament/Hormon du hinzufügen willst — der Assistent fragt Dosierung, Einnahmeart und Rhythmus ab.
      </div>
      <KiChat
        bereich="medikamente"
        systemPrompt="Du hilfst dabei, ein neues Medikament oder Hormon für eine bestehende App einzurichten. Frag nach, was noch fehlt: Dosierung/Menge, Einnahmeart (Injektion, Tablette, Kapsel, Pulver, Tropfen, Nasenspray), Kategorie, und der Rhythmus (z. B. täglich, alle X Tage, bestimmte Wochentage, oder Zyklus wie 'X Tage nehmen, Y Tage Pause') sowie die Uhrzeit(en). Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Welches Medikament oder Hormon möchtest du hinzufügen?`}
        onUebernehmen={handleMedikamentUebernehmen}
        uebernehmenLabel="Medikament anlegen"
        renderErgebnis={(m) => (
          <div style={{ padding: 12, borderRadius: 12, background: "#EAF0F8", fontSize: 12.5, lineHeight: 1.6 }}>
            "{m.name}" wurde angelegt · {m.kategorie}
            {m.menge ? ` · ${m.menge}` : ""}
          </div>
        )}
      />

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Neues Medikament hinzufügen (manuell)</div>
        <Label>Name</Label>
        {neuesMedikament.kategorie === "Peptid" ? (
          <AutocompleteInput value={neuesMedikament.name} onChange={(v) => handleChange("name", v)} options={PEPTIDE_OPTIONEN} placeholder="z. B. BPC-157" />
        ) : (
          <TextInput value={neuesMedikament.name} onChange={(v) => handleChange("name", v)} placeholder="z. B. Testosteron Enantat" />
        )}

        <Label>Kategorie</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {MEDIKAMENTE_KATEGORIEN.map((kat) => (
            <Pill key={kat} label={kat} selected={neuesMedikament.kategorie === kat} onClick={() => handleChange("kategorie", kat)} />
          ))}
        </div>

        <Label>Einnahmeart</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {EINNAHMEARTEN.map((a) => (
            <Pill key={a} label={a} selected={neuesMedikament.einnahmeart === a} onClick={() => handleChange("einnahmeart", a)} />
          ))}
        </div>

        <DosierungFields value={neuesMedikament} onChange={handleChange} mengePlaceholder="z. B. 100 mg" />

        {medikamentError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{medikamentError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neuesMedikament.name.trim() || !intervallGueltig(neuesMedikament)}>
            + Zum Protokoll hinzufügen
          </PrimaryButton>
        </div>
      </Card>

      {hormone.length === 0 ? (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch nichts im Medikamenten-Protokoll — leg oben dein erstes an.</div>
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
                const angezeigteMenge = done ? hormonFeedback[k]?.menge ?? dose.menge : dose.menge;
                const isOpen = feedbackOpen === k;
                const fb = hormonFeedback[k];
                return (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {dose.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {dose.uhrzeit}</span>
                        </div>
                        <div style={{ fontSize: 12, color: textMuted }}>
                          {angezeigteMenge} · {dose.einnahmeart}
                        </div>
                      </div>
                      {done ? (
                        <StatusBadge status="erledigt" />
                      ) : (
                        <button
                          onClick={() => openFeedback(k)}
                          style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Bestätigen
                        </button>
                      )}
                    </div>

                    {done && fb && (fb.wirkung || fb.vertraeglichkeit || (fb.nebenwirkungen || []).length > 0) && (
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
                        {fb.wirkung && `Wirkung: ${fb.wirkung}`}
                        {fb.vertraeglichkeit && ` · Verträglichkeit: ${fb.vertraeglichkeit}`}
                        {(fb.nebenwirkungen || []).length > 0 && ` · Nebenwirkungen: ${fb.nebenwirkungen.join(", ")}`}
                      </div>
                    )}

                    {isOpen && (
                      <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Hast du deine Tabletten/Dosis genommen? Geht's dir gut, oder gibt's was zu vermerken?</div>
                        <Label>Verträglichkeit</Label>
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          {VERTRAEGLICHKEIT_OPTIONEN.map((v) => (
                            <Pill key={v} label={v} selected={draftFeedback.vertraeglichkeit === v} onClick={() => setDraftFeedback((p) => ({ ...p, vertraeglichkeit: v }))} />
                          ))}
                        </div>
                        <Label>Spürst du eine Wirkung?</Label>
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          {WIRKUNG_OPTIONEN.map((w) => (
                            <Pill key={w} label={w} selected={draftFeedback.wirkung === w} onClick={() => setDraftFeedback((p) => ({ ...p, wirkung: w }))} />
                          ))}
                        </div>
                        <Label>Nebenwirkungen</Label>
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          {NEBENWIRKUNGEN_OPTIONEN.map((n) => (
                            <Pill key={n} label={n} selected={draftFeedback.nebenwirkungen.includes(n)} onClick={() => toggleDraftNebenwirkung(n)} />
                          ))}
                        </div>
                        <Label>Notizen</Label>
                        <TextArea value={draftFeedback.notizen} onChange={(v) => setDraftFeedback((p) => ({ ...p, notizen: v }))} placeholder="Optional" />
                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                          <div style={{ flex: 1 }}>
                            <PrimaryButton onClick={() => handleFeedbackSkip(dose)} variant="ghost">
                              Ohne Notiz bestätigen
                            </PrimaryButton>
                          </div>
                          <div style={{ flex: 1 }}>
                            <PrimaryButton onClick={() => handleFeedbackSave(dose)} variant="success">
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

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Medikamenten-Protokoll verwalten</div>
          {nachKategorie.map((gruppe) => (
            <React.Fragment key={gruppe.kat}>
              <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>{gruppe.kat}</div>
              <Card style={{ marginBottom: 14 }}>
                {gruppe.namen.map((h, i) => (
                  <div key={h} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: i < gruppe.namen.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {hormonDosierung[h]?.fotoPath && <SignedPhoto path={hormonDosierung[h].fotoPath} alt={h} size={34} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{h}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>
                          {hormonDosierung[h]?.menge} · {hormonDosierung[h]?.einnahmeart || "Injektion"} · {describeInterval(hormonDosierung[h])} ·{" "}
                          {(hormonDosierung[h]?.uhrzeiten || []).join(" & ")}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <select
                            value={hormonDosierung[h]?.kategorie || "Hormone"}
                            onChange={(e) => {
                              const vorher = hormonDosierung[h]?.kategorie || "Hormone";
                              if (e.target.value !== vorher) {
                                aenderungVermerken({ kategorie: "hormon", itemName: h, aktion: "geändert", detail: `Kategorie: ${vorher} → ${e.target.value}` });
                              }
                              setHormonKategorie(h, e.target.value);
                            }}
                            style={{ fontSize: 11, border: `1px solid ${cardBorder}`, borderRadius: 6, padding: "2px 4px", color: textMuted }}
                          >
                            {MEDIKAMENTE_KATEGORIEN.map((kat) => (
                              <option key={kat} value={kat}>
                                {kat}
                              </option>
                            ))}
                          </select>
                          <select
                            value={hormonDosierung[h]?.einnahmeart || "Injektion"}
                            onChange={(e) => {
                              const vorher = hormonDosierung[h]?.einnahmeart || "Injektion";
                              if (e.target.value !== vorher) {
                                aenderungVermerken({ kategorie: "hormon", itemName: h, aktion: "geändert", detail: `Einnahmeart: ${vorher} → ${e.target.value}` });
                              }
                              setHormonEinnahmeart(h, e.target.value);
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
                          onClick={() => setDosisEditOffen(dosisEditOffen === h ? null : h)}
                          style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0, marginTop: 6 }}
                        >
                          {dosisEditOffen === h ? "Dosis-Bearbeitung schließen" : "Dosis bearbeiten"}
                        </button>
                        {dosisEditOffen === h && (
                          <DosisBearbeitenPanel dosierung={hormonDosierung[h]} onSpeichern={(entwurf, grund) => handleDosisSpeichern(h, entwurf, grund)} />
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="file" accept="image/*" id={`medikament-foto-${h}`} style={{ display: "none" }} onChange={(e) => handleFoto(h, e)} />
                      <label htmlFor={`medikament-foto-${h}`} style={{ cursor: "pointer", fontSize: 16 }} title="Foto hinzufügen">
                        📷
                      </label>
                      <button onClick={() => handleEntfernen(h)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            </React.Fragment>
          ))}
        </>
      )}
    </>
  );
  return embedded ? content : <Shell bereich="hormon">{content}</Shell>;
}
