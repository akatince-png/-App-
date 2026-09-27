import React, { useEffect, useState } from "react";
import { cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { nachweisEntscheiden, nachweisUrl, nachweiseLaden } from "../../data/videoNachweise";
import { ART_TEXT, LOESCH_TAGE, restTage } from "../../utils/videoNachweis";

// Video-Nachweise in der Coach-Übersicht (27.09.): nur der Coach bestätigt.
// Nach "✓ Bestätigen" oder "Passt nicht" wird das Video sofort gelöscht;
// der Eintrag (wer, was, wann, Ergebnis) bleibt.
export default function NachweiseCoach({ namen }) {
  const [liste, setListe] = useState(null);
  const [offen, setOffen] = useState(false);
  const [urls, setUrls] = useState({});
  const [fehler, setFehler] = useState(null);

  const laden = async () => setListe(await nachweiseLaden());
  useEffect(() => {
    laden();
  }, []);

  if (!liste?.length) return null;

  const ansehen = async (n) => {
    const url = await nachweisUrl(n.pfad);
    if (!url) setFehler("Video ließ sich nicht laden.");
    else setUrls((u) => ({ ...u, [n.id]: url }));
  };
  const entscheiden = async (n, status) => {
    setFehler(null);
    const r = await nachweisEntscheiden(n, status);
    if (!r.ok) setFehler(r.error);
    else setListe((l) => l.filter((x) => x.id !== n.id));
  };
  const knopf = (farbe, hell) => ({ border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: hell ? "#EEF0F5" : farbe, color: hell ? textMain : "#fff" });

  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${cardBorder}`, background: "#fff", padding: "10px 12px", marginBottom: 10 }} data-nachweise>
      <button type="button" data-programme-toggle aria-expanded={offen} onClick={() => setOffen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", color: textMain }}>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>🎥 Video-Nachweise: {liste.length} warten auf dich</span>
        <span style={{ color: textMuted }}>{offen ? "▾" : "›"}</span>
      </button>
      {offen && (
        <>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>Nach deiner Entscheidung wird das Video gelöscht. Unbestätigte Videos verschwinden nach {LOESCH_TAGE} Tagen.</div>
          {liste.map((n) => (
            <div key={n.id} style={{ borderTop: "1px solid #F0F1F5", marginTop: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>
                {namen[n.user_id] || "Coachee"} · {ART_TEXT[n.art] || n.art}
              </div>
              <div style={{ fontSize: 12.5, color: textMain }}>{n.titel}</div>
              <div style={{ fontSize: 11.5, color: textMuted }}>
                {new Date(n.created_at).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {n.dauer_sek ? ` · ${n.dauer_sek} Sek.` : ""} · wird in {restTage(n.created_at)} {restTage(n.created_at) === 1 ? "Tag" : "Tagen"} gelöscht
              </div>
              {urls[n.id] ? (
                <video src={urls[n.id]} controls playsInline style={{ width: "100%", maxHeight: 320, borderRadius: 12, background: "#000", marginTop: 6 }} />
              ) : (
                <button type="button" style={{ ...knopf("#2D6FD6"), marginTop: 6 }} onClick={() => ansehen(n)}>
                  ▶ Ansehen
                </button>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" style={knopf("#2E9C86")} onClick={() => entscheiden(n, "bestaetigt")}>
                  ✓ Bestätigen
                </button>
                <button type="button" style={knopf(null, true)} onClick={() => entscheiden(n, "passt_nicht")}>
                  Passt nicht
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
