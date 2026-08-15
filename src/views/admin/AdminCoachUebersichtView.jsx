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
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [nachrichtenFuer, setNachrichtenFuer] = useState(null);

  useEffect(() => {
    (async () => {
      setLadend(true);
      const { data, error } = await supabase.rpc("admin_liste_probanden");
      if (error) setFehler(error.message);
      else setProbanden(data || []);
      setLadend(false);
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
            onVerwalteAls={onVerwalteAls}
            nachrichtenOffen={nachrichtenFuer === p.id}
            onToggleNachrichten={() => setNachrichtenFuer((v) => (v === p.id ? null : p.id))}
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

function CoacheeKarte({ proband: p, onVerwalteAls, nachrichtenOffen, onToggleNachrichten }) {
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

      {nachrichtenOffen && <CoacheeNachrichtenPanel proband={p} />}
    </Card>
  );
}
