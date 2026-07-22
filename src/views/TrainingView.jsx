import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextArea, TextInput } from "../ui/primitives";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { TRAININGSARTEN, TRAINING_ENERGIELEVEL_OPTIONEN, SCHMERZEN_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

const LEERE_UEBUNG = { name: "", saetze: "", wiederholungen: "", gewicht: "" };

const LEERER_EINTRAG = {
  datum: new Date().toISOString().slice(0, 10),
  art: "",
  name: "",
  dauerMin: "",
  uebungen: [{ ...LEERE_UEBUNG }],
  distanzKm: "",
  puls: "",
  runden: "",
  rpe: "",
  kalorien: "",
  energielevel: "",
  schmerzen: "",
  bemerkungen: "",
};

function zusammenfassung(e) {
  const teile = [];
  if (e.art === "Krafttraining") {
    const anzahl = (e.uebungen || []).filter((u) => u.name).length;
    if (anzahl) teile.push(`${anzahl} Übung${anzahl === 1 ? "" : "en"}`);
  }
  if (e.dauerMin) teile.push(`${e.dauerMin} min`);
  if (e.distanzKm) teile.push(`${e.distanzKm} km`);
  if (e.puls) teile.push(`Ø ${e.puls} bpm`);
  if (e.runden) teile.push(`${e.runden} Runden`);
  if (e.rpe) teile.push(`RPE ${e.rpe}`);
  return teile.join(" · ") || "—";
}

export default function TrainingView({ onHome }) {
  const { trainingEintraege, trainingHinzufuegen, trainingEntfernen } = useAppData();
  const [eintrag, setEintrag] = useState(LEERER_EINTRAG);
  const [fehler, setFehler] = useState(null);

  const setFeld = (feld, wert) => setEintrag((p) => ({ ...p, [feld]: wert }));

  const uebungAendern = (index, feld, wert) => {
    setEintrag((p) => ({
      ...p,
      uebungen: p.uebungen.map((u, i) => (i === index ? { ...u, [feld]: wert } : u)),
    }));
  };
  const uebungHinzufuegen = () => setEintrag((p) => ({ ...p, uebungen: [...p.uebungen, { ...LEERE_UEBUNG }] }));
  const uebungEntfernen = (index) => setEintrag((p) => ({ ...p, uebungen: p.uebungen.filter((_, i) => i !== index) }));

  const submit = async () => {
    setFehler(null);
    const payload = { ...eintrag };
    if (payload.art === "Krafttraining") {
      payload.uebungen = payload.uebungen.filter((u) => u.name.trim());
    } else {
      payload.uebungen = [];
    }
    const result = await trainingHinzufuegen(payload);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setEintrag({ ...LEERER_EINTRAG, datum: new Date().toISOString().slice(0, 10) });
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🏋️ Training</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Training eintragen</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Datum</Label>
        <TextInput type="date" value={eintrag.datum} onChange={(v) => setFeld("datum", v)} />

        <Label>Art</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TRAININGSARTEN.map((a) => (
            <Pill key={a} label={a} selected={eintrag.art === a} onClick={() => setFeld("art", a)} />
          ))}
        </div>

        {eintrag.art && (
          <>
            <Label>Name (optional)</Label>
            <TextInput value={eintrag.name} onChange={(v) => setFeld("name", v)} placeholder="z. B. Push Day, 5km Lauf" />
          </>
        )}

        {eintrag.art === "Krafttraining" && (
          <>
            <Label>Übungen</Label>
            {eintrag.uebungen.map((u, i) => (
              <div key={i} style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <TextInput value={u.name} onChange={(v) => uebungAendern(i, "name", v)} placeholder="Übung, z. B. Bankdrücken" />
                  </div>
                  {eintrag.uebungen.length > 1 && (
                    <button
                      onClick={() => uebungEntfernen(i)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <TextInput type="number" value={u.saetze} onChange={(v) => uebungAendern(i, "saetze", v)} placeholder="Sätze" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput type="number" value={u.wiederholungen} onChange={(v) => uebungAendern(i, "wiederholungen", v)} placeholder="Wdh." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput value={u.gewicht} onChange={(v) => uebungAendern(i, "gewicht", v)} placeholder="Gewicht" />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={uebungHinzufuegen}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                border: `1px dashed ${cardBorder}`,
                background: "transparent",
                color: accentDark,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 6,
              }}
            >
              + weitere Übung
            </button>
          </>
        )}

        {eintrag.art === "Cardio" && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label>Dauer (min)</Label>
              <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="30" />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Distanz (km)</Label>
              <TextInput type="number" value={eintrag.distanzKm} onChange={(v) => setFeld("distanzKm", v)} placeholder="5" />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Ø Puls</Label>
              <TextInput type="number" value={eintrag.puls} onChange={(v) => setFeld("puls", v)} placeholder="140" />
            </div>
          </div>
        )}

        {eintrag.art === "HIIT / Bodyweight" && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label>Dauer (min)</Label>
              <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="20" />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Runden (optional)</Label>
              <TextInput type="number" value={eintrag.runden} onChange={(v) => setFeld("runden", v)} placeholder="5" />
            </div>
          </div>
        )}

        {eintrag.art === "Sonstiges" && (
          <>
            <Label>Dauer (min)</Label>
            <TextInput type="number" value={eintrag.dauerMin} onChange={(v) => setFeld("dauerMin", v)} placeholder="30" />
          </>
        )}

        {eintrag.art && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Label>RPE (1–10, optional)</Label>
                <TextInput type="number" value={eintrag.rpe} onChange={(v) => setFeld("rpe", v)} placeholder="7" />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Kalorien (optional)</Label>
                <TextInput type="number" value={eintrag.kalorien} onChange={(v) => setFeld("kalorien", v)} placeholder="300" />
              </div>
            </div>

            <Label>Energielevel</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {TRAINING_ENERGIELEVEL_OPTIONEN.map((o) => (
                <Pill key={o} label={o} selected={eintrag.energielevel === o} onClick={() => setFeld("energielevel", o)} />
              ))}
            </div>

            <Label>Schmerzen</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {SCHMERZEN_OPTIONEN.map((o) => (
                <Pill key={o} label={o} selected={eintrag.schmerzen === o} onClick={() => setFeld("schmerzen", o)} />
              ))}
            </div>

            <Label>Bemerkungen (optional)</Label>
            <TextArea value={eintrag.bemerkungen} onChange={(v) => setFeld("bemerkungen", v)} placeholder="Wie ist es gelaufen?" />

            {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
            <div style={{ marginTop: 10 }}>
              <PrimaryButton onClick={submit}>Training speichern</PrimaryButton>
            </div>
          </>
        )}
      </Card>

      {trainingEintraege.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
          <Card>
            {trainingEintraege.map((e, i) => (
              <div
                key={e.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < trainingEintraege.length - 1 ? `1px solid ${cardBorder}` : "none" }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>
                    {e.art}
                    {e.name && <span style={{ fontWeight: 500 }}> · {e.name}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>
                    {e.datum} · {zusammenfassung(e)}
                  </div>
                </div>
                <button
                  onClick={() => trainingEntfernen(e.id)}
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer", flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </Card>
        </>
      )}
    </Shell>
  );
}
