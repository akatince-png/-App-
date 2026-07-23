import React, { useMemo } from "react";
import { Shell, Card } from "../ui/primitives";
import { accentDark, cardBorder, textMain, textMuted } from "../ui/theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";

function datumLabel(datumStr) {
  const [y, m, d] = datumStr.split("-");
  const datum = new Date(`${datumStr}T12:00:00`);
  const wochentag = datum.toLocaleDateString("de-DE", { weekday: "short" });
  return `${wochentag}., ${d}.${m}.${y}`;
}

function Zeile({ label, wert }) {
  if (!wert) return null;
  return (
    <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
      {label}: <span style={{ color: textMain, fontWeight: 600 }}>{wert}</span>
    </div>
  );
}

function TrainingProtokollKarte({ e }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>
            {e.art}
            {e.name && <span style={{ fontWeight: 600 }}> · {e.name}</span>}
          </div>
          {e.uhrzeit && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{e.uhrzeit}</div>}
        </div>
      </div>

      {e.art === "Krafttraining" && (e.uebungen || []).length > 0 && (
        <div style={{ marginTop: 10 }}>
          {e.uebungen
            .filter((u) => u.name)
            .map((u, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${cardBorder}` : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{u.name}</div>
                <div style={{ fontSize: 12, color: accentDark, fontWeight: 700, marginTop: 1 }}>
                  {u.saetze || "?"} Sätze × {u.wiederholungen || "?"} Wdh.{u.gewicht && ` · ${u.gewicht}`}
                </div>
                {u.pauseSekunden && <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>Pause: {u.pauseSekunden}s zwischen den Sätzen</div>}
              </div>
            ))}
        </div>
      )}

      {e.art !== "Krafttraining" && (
        <div style={{ marginTop: 8 }}>
          <Zeile label="Dauer" wert={e.dauerMin ? `${e.dauerMin} min` : null} />
          <Zeile label="Distanz" wert={e.distanzKm ? `${e.distanzKm} km` : null} />
          <Zeile label="Ø Puls" wert={e.puls ? `${e.puls} bpm` : null} />
          <Zeile label="Runden" wert={e.runden} />
        </div>
      )}

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Zeile label="RPE" wert={e.rpe} />
        <Zeile label="Kalorien" wert={e.kalorien ? `${e.kalorien} kcal` : null} />
        <Zeile label="Energielevel" wert={e.energielevel} />
        <Zeile label="Schmerzen" wert={e.schmerzen} />
      </div>
      {e.bemerkungen && (
        <div style={{ fontSize: 12, color: textMuted, marginTop: 8, fontStyle: "italic" }}>„{e.bemerkungen}“</div>
      )}
    </Card>
  );
}

function AenderungKarte({ e }) {
  const k = KATEGORIE_META[e.kategorie] || { dot: cardBorder, text: textMuted };
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 700 }}>{e.itemName}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: k.text }}>{e.aktion}</div>
      </div>
      {e.detail && <div style={{ fontSize: 12, color: textMuted, marginTop: 2, marginLeft: 16 }}>{e.detail}</div>}
      {e.grund && <div style={{ fontSize: 12, color: textMuted, marginTop: 2, marginLeft: 16, fontStyle: "italic" }}>„{e.grund}“</div>}
    </div>
  );
}

export default function ProtokollLogView({ onHome }) {
  const { trainingEintraege, protokollEintraege } = useAppData();

  const gruppen = useMemo(() => {
    const erledigte = trainingEintraege.filter((e) => e.erledigt);
    const map = new Map();
    erledigte.forEach((e) => {
      if (!map.has(e.datum)) map.set(e.datum, []);
      map.get(e.datum).push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [trainingEintraege]);

  const aenderungGruppen = useMemo(() => {
    const map = new Map();
    protokollEintraege.forEach((e) => {
      const datum = e.erstelltAm.slice(0, 10);
      if (!map.has(datum)) map.set(datum, []);
      map.get(datum).push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [protokollEintraege]);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>📖 Protokolle</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
        Was du wirklich gemacht hast — nicht der Plan, sondern das tatsächliche Ergebnis.
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📝 Änderungen</div>
      {aenderungGruppen.length === 0 ? (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Änderungen protokolliert — sobald du etwas an einem aktiven Plan anpasst, erscheint es hier.
          </div>
        </Card>
      ) : (
        aenderungGruppen.map(([datum, eintraege]) => (
          <div key={datum} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: textMain, marginBottom: 8 }}>{datumLabel(datum)}</div>
            <Card>
              {eintraege.map((e) => (
                <AenderungKarte key={e.id} e={e} />
              ))}
            </Card>
          </div>
        ))
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>🏋️ Training</div>
      {gruppen.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine abgeschlossenen Trainings — sobald du eins live durchführst oder einträgst, erscheint es hier mit allen Details.
          </div>
        </Card>
      ) : (
        gruppen.map(([datum, eintraege]) => (
          <div key={datum} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: textMain, marginBottom: 8 }}>{datumLabel(datum)}</div>
            {eintraege.map((e) => (
              <TrainingProtokollKarte key={e.id} e={e} />
            ))}
          </div>
        ))
      )}
    </Shell>
  );
}
