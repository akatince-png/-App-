import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextArea, CheckRow } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import ProgressRing from "../ui/ProgressRing";
import GrundEingabe from "../ui/GrundEingabe";
import ZeitErinnerungenCard from "../ui/ZeitErinnerungenCard";
import { cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { DURSTGEFUEHL_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";
import NumberWheelField from "../ui/NumberWheelField";
import { KATEGORIE_META } from "../utils/dayItems";
import { toLocalISODate } from "../utils/dates";
import { useZielMitKorrektur } from "../ui/useZielMitKorrektur";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe — Hydration
// ist Blau, passend zu den bunten Home-Mini-Widgets.
const { text: accentDark } = KATEGORIE_META.hydration;

const heute = () => toLocalISODate(new Date());

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

export default function HydrationView({ onHome, embedded = false }) {
  const {
    hydrationEintraege,
    hydrationHeuteMl,
    hydrationZielMl,
    hydrationHinzufuegen,
    hydrationZielSetzen,
    hydrationZielZuruecksetzen,
    hydrationCheckinSpeichern,
    aenderungVermerken,
  } = useAppData();
  const {
    zielEntwurf,
    setZielEntwurf,
    korrekturEntwurf,
    setKorrekturEntwurf,
    zielGrund,
    setZielGrund,
    fehler: hydrationError,
    setFehler: setHydrationError,
    schnellHinzufuegen,
    zielSpeichern,
    zielZuruecksetzen,
    korrekturSetzen,
  } = useZielMitKorrektur({
    zielWert: hydrationZielMl,
    heuteWert: hydrationHeuteMl,
    hinzufuegen: hydrationHinzufuegen,
    zielSetzen: hydrationZielSetzen,
    zielZuruecksetzen: hydrationZielZuruecksetzen,
    aenderungVermerken,
    kategorie: "hydration",
    itemName: "Trinkziel",
    einheit: "ml",
    kachelName: "Wasser",
    defaultZiel: 2500,
  });

  const heutigerEintrag = hydrationEintraege.find((e) => e.datum === heute());
  const [elektrolyte, setElektrolyte] = useState(heutigerEintrag?.elektrolyte || false);
  const [durstgefuehl, setDurstgefuehl] = useState(heutigerEintrag?.durstgefuehl || "");
  const [bemerkung, setBemerkung] = useState(heutigerEintrag?.bemerkung || "");

  const checkinSpeichern = async (felder) => {
    setHydrationError(null);
    const result = await hydrationCheckinSpeichern(felder);
    if (!result?.ok) setHydrationError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="💧 Wasser" onHome={onHome} />
      )}

      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ProgressRing done={hydrationHeuteMl} total={hydrationZielMl} size={92} color={accentDark} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accentDark }}>
          {hydrationHeuteMl} <span style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>/ {hydrationZielMl} ml</span>
        </div>
        <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>{motivationsText(hydrationHeuteMl, hydrationZielMl)}</div>
      </Card>

      {hydrationError && (
        <div style={{ fontSize: 12.5, color: danger, marginBottom: 14, textAlign: "center" }}>{hydrationError}</div>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Schnell hinzufügen</div>
      <Card akzent style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCHNELLAUSWAHL.map((opt) => (
            <button
              key={opt.label}
              className="mp-btn"
              onClick={() => schnellHinzufuegen(opt.ml)}
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
            <NumberWheelField value={korrekturEntwurf} onChange={setKorrekturEntwurf} min={0} max={5000} step={50} placeholder={`z. B. ${hydrationHeuteMl}`} />
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
            <NumberWheelField value={zielEntwurf} onChange={setZielEntwurf} min={500} max={5000} step={50} placeholder="2500" />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={zielSpeichern}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
        <GrundEingabe grund={zielGrund} onChange={setZielGrund} />
        {hydrationZielMl !== 2500 && (
          <button
            type="button"
            onClick={zielZuruecksetzen}
            style={{ marginTop: 10, border: "none", background: "transparent", color: danger, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            Ziel zurücksetzen
          </button>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerungen</div>
      <Card style={{ marginBottom: 14 }}>
        <ZeitErinnerungenCard
          kategorie="hydration"
          labelKey="onboarding.hydration.erinnerungszeiten.label"
          mengeLabel="ml"
          mengeStandard="300"
        />
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
    </>
  );
  return embedded ? content : <Shell bereich="hydration">{content}</Shell>;
}
