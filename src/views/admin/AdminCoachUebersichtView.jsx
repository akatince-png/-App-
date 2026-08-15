import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import ProgressRing from "../../ui/ProgressRing";
import { accentDark, danger, success, successSoft, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { CoacheeNachrichtenPanel } from "./AdminDashboardView";

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
  const [trainingByUser, setTrainingByUser] = useState({});
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [nachrichtenFuer, setNachrichtenFuer] = useState(null);
  const [trainingFuer, setTrainingFuer] = useState(null);

  useEffect(() => {
    (async () => {
      setLadend(true);
      const { data, error } = await supabase.rpc("admin_liste_probanden");
      if (error) {
        setFehler(error.message);
        setLadend(false);
        return;
      }
      setProbanden(data || []);
      setLadend(false);

      // Trainings-Wochenplan + jüngste Sessions über ALLE Coachees auf
      // einmal laden (15.08., Nutzerin-Vorgabe: "alle Dinge, die der
      // Coachee mit mir plant, einsehen und beeinflussen können") — RLS
      // erlaubt Admins vollen Zugriff auf beide Tabellen (siehe 0035), kein
      // neuer RPC-Umweg nötig, ganz normale Tabellen-Abfrage.
      const ids = (data || []).map((p) => p.id);
      if (ids.length === 0) return;
      const [{ data: wochenplan }, { data: sessions }] = await Promise.all([
        supabase.from("training_wochenplan").select("user_id, name, wochentag, uhrzeit, arten").in("user_id", ids),
        supabase.from("training_sessions").select("user_id, datum, art, name, erledigt").in("user_id", ids).order("datum", { ascending: false }),
      ]);
      const vorSiebenTagen = new Date();
      vorSiebenTagen.setDate(vorSiebenTagen.getDate() - 7);
      const vorSiebenTagenStr = vorSiebenTagen.toISOString().slice(0, 10);
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
  }, []);

  const gefiltert = probanden.filter((p) => {
    const q = suche.trim().toLowerCase();
    if (!q) return true;
    return (p.vorname || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  const gesamtUngelesen = probanden.reduce((sum, p) => sum + (p.ungelesene_nachrichten || 0), 0);

  return (
    <Shell>
      <ViewHeader title="📊 Coach-Übersicht" onHome={onHome} />

      <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.6 }}>
        Alle Coachees mit Protokoll-Fortschritt auf einen Blick. Für die volle Kontenverwaltung (neue Zugänge anlegen,
        stellvertretend bedienen) geht's über "Verwalten" wie gewohnt.
        {gesamtUngelesen > 0 && (
          <span style={{ display: "block", marginTop: 6, fontWeight: 700, color: danger }}>
            {gesamtUngelesen} ungelesene Nachricht{gesamtUngelesen === 1 ? "" : "en"} insgesamt.
          </span>
        )}
      </div>

      <TextInput value={suche} onChange={setSuche} placeholder="Suchen nach Name oder E-Mail…" />

      {ladend && <div style={{ fontSize: 13, color: textMuted, marginTop: 14 }}>Lädt…</div>}
      {fehler && <div style={{ fontSize: 13, color: danger, marginTop: 14 }}>{fehler}</div>}
      {!ladend && !fehler && gefiltert.length === 0 && (
        <div style={{ fontSize: 13, color: textMuted, marginTop: 14 }}>Keine Konten gefunden.</div>
      )}

      <div className="mp-admin-probanden-grid" style={{ marginTop: 14 }}>
        {gefiltert.map((p) => (
          <CoacheeKarte
            key={p.id}
            proband={p}
            training={trainingByUser[p.id]}
            onVerwalteAls={onVerwalteAls}
            nachrichtenOffen={nachrichtenFuer === p.id}
            onToggleNachrichten={() => setNachrichtenFuer((v) => (v === p.id ? null : p.id))}
            trainingOffen={trainingFuer === p.id}
            onToggleTraining={() => setTrainingFuer((v) => (v === p.id ? null : p.id))}
          />
        ))}
      </div>
    </Shell>
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

function CoacheeKarte({ proband: p, training, onVerwalteAls, nachrichtenOffen, onToggleNachrichten, trainingOffen, onToggleTraining }) {
  const fortschritt = protokollFortschritt(p);
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ProgressRing
          done={fortschritt?.vergangeneTage ?? 0}
          total={fortschritt?.gesamtTage ?? 0}
          size={64}
          stroke={7}
          color={accentDark}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.vorname || p.email}
          </div>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
            {fortschritt ? `Tag ${fortschritt.vergangeneTage} von ${fortschritt.gesamtTage}` : "Kein aktives Protokoll"}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 9,
                background: p.onboarding_complete ? successSoft : "#F5F1E8",
                color: p.onboarding_complete ? success : "#8A6D1E",
              }}
            >
              {p.onboarding_complete ? "Eingerichtet" : "Onboarding offen"}
            </span>
            {p.ungelesene_nachrichten > 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 9, background: "#FBEAE7", color: danger }}>
                {p.ungelesene_nachrichten} neu
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={() => onVerwalteAls({ id: p.id, email: p.email, vorname: p.vorname })}>Verwalten</PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={onToggleNachrichten}>
            {nachrichtenOffen ? "Schließen" : "💬 Nachricht"}
          </PrimaryButton>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <PrimaryButton variant="ghost" onClick={onToggleTraining}>
          {trainingOffen ? "Training schließen" : "🏋️ Training"}
        </PrimaryButton>
      </div>

      {nachrichtenOffen && <CoacheeNachrichtenPanel proband={p} />}
      {trainingOffen && <CoacheeTrainingPanel training={training} onVerwalteAls={() => onVerwalteAls({ id: p.id, email: p.email, vorname: p.vorname })} />}
    </Card>
  );
}

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
