import React, { useEffect, useMemo, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { Ring } from "../ui/TimerRing";
import { textMain, textMuted, cardBorder, danger } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { supabase } from "../lib/supabaseClient";
import { feuereBelohnung } from "../utils/belohnungBus";
import { toLocalISODate } from "../utils/dates";
import { timerHinweisLoeschen, timerHinweisPlanen } from "../data/nativeTimerHinweis";
import { DAUER_OPTIONEN, ERGEBNISSE, aktuelleRunde, gradeDabei, heuteErledigt, laeuft, meineOffene, naechsteRunde, restMinuten, sitzungEnde } from "../utils/fokusGemeinsam";

// Gemeinsam fokussieren / Body Doubling (27.09., Nutzerinnen-Wunsch nach dem
// Marktvergleich): Ziel setzen → 15/25/50 Min. still arbeiten, während man
// sieht, wer aus dem Team gerade auch dran ist → "Wie lief's?" und teilen.
// Ohne Kamera (Vorschlag C). Jede:r kann jederzeit starten; der Coach kann
// zusätzlich feste Runden planen. Punkte + Gehirn "Fokus & Planung".
// Auch per Aka startbar ("Ich will jetzt 25 Minuten an der Steuer sitzen").

const LILA = "#7C5CE0";
const LILA_HELL = "color-mix(in srgb, #F1EDFF var(--mp-flaeche), var(--mp-karte))";

const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? LILA : LILA_HELL,
  color: an ? "#fff" : LILA,
});

const uhr = (iso) =>
  new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
const terminText = (iso) =>
  new Date(iso).toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Kopf({ name, farbe = LILA, groesse = 34 }) {
  const buchstabe =
    String(name || "?")
      .trim()
      .charAt(0)
      .toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      style={{
        width: groesse,
        height: groesse,
        borderRadius: groesse / 2,
        background: farbe,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: groesse * 0.42,
        flexShrink: 0,
        border: "2px solid color-mix(in srgb, #fff var(--mp-flaeche), var(--mp-rand-dunkel))",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
      }}
    >
      {buchstabe}
    </span>
  );
}

const FARBEN = ["#7C5CE0", "#E4643F", "#1FA39A", "#D99A1E", "#5470E0", "#C2417A"];
const farbeFuer = (id) => FARBEN[[...String(id || "")].reduce((s, c) => s + c.charCodeAt(0), 0) % FARBEN.length];

// Wer ist gerade dabei? Köpfe + Ziele (nur geteilte Sitzungen, RLS).
function GradeDabei({ andere, nameVon, jetzt }) {
  if (!andere.length) {
    return <div style={{ fontSize: 13, color: textMuted }}>Gerade ist sonst niemand da. Fang ruhig an – wer dazukommt, sieht dich hier.</div>;
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {andere.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }} data-fokus-dabei>
          <Kopf name={nameVon(s.userId)} farbe={farbeFuer(s.userId)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: textMain }}>{nameVon(s.userId)}</div>
            <div
              style={{
                fontSize: 12,
                color: textMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.ziel || "fokussiert still"}
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: LILA }}>noch {restMinuten(s, jetzt)} Min.</span>
        </div>
      ))}
    </div>
  );
}

