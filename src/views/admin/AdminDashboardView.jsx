import React, { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, TextArea, Label, Pill } from "../../ui/primitives";
import ViewHeader from "../../ui/ViewHeader";
import { accentDark, accentSoft, cardBorder, danger, success, successSoft, textMain, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { coachNachrichtSenden } from "../../data/useCoacheeNachrichten";

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
export default function AdminDashboardView({ onHome, onVerwalteAls, onOpenWissen, onOpenFormulare, onOpenUebungsBilder, onOpenUebersicht, onOpenQuests, onOpenTeams }) {
  const { user } = useAuth();
  const [probanden, setProbanden] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [suche, setSuche] = useState("");
  const [formOffen, setFormOffen] = useState(false);
  const [einladenOffen, setEinladenOffen] = useState(false);
  const [notizFuer, setNotizFuer] = useState(null); // proband.id | null
  const [nachrichtenFuer, setNachrichtenFuer] = useState(null); // proband.id | null
  const [testAnlegenLaeuft, setTestAnlegenLaeuft] = useState(false);
  const [testFehler, setTestFehler] = useState(null);
  const [testKonto, setTestKonto] = useState(null); // { vorname, email, passwort } | null
  const [testKopiert, setTestKopiert] = useState(false);

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

  // Testphase ohne echte Coachees (Nutzerinnen-Vorgabe 16.08.: "damit ich
  // in Profile reingehen kann, Protokolle erstellen kann ... ohne dass im
  // Hintergrund eine KI regelmäßig Einträge macht") — legt mit einem Klick
  // ein Wegwerf-Konto an (zufällige E-Mail/Passwort). Zugangsdaten werden
  // bewusst angezeigt (anders als im normalen Formular unten, das sie
  // versteckt) — Nutzerinnen-Vorgabe: sie will sich damit auch SEPARAT
  // (nicht über "Verwalten", das bleibt technisch im Admin-Modus) als
  // echte Nicht-Admin-Person einloggen können, z. B. in einem privaten
  // Browser-Tab. Löschen aktuell nur direkt in Supabase (auth.users)
  // möglich — bewusst kein Lösch-Knopf hier, das wäre eine unumkehrbare
  // Aktion samt Kaskaden-Löschung aller Daten dieser Person.
  const testCoacheeErstellen = async () => {
    setTestFehler(null);
    setTestKonto(null);
    setTestAnlegenLaeuft(true);
    const bisherigeTests = probanden.filter((p) => (p.vorname || "").startsWith("Test ")).length;
    const vorname = `Test ${bisherigeTests + 1}`;
    const zufall = Math.random().toString(36).slice(2, 10);
    const email = `test-${zufall}@aka-test.local`;
    const passwort = Math.random().toString(36).slice(2, 12);
    const { data, error } = await supabase.functions.invoke("admin-create-proband", {
      body: { email, password: passwort, vorname },
    });
    setTestAnlegenLaeuft(false);
    if (error || data?.error) {
      setTestFehler(data?.error || error.message);
      return;
    }
    setTestKonto({ vorname, email, passwort });
    ladeProbanden();
  };

  const testZugangsdatenKopieren = async () => {
    if (!testKonto) return;
    await navigator.clipboard.writeText(`${testKonto.email} / ${testKonto.passwort}`);
    setTestKopiert(true);
    setTimeout(() => setTestKopiert(false), 2000);
  };

  // Onboarding-Umfang nachträglich pro Coachee umstellen (Nutzerinnen-
  // Vorgabe 16.08.: "verschiedene Coaching-Modelle anbieten") — wirkt sich
  // nur aus, solange die Person ihr eigenes Onboarding noch nicht
  // abgeschlossen hat (siehe OnboardingFlow.jsx), deshalb nur dort
  // anzeigen/umschaltbar.
  const onboardingModusUmschalten = async (userId, aktuellerModus) => {
    const naechsterModus = aktuellerModus === "lang" ? "kurz" : "lang";
    setProbanden((prev) => prev.map((p) => (p.id === userId ? { ...p, onboarding_modus: naechsterModus } : p)));
    const { error } = await supabase.from("profiles").update({ onboarding_modus: naechsterModus }).eq("id", userId);
    if (error) setFehler(error.message);
  };

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

      {onOpenUebersicht && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton onClick={onOpenUebersicht}>📊 Coach-Übersicht (alle Coachees grafisch)</PrimaryButton>
        </div>
      )}

      {onOpenQuests && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton variant="ghost" onClick={onOpenQuests}>
            🎯 Quests verwalten
          </PrimaryButton>
        </div>
      )}

      {onOpenTeams && (
        <div style={{ marginBottom: 14 }}>
          <PrimaryButton variant="ghost" onClick={onOpenTeams}>
            👥 Teams verwalten
          </PrimaryButton>
        </div>
      )}

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

      <div style={{ marginTop: 14, marginBottom: 8, display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={() => setFormOffen((v) => !v)}>
            {formOffen ? "Abbrechen" : "+ Neuen Zugang anlegen"}
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={testCoacheeErstellen} disabled={testAnlegenLaeuft}>
            {testAnlegenLaeuft ? "Lege an …" : "🧪 Test-Coachee erstellen"}
          </PrimaryButton>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <PrimaryButton variant="ghost" onClick={() => setEinladenOffen((v) => !v)}>
          {einladenOffen ? "Abbrechen" : "✉️ Coachee einladen"}
        </PrimaryButton>
      </div>
      {einladenOffen && (
        <EinladenForm
          onCreated={() => {
            setEinladenOffen(false);
            ladeProbanden();
          }}
        />
      )}
      {testFehler && <div style={{ fontSize: 12.5, color: danger, marginBottom: 14 }}>{testFehler}</div>}
      {testKonto && (
        <Card style={{ marginBottom: 14, background: successSoft }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>"{testKonto.vorname}" angelegt</div>
          <div style={{ fontSize: 12.5, fontFamily: "monospace", marginBottom: 2 }}>{testKonto.email}</div>
          <div style={{ fontSize: 12.5, fontFamily: "monospace" }}>{testKonto.passwort}</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8, lineHeight: 1.5 }}>
            Damit kannst du dich in einem privaten/anderen Browser-Tab separat einloggen und die App als echte
            Nicht-Admin-Person nutzen — anders als bei "Verwalten", das bleibt technisch im Admin-Modus.
          </div>
          <div style={{ marginTop: 10 }}>
            <PrimaryButton variant="ghost" onClick={testZugangsdatenKopieren}>
              {testKopiert ? "Kopiert ✓" : "E-Mail + Passwort kopieren"}
            </PrimaryButton>
          </div>
        </Card>
      )}

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

      <div className="mp-admin-probanden-grid">
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
                {!p.is_admin && !p.onboarding_complete && (
                  <button
                    onClick={() => onboardingModusUmschalten(p.id, p.onboarding_modus)}
                    title="Steuert, ob diese Person beim eigenen Einloggen nur den kurzen Steckbrief oder die volle Kategorie-Einrichtung durchläuft"
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 10,
                      border: `1px solid ${cardBorder}`,
                      background: "#fff",
                      color: textMuted,
                      cursor: "pointer",
                    }}
                  >
                    Onboarding: {p.onboarding_modus === "lang" ? "Lang" : "Kurz"}
                  </button>
                )}
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
                style={{ position: "relative", padding: "9px 16px", borderRadius: 12, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                {nachrichtenFuer === p.id ? "Schließen" : "Nachrichten"}
                {p.ungelesene_nachrichten > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      background: danger,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {p.ungelesene_nachrichten}
                  </span>
                )}
              </button>
            </div>
          </div>
          {notizFuer === p.id && <AdminNotizPanel proband={p} adminId={user?.id} />}
          {nachrichtenFuer === p.id && <CoacheeNachrichtenPanel proband={p} />}
        </Card>
      ))}
      </div>
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

