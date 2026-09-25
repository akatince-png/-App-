import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "./primitives";
import { textMuted } from "./theme";
import { playBeep } from "../utils/beep";
import { ATEM_GEFUEHLE, taktPosition } from "../utils/atemBibliothek";

// Geführte Atem-Übung (25.09., Vorschau freigegeben): ein Kreis atmet mit,
// Aka sagt die Phase an (Browser-Sprachausgabe, sofort ohne Netz-Verzögerung),
// das Handy vibriert beim Phasenwechsel. Vorher und nachher je ein Tipp zur
// Stimmung. Dieselbe Komponente läuft in der Gruppen-Session: dann gibt
// `startUm` den gemeinsamen Takt vor (alle sehen dieselbe Phase).
//
// Props:
// - uebung: { name, icon, phasen:[{art,sek,sprache}], dauerMinuten, hinweis? }
// - startUm (optional, ms): gemeinsamer Start (Gruppe); ohne = Start per Knopf
// - onVorher(gefuehl), onFertig({ dauerSek, vorher, nachher })
const ART_TEXT = { ein: "EINATMEN", halten: "HALTEN", aus: "AUSATMEN" };
const VORLAUF_MS = 5000;

function sprechen(text) {
  try {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // ohne Sprachausgabe läuft die Übung einfach mit Kreis + Ton
  }
}

