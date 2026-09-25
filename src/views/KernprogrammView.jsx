import React, { useMemo, useState } from "react";
import { Shell, Card } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import SportBausteinFormular from "../ui/SportBausteinFormular";
import { EtappenBalken } from "../ui/KernprogrammKarte";
import { cardBorder, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { plusTage } from "../utils/schichtplan";
import { BAUSTEINE, ETAPPEN_NAME, WOCHEN, ampel, bilanzAusAppData, datumKurz, pauseFuer } from "../utils/kernprogramm";

const AMPEL_FARBE = { gruen: "#1E8E5A", gelb: "#C27A00", rot: "#E0352B", grau: "#9AA0AA" };

// Übersicht AKA-Coaching (#/coaching, 25.09., Vorschau freigegeben):
// Etappen mit Gesprächen, Bausteine der letzten 7 Tage, alle Pflicht-
// Bausteine mit der Woche, in der sie dazukommen, und die Sport-Einstellung.
export default function KernprogrammView({ onHome }) {
  const appData = useAppData();
  const { kernStand: stand, kernEtappen = [], routineKernPausen = [], trainingWochenplan = [] } = appData;
  const heute = toLocalISODate(new Date());
  const bilanz = useMemo(() => (stand?.aktiv ? bilanzAusAppData(appData, plusTage(heute, -6), heute, heute) : []), [stand, appData, heute]);
  const [sportOffen, setSportOffen] = useState(false);

  return (
    <Shell>
      <ViewHeader title="🧭 Mein AKA-Coaching" onHome={onHome} />
      {!stand?.aktiv && !stand?.geplant && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>Dein Coach startet dein Programm. Danach siehst du hier deine Etappen und Bausteine.</div>
        </Card>
      )}

      {kernEtappen.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, marginBottom: 6 }}>DEINE ETAPPEN · JE 4 WOCHEN</div>
          {kernEtappen.map((e) => {
            const laeuft = stand?.etappe?.id === e.id;
            return (
              <div key={e.id} style={{ padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }} data-etappe={e.nummer}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                  Etappe {e.nummer} – {ETAPPEN_NAME[e.art]} {e.status === "abgeschlossen" ? "✓" : laeuft ? `· Woche ${stand.woche} von 4` : ""}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {datumKurz(e.start)} – {datumKurz(e.ende)} · 💬 Gespräch {e.gespraechAm ? `am ${datumKurz(e.gespraechAm)} ✓` : `ca. ${datumKurz(e.ende)}`}
                </div>
                {laeuft && <EtappenBalken stand={stand} hell />}
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: textMuted, marginTop: 8, lineHeight: 1.45 }}>
            Etappe 1 führt die Bausteine Woche für Woche ein. Danach Erhaltung: nichts Neues, dranbleiben. Nach jeder Etappe sprichst du mit deinem Coach.
          </div>
        </Card>
      )}

      {stand?.aktiv && stand.erhaltung && (
        <Card style={{ marginBottom: 14, background: "#E8F7F2", border: "none" }}>
          <div style={{ fontWeight: 900, fontSize: 14.5 }}>🔁 Erhaltung: nichts Neues dazu</div>
          <div style={{ fontSize: 12.5, color: "#1E4D40", lineHeight: 1.45, marginTop: 3 }}>Alle Bausteine laufen weiter. Sonntags gibt es einen kurzen Wochen-Check auf der Startseite.</div>
        </Card>
      )}

      {bilanz.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, marginBottom: 4 }}>DEINE BAUSTEINE · LETZTE 7 TAGE</div>
          {bilanz.map((b) => (
            <div key={b.key} data-baustein={b.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <span>
                {b.icon} {b.name}
                {b.pausiert && <span style={{ color: textMuted, fontSize: 12 }}> · ⏸ pausiert</span>}
              </span>
              <b style={{ color: AMPEL_FARBE[ampel(b)] }}>{b.von ? `${b.erledigt}/${b.von}` : "–"}</b>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, marginBottom: 4 }}>ALLE PFLICHT-BAUSTEINE 🔒</div>
        {[1, 2, 3, 4].map((w) => (
          <div key={w} style={{ padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: stand?.aktiv && stand.einfuehrungWoche >= w ? "#1B2350" : textMuted }}>
              Woche {w} · {WOCHEN[w].icon} {WOCHEN[w].titel}
              {stand?.aktiv && stand.einfuehrungWoche < w && " (kommt noch)"}
            </div>
            <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.6 }}>
              {BAUSTEINE.filter((b) => b.woche === w)
                .map((b) => `${b.icon} ${b.name}${b.routine ? (b.routine === "morgen" ? " (morgens)" : " (abends)") : ""}${pauseFuer(routineKernPausen, b.key, heute) ? " ⏸" : ""}`)
                .join(" · ")}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: textMuted, marginTop: 8, lineHeight: 1.45 }}>
          Uhrzeit, Art und Dauer stellst du selbst ein (in deiner Morgen-/Abendroutine auf 🔒✎ tippen). Pausieren kann nur dein Coach, z. B. bei einer Verletzung.
        </div>
      </Card>

      {stand?.aktiv && stand.einfuehrungWoche >= 2 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 900, fontSize: 15 }}>🏋️ Dein Sport</div>
          <div style={{ fontSize: 12.5, color: textMuted, margin: "3px 0 10px" }}>Nicht ob – nur welche Sportart, wann und wie oft (2–3× pro Woche).</div>
          {trainingWochenplan.length > 0 && !sportOffen ? (
            <>
              <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                {trainingWochenplan.map((w) => (
                  <div key={w.id}>
                    {w.wochentag} {w.uhrzeit ? `${String(w.uhrzeit).slice(0, 5)} · ` : ""}
                    {w.name || (w.arten || []).join(" / ")}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setSportOffen(true)} style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: "8px 0 0" }}>
                ＋ weitere Sportart hinzufügen
              </button>
            </>
          ) : (
            <SportBausteinFormular onGespeichert={() => setSportOffen(false)} />
          )}
        </Card>
      )}
    </Shell>
  );
}
