import React, { useMemo } from "react";
import { Shell } from "../ui/primitives";
import { cardBorder, textMain, textMuted } from "../ui/theme";
import { describeInterval } from "../utils/schedule";
import { useAppData } from "../context/AppDataContext";

// Gleiche Zuordnung wie im Tagesplan: feste Tageszeiten bekommen eine
// repräsentative Stunde, damit sie sich chronologisch neben den exakten
// Uhrzeiten von Peptiden/Medikamenten einsortieren.
const TAGESZEIT_STUNDE = { Morgens: "08", Mittags: "13", Abends: "20" };

const ZEIT_KATEGORIE = {
  peptid: { bg: "#E3FBF6", text: "#0A9384", dot: "#0FB8A3", label: "Peptid" },
  medikament: { bg: "#F1EAFB", text: "#6E4FBF", dot: "#9B7EDE", label: "Medikament" },
  supplement: { bg: "#EAF2FF", text: "#2E7BAA", dot: "#4FA3D1", label: "Supplement" },
  mahlzeit: { bg: "#EAF7E9", text: "#3F9E4D", dot: "#6FBF6F", label: "Mahlzeit" },
};

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Ohne festen Zeitpunkt";
}

function buildTimeline({ peptide, dosierung, einnahmeart, hormone, hormonDosierung, supplemente, rezepte, mahlzeiten }) {
  const items = [];

  peptide.forEach((p) => {
    const d = dosierung[p] || {};
    (d.uhrzeiten || []).forEach((zeit) => {
      items.push({
        hour: zeit.slice(0, 2),
        zeit,
        kategorie: "peptid",
        name: p,
        detail: `${d.menge || "—"} · ${einnahmeart[p] || "—"} · ${describeInterval(d)}`,
      });
    });
  });

  hormone.forEach((h) => {
    const d = hormonDosierung[h] || {};
    (d.uhrzeiten || []).forEach((zeit) => {
      items.push({
        hour: zeit.slice(0, 2),
        zeit,
        kategorie: "medikament",
        name: h,
        detail: `${d.menge || "—"} · ${d.kategorie || "Hormone"} · ${describeInterval(d)}`,
      });
    });
  });

  supplemente.forEach((s) => {
    s.tageszeiten.forEach((zeit) => {
      items.push({ hour: TAGESZEIT_STUNDE[zeit] || null, zeit, kategorie: "supplement", name: s.name, detail: s.hinweis || null });
    });
  });

  rezepte.forEach((r) => {
    items.push({
      hour: null,
      zeit: r.hinweis || "Ohne festen Zeitpunkt",
      kategorie: "supplement",
      name: r.name,
      detail: r.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · "),
    });
  });

  mahlzeiten.forEach((m) => {
    m.tageszeiten.forEach((zeit) => {
      const zutatenText = m.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · ");
      items.push({
        hour: TAGESZEIT_STUNDE[zeit] || null,
        zeit,
        kategorie: "mahlzeit",
        name: m.name,
        detail: [zutatenText, m.hinweis].filter(Boolean).join(" · ") || null,
      });
    });
  });

  return items;
}

function Platzhalter({ text }) {
  return <div style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 26 }}>{text}</div>;
}

export default function ProtokolleView({ onHome }) {
  const {
    ziele,
    startdatum,
    dauer,
    notizen,
    peptide,
    einnahmeart,
    dosierung,
    hormone,
    hormonDosierung,
    supplemente,
    rezepte,
    mahlzeiten,
  } = useAppData();

  const timeline = useMemo(
    () => buildTimeline({ peptide, dosierung, einnahmeart, hormone, hormonDosierung, supplemente, rezepte, mahlzeiten }),
    [peptide, dosierung, einnahmeart, hormone, hormonDosierung, supplemente, rezepte, mahlzeiten]
  );

  const buckets = useMemo(() => {
    const map = new Map();
    timeline.forEach((item) => {
      const key = item.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, [timeline]);

  const istLeer = timeline.length === 0;

  return (
    <Shell>
      <style>{"@media print { .no-print { display: none !important; } }"}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>📋 Protokolle</div>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Protokoll drucken"
          >
            🖨️
          </button>
          <button
            onClick={onHome}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Zum Dashboard"
          >
            ⌂
          </button>
        </div>
      </div>
      <div className="no-print" style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
        Nur zum Nachschauen — Änderungen machst du in den einzelnen Bereichen.
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: `1px solid ${cardBorder}`,
          boxShadow: "0 4px 18px rgba(24, 60, 51, 0.07)",
          padding: "22px 20px",
        }}
      >
        <div style={{ borderLeft: "3px solid #7C8B87", paddingLeft: 14, marginBottom: 26 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🗂️</span> Übersicht
          </div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>Ziel(e): {ziele.length ? ziele.join(", ") : "—"}</div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>
            Start: {startdatum} · Dauer: {dauer} Wochen
          </div>
          {notizen && <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>Notizen: {notizen}</div>}
        </div>

        {istLeer ? (
          <Platzhalter text="Noch nichts hinterlegt — leg Peptide, Medikamente, Supplemente, Mahlzeiten in den jeweiligen Bereichen an, dann erscheinen sie hier chronologisch." />
        ) : (
          buckets.map(([hour, items]) => (
            <div key={hour || "sonstige"} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: textMain, marginBottom: 10 }}>{hourLabel(hour)}</div>
              {items.map((item, i) => {
                const k = ZEIT_KATEGORIE[item.kategorie];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>
                        {item.name}{" "}
                        {item.zeit && !hour && <span style={{ fontWeight: 500, color: textMuted, fontSize: 11 }}>· {item.zeit}</span>}
                      </div>
                      {item.detail && <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: k.text,
                          background: k.bg,
                          display: "inline-block",
                          padding: "1px 7px",
                          borderRadius: 8,
                          marginTop: 3,
                        }}
                      >
                        {k.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div style={{ borderLeft: "3px solid #7C8FE0", paddingLeft: 14, marginBottom: 26 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>😴</span> Schlaf
          </div>
          <Platzhalter text="Noch keine feste Schlafroutine hinterlegt." />
        </div>

        <div style={{ borderLeft: "3px solid #4FC3E0", paddingLeft: 14, marginBottom: 26 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>💧</span> Hydration
          </div>
          <Platzhalter text="Hydration ist in Vorbereitung." />
        </div>

        <div style={{ borderLeft: "3px solid #FF9E5E", paddingLeft: 14, marginBottom: 26 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🏋️</span> Training
          </div>
          <Platzhalter text="Trainingsplan ist in Vorbereitung." />
        </div>

        <div style={{ borderLeft: "3px solid #E0708C", paddingLeft: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🩸</span> Blutzucker / CGM
          </div>
          <Platzhalter text="Blutzucker/CGM ist in Vorbereitung." />
        </div>
      </div>
    </Shell>
  );
}