export default function AtemFuehrung({ uebung, startUm = null, onVorher, onFertig }) {
  const [status, setStatus] = useState(startUm ? "vorher" : "vorher"); // vorher | bereit | laeuft | nachher | fertig
  const [vorher, setVorher] = useState(null);
  const [stimme, setStimme] = useState(true);
  const [jetzt, setJetzt] = useState(Date.now());
  const startRef = useRef(startUm);
  const letztePhaseRef = useRef(null);
  const dauerMs = (uebung?.dauerMinuten || 3) * 60000;

  useEffect(() => {
    if (status !== "laeuft" && status !== "bereit") return;
    const id = setInterval(() => setJetzt(Date.now()), 100);
    return () => clearInterval(id);
  }, [status]);

  const vergangen = startRef.current ? jetzt - startRef.current : -1;
  const pos = vergangen >= 0 ? taktPosition(uebung.phasen, vergangen) : null;

  // Phasenwechsel: Ansage + Vibration + Ton; Ende nach Dauer (bei eigener
  // Übung erst nach vollständigem Zyklus, in der Gruppe exakt zur Zeit).
  useEffect(() => {
    if (status === "bereit" && vergangen >= 0) setStatus("laeuft");
    if (status !== "laeuft" || !pos) return;
    const schluessel = `${pos.runde}-${pos.index}`;
    if (letztePhaseRef.current !== schluessel) {
      if (vergangen >= dauerMs && (startUm || pos.index === 0)) {
        playBeep(3);
        sprechen(stimme ? "Fertig. Gut gemacht." : "");
        setStatus("nachher");
        return;
      }
      letztePhaseRef.current = schluessel;
      if (stimme) sprechen(pos.phase.sprache);
      else playBeep(1);
      try {
        navigator.vibrate?.(40);
      } catch {
        // nicht jedes Gerät vibriert
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jetzt, status]);

  useEffect(() => () => window.speechSynthesis?.cancel?.(), []);

  const starten = () => {
    if (!startRef.current) startRef.current = Date.now() + VORLAUF_MS;
    setJetzt(Date.now());
    setStatus("bereit");
  };
  const vorherWaehlen = (g) => {
    setVorher(g);
    onVorher?.(g);
  };
  const beenden = () => {
    window.speechSynthesis?.cancel?.();
    setStatus("nachher");
  };
  const nachherWaehlen = (g) => {
    const dauerSek = Math.max(0, Math.round(Math.min(vergangen, dauerMs) / 1000));
    setStatus("fertig");
    onFertig?.({ dauerSek, vorher, nachher: g });
  };

  const skala = (() => {
    if (!pos) return 0.55;
    const f = pos.vergangenMs / pos.dauerMs;
    if (pos.phase.art === "ein") return 0.55 + 0.45 * f;
    if (pos.phase.art === "aus") return 1 - 0.45 * f;
    const vorige = uebung.phasen[(pos.index - 1 + uebung.phasen.length) % uebung.phasen.length];
    return vorige.art === "ein" ? 1 : 0.55;
  })();

  const gefuehle = (onWahl, gewaehlt, name) => (
    <div role="group" aria-label={name} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {ATEM_GEFUEHLE.map((g) => (
        <button
          key={g.wert}
          type="button"
          aria-label={g.label}
          aria-pressed={gewaehlt === g.wert}
          onClick={() => onWahl(g.wert)}
          className="mp-tap"
          style={{ fontSize: 28, border: "none", borderRadius: 14, padding: 6, cursor: "pointer", background: gewaehlt === g.wert ? "#FFF1D6" : "transparent", outline: gewaehlt === g.wert ? "2px solid #E0A21B" : "none" }}
        >
          {g.emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
      {status === "vorher" && (
        <>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>{uebung.beschreibung || ""}</div>
          {uebung.hinweis && <div style={{ fontSize: 12, background: "#FFF6E0", borderRadius: 12, padding: "8px 10px", margin: "6px 0 10px", textAlign: "left" }}>⚠️ {uebung.hinweis}</div>}
          <div style={{ fontSize: 13.5, fontWeight: 800, margin: "8px 0" }}>Wie fühlst du dich gerade?</div>
          {gefuehle(vorherWaehlen, vorher, "Stimmung vorher")}
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, color: textMuted, marginTop: 10 }}>
            <input type="checkbox" checked={stimme} onChange={(e) => setStimme(e.target.checked)} /> Aka sagt die Phasen an
          </label>
          <div style={{ marginTop: 12 }}>
            <PrimaryButton onClick={starten}>{startUm && startUm > Date.now() ? "Bereit – warte auf den Start" : "▶ Start"}</PrimaryButton>
          </div>
        </>
      )}

      {(status === "bereit" || status === "laeuft") && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, color: textMuted }} data-atem-phase={pos?.phase.art || "warten"}>
            {pos ? `${uebung.name.toUpperCase()} · Runde ${pos.runde}` : `GLEICH GEHT'S LOS … ${Math.ceil(-vergangen / 1000)}`}
          </div>
          <div style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                transform: `scale(${skala})`,
                transition: "transform 120ms linear",
                background: "radial-gradient(circle, #BFE7F2 0%, #5CC3A8 70%)",
                boxShadow: "0 0 0 16px rgba(92,195,168,0.18), 0 0 0 32px rgba(92,195,168,0.08)",
              }}
            />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{pos ? ART_TEXT[pos.phase.art] : "Bereit machen"}</div>
          <div style={{ fontSize: 13, color: textMuted, minHeight: 18 }}>{pos ? `${Math.max(1, Math.ceil((pos.dauerMs - pos.vergangenMs) / 1000))} …` : ""}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={() => setStimme((s) => !s)}>
                {stimme ? "🔇 Stimme aus" : "🔊 Stimme an"}
              </PrimaryButton>
            </div>
            <div style={{ flex: 1 }}>
              <PrimaryButton variant="ghost" onClick={beenden}>
                Beenden
              </PrimaryButton>
            </div>
          </div>
        </>
      )}

      {status === "nachher" && (
        <>
          <div style={{ fontSize: 16, fontWeight: 900, margin: "6px 0" }}>Geschafft 🎉</div>
          <div style={{ fontSize: 13.5, fontWeight: 800, margin: "8px 0" }}>Wie fühlst du dich jetzt?</div>
          {gefuehle(nachherWaehlen, null, "Stimmung nachher")}
          <button type="button" onClick={() => nachherWaehlen(null)} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, marginTop: 10, cursor: "pointer" }}>
            Überspringen
          </button>
        </>
      )}
      {status === "fertig" && <div role="status" style={{ fontSize: 13.5, fontWeight: 700, color: "#1E8E5A", marginTop: 8 }}>✓ Im Protokoll vermerkt</div>}
    </div>
  );
}
