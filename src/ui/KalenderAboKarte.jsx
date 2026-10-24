import React, { useState } from "react";
import { Card, PrimaryButton } from "./primitives";
import { cardBorder, danger, textMain, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { aboAdresse, useKalenderAbo, webcalAdresse } from "../data/useKalenderAbo";

// Kalender-Abo (24.10., Nutzerin: Tagesplan, To-dos und Woche auf dem Tablet
// sehen, „ohne dass ich immer nur die App direkt öffnen muss“). Echte Widgets
// gehen als Web-App nicht; mit dem Abo zeigen die Kalender-Widgets von Apple
// oder Google den AKA-Plan. Ohne Notizen und ohne Gesundheitsdaten.
export default function KalenderAboKarte() {
  const { userId, alltagBereiche = [] } = useAppData();
  const { abo, ladend, fehler, anlegen, neuesToken, bereichUmschalten, beenden } = useKalenderAbo(userId);
  const [offen, setOffen] = useState(false);
  const [kopiert, setKopiert] = useState(false);

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(aboAdresse(abo.token));
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch {
      window.prompt("Link kopieren:", aboAdresse(abo.token));
    }
  };

  return (
    <Card style={{ marginTop: 14 }}>
      <button
        type="button"
        data-kalender-abo
        aria-expanded={offen}
        onClick={() => setOffen(!offen)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
      >
        <span style={{ fontSize: 22 }}>📲</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: textMain }}>Im Handy-Kalender anzeigen</span>
          <span style={{ display: "block", fontSize: 12, color: textMuted }}>{abo ? "Abo aktiv – Plan erscheint im Kalender und in dessen Widgets" : "Routinen, Alltag, To-dos und Training als Kalender-Abo"}</span>
        </span>
        <span style={{ color: textMuted }}>{offen ? "▲" : "▼"}</span>
      </button>

      {offen && (
        <div style={{ marginTop: 12, fontSize: 13, color: textMain }}>
          <div style={{ color: textMuted, marginBottom: 10 }}>
            Dein Apple- oder Google-Kalender holt sich den AKA-Plan regelmäßig (etwa stündlich): Morgen- und Abendroutine, „Mein Alltag“, offene
            To-dos mit Datum und dein Training. Medikamente, Supplemente, Werte und Notizen bleiben in der App. Abhaken geht weiter nur in AKA.
          </div>
          {ladend ? (
            <div style={{ color: textMuted }}>Lädt…</div>
          ) : !abo ? (
            <PrimaryButton onClick={anlegen}>Kalender-Abo einrichten</PrimaryButton>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a
                  href={webcalAdresse(abo.token)}
                  data-kalender-abo-apple
                  style={{ display: "block", textAlign: "center", textDecoration: "none", borderRadius: 14, padding: "11px 12px", fontWeight: 800, background: "#1B2350", color: "#fff" }}
                >
                  📅 In Apple-Kalender abonnieren
                </a>
                <PrimaryButton variant="ghost" onClick={kopieren}>
                  {kopiert ? "✓ Link kopiert" : "🔗 Link kopieren (z. B. für Google Kalender)"}
                </PrimaryButton>
              </div>
              <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
                Google: calendar.google.com → „Weitere Kalender“ + → „Per URL“ → Link einfügen.
                {abo.abgerufen_am && ` Zuletzt abgerufen: ${new Date(abo.abgerufen_am).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}.`}
              </div>

              {alltagBereiche.length > 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${cardBorder}`, paddingTop: 10 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Welche eigenen Bereiche sollen mit?</div>
                  {alltagBereiche.map((b) => {
                    const dabei = !(abo.ohne_bereiche || []).includes(b.id);
                    return (
                      <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                        <input type="checkbox" checked={dabei} onChange={() => bereichUmschalten(b.id)} />
                        {b.icon} {b.name}
                      </label>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={() => window.confirm("Neuen Link erstellen? Der alte funktioniert dann sofort nicht mehr – du musst im Kalender neu abonnieren.") && neuesToken()} style={kleinKnopf(textMain)}>
                  🔒 Link sperren
                </button>
                <button type="button" onClick={() => window.confirm("Kalender-Abo beenden? Der Link funktioniert dann nicht mehr.") && beenden()} style={kleinKnopf(danger)}>
                  Abo beenden
                </button>
              </div>
            </>
          )}
          {fehler && <div style={{ color: danger, marginTop: 8 }}>{fehler}</div>}
        </div>
      )}
    </Card>
  );
}

const kleinKnopf = (farbe) => ({ border: `1px solid ${cardBorder}`, background: "transparent", color: farbe, borderRadius: 10, padding: "6px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });
