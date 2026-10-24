import React from "react";
import { Card } from "../../ui/primitives";
import { textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import PersoenlicheDatenCard from "../../ui/PersoenlicheDatenCard";
import WoechentlicheCheckinsCard from "../../ui/WoechentlicheCheckinsCard";
import LaborwerteCard from "../../ui/LaborwerteCard";
import ProfilbildKarte from "../../ui/ProfilbildKarte";
import Steckbrief from "../../ui/Steckbrief";
import { useAuth } from "../../context/AuthContext";

export default function ProfilTab() {
  const { aktiveMesswerte, combinedMesswertDefs, gewichtsEintraege, schlafDurchschnitt7Tage, userId, profilbildPfad, startdatum, dauer } = useAppData();
  const { user } = useAuth();
  let vorname = null;
  try {
    vorname = localStorage.getItem("user_name");
  } catch {
    vorname = null;
  }
  const protokoll = protokollFortschritt(startdatum, dauer);

  return (
    <>
      <Steckbrief
        personId={userId}
        name={vorname || user?.email || "Du"}
        untertitel={user?.email}
        profilbildPfad={profilbildPfad}
        fortschritte={protokoll ? [{ label: "Protokoll", anteil: protokoll.anteil, text: `Tag ${protokoll.tag} von ${protokoll.gesamt}` }] : []}
      />
      <ProfilbildKarte />
      <PersoenlicheDatenCard />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Diese Woche im Überblick</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--mp-accent-dark-text)" }}>{schlafDurchschnitt7Tage !== null ? `${schlafDurchschnitt7Tage} h` : "—"}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Ø Schlaf / Woche</div>
          </div>
          {gewichtsEintraege.length > 0 &&
            aktiveMesswerte
              .filter((id) => id !== "energie" && id !== "blutdruck")
              .slice(0, 3)
              .map((id) => {
                const def = combinedMesswertDefs.find((d) => d.id === id);
                const letzter = gewichtsEintraege[gewichtsEintraege.length - 1];
                return (
                  <div key={id}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      {letzter[id] !== "" && letzter[id] !== undefined ? letzter[id] : "—"} {def?.unit}
                    </div>
                    <div style={{ fontSize: 11, color: textMuted }}>{def?.label}</div>
                  </div>
                );
              })}
        </div>
      </Card>

      <WoechentlicheCheckinsCard />

      <LaborwerteCard />
    </>
  );
}

// Tag X von Y des laufenden Protokolls (für den Fortschrittsbalken im Steckbrief).
function protokollFortschritt(startdatum, dauerWochen) {
  if (!startdatum || !dauerWochen) return null;
  const gesamt = dauerWochen * 7;
  const tag = Math.min(gesamt, Math.max(1, Math.floor((Date.now() - new Date(`${startdatum}T00:00:00`)) / 86400000) + 1));
  return { tag, gesamt, anteil: tag / gesamt };
}
