import React from "react";
import { Shell } from "../ui/primitives";
import { cardBorder, textMain, textMuted } from "../ui/theme";
import { describeInterval } from "../utils/schedule";
import { useAppData } from "../context/AppDataContext";

function Abschnitt({ icon, farbe, titel, kinder }) {
  return (
    <div style={{ borderLeft: `3px solid ${farbe}`, paddingLeft: 14, marginBottom: 26 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {titel}
      </div>
      {kinder}
    </div>
  );
}

function Eintrag({ titel, zeilen }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {titel && <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{titel}</div>}
      {zeilen.filter(Boolean).map((z, i) => (
        <div key={i} style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>
          {z}
        </div>
      ))}
    </div>
  );
}

function Platzhalter({ text }) {
  return <div style={{ fontSize: 12, color: textMuted, fontStyle: "italic" }}>{text}</div>;
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
  } = useAppData();

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>📋 Protokolle</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
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
        <Abschnitt
          icon="🗂️"
          farbe="#7C8B87"
          titel="Übersicht"
          kinder={
            <Eintrag
              titel=""
              zeilen={[
                `Ziel(e): ${ziele.length ? ziele.join(", ") : "—"}`,
                `Start: ${startdatum} · Dauer: ${dauer} Wochen`,
                notizen ? `Notizen: ${notizen}` : null,
              ]}
            />
          }
        />

        <Abschnitt
          icon="💉"
          farbe="#0FB8A3"
          titel="Peptide"
          kinder={
            peptide.length === 0 ? (
              <Platzhalter text="Noch keine Peptide hinterlegt." />
            ) : (
              peptide.map((p) => {
                const d = dosierung[p] || {};
                return (
                  <Eintrag
                    key={p}
                    titel={p}
                    zeilen={[
                      `${d.menge || "—"} · ${einnahmeart[p] || "—"}`,
                      `Intervall: ${describeInterval(d)}`,
                      `Uhrzeit(en): ${(d.uhrzeiten || []).join(" & ") || "—"}`,
                    ]}
                  />
                );
              })
            )
          }
        />

        <Abschnitt
          icon="⚗️"
          farbe="#5B9BF0"
          titel="Hormone / Off-Label"
          kinder={
            hormone.length === 0 ? (
              <Platzhalter text="Noch keine Hormone/Off-Label-Präparate hinterlegt." />
            ) : (
              hormone.map((h) => {
                const d = hormonDosierung[h] || {};
                return (
                  <Eintrag
                    key={h}
                    titel={h}
                    zeilen={[`${d.menge || "—"}`, `Intervall: ${describeInterval(d)}`, `Uhrzeit(en): ${(d.uhrzeiten || []).join(" & ") || "—"}`]}
                  />
                );
              })
            )
          }
        />

        <Abschnitt
          icon="💊"
          farbe="#4FA3D1"
          titel="Supplemente & Rezepte"
          kinder={
            supplemente.length === 0 && rezepte.length === 0 ? (
              <Platzhalter text="Noch keine Supplemente oder Rezepte hinterlegt." />
            ) : (
              <>
                {supplemente.map((s) => (
                  <Eintrag key={s.id} titel={s.name} zeilen={[s.tageszeiten.join(", "), s.hinweis || null]} />
                ))}
                {rezepte.map((r) => (
                  <Eintrag
                    key={r.id}
                    titel={r.name}
                    zeilen={[r.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · "), r.hinweis || null]}
                  />
                ))}
              </>
            )
          }
        />

        <Abschnitt icon="😴" farbe="#7C8FE0" titel="Schlaf" kinder={<Platzhalter text="Noch keine feste Schlafroutine hinterlegt." />} />

        <Abschnitt icon="🏋️" farbe="#FF9E5E" titel="Training" kinder={<Platzhalter text="Trainingsplan ist in Vorbereitung." />} />

        <Abschnitt icon="🥗" farbe="#6FBF6F" titel="Ernährungsplan" kinder={<Platzhalter text="Ernährungsplan ist in Vorbereitung." />} />

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
