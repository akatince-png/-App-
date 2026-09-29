import React, { useEffect, useState } from "react";
import { cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { archivLaden, einverstaendnisLaden, nachweisBehalten, nachweisDownloadUrl, nachweisEntscheiden, nachweisUrl, nachweiseLaden } from "../../data/videoNachweise";
import { ARCHIV_TEXT, ART_TEXT, LOESCH_TAGE, downloadName, restTage } from "../../utils/videoNachweis";

// Video-Nachweise in der Coach-Übersicht (27.09.): nur der Coach entscheidet.
// - ✓ Bestätigen: Video wird gelöscht, Eintrag bleibt.
// - 🗄️ Ins Archiv: nur mit Einverständnis der Person – bleibt für Fortschritt
//   und ein späteres Dankeschön-Video.
// - 📌 Zum Besprechen: bleibt liegen (ohne Einverständnis höchstens 7 Tage).
// - ⬇️ Herunterladen geht immer.

const knopf = (farbe, hell) => ({
  border: "none",
  borderRadius: 10,
  padding: "8px 11px",
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: hell ? "color-mix(in srgb, #EEF0F5 var(--mp-flaeche), var(--mp-karte))" : farbe,
  color: hell ? textMain : "#fff",
});

const datumZeit = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Ein Video mit Ansehen + Herunterladen + Aktionen.
function VideoZeile({ n, name, kopf, aktionen, fehlerSetzen }) {
  const [url, setUrl] = useState(null);
  const ansehen = async () => {
    const u = await nachweisUrl(n.pfad);
    if (!u) fehlerSetzen("Video ließ sich nicht laden.");
    else setUrl(u);
  };
  const herunterladen = async () => {
    const u = await nachweisDownloadUrl(n.pfad, downloadName(n, name));
    if (!u) return fehlerSetzen("Download ließ sich nicht starten.");
    const a = document.createElement("a");
    a.href = u;
    a.download = downloadName(n, name);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <div style={{ borderTop: "1px solid color-mix(in srgb, #F0F1F5 var(--mp-flaeche), var(--mp-rand-dunkel))", marginTop: 8, paddingTop: 8 }} data-video-zeile>
      {kopf}
      <div style={{ fontSize: 12.5, color: textMain }}>{n.titel}</div>
      <div style={{ fontSize: 11.5, color: textMuted }}>
        {datumZeit(n.created_at)}
        {n.dauer_sek ? ` · ${n.dauer_sek} Sek.` : ""}
      </div>
      {url && <video src={url} controls playsInline style={{ width: "100%", maxHeight: 320, borderRadius: 12, background: "#000", marginTop: 6 }} />}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {!url && (
          <button type="button" style={knopf("#2D6FD6")} onClick={ansehen}>
            ▶ Ansehen
          </button>
        )}
        <button type="button" style={knopf(null, true)} onClick={herunterladen}>
          ⬇️ Herunterladen
        </button>
        {aktionen}
      </div>
    </div>
  );
}

export default function NachweiseCoach({ namen }) {
  const [liste, setListe] = useState(null);
  const [zustimmung, setZustimmung] = useState({});
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    (async () => {
      const l = await nachweiseLaden();
      setListe(l);
      setZustimmung(await einverstaendnisLaden([...new Set(l.map((n) => n.user_id))]));
    })();
  }, []);

  if (!liste?.length) return null;

  const ausfuehren = async (n, fn) => {
    setFehler(null);
    const r = await fn();
    if (!r.ok) setFehler(r.error);
    else setListe((l) => l.filter((x) => x.id !== n.id));
  };

  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${cardBorder}`, background: "var(--mp-karte)", padding: "10px 12px", marginBottom: 10 }} data-nachweise>
      <button type="button" data-programme-toggle aria-expanded={offen} onClick={() => setOffen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", color: textMain }}>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>🎥 Video-Nachweise: {liste.length} warten auf dich</span>
        <span style={{ color: textMuted }}>{offen ? "▾" : "›"}</span>
      </button>
      {offen && (
        <>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>
            ✓ Bestätigen löscht das Video. 🗄️ Archiv (nur mit Einverständnis) und 📌 Besprechen behalten es. Unentschiedene Videos verschwinden nach {LOESCH_TAGE} Tagen.
          </div>
          {liste.map((n) => {
            const ok = zustimmung[n.user_id] === true;
            return (
              <VideoZeile
                key={n.id}
                n={n}
                name={namen[n.user_id]}
                fehlerSetzen={setFehler}
                kopf={
                  <div style={{ fontSize: 13.5, fontWeight: 800 }}>
                    {namen[n.user_id] || "Coachee"} · {ART_TEXT[n.art] || n.art}
                    <span style={{ fontWeight: 600, fontSize: 11.5, color: textMuted }}> · noch {restTage(n.created_at)} T.</span>
                  </div>
                }
                aktionen={
                  <>
                    <button type="button" style={knopf("#2E9C86")} onClick={() => ausfuehren(n, () => nachweisEntscheiden(n, "bestaetigt"))}>
                      ✓ Bestätigen
                    </button>
                    <button
                      type="button"
                      style={{ ...knopf("#1B2350"), opacity: ok ? 1 : 0.45, cursor: ok ? "pointer" : "not-allowed" }}
                      disabled={!ok}
                      title={ok ? "Bestätigen und im Archiv der Person aufbewahren" : "Die Person hat dem Aufbewahren nicht zugestimmt"}
                      onClick={() => ausfuehren(n, () => nachweisBehalten(n, "archiviert"))}
                    >
                      🗄️ Ins Archiv
                    </button>
                    <button type="button" style={knopf("#B7791F")} onClick={() => ausfuehren(n, () => nachweisBehalten(n, "besprechen"))}>
                      📌 Besprechen
                    </button>
                    <button type="button" style={knopf(null, true)} onClick={() => ausfuehren(n, () => nachweisEntscheiden(n, "passt_nicht"))}>
                      Passt nicht
                    </button>
                  </>
                }
              />
            );
          })}
          {Object.values(zustimmung).some((z) => z !== true) && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8 }}>„Ins Archiv“ ist ausgegraut, wenn die Person dem Aufbewahren (noch) nicht zugestimmt hat – sie kann das beim nächsten Video ankreuzen.</div>}
        </>
      )}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}

// Video-Archiv einer Person (aufgeklappte Coachee-Zeile): zum Besprechen
// behaltene und archivierte Videos. Nur sichtbar, wenn es welche gibt.
export function VideoArchivPerson({ personId, vorname }) {
  const [liste, setListe] = useState(null);
  const [ok, setOk] = useState(null);
  const [fehler, setFehler] = useState(null);
  useEffect(() => {
    (async () => {
      setListe(await archivLaden(personId));
      setOk((await einverstaendnisLaden([personId]))[personId] ?? null);
    })();
  }, [personId]);
  if (!liste?.length) return null;
  const neu = async (fn) => {
    setFehler(null);
    const r = await fn();
    if (!r.ok) return setFehler(r.error);
    setListe(await archivLaden(personId));
  };
  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cardBorder}`, background: "var(--mp-karte)", padding: "10px 12px", marginBottom: 10 }} data-video-archiv>
      <div style={{ fontSize: 13, fontWeight: 800 }}>🎞️ Video-Archiv von {vorname || "dieser Person"}</div>
      <div style={{ fontSize: 11.5, color: ok === true ? "#2E9C86" : textMuted, marginTop: 2 }}>
        {ok === true ? "✓ Einverständnis zum Aufbewahren liegt vor." : ok === false ? "Einverständnis widerrufen – die Videos werden heute Nacht gelöscht." : "Kein Einverständnis – 📌-Videos werden nach 7 Tagen gelöscht."}
      </div>
      {liste.map((n) => (
        <VideoZeile
          key={n.id}
          n={n}
          name={vorname}
          fehlerSetzen={setFehler}
          kopf={<div style={{ fontSize: 12.5, fontWeight: 800 }}>{ARCHIV_TEXT[n.status]} · {ART_TEXT[n.art] || n.art}</div>}
          aktionen={
            <>
              {n.status === "besprechen" && ok === true && (
                <button type="button" style={knopf("#1B2350")} onClick={() => neu(() => nachweisBehalten(n, "archiviert"))}>
                  🗄️ Ins Archiv
                </button>
              )}
              <button type="button" style={knopf(null, true)} onClick={() => neu(() => nachweisEntscheiden(n, n.status === "besprechen" ? "bestaetigt" : "archiviert"))}>
                🗑️ Löschen
              </button>
            </>
          }
        />
      ))}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
