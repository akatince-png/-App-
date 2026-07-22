import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../ui/primitives";
import { accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";

const ICON_OPTIONEN = ["☀️", "🍳", "💉", "🏋️", "🥗", "🌙", "😴", "💧", "⭐"];
const KATEGORIE_TABS = [
  { id: "peptid", label: "Peptide" },
  { id: "hormon", label: "Medikamente" },
  { id: "supplement", label: "Supplemente" },
  { id: "mahlzeit", label: "Mahlzeiten" },
];

const LEERE_ROUTINE = { name: "", icon: "⭐", uhrzeit: "" };

export default function RoutinenView({ onHome }) {
  const {
    routinen,
    routineHinzufuegen,
    routineEntfernen,
    routineItemHinzufuegen,
    routineItemEntfernen,
    peptide,
    dosierung,
    hormone,
    hormonDosierung,
    supplemente,
    mahlzeiten,
  } = useAppData();

  const [neueRoutine, setNeueRoutine] = useState(LEERE_ROUTINE);
  const [routineError, setRoutineError] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(null); // routineId
  const [pickerKategorie, setPickerKategorie] = useState("peptid");

  const submit = async () => {
    setRoutineError(null);
    const result = await routineHinzufuegen(neueRoutine);
    if (!result?.ok) {
      setRoutineError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeueRoutine(LEERE_ROUTINE);
  };

  const verfuegbareItems = (routine, kategorie) => {
    const vorhandeneRefIds = new Set(routine.items.filter((i) => i.type === kategorie).map((i) => i.refId));
    if (kategorie === "peptid") {
      return peptide.filter((name) => dosierung[name]?.id && !vorhandeneRefIds.has(dosierung[name].id)).map((name) => ({ refId: dosierung[name].id, name }));
    }
    if (kategorie === "hormon") {
      return hormone.filter((name) => hormonDosierung[name]?.id && !vorhandeneRefIds.has(hormonDosierung[name].id)).map((name) => ({ refId: hormonDosierung[name].id, name }));
    }
    if (kategorie === "supplement") {
      return supplemente.filter((s) => !vorhandeneRefIds.has(s.id)).map((s) => ({ refId: s.id, name: s.name }));
    }
    return mahlzeiten.filter((m) => !vorhandeneRefIds.has(m.id)).map((m) => ({ refId: m.id, name: m.name }));
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>⭐ Routinen</div>
        <button
          className="mp-tap"
          onClick={onHome}
          style={{ width: 40, height: 40, borderRadius: 13, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 16, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 18 }}>
        Fasse mehrere Einträge (z. B. Kreatin, Magnesium, Vitamin D) zu einem Punkt zusammen, den du im Tagesplan
        mit einem Tap bestätigst.
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neue Routine</div>
      <Card style={{ marginBottom: 16 }}>
        <Label>Name</Label>
        <TextInput value={neueRoutine.name} onChange={(v) => setNeueRoutine((p) => ({ ...p, name: v }))} placeholder="z. B. Morgendrink" />

        <Label>Symbol</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {ICON_OPTIONEN.map((icon) => (
            <Pill key={icon} label={icon} selected={neueRoutine.icon === icon} onClick={() => setNeueRoutine((p) => ({ ...p, icon }))} />
          ))}
        </div>

        <Label>Uhrzeit (optional)</Label>
        <TextInput type="time" value={neueRoutine.uhrzeit} onChange={(v) => setNeueRoutine((p) => ({ ...p, uhrzeit: v }))} />

        {routineError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{routineError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neueRoutine.name.trim()}>
            + Routine anlegen
          </PrimaryButton>
        </div>
      </Card>

      {routinen.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Routinen angelegt — leg oben deine erste an.
          </div>
        </Card>
      ) : (
        routinen.map((r) => (
          <Card key={r.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 20 }}>{r.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</div>
                  {r.uhrzeit && <div style={{ fontSize: 11, color: textMuted }}>{r.uhrzeit}</div>}
                </div>
              </div>
              <button
                onClick={() => routineEntfernen(r.id)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {r.items.length === 0 && <div style={{ fontSize: 12, color: textMuted, fontStyle: "italic" }}>Noch keine Einträge enthalten.</div>}
              {r.items.map((item) => (
                <div
                  key={`${item.type}-${item.linkId}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}
                >
                  <div style={{ fontSize: 13 }}>
                    {item.name} {item.detail && <span style={{ color: textMuted, fontSize: 11 }}>· {item.detail}</span>}
                  </div>
                  <button
                    onClick={() => routineItemEntfernen(item.type, item.linkId)}
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 15, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {pickerOpen === r.id ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
                  {KATEGORIE_TABS.map((t) => (
                    <Pill key={t.id} label={t.label} selected={pickerKategorie === t.id} onClick={() => setPickerKategorie(t.id)} />
                  ))}
                </div>
                {verfuegbareItems(r, pickerKategorie).length === 0 ? (
                  <div style={{ fontSize: 12, color: textMuted }}>Nichts mehr zum Hinzufügen — schon alles enthalten oder noch nichts angelegt.</div>
                ) : (
                  verfuegbareItems(r, pickerKategorie).map((it) => (
                    <div key={it.refId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <div style={{ fontSize: 13 }}>{it.name}</div>
                      <button
                        className="mp-tap"
                        onClick={() => routineItemHinzufuegen(r.id, pickerKategorie, it.refId)}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: accentDark, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        + Hinzufügen
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setPickerOpen(null)}
                  style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: 8, border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer" }}
                >
                  Fertig
                </button>
              </div>
            ) : (
              <button
                className="mp-tap"
                onClick={() => {
                  setPickerOpen(r.id);
                  setPickerKategorie("peptid");
                }}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "9px",
                  borderRadius: 10,
                  border: `1px dashed ${cardBorder}`,
                  background: "transparent",
                  color: accentDark,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Element hinzufügen
              </button>
            )}
          </Card>
        ))
      )}
    </Shell>
  );
}
