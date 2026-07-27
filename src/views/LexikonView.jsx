import React, { useState } from "react";
import { Shell, Card, Pill, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { accent, accentDark, textMuted } from "../ui/theme";
import { LEXIKON_BEISPIELE, LEXIKON_KATEGORIEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

export default function LexikonView({ onHome }) {
  const { lexikonVerlauf, lexikonLoading, lexikonFragen } = useAppData();
  const [lexikonFrage, setLexikonFrage] = useState("");
  const [lexikonKategorie, setLexikonKategorie] = useState("Peptide");

  const stellen = (frage) => {
    setLexikonFrage("");
    lexikonFragen(frage, lexikonKategorie);
  };

  return (
    <Shell>
      <ViewHeader title="📚 Lexikon" onHome={onHome} />

      <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
        Stell eine Frage — kurze, sachliche Antworten, keine Dosierungsempfehlungen.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {LEXIKON_KATEGORIEN.map((k) => (
          <Pill key={k} label={k} selected={lexikonKategorie === k} onClick={() => setLexikonKategorie(k)} />
        ))}
      </div>

      {lexikonVerlauf.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {LEXIKON_BEISPIELE[lexikonKategorie].map((f) => (
            <Pill key={f} label={f} selected={false} onClick={() => stellen(f)} />
          ))}
        </div>
      )}

      {lexikonVerlauf.map((item, i) => (
        <Card key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: accentDark, fontWeight: 700, marginBottom: 4 }}>{item.kategorie}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.frage}</div>
          <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
            {item.antwort === null ? "🔎 Antwort wird geladen..." : item.antwort}
          </div>
        </Card>
      ))}

      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={lexikonFrage} onChange={setLexikonFrage} placeholder="Deine Frage..." />
          </div>
          <button
            onClick={() => stellen(lexikonFrage)}
            disabled={lexikonLoading || !lexikonFrage.trim()}
            style={{
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: lexikonLoading || !lexikonFrage.trim() ? "#CDEAE3" : accent,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </Card>

      <div style={{ fontSize: 11, color: textMuted, textAlign: "center", marginTop: 16 }}>
        Antworten sind allgemeine Informationen, kein medizinischer Rat
      </div>
    </Shell>
  );
}