// Nachrichten EINER Person lesen UND senden (13.08., erweitert 15.08. um
// die Senden-Richtung) — läuft in beide Richtungen über coachee_nachrichten
// (0045/0065), OHNE den Umweg über den KI-Assistenten (der für Coachees
// ausgeblendet ist, siehe KiChat.jsx) — die Coachee sieht Coach-Nachrichten
// stattdessen direkt auf ihrer Startseite (HomeView.jsx, NachrichtAnCoachCard).
export function CoacheeNachrichtenPanel({ proband }) {
  const [nachrichten, setNachrichten] = useState([]);
  const [ladend, setLadend] = useState(true);
  const [text, setText] = useState("");
  const [sendenLaeuft, setSendenLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const laden = async () => {
    setLadend(true);
    const { data, error } = await supabase
      .from("coachee_nachrichten")
      .select("id, text, gelesen, erstellt_am, absender")
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

  const senden = async () => {
    setFehler(null);
    setSendenLaeuft(true);
    const result = await coachNachrichtSenden(proband.id, text);
    setSendenLaeuft(false);
    if (!result?.ok) {
      setFehler(result?.error || "Senden fehlgeschlagen.");
      return;
    }
    setText("");
    laden();
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
      <TextArea value={text} onChange={setText} placeholder={`Nachricht an ${proband.vorname || proband.email} …`} />
      <div style={{ marginTop: 8 }}>
        <PrimaryButton onClick={senden} disabled={sendenLaeuft || !text.trim()}>
          {sendenLaeuft ? "Sendet…" : "Senden"}
        </PrimaryButton>
      </div>
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 6 }}>
        Kommt direkt auf ihrer Startseite an, kein Umweg über den Chat.
      </div>

      <div style={{ marginTop: 14 }}>
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
                {n.absender === "coach" ? "Du" : proband.vorname || "Coachee"} · {new Date(n.erstellt_am).toLocaleString("de-DE")}
                {n.absender !== "coach" && ` · ${n.gelesen ? "gelesen" : "neu"}`}
              </div>
              <div style={{ fontSize: 13, fontWeight: n.absender !== "coach" && !n.gelesen ? 700 : 400 }}>{n.text}</div>
            </div>
            {n.absender !== "coach" && !n.gelesen && (
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
    </div>
  );
}

// Onboarding-Umfang-Auswahl, gemeinsam genutzt von NeuerZugangForm und
// EinladenForm — Nutzerinnen-Vorgabe 16.08.: "verschiedene Coaching-
// Modelle anbieten ... manche werden mehr selbst geführt, manche komplett
// von mir geleitet". "Kurz" (Standard) = nur Profil/Ziel/Steckbrief, "Lang"
// = die volle Kategorie-Einrichtung, die sonst nur die Admin im
// "Verwalten"-Modus sieht. Wirkt sich nur aus, wenn die Person das eigene
// Onboarding tatsächlich selbst durchläuft (siehe OnboardingFlow.jsx) —
// richtet die Admin per "Verwalten" alles vorher selbst ein, greift das
// hier gewählte Onboarding nie.
function OnboardingModusWahl({ modus, onChange }) {
  return (
    <div style={{ marginTop: 4 }}>
      <Label>Onboarding für diese Person</Label>
      <div style={{ display: "flex", gap: 8 }}>
        <Pill label="Kurz (nur Steckbrief)" selected={modus === "kurz"} onClick={() => onChange("kurz")} />
        <Pill label="Lang (volle Einrichtung)" selected={modus === "lang"} onClick={() => onChange("lang")} />
      </div>
    </div>
  );
}

function NeuerZugangForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [vorname, setVorname] = useState("");
  const [passwort, setPasswort] = useState("");
  const [onboardingModus, setOnboardingModus] = useState("kurz");
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
    if (error || data?.error) {
      setSpeichernLaeuft(false);
      setFehler(data?.error || error.message);
      return;
    }
    if (onboardingModus === "lang") {
      await supabase.from("profiles").update({ onboarding_modus: "lang" }).eq("id", data.id);
    }
    setSpeichernLaeuft(false);
    setErfolg(`Konto für ${email.trim()} angelegt. Notiere dir das Passwort — es wird hier nicht noch einmal angezeigt.`);
    setEmail("");
    setVorname("");
    setPasswort("");
    setOnboardingModus("kurz");
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
      <OnboardingModusWahl modus={onboardingModus} onChange={setOnboardingModus} />
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

// Einladung per E-Mail statt direkt gesetztem Passwort (Nutzerinnen-Vorgabe
// 16.08.: "dass ich jemandem einen Link schicke ... er nur darüber
// reinkommt oder eingeladen werden muss") — die Person setzt sich beim
// Anklicken des Links selbst ein Passwort (siehe InviteAcceptView.jsx),
// nie über dich.
function EinladenForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [vorname, setVorname] = useState("");
  const [onboardingModus, setOnboardingModus] = useState("kurz");
  const [speichernLaeuft, setSpeichernLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);

  const einladen = async () => {
    setFehler(null);
    setErfolg(null);
    if (!email.trim()) {
      setFehler("E-Mail ist ein Pflichtfeld.");
      return;
    }
    setSpeichernLaeuft(true);
    const { data, error } = await supabase.functions.invoke("admin-invite-proband", {
      body: { email: email.trim(), vorname: vorname.trim() || undefined, onboardingModus },
    });
    setSpeichernLaeuft(false);
    if (error || data?.error) {
      setFehler(data?.error || error.message);
      return;
    }
    setErfolg(`Einladung an ${email.trim()} verschickt.`);
    setEmail("");
    setVorname("");
    setOnboardingModus("kurz");
    onCreated?.();
  };

  return (
    <Card style={{ marginBottom: 18 }}>
      <Label>Name (nur für dich sichtbar)</Label>
      <TextInput value={vorname} onChange={setVorname} placeholder="Anzeigename" />
      <Label>E-Mail der Person</Label>
      <TextInput value={email} onChange={setEmail} placeholder="name@beispiel.de" type="email" />
      <OnboardingModusWahl modus={onboardingModus} onChange={setOnboardingModus} />
      <div style={{ marginTop: 14 }}>
        <PrimaryButton onClick={einladen} disabled={speichernLaeuft}>
          {speichernLaeuft ? "Sende Einladung…" : "Einladung senden"}
        </PrimaryButton>
      </div>
      {fehler && <div style={{ fontSize: 12.5, color: danger, marginTop: 10 }}>{fehler}</div>}
      {erfolg && <div style={{ fontSize: 12.5, color: success, marginTop: 10 }}>{erfolg}</div>}
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 10, lineHeight: 1.5 }}>
        Die Person bekommt eine E-Mail mit einem Link, legt sich beim ersten Klick selbst ein Passwort fest und
        landet danach je nach Auswahl oben im kurzen oder langen Onboarding.
      </div>
    </Card>
  );
}
