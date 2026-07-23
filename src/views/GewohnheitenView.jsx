import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../ui/primitives";
import { accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";

const ICON_OPTIONEN = ["🌱", "🧘", "📖", "🚶", "✍️", "🎯", "☀️", "💤", "🥗", "🚭"];

const LEERE_GEWOHNHEIT = { name: "", icon: "🌱", uhrzeit: "", zielTage: "" };

function Fortschrittsbalken({ tage, ziel }) {
  const pct = ziel ? Math.min(100, Math.round((tage / ziel) * 100)) : 0;
  return (
    <div style={{ height: 8, borderRadius: 4, background: "#EEF1EE", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#5E9468", borderRadius: 4, transition: "width 0.2s" }} />
    </div>
  );
}

function GewohnheitKarte({ g, heuteErledigt, onToggleHeute, onEntfernen, onZielAendern, gesamtTage, aktuelleSerie }) {
  const [zielEditOpen, setZielEditOpen] = useState(false);
  const [zielEntwurf, setZielEntwurf] = useState(g.zielTage ? String(g.zielTage) : "");
  const tage = gesamtTage(g.id);
  const serie = aktuelleSerie(g.id);

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20 }}>{g.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
            {g.uhrzeit && <div style={{ fontSize: 11, color: textMuted }}>{g.uhrzeit} Uhr</div>}
          </div>
        </div>
        <button
          onClick={() => onEntfernen(g.id)}
          style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer" }}
          title="Gewohnheit löschen"
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: textMuted }}>
          {serie > 0 ? <span style={{ color: accentDark, fontWeight: 700 }}>🔥 {serie} Tage in Folge</span> : "Noch keine Serie"}
        </div>
        <div style={{ fontSize: 12, color: textMuted }}>{tage} Tage insgesamt</div>
      </div>

      {g.zielTage ? (
        <>
          <Fortschrittsbalken tage={tage} ziel={g.zielTage} />
          <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
            {tage} / {g.zielTage} Tage bis zum Ziel
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: textMuted, fontStyle: "italic" }}>Kein Ziel gesetzt — offen fortlaufend.</div>
      )}

      {zielEditOpen ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <div style={{ width: 90 }}>
            <TextInput type="number" value={zielEntwurf} onChange={setZielEntwurf} placeholder="z. B. 66" />
          </div>
          <button
            onClick={() => {
              onZielAendern(g.id, zielEntwurf ? Number(zielEntwurf) : null);
              setZielEditOpen(false);
            }}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: accentDark, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Speichern
          </button>
          <button
            onClick={() => setZielEditOpen(false)}
            style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${cardBorder}`, background: "#fff", color: textMuted, fontSize: 12, cursor: "pointer" }}
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setZielEditOpen(true)}
          style={{ marginTop: 8, border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Ziel bearbeiten
        </button>
      )}

      <div style={{ marginTop: 14 }}>
        <PrimaryButton onClick={onToggleHeute} variant={heuteErledigt ? "success" : "accent"}>
          {heuteErledigt ? "✓ Heute erledigt" : "Heute erledigen"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

export default function GewohnheitenView({ onHome }) {
  const {
    gewohnheiten,
    gewohnheitErledigt,
    gewohnheitHinzufuegen,
    gewohnheitEntfernen,
    gewohnheitZielAktualisieren,
    toggleGewohnheitErledigt,
    gesamtTage,
    aktuelleSerie,
  } = useAppData();

  const [neu, setNeu] = useState(LEERE_GEWOHNHEIT);
  const [fehler, setFehler] = useState(null);
  const heute = new Date().toISOString().slice(0, 10);

  const submit = async () => {
    setFehler(null);
    const result = await gewohnheitHinzufuegen({ ...neu, zielTage: neu.zielTage ? Number(neu.zielTage) : null });
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeu(LEERE_GEWOHNHEIT);
  };

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🌱 Gewohnheiten</div>
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
        Baue neue Gewohnheiten auf — Achtsamkeit, Lesen oder was du dir vornimmst. Erscheint mit Uhrzeit auch im Tagesplan zum Abhaken.
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neue Gewohnheit</div>
      <Card style={{ marginBottom: 16 }}>
        <Label>Name</Label>
        <TextInput value={neu.name} onChange={(v) => setNeu((p) => ({ ...p, name: v }))} placeholder="z. B. 10 Minuten lesen" />

        <Label>Symbol</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {ICON_OPTIONEN.map((icon) => (
            <Pill key={icon} label={icon} selected={neu.icon === icon} onClick={() => setNeu((p) => ({ ...p, icon }))} />
          ))}
        </div>

        <Label>Uhrzeit (optional — für den Tagesplan)</Label>
        <TextInput type="time" value={neu.uhrzeit} onChange={(v) => setNeu((p) => ({ ...p, uhrzeit: v }))} />

        <Label>Eigenes Ziel in Tagen (optional)</Label>
        <TextInput type="number" value={neu.zielTage} onChange={(v) => setNeu((p) => ({ ...p, zielTage: v }))} placeholder="z. B. 66" />
        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
          Für neue Gewohnheiten werden oft 21–66 Tage genannt — nur ein Anhaltspunkt. Du kannst ein eigenes Ziel setzen oder es leer lassen.
        </div>

        {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neu.name.trim()}>
            + Gewohnheit anlegen
          </PrimaryButton>
        </div>
      </Card>

      {gewohnheiten.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Gewohnheiten angelegt — leg oben deine erste an.
          </div>
        </Card>
      ) : (
        gewohnheiten.map((g) => (
          <GewohnheitKarte
            key={g.id}
            g={g}
            heuteErledigt={!!gewohnheitErledigt[`${heute}__${g.id}`]}
            onToggleHeute={() => toggleGewohnheitErledigt(heute, g.id)}
            onEntfernen={gewohnheitEntfernen}
            onZielAendern={gewohnheitZielAktualisieren}
            gesamtTage={gesamtTage}
            aktuelleSerie={aktuelleSerie}
          />
        ))
      )}
    </Shell>
  );
}
