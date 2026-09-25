import React, { useState } from "react";
import { Shell, Card } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TagebuchFormular from "../ui/TagebuchFormular";
import { textMuted, cardBorder } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { MUSTER_MIN_EINTRAEGE, autoZeilen, stimmungEmoji, tagebuchMuster, tagebuchZeile } from "../utils/tagebuch";

// Kontext-Tagebuch (25.09., Vorschau freigegeben): Eintrag für heute oder
// gestern, "Was deine guten Tage gemeinsam haben" und der Verlauf. Geht
// auch per Aka ("Mein Tag war gut, war mit Freunden im Park …").
export default function TagebuchView({ onHome }) {
  const { tagebuchEintraege = [] } = useAppData();
  const heute = toLocalISODate(new Date());
  const gestern = toLocalISODate(new Date(Date.now() - 86400000));
  const [datum, setDatum] = useState(heute);
  const [neuKey, setNeuKey] = useState(0);
  const vorhanden = tagebuchEintraege.find((e) => e.datum === datum);
  const m = tagebuchMuster(tagebuchEintraege.filter((e) => e.datum >= toLocalISODate(new Date(Date.now() - 60 * 86400000))));

  return (
    <Shell>
      <ViewHeader title="📓 Tagebuch" onHome={onHome} />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[
            [heute, "Heute"],
            [gestern, "Gestern"],
          ].map(([d, label]) => (
            <button
              key={d}
              type="button"
              aria-pressed={datum === d}
              onClick={() => {
                setDatum(d);
                setNeuKey((k) => k + 1);
              }}
              style={{ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: datum === d ? "#1B2350" : "#EEF4FF", color: datum === d ? "#fff" : "#2D6FD6" }}
            >
              {label}
              {tagebuchEintraege.some((e) => e.datum === d) ? " ✓" : ""}
            </button>
          ))}
        </div>
        <TagebuchFormular key={`${datum}-${neuKey}-${vorhanden ? "v" : "n"}`} datum={datum} vorhanden={vorhanden} />
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>✨ Was deine guten Tage gemeinsam haben</div>
        {!m.bereit ? (
          <div style={{ fontSize: 13, color: textMuted, marginTop: 6, lineHeight: 1.45 }}>
            Ab {MUSTER_MIN_EINTRAEGE} Einträgen (mit ein paar guten und schweren Tagen) zeigt dir die App hier, was an guten Tagen anders war. Bisher: {m.anzahl} Einträge.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: textMuted, margin: "4px 0 8px" }}>
              Letzte 60 Tage · {m.gut} gute · {m.schwer} schwere Tage – Zusammenhänge, keine Beweise.
            </div>
            {m.muster.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch kein deutlicher Unterschied – weiter eintragen.</div>}
            {m.muster.slice(0, 6).map((x) => (
              <div key={x.key} data-muster={x.key} style={{ padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{x.label}</span>
                  <b>
                    gut {x.gut}/{x.gutVon} · schwer {x.schwer}/{x.schwerVon}
                  </b>
                </div>
                <div style={{ height: 7, borderRadius: 5, background: "#E4E6EE", marginTop: 3 }}>
                  <div style={{ width: `${Math.round(Math.abs(x.unterschied) * 100)}%`, height: "100%", borderRadius: 5, background: x.richtung === "gut" ? "#1E8E5A" : "#E0352B" }} />
                </div>
              </div>
            ))}
            {m.muster[0] && (
              <div style={{ fontSize: 12.5, background: "#FFF6E0", borderRadius: 12, padding: "8px 10px", marginTop: 10 }}>
                💡 Größter Unterschied: <b>{m.muster[0].label.replace(/^[^\p{L}\d]+\s/u, "")}</b>
                {m.muster[0].richtung === "gut" ? " – kommt an deinen guten Tagen deutlich öfter vor." : " – kommt an deinen schweren Tagen deutlich öfter vor."}
              </div>
            )}
          </>
        )}
      </Card>

      {tagebuchEintraege.length > 0 && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 6 }}>Verlauf</div>
          {[...tagebuchEintraege]
            .reverse()
            .slice(0, 30)
            .map((e) => (
              <div key={e.datum} style={{ padding: "7px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 12.5 }}>
                <b>{new Date(`${e.datum}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}</b> · {tagebuchZeile(e)}
                {autoZeilen(e.auto).length > 0 && <div style={{ color: textMuted, fontSize: 11.5 }}>{autoZeilen(e.auto).join(" · ")}</div>}
                {e.notiz && (
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {e.notizTeilen ? "👁" : "🔒"} {e.notiz}
                  </div>
                )}
              </div>
            ))}
        </Card>
      )}
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.45, margin: "14px 2px 24px" }}>
        {stimmungEmoji(4)} Tipp: Auch per Aka möglich, z. B. „Mein Tag war gut, war mit Freunden im Park, abends zu viel Zucker.“
      </div>
    </Shell>
  );
}
