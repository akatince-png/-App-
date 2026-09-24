import React, { useEffect, useState } from "react";
import { Shell, PrimaryButton, TextInput } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import Profilbild from "../../ui/Profilbild";
import ChatFenster from "../../ui/ChatFenster";
import { accentDark, cardBorder, danger, nachtSchatten, nachtVerlauf, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { toLocalISODate } from "../../utils/dates";
import { useCoachChat } from "../../data/coachChat";
import { AMPEL, coacheeStatus, coacheesSortiert, letzteSiebenTage, uebersichtZahlen } from "../../utils/coachAufmerksamkeit";

// Grafische Gesamtübersicht über ALLE Coachees gleichzeitig (15.08.,
// Nutzerin-Vorgabe: "wie meine Flipcharts aufrufen ... auf einen Blick
// überschaubar sehen") — ergänzt die bestehende Konten-Liste in
// AdminDashboardView.jsx (die für "Verwalten als"/Zugänge-Anlegen bleibt),
// hier liegt der Fokus auf Protokoll-Fortschritt + direktem Nachrichten-
// Versand, ohne für jede Person erst in "Verwalten als" wechseln zu müssen.
// Nutzt dieselbe admin_liste_probanden()-RPC wie das Konten-Dashboard,
// seit Migration 0065 zusätzlich mit Protokoll-Startdatum/-Dauer und
// ungelesenen Nachrichten pro Person.
export default function AdminCoachUebersichtView({ onHome, onVerwalteAls }) {
  const [probanden, setProbanden] = useState([]);
  const [teams, setTeams] = useState([]);
  const [trainingByUser, setTrainingByUser] = useState({});
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("alle");
  const [offenFuer, setOffenFuer] = useState(null);
  const [trainingFuer, setTrainingFuer] = useState(null);
  const [chatFuer, setChatFuer] = useState(null);

  const probandenLaden = async () => {
    const { data, error } = await supabase.rpc("admin_liste_probanden");
    if (error) {
      setFehler(error.message);
      return null;
    }
    setFehler(null);
    setProbanden(data || []);
    return data || [];
  };

  useEffect(() => {
    (async () => {
      setLadend(true);
      const [data, { data: teamListe }] = await Promise.all([probandenLaden(), supabase.from("teams").select("id, name").order("name")]);
      setTeams(teamListe || []);
      setLadend(false);
      if (!data) return;

      // Trainings-Wochenplan + jüngste Sessions über ALLE Coachees auf
      // einmal laden (15.08., Nutzerin-Vorgabe: "alle Dinge, die der
      // Coachee mit mir plant, einsehen und beeinflussen können") — RLS
      // erlaubt Admins vollen Zugriff auf beide Tabellen (siehe 0035), kein
      // neuer RPC-Umweg nötig, ganz normale Tabellen-Abfrage.
      const ids = data.map((p) => p.id);
      if (ids.length === 0) return;
      const [{ data: wochenplan }, { data: sessions }] = await Promise.all([
        supabase.from("training_wochenplan").select("user_id, name, wochentag, uhrzeit, arten").in("user_id", ids),
        supabase.from("training_sessions").select("user_id, datum, art, name, erledigt").in("user_id", ids).order("datum", { ascending: false }),
      ]);
      const vorSiebenTagen = new Date();
      vorSiebenTagen.setDate(vorSiebenTagen.getDate() - 7);
      const vorSiebenTagenStr = toLocalISODate(vorSiebenTagen);
      const byUser = {};
      for (const id of ids) byUser[id] = { wochenplan: [], letztesTraining: null, letzte7Tage: 0 };
      for (const w of wochenplan || []) {
        if (byUser[w.user_id]) byUser[w.user_id].wochenplan.push(w);
      }
      for (const s of sessions || []) {
        const eintrag = byUser[s.user_id];
        if (!eintrag || !s.erledigt) continue;
        if (!eintrag.letztesTraining) eintrag.letztesTraining = s.datum;
        if (s.datum >= vorSiebenTagenStr) eintrag.letzte7Tage += 1;
      }
      setTrainingByUser(byUser);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Wer braucht dich?" (24.09., Nutzerinnen-Freigabe der Vorschau): nur
  // Coachees (Admin-Konten ausgeblendet), sortiert nach Aufmerksamkeit.
  const sortiert = coacheesSortiert(probanden);
  const zahlen = uebersichtZahlen(sortiert);
  const teamName = (id) => teams.find((t) => t.id === id)?.name || null;
  const gefiltert = sortiert.filter((p) => {
    if (filter === "braucht" && !p.status.brauchtDich) return false;
    if (filter !== "alle" && filter !== "braucht" && p.team_id !== filter) return false;
    const q = suche.trim().toLowerCase();
    if (!q) return true;
    return (p.vorname || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });
  const teamFilter = teams.filter((t) => sortiert.some((p) => p.team_id === t.id));

  return (
    <Shell>
      <ViewHeader title="📊 Coach-Übersicht" onHome={onHome} />

      <div style={{ borderRadius: 20, padding: "14px 16px", background: nachtVerlauf, color: "#fff", marginBottom: 12, boxShadow: nachtSchatten }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Heute für dich</div>
        <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
          {[
            [zahlen.brauchenDich, "brauchen dich"],
            [zahlen.neueNachrichten, zahlen.neueNachrichten === 1 ? "neue Nachricht" : "neue Nachrichten"],
            [zahlen.laufenGut, "laufen gut"],
          ].map(([zahl, text]) => (
            <div key={text} style={{ fontSize: 12, opacity: 0.95 }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{zahl}</div>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[["alle", "Alle"], ["braucht", "Brauchen dich"], ...teamFilter.map((t) => [t.id, t.name])].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="mp-tap"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            style={{ border: "none", borderRadius: 99, padding: "6px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: filter === id ? accentDark : "#EEF0F5", color: filter === id ? "#fff" : textMain }}
          >
            {label}
          </button>
        ))}
      </div>

      {sortiert.length > 8 && <TextInput value={suche} onChange={setSuche} placeholder="Suchen nach Name oder E-Mail…" />}

      {ladend && <div style={{ fontSize: 13, color: textMuted, marginTop: 14 }}>Lädt…</div>}
      {fehler && <div style={{ fontSize: 13, color: danger, marginTop: 14 }}>{fehler}</div>}
      {!ladend && !fehler && gefiltert.length === 0 && (
        <div style={{ fontSize: 13, color: textMuted, marginTop: 14 }}>{filter === "braucht" ? "Gerade braucht dich niemand – alle laufen gut. 🎉" : "Keine Coachees gefunden."}</div>
      )}

      <div style={{ marginTop: 6 }}>
        {gefiltert.map((p) => (
          <CoacheeZeile
            key={p.id}
            proband={p}
            teamName={teamName(p.team_id)}
            offen={offenFuer === p.id}
            onToggle={() => setOffenFuer((v) => (v === p.id ? null : p.id))}
            onChat={() => setChatFuer(p)}
            onVerwalteAls={onVerwalteAls}
            training={trainingByUser[p.id]}
            trainingOffen={trainingFuer === p.id}
            onToggleTraining={() => setTrainingFuer((v) => (v === p.id ? null : p.id))}
          />
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.5, marginTop: 10 }}>
        Oben steht, wer dich braucht: seit 2 oder mehr Tagen ruhig, Onboarding offen oder eine ungelesene Nachricht. Neue Zugänge anlegen geht weiter im Admin-Dashboard.
      </div>

      {chatFuer && (
        <CoachChatFenster
          proband={chatFuer}
          teamName={teamName(chatFuer.team_id)}
          onZurueck={() => {
            setChatFuer(null);
            probandenLaden();
          }}
        />
      )}
    </Shell>
  );
}

const COACH_VORLAGEN = ["Wie läuft's bei dir?", "Stark gemacht! 💪", "Brauchst du Hilfe?"];

// Chat mit EINER Person aus Coach-Sicht (24.09., WhatsApp-Stil).
export function CoachChatFenster({ proband: p, teamName, onZurueck }) {
  const { nachrichten, fehler, senden } = useCoachChat(p.id, "coach");
  const status = p.status || coacheeStatus(p);
  return (
    <ChatFenster
      titel={p.vorname || p.email}
      untertitel={[teamName, status.text].filter(Boolean).join(" · ")}
      avatar={<Profilbild pfad={p.profilbild_pfad} name={p.vorname || p.email} size={40} />}
      ich="coach"
      nachrichten={nachrichten}
      fehler={fehler}
      onSenden={senden}
      onZurueck={onZurueck}
      vorlagen={COACH_VORLAGEN}
      platzhalter={`Nachricht an ${p.vorname || "die Person"} …`}
    />
  );
}

function CoacheeZeile({ proband: p, teamName, offen, onToggle, onChat, onVerwalteAls, training, trainingOffen, onToggleTraining }) {
  const s = p.status;
  const fortschritt = protokollFortschritt(p);
  const farbe = s.ampel === "rot" ? danger : s.ampel === "gelb" ? "#B7791F" : AMPEL.gruen;
  const verwalten = () => onVerwalteAls({ id: p.id, email: p.email, vorname: p.vorname });
  return (
    <div style={{ borderRadius: 16, border: offen ? `2px solid ${accentDark}` : `1.5px solid ${cardBorder}`, background: offen ? "#F4F8FF" : "#fff", marginBottom: 8 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={offen}
        className="mp-tap"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: textMain }}
      >
        <span style={{ position: "relative", flexShrink: 0 }}>
          <Profilbild pfad={p.profilbild_pfad} name={p.vorname || p.email} size={40} />
          <span style={{ position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: 99, border: "2px solid #fff", background: AMPEL[s.ampel] }} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.vorname || p.email}
            {teamName && <span style={{ fontWeight: 600, fontSize: 12, color: textMuted }}> · {teamName}</span>}
          </span>
          <span style={{ display: "block", fontSize: 12, color: textMuted }}>
            <span style={{ color: farbe, fontWeight: 700 }}>{s.text}</span>
            {s.zusatz ? ` · ${s.zusatz}` : s.art !== "onboarding" ? ` · ${p.punkte_7_tage || 0} P. diese Woche` : ""}
          </span>
        </span>
        {s.ungelesen > 0 ? (
          <span style={{ background: danger, color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px", flexShrink: 0 }}>💬 {s.ungelesen}</span>
        ) : (
          <span style={{ color: "#9AA0B4", fontSize: 18, flexShrink: 0 }}>{offen ? "▾" : "›"}</span>
        )}
      </button>

      {offen && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {letzteSiebenTage(p.aktive_tage_7).map((t) => (
              <div key={t.iso} title={t.iso} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 24, borderRadius: 5, background: t.aktiv ? "#9CC9B0" : "#E3E6EE" }} />
                <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{t.kurz}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: textMuted, margin: "4px 0 10px" }}>
            Die letzten 7 Tage (grün = etwas geschafft){fortschritt ? ` · Protokoll Tag ${fortschritt.vergangeneTage} von ${fortschritt.gesamtTage}` : ""}
          </div>
          <PrimaryButton onClick={onChat}>💬 Chat{s.ungelesen > 0 ? ` (${s.ungelesen} neu)` : ""}</PrimaryButton>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={verwalten}>
                ✏️ Einträge korrigieren
              </PrimaryButton>
            </div>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={onToggleTraining}>
                {trainingOffen ? "Training zu" : "🏋️ Training"}
              </PrimaryButton>
            </div>
          </div>
          {trainingOffen && <CoacheeTrainingPanel training={training} onVerwalteAls={verwalten} />}
        </div>
      )}
    </div>
  );
}

// Fortschritt in Tagen statt Prozent als primäre Zahl (13/84 statt nur
// "15%") — für eine Coaching-Übersicht aussagekräftiger, wie lange ein
// Protokoll noch läuft ist oft die eigentlich interessante Frage.
function protokollFortschritt(p) {
  if (!p.protokoll_startdatum || !p.protokoll_dauer_wochen) return null;
  const start = new Date(`${p.protokoll_startdatum}T00:00:00`);
  const heute = new Date();
  const vergangeneTage = Math.max(0, Math.floor((heute - start) / 86400000));
  const gesamtTage = p.protokoll_dauer_wochen * 7;
  return { vergangeneTage: Math.min(vergangeneTage, gesamtTage), gesamtTage };
}

const WOCHENTAG_REIHENFOLGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Trainingsplan + jüngste Aktivität EINER Coachee (15.08., Nutzerin-
// Vorgabe: "alle Dinge, die der Coachee mit mir plant, einsehen und
// beeinflussen können") — reine Einsicht hier; tatsächliches Ändern läuft
// weiterhin über "Verwalten" (echte Bearbeitung an dieser Stelle würde eine
// zweite, parallele Oberfläche zur eigentlichen Trainings-Ansicht bedeuten).
function CoacheeTrainingPanel({ training, onVerwalteAls }) {
  const wochenplan = [...(training?.wochenplan || [])].sort(
    (a, b) => WOCHENTAG_REIHENFOLGE.indexOf(a.wochentag) - WOCHENTAG_REIHENFOLGE.indexOf(b.wochentag)
  );
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>
        {training?.letzte7Tage
          ? `${training.letzte7Tage} Training${training.letzte7Tage === 1 ? "" : "s"} in den letzten 7 Tagen`
          : "Kein Training in den letzten 7 Tagen"}
        {training?.letztesTraining && ` · zuletzt am ${new Date(training.letztesTraining).toLocaleDateString("de-DE")}`}
      </div>

      {wochenplan.length === 0 ? (
        <div style={{ fontSize: 12.5, color: textMuted }}>Noch kein Trainingsplan hinterlegt.</div>
      ) : (
        wochenplan.map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: i > 0 ? `1px solid ${cardBorder}` : "none", fontSize: 12.5 }}>
            <div style={{ fontWeight: 700, width: 28, flexShrink: 0 }}>{w.wochentag}</div>
            <div style={{ minWidth: 0 }}>
              <div>{w.name || (w.arten || []).join(" + ") || "Training"}</div>
              {w.uhrzeit && <div style={{ color: textMuted, fontSize: 11 }}>{w.uhrzeit.slice(0, 5)} Uhr</div>}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 10 }}>
        <PrimaryButton variant="ghost" onClick={onVerwalteAls}>
          Trainingsplan bearbeiten (Verwalten)
        </PrimaryButton>
      </div>
    </div>
  );
}
