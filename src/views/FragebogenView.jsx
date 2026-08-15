import React, { useEffect, useMemo, useState } from "react";
import { Shell, Card, Pill, TextArea, PrimaryButton } from "../ui/primitives";
import { accentDark, cardBorder, danger, success, textMuted } from "../ui/theme";
import { FRAGEBOGEN_TYPEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

function formatDatum(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Ausfüll-Ansicht für eine einzelne Erhebung eines Fragebogen-Typs —
// autosave pro Feld beim Verlassen (onBlur), damit nichts verloren geht,
// falls die App zwischendurch geschlossen wird.
function ErhebungForm({ typ, eintrag, onBack }) {
  const { fragebogenAktualisieren, fragebogenLoeschen } = useAppData();
  const [antworten, setAntworten] = useState(eintrag.antworten || {});
  const [auswertung, setAuswertung] = useState(eintrag.auswertung || {});
  const [speichertFeld, setSpeichertFeld] = useState(null);

  useEffect(() => {
    setAntworten(eintrag.antworten || {});
    setAuswertung(eintrag.auswertung || {});
  }, [eintrag.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const speichereAntworten = async (naechsteAntworten) => {
    setSpeichertFeld(true);
    await fragebogenAktualisieren(eintrag.id, { antworten: naechsteAntworten });
    setSpeichertFeld(false);
  };

  const speichereAuswertung = async (naechsteAuswertung) => {
    setAuswertung(naechsteAuswertung);
    await fragebogenAktualisieren(eintrag.id, { auswertung: naechsteAuswertung });
  };

  const abschliessen = async () => {
    await fragebogenAktualisieren(eintrag.id, { status: "abgeschlossen" });
  };

  const loeschen = async () => {
    if (!window.confirm("Diese Erhebung endgültig löschen? Das kann nicht rückgängig gemacht werden.")) return;
    const result = await fragebogenLoeschen(eintrag.id);
    if (result.ok) onBack();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{typ.titel}</div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
            Erhebung vom {formatDatum(eintrag.erstellt_am)}
            {eintrag.status === "abgeschlossen" && <span style={{ color: success, fontWeight: 700 }}> · Abgeschlossen</span>}
          </div>
        </div>
        <button
          onClick={onBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0 }}
          title="Zurück"
        >
          ‹
        </button>
      </div>

      {typ.abschnitte.map((abschnitt) => (
        <Card key={abschnitt.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{abschnitt.titel}</div>
          {abschnitt.fragen.map((frage) => (
            <div key={frage.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 6 }}>{frage.frage}</div>
              <TextArea
                value={antworten[frage.id] || ""}
                onChange={(v) => setAntworten((prev) => ({ ...prev, [frage.id]: v }))}
                placeholder="Deine Antwort..."
              />
            </div>
          ))}
        </Card>
      ))}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Auswertung — gemeinsam durchgehen</div>
      <Card style={{ marginBottom: 14 }}>
        {typ.auswertungFelder.map((feld) => (
          <div key={feld.id} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 6 }}>{feld.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {typ.abschnitte.map((abschnitt) => (
                <Pill
                  key={abschnitt.id}
                  label={abschnitt.titel}
                  selected={auswertung[feld.id] === abschnitt.titel}
                  onClick={() => speichereAuswertung({ ...auswertung, [feld.id]: abschnitt.titel })}
                />
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Der zentrale Speichern-Button synct die zuletzt lokal getippten
          Antworten — Blur-Events allein greifen bei "Enter aus dem Feld
          direkt auf 'Fertig'" u. U. nicht zuverlässig genug. */}
      <PrimaryButton onClick={() => speichereAntworten(antworten)} disabled={speichertFeld}>
        {speichertFeld ? "Speichert..." : "Antworten speichern"}
      </PrimaryButton>

      {eintrag.status !== "abgeschlossen" && (
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={abschliessen} variant="success">
            Als abgeschlossen markieren
          </PrimaryButton>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button
          onClick={loeschen}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", background: "#FDE9EC", color: danger }}
        >
          Diese Erhebung löschen
        </button>
      </div>
    </>
  );
}

// Übersicht der Erhebungen zu einem Fragebogen-Typ + "Neue Erhebung starten".
function TypDetail({ typ, onBack, onOpenEintrag }) {
  const { fragebogenEintraege, fragebogenErstellen } = useAppData();
  const [anlegend, setAnlegend] = useState(false);
  const eintraege = useMemo(() => fragebogenEintraege.filter((e) => e.typ === typ.id), [fragebogenEintraege, typ.id]);

  const neueErhebung = async () => {
    setAnlegend(true);
    const result = await fragebogenErstellen(typ.id);
    setAnlegend(false);
    if (result.ok) onOpenEintrag(result.eintrag);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{typ.titel}</div>
          <div style={{ fontSize: 12.5, color: textMuted, marginTop: 2 }}>{typ.untertitel}</div>
        </div>
        <button
          onClick={onBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0 }}
          title="Zurück"
        >
          ‹
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>{typ.beschreibung}</div>

      <PrimaryButton onClick={neueErhebung} disabled={anlegend}>
        {anlegend ? "Wird angelegt..." : "Neue Erhebung starten"}
      </PrimaryButton>

      <div style={{ fontSize: 14, fontWeight: 800, margin: "20px 0 8px" }}>Bisherige Erhebungen</div>
      <Card>
        {eintraege.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Erhebung gestartet.</div>}
        {eintraege.map((e, i) => (
          <button
            key={e.id}
            className="mp-tap"
            onClick={() => onOpenEintrag(e)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: i < eintraege.length - 1 ? `1px solid ${cardBorder}` : "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDatum(e.erstellt_am)}</div>
              <div style={{ fontSize: 11.5, color: e.status === "abgeschlossen" ? success : textMuted, marginTop: 2 }}>
                {e.status === "abgeschlossen" ? "Abgeschlossen" : "In Bearbeitung"}
              </div>
            </div>
            <span style={{ color: textMuted, fontSize: 16 }}>›</span>
          </button>
        ))}
      </Card>
    </>
  );
}

export default function FragebogenView({ onHome }) {
  const [offenerTypId, setOffenerTypId] = useState(null);
  const [offenerEintrag, setOffenerEintrag] = useState(null);

  const offenerTyp = FRAGEBOGEN_TYPEN.find((t) => t.id === offenerTypId) || null;

  return (
    <Shell>
      {!offenerTyp ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>🧭 Coaching-Fragebögen</div>
            <button
              onClick={onHome}
              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
              title="Zum Dashboard"
            >
              ⌂
            </button>
          </div>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>
            Ergänzt die gesundheitlichen Protokolle um die lebensweltliche Passung.
          </div>
          {FRAGEBOGEN_TYPEN.map((typ) => (
            <Card
              key={typ.id}
              className="mp-tap"
              style={{ marginBottom: 12, cursor: "pointer" }}
              onClick={() => {
                setOffenerTypId(typ.id);
                setOffenerEintrag(null);
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: accentDark, marginBottom: 4 }}>{typ.titel}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{typ.untertitel}</div>
              <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>{typ.beschreibung}</div>
            </Card>
          ))}
        </>
      ) : offenerEintrag ? (
        <ErhebungForm typ={offenerTyp} eintrag={offenerEintrag} onBack={() => setOffenerEintrag(null)} />
      ) : (
        <TypDetail typ={offenerTyp} onBack={() => setOffenerTypId(null)} onOpenEintrag={setOffenerEintrag} />
      )}
    </Shell>
  );
}
