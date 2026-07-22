import React, { useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextArea, TextInput } from "../ui/primitives";
import { SimpleLineChart } from "../ui/charts";
import { accentDark, blue, cardBorder, textMuted } from "../ui/theme";
import { SCHLAFQUALITAET_OPTIONEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

const LEERER_EINTRAG = {
  datum: new Date().toISOString().slice(0, 10),
  stunden: "",
  schlafqualitaet: "",
  einschlafzeit: "",
  durchgeschlafen: null,
  erholt: null,
  traeume: "",
  bemerkungen: "",
};

export default function SchlafView({ onHome }) {
  const { schlafEintraege, schlafHinzufuegen, schlafDurchschnitt7Tage } = useAppData();
  const [neuerSchlafEintrag, setNeuerSchlafEintrag] = useState(LEERER_EINTRAG);
  const [detailsOffen, setDetailsOffen] = useState(false);

  const submit = () => {
    schlafHinzufuegen(neuerSchlafEintrag);
    setNeuerSchlafEintrag(LEERER_EINTRAG);
    setDetailsOffen(false);
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>😴 Schlaf</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

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

        {!detailsOffen ? (
          <button
            onClick={() => setDetailsOffen(true)}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px",
              borderRadius: 10,
              border: `1px dashed ${cardBorder}`,
              background: "transparent",
              color: textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Mehr Details (optional)
          </button>
        ) : (
          <>
            <Label>Schlafqualität</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {SCHLAFQUALITAET_OPTIONEN.map((q) => (
                <Pill
                  key={q}
                  label={q}
                  selected={neuerSchlafEintrag.schlafqualitaet === q}
                  onClick={() => setNeuerSchlafEintrag((p) => ({ ...p, schlafqualitaet: q }))}
                />
              ))}
            </div>
            <Label>Einschlafzeit</Label>
            <TextInput
              type="time"
              value={neuerSchlafEintrag.einschlafzeit}
              onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, einschlafzeit: v }))}
            />
            <div style={{ marginTop: 10 }}>
              <CheckRow
                label="Durchgeschlafen"
                checked={!!neuerSchlafEintrag.durchgeschlafen}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, durchgeschlafen: !p.durchgeschlafen }))}
              />
              <CheckRow
                label="Erholt aufgewacht"
                checked={!!neuerSchlafEintrag.erholt}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, erholt: !p.erholt }))}
              />
            </div>
            <Label>Träume (optional)</Label>
            <TextArea value={neuerSchlafEintrag.traeume} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, traeume: v }))} placeholder="Woran erinnerst du dich?" />
            <Label>Bemerkungen (optional)</Label>
            <TextArea value={neuerSchlafEintrag.bemerkungen} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, bemerkungen: v }))} placeholder="Sonst noch was?" />
          </>
        )}

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
    </Shell>
  );
}
