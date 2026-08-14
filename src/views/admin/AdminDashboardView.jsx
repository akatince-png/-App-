import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Label, Pill } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { accentDark, accentSoft, cardBorder, danger, success, successSoft, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

// Bereiche, in denen KiChat.jsx tatsächlich mit bereich="..." aufgerufen
// wird (siehe grep über src/views) — muss exakt übereinstimmen, sonst
// landet ein Hinweis nie im richtigen Chat. "Allgemein" (bereich: null)
// gilt bereichsübergreifend, inkl. des Home-Assistenten.
const BEREICH_OPTIONEN = [
  { value: "", label: "Allgemein" },
  { value: "training", label: "Training" },
  { value: "ernaehrung", label: "Ernährung" },
  { value: "hydration", label: "Hydration" },
  { value: "tageslicht", label: "Tageslicht" },
  { value: "schlaf", label: "Schlaf" },
  { value: "supplemente", label: "Supplemente" },
  { value: "medikamente", label: "Medikamente" },
  { value: "gewohnheiten", label: "Gewohnheiten" },
  { value: "morgenroutine", label: "Morgenroutine" },
  { value: "abendroutine", label: "Abendroutine" },
];

// Admin-Dashboard: Übersicht aller Probandinnen/Probanden + Möglichkeit,
// stellvertretend für jemanden die App zu bedienen ("Verwalten"-Knopf →
// AdminContext.verwalteAls) — z. B. für Personen, die (noch) nicht
// selbstständig mit der KI ihren Plan erstellen können. Sobald "Verwalten"
// gedrückt wird, läuft die komplette App unverändert weiter, nur mit den
// Daten der ausgewählten Person statt der eigenen (siehe AppDataContext.jsx).
export default function AdminDashboardView({ onHome, onVerwalteAls, onOpenWissen, onOpenFormulare, onOpenUebungsBilder }) {
  const { user } = useAuth();
  const [probanden, setProbanden] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [formOffen, setFormOffen] = useState(false);
  const [notizFuer, setNotizFuer] = useState(null); // proband.id | null
  const [nachrichtenFuer, setNachrichtenFuer] = useState(null); // proband.id | null

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

      {onOpenWissen && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton variant="ghost" onClick={onOpenWissen}>
            📚 Wissens-Basis verwalten
          </PrimaryButton>
        </div>
      )}

      {onOpenFormulare && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton variant="ghost" onClick={onOpenFormulare}>
            📋 Coaching-Vorlagen
          </PrimaryButton>
        </div>
      )}

      {onOpenUebungsBilder && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton variant="ghost" onClick={onOpenUebungsBilder}>
            🖼️ Übungsbilder verwalten
          </PrimaryButton>
        </div>
      )}

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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => onVerwalteAls({ id: p.id, email: p.email, vorname: p.vorname })}
                className="mp-tap"
                style={{ padding: "11px 16px", borderRadius: 12, border: "none", background: accentDark, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Verwalten
              </button>
              <button
                onClick={() => setNotizFuer((v) => (v === p.id ? null : p.id))}
                className="mp-tap"
                style={{ padding: "9px 16px", borderRadius: 12, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                {notizFuer === p.id ? "Schließen" : "Hinweis"}
              </button>
              <button
                onClick={() => setNachrichtenFuer((v) => (v === p.id ? null : p.id))}
                className="mp-tap"
                style={{ padding: "9px 16px", borderRadius: 12, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                {nachrichtenFuer === p.id ? "Schließen" : "Nachrichten"}
              </button>
            </div>
          </div>
          {notizFuer === p.id && <AdminNotizPanel proband={p} adminId={user?.id} />}
          {nachrichtenFuer === p.id && <CoacheeNachrichtenPanel proband={p} />}
        </Card>
      ))}
    </Shell>
  );
}

// Hinweise/Nachrichten für EINE Person hinterlassen, ohne "Verwalten"
// nutzen zu müssen — z. B. schnell zwischendurch "beim nächsten Training
// die Übung genauer erklären" notieren. Läuft über den Assistenten, siehe
// 0036_admin_notizen.sql + useCoachVerlauf.js/KiChat.jsx: die Person
// bekommt es nie als separate "Nachricht vom Admin" zu sehen.
function AdminNotizPanel({ proband, adminId }) {
  const [notizen, setNotizen] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [bereich, setBereich] = useState("");
  const [modus, setModus] = useState("nachricht");
  const [text, setText] = useState("");
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const laden = async () => {
    setLadend(true);
    const { data, error } = await supabase
      .from("admin_notizen")
      .select("id, bereich, modus, text, status, erstellt_am")
      .eq("user_id", proband.id)
      .order("erstellt_am", { ascending: false });
    if (!error) setNotizen(data || []);
    setLadend(false);
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proband.id]);

  const absenden = async () => {
    setFehler(null);
    if (!text.trim()) {
      setFehler("Bitte einen Text eingeben.");
      return;
    }
    setSpeichernLaeuft(true);
    const { error } = await supabase
      .from("admin_notizen")
      .insert({ user_id: proband.id, admin_id: adminId, bereich: bereich || null, modus, text: text.trim() });
    setSpeichernLaeuft(false);
    if (error) {
      setFehler(error.message);
      return;
    }
    setText("");
    laden();
  };

  const loeschen = async (id) => {
    await supabase.from("admin_notizen").delete().eq("id", id);
    setNotizen((prev) => prev.filter((n) => n.id !== id));
  };

  const bereichLabel = (value) => BEREICH_OPTIONEN.find((b) => b.value === (value || ""))?.label || value;

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
      <Label>Bereich</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {BEREICH_OPTIONEN.map((b) => (
          <Pill key={b.value} label={b.label} selected={bereich === b.value} onClick={() => setBereich(b.value)} />
        ))}
      </div>

      <Label>Art</Label>
      <div style={{ display: "flex" }}>
        <Pill label="Direkte Nachricht" selected={modus === "nachricht"} onClick={() => setModus("nachricht")} />
        <Pill label="Hintergrund-Hinweis" selected={modus === "kontext"} onClick={() => setModus("kontext")} />
      </div>
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: -6, marginBottom: 12, lineHeight: 1.5 }}>
        {modus === "nachricht"
          ? "Wird als nächste Nachricht vom Assistenten zugestellt, sobald die Person den Chat im gewählten Bereich das nächste Mal öffnet."
          : "Der Assistent bekommt es als Hintergrundwissen und baut es von sich aus ins Gespräch ein, sobald es passt — bleibt aktiv, bis du es hier löschst."}
      </div>

      <TextArea value={text} onChange={setText} placeholder='z. B. "Beim nächsten Mal die Kniebeuge-Technik genauer erklären."' />

      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={absenden} disabled={speichernLaeuft}>
          {speichernLaeuft ? "Speichert…" : "Hinterlassen"}
        </PrimaryButton>
      </div>
      {fehler && <div style={{ fontSize: 12.5, color: danger, marginTop: 8 }}>{fehler}</div>}

      {!ladend && notizen.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Label>Bisherige Hinweise</Label>
          {notizen.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 0",
                borderBottom: `1px solid ${cardBorder}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 3 }}>
                  {bereichLabel(n.bereich)} · {n.modus === "nachricht" ? "Nachricht" : "Hintergrund"} ·{" "}
                  {n.status === "zugestellt" ? "zugestellt" : "offen"}
                </div>
                <div style={{ fontSize: 13 }}>{n.text}</div>
              </div>
              <button
                onClick={() => loeschen(n.id)}
                className="mp-tap"
                style={{ flexShrink: 0, border: "none", background: "transparent", color: danger, fontSize: 12, cursor: "pointer", padding: "4px 6px" }}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Eingehende Nachrichten EINER Person lesen (13.08., Coach-verwaltetes
// Modell) — Gegenstück zu AdminNotizPanel: läuft in der anderen Richtung
// (Coachee an Admin, siehe 0045_coachee_modell.sql/useCoacheeNachrichten.js)
// und OHNE den Umweg über den KI-Assistenten, weil der für Coachees
// ausgeblendet ist (siehe KiChat.jsx).
function CoacheeNachrichtenPanel({ proband }) {
  const [nachrichten, setNachrichten] = useState([]);
  const [ladend, setLadend] = useState(true);

  const laden = async () => {
    setLadend(true);
    const { data, error } = await supabase
      .from("coachee_nachrichten")
      .select("id, text, gelesen, erstellt_am")
      .eq("user_id", proband.id)
      .order("erstellt_am", { ascending: false });
    if (!error) setNachrichten(data || []);
    setLadend(false);
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proband.id]);

  const alsGelesenMarkieren = async (id) => {
    setNachrichten((prev) => prev.map((n) => (n.id === id ? { ...n, gelesen: true } : n)));
    const { error } = await supabase.from("coachee_nachrichten").update({ gelesen: true }).eq("id", id);
    if (error) console.error(error);
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
      {ladend && <div style={{ fontSize: 13, color: textMuted }}>Lädt…</div>}
      {!ladend && nachrichten.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Nachrichten.</div>}
      {nachrichten.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 0",
            borderBottom: `1px solid ${cardBorder}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 3 }}>
              {new Date(n.erstellt_am).toLocaleString("de-DE")} · {n.gelesen ? "gelesen" : "neu"}
            </div>
            <div style={{ fontSize: 13, fontWeight: n.gelesen ? 400 : 700 }}>{n.text}</div>
          </div>
          {!n.gelesen && (
            <button
              onClick={() => alsGelesenMarkieren(n.id)}
              className="mp-tap"
              style={{ flexShrink: 0, border: "none", background: "transparent", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 6px" }}
            >
              Gelesen
            </button>
          )}
        </div>
      ))}
    </div>
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
