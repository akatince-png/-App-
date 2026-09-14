import React from "react";
import { bg, card, cardBorder, accent, accentDark, danger, textMain, textMuted, shadow } from "./theme";

// Auffangnetz gegen Abstürze (14.09., Nutzerinnen-Vorgabe aus dem
// App-Bauplan): ohne das zeigt React bei einem Fehler irgendwo im
// Komponentenbaum eine komplett leere, weiße Seite — die Person weiß dann
// nicht mal, dass etwas schiefging, geschweige denn, wie sie da rauskommt.
//
// Bewusst eine Klassenkomponente (einziger Weg in React, einen
// Fehler-Grenzwert zu bauen — es gibt dafür (noch) keinen Hook) und
// bewusst OHNE Shell/PrimaryButton/Context — falls der Fehler selbst durch
// einen kaputten Context ausgelöst wurde, darf die Auffang-Anzeige nicht
// von genau demselben Context abhängen, sonst reißt sie beim Rendern
// gleich mit.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fehler: null };
  }

  static getDerivedStateFromError(fehler) {
    return { fehler };
  }

  componentDidCatch(fehler, info) {
    // eslint-disable-next-line no-console
    console.error("Auffangnetz hat einen Absturz aufgefangen:", fehler, info?.componentStack);
  }

  render() {
    if (!this.state.fehler) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          color: textMain,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: card,
            border: `1px solid ${cardBorder}`,
            borderRadius: 18,
            boxShadow: shadow,
            padding: 28,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 12 }}>😵‍💫</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Puh, da ist etwas schiefgelaufen.</div>
          <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.55, marginBottom: 22 }}>
            Nichts ist verloren — deine gespeicherten Daten sind unberührt. Ein Neustart dieses Bereichs behebt es meistens.
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ fehler: null });
              this.props.onReset?.();
            }}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 14,
              padding: "13px 16px",
              background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14.5,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            Zurück zur Startseite
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: textMuted,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              padding: 8,
            }}
          >
            Seite komplett neu laden
          </button>
          {import.meta.env.DEV && (
            <div style={{ marginTop: 16, textAlign: "left", fontSize: 11, color: danger, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {String(this.state.fehler?.message || this.state.fehler)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
