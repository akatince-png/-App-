import React, { useState } from "react";
import { PrimaryButton, Label, TextInput } from "./primitives";
import { cardBorder, textMain, textMuted, danger, accentDark } from "./theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";
import { fmtDate } from "../utils/dates";

// Kategorie -> Ziel-Reiter in PlaeneView.jsx (für den "dauerhaft ändern"-
// Knopf, siehe AuthenticatedApp.jsx KATEGORIE_TO_VIEW für dasselbe Muster
// an anderer Stelle in der App).
const KATEGORIE_ZU_VIEW = {
  hormon: "medikamente",
  supplement: "supplemente",
  mahlzeit: "ernaehrung",
  gewohnheit: "routinen",
  workflow: "routinen",
};

// Kategorien, die eine Einzeltag-Ausnahme kennen (siehe Migration 0080 /
// dayItems.js) — Training/Zeitblöcke haben schon eigene Tages-Zeilen und
// werden gar nicht erst mit dieser Karte geöffnet.
const AUSNAHME_KATEGORIEN = new Set(["hormon", "supplement", "mahlzeit", "gewohnheit", "workflow"]);

// Bottom-Sheet zum Bearbeiten eines einzelnen Tagesplan-Eintrags direkt aus
// der Wochen-/Monatsübersicht heraus (Nutzerin-Vorgabe, 12.09.) — erspart
// den Umweg über die jeweilige Kategorie-Ansicht für die zwei häufigsten
// Fälle: abhaken/entabhaken (sofort, eindeutig pro Tag) und "heute mal
// anders" (Uhrzeit/Name/Detail nur für diesen einen Tag, oder der Tag
// entfällt ganz — beides als Ausnahme gespeichert, nicht als dauerhafte
// Änderung der wiederkehrenden Regel). Echte dauerhafte Änderungen (die
// dann ab sofort für die ganze Restlaufzeit gelten) laufen weiterhin über
// die volle, bereits vorhandene Bearbeiten-Oberfläche der jeweiligen
// Kategorie — der Knopf unten navigiert dorthin, statt die Formulare hier
// zu duplizieren.
export default function TagesEintragBearbeiten({ item, datum, onNavigateKategorie, onClose }) {
  const {
    toggleSupplementErledigt,
    toggleHormonErledigt,
    toggleMahlzeitErledigt,
    toggleGewohnheitErledigt,
    ausnahmeSetzen,
    ausnahmeEntfernen,
    aenderungVermerken,
  } = useAppData();

  const [heuteAndersOffen, setHeuteAndersOffen] = useState(false);
  const [uhrzeit, setUhrzeit] = useState(item.uhrzeit || "");
  const [name, setName] = useState(item.name || "");
  const [detail, setDetail] = useState(item.detail || "");
  const [entfaellt, setEntfaellt] = useState(false);
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState(null);

  const meta = KATEGORIE_META[item.kategorie];
  const kannAusnahme = AUSNAHME_KATEGORIEN.has(item.kategorie);
  const kannErledigt = kannAusnahme && item.kategorie !== "workflow";

  const toggleErledigt = async () => {
    // Bewusst über item.raw / originalUhrzeit statt der evtl. per Ausnahme
    // überschriebenen Anzeigefelder — der Log-Eintrag richtet sich immer
    // nach der ECHTEN geplanten Uhrzeit/Name, siehe dayItems.js.
    if (item.kategorie === "hormon") await toggleHormonErledigt(datum, item.raw.name, item.raw.uhrzeit);
    else if (item.kategorie === "supplement") await toggleSupplementErledigt(datum, item.raw.id, item.originalUhrzeit);
    else if (item.kategorie === "mahlzeit") await toggleMahlzeitErledigt(datum, item.raw.id, item.logZeit ?? item.originalUhrzeit);
    else if (item.kategorie === "gewohnheit") await toggleGewohnheitErledigt(datum, item.raw.id);
    else if (item.kategorie === "training") return; // hat eigene Bearbeiten-Wege, keine Ausnahmen-Karte
  };

  const heuteAndersSpeichern = async () => {
    setFehler(null);
    setSpeichern(true);
    const result = await ausnahmeSetzen({
      kategorie: item.ausnahmeKategorie,
      refId: item.ausnahmeRefId,
      datum,
      uhrzeit: entfaellt ? null : uhrzeit,
      name: entfaellt ? null : name,
      detail: entfaellt ? null : detail,
      entfaellt,
    });
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen.");
      setSpeichern(false);
      return;
    }
    aenderungVermerken({
      kategorie: item.kategorie,
      itemName: item.name,
      aktion: entfaellt ? "entfällt (nur dieser Tag)" : "geändert (nur dieser Tag)",
      detail: entfaellt ? `${fmtDate(new Date(datum))}: fällt aus` : `${fmtDate(new Date(datum))}: ${uhrzeit || "–"} · ${name} · ${detail || "–"}`,
    });
    setSpeichern(false);
    onClose();
  };

  const ausnahmeZuruecknehmen = async () => {
    if (!item.ausnahmeId) return;
    setSpeichern(true);
    const result = await ausnahmeEntfernen(item.ausnahmeId);
    setSpeichern(false);
    if (!result?.ok) {
      setFehler(result?.error || "Zurücknehmen fehlgeschlagen.");
      return;
    }
    aenderungVermerken({ kategorie: item.kategorie, itemName: item.name, aktion: "Ausnahme zurückgenommen", detail: fmtDate(new Date(datum)) });
    onClose();
  };

  const dauerhaftBearbeiten = () => {
    const ziel = KATEGORIE_ZU_VIEW[item.kategorie];
    if (ziel && onNavigateKategorie) onNavigateKategorie(ziel);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(21, 24, 26, 0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px 22px 0 0",
          padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: textMain }}>{item.name}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {meta?.label || item.kategorie} · {fmtDate(new Date(datum))}
              {item.uhrzeit ? ` · ${item.uhrzeit}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 20, color: textMuted, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
        {item.detail && <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 10 }}>{item.detail}</div>}

        {item.ausnahmeId && (
          <div style={{ fontSize: 11.5, color: accentDark, background: "#EEF0FF", borderRadius: 10, padding: "6px 10px", marginBottom: 10 }}>
            Für diesen Tag ist eine Ausnahme gespeichert (weicht vom sonst geplanten Ablauf ab).
          </div>
        )}

        {kannErledigt && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${cardBorder}`, cursor: "pointer" }}>
            <input type="checkbox" checked={!!item.done} onChange={toggleErledigt} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Erledigt (nur heute)</span>
          </label>
        )}

        {kannAusnahme && (
          <>
            {!heuteAndersOffen ? (
              <button
                type="button"
                onClick={() => setHeuteAndersOffen(true)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "12px 0",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: accentDark,
                  cursor: "pointer",
                }}
              >
                ✏️ Heute anders (Uhrzeit/Name ändern oder Tag streichen)
              </button>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <Label>Uhrzeit (nur heute)</Label>
                <TextInput value={uhrzeit} onChange={setUhrzeit} placeholder="HH:MM" />
                <Label>Name (nur heute)</Label>
                <TextInput value={name} onChange={setName} />
                <Label>Detail (nur heute)</Label>
                <TextInput value={detail} onChange={setDetail} />
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={entfaellt} onChange={(e) => setEntfaellt(e.target.checked)} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Entfällt heute komplett</span>
                </label>
                {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{fehler}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <PrimaryButton onClick={heuteAndersSpeichern} disabled={speichern}>
                    {speichern ? "Speichert..." : "Nur für heute speichern"}
                  </PrimaryButton>
                </div>
                {item.ausnahmeId && (
                  <button
                    type="button"
                    onClick={ausnahmeZuruecknehmen}
                    disabled={speichern}
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 12.5, fontWeight: 700, marginTop: 10, cursor: "pointer", padding: 0 }}
                  >
                    Ausnahme zurücknehmen (wieder wie sonst geplant)
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={dauerhaftBearbeiten}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                borderTop: `1px solid ${cardBorder}`,
                background: "transparent",
                padding: "12px 0 4px",
                marginTop: 8,
                fontSize: 12.5,
                fontWeight: 700,
                color: textMuted,
                cursor: "pointer",
              }}
            >
              Dauerhaft ändern (ab jetzt, für die ganze Restlaufzeit) →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
