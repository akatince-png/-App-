import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Pill, Label } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { cardBorder, danger, success, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { adminQuestArchivieren, adminQuestErstellen, adminQuestListe } from "../../data/useQuestData";
import RanglisteKarte from "../../ui/RanglisteKarte";

// Verwaltung der freiwilligen Sonderaufgaben ("Quests") — Nutzerinnen-
// Vorgabe 16.08.: "diese Woche machen wir drei Sätze isometrisches
// Training ... das soll sone freiwillige Aufgabe sein, die die Coachees
// noch zusätzlich übernehmen dürfen, falls sie Interesse dran haben".
// V1: Anlegen (an alle Coachees oder eine einzelne), Fortschritt/Abschluss-
// Meldungen der Coachees einsehen, Archivieren, Rangliste der Abschlüsse
// (RanglisteKarte, auch für Coachees selbst auf der Startseite sichtbar,
// siehe HomeView.jsx). Vergleich beim normalen Protokoll (nicht nur
// Quests) ist noch offen (siehe UEBERGABEPROTOKOLL.md).
export default function AdminQuestsView({ onHome }) {
  const [probanden, setProbanden] = useState([]);
  const [quests, setQuests] = useState([]);
  const [fortschritt, setFortschritt] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [nurAktive, setNurAktive] = useState(true);
  const [formOffen, setFormOffen] = useState(false);

  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [typ, setTyp] = useState("einfach");
  const [zielAnzahl, setZielAnzahl] = useState("");
  const [einheit, setEinheit] = useState("");
  const [zielProbandId, setZielProbandId] = useState(null); // null = alle
  const [gueltigBis, setGueltigBis] = useState("");
  const [speichern, setSpeichern] = useState(false);

  const ladeAlles = async () => {
    setLadend(true);
    setFehler(null);
    const [{ data: probandenRows, error: probandenError }, questResult] = await Promise.all([
      supabase.rpc("admin_liste_probanden"),
      adminQuestListe(),
    ]);
    if (probandenError) setFehler(probandenError.message);
    else setProbanden(probandenRows || []);
    if (!questResult.ok) setFehler((f) => f || questResult.error);
    else {
      setQuests(questResult.quests);
      setFortschritt(questResult.fortschritt);
    }
    setLadend(false);
  };

  useEffect(() => {
    ladeAlles();
  }, []);

  const nameFuer = (userId) => {
    const p = probanden.find((p) => p.id === userId);
    return p?.vorname || p?.email || "Unbekannt";
  };

  const anlegen = async () => {
    setSpeichern(true);
    const result = await adminQuestErstellen({
      titel,
      beschreibung,
      typ,
      zielAnzahl,
      einheit,
      probandId: zielProbandId,
      gueltigBis,
    });
    setSpeichern(false);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    setTitel("");
    setBeschreibung("");
    setTyp("einfach");
    setZielAnzahl("");
    setEinheit("");
    setZielProbandId(null);
    setGueltigBis("");
    setFormOffen(false);
    ladeAlles();
  };

  const archivieren = async (id) => {
    const result = await adminQuestArchivieren(id);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    ladeAlles();
  };

  const sichtbareQuests = quests.filter((q) => !nurAktive || q.aktiv);

  return (
    <Shell>
      <ViewHeader title="🎯 Quests" onHome={onHome} />

      <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.6 }}>
        Freiwillige Sonderaufgaben zusätzlich zum Pflicht-Protokoll — für alle Coachees auf einmal oder gezielt für
        eine einzelne Person. Die Coachee meldet ihren Fortschritt/Abschluss selbst, du siehst hier alle Meldungen.
      </div>

      {fehler && <div style={{ fontSize: 13, color: danger, marginBottom: 14 }}>{fehler}</div>}

      <RanglisteKarte />

      <div style={{ marginBottom: 14 }}>
        <PrimaryButton onClick={() => setFormOffen((v) => !v)}>{formOffen ? "Abbrechen" : "+ Neue Quest anlegen"}</PrimaryButton>
      </div>

      {formOffen && (
        <Card style={{ marginBottom: 20 }}>
          <Label>Titel</Label>
          <TextInput value={titel} onChange={setTitel} placeholder="z. B. 3 Sätze isometrisches Training" />

          <div style={{ marginTop: 12 }}>
            <Label>Beschreibung (optional)</Label>
            <TextArea value={beschreibung} onChange={setBeschreibung} placeholder="Was genau soll gemacht werden?" />
          </div>

          <div style={{ marginTop: 12 }}>
            <Label>Art der Bestätigung</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="Einfach (erledigt/nicht erledigt)" selected={typ === "einfach"} onClick={() => setTyp("einfach")} />
              <Pill label="Mit Zielzahl (z. B. ml, Sätze)" selected={typ === "anzahl"} onClick={() => setTyp("anzahl")} />
            </div>
          </div>

          {typ === "anzahl" && (
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Label>Zielzahl</Label>
                <TextInput type="number" value={zielAnzahl} onChange={setZielAnzahl} placeholder="z. B. 3" />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Einheit</Label>
                <TextInput value={einheit} onChange={setEinheit} placeholder="z. B. Sätze, ml" />
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Label>Zielgruppe</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill label="Alle Coachees" selected={zielProbandId === null} onClick={() => setZielProbandId(null)} />
              {probanden
                .filter((p) => !p.is_admin)
                .map((p) => (
                  <Pill
                    key={p.id}
                    label={p.vorname || p.email}
                    selected={zielProbandId === p.id}
                    onClick={() => setZielProbandId(p.id)}
                  />
                ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label>Gültig bis (optional)</Label>
            <TextInput type="date" value={gueltigBis} onChange={setGueltigBis} />
          </div>

          <div style={{ marginTop: 16 }}>
            <PrimaryButton onClick={anlegen} disabled={speichern || !titel.trim()}>
              {speichern ? "Wird angelegt …" : "Quest anlegen"}
            </PrimaryButton>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Pill label="Nur aktive" selected={nurAktive} onClick={() => setNurAktive(true)} />
        <Pill label="Alle (inkl. archiviert)" selected={!nurAktive} onClick={() => setNurAktive(false)} />
      </div>

      {ladend && <div style={{ fontSize: 13, color: textMuted }}>Lädt…</div>}
      {!ladend && sichtbareQuests.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Quests angelegt.</div>}

      {sichtbareQuests.map((q) => (
        <QuestKarte
          key={q.id}
          quest={q}
          probanden={probanden}
          fortschrittRows={fortschritt.filter((f) => f.quest_id === q.id)}
          nameFuer={nameFuer}
          onArchivieren={() => archivieren(q.id)}
        />
      ))}
    </Shell>
  );
}

function QuestKarte({ quest, probanden, fortschrittRows, nameFuer, onArchivieren }) {
  const empfaenger = quest.proband_id
    ? [{ id: quest.proband_id }]
    : probanden.filter((p) => !p.is_admin).map((p) => ({ id: p.id }));

  return (
    <Card style={{ marginBottom: 14, opacity: quest.aktiv ? 1 : 0.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: textMain }}>{quest.titel}</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
            {quest.proband_id ? `Für ${nameFuer(quest.proband_id)}` : "Für alle Coachees"}
            {quest.typ === "anzahl" && quest.ziel_anzahl ? ` · Ziel: ${quest.ziel_anzahl} ${quest.einheit || ""}` : ""}
            {quest.gueltig_bis ? ` · gültig bis ${new Date(quest.gueltig_bis).toLocaleDateString("de-DE")}` : ""}
            {!quest.aktiv ? " · archiviert" : ""}
          </div>
          {quest.beschreibung && <div style={{ fontSize: 12.5, color: textMuted, marginTop: 6 }}>{quest.beschreibung}</div>}
        </div>
        {quest.aktiv && (
          <div style={{ flexShrink: 0 }}>
            <PrimaryButton variant="ghost" onClick={onArchivieren}>
              Entfernen
            </PrimaryButton>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
        {empfaenger.map((e) => {
          const f = fortschrittRows.find((f) => f.user_id === e.id);
          const erledigt = f?.erledigt;
          return (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", fontSize: 12.5 }}>
              <div style={{ fontWeight: 700 }}>{nameFuer(e.id)}</div>
              <div style={{ textAlign: "right", color: erledigt ? success : textMuted }}>
                {erledigt ? (
                  <>
                    ✅ Erledigt{f.erledigt_am ? ` am ${new Date(f.erledigt_am).toLocaleDateString("de-DE")}` : ""}
                    {f.dauer_minuten ? ` · ${f.dauer_minuten} Min.` : ""}
                    {f.wert !== null && f.wert !== undefined ? ` · ${f.wert} ${quest.einheit || ""}` : ""}
                    {f.notiz && <div style={{ color: textMuted, marginTop: 2, fontWeight: 400 }}>„{f.notiz}“</div>}
                  </>
                ) : f?.angenommen === false ? (
                  "Abgelehnt"
                ) : f?.angenommen !== true ? (
                  "Noch nicht reagiert"
                ) : f?.wert !== null && f?.wert !== undefined ? (
                  `Angenommen · in Arbeit: ${f.wert} ${quest.einheit || ""}`
                ) : (
                  "Angenommen · noch nicht gestartet"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
