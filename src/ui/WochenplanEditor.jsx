import React from "react";
import { Card, Pill, TextInput } from "./primitives";
import { cardBorder, textMuted } from "./theme";
import { TRAININGSARTEN, WOCHENTAGE } from "../constants";

export const WOCHENTAGE_VOLL = { Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag", Fr: "Freitag", Sa: "Samstag", So: "Sonntag" };

// Wochenplan: welche Trainingsart (optional mit Vorlage) an welchem Wochentag
// ansteht — erscheint danach automatisch im Tagesplan, ohne dass etwas
// vorab manuell für jeden Tag angelegt werden muss. Geteilt zwischen
// TrainingView (laufende Pflege) und dem Onboarding-Trainingsschritt
// (Ersteinrichtung), damit "was trainierst du an welchem Tag" an beiden
// Stellen dieselbe echte Auswahl bietet statt nur einer Häufigkeitszahl.
export default function WochenplanEditor({ trainingWochenplan, trainingTemplates = [], wochenplanSetzen, wochenplanEntfernen, titel = "Wochenplan" }) {
  return (
    <>
      {titel && <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{titel}</div>}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Leg fest, was an welchem Tag ansteht — erscheint danach automatisch in deinem Tagesplan.
        </div>
        {WOCHENTAGE.map((tag) => {
          const zuweisung = trainingWochenplan.find((w) => w.wochentag === tag);
          const passendeVorlagen = trainingTemplates.filter((t) => t.art === zuweisung?.art);
          return (
            <div key={tag} style={{ padding: "10px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{WOCHENTAGE_VOLL[tag]}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <Pill label="Ruhetag" selected={!zuweisung} onClick={() => wochenplanEntfernen(tag)} />
                {TRAININGSARTEN.map((a) => (
                  <Pill
                    key={a}
                    label={a}
                    selected={zuweisung?.art === a}
                    onClick={() => wochenplanSetzen(tag, { art: a, templateId: null, uhrzeit: zuweisung?.uhrzeit || "08:00" })}
                  />
                ))}
              </div>
              {zuweisung && passendeVorlagen.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
                  {passendeVorlagen.map((t) => (
                    <Pill
                      key={t.id}
                      label={`📋 ${t.name}`}
                      selected={zuweisung.templateId === t.id}
                      onClick={() =>
                        wochenplanSetzen(tag, {
                          art: zuweisung.art,
                          templateId: zuweisung.templateId === t.id ? null : t.id,
                          uhrzeit: zuweisung.uhrzeit,
                        })
                      }
                    />
                  ))}
                </div>
              )}
              {zuweisung && (
                <div style={{ marginTop: 8, maxWidth: 160 }}>
                  <TextInput
                    type="time"
                    value={zuweisung.uhrzeit || "08:00"}
                    onChange={(v) => wochenplanSetzen(tag, { art: zuweisung.art, templateId: zuweisung.templateId, uhrzeit: v })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}
