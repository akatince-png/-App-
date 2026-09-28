import React, { useState } from "react";
import { Shell, Card } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, textMain, textMuted } from "../../ui/theme";
import { HANDBUCH_STAND, KAPITEL } from "../../utils/coachHandbuch";

// Coach-Handbuch (28.09., Nutzerin). Inhalt in utils/coachHandbuch.js.
// Kapitel zum Aufklappen, Inhaltsverzeichnis oben, „Drucken / als PDF“
// klappt vorher alles auf.

const klein = { fontSize: 11.5, fontWeight: 800, color: textMuted, letterSpacing: 0.3, margin: "12px 0 6px" };

function Tabelle({ kopf, zeilen }) {
  return (
    <div style={{ overflowX: "auto", margin: "10px 0 4px" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5, lineHeight: 1.45 }}>
        <thead>
          <tr>
            {kopf.map((k) => (
              <th key={k} style={{ textAlign: "left", padding: "6px 8px", background: "#F3F4F8", color: textMuted, fontSize: 11, letterSpacing: 0.3, textTransform: "uppercase" }}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z, i) => (
            <tr key={i}>
              {z.map((zelle, j) => (
                <td key={j} style={{ padding: "7px 8px", borderTop: `1px solid ${cardBorder}`, verticalAlign: "top", color: textMain, fontWeight: j === 0 ? 700 : 400, minWidth: j === 0 ? 90 : 120 }}>
                  {zelle}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kapitel({ k, nr, offen, onToggle }) {
  return (
    <Card style={{ marginBottom: 10, padding: 0 }}>
      <div id={`kapitel-${k.id}`} data-kapitel={k.id}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={offen}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: 22 }}>{k.emoji}</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: textMuted }}>KAPITEL {nr}</span>
            <span style={{ display: "block", fontSize: 15.5, fontWeight: 900, color: textMain }}>{k.titel}</span>
          </span>
          <span style={{ fontSize: 16, color: textMuted }}>{offen ? "▾" : "▸"}</span>
        </button>
        {offen && (
          <div style={{ padding: "0 16px 14px", fontSize: 13.5, color: textMain, lineHeight: 1.55 }}>
            <div style={{ fontWeight: 600 }}>{k.wozu}</div>
            {k.dauer && <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>⏱ {k.dauer}</div>}
            {k.schritte && (
              <>
                <div style={klein}>SO GEHST DU VOR</div>
                <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 5 }}>
                  {k.schritte.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </>
            )}
            {k.tabelle && <Tabelle {...k.tabelle} />}
            {k.achten && (
              <>
                <div style={klein}>WORAUF DU ACHTEST</div>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 5 }}>
                  {k.achten.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {k.wennDann && (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {k.wennDann.map(([wenn, dann]) => (
                  <div key={wenn} style={{ border: `1px solid ${cardBorder}`, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 800 }}>Wenn {wenn.charAt(0).toLowerCase() + wenn.slice(1)} …</div>
                    <div style={{ color: textMuted, marginTop: 3 }}>→ {dann}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CoachHandbuchView({ onHome }) {
  const [offen, setOffen] = useState(() => new Set(["aufteilung"]));
  const umschalten = (id) =>
    setOffen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const springen = (id) => {
    setOffen((s) => new Set(s).add(id));
    setTimeout(() => document.getElementById(`kapitel-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const drucken = () => {
    setOffen(new Set(KAPITEL.map((k) => k.id)));
    setTimeout(() => window.print(), 300);
  };

  return (
    <Shell>
      <ViewHeader title="📖 Coach-Handbuch" onHome={onHome} />
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: textMain }}>
          Alles, was du als Coach tust, in der Reihenfolge, in der es passiert. Stand {HANDBUCH_STAND}.
        </div>
        <div style={klein}>INHALT</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {KAPITEL.map((k, i) => (
            <button
              key={k.id}
              type="button"
              className="mp-tap"
              onClick={() => springen(k.id)}
              style={{ border: `1px solid ${cardBorder}`, background: "#fff", borderRadius: 99, padding: "6px 10px", fontSize: 12.5, fontWeight: 700, color: textMain, cursor: "pointer", fontFamily: "inherit" }}
            >
              {i + 1}. {k.emoji} {k.titel}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mp-tap"
          onClick={drucken}
          style={{ marginTop: 12, width: "100%", border: "1.5px solid #1B2350", background: "#fff", color: "#1B2350", borderRadius: 14, padding: 10, fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
        >
          🖨️ Drucken oder als PDF speichern
        </button>
      </Card>
      {KAPITEL.map((k, i) => (
        <Kapitel key={k.id} k={k} nr={i + 1} offen={offen.has(k.id)} onToggle={() => umschalten(k.id)} />
      ))}
    </Shell>
  );
}
