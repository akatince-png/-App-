import React, { useState } from "react";
import { Card, Label, Pill, PrimaryButton, TextInput } from "../../ui/primitives";
import { SignedPhoto } from "../../ui/SignedPhoto";
import { accentDark, accentSoft, cardBorder, danger, success, textMuted } from "../../ui/theme";
import { ENERGIELEVEL_OPTIONEN, FOTO_KATEGORIEN, LABORWERTE_ALLE, LABORWERTE_KATEGORIEN } from "../../constants";
import { useAppData } from "../../context/AppDataContext";

function leererEintrag(aktiveMesswerte) {
  const base = { datum: new Date().toISOString().slice(0, 10) };
  aktiveMesswerte.forEach((id) => (base[id] = ""));
  return base;
}

export default function ProfilTab() {
  const {
    personalData,
    setPersonal,
    aktiveMesswerte,
    toggleMesswert,
    combinedMesswertDefs,
    addCustomMesswert,
    gewichtsEintraege,
    gewichtHinzufuegen,
    schlafDurchschnitt7Tage,
    biomarker,
    setBiomarkerWert,
    handleBlutwertFoto,
    ocrLoading,
    ocrError,
    ocrSuccessCount,
  } = useAppData();

  const [neueVariable, setNeueVariable] = useState("");
  const [neuerEintrag, setNeuerEintrag] = useState(() => leererEintrag(aktiveMesswerte));
  const [pendingFotos, setPendingFotos] = useState([]); // [{kategorie, file, previewUrl}]
  const [fotoKategorie, setFotoKategorie] = useState(FOTO_KATEGORIEN[0]);
  const [offeneKategorien, setOffeneKategorien] = useState(() => new Set());
  const [neuerLaborwertName, setNeuerLaborwertName] = useState("");

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

  const handleBlutwertInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleBlutwertFoto(file);
    e.target.value = "";
  };

  const toggleKategorie = (name) =>
    setOffeneKategorien((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const laborwertHinzufuegen = () => {
    const name = neuerLaborwertName.trim();
    if (!name) return;
    setBiomarkerWert(name, "");
    setNeuerLaborwertName("");
  };

  const eigeneWerte = Object.keys(biomarker).filter((k) => !LABORWERTE_ALLE.includes(k));

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Persönliche Daten</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Geschlecht</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["Weiblich", "Männlich", "Divers"].map((g) => (
            <Pill key={g} label={g} selected={personalData.geschlecht === g} onClick={() => setPersonal("geschlecht", g)} />
          ))}
        </div>
        <Label>Geburtsdatum</Label>
        <TextInput type="date" value={personalData.geburtsdatum} onChange={(v) => setPersonal("geburtsdatum", v)} />
        <Label>Größe (cm)</Label>
        <TextInput type="number" value={personalData.groesse} onChange={(v) => setPersonal("groesse", v)} placeholder="175" />
        <Label>Gewicht Start (kg)</Label>
        <TextInput type="number" value={personalData.gewichtStart} onChange={(v) => setPersonal("gewichtStart", v)} placeholder="85" />
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Diese Woche im Überblick</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: accentDark }}>{schlafDurchschnitt7Tage !== null ? `${schlafDurchschnitt7Tage} h` : "—"}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Ø Schlaf / Woche</div>
          </div>
          {gewichtsEintraege.length > 0 &&
            aktiveMesswerte
              .filter((id) => id !== "energie" && id !== "blutdruck")
              .slice(0, 3)
              .map((id) => {
                const def = combinedMesswertDefs.find((d) => d.id === id);
                const letzter = gewichtsEintraege[gewichtsEintraege.length - 1];
                return (
                  <div key={id}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      {letzter[id] !== "" && letzter[id] !== undefined ? letzter[id] : "—"} {def?.unit}
                    </div>
                    <div style={{ fontSize: 11, color: textMuted }}>{def?.label}</div>
                  </div>
                );
              })}
        </div>
      </Card>

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

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Laborwerte (optional)</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>
          Werte manuell eingeben oder per Kamera aus deinem Laborbericht erfassen — von Blutbild bis Hormone, alles was dein Arzt oder Labor
          dir mitgibt.
        </div>

        <input type="file" accept="image/*" capture="environment" id="blutwerte-foto" style={{ display: "none" }} onChange={handleBlutwertInput} />
        <label
          htmlFor="blutwerte-foto"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px",
            borderRadius: 10,
            border: `1.5px dashed #0FB8A3`,
            background: accentSoft,
            color: accentDark,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            marginTop: 6,
          }}
        >
          {ocrLoading ? "🔎 Werte werden erkannt..." : "📷 Laborbericht per Kamera erfassen"}
        </label>
        {ocrError && <div style={{ fontSize: 12, color: danger, marginBottom: 10 }}>{ocrError}</div>}
        {ocrSuccessCount !== null && !ocrError && <div style={{ fontSize: 12, color: success, marginBottom: 10 }}>{ocrSuccessCount} Werte automatisch übernommen ✓</div>}

        {LABORWERTE_KATEGORIEN.map((kat) => {
          const offen = offeneKategorien.has(kat.kategorie);
          const erfasst = kat.werte.filter((w) => biomarker[w]).length;
          return (
            <div key={kat.kategorie}>
              <button
                onClick={() => toggleKategorie(kat.kategorie)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 2px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: `1px solid ${cardBorder}`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>{kat.kategorie}</span>
                <span style={{ fontSize: 11, color: textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                  {erfasst > 0 && <span style={{ color: success, fontWeight: 700 }}>{erfasst} erfasst</span>}
                  {offen ? "▲" : "▼"}
                </span>
              </button>
              {offen && (
                <div style={{ padding: "2px 0 10px" }}>
                  {kat.werte.map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ fontSize: 13 }}>{b}</span>
                      <div style={{ width: 100 }}>
                        <TextInput value={biomarker[b] || ""} onChange={(v) => setBiomarkerWert(b, v)} placeholder="—" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {eigeneWerte.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 2 }}>Eigene Werte</div>
            {eigeneWerte.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: 13 }}>{k}</span>
                <div style={{ width: 100 }}>
                  <TextInput value={biomarker[k] || ""} onChange={(v) => setBiomarkerWert(k, v)} placeholder="—" />
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={neuerLaborwertName} onChange={setNeuerLaborwertName} placeholder="Eigener Wert, z. B. Kortisol im Speichel" />
          </div>
          <button
            onClick={laborwertHinzufuegen}
            style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
          >
            +
          </button>
        </div>
      </Card>
    </>
  );
}
