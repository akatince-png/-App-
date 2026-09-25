import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import AtemFuehrung from "../ui/AtemFuehrung";
import TimeWheelField from "../ui/TimeWheelField";
import { textMuted, cardBorder, danger } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { supabase } from "../lib/supabaseClient";
import { ATEM_BIBLIOTHEK, ATEM_KEY_EIGEN, ATEM_START_KEY, atemZeitenHeute, gefuehlEmoji, uebungFuerKey } from "../utils/atemBibliothek";
import { aktuelleSession } from "../data/useAtemSessions";

const LEER = { name: "", einatmenSek: "4", haltenSek: "4", ausatmenSek: "6", dauerMinuten: "3" };

const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "8px 12px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

// Atemübungen (16.08., seit 25.09. mit fester Routine, Übungen mit
// "wofür", von Aka geführt mit Stimme, Stimmung vorher/nachher und
// Gruppen-Sessions, Vorschau von der Nutzerin freigegeben). Eigene
// Übungen lassen sich weiter manuell anlegen wie bisher.
export default function AtemuebungenView({ onHome }) {
  const {
    atemuebungen,
    atemuebungLogs,
    atemuebungHinzufuegen,
    atemuebungEntfernen,
    atemuebungAbschliessen,
    atemZeiten = [],
    atemZeitSpeichern,
    atemZeitEntfernen,
    atemSessions = [],
    atemTeilnahmen = [],
    atemSessionTeilnehmen,
    aenderungVermerken,
    istAdminKonto,
    userId,
    team,
  } = useAppData();
  const { proband } = useAdmin();
  const [neu, setNeu] = useState(LEER);
  const [formOffen, setFormOffen] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [laufend, setLaufend] = useState(null); // { uebung, session? }

  useEffect(() => {
    try {
      const key = sessionStorage.getItem(ATEM_START_KEY);
      if (!key) return;
      sessionStorage.removeItem(ATEM_START_KEY);
      const u = uebungFuerKey(key, atemuebungen);
      if (u) setLaufend({ uebung: u });
    } catch {
      // ohne Speicher einfach die Übersicht zeigen
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setFehler(null);
    const result = await atemuebungHinzufuegen({
      name: neu.name,
      einatmenSek: Number(neu.einatmenSek) || 4,
      haltenSek: Number(neu.haltenSek) || 0,
      ausatmenSek: Number(neu.ausatmenSek) || 6,
      dauerMinuten: Number(neu.dauerMinuten) || 3,
    });
    if (!result.ok) return setFehler(result.error);
    setNeu(LEER);
    setFormOffen(false);
  };

  if (laufend) {
    const { uebung, session } = laufend;
    return (
      <Shell>
        <ViewHeader title={`${uebung.icon || "🌬️"} ${uebung.name}`} onHome={() => setLaufend(null)} homeTitle="Zurück" />
        <Card>
          <AtemFuehrung
            uebung={session ? { ...uebung, dauerMinuten: session.dauerMinuten } : uebung}
            startUm={session ? new Date(session.startUm).getTime() : null}
            onVorher={(g) => session && atemSessionTeilnehmen(session.id, { vorher: g })}
            onFertig={({ dauerSek, vorher, nachher }) => {
              if (dauerSek > 0) {
                atemuebungAbschliessen(uebung, dauerSek, { gefuehlVorher: vorher, gefuehlDanach: nachher, sessionId: session?.id || null });
                aenderungVermerken?.({
                  kategorie: "atemuebung",
                  itemName: uebung.name,
                  aktion: "erledigt",
                  detail: `${Math.round(dauerSek / 60) || 1} Min.${vorher || nachher ? ` · ${gefuehlEmoji(vorher) || "–"} → ${gefuehlEmoji(nachher) || "–"}` : ""}${session ? " · Gruppe" : ""}`,
                });
              }
              if (session) atemSessionTeilnehmen(session.id, { nachher });
            }}
          />
        </Card>
      </Shell>
    );
  }

  const heute = atemZeitenHeute(atemZeiten, atemuebungLogs);
  const session = aktuelleSession(atemSessions) || atemSessions.find((s) => new Date(s.startUm).getTime() > Date.now());

  return (
    <Shell>
      <ViewHeader title="🌬️ Atemübungen" onHome={onHome} />

      {session && team && (
        <GruppenKarte
          session={session}
          teilnahmen={atemTeilnahmen.filter((t) => t.sessionId === session.id)}
          ichDabei={atemTeilnahmen.some((t) => t.sessionId === session.id && t.userId === userId)}
          onMitmachen={() => setLaufend({ uebung: uebungFuerKey(session.uebungKey, atemuebungen) || ATEM_BIBLIOTHEK[0], session })}
        />
      )}

      <RoutineKarte
        heute={heute}
        eigene={atemuebungen}
        onStart={(z) => setLaufend({ uebung: { ...uebungFuerKey(z.uebungKey, atemuebungen), dauerMinuten: z.dauerMinuten } })}
        onSpeichern={async (z) => {
          const r = await atemZeitSpeichern(z);
          if (r?.ok) aenderungVermerken?.({ kategorie: "atemuebung", itemName: "Atem-Routine", aktion: "hinzugefügt", detail: `${z.uhrzeit} · ${uebungFuerKey(z.uebungKey, atemuebungen)?.name} · ${z.dauerMinuten} Min.` });
          return r;
        }}
        onEntfernen={async (z) => {
          const r = await atemZeitEntfernen(z.id);
          if (r?.ok) aenderungVermerken?.({ kategorie: "atemuebung", itemName: "Atem-Routine", aktion: "entfernt", detail: `${z.uhrzeit} · ${uebungFuerKey(z.uebungKey, atemuebungen)?.name}` });
        }}
      />

      <div style={{ fontSize: 15, fontWeight: 900, margin: "18px 0 8px" }}>Übungen</div>
      {ATEM_BIBLIOTHEK.map((u) => (
        <button
          key={u.key}
          type="button"
          className="mp-tap"
          aria-label={`${u.name} starten`}
          onClick={() => setLaufend({ uebung: u })}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "none", borderRadius: 14, padding: "10px 12px", marginBottom: 8, background: u.farbe, cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
        >
          <span style={{ fontSize: 22 }}>{u.icon}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>{u.name}</span>
            <span style={{ display: "block", fontSize: 12, color: "#4A5170" }}>
              {u.beschreibung} · {u.wofuer}
            </span>
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 800, background: "#fff", borderRadius: 8, padding: "4px 7px", whiteSpace: "nowrap" }}>▶ {u.dauerMinuten} Min.</span>
        </button>
      ))}

      {atemuebungen.map((u) => (
        <Card key={u.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {u.icon} {u.name} <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>· eigene</span>
              </div>
              <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                {u.einatmenSek}s ein{u.haltenSek > 0 ? ` · ${u.haltenSek}s halten` : ""} · {u.ausatmenSek}s aus · {u.dauerMinuten} Min.
              </div>
            </div>
            <button onClick={() => atemuebungEntfernen(u.id)} style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer" }} title="Löschen">
              ×
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={() => setLaufend({ uebung: uebungFuerKey(`${ATEM_KEY_EIGEN}${u.id}`, atemuebungen) })}>Starten</PrimaryButton>
          </div>
        </Card>
      ))}

      {formOffen ? (
        <Card>
          <TextInput value={neu.name} onChange={(v) => setNeu({ ...neu, name: v })} placeholder="Name (z. B. Ruhig werden)" />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[
              ["einatmenSek", "Einatmen (Sek.)", "4"],
              ["haltenSek", "Halten (Sek.)", "4"],
              ["ausatmenSek", "Ausatmen (Sek.)", "6"],
            ].map(([feld, label, ph]) => (
              <div key={feld} style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>{label}</div>
                <TextInput type="number" value={neu[feld]} onChange={(v) => setNeu({ ...neu, [feld]: v })} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4 }}>Gesamtdauer (Minuten)</div>
            <TextInput type="number" value={neu.dauerMinuten} onChange={(v) => setNeu({ ...neu, dauerMinuten: v })} placeholder="3" />
          </div>
          {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{fehler}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <PrimaryButton onClick={submit} disabled={!neu.name.trim()}>
                Speichern
              </PrimaryButton>
            </div>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={() => setFormOffen(false)}>
                Abbrechen
              </PrimaryButton>
            </div>
          </div>
        </Card>
      ) : (
        <PrimaryButton variant="ghost" onClick={() => setFormOffen(true)}>
          + Eigene Übung anlegen
        </PrimaryButton>
      )}

      {istAdminKonto && proband === null && <SessionPlaner />}

      {atemuebungLogs.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: textMuted, marginBottom: 8 }}>Verlauf</div>
          {atemuebungLogs.slice(0, 8).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${cardBorder}`, fontSize: 12 }}>
              <span>{l.name}</span>
              <span style={{ color: textMuted }}>
                {Math.max(1, Math.round(l.dauerSek / 60))} Min. {l.gefuehlVorher ? `${gefuehlEmoji(l.gefuehlVorher)} → ` : ""}
                {gefuehlEmoji(l.gefuehlDanach)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.45, marginTop: 16 }}>
        🤖 Geht auch per Aka, z. B. „Bau mir eine Atem-Routine: morgens 2 Minuten zum Wachwerden, abends 5 Minuten zum Runterkommen.“
      </div>
    </Shell>
  );
}

function RoutineKarte({ heute, eigene, onStart, onSpeichern, onEntfernen }) {
  const [offen, setOffen] = useState(false);
  const [z, setZ] = useState({ uhrzeit: "12:30", uebungKey: "seufzer", dauerMinuten: 3 });
  const [fehler, setFehler] = useState(null);
  const auswahl = [...ATEM_BIBLIOTHEK.map((u) => ({ key: u.key, name: u.name, icon: u.icon })), ...eigene.map((u) => ({ key: `${ATEM_KEY_EIGEN}${u.id}`, name: u.name, icon: u.icon }))];
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 900 }}>🕐 Meine Atem-Routine</div>
      <div style={{ fontSize: 12, color: textMuted, margin: "2px 0 8px" }}>Feste Zeiten wie ein Termin – erscheinen auf der Startseite, zählen für Punkte und Serie.</div>
      {heute.length === 0 && <div style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>Noch keine feste Zeit.</div>}
      {heute.map((zeit) => {
        const u = uebungFuerKey(zeit.uebungKey, eigene);
        return (
          <div key={zeit.id} data-atem-zeit={zeit.uhrzeit} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
            <span style={{ fontWeight: 900, fontSize: 14, width: 48 }}>{zeit.uhrzeit}</span>
            <span style={{ flex: 1, fontSize: 13.5 }}>
              {u?.icon} {u?.name || "Übung"} · {zeit.dauerMinuten} Min. {zeit.erledigt && <b style={{ color: "#1E8E5A" }}>✓ heute</b>}
            </span>
            {!zeit.erledigt && (
              <button type="button" aria-label={`${u?.name} jetzt starten`} onClick={() => onStart(zeit)} style={{ ...chip(false), padding: "6px 10px" }}>
                ▶
              </button>
            )}
            <button type="button" aria-label={`${zeit.uhrzeit} entfernen`} onClick={() => onEntfernen(zeit)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
              ×
            </button>
          </div>
        );
      })}
      {offen ? (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: textMuted }}>
            Uhrzeit
            <TimeWheelField value={z.uhrzeit} onChange={(v) => setZ((x) => ({ ...x, uhrzeit: v }))} />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {auswahl.map((a) => (
              <button key={a.key} type="button" aria-pressed={z.uebungKey === a.key} style={chip(z.uebungKey === a.key)} onClick={() => setZ((x) => ({ ...x, uebungKey: a.key }))}>
                {a.icon} {a.name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[2, 3, 5, 10].map((d) => (
              <button key={d} type="button" aria-pressed={z.dauerMinuten === d} style={chip(z.dauerMinuten === d)} onClick={() => setZ((x) => ({ ...x, dauerMinuten: d }))}>
                {d} Min.
              </button>
            ))}
          </div>
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
          <div style={{ marginTop: 10 }}>
            <PrimaryButton
              onClick={async () => {
                const r = await onSpeichern(z);
                if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
                setOffen(false);
              }}
            >
              Zeit speichern
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOffen(true)} style={{ ...chip(false), marginTop: 10, width: "100%", padding: 10 }}>
          + Feste Zeit hinzufügen
        </button>
      )}
    </Card>
  );
}

function GruppenKarte({ session, teilnahmen, ichDabei, onMitmachen }) {
  const start = new Date(session.startUm);
  const laeuft = Date.now() >= start.getTime() - 15 * 60000;
  const u = uebungFuerKey(session.uebungKey) || ATEM_BIBLIOTHEK[0];
  return (
    <section aria-label="Gemeinsam atmen" style={{ borderRadius: 18, padding: 14, marginBottom: 12, background: laeuft ? "#E8F7F2" : "#F4F6FA" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1E6E57" }}>👥 GEMEINSAM ATMEN</div>
      <div style={{ fontWeight: 900, fontSize: 15, marginTop: 3 }}>
        {start.toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {u.name} · {session.dauerMinuten} Min.
      </div>
      <div style={{ fontSize: 12.5, color: "#4A5170", marginTop: 2 }}>{teilnahmen.length} dabei{ichDabei ? " (du auch)" : ""}</div>
      {laeuft && (
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={onMitmachen}>Mitmachen</PrimaryButton>
        </div>
      )}
    </section>
  );
}

// Coach: Gruppen-Session planen (Team, Übung, Termin, Dauer). Takt und
// Anleitung kommen aus der App — kein Atem-Wissen nötig.
function SessionPlaner() {
  const { atemSessions = [], atemTeilnahmen = [], atemSessionPlanen, atemSessionLoeschen, aenderungVermerken } = useAppData();
  const [teams, setTeams] = useState([]);
  const [f, setF] = useState({ teamId: "", uebungKey: "gleichmaessig", dauerMinuten: 10, start: "" });
  const [meldung, setMeldung] = useState(null);
  useEffect(() => {
    supabase
      .from("teams")
      .select("id, name")
      .order("name")
      .then(({ data }) => setTeams(data || []));
  }, []);
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "Team";
  const planen = async () => {
    setMeldung(null);
    if (!f.teamId || !f.start) return setMeldung({ fehler: true, text: "Bitte Team und Termin wählen." });
    const u = uebungFuerKey(f.uebungKey);
    const r = await atemSessionPlanen({ teamId: f.teamId, uebungKey: f.uebungKey, dauerMinuten: f.dauerMinuten, startUm: new Date(f.start).toISOString(), uebungName: u.name });
    if (!r?.ok) return setMeldung({ fehler: true, text: r?.error || "Speichern fehlgeschlagen." });
    aenderungVermerken?.({ kategorie: "atemuebung", itemName: "Gruppen-Session", aktion: "hinzugefügt", detail: `${teamName(f.teamId)} · ${new Date(f.start).toLocaleString("de-DE")} · ${u.name}` });
    setMeldung({ text: "✓ Geplant – alle im Team bekommen eine Einladung." });
  };
  return (
    <Card style={{ marginTop: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 900 }}>👥 Gruppen-Session planen (Coach)</div>
      <div style={{ fontSize: 12, color: textMuted, margin: "2px 0 8px" }}>Du wählst nur Team, Übung und Termin – Takt und Ansage kommen aus der App.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {teams.map((t) => (
          <button key={t.id} type="button" aria-pressed={f.teamId === t.id} style={chip(f.teamId === t.id)} onClick={() => setF((x) => ({ ...x, teamId: t.id }))}>
            {t.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {ATEM_BIBLIOTHEK.map((u) => (
          <button key={u.key} type="button" aria-pressed={f.uebungKey === u.key} style={chip(f.uebungKey === u.key)} onClick={() => setF((x) => ({ ...x, uebungKey: u.key }))}>
            {u.icon} {u.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
        <input
          type="datetime-local"
          aria-label="Termin"
          value={f.start}
          onChange={(e) => setF((x) => ({ ...x, start: e.target.value }))}
          style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 99, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }}
        />
        {[5, 10, 15].map((d) => (
          <button key={d} type="button" aria-pressed={f.dauerMinuten === d} style={chip(f.dauerMinuten === d)} onClick={() => setF((x) => ({ ...x, dauerMinuten: d }))}>
            {d} Min.
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={planen}>Session planen</PrimaryButton>
      </div>
      {meldung && (
        <div role="status" style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: meldung.fehler ? danger : "#1E8E5A" }}>
          {meldung.text}
        </div>
      )}
      {atemSessions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {atemSessions.map((s) => {
            const t = atemTeilnahmen.filter((x) => x.sessionId === s.id);
            const vorher = t.filter((x) => x.vorher).map((x) => Number(x.vorher));
            const nachher = t.filter((x) => x.nachher).map((x) => Number(x.nachher));
            const schnitt = (a) => (a.length ? gefuehlEmoji(String(Math.round(a.reduce((p, c) => p + c, 0) / a.length))) : "–");
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "7px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ flex: 1 }}>
                  <b>{teamName(s.teamId)}</b> · {new Date(s.startUm).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {uebungFuerKey(s.uebungKey)?.name}
                  <br />
                  <span style={{ color: textMuted }}>
                    {t.length} dabei · Stimmung Ø {schnitt(vorher)} → {schnitt(nachher)}
                  </span>
                </span>
                <button type="button" aria-label="Session löschen" onClick={() => atemSessionLoeschen(s.id)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