export default function FokusGemeinsamView({ onHome }) {
  const { userId, team, teamKollegen = [], fokusSitzungen = [], fokusRunden = [], fokusStarten, fokusAbschliessen, fokusNeuLaden, istAdminKonto } = useAppData();
  const { proband } = useAdmin();
  const [jetzt, setJetzt] = useState(() => Date.now());
  const [ziel, setZiel] = useState("");
  const [dauer, setDauer] = useState(25);
  const [teilen, setTeilen] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [fertigText, setFertigText] = useState(null);

  // Sekundentakt für den Ring, alle 30 Sek. neu laden (wer kommt dazu?).
  useEffect(() => {
    const t = setInterval(() => setJetzt(Date.now()), 1000);
    const l = setInterval(() => fokusNeuLaden?.(), 30000);
    return () => {
      clearInterval(t);
      clearInterval(l);
    };
  }, [fokusNeuLaden]);

  const nameVon = (id) => (id === userId ? "Du" : teamKollegen.find((k) => k.id === id)?.vorname || "Jemand aus dem Team");
  const meine = meineOffene(fokusSitzungen, userId, jetzt);
  const andere = gradeDabei(fokusSitzungen, userId, jetzt);
  const runde = aktuelleRunde(fokusRunden, jetzt);
  const naechste = runde ? null : naechsteRunde(fokusRunden, jetzt);
  const heute = toLocalISODate(new Date(jetzt));
  const geschafft = useMemo(() => heuteErledigt(fokusSitzungen, heute), [fokusSitzungen, heute]);

  const starten = async () => {
    setFehler(null);
    setFertigText(null);
    const rundeId = runde && jetzt >= new Date(runde.startUm).getTime() - 15 * 60000 ? runde.id : null;
    const r = await fokusStarten({
      ziel,
      dauerMinuten: rundeId ? runde.dauerMinuten : dauer,
      rundeId,
      teilen,
    });
    if (!r?.ok) return setFehler(r?.error || "Starten fehlgeschlagen.");
    timerHinweisPlanen({
      symbol: "🎯",
      name: r.sitzung.ziel || "Gemeinsam fokussieren",
      ende: sitzungEnde(r.sitzung),
    });
    setZiel("");
  };

  const abschliessen = async (ergebnis) => {
    if (!meine) return;
    // 1 Punkt je Tag (wie auf dem Server) – nur die erste Runde des Tages bringt ihn.
    const ersteHeute = !fokusSitzungen.some((x) => x.userId === userId && x.ergebnis && toLocalISODate(new Date(x.startUm)) === heute);
    const r = await fokusAbschliessen(meine.id, ergebnis);
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    timerHinweisLoeschen();
    const e = ERGEBNISSE.find((x) => x.key === ergebnis);
    feuereBelohnung({ text: `🎯 Fokus-Runde: ${e.label}`, icon: "target" });
    setFertigText({
      punkt: ersteHeute,
      text:
        ergebnis === "geschafft"
          ? "Stark! Das zählt für dein Gehirn (Fokus & Planung)."
          : ergebnis === "teilweise"
            ? "Ein Stück weiter ist weiter. Das zählt genauso."
            : "Auch okay. Du hast dich hingesetzt – das zählt. Morgen neuer Versuch.",
    });
  };

  const zeitUm = meine && jetzt >= sitzungEnde(meine);
  const aktiv = meine && laeuft(meine, jetzt) && !zeitUm;

  return (
    <Shell>
      <ViewHeader title="🎯 Gemeinsam fokussieren" onHome={onHome} />

      {!meine && (
        <div
          style={{
            fontSize: 13.5,
            color: textMuted,
            lineHeight: 1.5,
            margin: "-4px 2px 12px",
          }}
        >
          Wie in einer Bibliothek: Jede:r arbeitet an der eigenen Sache, aber nicht allein. Du siehst, wer gerade auch dran ist – ohne Kamera, ohne Reden.
        </div>
      )}

      {(runde || naechste) && !meine && (
        <Card
          style={{
            background: LILA_HELL,
            border: `2px solid ${LILA}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: LILA,
              letterSpacing: 0.3,
            }}
          >
            {runde ? "RUNDE MIT DEINEM COACH" : "NÄCHSTE RUNDE"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>
            {(runde || naechste).titel || "Gemeinsam fokussieren"} · {(runde || naechste).dauerMinuten} Min.
          </div>
          <div style={{ fontSize: 12.5, color: textMuted, marginTop: 2 }}>
            {runde ? (new Date(runde.startUm).getTime() > jetzt ? `startet um ${uhr(runde.startUm)} – du kannst schon rein` : "läuft gerade – steig einfach ein") : terminText(naechste.startUm)}
          </div>
        </Card>
      )}

      {aktiv && (
        <div data-fokus-laeuft>
          <Card style={{ textAlign: "center", marginBottom: 12 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: LILA,
                letterSpacing: 0.3,
              }}
            >
              DU FOKUSSIERST
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, margin: "4px 0 12px" }}>{meine.ziel || "Deine Sache"}</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Ring anteil={Math.max(0, (sitzungEnde(meine) - jetzt) / (meine.dauerMinuten * 60000))} groesse={150} dicke={12} farbe={LILA}>
                {(() => {
                  const rest = Math.max(0, Math.round((sitzungEnde(meine) - jetzt) / 1000));
                  return `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, "0")}`;
                })()}
              </Ring>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: textMuted,
                margin: "10px 0 12px",
              }}
            >
              Handy weglegen. Ich melde mich, wenn die Zeit um ist.
            </div>
            <button type="button" className="mp-tap" onClick={() => abschliessen("geschafft")} style={{ ...chip(false), padding: "8px 14px" }}>
              ✓ Schon fertig
            </button>
          </Card>
        </div>
      )}

      {zeitUm && !meine.ergebnis && (
        <div data-fokus-frage>
          <Card style={{ marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>⏰</div>
            <div style={{ fontSize: 16, fontWeight: 900, margin: "4px 0 2px" }}>Zeit um! Wie lief's?</div>
            <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 12 }}>{meine.ziel || "Deine Fokus-Runde"}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {ERGEBNISSE.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className="mp-tap"
                  onClick={() => abschliessen(e.key)}
                  style={{
                    ...chip(e.key === "geschafft"),
                    padding: "12px 14px",
                    fontSize: 14,
                  }}
                >
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {fertigText && !meine && (
        <div data-fokus-fertig>
          <Card
            style={{
              marginBottom: 12,
              background: "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-karte))",
              border: "2px solid #2E9C86",
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 900, color: "color-mix(in srgb, #1E6E57 var(--mp-schrift), var(--mp-schrift-hell))" }}>
              {fertigText.punkt ? "+1 Punkt · " : ""}
              {fertigText.text}
            </div>
          </Card>
        </div>
      )}

      {!meine && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>Woran arbeitest du?</div>
          <TextInput value={ziel} onChange={setZiel} placeholder="z. B. Steuerunterlagen sortieren" diktierbar />
          <div style={{ fontSize: 12, color: textMuted, margin: "6px 2px 10px" }}>Ein kleiner, klarer Schritt reicht. Leer lassen geht auch.</div>
          {!runde && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {DAUER_OPTIONEN.map((d) => (
                <button key={d} type="button" aria-pressed={dauer === d} style={chip(dauer === d)} onClick={() => setDauer(d)}>
                  {d} Min.
                </button>
              ))}
            </div>
          )}
          {team && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                marginBottom: 12,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={teilen} onChange={(e) => setTeilen(e.target.checked)} />
              Mein Team sieht mich und mein Ziel
            </label>
          )}
          <PrimaryButton
            onClick={starten}
            style={{
              background: `linear-gradient(135deg, ${LILA}, #9C83F0)`,
              boxShadow: "0 8px 20px rgba(124,92,224,0.32)",
            }}
          >
            ▶ {runde ? `Mit in die Runde (${runde.dauerMinuten} Min.)` : `Los geht's (${dauer} Min.)`}
          </PrimaryButton>
          {fehler && <div style={{ color: danger, fontSize: 13, marginTop: 8 }}>{fehler}</div>}
        </Card>
      )}

      {team && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>👥 Gerade dabei {andere.length > 0 && <span style={{ color: LILA }}>({andere.length})</span>}</div>
          <GradeDabei andere={andere} nameVon={nameVon} jetzt={jetzt} />
        </Card>
      )}

      {team && geschafft.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>🌟 Heute im Team geschafft</div>
          {geschafft.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                fontSize: 13,
              }}
            >
              <Kopf name={nameVon(s.userId)} farbe={farbeFuer(s.userId)} groesse={26} />
              <span style={{ flex: 1 }}>
                <b>{nameVon(s.userId)}</b> · {s.ziel || `${s.dauerMinuten} Min. Fokus`}
              </span>
              <span aria-label={ERGEBNISSE.find((e) => e.key === s.ergebnis)?.label}>{ERGEBNISSE.find((e) => e.key === s.ergebnis)?.emoji}</span>
            </div>
          ))}
        </Card>
      )}

      {istAdminKonto && proband === null && <RundenPlaner />}
    </Shell>
  );
}

