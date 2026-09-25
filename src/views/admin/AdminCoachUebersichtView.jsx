import React, { useEffect, useState } from "react";
import { tagebuchMuster, stimmungEmoji, momentZeile } from "../../utils/tagebuch";
import { zeileZuEintrag, zeileZuMoment } from "../../data/useTagebuch";
import { Shell, PrimaryButton, TextInput } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import Profilbild from "../../ui/Profilbild";
import ChatFenster from "../../ui/ChatFenster";
import { accentDark, cardBorder, danger, nachtSchatten, nachtVerlauf, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { toLocalISODate } from "../../utils/dates";
import { chatListe, chatZeitKurz, useCoachChat } from "../../data/coachChat";
import { AMPEL, coacheeStatus, coacheesSortiert, letzteSiebenTage, uebersichtZahlen } from "../../utils/coachAufmerksamkeit";
import { coachVerspaetungen, satzVomCoach } from "../../utils/routineVerspaetung";
import KernprogrammCoach from "./KernprogrammCoach";
import ErnaehrungCoach from "./ErnaehrungCoach";
import { kernprogrammStarten } from "../../data/kernprogrammAdmin";
import { datumKurz, kernKurztext, naechsterMontag, programmStand, zeileZuEtappe } from "../../utils/kernprogramm";
import { isoTag, planFuer, plusTage, puenktlichkeitJeVariante, zeileZuPlantag, zeileZuVariante } from "../../utils/schichtplan";

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
  const [reiter, setReiter] = useState("uebersicht");
  const [chatZeilen, setChatZeilen] = useState([]);
  const [verspaetungen, setVerspaetungen] = useState({});
  const [schichtByUser, setSchichtByUser] = useState({});
  const [chatEntwurf, setChatEntwurf] = useState("");
  // AKA-Kernprogramm (25.09.): Etappen aller Coachees.
  const [etappenByUser, setEtappenByUser] = useState({});
  const [kernHinweis, setKernHinweis] = useState(null);
  const etappenLaden = async (ids) => {
    if (!ids?.length) return;
    const { data } = await supabase.from("coaching_etappen").select("*").in("user_id", ids).order("nummer");
    const m = {};
    (data || []).forEach((r) => (m[r.user_id] ||= []).push(zeileZuEtappe(r)));
    setEtappenByUser(m);
  };

  // Chatliste (24.09., WhatsApp-Startseite): die letzten Nachrichten aller
  // Coachees; die Liste daraus baut chatListe().
  const chatsLaden = async () => {
    const { data, error } = await supabase
      .from("coachee_nachrichten")
      .select("id, user_id, text, absender, gelesen, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .limit(1000);
    if (!error) setChatZeilen(data || []);
  };

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
      const [data, { data: teamListe }] = await Promise.all([probandenLaden(), supabase.from("teams").select("id, name").order("name"), chatsLaden()]);
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
      etappenLaden(ids);
      // Routine-Zeiten der letzten Tage (25.09.): wer schafft die Morgen-/
      // Abendroutine meist deutlich später als geplant? (RLS: Admins lesen
      // beide Tabellen, siehe 0035.)
      // Schichtarbeit (25.09.): Varianten + Plan je Person (4 Wochen zurück,
      // 3 Wochen voraus) — für Verspätung je Schicht und "Pünktlichkeit je
      // Schicht" in der aufgeklappten Zeile. Bis 200 Tage voraus, damit
      // "läuft bis" das echte Planende zeigt.
      const heuteIso = toLocalISODate(new Date());
      const [{ data: wochenplan }, { data: sessions }, { data: routineZeiten }, { data: routineLaeufe }, { data: varianten }, { data: planZeilen }] = await Promise.all([
        supabase.from("training_wochenplan").select("user_id, name, wochentag, uhrzeit, arten").in("user_id", ids),
        supabase.from("training_sessions").select("user_id, datum, art, name, erledigt").in("user_id", ids).order("datum", { ascending: false }),
        supabase.from("routine_einstellungen").select("user_id, routine, start_zeit").in("user_id", ids),
        supabase.from("routine_durchlaeufe").select("user_id, routine, datum, gestartet_um, abgeschlossen_um").in("user_id", ids).gte("datum", plusTage(heuteIso, -27)),
        supabase.from("routine_varianten").select("*").in("user_id", ids).order("reihenfolge"),
        supabase.from("routine_schichtplan").select("*").in("user_id", ids).gte("datum", plusTage(heuteIso, -27)).lte("datum", plusTage(heuteIso, 200)),
      ]);
      const startZeiten = new Map((routineZeiten || []).map((z) => [`${z.user_id}_${z.routine}`, z.start_zeit]));
      setVerspaetungen(
        coachVerspaetungen(
          [...(routineZeiten || []), ...(routineLaeufe || []).map((l) => ({ ...l, start_zeit: startZeiten.get(`${l.user_id}_${l.routine}`) }))],
          new Date(),
          { varianten: varianten || [], plan: planZeilen || [] }
        )
      );
      const schicht = {};
      for (const v of varianten || []) (schicht[v.user_id] ||= { varianten: [], plan: {}, laeufe: [], standard: {} }).varianten.push(zeileZuVariante(v));
      for (const t of planZeilen || []) if (schicht[t.user_id]) schicht[t.user_id].plan[t.datum] = zeileZuPlantag(t);
      for (const [id, e] of Object.entries(schicht)) {
        e.laeufe = (routineLaeufe || []).filter((l) => l.user_id === id).map((l) => ({ routine: l.routine, datum: l.datum, gestartetUm: l.gestartet_um, abgeschlossenUm: l.abgeschlossen_um }));
        e.standard = { morgen: { startZeit: String(startZeiten.get(`${id}_morgen`) || "").slice(0, 5) }, abend: { startZeit: String(startZeiten.get(`${id}_abend`) || "").slice(0, 5) } };
      }
      setSchichtByUser(schicht);
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
  const sortiert = coacheesSortiert(probanden.map((p) => (verspaetungen[p.id] ? { ...p, routine_verspaetung: verspaetungen[p.id] } : p)));
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

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          ["uebersicht", "👥 Übersicht"],
          ["chats", `💬 Chats${zahlen.neueNachrichten > 0 ? ` (${zahlen.neueNachrichten})` : ""}`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="mp-tap"
            aria-pressed={reiter === id}
            onClick={() => setReiter(id)}
            style={{ flex: 1, border: "none", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: reiter === id ? accentDark : "#EEF0F5", color: reiter === id ? "#fff" : textMain }}
          >
            {label}
          </button>
        ))}
      </div>

      {reiter === "chats" ? (
        <ChatListe eintraege={chatListe(sortiert, chatZeilen)} teamName={teamName} onOeffnen={(p) => setChatFuer(p)} />
      ) : (
      <>
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

      <KernprogrammLeiste
        personen={gefiltert}
        etappenByUser={etappenByUser}
        hinweis={kernHinweis}
        onStarten={async (ids, start) => {
          const r = await kernprogrammStarten(ids, start);
          setKernHinweis(r.ok ? `🧭 Kernprogramm für ${r.anzahl} ${r.anzahl === 1 ? "Person" : "Personen"} ab ${datumKurz(start)} gestartet.` : `Fehler: ${r.error}`);
          etappenLaden(sortiert.map((p) => p.id));
        }}
      />

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
            onChat={(entwurf = "") => {
              setChatEntwurf(entwurf);
              setChatFuer(p);
            }}
            onVerwalteAls={onVerwalteAls}
            training={trainingByUser[p.id]}
            schicht={schichtByUser[p.id]}
            etappen={etappenByUser[p.id] || []}
            onKernGeaendert={() => etappenLaden(sortiert.map((x) => x.id))}
            trainingOffen={trainingFuer === p.id}
            onToggleTraining={() => setTrainingFuer((v) => (v === p.id ? null : p.id))}
          />
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.5, marginTop: 10 }}>
        Oben steht, wer dich braucht: seit 2 oder mehr Tagen ruhig, Onboarding offen, eine ungelesene Nachricht oder eine Routine, die an 3 von 5 Tagen mehr als 30 Min. später klappt. Neue Zugänge anlegen geht weiter im Admin-Dashboard.
      </div>
      </>
      )}

      {chatFuer && (
        <CoachChatFenster
          proband={chatFuer}
          teamName={teamName(chatFuer.team_id)}
          startText={chatEntwurf}
          onZurueck={() => {
            setChatFuer(null);
            setChatEntwurf("");
            probandenLaden();
            chatsLaden();
          }}
        />
      )}
    </Shell>
  );
}

