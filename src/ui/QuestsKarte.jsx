import React, { useState } from "react";
import { Card, TextArea, TextInput, PrimaryButton } from "./primitives";
import { danger, success, textMain, textMuted } from "./theme";

// Freiwillige Sonderaufgaben von der Coach (16.08., Nutzerinnen-Vorgabe:
// "sone Quest, sone Sonderaufgabe an meine Coachees erteilen zu können") —
// nur für Coachees sichtbar, Anlegen/Auswerten läuft bei der Admin über
// AdminQuestsView.jsx. Gemeinsame Komponente für HomeView.jsx (zeigt ALLE
// sichtbaren Quests inkl. Annehmen/Ablehnen-Einladung),
// GewohnheitenView.jsx und TagesplanView.jsx (zeigen nur bereits
// angenommene, noch offene Quests — Nutzerinnen-Vorgabe: "wenn sie die
// Quest annehmen und antreten, dann soll sie ... im Tagesplan ... und
// unter Gewohnheiten ... mit aufgeführt werden").
export function QuestsKarte({ quests, onFortschritt, titel = "🎯 Quests von deinem Coach — freiwillig, zusätzlich zu deinem Protokoll." }) {
  if (!quests || quests.length === 0) return null;
  const offen = quests.filter((q) => !q.fortschritt.erledigt);
  const erledigt = quests.filter((q) => q.fortschritt.erledigt);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 8 }}>{titel}</div>
      {offen.map((q) => (
        <QuestZeile key={q.id} quest={q} onFortschritt={onFortschritt} />
      ))}
      {erledigt.map((q) => (
        <QuestZeile key={q.id} quest={q} onFortschritt={onFortschritt} />
      ))}
    </div>
  );
}

function QuestZeile({ quest, onFortschritt }) {
  const [offen, setOffen] = useState(false);
  const [wert, setWert] = useState(quest.fortschritt.wert ?? "");
  const [notiz, setNotiz] = useState(quest.fortschritt.notiz || "");
  const [dauer, setDauer] = useState(quest.fortschritt.dauerMinuten ?? "");
  const [speichern, setSpeichern] = useState(false);

  const reagieren = async (angenommen) => {
    setSpeichern(true);
    await onFortschritt(quest.id, { angenommen });
    setSpeichern(false);
  };

  const fortschrittSpeichern = async () => {
    setSpeichern(true);
    await onFortschritt(quest.id, { wert });
    setSpeichern(false);
  };

  const abschliessen = async () => {
    setSpeichern(true);
    await onFortschritt(quest.id, { wert, notiz, dauerMinuten: dauer, erledigt: true });
    setSpeichern(false);
    setOffen(false);
  };

  const zuruecksetzen = async () => {
    setSpeichern(true);
    await onFortschritt(quest.id, { erledigt: false });
    setSpeichern(false);
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>{quest.titel}</div>
          {quest.beschreibung && <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{quest.beschreibung}</div>}
          {quest.typ === "anzahl" && quest.zielAnzahl && (
            <div style={{ fontSize: 11.5, color: textMuted, marginTop: 3 }}>
              Ziel: {quest.zielAnzahl} {quest.einheit}
            </div>
          )}
        </div>
      </div>

      {quest.fortschritt.erledigt ? (
        <div style={{ marginTop: 10, fontSize: 12.5, color: success }}>
          ✅ Erledigt
          {quest.fortschritt.erledigtAm ? ` am ${new Date(quest.fortschritt.erledigtAm).toLocaleDateString("de-DE")}` : ""}
          {quest.fortschritt.dauerMinuten ? ` · ${quest.fortschritt.dauerMinuten} Min.` : ""}
          {quest.fortschritt.notiz && <div style={{ color: textMuted, marginTop: 2 }}>„{quest.fortschritt.notiz}“</div>}
          <div style={{ marginTop: 8 }}>
            <PrimaryButton variant="ghost" onClick={zuruecksetzen} disabled={speichern}>
              Zurücksetzen
            </PrimaryButton>
          </div>
        </div>
      ) : quest.fortschritt.angenommen === false ? (
        <div style={{ marginTop: 10, fontSize: 12.5, color: textMuted }}>
          Abgelehnt.{" "}
          <button
            type="button"
            onClick={() => reagieren(true)}
            disabled={speichern}
            style={{ border: "none", background: "transparent", color: danger, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12.5 }}
          >
            Doch annehmen
          </button>
        </div>
      ) : quest.fortschritt.angenommen !== true ? (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <PrimaryButton onClick={() => reagieren(true)} disabled={speichern}>
            Quest annehmen
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={() => reagieren(false)} disabled={speichern}>
            Ablehnen
          </PrimaryButton>
        </div>
      ) : !offen ? (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {quest.typ === "anzahl" && (
            <div style={{ flex: 1, display: "flex", gap: 6 }}>
              <TextInput type="number" value={wert} onChange={setWert} placeholder="Bisher erreicht" />
              <PrimaryButton variant="ghost" onClick={fortschrittSpeichern} disabled={speichern}>
                Speichern
              </PrimaryButton>
            </div>
          )}
          <PrimaryButton onClick={() => setOffen(true)}>Quest abschließen</PrimaryButton>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {quest.typ === "anzahl" && (
            <div style={{ marginBottom: 8 }}>
              <TextInput type="number" value={wert} onChange={setWert} placeholder={`Erreicht (${quest.einheit || "Anzahl"})`} />
            </div>
          )}
          <TextArea value={notiz} onChange={setNotiz} placeholder="Was hast du gemacht? (optional)" />
          <div style={{ marginTop: 8 }}>
            <TextInput type="number" value={dauer} onChange={setDauer} placeholder="Wie lange gebraucht? (Minuten, optional)" />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <PrimaryButton onClick={abschliessen} disabled={speichern}>
              {speichern ? "Wird gespeichert …" : "Abschließen"}
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setOffen(false)} disabled={speichern}>
              Abbrechen
            </PrimaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}
