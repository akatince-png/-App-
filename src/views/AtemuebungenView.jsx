import React, { useState } from "react";
import { Shell, Card, PrimaryButton, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import AtemTimer from "../ui/AtemTimer";
import { textMuted, cardBorder } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";

const LEER = { name: "", einatmenSek: "4", haltenSek: "4", ausatmenSek: "6", dauerMinuten: "3" };

// Neuer, eigenständiger Protokollbereich "Atemübungen" (16.08.,
// Nutzerinnen-Vorgabe: "vier Sekunden einatmen, sechs ausatmen ... zehn
// Sekunden Vorbereitungszeit, dann einatmen, halten, ausatmen"). Bewusst
// einfach gehalten (keine Zeitplanung/Erinnerungen wie bei den neun
// etablierten Bereichen) — Presets anlegen, per Knopf direkt starten. Der
// eigentliche geführte Ablauf steckt in AtemTimer.jsx.
export default function AtemuebungenView({ onHome }) {
  const { atemuebungen, atemuebungLogs, atemuebungHinzufuegen, atemuebungEntfernen, atemuebungAbschliessen } = useAppData();
  const [neu, setNeu] = useState(LEER);
  const [formOffen, setFormOffen] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [laufendeUebung, setLaufendeUebung] = useState(null);

  const submit = async () => {
    setFehler(null);
    const result = await atemuebungHinzufuegen({
      name: neu.name,
      einatmenSek: Number(neu.einatmenSek) || 4,
      haltenSek: Number(neu.haltenSek) || 0,
      ausatmenSek: Number(neu.ausatmenSek) || 6,
      dauerMinuten: Number(neu.dauerMinuten) || 3,
    });
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    setNeu(LEER);
    setFormOffen(false);
  };

  if (laufendeUebung) {
    return (
      <Shell>
        <ViewHeader title={`🌬️ ${laufendeUebung.name}`} onHome={() => setLaufendeUebung(null)} homeTitle="Zurück" />
        <Card>
          <AtemTimer
            uebung={laufendeUebung}
            onFertig={(dauerSek, gefuehlDanach) => {
              if (dauerSek != null) {
                atemuebungAbschliessen(laufendeUebung, dauerSek, { gefuehlDanach });
              }
            }}
          />
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <ViewHeader title="🌬️ Atemübungen" onHome={onHome} />

      <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>
        Eigene Atem-Muster anlegen (z. B. 4 Sek. einatmen, 4 Sek. halten, 6 Sek. ausatmen) und mit geführtem Timer durchführen — inkl. Vorbereitungszeit und Erinnerungston bei jedem Wechsel.
      </div>

      {atemuebungen.length === 0 ? (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch keine Atemübung angelegt.</div>
        </Card>
      ) : (
        atemuebungen.map((u) => (
          <Card key={u.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {u.icon} {u.name}
                </div>
                <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                  {u.einatmenSek}s ein{u.haltenSek > 0 ? ` · ${u.haltenSek}s halten` : ""} · {u.ausatmenSek}s aus · {u.dauerMinuten} Min.
                </div>
              </div>
              <button
                onClick={() => atemuebungEntfernen(u.id)}
                style={{ border: "none", background: "transparent", color: "#C24545", fontSize: 18, cursor: "pointer" }}
                title="Löschen"
              >
                ×
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <PrimaryButton onClick={() => setLaufendeUebung(u)}>Starten</PrimaryButton>
            </div>
          </Card>
        ))
      )}

      {formOffen ? (
        <Card>
          <TextInput value={neu.name} onChange={(v) => setNeu({ ...neu, name: v })} placeholder="Name (z. B. Ruhig werden)" />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>Einatmen (Sek.)</div>
              <TextInput type="number" value={neu.einatmenSek} onChange={(v) => setNeu({ ...neu, einatmenSek: v })} placeholder="4" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>Halten (Sek.)</div>
              <TextInput type="number" value={neu.haltenSek} onChange={(v) => setNeu({ ...neu, haltenSek: v })} placeholder="4" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>Ausatmen (Sek.)</div>
              <TextInput type="number" value={neu.ausatmenSek} onChange={(v) => setNeu({ ...neu, ausatmenSek: v })} placeholder="6" />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>Gesamtdauer (Minuten)</div>
            <TextInput type="number" value={neu.dauerMinuten} onChange={(v) => setNeu({ ...neu, dauerMinuten: v })} placeholder="3" />
          </div>
          {fehler && <div style={{ fontSize: 12, color: "#C24545", marginTop: 8 }}>{fehler}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <PrimaryButton onClick={submit} disabled={!neu.name.trim()}>
                Speichern
              </PrimaryButton>
            </div>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={() => setFormOffen(false)}>
                Abbrechen
              </PrimaryButton>
            </div>
          </div>
        </Card>
      ) : (
        <PrimaryButton onClick={() => setFormOffen(true)}>+ Atemübung anlegen</PrimaryButton>
      )}

      {atemuebungLogs.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: textMuted, marginBottom: 8 }}>Verlauf</div>
          {atemuebungLogs.slice(0, 8).map((l) => (
            <div
              key={l.id}
              style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${cardBorder}`, fontSize: 12 }}
            >
              <span>{l.name}</span>
              <span style={{ color: textMuted }}>
                {Math.round(l.dauerSek / 60)} Min. {l.gefuehlDanach === "besser" ? "😊" : l.gefuehlDanach === "gleich" ? "😐" : l.gefuehlDanach === "schlechter" ? "😞" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