// Chatliste wie die WhatsApp-Startseite (24.09.): pro Person die letzte
// Nachricht mit Uhrzeit, ungelesene als Zahl, neueste Unterhaltung oben.
function ChatListe({ eintraege, teamName, onOeffnen }) {
  if (eintraege.length === 0) {
    return <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>Noch keine Chats. Einen neuen startest du in der Übersicht: Person antippen → „💬 Chat“.</div>;
  }
  return (
    <div>
      {eintraege.map(({ proband: p, letzte, ungelesen }) => (
        <button
          key={p.id}
          type="button"
          className="mp-tap"
          aria-label={`Chat mit ${p.vorname || p.email}`}
          onClick={() => onOeffnen(p)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", border: "none", borderBottom: `1px solid ${cardBorder}`, background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: textMain }}
        >
          <Profilbild pfad={p.profilbild_pfad} name={p.vorname || p.email} size={44} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.vorname || p.email}
                {teamName(p.team_id) && <span style={{ fontWeight: 600, fontSize: 12, color: textMuted }}> · {teamName(p.team_id)}</span>}
              </span>
              <span style={{ fontSize: 11.5, color: ungelesen > 0 ? "#1E8E5A" : textMuted, fontWeight: ungelesen > 0 ? 800 : 500, flexShrink: 0 }}>{chatZeitKurz(letzte.erstelltAm)}</span>
            </span>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 13, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: ungelesen > 0 ? 700 : 400 }}>
                {letzte.absender === "coach" ? (
                  <span style={{ color: letzte.gelesen ? "#2D6FD6" : textMuted }}>{letzte.gelesen ? "✓✓ " : "✓ "}</span>
                ) : null}
                {letzte.absender === "coach" ? "Du: " : ""}
                {letzte.text}
              </span>
              {ungelesen > 0 && <span style={{ background: "#1E8E5A", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "2px 7px", flexShrink: 0 }}>{ungelesen}</span>}
            </span>
          </span>
        </button>
      ))}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 10 }}>Neuen Chat starten: in der Übersicht Person antippen → „💬 Chat“.</div>
    </div>
  );
}

