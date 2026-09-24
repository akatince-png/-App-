import React, { useEffect, useState } from "react";
import { Shell, TextArea, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import Profilbild from "../ui/Profilbild";
import { accentDark, accentSoft, cardBorder, danger, hexZuRgba, logoVerlauf, nachtSchatten, nachtVerlauf, textMain, textMuted } from "../ui/theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { levelAusPunkten } from "../utils/level";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import {
  WOCHENZIEL_PRO_PERSON,
  ligaHighlights,
  serieAusTagen,
  tageRuhig,
  teamLigaLaden,
  teamMitgliederLaden,
  teamNeuigkeitenLaden,
  zeitraumGrenzen,
} from "../data/teamStatistik";

// Team-Seite (24.09., Nutzerinnen-Freigabe der Vorschau): "Mein Team" mit
// gemeinsamem Wochenziel (Zusammenhalt statt Wettkampf gegeneinander),
// Mitgliedern mit Profilbild, Serie, Level, Wochenpunkten, "Motivieren" für
// Stille und Team-Neuigkeiten — plus "Team-Liga" (Teams im Vergleich, fair
// nach Ø Punkten pro Person, keine Einzel-Reihung). Sichtbar sind nur
// Punkte/Serie/Level, nie Medikamente oder Gesundheitsdaten; wer die
// Rangliste ausgeblendet hat, erscheint als "privat".
const GOLD = KATEGORIE_META.tageslicht;
const MEDAILLEN = ["🥇", "🥈", "🥉"];
const LIGA_FARBEN = ["#E8B90C", "#2D6FD6", "#1FA39A", "#8436C2", "#E0352B", "#F08A24", "#5B5BD6"];

const NEUIGKEIT_TEXT = {
  routine_morgen: "hat die Morgenroutine geschafft 🌅",
  routine_abend: "hat die Abendroutine geschafft 🌙",
  training: "hat trainiert 🏋️",
  tagesraetsel: "hat das Tagesrätsel gelöst 🧩",
};

