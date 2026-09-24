import React, { useEffect, useState } from "react";
import { Card, Label, PrimaryButton, TextInput } from "./primitives";
import { accentDark, cardBorder, danger, textMain, textMuted } from "./theme";
import GruppenprotokollKarte, { BAUSTEIN_FARBE } from "./GruppenprotokollKarte";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { toLocalISODate } from "../utils/dates";
import {
  AUTO_BAUSTEINE,
  DAUER_OPTIONEN,
  adminGruppenprotokollAnlegen,
  adminGruppenprotokollBeenden,
  adminGruppenprotokolleListe,
  statusAufbereiten,
  tagImProtokoll,
} from "../data/gruppenprotokoll";

// Gruppenprotokolle eines Teams verwalten (Admin → Teams, 24.09.):
// anlegen (Name, Ziel, Zeitraum, gemeinsame Bausteine, Gruppen-Quests),
// laufende mit Stand ansehen, beenden. Läuft zusätzlich zu den eigenen
// Protokollen der Personen — nichts wird ersetzt oder archiviert.
function Chip({ an, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: "7px 11px", borderRadius: 99, border: `1.5px solid ${an ? accentDark : cardBorder}`, background: an ? accentDark : "#fff", color: an ? "#fff" : textMain, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

function Formular({ teamId, onFertig, onAbbrechen }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [ziel, setZiel] = useState("");
  const [dauer, setDauer] = useState("3w");
  const [autoArten, setAutoArten] = useState(["morgenroutine"]);
  const [eigene, setEigene] = useState([]);
  const [neueEigene, setNeueEigene] = useState("");
  const [questTitel, setQuestTitel] = useState("");
  const [questBaustein, setQuestBaustein] = useState("alle");
  const [questZiel, setQuestZiel] = useState("");
  const [questBelohnung, setQuestBelohnung] = useState("");
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState(null);

  const bausteine = [
    ...AUTO_BAUSTEINE.filter((b) => autoArten.includes(b.art)),
    ...eigene.map((n) => ({ art: "eigen", name: n, icon: "🌱" })),
  ];

  const anlegen = async () => {
    setFehler(null);
    setSpeichern(true);
    const idx = questBaustein === "alle" ? null : bausteine.findIndex((b) => `${b.art}|${b.name}` === questBaustein);
    const r = await adminGruppenprotokollAnlegen({
      teamId,
      name,
      ziel,
      dauerTage: DAUER_OPTIONEN.find((d) => d.id === dauer)?.tage ?? null,
      bausteine,
      quests: questTitel.trim() ? [{ titel: questTitel, bausteinIndex: idx === -1 ? null : idx, zielAnzahl: questZiel, belohnung: questBelohnung }] : [],
      erstelltVon: user?.id,
    });
    setSpeichern(false);
    if (!r.ok) return setFehler(r.error);
    onFertig();
  };

  return (
    <div style={{ background: "#F7F8FC", borderRadius: 16, padding: 12, marginTop: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>+ Neues Gruppenprotokoll</div>
      <Label>Name</Label>
      <TextInput value={name} onChange={setName} placeholder="z. B. 21 Tage Morgenroutine" />
      <Label>Ziel für die Gruppe (optional)</Label>
      <TextInput value={ziel} onChange={setZiel} placeholder="z. B. Jeden Morgen gut in den Tag starten" />
      <Label>Zeitraum</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {DAUER_OPTIONEN.map((d) => (
          <Chip key={d.id} an={dauer === d.id} onClick={() => setDauer(d.id)}>
            {d.label}
          </Chip>
        ))}
      </div>
      <Label>Gemeinsame Bausteine (jede Person hakt selbst ab)</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {AUTO_BAUSTEINE.map((b) => (
          <Chip key={b.art} an={autoArten.includes(b.art)} onClick={() => setAutoArten((a) => (a.includes(b.art) ? a.filter((x) => x !== b.art) : [...a, b.art]))}>
            {b.icon} {b.name}
          </Chip>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: textMuted, margin: "6px 0" }}>Diese zählen automatisch aus den Einträgen jeder Person.</div>
      {eigene.map((n) => (
        <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: "8px 10px", marginBottom: 6, border: `2px solid ${BAUSTEIN_FARBE.eigen.dot}`, background: BAUSTEIN_FARBE.eigen.bg, fontSize: 13, fontWeight: 700 }}>
          🌱 {n}
          <button type="button" onClick={() => setEigene((e) => e.filter((x) => x !== n))} style={{ border: "none", background: "transparent", color: danger, fontWeight: 800, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={neueEigene} onChange={setNeueEigene} placeholder="Eigene Gruppen-Gewohnheit, z. B. 10 Min. frische Luft" />
        </div>
        <button
          type="button"
          disabled={!neueEigene.trim()}
          onClick={() => {
            setEigene((e) => (e.includes(neueEigene.trim()) ? e : [...e, neueEigene.trim()]));
            setNeueEigene("");
          }}
          style={{ border: "none", borderRadius: 12, padding: "0 14px", background: accentDark, color: "#fff", fontWeight: 800, cursor: "pointer", opacity: neueEigene.trim() ? 1 : 0.5 }}
        >
          +
        </button>
      </div>

      <Label>Gruppen-Quest (optional)</Label>
      <TextInput value={questTitel} onChange={setQuestTitel} placeholder="z. B. Gemeinsam 40× Morgenroutine" />
      {questTitel.trim() && (
        <>
          <div style={{ fontSize: 12, color: textMuted, margin: "8px 0 6px" }}>Was zählt?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <Chip an={questBaustein === "alle"} onClick={() => setQuestBaustein("alle")}>
              Alle Bausteine
            </Chip>
            {bausteine.map((b) => (
              <Chip key={`${b.art}|${b.name}`} an={questBaustein === `${b.art}|${b.name}`} onClick={() => setQuestBaustein(`${b.art}|${b.name}`)}>
                {b.icon} {b.name}
              </Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ width: 110 }}>
              <TextInput type="number" value={questZiel} onChange={setQuestZiel} placeholder="Ziel, z. B. 40" />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput value={questBelohnung} onChange={setQuestBelohnung} placeholder="Belohnung (optional), z. B. Pizza-Abend" />
            </div>
          </div>
        </>
      )}
      {fehler && <div style={{ fontSize: 12.5, color: danger, marginTop: 8 }}>{fehler}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <PrimaryButton onClick={anlegen} disabled={speichern || !name.trim() || bausteine.length === 0 || (questTitel.trim() && !(Number(questZiel) > 0))}>
          {speichern ? "Wird angelegt …" : "Gruppenprotokoll starten"}
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onAbbrechen}>
          Abbrechen
        </PrimaryButton>
      </div>
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8 }}>Läuft zusätzlich zu den eigenen Protokollen jeder Person – nichts wird ersetzt oder archiviert.</div>
    </div>
  );
}

export default function GruppenprotokollAdmin({ teamId }) {
  const [liste, setListe] = useState(null);
  const [offen, setOffen] = useState(false);
  const [ansehen, setAnsehen] = useState(null);
  const [fehler, setFehler] = useState(null);

  const laden = async () => {
    const r = await adminGruppenprotokolleListe(teamId);
    if (!r.ok) return setFehler(r.error);
    const heute = toLocalISODate(new Date());
    const mitStatus = await Promise.all(
      r.gruppenprotokolle.map(async (g) => {
        const { data } = g.status === "active" ? await supabase.rpc("gruppenprotokoll_status", { p_gp: g.id, p_von: g.startdatum, p_bis: heute }) : { data: [] };
        return { ...g, bausteine: [...(g.gruppen_bausteine || [])].sort((a, b) => a.reihenfolge - b.reihenfolge), quests: g.gruppen_quests || [], stand: statusAufbereiten(data) };
      })
    );
    setListe(mitStatus);
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const beenden = async (g) => {
    if (!window.confirm(`Gruppenprotokoll „${g.name}“ beenden? Es bleibt im Verlauf sichtbar.`)) return;
    const r = await adminGruppenprotokollBeenden(g.id);
    if (!r.ok) return setFehler(r.error);
    laden();
  };

  const aktive = (liste || []).filter((g) => g.status === "active");
  const beendete = (liste || []).filter((g) => g.status !== "active");

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>📋 Gruppenprotokolle</div>
      {fehler && <div style={{ fontSize: 12.5, color: danger }}>{fehler}</div>}
      {liste && aktive.length === 0 && !offen && <div style={{ fontSize: 12.5, color: textMuted }}>Noch kein laufendes Gruppenprotokoll.</div>}
      {aktive.map((g) => {
        const { tag, gesamt } = tagImProtokoll(g);
        return (
          <Card key={g.id} style={{ marginBottom: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {gesamt ? `Tag ${Math.min(tag, gesamt)} von ${gesamt}` : `Tag ${tag}`} · {g.bausteine.length} Bausteine · {g.quests.length} Quest{g.quests.length === 1 ? "" : "s"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => setAnsehen(ansehen === g.id ? null : g.id)} style={{ border: `1px solid ${cardBorder}`, background: "#fff", borderRadius: 10, padding: "6px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {ansehen === g.id ? "Zuklappen" : "Stand"}
                </button>
                <button type="button" onClick={() => beenden(g)} style={{ border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Beenden
                </button>
              </div>
            </div>
            {ansehen === g.id && (
              <div style={{ marginTop: 10 }}>
                <GruppenprotokollKarte gp={g} userId={null} darfAbhaken={false} />
              </div>
            )}
          </Card>
        );
      })}
      {beendete.length > 0 && (
        <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>Beendet: {beendete.map((g) => g.name).join(", ")}</div>
      )}
      {offen ? (
        <Formular
          teamId={teamId}
          onAbbrechen={() => setOffen(false)}
          onFertig={() => {
            setOffen(false);
            laden();
          }}
        />
      ) : (
        <button
          type="button"
          className="mp-tap"
          onClick={() => setOffen(true)}
          style={{ marginTop: 8, border: `1.5px dashed ${accentDark}`, background: "#fff", color: accentDark, borderRadius: 12, padding: "9px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", width: "100%" }}
        >
          + Gruppenprotokoll
        </button>
      )}
    </div>
  );
}
