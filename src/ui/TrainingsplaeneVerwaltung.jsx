import React, { useState } from "react";
import { Card, Label, Pill, TextArea, TextInput } from "./primitives";
import SpotifyAnlassPicker from "./SpotifyAnlassPicker";
import { cardBorder, danger, textMain, textMuted } from "./theme";

function templateAnlass(templateId) {
  return `training-vorlage:${templateId}`;
}

function VorlageZeile({ tpl, programme, onBearbeiten, onEntfernen, onDirektStarten }) {
  const [offen, setOffen] = useState(false);
  return (
    <div style={{ padding: "10px 0", borderTop: `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{tpl.name}</div>
          <div style={{ fontSize: 11, color: textMuted }}>
            {tpl.art}
            {tpl.ziel ? ` · Ziel: ${tpl.ziel}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onDirektStarten(tpl)}
            title="Direkt starten"
            style={{ border: "none", background: "transparent", color: textMuted, fontSize: 16, cursor: "pointer", padding: "4px 6px" }}
          >
            ▶️
          </button>
          <button
            type="button"
            onClick={() => setOffen((o) => !o)}
            title="Bearbeiten"
            style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer", padding: "4px 6px" }}
          >
            {offen ? "Fertig" : "✏️"}
          </button>
          <button
            type="button"
            onClick={() => onEntfernen(tpl.id)}
            title="Löschen"
            style={{ border: "none", background: "transparent", color: danger, fontSize: 13, cursor: "pointer", padding: "4px 6px" }}
          >
            🗑
          </button>
        </div>
      </div>

      {offen && (
        <div style={{ marginTop: 10 }}>
          <Label>Name</Label>
          <TextInput value={tpl.name} onChange={(v) => onBearbeiten(tpl.id, { name: v })} />

          <Label>Ziel (optional)</Label>
          <TextArea value={tpl.ziel} onChange={(v) => onBearbeiten(tpl.id, { ziel: v })} placeholder="z. B. Hypertrophie, 3x pro Woche, Fokus Rücken" />

          <Label>Ordner</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <Pill label="Kein Ordner" selected={!tpl.programmId} onClick={() => onBearbeiten(tpl.id, { programmId: null })} />
            {programme.map((p) => (
              <Pill key={p.id} label={p.name} selected={tpl.programmId === p.id} onClick={() => onBearbeiten(tpl.id, { programmId: p.id })} />
            ))}
          </div>

          <SpotifyAnlassPicker anlass={templateAnlass(tpl.id)} label="🎵 Playlist für diese Vorlage" />
        </div>
      )}
    </div>
  );
}

// Verwaltung der Trainings-Vorlagen (15.08., Nutzerin-Vorgabe): Vorlagen
// benennen, mit einem Ziel-Freitext versehen, zu Ordnern/Programmen
// gruppieren ("Push/Pull/Legs" könnte ein Ordner mit den Vorlagen
// "Push-Tag"/"Pull-Tag"/"Legs-Tag" sein), pro Vorlage eine eigene
// Spotify-Playlist zuordnen, und direkt aus dieser Übersicht heraus live
// starten (statt erst ins Einzeltraining-Formular laden zu müssen). Das
// Anlegen einer neuen Vorlage bleibt wie bisher: aktuelle Formular-Werte im
// Einzeltraining über "Als Vorlage speichern" sichern — hier geht es nur um
// die Verwaltung bereits gespeicherter Vorlagen.
export default function TrainingsplaeneVerwaltung({
  trainingTemplates,
  trainingProgramme,
  programmHinzufuegen,
  programmEntfernen,
  templateBearbeiten,
  templateEntfernen,
  onDirektStarten,
  onSchliessen,
}) {
  const [neuerOrdnerName, setNeuerOrdnerName] = useState("");
  const [ordnerFehler, setOrdnerFehler] = useState(null);

  const ordnerAnlegen = async () => {
    const name = neuerOrdnerName.trim();
    if (!name) return;
    const result = await programmHinzufuegen(name);
    if (!result?.ok) {
      setOrdnerFehler(result?.error || "Ordner konnte nicht angelegt werden.");
      return;
    }
    setNeuerOrdnerName("");
    setOrdnerFehler(null);
  };

  const ohneOrdner = trainingTemplates.filter((t) => !t.programmId);

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: textMain }}>📋 Trainingspläne verwalten</div>
        <button
          type="button"
          onClick={onSchliessen}
          style={{ border: `1px solid ${cardBorder}`, borderRadius: 10, background: "#fff", color: textMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: "7px 12px" }}
        >
          Fertig
        </button>
      </div>

      {trainingTemplates.length === 0 ? (
        <div style={{ fontSize: 12.5, color: textMuted, textAlign: "center", padding: "10px 0" }}>
          Noch keine Vorlagen gespeichert — lege im Einzeltraining-Formular unten eine Vorlage an ("Als Vorlage speichern"), dann taucht sie hier auf.
        </div>
      ) : (
        <>
          {trainingProgramme.map((programm) => {
            const eigene = trainingTemplates.filter((t) => t.programmId === programm.id);
            return (
              <div key={programm.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>📁 {programm.name}</div>
                  <button
                    type="button"
                    onClick={() => programmEntfernen(programm.id)}
                    title="Ordner löschen (Vorlagen bleiben erhalten)"
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 13, cursor: "pointer", padding: "4px 6px" }}
                  >
                    🗑
                  </button>
                </div>
                {eigene.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: textMuted, padding: "6px 0" }}>Noch keine Vorlagen in diesem Ordner.</div>
                ) : (
                  eigene.map((tpl) => (
                    <VorlageZeile
                      key={tpl.id}
                      tpl={tpl}
                      programme={trainingProgramme}
                      onBearbeiten={templateBearbeiten}
                      onEntfernen={templateEntfernen}
                      onDirektStarten={onDirektStarten}
                    />
                  ))
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{trainingProgramme.length > 0 ? "Ohne Ordner" : "Alle Vorlagen"}</div>
          {ohneOrdner.length === 0 ? (
            <div style={{ fontSize: 11.5, color: textMuted, padding: "6px 0" }}>—</div>
          ) : (
            ohneOrdner.map((tpl) => (
              <VorlageZeile
                key={tpl.id}
                tpl={tpl}
                programme={trainingProgramme}
                onBearbeiten={templateBearbeiten}
                onEntfernen={templateEntfernen}
                onDirektStarten={onDirektStarten}
              />
            ))
          )}
        </>
      )}

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
        <Label>+ Neuer Ordner</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={neuerOrdnerName} onChange={setNeuerOrdnerName} placeholder="z. B. Push/Pull/Legs" />
          </div>
          <button
            type="button"
            onClick={ordnerAnlegen}
            style={{ padding: "0 16px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: cardBorder }}
          >
            Anlegen
          </button>
        </div>
        {ordnerFehler && <div style={{ fontSize: 11.5, color: danger, marginTop: 6 }}>{ordnerFehler}</div>}
      </div>
    </Card>
  );
}