function Reiter({ wert, setWert, optionen }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {optionen.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className="mp-tap"
          aria-pressed={wert === id}
          onClick={() => setWert(id)}
          style={{
            border: "none",
            borderRadius: 99,
            padding: "7px 13px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            background: wert === id ? accentDark : "#F1F2F6",
            color: wert === id ? "#fff" : textMain,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MotivierenFeld({ name, onSenden, onFertig }) {
  const [text, setText] = useState("");
  const [senden, setSenden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const absenden = async () => {
    setSenden(true);
    setFehler(null);
    const r = await onSenden(text);
    setSenden(false);
    if (!r?.ok) return setFehler(r?.error || "Senden fehlgeschlagen.");
    onFertig();
  };
  return (
    <div style={{ padding: "8px 0 4px" }}>
      <TextArea value={text} onChange={setText} placeholder={`Ein paar liebe Worte an ${name} …`} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
        {["Du packst das! 💛", "Denk an dich heute 🌱", "Wir sind für dich da 🤝"].map((v) => (
          <button key={v} type="button" onClick={() => setText(v)} style={{ border: `1px solid ${cardBorder}`, background: "#fff", borderRadius: 99, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {v}
          </button>
        ))}
      </div>
      <PrimaryButton onClick={absenden} disabled={senden || !text.trim()}>
        {senden ? "Wird gesendet …" : "Senden (mit Push)"}
      </PrimaryButton>
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}

function MeinTeam({ team, onMotivieren }) {
  const { user } = useAuth();
  const [mitglieder, setMitglieder] = useState(null);
  const [neuigkeiten, setNeuigkeiten] = useState([]);
  const [fehler, setFehler] = useState(null);
  const [motiviereId, setMotiviereId] = useState(null);
  const [gesendetAn, setGesendetAn] = useState([]);

  useEffect(() => {
    let ab = false;
    const { von, bis } = zeitraumGrenzen("woche");
    Promise.all([teamMitgliederLaden(von, bis), teamNeuigkeitenLaden(3)]).then(([m, n]) => {
      if (ab) return;
      if (!m.ok) return setFehler("Die Team-Daten konnten gerade nicht geladen werden.");
      setMitglieder(m.mitglieder.filter((x) => x.teamId === team.id));
      if (n.ok) setNeuigkeiten(n.neuigkeiten);
    });
    return () => {
      ab = true;
    };
  }, [team.id]);

  if (fehler) return <div style={{ fontSize: 13, color: textMuted }}>{fehler}</div>;
  if (!mitglieder) return <div style={{ fontSize: 13, color: textMuted }}>Lädt…</div>;

  const summe = mitglieder.reduce((s, m) => s + (m.punkteZeitraum || 0), 0);
  // Privat-Personen zählen nicht mit (ihre Punkte sind nicht sichtbar).
  const ziel = Math.max(1, mitglieder.filter((m) => !m.privat).length) * WOCHENZIEL_PRO_PERSON;
  const anteil = Math.min(1, summe / ziel);
  const rest = Math.max(0, ziel - summe);
  const sortiert = [...mitglieder].sort((a, b) => (b.punkteZeitraum ?? -1) - (a.punkteZeitraum ?? -1));

  return (
    <>
      <div style={{ borderRadius: 24, padding: 16, color: "#fff", background: nachtVerlauf, boxShadow: nachtSchatten, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {mitglieder.slice(0, 6).map((m, i) => (
            <div key={m.userId} style={{ marginLeft: i === 0 ? 0 : -10 }}>
              <Profilbild pfad={m.profilbildPfad} name={m.vorname} size={40} rand />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, opacity: 0.9 }}>Wochenziel als Team</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>
          {summe} <span style={{ fontSize: 15, opacity: 0.85 }}>/ {ziel} Punkte</span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginTop: 8 }}>
          <div style={{ width: `${Math.round(anteil * 100)}%`, height: "100%", borderRadius: 99, background: logoVerlauf, transition: "width 0.6s" }} />
        </div>
        <div style={{ fontSize: 12.5, marginTop: 8, opacity: 0.9 }}>
          {rest === 0 ? "Wochenziel geschafft – stark als Team! 🎉" : `Noch ${rest} Punkte – zusammen schafft ihr das bis Sonntag! 💪`}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Mitglieder diese Woche</div>
      <div style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "4px 12px", marginBottom: 18 }}>
        {sortiert.map((m, i) => {
          const ich = m.userId === user?.id;
          const ruhig = ich || m.privat ? null : tageRuhig(m.letzteAktivitaet);
          const still = ruhig === null ? !ich && !m.privat && !m.letzteAktivitaet : ruhig >= 2;
          const serie = serieAusTagen(m.aktiveTage);
          const level = m.punkteGesamt != null ? levelAusPunkten(m.punkteGesamt).level : null;
          return (
            <div key={m.userId} style={{ borderTop: i > 0 ? "1px solid #F0F1F5" : "none", padding: "9px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Profilbild pfad={m.profilbildPfad} name={m.vorname} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{ich ? "Du" : m.vorname || "—"}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>
                    {m.privat ? "🙈 privat" : still ? (ruhig === null ? "noch nicht aktiv" : `seit ${ruhig} Tagen ruhig`) : `🔥 ${serie} ${serie === 1 ? "Tag" : "Tage"} · Level ${level}`}
                  </div>
                </div>
                {!m.privat && still && !gesendetAn.includes(m.userId) ? (
                  <button
                    type="button"
                    className="mp-tap"
                    onClick={() => setMotiviereId((id) => (id === m.userId ? null : m.userId))}
                    style={{ border: "none", borderRadius: 12, padding: "8px 11px", fontSize: 12, fontWeight: 800, color: KATEGORIE_META.hydration.dot, background: KATEGORIE_META.hydration.bg, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    💬 Motivieren
                  </button>
                ) : gesendetAn.includes(m.userId) ? (
                  <span style={{ fontSize: 12, fontWeight: 800, color: textMuted }}>Gesendet 💛</span>
                ) : m.privat ? null : (
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: "4px 9px", borderRadius: 99, background: accentSoft, color: accentDark }}>{m.punkteZeitraum} P.</span>
                )}
              </div>
              {motiviereId === m.userId && (
                <MotivierenFeld
                  name={m.vorname || "deine Team-Kollegin"}
                  onSenden={(text) => onMotivieren(m.userId, text)}
                  onFertig={() => {
                    setMotiviereId(null);
                    setGesendetAn((g) => [...g, m.userId]);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {neuigkeiten.length > 0 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Was im Team passiert</div>
          {neuigkeiten.slice(0, 8).map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: "#F5F6FA", marginBottom: 6, fontSize: 13 }}>
              <Profilbild pfad={n.profilbildPfad} name={n.vorname} size={26} />
              <span>
                <b>{n.userId === user?.id ? "Du" : n.vorname}</b>{" "}
                {n.userId === user?.id ? (NEUIGKEIT_TEXT[n.art] || "war aktiv ✨").replace(/^hat /, "hast ").replace(/^war /, "warst ") : NEUIGKEIT_TEXT[n.art] || "war aktiv ✨"}
              </span>
            </div>
          ))}
        </>
      )}
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.45, marginTop: 12 }}>
        Sichtbar sind nur Punkte, Serie und Level – keine Medikamente, keine Gesundheitsdaten. Wer nicht verglichen werden will, kann das unter Mehr ausschalten und erscheint dann als „🙈 privat“.
      </div>
    </>
  );
}

function TeamLiga() {
  const [zeitraum, setZeitraum] = useState("woche");
  const [teams, setTeams] = useState(null);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    let ab = false;
    setTeams(null);
    const { von, bis } = zeitraumGrenzen(zeitraum);
    teamLigaLaden(von, bis).then((r) => {
      if (ab) return;
      if (!r.ok) return setFehler("Die Team-Liga konnte gerade nicht geladen werden.");
      setFehler(null);
      // Teams ohne Mitglieder (z. B. frisch angelegt) nicht in der Liga zeigen.
      setTeams(r.teams.filter((t) => t.mitglieder > 0));
    });
    return () => {
      ab = true;
    };
  }, [zeitraum]);

  const max = Math.max(1, ...(teams || []).map((t) => t.schnitt));
  const highlights = ligaHighlights(teams, zeitraum !== "gesamt");

  return (
    <>
      <Reiter
        wert={zeitraum}
        setWert={setZeitraum}
        optionen={[
          ["woche", "Woche"],
          ["monat", "Monat"],
          ["gesamt", "Gesamt"],
        ]}
      />
      {fehler && <div style={{ fontSize: 13, color: textMuted }}>{fehler}</div>}
      {!fehler && !teams && <div style={{ fontSize: 13, color: textMuted }}>Lädt…</div>}
      {teams && teams.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine Teams angelegt.</div>}
      {teams?.map((t, i) => {
        const farbe = LIGA_FARBEN[i % LIGA_FARBEN.length];
        const hervor = t.istMeinTeam || i === 0;
        return (
          <div
            key={t.teamId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 16,
              padding: "10px 12px",
              marginBottom: 8,
              border: `2px solid ${hervor ? (i === 0 ? GOLD.dot : farbe) : "#E3E6EE"}`,
              background: i === 0 ? GOLD.bg : t.istMeinTeam ? hexZuRgba(farbe, 0.1) : "#fff",
            }}
          >
            <span style={{ fontSize: MEDAILLEN[i] ? 22 : 15, width: 24, textAlign: "center", fontWeight: 800 }}>{MEDAILLEN[i] || i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>
                {t.name}{" "}
                {t.istMeinTeam && <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: farbe, color: "#fff" }}>euer Team</span>}
              </div>
              <div style={{ display: "flex", marginTop: 4 }}>
                {t.initialen.slice(0, 6).map((ini, j) => (
                  <span key={j} style={{ width: 22, height: 22, borderRadius: 99, marginLeft: j ? -6 : 0, background: LIGA_FARBEN[(j + i) % LIGA_FARBEN.length], color: "#fff", fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                    {ini.toUpperCase()}
                  </span>
                ))}
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#EEF0F5", overflow: "hidden", marginTop: 5 }}>
                <div style={{ width: `${Math.round((t.schnitt / max) * 100)}%`, height: "100%", borderRadius: 99, background: i === 0 ? GOLD.dot : farbe }} />
              </div>
            </div>
            <b style={{ fontSize: 15, whiteSpace: "nowrap" }}>{t.schnitt} Ø</b>
          </div>
        );
      })}
      {highlights.length > 0 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, margin: "16px 0 8px" }}>Highlights</div>
          {highlights.map((h) => (
            <div key={h.text} style={{ padding: "8px 10px", borderRadius: 12, background: "#F5F6FA", marginBottom: 6, fontSize: 13 }}>
              {h.icon} {h.text}: <b>{h.wert}</b>
            </div>
          ))}
        </>
      )}
      <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.45, marginTop: 12 }}>
        Gezählt wird der Durchschnitt pro Person – so haben kleine und große Teams dieselbe Chance. Einzelne Personen werden hier nicht gereiht. Jeden Montag beginnt eine neue Woche.
      </div>
    </>
  );
}

export default function TeamView({ onHome }) {
  const { team, teamNachrichtSenden } = useAppData();
  const [reiter, setReiter] = useState(team ? "team" : "liga");
  return (
    <Shell>
      <ViewHeader title={team ? `👥 ${team.name}` : "👥 Teams"} onHome={onHome} />
      <Reiter
        wert={reiter}
        setWert={setReiter}
        optionen={[
          ["team", "Mein Team"],
          ["liga", "🏆 Team-Liga"],
        ]}
      />
      {reiter === "team" ? (
        team ? (
          <MeinTeam team={team} onMotivieren={teamNachrichtSenden} />
        ) : (
          <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.5 }}>Du bist noch keinem Team zugeordnet. Dein Coach kann dich einem Team zuordnen – dann siehst du hier dein Team.</div>
        )
      ) : (
        <TeamLiga />
      )}
    </Shell>
  );
}