const COACH_VORLAGEN = ["Wie läuft's bei dir?", "Stark gemacht! 💪", "Brauchst du Hilfe?"];

// Chat mit EINER Person aus Coach-Sicht (24.09., WhatsApp-Stil).
export function CoachChatFenster({ proband: p, teamName, onZurueck, startText = "" }) {
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
      startText={startText}
    />
  );
}

// Kernprogramm-Leiste über der Liste (25.09.): fällige Etappen-Gespräche
// und "Programm starten" für alle aus der aktuellen Auswahl (Filter
// "Alle" oder ein Team), die noch keins haben.
function KernprogrammLeiste({ personen, etappenByUser, hinweis, onStarten }) {
  const heute = toLocalISODate(new Date());
  const [start, setStart] = useState(naechsterMontag(heute));
  const ohne = personen.filter((p) => !(etappenByUser[p.id] || []).length);
  const faellig = personen.filter((p) => programmStand(etappenByUser[p.id] || [], heute).gespraechFaellig);
  if (!ohne.length && !faellig.length && !hinweis) return null;
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${cardBorder}`, background: "#fff", padding: "10px 12px", marginBottom: 10 }} data-kern-leiste>
      {faellig.length > 0 && (
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: ohne.length ? 8 : 0 }}>💬 Etappen-Gespräch fällig: {faellig.map((p) => p.vorname || p.email).join(", ")}</div>
      )}
      {ohne.length > 0 && (
        <>
          <div style={{ fontSize: 13 }}>
            🧭 <b>{ohne.length}</b> {ohne.length === 1 ? "Person hat" : "Personen haben"} noch kein Kernprogramm: {ohne.map((p) => p.vorname || p.email).join(", ")}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <input type="date" aria-label="Start für alle" value={start} onChange={(e) => setStart(e.target.value)} style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 13.5, fontFamily: "inherit" }} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <PrimaryButton onClick={() => onStarten(ohne.map((p) => p.id), start)}>Für alle {ohne.length} starten</PrimaryButton>
            </div>
          </div>
        </>
      )}
      {hinweis && <div style={{ fontSize: 12.5, marginTop: 8, color: textMuted }}>{hinweis}</div>}
    </div>
  );
}

function CoacheeZeile({ proband: p, teamName, offen, onToggle, onChat, onVerwalteAls, training, trainingOffen, onToggleTraining, schicht, etappen = [], onKernGeaendert }) {
  const kernText = kernKurztext(etappen, toLocalISODate(new Date()));
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
          {kernText && <span style={{ display: "block", fontSize: 11.5, color: kernText.startsWith("💬") ? "#B7791F" : textMuted, fontWeight: kernText.startsWith("💬") ? 800 : 600 }}>{kernText}</span>}
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
          <KernprogrammCoach personId={p.id} vorname={p.vorname} onChat={onChat} onGeaendert={onKernGeaendert} />
          <ErnaehrungCoach personId={p.id} vorname={p.vorname} onChat={onChat} />
          <TagebuchKurz personId={p.id} vorname={p.vorname} onChat={onChat} />
          {schicht && <SchichtKurz schicht={schicht} onBearbeiten={() => {
            verwalten();
            // Nach dem Wechsel in "Verwalten als" direkt die Schichtplan-Seite.
            setTimeout(() => (window.location.hash = "#/schichtplan"), 300);
          }} />}
          {s.verspaetung && (
            <div style={{ borderRadius: 12, background: "#FFF6E0", border: "1.5px solid #F2C94C", padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {s.verspaetung.labelLang || s.verspaetung.label}: an {s.verspaetung.spaetAnzahl} von {s.verspaetung.tage.length} Tagen deutlich später
              </div>
              <div style={{ fontSize: 12, color: textMuted, margin: "2px 0 8px" }}>
                Meist gegen {s.verspaetung.vorschlag} statt {s.verspaetung.startZeit} – vielleicht ist die Zeit nicht gut geplant.
              </div>
              <PrimaryButton variant="ghost" onClick={() => onChat(satzVomCoach(s.verspaetung, p.vorname))}>
                💬 {s.verspaetung.variante ? `${s.verspaetung.variante.name}-Zeit ansprechen` : "Zeit ansprechen"}
              </PrimaryButton>
            </div>
          )}
          <PrimaryButton onClick={() => onChat()}>💬 Chat{s.ungelesen > 0 ? ` (${s.ungelesen} neu)` : ""}</PrimaryButton>
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

// Schichtplan einer Person (25.09.): die nächsten 14 Tage als Leiste,
// Pünktlichkeit je Schicht (4 Wochen) und "Plan bearbeiten".
function SchichtKurz({ schicht, onBearbeiten }) {
  const ctx = { plan: schicht.plan, varianten: schicht.varianten, standard: schicht.standard };
  const heute = isoTag(new Date());
  const tage = Array.from({ length: 14 }, (_, i) => planFuer(plusTage(heute, i), ctx));
  const puenktlich = puenktlichkeitJeVariante(schicht.laeufe, "morgen", ctx, new Date(), 28);
  const letzter = Object.keys(schicht.plan).sort().at(-1);
  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cardBorder}`, padding: "10px 12px", marginBottom: 10, background: "#fff" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>
        SCHICHTPLAN · heute {tags(tage[0])}
        {letzter && letzter >= heute ? ` · läuft bis ${letzter.slice(8, 10)}.${letzter.slice(5, 7)}.` : " · kein Plan"}
      </div>
      <div style={{ display: "flex", gap: 3, margin: "6px 0" }} aria-label="Schichten der nächsten 14 Tage">
        {tage.map((t) => (
          <span key={t.datum} title={`${t.datum}: ${t.label}`} style={{ flex: 1, textAlign: "center", fontSize: 12, borderRadius: 5, padding: "2px 0", background: t.art === "standard" ? "#F1F2F6" : "#FFF1D6" }}>
            {t.icon || "–"}
          </span>
        ))}
      </div>
      {puenktlich.length > 0 && (
        <div style={{ fontSize: 12.5, margin: "4px 0 8px" }}>
          <div style={{ fontWeight: 800, marginBottom: 2 }}>Morgenroutine pünktlich je Schicht (4 Wochen)</div>
          {puenktlich.map((x) => (
            <div key={x.key} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {x.icon} {x.label}
              </span>
              <b style={{ color: x.puenktlich / x.gesamt >= 0.6 ? AMPEL.gruen : danger }}>
                {x.puenktlich} von {x.gesamt}
              </b>
            </div>
          ))}
        </div>
      )}
      <PrimaryButton variant="ghost" onClick={onBearbeiten}>
        ✏️ Schichtplan bearbeiten
      </PrimaryButton>
    </div>
  );
}

