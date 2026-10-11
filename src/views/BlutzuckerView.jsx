import React, { useState } from "react";
import { Shell, Card, PrimaryButton, Label } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { durchschnitt, messungPruefen, neuesteZuerst } from "../utils/blutdruck";
import {
  ZEITPUNKTE,
  durchschnitt as bzDurchschnitt,
  messungPruefen as bzPruefen,
  wertText,
  zeitpunktLabel,
  zeitpunktVorschlag,
} from "../utils/blutzucker";

const jetztZeit = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const heuteDatum = () => new Date().toLocaleDateString("sv-SE");
const datumKurz = (d) => d.split("-").reverse().slice(0, 2).join(".") + ".";

const feldStil = {
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid ${cardBorder}`,
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 16,
  fontFamily: "inherit",
  background: "var(--mp-karte)",
  color: textMain,
};

// Blutdruck-Protokoll (11.10., Nutzerin: „reicht, wenn ich das eintragen
// kann – ich messe mit einem Gerät zu Hause“). Eintragen, Liste, Durchschnitt.
// Keine Bewertung der Werte (Lifestyle-App, Einordnung beim Arzt).
function BlutdruckKarte() {
  const { blutdruckMessungen = [], blutdruckSpeichern, blutdruckLoeschen } = useAppData();
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [puls, setPuls] = useState("");
  const [datum, setDatum] = useState(heuteDatum);
  const [uhrzeit, setUhrzeit] = useState(jetztZeit);
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState(null);
  const [gespeichert, setGespeichert] = useState(null);
  const [speichert, setSpeichert] = useState(false);
  const [alle, setAlle] = useState(false);

  const speichern = async () => {
    setGespeichert(null);
    const p = messungPruefen({ systolisch: sys, diastolisch: dia, puls });
    if (!p.ok) return setFehler(p.fehler);
    setFehler(null);
    setSpeichert(true);
    const r = await blutdruckSpeichern?.({ ...p.werte, notiz, datum, uhrzeit });
    setSpeichert(false);
    if (r && r.ok === false) return setFehler(r.error || "Speichern fehlgeschlagen.");
    setGespeichert(`${p.werte.systolisch}/${p.werte.diastolisch}${p.werte.puls ? ` · Puls ${p.werte.puls}` : ""}`);
    setSys("");
    setDia("");
    setPuls("");
    setNotiz("");
    setUhrzeit(jetztZeit());
  };

  const liste = neuesteZuerst(blutdruckMessungen);
  const sichtbar = alle ? liste : liste.slice(0, 7);
  const w7 = durchschnitt(blutdruckMessungen, 7);
  const w30 = durchschnitt(blutdruckMessungen, 30);

  return (
    <Card style={{ marginBottom: 14 }}>
      <div data-blutdruck style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>❤️ Blutdruck eintragen</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Oberer Wert
          <input aria-label="Oberer Wert (systolisch)" inputMode="numeric" placeholder="120" value={sys} onChange={(e) => setSys(e.target.value)} style={feldStil} />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Unterer Wert
          <input aria-label="Unterer Wert (diastolisch)" inputMode="numeric" placeholder="80" value={dia} onChange={(e) => setDia(e.target.value)} style={feldStil} />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Puls
          <input aria-label="Puls" inputMode="numeric" placeholder="70" value={puls} onChange={(e) => setPuls(e.target.value)} style={feldStil} />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Tag
          <input aria-label="Tag der Messung" type="date" value={datum} max={heuteDatum()} onChange={(e) => setDatum(e.target.value || heuteDatum())} style={feldStil} />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Uhrzeit
          <input aria-label="Uhrzeit der Messung" type="time" value={uhrzeit} onChange={(e) => setUhrzeit(e.target.value)} style={feldStil} />
        </label>
      </div>
      <input aria-label="Notiz zur Messung" placeholder="Notiz (optional), z. B. nach dem Sport, linker Arm" value={notiz} maxLength={200} onChange={(e) => setNotiz(e.target.value)} style={{ ...feldStil, marginBottom: 10, fontSize: 14 }} />
      {fehler && <div style={{ color: danger, fontSize: 13, marginBottom: 8 }}>{fehler}</div>}
      {gespeichert && (
        <div data-blutdruck-gespeichert style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          ✓ {gespeichert} eingetragen
        </div>
      )}
      <PrimaryButton onClick={speichern} disabled={speichert}>
        {speichert ? "Speichere …" : "Blutdruck eintragen"}
      </PrimaryButton>

      {(w7 || w30) && (
        <div data-blutdruck-schnitt style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
          {[
            ["Ø 7 Tage", w7],
            ["Ø 30 Tage", w30],
          ].map(([titel, w]) => (
            <div key={titel} style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "8px 10px" }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>{titel}</div>
              {w ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {w.systolisch}/{w.diastolisch}
                  </div>
                  <div style={{ fontSize: 11.5, color: textMuted }}>
                    {w.puls ? `Puls ${w.puls} · ` : ""}
                    {w.anzahl} Messung{w.anzahl === 1 ? "" : "en"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: textMuted }}>noch keine</div>
              )}
            </div>
          ))}
        </div>
      )}

      {liste.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Label>Letzte Messungen</Label>
          {sichtbar.map((m) => (
            <div key={m.id} data-blutdruck-eintrag style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${cardBorder}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  {m.systolisch}/{m.diastolisch}
                  {m.puls ? <span style={{ fontWeight: 600, color: textMuted }}> · Puls {m.puls}</span> : null}
                </div>
                <div style={{ fontSize: 12, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {datumKurz(m.datum)}
                  {m.uhrzeit ? ` · ${m.uhrzeit} Uhr` : ""}
                  {m.notiz ? ` · ${m.notiz}` : ""}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Messung ${m.systolisch}/${m.diastolisch} vom ${datumKurz(m.datum)} löschen`}
                onClick={() => {
                  if (window.confirm(`Messung ${m.systolisch}/${m.diastolisch} vom ${datumKurz(m.datum)} löschen?`)) blutdruckLoeschen?.(m.id);
                }}
                style={{ border: "none", background: "transparent", color: textMuted, fontSize: 16, cursor: "pointer", padding: 6 }}
              >
                🗑
              </button>
            </div>
          ))}
          {liste.length > 7 && (
            <button type="button" onClick={() => setAlle((a) => !a)} style={{ border: "none", background: "transparent", color: textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "6px 0", fontFamily: "inherit" }}>
              {alle ? "Weniger anzeigen" : `Alle ${liste.length} anzeigen`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

const EINHEIT_KEY = "aka-blutzucker-einheit";
const einheitLaden = () => {
  try {
    return localStorage.getItem(EINHEIT_KEY) === "mmol" ? "mmol" : "mgdl";
  } catch {
    return "mgdl";
  }
};

// Blutzucker-Protokoll (11.10., Nutzerin: „morgens und abends und
// zwischendurch messen und eintragen“). Gespeichert in mg/dl, Eingabe und
// Anzeige wahlweise in mmol/l. Keine Bewertung der Werte.
function BlutzuckerKarte() {
  const { blutzuckerMessungen = [], blutzuckerSpeichern, blutzuckerLoeschen } = useAppData();
  const [einheit, setEinheit] = useState(einheitLaden);
  const [wert, setWert] = useState("");
  const [zeitpunkt, setZeitpunkt] = useState(() => zeitpunktVorschlag());
  const [datum, setDatum] = useState(heuteDatum);
  const [uhrzeit, setUhrzeit] = useState(jetztZeit);
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState(null);
  const [gespeichert, setGespeichert] = useState(null);
  const [speichert, setSpeichert] = useState(false);
  const [alle, setAlle] = useState(false);

  const einheitWechseln = (e) => {
    setEinheit(e);
    setWert("");
    try {
      localStorage.setItem(EINHEIT_KEY, e);
    } catch {
      // ohne Speicher gilt die Wahl nur jetzt
    }
  };

  const speichern = async () => {
    setGespeichert(null);
    const p = bzPruefen({ wert, einheit, zeitpunkt });
    if (!p.ok) return setFehler(p.fehler);
    setFehler(null);
    setSpeichert(true);
    const r = await blutzuckerSpeichern?.({ ...p.werte, notiz, datum, uhrzeit });
    setSpeichert(false);
    if (r && r.ok === false) return setFehler(r.error || "Speichern fehlgeschlagen.");
    setGespeichert(`${wertText(p.werte.wertMgdl, einheit)} · ${zeitpunktLabel(p.werte.zeitpunkt)}`);
    setWert("");
    setNotiz("");
    setUhrzeit(jetztZeit());
  };

  const liste = neuesteZuerst(blutzuckerMessungen);
  const sichtbar = alle ? liste : liste.slice(0, 7);
  const kacheln = [
    ["Ø 7 Tage", bzDurchschnitt(blutzuckerMessungen, 7)],
    ["Ø nüchtern (7 Tage)", bzDurchschnitt(blutzuckerMessungen, 7, { zeitpunkt: "nuechtern" })],
    ["Ø 30 Tage", bzDurchschnitt(blutzuckerMessungen, 30)],
  ];
  const chip = (aktiv) => ({
    border: `1.5px solid ${aktiv ? "var(--mp-accent)" : cardBorder}`,
    background: aktiv ? "var(--mp-accent)" : "transparent",
    color: aktiv ? "#fff" : textMain,
    borderRadius: 999,
    padding: "6px 11px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div data-blutzucker style={{ fontSize: 16, fontWeight: 900 }}>🩸 Blutzucker eintragen</div>
        <div role="group" aria-label="Einheit" style={{ display: "flex", gap: 4 }}>
          {[
            ["mgdl", "mg/dl"],
            ["mmol", "mmol/l"],
          ].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={einheit === id} onClick={() => einheitWechseln(id)} style={{ ...chip(einheit === id), padding: "4px 9px", fontSize: 12 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: "block", marginBottom: 8 }}>
        Wert in {einheit === "mmol" ? "mmol/l" : "mg/dl"}
        <input aria-label="Blutzuckerwert" inputMode="decimal" placeholder={einheit === "mmol" ? "5,4" : "95"} value={wert} onChange={(e) => setWert(e.target.value)} style={feldStil} />
      </label>
      <div role="group" aria-label="Zeitpunkt der Messung" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {ZEITPUNKTE.map((z) => (
          <button key={z.id} type="button" aria-pressed={zeitpunkt === z.id} onClick={() => setZeitpunkt(z.id)} style={chip(zeitpunkt === z.id)}>
            {z.label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Tag
          <input aria-label="Tag der Blutzuckermessung" type="date" value={datum} max={heuteDatum()} onChange={(e) => setDatum(e.target.value || heuteDatum())} style={feldStil} />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          Uhrzeit
          <input aria-label="Uhrzeit der Blutzuckermessung" type="time" value={uhrzeit} onChange={(e) => setUhrzeit(e.target.value)} style={feldStil} />
        </label>
      </div>
      <input aria-label="Notiz zur Blutzuckermessung" placeholder="Notiz (optional), z. B. nach Pasta, nach dem Sport" value={notiz} maxLength={200} onChange={(e) => setNotiz(e.target.value)} style={{ ...feldStil, marginBottom: 10, fontSize: 14 }} />
      {fehler && <div style={{ color: danger, fontSize: 13, marginBottom: 8 }}>{fehler}</div>}
      {gespeichert && (
        <div data-blutzucker-gespeichert style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          ✓ {gespeichert} eingetragen
        </div>
      )}
      <PrimaryButton onClick={speichern} disabled={speichert}>
        {speichert ? "Speichere …" : "Blutzucker eintragen"}
      </PrimaryButton>

      {kacheln.some(([, w]) => w) && (
        <div data-blutzucker-schnitt style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 14 }}>
          {kacheln.map(([titel, w]) => (
            <div key={titel} style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "8px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: textMuted, lineHeight: 1.2 }}>{titel}</div>
              {w ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>{wertText(w.wertMgdl, einheit)}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>
                    {w.anzahl} Messung{w.anzahl === 1 ? "" : "en"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>noch keine</div>
              )}
            </div>
          ))}
        </div>
      )}

      {liste.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Label>Letzte Messungen</Label>
          {sichtbar.map((m) => (
            <div key={m.id} data-blutzucker-eintrag style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${cardBorder}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  {wertText(m.wertMgdl, einheit)}
                  <span style={{ fontWeight: 600, color: textMuted }}> · {zeitpunktLabel(m.zeitpunkt)}</span>
                </div>
                <div style={{ fontSize: 12, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {datumKurz(m.datum)}
                  {m.uhrzeit ? ` · ${m.uhrzeit} Uhr` : ""}
                  {m.notiz ? ` · ${m.notiz}` : ""}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Blutzucker ${wertText(m.wertMgdl, einheit)} vom ${datumKurz(m.datum)} löschen`}
                onClick={() => {
                  if (window.confirm(`Blutzucker ${wertText(m.wertMgdl, einheit)} vom ${datumKurz(m.datum)} löschen?`)) blutzuckerLoeschen?.(m.id);
                }}
                style={{ border: "none", background: "transparent", color: textMuted, fontSize: 16, cursor: "pointer", padding: 6 }}
              >
                🗑
              </button>
            </div>
          ))}
          {liste.length > 7 && (
            <button type="button" onClick={() => setAlle((a) => !a)} style={{ border: "none", background: "transparent", color: textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "6px 0", fontFamily: "inherit" }}>
              {alle ? "Weniger anzeigen" : `Alle ${liste.length} anzeigen`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function BlutzuckerView({ onHome, embedded = false }) {
  const content = (
    <>
      {!embedded && <ViewHeader title="🩸 Blutzucker & Blutdruck" onHome={onHome} />}

      <BlutzuckerKarte />
      <BlutdruckKarte />
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
