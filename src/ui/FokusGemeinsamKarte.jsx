import React, { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { aktuelleRunde, gradeDabei, laeuft, meineOffene, restMinuten, sitzungEnde } from "../utils/fokusGemeinsam";

// Startseite (27.09.): zeigt "Gemeinsam fokussieren" nur, wenn gerade etwas
// los ist – meine Runde läuft, wartet auf "Wie lief's?", jemand aus dem Team
// fokussiert gerade oder eine Coach-Runde steht an. Sonst nichts (die
// Kachel unten bleibt der feste Einstieg).
const LILA = "#7C5CE0";

export default function FokusGemeinsamKarte({ onOeffnen }) {
  const { userId, team, teamKollegen = [], fokusSitzungen = [], fokusRunden = [] } = useAppData();
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setJetzt(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const meine = meineOffene(fokusSitzungen, userId, jetzt);
  const andere = team ? gradeDabei(fokusSitzungen, userId, jetzt) : [];
  const runde = aktuelleRunde(fokusRunden, jetzt);

  let titel = null;
  let zeile = null;
  if (meine && laeuft(meine, jetzt) && jetzt < sitzungEnde(meine)) {
    titel = `Du fokussierst: ${meine.ziel || "deine Sache"}`;
    zeile = `noch ${restMinuten(meine, jetzt)} Min.${andere.length ? ` · ${andere.length} mit dir` : ""}`;
  } else if (meine) {
    titel = "Fokus-Runde vorbei – wie lief's?";
    zeile = "Kurz eintragen ›";
  } else if (runde) {
    titel = runde.titel || "Fokus-Runde mit deinem Coach";
    zeile = `${new Date(runde.startUm).getTime() > jetzt ? `startet um ${new Date(runde.startUm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : "läuft gerade"} · Mitmachen ›`;
  } else if (andere.length) {
    const namen = andere.map((s) => teamKollegen.find((k) => k.id === s.userId)?.vorname).filter(Boolean);
    titel = namen.length ? `${namen.slice(0, 2).join(" und ")}${namen.length > 2 ? ` +${namen.length - 2}` : ""} fokussier${andere.length === 1 ? "t" : "en"} gerade` : `${andere.length} aus deinem Team fokussieren gerade`;
    zeile = "Mitmachen ›";
  }
  if (!titel) return null;

  return (
    <button
      type="button"
      className="mp-tap"
      onClick={onOeffnen}
      data-fokus-karte
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "#F1EDFF", border: `2px solid ${LILA}`, cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
    >
      <span style={{ fontSize: 26 }}>🎯</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 900, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titel}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "#5B3FC4" }}>{zeile}</span>
      </span>
    </button>
  );
}