// Coach: feste Runden planen (Team oder alle, Termin, Dauer, optional Titel).
// Die Coachees bekommen eine Einladung per Push; wer mitmacht, steht darunter.
function RundenPlaner() {
  const { fokusRunden = [], fokusSitzungen = [], fokusRundePlanen, fokusRundeLoeschen } = useAppData();
  const [teams, setTeams] = useState([]);
  const [f, setF] = useState({
    teamId: "",
    titel: "",
    dauerMinuten: 25,
    start: "",
  });
  const [meldung, setMeldung] = useState(null);
  useEffect(() => {
    supabase
      .from("teams")
      .select("id, name")
      .order("name")
      .then(({ data }) => setTeams(data || []));
  }, []);
  const teamName = (id) => (id ? teams.find((t) => t.id === id)?.name || "Team" : "Alle");
  const planen = async () => {
    setMeldung(null);
    if (!f.start) return setMeldung({ fehler: true, text: "Bitte einen Termin wählen." });
    const r = await fokusRundePlanen({
      teamId: f.teamId || null,
      titel: f.titel,
      dauerMinuten: f.dauerMinuten,
      startUm: new Date(f.start).toISOString(),
    });
    if (!r?.ok)
      return setMeldung({
        fehler: true,
        text: r?.error || "Speichern fehlgeschlagen.",
      });
    setMeldung({
      text: "✓ Geplant – alle Eingeladenen bekommen eine Nachricht.",
    });
    setF((x) => ({ ...x, titel: "", start: "" }));
  };
  return (
    <Card style={{ marginTop: 6 }}>
      <div style={{ fontSize: 15, fontWeight: 900 }}>🗓️ Fokus-Runde planen (Coach)</div>
      <div style={{ fontSize: 12, color: textMuted, margin: "2px 0 8px" }}>Termin und Dauer wählen – den Rest macht die App.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" aria-pressed={!f.teamId} style={chip(!f.teamId)} onClick={() => setF((x) => ({ ...x, teamId: "" }))}>
          Alle
        </button>
        {teams.map((t) => (
          <button key={t.id} type="button" aria-pressed={f.teamId === t.id} style={chip(f.teamId === t.id)} onClick={() => setF((x) => ({ ...x, teamId: t.id }))}>
            {t.name}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <input
          type="datetime-local"
          aria-label="Termin"
          value={f.start}
          onChange={(e) => setF((x) => ({ ...x, start: e.target.value }))}
          style={{
            border: `1.5px solid ${cardBorder}`,
            borderRadius: 99,
            padding: "6px 10px",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
        {[25, 50].map((d) => (
          <button key={d} type="button" aria-pressed={f.dauerMinuten === d} style={chip(f.dauerMinuten === d)} onClick={() => setF((x) => ({ ...x, dauerMinuten: d }))}>
            {d} Min.
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <TextInput value={f.titel} onChange={(v) => setF((x) => ({ ...x, titel: v }))} placeholder="Titel (optional), z. B. Papierkram-Stunde" />
      </div>
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={planen}>Runde planen</PrimaryButton>
      </div>
      {meldung && (
        <div
          role="status"
          style={{
            fontSize: 13,
            fontWeight: 700,
            marginTop: 8,
            color: meldung.fehler ? danger : "#1E8E5A",
          }}
        >
          {meldung.text}
        </div>
      )}
      {fokusRunden.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {fokusRunden.map((r) => {
            const dabei = fokusSitzungen.filter((s) => s.rundeId === r.id);
            const gut = dabei.filter((s) => s.ergebnis === "geschafft" || s.ergebnis === "teilweise").length;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  padding: "7px 0",
                  borderBottom: `1px solid ${cardBorder}`,
                }}
              >
                <span style={{ flex: 1 }}>
                  <b>{teamName(r.teamId)}</b> · {terminText(r.startUm)} · {r.dauerMinuten} Min.{r.titel ? ` · ${r.titel}` : ""}
                  <br />
                  <span style={{ color: textMuted }}>
                    {dabei.length} dabei
                    {dabei.length ? ` · ${gut} vorangekommen` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Runde löschen"
                  onClick={() => fokusRundeLoeschen(r.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: danger,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
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
