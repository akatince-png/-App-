import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextArea, TextInput, CheckRow } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import { accentDark, cardBorder, textMain, textMuted } from "../ui/theme";
import { DURSTGEFUEHL_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

const heute = () => new Date().toISOString().slice(0, 10);

const SCHNELLAUSWAHL = [
  { label: "Glas", ml: 200 },
  { label: "Tasse", ml: 150 },
  { label: "Flasche", ml: 500 },
  { label: "Große Flasche", ml: 750 },
];

function motivationsText(heuteMl, zielMl) {
  if (zielMl === 0) return "Trag dein Tagesziel ein, um loszulegen.";
  if (heuteMl === 0) return "Noch nichts getrunken — leg los mit einem Glas.";
  if (heuteMl >= zielMl) return "Tagesziel erreicht. Stark! 🎉";
  const rest = zielMl - heuteMl;
  if (heuteMl / zielMl >= 0.66) return `Fast geschafft, noch ${rest} ml.`;
  return `Noch ${rest} ml bis zum Ziel.`;
}

export default function HydrationView({ onHome }) {
  const {
    hydrationEintraege,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    hydrationZielSetzen,
    hydrationCheckinSpeichern,
  } = useAppData();
  const [zielEntwurf, setZielEntwurf] = useState(String(hydrationZielMl));
  const [korrekturEntwurf, setKorrekturEntwurf] = useState("");

  const heutigerEintrag = hydrationEintraege.find((e) => e.datum === heute());
  const [elektrolyte, setElektrolyte] = useState(heutigerEintrag?.elektrolyte || false);
  const [durstgefuehl, setDurstgefuehl] = useState(heutigerEintrag?.durstgefuehl || "");
  const [bemerkung, setBemerkung] = useState(heutigerEintrag?.bemerkung || "");

  const checkinSpeichern = (felder) => hydrationCheckinSpeichern(felder);

  const zielSpeichern = () => hydrationZielSetzen(zielEntwurf);

  const korrekturSetzen = () => {
    if (korrekturEntwurf === "") return;
    hydrationHinzufuegen(Number(korrekturEntwurf) - hydrationHeuteMl);
    setKorrekturEntwurf("");
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>💧 Hydration</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ProgressRing done={hydrationHeuteMl} total={hydrationZielMl} size={92} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accentDark }}>
          {hydrationHeuteMl} <span style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>/ {hydrationZielMl} ml</span>
        </div>
        <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>{motivationsText(hydrationHeuteMl, hydrationZielMl)}</div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Schnell hinzufügen</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCHNELLAUSWAHL.map((opt) => (
            <button
              key={opt.label}
              className="mp-btn"
              onClick={() => hydrationHinzufuegen(opt.ml)}
              style={{
                minHeight: 64,
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
                background: "#FAFBFA",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: textMain }}>+{opt.ml} ml</span>
              <span style={{ fontSize: 11.5, color: textMuted }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verschätzt?</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Trag die tatsächliche Gesamtmenge für heute ein, um einen falschen Tipp zu korrigieren.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <TextInput type="number" value={korrekturEntwurf} onChange={setKorrekturEntwurf} placeholder={`z. B. ${hydrationHeuteMl}`} />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={korrekturSetzen}>
              Setzen
            </PrimaryButton>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Tages-Check-in (optional)</div>
      <Card style={{ marginBottom: 14 }}>
        <CheckRow
          label="Elektrolyte genommen"
          checked={elektrolyte}
          onToggle={() => {
            const next = !elektrolyte;
            setElektrolyte(next);
            checkinSpeichern({ elektrolyte: next });
          }}
        />
        <Label>Durstgefühl heute</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {DURSTGEFUEHL_OPTIONEN.map((d) => (
            <Pill
              key={d}
              label={d}
              selected={durstgefuehl === d}
              onClick={() => {
                setDurstgefuehl(d);
                checkinSpeichern({ durstgefuehl: d });
              }}
            />
          ))}
        </div>
        <Label>Bemerkungen (optional)</Label>
        <TextArea value={bemerkung} onChange={setBemerkung} placeholder="z. B. heute viel geschwitzt" />
        <div style={{ marginTop: 10 }}>
          <PrimaryButton variant="ghost" onClick={() => checkinSpeichern({ bemerkung })}>
            Bemerkung speichern
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Tagesziel</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Ziel in ml</Label>
            <TextInput type="number" value={zielEntwurf} onChange={setZielEntwurf} placeholder="2500" />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={zielSpeichern}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
      </Card>

      {hydrationEintraege.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
          <Card>
            {hydrationEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.datum}
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}
                >
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <span style={{ fontWeight: 700 }}>{e.mengeMl} ml</span>
                </div>
              ))}
          </Card>
        </>
      )}
    </Shell>
  );
}
