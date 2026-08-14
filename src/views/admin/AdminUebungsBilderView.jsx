import React, { useState } from "react";
import { Shell, Card, TextInput } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, danger, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { ALLE_UEBUNGEN } from "../../constants";

// Übungsbilder-Verwaltung (13.08., Nachtrag): pro Übung aus dem Katalog
// (KRAFTUEBUNGEN/BODYWEIGHT_UEBUNGEN, constants.js) ein von der Nutzerin
// in Canva erstelltes Bild hochladen — erscheint danach automatisch im
// Live-Trainings-Screen für ALLE Nutzer:innen (TrainingView.jsx). Admin-only,
// da hochgeladene Bilder in der geteilten `uebungs_bilder`-Tabelle landen.
export default function AdminUebungsBilderView({ onHome }) {
  const { uebungsBilder, uebungsBildHochladen, uebungsBildEntfernen } = useAppData();
  const [suche, setSuche] = useState("");
  const [ladendFuer, setLadendFuer] = useState(null);
  const [fehlerFuer, setFehlerFuer] = useState(null);

  const gefiltert = ALLE_UEBUNGEN.filter((name) => name.toLowerCase().includes(suche.trim().toLowerCase()));
  const anzahlErledigt = ALLE_UEBUNGEN.filter((name) => uebungsBilder[name]).length;

  const handleUpload = async (name, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFehlerFuer(null);
    setLadendFuer(name);
    const result = await uebungsBildHochladen(name, file);
    setLadendFuer(null);
    if (!result?.ok) setFehlerFuer({ name, error: result?.error || "Hochladen fehlgeschlagen." });
  };

  return (
    <Shell>
      <ViewHeader title="🖼️ Übungsbilder" onHome={onHome} />
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 12, lineHeight: 1.6 }}>
        {anzahlErledigt} von {ALLE_UEBUNGEN.length} Übungen haben schon ein Bild. Bilder erscheinen automatisch im
        Live-Trainings-Screen, sobald sie hier hochgeladen sind — für alle Nutzer:innen sichtbar.
      </div>

      <TextInput value={suche} onChange={setSuche} placeholder="Übung suchen…" />

      <div style={{ marginTop: 16 }}>
        {gefiltert.map((name) => {
          const bildUrl = uebungsBilder[name];
          return (
            <Card key={name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: "#FAFBFA",
                    border: `1px solid ${cardBorder}`,
                    flexShrink: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {bildUrl ? (
                    <img src={bildUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 18, color: textMuted }}>—</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
                  {fehlerFuer?.name === name && <div style={{ fontSize: 11, color: danger, marginTop: 2 }}>{fehlerFuer.error}</div>}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id={`uebungsbild-${name}`}
                  style={{ display: "none" }}
                  onChange={(e) => handleUpload(name, e)}
                />
                <label
                  htmlFor={`uebungsbild-${name}`}
                  style={{
                    cursor: ladendFuer === name ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#6366F1",
                    padding: "8px 12px",
                    borderRadius: 10,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {ladendFuer === name ? "Lädt…" : bildUrl ? "Ersetzen" : "Hochladen"}
                </label>
                {bildUrl && (
                  <button
                    onClick={() => uebungsBildEntfernen(name)}
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", flexShrink: 0 }}
                    title="Bild entfernen"
                  >
                    ×
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
