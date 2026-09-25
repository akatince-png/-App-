import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { accentDark, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { nachTagenGruppieren } from "../data/coachChat";

// Chatfenster im WhatsApp-Stil (24.09., Nutzerinnen-Freigabe der Vorschau):
// eigene Nachrichten rechts, die der anderen Seite links, Tages-Trenner,
// ✓ zugestellt / blaue ✓✓ gelesen, Schnellantworten mit einem Tipp und
// Diktieren (ohne KI). Für Coach UND Coachee dieselbe Komponente —
// `ich` sagt, welche Seite "rechts" ist.
export default function ChatFenster({ titel, untertitel, avatar, ich, nachrichten, fehler, onSenden, onZurueck, vorlagen = [], platzhalter = "Nachricht …", startText = "" }) {
  const [text, setText] = useState(startText);
  const [sendet, setSendet] = useState(false);
  const [sendeFehler, setSendeFehler] = useState(null);
  const verlaufRef = useRef(null);
  const diktat = useDiktat({ value: text, onChange: setText });

  // Immer ans Ende scrollen, wenn neue Nachrichten da sind.
  const anzahl = nachrichten?.length ?? 0;
  useEffect(() => {
    const el = verlaufRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [anzahl]);

  const absenden = async (inhalt = text) => {
    if (!inhalt.trim() || sendet) return;
    setSendet(true);
    setSendeFehler(null);
    const r = await onSenden(inhalt);
    setSendet(false);
    if (r?.ok) {
      if (inhalt === text) setText("");
    } else setSendeFehler(r?.error || "Senden fehlgeschlagen.");
  };

  const fenster = (
    <div role="dialog" aria-label={`Chat: ${titel}`} style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 10px", borderBottom: "1px solid #EEF0F5", paddingTop: "max(14px, env(safe-area-inset-top))" }}>
        <button type="button" onClick={onZurueck} aria-label="Zurück" className="mp-tap" style={{ border: "none", background: "transparent", fontSize: 26, fontWeight: 800, color: accentDark, cursor: "pointer", padding: "0 6px" }}>
          ‹
        </button>
        {avatar}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titel}</div>
          {untertitel && <div style={{ fontSize: 12, color: textMuted }}>{untertitel}</div>}
        </div>
      </div>

      <div
        ref={verlaufRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 12px 16px",
          background: "#F3F1EC",
          backgroundImage: "radial-gradient(rgba(27,35,80,0.04) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {fehler && <div style={{ alignSelf: "center", fontSize: 12.5, color: danger, background: "#fff", borderRadius: 10, padding: "6px 10px" }}>{fehler}</div>}
        {!nachrichten && !fehler && <div style={{ alignSelf: "center", fontSize: 13, color: textMuted, marginTop: 20 }}>Lädt…</div>}
        {nachrichten && nachrichten.length === 0 && (
          <div style={{ alignSelf: "center", textAlign: "center", fontSize: 13, color: textMuted, background: "#fff", borderRadius: 12, padding: "10px 14px", marginTop: 20, maxWidth: 280 }}>
            Noch keine Nachrichten. Schreib einfach los – oder tipp unten auf eine Vorlage.
          </div>
        )}
        {nachrichten &&
          nachTagenGruppieren(nachrichten).map((g) => (
            <React.Fragment key={g.label}>
              <div style={{ alignSelf: "center", fontSize: 11, fontWeight: 700, color: "#6B7390", background: "#fff", borderRadius: 8, padding: "3px 9px", margin: "6px 0" }}>{g.label}</div>
              {g.nachrichten.map((n) => {
                const meine = n.absender === ich;
                return (
                  <div
                    key={n.id}
                    data-chat-nachricht={meine ? "eigene" : "fremde"}
                    data-zeit={n.erstelltAm}
                    style={{
                      alignSelf: meine ? "flex-end" : "flex-start",
                      maxWidth: "78%",
                      padding: "8px 11px 5px",
                      borderRadius: 14,
                      borderBottomRightRadius: meine ? 4 : 14,
                      borderBottomLeftRadius: meine ? 14 : 4,
                      background: meine ? "#DCE6FF" : "#fff",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                      fontSize: 14.5,
                      lineHeight: 1.35,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {n.text}
                    <span style={{ display: "block", textAlign: "right", fontSize: 10.5, color: "#7A8199", marginTop: 2 }}>
                      {new Date(n.erstelltAm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      {meine && (
                        <span aria-label={n.gelesen ? "gelesen" : "zugestellt"} style={{ marginLeft: 4, color: n.gelesen ? "#2D6FD6" : "#7A8199" }}>
                          {n.gelesen ? "✓✓" : "✓"}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
      </div>

      {vorlagen.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "8px 12px 0", overflowX: "auto", background: "#fff" }}>
          {vorlagen.map((v) => (
            <button
              key={v}
              type="button"
              className="mp-tap"
              disabled={sendet}
              onClick={() => absenden(v)}
              style={{ whiteSpace: "nowrap", border: "none", fontSize: 12.5, padding: "7px 11px", borderRadius: 99, background: "#EEF4FF", color: "#2D6FD6", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {(sendeFehler || diktat.fehler) && <div style={{ fontSize: 12, color: danger, padding: "6px 14px 0", background: "#fff" }}>{sendeFehler || diktat.fehler}</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "10px 12px", paddingBottom: "max(14px, env(safe-area-inset-bottom))", background: "#fff" }}>
        {diktat.verfuegbar && (
          <button
            type="button"
            onClick={diktat.umschalten}
            aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"}
            className="mp-tap"
            style={{ border: "none", background: diktat.hoert ? "#FBEAE7" : "transparent", borderRadius: 99, width: 40, height: 44, fontSize: 20, cursor: "pointer", flexShrink: 0 }}
          >
            {diktat.hoert ? "⏹" : "🎤"}
          </button>
        )}
        <textarea
          value={diktat.interim ? `${text} ${diktat.interim}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              absenden();
            }
          }}
          rows={1}
          placeholder={platzhalter}
          aria-label={platzhalter}
          style={{ flex: 1, minWidth: 0, resize: "none", border: "1.5px solid #D5D9E6", borderRadius: 22, padding: "11px 14px", fontSize: 15, fontFamily: "inherit", maxHeight: 120, outline: "none" }}
        />
        <button
          type="button"
          onClick={() => absenden()}
          disabled={sendet || !text.trim()}
          aria-label="Senden"
          className="mp-tap"
          style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: accentDark, color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0, opacity: sendet || !text.trim() ? 0.5 : 1 }}
        >
          ➤
        </button>
      </div>
    </div>
  );
  return createPortal(fenster, document.body);
}
