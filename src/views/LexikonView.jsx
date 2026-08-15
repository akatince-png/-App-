import React, { useMemo, useState } from "react";
import { Shell, Card, Pill, TextInput } from "../ui/primitives";
import { accentDark, cardBorder, danger, shadow, textMuted } from "../ui/theme";
import { LEXIKON_BEISPIELE, LEXIKON_KATEGORIEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

// Kategorie-Kacheln als Startbildschirm — ersetzt die vorherige flache
// Pill-Reihe, in der nicht erkennbar war, wo eine Kategorie endet/anfängt.
function KategorieGrid({ eintraege, onOpen }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {LEXIKON_KATEGORIEN.map((k) => {
        const anzahl = eintraege.filter((e) => e.kategorie === k).length;
        return (
          <button
            key={k}
            className="mp-tap"
            onClick={() => onOpen(k)}
            style={{
              textAlign: "left",
              borderRadius: 18,
              padding: "16px 14px",
              cursor: "pointer",
              background: "#fff",
              boxShadow: shadow,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6, color: accentDark }}>{k}</div>
            <div style={{ fontSize: 11, color: textMuted }}>
              {anzahl === 0 ? "Noch keine Einträge" : `${anzahl} gespeicherte ${anzahl === 1 ? "Antwort" : "Antworten"}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Einzelne Kategorie: Suche über bereits gespeicherte Fragen/Antworten
// dieser Kategorie ("welche Informationen brauchte ich noch mal?") plus
// Eingabefeld für neue Fragen, wie zuvor.
function KategorieDetail({ kategorie, eintraege, onBack }) {
  const { lexikonLoading, lexikonFragen, lexikonEintragLoeschen } = useAppData();
  const [suche, setSuche] = useState("");
  const [frage, setFrage] = useState("");

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return eintraege;
    return eintraege.filter((e) => e.frage.toLowerCase().includes(q) || (e.antwort || "").toLowerCase().includes(q));
  }, [eintraege, suche]);

  const stellen = (f) => {
    setFrage("");
    lexikonFragen(f, kategorie);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{kategorie}</div>
        <button
          onClick={onBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0 }}
          title="Zurück"
        >
          ‹
        </button>
      </div>

      {eintraege.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <TextInput value={suche} onChange={setSuche} placeholder="In dieser Kategorie suchen..." />
        </div>
      )}

      {eintraege.length === 0 && LEXIKON_BEISPIELE[kategorie] && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {LEXIKON_BEISPIELE[kategorie].map((f) => (
            <Pill key={f} label={f} selected={false} onClick={() => stellen(f)} />
          ))}
        </div>
      )}

      {suche.trim() && gefiltert.length === 0 && (
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 14 }}>Keine Treffer für „{suche}".</div>
      )}

      {gefiltert.map((item) => (
        <Card key={item.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.frage}</div>
            {!item._pending && (
              <button
                onClick={() => lexikonEintragLoeschen(item.id)}
                title="Eintrag löschen"
                style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, border: "none", background: "#FDE9EC", color: danger, fontSize: 12, cursor: "pointer" }}
              >
                🗑
              </button>
            )}
          </div>
          <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
            {item.antwort === null ? "🔎 Antwort wird geladen..." : item.antwort}
          </div>
        </Card>
      ))}

      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={frage} onChange={setFrage} placeholder="Neue Frage..." />
          </div>
          <button
            onClick={() => stellen(frage)}
            disabled={lexikonLoading || !frage.trim()}
            style={{
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: lexikonLoading || !frage.trim() ? "#CDEAE3" : accentDark,
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
    </>
  );
}

export default function LexikonView({ onHome }) {
  const { lexikonEintraege } = useAppData();
  const [offeneKategorie, setOffeneKategorie] = useState(null);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>📚 Lexikon</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      {!offeneKategorie ? (
        <>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>Wähle einen Themenbereich.</div>
          <KategorieGrid eintraege={lexikonEintraege} onOpen={setOffeneKategorie} />
        </>
      ) : (
        <KategorieDetail
          kategorie={offeneKategorie}
          eintraege={lexikonEintraege.filter((e) => e.kategorie === offeneKategorie)}
          onBack={() => setOffeneKategorie(null)}
        />
      )}
    </Shell>
  );
}
