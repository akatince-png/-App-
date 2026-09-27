import React, { useCallback, useEffect, useState } from "react";
import { cardBorder, danger, success, textMain, textMuted } from "../../ui/theme";
import { einrichtungLaden, vorlageUebernehmen, alleVorlagenUebernehmen } from "../../data/einrichtungAdmin";
import { adminTeamsListe, adminTeamMitgliedZuordnen } from "../../data/useTeamData";
import { programmStarten } from "../../data/programmeAdmin";
import { EINSTELLUNG } from "../../utils/programme";
import { einrichtungsSchritte, einrichtungsStand } from "../../utils/einrichtung";
import { toLocalISODate } from "../../utils/dates";
import { merkeZielNachVerwalten } from "../../utils/verwaltungRueckkehr";

// Einrichtungs-Checkliste pro Person (27.09., Nutzerinnen-Wunsch: als Coach
// ohne KI in wenigen Schritten startklar machen). Alles auf einer Seite in
// AKA-Reihenfolge; "Einrichten" springt per "Verwalten" direkt in die
// passende Seite, "Vorlage" setzt einen üblichen Wert per Tipp. Jede
// Einstellung bleibt danach normal änderbar (manuell oder mit Aka).

const STUFE_TEXT = { pflicht: "Pflicht", empfohlen: "Empfohlen", optional: "Nur falls nötig" };
const knopf = (farbe = "#1B2350", voll = false) => ({
  border: voll ? "none" : `1.5px solid ${farbe}`,
  background: voll ? farbe : "#fff",
  color: voll ? "#fff" : farbe,
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
});

const morgen = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalISODate(d);
};

export default function EinrichtungsCheckliste({ person, onVerwalteAls }) {
  const [fakten, setFakten] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(null); // key, der gerade speichert
  const [teams, setTeams] = useState([]);
  const [startDatum, setStartDatum] = useState(morgen);

  const laden = useCallback(async () => {
    const r = await einrichtungLaden(person.id);
    if (!r.ok) return setFehler(r.error);
    setFakten(r.fakten);
  }, [person.id]);

  useEffect(() => {
    laden();
    adminTeamsListe().then((r) => r.ok && setTeams(r.teams));
  }, [laden]);

  if (fehler) return <div style={{ color: danger, fontSize: 13, marginTop: 10 }}>{fehler}</div>;
  if (!fakten) return <div style={{ color: textMuted, fontSize: 13, marginTop: 10 }}>Lade Einrichtung …</div>;

  const schritte = einrichtungsSchritte(fakten);
  const stand = einrichtungsStand(schritte);
  const offeneVorlagen = schritte.filter((s) => s.vorlage && !s.fertig);

  const tun = async (key, fn) => {
    setFehler(null);
    setLaeuft(key);
    const r = await fn();
    setLaeuft(null);
    if (r && r.ok === false) return setFehler(r.error || "Speichern fehlgeschlagen.");
    await laden();
  };

  const einrichten = (ziel) => {
    merkeZielNachVerwalten(ziel, person.id);
    onVerwalteAls({ id: person.id, email: person.email, vorname: person.vorname });
  };

  return (
    <div data-einrichtung style={{ marginTop: 12, borderTop: `1px solid ${cardBorder}`, paddingTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 14,
          background: stand.bereit ? "#E8F7F2" : "#FFF6E5",
          border: `1.5px solid ${stand.bereit ? "#2E9C86" : "#E8B04A"}`,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>{stand.bereit ? "✅" : "🛠️"}</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 900, color: textMain }}>{stand.bereit ? "Bereit zum Start" : "Noch nicht startklar"}</span>
          <span style={{ display: "block", fontSize: 12, color: textMuted }}>
            {stand.erledigt} von {stand.gesamt} erledigt{stand.offenPflicht.length ? ` · offen: ${stand.offenPflicht.join(", ")}` : ""}
          </span>
        </span>
        {offeneVorlagen.length > 1 && (
          <button type="button" className="mp-tap" disabled={!!laeuft} onClick={() => tun("alle", () => alleVorlagenUebernehmen(person.id, schritte, fakten))} style={knopf("#2E9C86", true)}>
            {laeuft === "alle" ? "…" : "Übliches übernehmen"}
          </button>
        )}
      </div>
      {!fakten.onboardingFertig && (
        <div style={{ fontSize: 12, color: textMuted, margin: "0 2px 8px", lineHeight: 1.5 }}>
          Hinweis: Solange der Steckbrief offen ist, öffnet „Einrichten“ zuerst den Steckbrief. Vorlagen und Programmstart gehen schon jetzt.
        </div>
      )}

      {schritte.map((s) => (
        <div key={s.key} data-schritt={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", borderBottom: `1px solid ${cardBorder}` }}>
          <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: s.fertig ? "#E8F7F2" : "#F3F4F8", flexShrink: 0 }}>
            {s.fertig ? "✓" : s.emoji}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: textMain }}>
              {s.emoji} {s.titel}{" "}
              <span style={{ fontSize: 10.5, fontWeight: 800, color: s.stufe === "pflicht" ? "#B5501F" : textMuted, marginLeft: 4 }}>{STUFE_TEXT[s.stufe]}</span>
            </span>
            <span style={{ display: "block", fontSize: 12, color: s.fertig ? success : textMuted, whiteSpace: "pre-line", lineHeight: 1.5 }}>{s.detail}</span>
            {s.art === "team" && (
              <select
                aria-label="Team wählen"
                value={fakten.teamId || ""}
                disabled={!!laeuft}
                onChange={(e) => tun("team", () => adminTeamMitgliedZuordnen(person.id, e.target.value || null))}
                style={{ marginTop: 6, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "5px 8px", fontSize: 12.5, fontFamily: "inherit" }}
              >
                <option value="">Einzelperson (kein Team)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            {s.art === "start" && !s.fertig && (
              <span style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <input
                  type="date"
                  aria-label="Startdatum"
                  value={startDatum}
                  min={toLocalISODate(new Date())}
                  onChange={(e) => setStartDatum(e.target.value)}
                  style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "5px 8px", fontSize: 12.5, fontFamily: "inherit" }}
                />
                <button
                  type="button"
                  className="mp-tap"
                  disabled={!!laeuft || !startDatum}
                  onClick={() => tun("programm", () => programmStarten([person.id], EINSTELLUNG, startDatum))}
                  style={knopf("#1B2350", true)}
                >
                  {laeuft === "programm" ? "…" : "▶ Start festlegen"}
                </button>
                {!stand.bereit && <span style={{ fontSize: 11, color: textMuted }}>Geht auch jetzt schon – der Rest lässt sich bis zum Abend nachtragen.</span>}
              </span>
            )}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
            {s.vorlage && !s.fertig && (
              <button type="button" className="mp-tap" title={s.vorlage} disabled={!!laeuft} onClick={() => tun(s.key, () => vorlageUebernehmen(person.id, s.key, fakten))} style={knopf("#2E9C86")}>
                {laeuft === s.key ? "…" : "Vorlage"}
              </button>
            )}
            {s.ziel && (
              <button type="button" className="mp-tap" onClick={() => einrichten(s.ziel)} style={knopf()}>
                {s.fertig ? "Ändern" : "Einrichten"}
              </button>
            )}
          </span>
        </div>
      ))}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8, lineHeight: 1.5 }}>
        „Vorlage“ setzt einen üblichen Wert (z. B. Abendroutine ab 21:30) – danach jederzeit änderbar. „Einrichten“ öffnet die Seite direkt im Konto der Person; über „Zurück“ oben kommst du wieder hierher.
      </div>
    </div>
  );
}
