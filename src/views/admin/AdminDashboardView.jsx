import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, Label } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { accentDark, accentSoft, danger, success, successSoft, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";

// Admin-Dashboard: Übersicht aller Probandinnen/Probanden + Möglichkeit,
// stellvertretend für jemanden die App zu bedienen ("Verwalten"-Knopf →
// AdminContext.verwalteAls) — z. B. für Personen, die (noch) nicht
// selbstständig mit der KI ihren Plan erstellen können. Sobald "Verwalten"
// gedrückt wird, läuft die komplette App unverändert weiter, nur mit den
// Daten der ausgewählten Person statt der eigenen (siehe AppDataContext.jsx).
export default function AdminDashboardView({ onHome, onVerwalteAls }) {
  const [probanden, setProbanden] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [formOffen, setFormOffen] = useState(false);

  const ladeProbanden = async () => {
    setLadend(true);
    setFehler(null);
    const { data, error } = await supabase.rpc("admin_liste_probanden");
    if (error) {
      setFehler(error.message);
    } else {
      setProbanden(data || []);
    }
    setLadend(false);
  };

  useEffect(() => {
    ladeProbanden();
  }, []);

  const gefiltert = probanden.filter((p) => {
    const q = suche.trim().toLowerCase();
    if (!q) return true;
    return (p.vorname || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  return (
    <Shell>
      <ViewHeader title="Admin-Dashboard" onHome={onHome} />

      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.6 }}>
        Hier siehst du alle Konten. Mit "Verwalten" öffnest du die App
        stellvertretend mit den Daten dieser Person — du kannst dort alles
        genauso einstellen wie sie selbst. Ein Banner oben zeigt dir jederzeit,
        wessen Konto du gerade bearbeitest, mit einem Knopf zurück hierher.
      </div>

      <TextInput value={suche} onChange={setSuche} placeholder="Suchen nach Name oder E-Mail…" />

      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setFormOffen((v) => !v)}>
          {formOffen ? "Abbrechen" : "+ Neuen Zugang anlegen"}
        </PrimaryButton>
      </div>

      {formOffen && (
        <NeuerZugangForm
          onCreated={() => {
            setFormOffen(false);
            ladeProbanden();
          }}
        />
      )}

      {ladend && <div style={{ fontSize: 13, color: textMuted, marginTop: 10 }}>Lädt…</div>}
      {fehler && <div style={{ fontSize: 13, color: danger, marginTop: 10 }}>{fehler}</div>}

      {!ladend && !fehler && gefiltert.length === 0 && (
        <div style={{ fontSize: 13, color: textMuted, marginTop: 10 }}>Keine Konten gefunden.</div>
      )}

      {gefiltert.map((p) => (
        <Card key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.vorname || p.email}
                {p.is_admin && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: accentDark, background: accentSoft, padding: "2px 8px", borderRadius: 8 }}>
                    Admin
                  </span>
                )}
              </div>
              {p.vorname && <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{p.email}</div>}
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 10,
                    background: p.onboarding_complete ? successSoft : "#F5F1E8",
                    color: p.onboarding_complete ? success : "#8A6D1E",
                  }}
                >
                  {p.onboarding_complete ? "Eingerichtet" : "Onboarding offen"}
                </span>
              </div>
            </div>
            <button
              onClick={() => onVerwalteAls({ id: p.id, email: p.email, vorname: p.vorname })}
              className="mp-tap"
              style={{ flexShrink: 0, padding: "11px 16px", borderRadius: 12, border: "none", background: accentDark, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Verwalten
            </button>
          </div>
        </Card>
      ))}
    </Shell>
  );
}

function NeuerZugangForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [vorname, setVorname] = useState("");
  const [passwort, setPasswort] = useState("");
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);

  const anlegen = async () => {
    setFehler(null);
    setErfolg(null);
    if (!email.trim() || !passwort.trim()) {
      setFehler("E-Mail und Passwort sind Pflichtfelder.");
      return;
    }
    setSpeichernLaeuft(true);
    const { data, error } = await supabase.functions.invoke("admin-create-proband", {
      body: { email: email.trim(), password: passwort, vorname: vorname.trim() || undefined },
    });
    setSpeichernLaeuft(false);
    if (error || data?.error) {
      setFehler(data?.error || error.message);
      return;
    }
    setErfolg(`Konto für ${email.trim()} angelegt. Notiere dir das Passwort — es wird hier nicht noch einmal angezeigt.`);
    setEmail("");
    setVorname("");
    setPasswort("");
    onCreated?.();
  };

  return (
    <Card style={{ marginBottom: 18 }}>
      <Label>Name (nur für dich sichtbar, z. B. "Vater")</Label>
      <TextInput value={vorname} onChange={setVorname} placeholder="Anzeigename" />
      <Label>E-Mail</Label>
      <TextInput value={email} onChange={setEmail} placeholder="name@beispiel.de" type="email" />
      <Label>Passwort</Label>
      <TextInput value={passwort} onChange={setPasswort} placeholder="Mindestens 6 Zeichen" type="password" />
      <div style={{ marginTop: 14 }}>
        <PrimaryButton onClick={anlegen} disabled={speichernLaeuft}>
          {speichernLaeuft ? "Lege an…" : "Zugang anlegen"}
        </PrimaryButton>
      </div>
      {fehler && <div style={{ fontSize: 12.5, color: danger, marginTop: 10 }}>{fehler}</div>}
      {erfolg && <div style={{ fontSize: 12.5, color: success, marginTop: 10 }}>{erfolg}</div>}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 10, lineHeight: 1.5 }}>
        Diese Person kann sich damit direkt auf ihrem eigenen Handy anmelden.
        Du kannst aber auch einfach "Verwalten" nutzen, ohne ihr das Passwort
        überhaupt mitzuteilen, und alles für sie einrichten.
      </div>
    </Card>
  );
}
