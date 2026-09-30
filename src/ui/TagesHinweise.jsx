import React from "react";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { aktuelleSession } from "../data/useAtemSessions";
import FokusGemeinsamKarte from "./FokusGemeinsamKarte";
import RoutineZeitHinweisKarte from "./RoutineZeitHinweisKarte";
import SchichtHeuteKarte from "./SchichtHeuteKarte";
import LaufenderTimerKarte from "./TimerRing";
import Top3Karte from "./Top3Karte";
import WochenCheckKarte from "./WochenCheckKarte";
import MatrixHeuteKarte from "./MatrixHeuteKarte";
import { ATEM_START_KEY, atemZeitenHeute, uebungFuerKey } from "../utils/atemBibliothek";
import { getADHSMode } from "../utils/adhsStorage";
import { werHatHeute } from "../data/gruppenprotokoll";

// Aktuelle Hinweise des Tages (29.09., Nutzerin: Startseite schlicht,
// „Aufteilen“ – Tagesaufgaben unter „Plan“). Früher oben auf der
// Startseite, jetzt oben im Tagesplan: laufender Timer, Top 3,
// Wochen-Check, Gruppen-Atmung, gemeinsam fokussieren, Schicht,
// Hinweis zu verspäteten Routinen. Jede Karte erscheint nur, wenn sie
// gerade etwas zu sagen hat.
const oeffne = (id) => {
  window.location.hash = `#/${id}`;
};

// ohneTimer: der Tagesplan zeigt den laufenden Timer in der Bild-Ansicht
// schon selbst (mit Abhaken beim Fertig), dann hier nicht doppelt.
export default function TagesHinweise({ onOpenView = oeffne, ohneTimer = false }) {
  const { atemSessions, team, isAdmin, atemZeiten, atemuebungLogs, atemuebungen, gruppenprotokolle, eigeneGruppenLogs } = useAppData();
  const { proband } = useAdmin();
  const session = team ? aktuelleSession(atemSessions) : null;
  // Feste Atem-Pausen (vorher „Als Nächstes“ auf der Startseite): offene
  // von heute, sobald sie in 30 Min. oder früher dran sind.
  const jetzt = new Date();
  const jetztMin = jetzt.getHours() * 60 + jetzt.getMinutes();
  const atemPausen = (getADHSMode() ? [] : atemZeitenHeute(atemZeiten || [], atemuebungLogs || [], jetzt))
    .filter((z) => !z.erledigt && Number(z.uhrzeit.slice(0, 2)) * 60 + Number(z.uhrzeit.slice(3, 5)) <= jetztMin + 30)
    .map((z) => ({ ...z, uebung: uebungFuerKey(z.uebungKey, atemuebungen || []) }));
  // Offene Gruppen-Gewohnheiten des Teams (vorher „Als Nächstes“ auf der
  // Startseite); Antippen führt zur Team-Seite, dort wird abgehakt.
  const tag = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-${String(jetzt.getDate()).padStart(2, "0")}`;
  const gruppenOffen = getADHSMode()
    ? []
    : (gruppenprotokolle || []).filter((gp) => !gp.abgelaufen).flatMap((gp) =>
        gp.bausteine
          .filter((b) => b.art === "eigen" && !(eigeneGruppenLogs || []).some((l) => l.bausteinId === b.id && l.datum === tag))
          .map((b) => ({ gp, b, wer: werHatHeute(gp.stand, b.id, tag) }))
      );
  const atemStarten = (key) => {
    try {
      sessionStorage.setItem(ATEM_START_KEY, key);
    } catch {
      // ohne Speicher öffnet sich einfach die Atem-Seite
    }
    onOpenView("atemuebungen");
  };
  return (
    <div data-tages-hinweise>
      {gruppenOffen.map(({ gp, b, wer }) => (
        <button
          key={b.id}
          type="button"
          className="mp-tap"
          data-gruppen-gewohnheit
          onClick={() => onOpenView("team")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "var(--mp-karte)", border: "none", borderLeft: "4px solid #2E9C86", boxShadow: "var(--mp-schatten)", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>{b.icon || "🌱"} {b.name}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--mp-text-muted)" }}>
              👥 {gp.name}
              {wer.length ? ` · ${wer.length} von ${gp.stand.mitglieder.length} schon ✓` : ""}
            </span>
          </span>
          <span style={{ fontSize: 18, color: "var(--mp-text-muted)" }}>›</span>
        </button>
      ))}
      {atemPausen.map((z) => (
        <button
          key={z.id}
          type="button"
          className="mp-tap"
          data-atem-pause
          onClick={() => atemStarten(z.uebungKey)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "color-mix(in srgb, #D9F2F8 var(--mp-flaeche), var(--mp-karte))", border: "none", borderLeft: "4px solid #12A5C6", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>🌬️ Atem-Pause · {z.uhrzeit}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--mp-text-muted)" }}>
              {z.uebung?.name || "Atemübung"} · {z.dauerMinuten} Min.
            </span>
          </span>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#0B6378" }}>▶ Starten</span>
        </button>
      ))}
      {!ohneTimer && <LaufenderTimerKarte />}
      <MatrixHeuteKarte onOeffnen={() => onOpenView("matrix")} />
      {proband === null && <Top3Karte />}
      {proband === null && <WochenCheckKarte />}
      {session && (
        <button
          type="button"
          className="mp-tap"
          onClick={() => onOpenView("atemuebungen")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-karte))", border: "2px solid #2E9C86", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ fontSize: 26 }}>👥</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontWeight: 900, fontSize: 14 }}>Gemeinsam atmen</span>
            <span style={{ display: "block", fontSize: 12.5, color: "color-mix(in srgb, #1E6E57 var(--mp-schrift), var(--mp-schrift-hell))" }}>
              {new Date(session.startUm) > new Date() ? `startet um ${new Date(session.startUm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : "läuft gerade"} · Mitmachen ›
            </span>
          </span>
        </button>
      )}
      {proband === null && <FokusGemeinsamKarte onOeffnen={() => onOpenView("fokus")} />}
      <SchichtHeuteKarte />
      {proband === null && <RoutineZeitHinweisKarte zeigeCoachKnopf={!isAdmin} onCoachChat={() => onOpenView("coach-chat")} />}
    </div>
  );
}
