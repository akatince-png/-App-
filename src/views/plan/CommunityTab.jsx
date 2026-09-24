import React from "react";
import { Card } from "../../ui/primitives";
import { accent, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";

export default function CommunityTab() {
  const { datenteilung, toggleDatenteilung } = useAppData();

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Anonyme Datenteilung</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Daten anonym mit der Community teilen</div>
            <div style={{ fontSize: 12, color: textMuted }}>Erlaubt, deine Daten später anonym (ohne Namen) für Community-Auswertungen zu nutzen. Aktuell wird noch nichts geteilt.</div>
          </div>
          <button
            onClick={toggleDatenteilung}
            style={{ width: 46, height: 26, borderRadius: 13, border: "none", background: datenteilung ? accent : "#D9EEE7", position: "relative", cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: datenteilung ? 23 : 3, transition: "left 0.2s ease" }} />
          </button>
        </div>
      </Card>

      {/* Bis 24.09. stand hier ein fest eingebautes Beispiel mit erfundenen
          Zahlen ("BPC-157 … 124 Nutzer:innen, 72 %") — hätte wie echte
          Ergebnisse gewirkt. Ersetzt durch einen ehrlichen Hinweis, bis es
          echte, anonymisierte Auswertungen gibt. */}
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Community-Auswertungen</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
          🌱 Noch in Vorbereitung. Sobald genug Menschen ihre Daten anonym teilen, siehst du hier, was anderen geholfen hat, zum Beispiel
          welche Routinen oder Gewohnheiten gut funktionieren.
        </div>
      </Card>
    </>
  );
}