function tags(p) {
  return p.art === "standard" ? "normal" : `${p.icon || ""} ${p.label}`.trim();
}

// Tagebuch einer Person (25.09.): Stimmung der letzten 14 Einträge und die
// stärksten Muster. Freie Notizen nur, wenn die Person sie geteilt hat
// (admin_tagebuch() lässt private Notizen weg).
function TagebuchKurz({ personId, vorname, onChat }) {
  const [eintraege, setEintraege] = useState(null);
  const [momente, setMomente] = useState([]);
  useEffect(() => {
    let ab = false;
    supabase.rpc("admin_momente", { p_user: personId, p_tage: 30 }).then(({ data, error }) => {
      if (ab) return;
      if (error) console.error(error);
      setMomente((data || []).map(zeileZuMoment));
    });
    supabase.rpc("admin_tagebuch", { p_user: personId, p_tage: 60 }).then(({ data, error }) => {
      if (ab) return;
      if (error) console.error(error);
      setEintraege((data || []).map(zeileZuEintrag));
    });
    return () => {
      ab = true;
    };
  }, [personId]);
  if (!eintraege || (eintraege.length === 0 && momente.length === 0)) return null;
  const m = tagebuchMuster(eintraege);
  const geteilt = eintraege.filter((e) => e.notiz).slice(-3).reverse();
  const top = m.muster.slice(0, 3);
  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cardBorder}`, padding: "10px 12px", marginBottom: 10, background: "#fff" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>TAGEBUCH · letzte {Math.min(14, eintraege.length)} Einträge</div>
      <div aria-label="Stimmungsverlauf" style={{ fontSize: 19, letterSpacing: 2, margin: "4px 0" }}>
        {eintraege.slice(-14).map((e) => (
          <span key={e.datum} title={e.datum}>
            {stimmungEmoji(e.stimmung)}
          </span>
        ))}
      </div>
      {m.bereit ? (
        top.length > 0 && (
          <div style={{ fontSize: 12.5, margin: "4px 0 6px" }}>
            <b>Stärkste Muster</b>
            {top.map((x) => (
              <div key={x.key}>
                {x.label}: gut {x.gut}/{x.gutVon} · schwer {x.schwer}/{x.schwerVon}
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{ fontSize: 12, color: textMuted }}>Muster ab 14 Einträgen (bisher {eintraege.length}).</div>
      )}
      {geteilt.map((e) => (
        <div key={e.datum} style={{ fontSize: 12, marginTop: 2 }}>
          👁 {e.datum.slice(8, 10)}.{e.datum.slice(5, 7)}.: {e.notiz}
        </div>
      ))}
      {momente.length > 0 && (
        <div aria-label="Momente" style={{ fontSize: 12, marginTop: 6 }}>
          <b>📝 Momente (30 Tage): {momente.length}</b>
          {[...momente]
            .reverse()
            .slice(0, 4)
            .map((x) => (
              <div key={x.id}>
                {new Date(x.zeit).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} {momentZeile(x)}
                {x.ausloeser ? ` – 👁 ${x.ausloeser}` : ""}
              </div>
            ))}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>🔒 Nicht geteilte Notizen bleiben privat.</div>
      {top[0] && (
        <div style={{ marginTop: 8 }}>
          <PrimaryButton
            variant="ghost"
            onClick={() =>
              onChat(
                `Hallo${vorname ? ` ${vorname}` : ""}, mir ist in deinem Tagebuch aufgefallen: „${top[0].label.replace(/^[^\p{L}\d]+\s/u, "")}“ kommt an deinen ${top[0].richtung === "gut" ? "guten" : "schweren"} Tagen deutlich öfter vor. Wollen wir schauen, was wir daraus machen?`
              )
            }
          >
            💬 Muster im Chat ansprechen
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
