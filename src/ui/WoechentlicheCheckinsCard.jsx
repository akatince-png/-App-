import React, { useState } from "react";
import { Card, Label, Pill, PrimaryButton, TextInput } from "./primitives";
import { SignedPhoto } from "./SignedPhoto";
import { accentDark, accentSoft, cardBorder, textMuted } from "./theme";
import { ENERGIELEVEL_OPTIONEN, FOTO_KATEGORIEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

function leererEintrag(aktiveMesswerte) {
  const base = { datum: new Date().toISOString().slice(0, 10) };
  aktiveMesswerte.forEach((id) => (base[id] = ""));
  return base;
}

// "Wöchentliche Check-ins"-Karte, geteilt zwischen ProfilTab (laufende
// Pflege) und dem "Profil & Ausgangslage"-Schritt im Onboarding
// (Ersteingabe) — siehe LaborwerteFelder für dasselbe Muster.
export default function WoechentlicheCheckinsCard() {
  const { aktiveMesswerte, toggleMesswert, combinedMesswertDefs, addCustomMesswert, gewichtsEintraege, gewichtHinzufuegen } = useAppData();

  const [neueVariable, setNeueVariable] = useState("");
  const [neuerEintrag, setNeuerEintrag] = useState(() => leererEintrag(aktiveMesswerte));
  const [pendingFotos, setPendingFotos] = useState([]); // [{kategorie, file, previewUrl}]
  const [fotoKategorie, setFotoKategorie] = useState(FOTO_KATEGORIEN[0]);

  const setEintragFeld = (id, val) => setNeuerEintrag((prev) => ({ ...prev, [id]: val }));

  const variableHinzufuegen = () => {
    if (!neueVariable.trim()) return;
    addCustomMesswert(neueVariable);
    setNeueVariable("");
  };

  const handleEintragFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFotos((prev) => [...prev.filter((f) => f.kategorie !== fotoKategorie), { kategorie: fotoKategorie, file, previewUrl: URL.createObjectURL(file) }]);
    e.target.value = "";
  };

  const submitEintrag = async () => {
    await gewichtHinzufuegen(neuerEintrag, aktiveMesswerte, combinedMesswertDefs, pendingFotos);
    setNeuerEintrag(leererEintrag(aktiveMesswerte));
    setPendingFotos([]);
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Wöchentliche Check-ins</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Welche Messwerte willst du tracken?</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {combinedMesswertDefs.map((d) => (
            <Pill key={d.id} label={d.label} selected={aktiveMesswerte.includes(d.id)} onClick={() => toggleMesswert(d.id)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={neueVariable} onChange={setNeueVariable} placeholder="Eigene Variable, z. B. Wadenumfang" />
          </div>
          <button
            onClick={variableHinzufuegen}
            style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
          >
            +
          </button>
        </div>

        <div style={{ height: 1, background: cardBorder, margin: "16px 0" }} />

        <Label>Datum</Label>
        <TextInput type="date" value={neuerEintrag.datum} onChange={(v) => setEintragFeld("datum", v)} />

        {aktiveMesswerte.map((id) => {
          const def = combinedMesswertDefs.find((d) => d.id === id);
          if (!def) return null;
          if (def.emoji) {
            return (
              <div key={id}>
                <Label>{def.label}</Label>
                <div style={{ display: "flex", gap: 6 }}>
                  {ENERGIELEVEL_OPTIONEN.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEintragFeld(id, e)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        fontSize: 16,
                        border: `1px solid ${neuerEintrag[id] === e ? "#0FB8A3" : cardBorder}`,
                        background: neuerEintrag[id] === e ? accentSoft : "#FAFEFC",
                        cursor: "pointer",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={id}>
              <Label>
                {def.label} {def.unit && `(${def.unit})`}
              </Label>
              <TextInput type={def.numeric ? "number" : "text"} value={neuerEintrag[id] ?? ""} onChange={(v) => setEintragFeld(id, v)} placeholder={def.numeric ? "0" : ""} />
            </div>
          );
        })}

        <Label>Foto hinzufügen (optional)</Label>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 6 }}>
          {FOTO_KATEGORIEN.map((k) => (
            <Pill key={k} label={k} selected={fotoKategorie === k} onClick={() => setFotoKategorie(k)} />
          ))}
        </div>
        <input type="file" accept="image/*" id="eintrag-foto" style={{ display: "none" }} onChange={handleEintragFoto} />
        <label
          htmlFor="eintrag-foto"
          style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 10, border: `1.5px dashed #0FB8A3`, background: accentSoft, color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          📷 {fotoKategorie}-Foto aufnehmen
        </label>
        {pendingFotos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {pendingFotos.map((f, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <img src={f.previewUrl} alt={f.kategorie} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, border: `1px solid ${cardBorder}` }} />
                <div style={{ fontSize: 10, color: textMuted }}>{f.kategorie}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <PrimaryButton onClick={submitEintrag}>Eintrag hinzufügen</PrimaryButton>
        </div>

        {gewichtsEintraege.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {gewichtsEintraege
              .slice()
              .reverse()
              .map((e, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: textMuted }}>{e.datum}</span>
                    <span style={{ fontWeight: 700 }}>
                      {aktiveMesswerte
                        .map((id) => {
                          const def = combinedMesswertDefs.find((d) => d.id === id);
                          return e[id] !== "" && e[id] !== undefined ? `${e[id]}${def?.unit ? " " + def.unit : ""}` : null;
                        })
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  {e.fotos?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      {e.fotos.map((f, j) => (
                        <SignedPhoto key={j} path={f.path} alt={f.kategorie} size={30} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </Card>
    </>
  );
}
