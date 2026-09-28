import React from "react";
import { Shell, Card } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { textMuted } from "../../ui/theme";
import { DATENSCHUTZ, IMPRESSUM } from "../../utils/rechtstexte";

// Datenschutzerklärung / Impressum in der App (28.09.). Inhalt aus
// utils/rechtstexte.js – dieselbe Quelle wie die öffentlichen Seiten.
export function RechtstextInhalt({ abschnitte }) {
  return abschnitte.map((a) => (
    <section key={a.titel} style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{a.titel}</h2>
      {(a.absaetze || []).map((t, i) => (
        <p key={i} style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 6px" }}>
          {t}
        </p>
      ))}
      {a.liste && (
        <ul style={{ margin: "0 0 6px", paddingLeft: 18 }}>
          {a.liste.map((t, i) => (
            <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 4 }}>
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  ));
}

export default function RechtstextView({ art, onHome }) {
  const datenschutz = art !== "impressum";
  return (
    <Shell>
      <ViewHeader title={datenschutz ? "🔒 Datenschutzerklärung" : "ℹ️ Impressum"} onHome={onHome} />
      <Card>
        <div data-rechtstext={art}>
          <RechtstextInhalt abschnitte={datenschutz ? DATENSCHUTZ : IMPRESSUM} />
        </div>
      </Card>
      <div style={{ fontSize: 12, color: textMuted, margin: "10px 4px 24px" }}>
        {datenschutz ? (
          <a href="#/impressum">Impressum</a>
        ) : (
          <a href="#/datenschutz">Datenschutzerklärung</a>
        )}
      </div>
    </Shell>
  );
}
