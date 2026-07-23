import React, { useState } from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { accent, accentDark, accentSoft, cardBorder, textMuted } from "../../ui/theme";
import Logo from "../../ui/Logo";

const SEITEN_TITEL = ["Protokoll-Übersicht", "Wochenplan", "Protokoll-Verlauf", "Wichtige Hinweise"];

// 4-Seiten-Betrachter für das automatisch erzeugte Erste-Woche-Protokoll —
// Folien-Muster aus WelcomeView.jsx (Index-State + Punkte-Indikator +
// Weiter-Button) wiederverwendet, hier für ein Dokument statt Willkommens-
// Folien. Jede Seite wird bewusst wie eine eigenständige "Papier-Seite"
// gerendert (Schatten, abgerundete Ecken, Seitenzahl) statt als
// durchlaufende Scroll-Liste — soll optisch wie ein echtes Dokument wirken.
export default function ProtokollSeitenView({ snapshot, onHome }) {
  const [index, setIndex] = useState(0);
  const { seite1, seite2, seite3, seite4 } = snapshot.daten;
  const isLast = index === 3;
  const isFirst = index === 0;

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={28} />
          <div style={{ fontSize: 14, fontWeight: 800 }}>Dein erstes Wochen-Protokoll</div>
        </div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Schließen"
        >
          ⌂
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: `1px solid ${cardBorder}`,
          boxShadow: "0 16px 40px rgba(20, 23, 26, 0.14)",
          padding: 24,
          minHeight: 480,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
          Seite {index + 1} von 4
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>{SEITEN_TITEL[index]}</div>

        {index === 0 && <Seite1 daten={seite1} />}
        {index === 1 && <Seite2 daten={seite2} />}
        {index === 2 && <Seite3 daten={seite3} />}
        {index === 3 && <Seite4 daten={seite4} />}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
        {SEITEN_TITEL.map((_, i) => (
          <div key={i} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 4, background: i === index ? accent : cardBorder, transition: "all 0.2s" }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {!isFirst && (
          <div style={{ flex: 1 }}>
            <PrimaryButton variant="ghost" onClick={() => setIndex((i) => i - 1)}>
              Zurück
            </PrimaryButton>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={() => (isLast ? onHome() : setIndex((i) => i + 1))} variant={isLast ? "success" : "accent"}>
            {isLast ? "Fertig" : "Weiter"}
          </PrimaryButton>
        </div>
      </div>
    </Shell>
  );
}

function Zeile({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
      <span style={{ fontSize: 12, color: textMuted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Seite1({ daten }) {
  return (
    <div>
      <Zeile label="Protokoll" value={daten.name} />
      <Zeile label="Ziele" value={daten.ziele.length ? daten.ziele.join(", ") : "–"} />
      <Zeile label="Dauer" value={`${daten.dauerWochen} Wochen`} />
      <Zeile label="Zeitraum" value={`${daten.startdatum} – ${daten.enddatum}`} />
      {daten.notizen && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Notizen</div>
          <div style={{ fontSize: 13 }}>{daten.notizen}</div>
        </div>
      )}
    </div>
  );
}

function Seite2({ daten }) {
  return (
    <div>
      {daten.wochenplan.map((tag) => (
        <div key={tag.wochentag} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
            {tag.wochentag} · {tag.datum}
          </div>
          {tag.items.length === 0 ? (
            <div style={{ fontSize: 11.5, color: textMuted }}>–</div>
          ) : (
            tag.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: item.farbe, flexShrink: 0 }} />
                <span style={{ fontWeight: 700 }}>{item.uhrzeit}</span>
                <span>{item.name}</span>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function Seite3({ daten }) {
  return (
    <div>
      {daten.substanzen.length === 0 ? (
        <div style={{ fontSize: 13, color: textMuted }}>Noch keine Substanzen im Protokoll.</div>
      ) : (
        daten.substanzen.map((s, i) => (
          <div key={s.name} style={{ padding: "8px 0", borderBottom: i < daten.substanzen.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {s.name} {s.menge && `· ${s.menge}`}
            </div>
            <div style={{ fontSize: 11.5, color: textMuted }}>
              {s.intervall} · {s.anzahl}× im Zeitraum
            </div>
          </div>
        ))
      )}
      {daten.compliance !== null && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: accentDark }}>{daten.compliance}%</div>
          <div style={{ fontSize: 11, color: textMuted }}>Compliance (erste Woche)</div>
        </div>
      )}
    </div>
  );
}

function Seite4({ daten }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Wichtige Hinweise</div>
      {daten.hinweise.map((h) => (
        <div key={h} style={{ display: "flex", gap: 8, fontSize: 12.5, marginBottom: 6 }}>
          <span style={{ color: accent, fontWeight: 700 }}>✓</span>
          <span>{h}</span>
        </div>
      ))}
      {daten.routinenZiele.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, margin: "18px 0 8px" }}>Deine Ziele</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {daten.routinenZiele.map((r) => (
              <div key={r.label} style={{ background: accentSoft, borderRadius: 12, padding: "8px 12px", minWidth: 100 }}>
                <div style={{ fontSize: 16 }}>{r.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{r.label}</div>
                <div style={{ fontSize: 10.5, color: textMuted }}>{r.ziel}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
