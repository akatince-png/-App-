import React, { useState } from "react";
import { Card, TextArea, PrimaryButton } from "./primitives";
import { accentDark, accentSoft, textMuted } from "./theme";

// Ersetzt für Coachees (istAdminModus === false) den KI-Assistenten als
// Kontaktweg (13.08., Coach-verwaltetes Modell) — eine einfache Nachricht
// an den echten Coach statt an Aka, siehe useCoacheeNachrichten.js.
export default function NachrichtAnCoachCard({ nachrichten, onSenden }) {
  const [text, setText] = useState("");
  const [senden, setSenden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(false);

  const absenden = async () => {
    setFehler(null);
    setErfolg(false);
    setSenden(true);
    const result = await onSenden(text);
    setSenden(false);
    if (!result?.ok) {
      setFehler(result?.error || "Senden fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setText("");
    setErfolg(true);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>
        Frag deinen Coach etwas oder gib eine Rückmeldung — er meldet sich bei dir.
      </div>
      <Card>
        <TextArea value={text} onChange={setText} placeholder="Deine Nachricht an deinen Coach ..." />
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={absenden} disabled={senden || !text.trim()}>
            {senden ? "Wird gesendet …" : "Nachricht senden"}
          </PrimaryButton>
        </div>
        {fehler && <div style={{ fontSize: 12, color: "#C24545", marginTop: 8 }}>{fehler}</div>}
        {erfolg && <div style={{ fontSize: 12, color: accentDark, marginTop: 8 }}>Nachricht gesendet.</div>}
      </Card>
      {nachrichten?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {nachrichten.slice(0, 5).map((n) =>
            n.absender === "coach" ? (
              <div key={n.id} style={{ fontSize: 12.5, padding: "8px 10px", marginBottom: 6, borderRadius: 10, background: accentSoft, color: accentDark }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2 }}>Dein Coach</div>
                {n.text}
              </div>
            ) : (
              <div key={n.id} style={{ fontSize: 12, color: textMuted, padding: "6px 2px" }}>
                {n.gelesen ? "✓ Gelesen" : "Noch nicht gelesen"} · {n.text}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
