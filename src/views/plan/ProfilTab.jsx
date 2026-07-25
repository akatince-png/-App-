import React from "react";
import { Card } from "../../ui/primitives";
import { accentDark, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import PersoenlicheDatenCard from "../../ui/PersoenlicheDatenCard";
import WoechentlicheCheckinsCard from "../../ui/WoechentlicheCheckinsCard";
import LaborwerteCard from "../../ui/LaborwerteCard";

export default function ProfilTab() {
  const { aktiveMesswerte, combinedMesswertDefs, gewichtsEintraege, schlafDurchschnitt7Tage } = useAppData();

  return (
    <>
      <PersoenlicheDatenCard />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Diese Woche im Überblick</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: accentDark }}>{schlafDurchschnitt7Tage !== null ? `${schlafDurchschnitt7Tage} h` : "—"}</div>
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
