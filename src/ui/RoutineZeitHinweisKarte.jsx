import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { cardBorder, textMuted } from "./theme";
import { COACH_CHAT_ENTWURF_KEY, HINWEIS_RUHE_TAGE, ZEIT_HINWEIS_NAME, hinweisRuht, minZuUhrzeit, satzAnCoach, verspaetungsMuster } from "../utils/routineVerspaetung";

// "Passt deine Morgenroutine-Zeit noch?" (25.09., Nutzerinnen-Freigabe der
// Vorschau): erscheint, wenn die Routine an 3 von 5 Tagen mehr als 30 Min.
// später als geplant geklappt hat. Drei Wege, jeder wird protokolliert:
// Zeit umstellen, mit dem Coach besprechen (Chat mit vorbereitetem Satz),
// "passt so" (eine Woche Ruhe). Die Routine selbst läuft unverändert weiter.
const FARBE = { spaet: "#E0A21B", ok: "#1E8E5A", leer: "#E4E6EE" };

export default function RoutineZeitHinweisKarte({ zeigeCoachKnopf, onCoachChat }) {
  const { routineDurchlaeufe, routineEinstellungen, protokollEintraege, routineZeitrahmenSetzen, aenderungVermerken } = useAppData();
  const [erledigt, setErledigt] = useState(null);

  const muster = ["morgen", "abend"]
    .map((r) => verspaetungsMuster(routineDurchlaeufe, r, routineEinstellungen?.[r]?.startZeit))
    .find((m) => m && !hinweisRuht(protokollEintraege, m.routine));

  if (erledigt) {
    return (
      <div role="status" style={{ marginBottom: 14, borderRadius: 18, padding: "12px 14px", background: "#EAF7F0", border: "1.5px solid #BFE5D0", fontSize: 13.5, fontWeight: 700 }}>
        {erledigt}
      </div>
    );
  }
  if (!muster) return null;

  const kategorie = muster.routine === "morgen" ? "morgenroutine" : "abendroutine";
  const vermerken = (detail) => aenderungVermerken({ kategorie, itemName: ZEIT_HINWEIS_NAME, aktion: "geändert", detail });

  const umstellen = async () => {
    // Ende um dieselbe Spanne mitverschieben, damit der Zeitrahmen gleich lang bleibt.
    const alt = routineEinstellungen?.[muster.routine]?.endZeit || "";
    const zuMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
    const endZeit = alt ? minZuUhrzeit(zuMin(alt) + zuMin(muster.vorschlag) - zuMin(muster.startZeit)) : "";
    const r = await routineZeitrahmenSetzen(muster.routine, muster.vorschlag, endZeit);
    if (!r?.ok) return;
    vermerken(`Startzeit ${muster.startZeit} → ${muster.vorschlag}${alt ? `, Ende ${alt} → ${endZeit}` : ""} (nach ${muster.spaetAnzahl} späten Tagen)`);
    setErledigt(`✓ ${muster.label} startet jetzt um ${muster.vorschlag}.`);
  };
  const mitCoach = () => {
    try {
      sessionStorage.setItem(COACH_CHAT_ENTWURF_KEY, satzAnCoach(muster));
    } catch {
      // ohne Speicher öffnet der Chat einfach leer
    }
    vermerken(`Mit Coach besprechen (meist ${muster.vorschlag} statt ${muster.startZeit})`);
    onCoachChat?.();
  };
  const passtSo = () => {
    vermerken(`Passt so – Startzeit bleibt ${muster.startZeit}, ${HINWEIS_RUHE_TAGE} Tage nicht mehr fragen`);
    setErledigt(`Alles klar – ${muster.startZeit} bleibt. Ich frag frühestens in einer Woche wieder.`);
  };

  const knopf = { width: "100%", border: "none", borderRadius: 14, padding: "12px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8 };

  return (
    <section aria-label={`Passt deine ${muster.label}-Zeit noch?`} style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: `2px solid ${FARBE.spaet}` }}>
      <div style={{ fontWeight: 900, fontSize: 15 }}>
        {muster.routine === "morgen" ? "🌅" : "🌙"} Passt deine {muster.label}-Zeit noch?
      </div>
      <div style={{ fontSize: 13, color: "#4A5170", marginTop: 4, lineHeight: 1.4 }}>
        An {muster.spaetAnzahl} der letzten {muster.tage.length} Tage hat sie erst später geklappt – meist gegen <b>{muster.vorschlag}</b> statt um {muster.startZeit}. Das ist okay, geschafft ist geschafft.
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }} aria-hidden="true">
        {muster.tage.map((t) => (
          <div key={t.datum} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: 26,
                borderRadius: 7,
                background: t.min === null ? FARBE.leer : t.min > 30 ? FARBE.spaet : FARBE.ok,
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {t.uhrzeit || ""}
            </div>
            <div style={{ fontSize: 10.5, color: textMuted, marginTop: 2 }}>{t.kurz}</div>
          </div>
        ))}
      </div>
      <button type="button" className="mp-tap" onClick={umstellen} style={{ ...knopf, background: "#1B2350", color: "#fff", marginTop: 12 }}>
        Auf {muster.vorschlag} umstellen
      </button>
      {zeigeCoachKnopf && (
        <button type="button" className="mp-tap" onClick={mitCoach} style={{ ...knopf, background: "#EEF4FF", color: "#2D6FD6" }}>
          💬 Mit meinem Coach besprechen
        </button>
      )}
      <button type="button" className="mp-tap" onClick={passtSo} style={{ ...knopf, background: "transparent", color: textMuted, border: `1.5px solid ${cardBorder}` }}>
        Nein, passt so (1 Woche nicht fragen)
      </button>
    </section>
  );
}
