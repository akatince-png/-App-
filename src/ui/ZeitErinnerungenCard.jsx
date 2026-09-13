import React, { useEffect, useRef, useState } from "react";
import { Label, PrimaryButton, TextInput } from "./primitives";
import ErinnerungField from "./ErinnerungField";
import TimeWheelField from "./TimeWheelField";
import VorlaufFeld from "./VorlaufFeld";
import { danger } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/translate";

// Ältere gespeicherte Erinnerungen kannten "zeiten" noch als reine
// Uhrzeit-Strings ohne Menge — hier auf das neue {zeit, menge, startDatum}-
// Format heben, damit bereits gespeicherte Profile nicht abstürzen.
const normalisiereZeiten = (zeiten) =>
  Array.isArray(zeiten) ? zeiten.map((z) => (typeof z === "string" ? { zeit: z, menge: "", startDatum: "" } : z)) : [];

// Erinnerungszeiten-Liste: eigene Liste konkreter Uhrzeiten (statt nur eines
// Ja/Nein-Schalters wie bei den Dosierungs-Kategorien), da der serverseitige
// Erinnerungs-Versand (send-due-reminders) genau diese Zeiten abfragt.
// Ursprünglich nur für Hydration gebaut, jetzt verallgemeinert (29.07.) für
// Tageslicht/Schlaf — Kategorien ohne feste Dosierungs-/Wochenplan-Uhrzeit,
// bei denen die Person die Erinnerungszeit(en) frei selbst festlegt.
// Jede Gabe hat ein Startdatum dabei — leer heißt "läuft schon ab heute".
// Geteilt zwischen dem jeweiligen Onboarding-Schritt (Ersteingabe) und der
// laufenden Pflege in der Bereichs-Ansicht selbst.
//
// Props:
// - kategorie: Schlüssel in `erinnerungen` (z. B. "hydration", "tageslicht", "schlaf")
// - labelKey: i18n-Key für die Beschriftung der Liste
// - mengeLabel: optional — Platzhalter/Einheit für ein zusätzliches
//   Mengenfeld (z. B. "ml" bei Hydration); weggelassen bei Kategorien ohne
//   sinnvolle Menge (Tageslicht, Schlaf)
// - mengeStandard: Startwert fürs Mengenfeld
// - zeitStandard: Startwert für eine neue Uhrzeit
export default function ZeitErinnerungenCard({ kategorie, labelKey, mengeLabel, mengeStandard = "", zeitStandard = "12:00" }) {
  const { erinnerungen, setErinnerung } = useAppData();
  const { t } = useT();
  const [zeiten, setZeitenState] = useState(() => normalisiereZeiten(erinnerungen?.[kategorie]?.zeiten));
  // Bug-Fix (13.09., Teil 60): `erinnerungen` kommt asynchron aus
  // useProfileData.js und startet leer ({}), bevor der Profil-Fetch
  // abgeschlossen ist — der obige useState-Initialwert wurde bisher nur
  // beim allerersten Render ausgewertet. Fügte die Nutzerin in diesem
  // kurzen Fenster eine neue Uhrzeit hinzu, überschrieb setErinnerung()
  // ALLE bereits gespeicherten Zeiten mit nur der einen neuen — echter,
  // stiller Datenverlust. zeitenBearbeitetRef verhindert, dass der Sync ein
  // bereits von der Nutzerin angefasstes Feld wieder überschreibt.
  const zeitenBearbeitetRef = useRef(false);
  useEffect(() => {
    if (!zeitenBearbeitetRef.current) setZeitenState(normalisiereZeiten(erinnerungen?.[kategorie]?.zeiten));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erinnerungen]);
  const setZeiten = (next) => {
    zeitenBearbeitetRef.current = true;
    setZeitenState(next);
  };
  const [neueZeit, setNeueZeit] = useState(zeitStandard);
  const [neueMenge, setNeueMenge] = useState(mengeStandard);
  const [neuesDatum, setNeuesDatum] = useState("");
  const [fehler, setFehler] = useState(null);

  // Bei einem fehlgeschlagenen Speichern rollt setErinnerung() den echten
  // `erinnerungen`-Stand zurück — der obige Sync-Effekt würde das lokale
  // `zeiten` aber NICHT automatisch mitziehen, solange zeitenBearbeitetRef
  // gesetzt ist (das genau verhindert ja normalerweise, dass fremde Syncs
  // eine gerade laufende Bearbeitung überschreiben). Bei einem Fehler ist
  // "gerade laufende Bearbeitung" aber vorbei — Ref zurücksetzen, damit der
  // nächste Sync (ausgelöst durch das geänderte `erinnerungen` selbst) den
  // zurückgerollten, echten Stand wieder übernimmt statt den nie
  // gespeicherten optimistischen Stand stehen zu lassen.
  const zeitenAendernUndSpeichern = async (next) => {
    setZeiten(next);
    setFehler(null);
    const result = await setErinnerung(kategorie, { aktiv: true, zeiten: next });
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      zeitenBearbeitetRef.current = false;
    }
  };

  const handleErinnerungChange = async (v) => {
    setFehler(null);
    const result = await setErinnerung(kategorie, v ? { aktiv: true, zeiten } : false);
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  const zeitHinzufuegen = async () => {
    if (!neueZeit) return;
    const eintrag = { zeit: neueZeit, startDatum: neuesDatum };
    if (mengeLabel) eintrag.menge = neueMenge;
    const next = [...zeiten, eintrag].sort((a, b) => a.zeit.localeCompare(b.zeit));
    await zeitenAendernUndSpeichern(next);
    setNeueZeit(zeitStandard);
    setNeueMenge(mengeStandard);
    setNeuesDatum("");
  };
  const zeitFeldAendern = (i, feld, val) => {
    const next = zeiten.map((e, idx) => (idx === i ? { ...e, [feld]: val } : e));
    zeitenAendernUndSpeichern(next);
  };
  const zeitEntfernen = (i) => {
    const next = zeiten.filter((_, idx) => idx !== i);
    zeitenAendernUndSpeichern(next);
  };

  const vorlaufMinuten = typeof erinnerungen[kategorie]?.vorlaufMinuten === "number" ? erinnerungen[kategorie].vorlaufMinuten : undefined;
  const setVorlauf = async (minuten) => {
    setFehler(null);
    const result = await setErinnerung(kategorie, { aktiv: true, zeiten, vorlaufMinuten: minuten });
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  return (
    <>
      <ErinnerungField value={erinnerungen[kategorie]} onChange={handleErinnerungChange} />
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{fehler}</div>}

      {erinnerungen[kategorie] && (
        <div style={{ marginTop: 12 }}>
          <VorlaufFeld value={vorlaufMinuten} onChange={setVorlauf} />
          <Label>{t(labelKey)}</Label>
          {zeiten.map((eintrag, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1.2 }}>
                <TimeWheelField value={eintrag.zeit} onChange={(v) => zeitFeldAendern(i, "zeit", v)} />
              </div>
              {mengeLabel && (
                <div style={{ width: 64 }}>
                  <TextInput type="number" value={eintrag.menge} onChange={(v) => zeitFeldAendern(i, "menge", v)} placeholder={mengeLabel} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <TextInput type="date" value={eintrag.startDatum || ""} onChange={(v) => zeitFeldAendern(i, "startDatum", v)} />
              </div>
              <button
                type="button"
                onClick={() => zeitEntfernen(i)}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1.2 }}>
              <TimeWheelField value={neueZeit} onChange={setNeueZeit} />
            </div>
            {mengeLabel && (
              <div style={{ width: 64 }}>
                <TextInput type="number" value={neueMenge} onChange={setNeueMenge} placeholder={mengeLabel} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <TextInput type="date" value={neuesDatum} onChange={setNeuesDatum} />
            </div>
            <div style={{ width: 22 }} />
          </div>
          <PrimaryButton onClick={zeitHinzufuegen}>Speichern</PrimaryButton>
        </div>
      )}
    </>
  );
}
