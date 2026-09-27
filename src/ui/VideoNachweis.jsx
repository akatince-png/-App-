import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { nachweisHochladen } from "../data/videoNachweise";
import { COUNTDOWN_SEK, LOESCH_TAGE, MAX_SEK, aufnahmeFormat } from "../utils/videoNachweis";
import { accentDark } from "./theme";

// Video-Nachweis aufnehmen (27.09., Nutzerinnen-Vorgabe): erst ein großer
// Countdown 5-4-3-2-1 (damit keine unnötigen Bewegungen aufgenommen
// werden), dann höchstens 20 Sekunden Aufnahme ohne Ton, ansehen, senden.
// Nur der Coach sieht das Video; nach der Bestätigung wird es gelöscht,
// spätestens nach 7 Tagen.
export function VideoNachweisKnopf({ art, bezugId, titel, label = "🎥 Video-Nachweis", style }) {
  const [offen, setOffen] = useState(false);
  const [gesendet, setGesendet] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="mp-tap"
        style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "4px 0", ...style }}
      >
        {gesendet ? "🎥 ✓ gesendet" : label}
      </button>
      {offen && (
        <VideoNachweis
          art={art}
          bezugId={bezugId}
          titel={titel}
          onFertig={() => {
            setGesendet(true);
            setOffen(false);
          }}
          onSchliessen={() => setOffen(false)}
        />
      )}
    </>
  );
}

export default function VideoNachweis({ art, bezugId, titel, onFertig, onSchliessen }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const teileRef = useRef([]);
  const [phase, setPhase] = useState("start"); // start | countdown | aufnahme | ansehen | sendet | fehler
  const [zahl, setZahl] = useState(COUNTDOWN_SEK);
  const [sek, setSek] = useState(0);
  const [blob, setBlob] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const [fehler, setFehler] = useState(null);

  const kameraStoppen = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let aus = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (aus) return s.getTracks().forEach((t) => t.stop());
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setFehler("Die Kamera ließ sich nicht öffnen. Bitte erlaube den Kamera-Zugriff.");
        setPhase("fehler");
      }
    })();
    return () => {
      aus = true;
      kameraStoppen();
    };
  }, []);

  useEffect(() => () => vorschau && URL.revokeObjectURL(vorschau), [vorschau]);

  // Countdown 5 → 1, dann Aufnahme.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (zahl <= 0) {
      aufnehmen();
      return;
    }
    const id = setTimeout(() => setZahl((z) => z - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, zahl]);

  // Laufzeit + automatischer Stopp nach MAX_SEK.
  useEffect(() => {
    if (phase !== "aufnahme") return;
    if (sek >= MAX_SEK) {
      stoppen();
      return;
    }
    const id = setTimeout(() => setSek((s) => s + 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sek]);

  const aufnehmen = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setFehler("Aufnehmen wird auf diesem Gerät nicht unterstützt.");
      setPhase("fehler");
      return;
    }
    const mime = aufnahmeFormat((m) => MediaRecorder.isTypeSupported?.(m));
    const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 800000 });
    teileRef.current = [];
    rec.ondataavailable = (e) => e.data?.size && teileRef.current.push(e.data);
    rec.onstop = () => {
      const b = new Blob(teileRef.current, { type: rec.mimeType || mime || "video/webm" });
      setBlob(b);
      setVorschau(URL.createObjectURL(b));
      setPhase("ansehen");
    };
    recorderRef.current = rec;
    rec.start(1000);
    setSek(0);
    setPhase("aufnahme");
  };

  const stoppen = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const nochmal = () => {
    setBlob(null);
    setVorschau(null);
    setZahl(COUNTDOWN_SEK);
    setPhase("countdown");
  };

  const senden = async () => {
    if (!blob || !user?.id) return;
    setPhase("sendet");
    const r = await nachweisHochladen(user.id, blob, { art, bezugId, titel, dauerSek: sek });
    if (!r.ok) {
      setFehler(`Senden hat nicht geklappt: ${r.error}`);
      setPhase("ansehen");
      return;
    }
    kameraStoppen();
    onFertig?.();
  };

  const knopf = (hell) => ({ flex: 1, border: "none", borderRadius: 14, padding: "13px 12px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: hell ? "#fff" : accentDark, color: hell ? accentDark : "#fff" });

  return createPortal(
    <div role="dialog" aria-label="Video-Nachweis aufnehmen" style={{ position: "fixed", inset: 0, zIndex: 160, background: "#0E1230", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", paddingTop: "max(14px, env(safe-area-inset-top))" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15.5 }}>🎥 Video-Nachweis</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{titel}</div>
        </div>
        <button type="button" aria-label="Schließen" onClick={onSchliessen} style={{ border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 99, width: 36, height: 36, fontSize: 18, cursor: "pointer" }}>
          ✕
        </button>
      </div>

      <div style={{ position: "relative", flex: 1, margin: "0 12px", borderRadius: 20, overflow: "hidden", background: "#000" }}>
        {phase === "ansehen" || phase === "sendet" ? (
          <video src={vorschau || undefined} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        )}
        {phase === "countdown" && (
          <div aria-live="assertive" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(14,18,48,0.45)" }}>
            <div key={zahl} style={{ fontSize: 140, fontWeight: 900, lineHeight: 1, animation: "fadeInUp .35s ease-out" }}>
              {zahl}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>Geh in Position – gleich geht's los</div>
          </div>
        )}
        {phase === "aufnahme" && (
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.5)", borderRadius: 99, padding: "6px 12px", fontWeight: 800 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#E0352B" }} /> {sek}s / {MAX_SEK}s
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px", paddingBottom: "max(18px, env(safe-area-inset-bottom))" }}>
        {fehler && <div style={{ fontSize: 13, color: "#FFB4A8", marginBottom: 10 }}>{fehler}</div>}
        {phase === "start" && (
          <>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5, marginBottom: 12 }}>
              Nach dem Tippen zählt die App von {COUNTDOWN_SEK} runter – dann läuft die Aufnahme (höchstens {MAX_SEK} Sek., ohne Ton). Nur dein Coach sieht das Video. Nach der Bestätigung wird es gelöscht, spätestens nach {LOESCH_TAGE} Tagen.
            </div>
            <button type="button" style={knopf(false)} onClick={() => setPhase("countdown")}>
              ▶ Countdown starten
            </button>
          </>
        )}
        {phase === "countdown" && (
          <button type="button" style={knopf(true)} onClick={() => { setZahl(COUNTDOWN_SEK); setPhase("start"); }}>
            Abbrechen
          </button>
        )}
        {phase === "aufnahme" && (
          <button type="button" style={{ ...knopf(false), background: "#E0352B" }} onClick={stoppen}>
            ⏹ Fertig
          </button>
        )}
        {(phase === "ansehen" || phase === "sendet") && (
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={knopf(true)} onClick={nochmal} disabled={phase === "sendet"}>
              Nochmal
            </button>
            <button type="button" style={knopf(false)} onClick={senden} disabled={phase === "sendet"}>
              {phase === "sendet" ? "Wird gesendet …" : "An Coach senden"}
            </button>
          </div>
        )}
        {phase === "fehler" && (
          <button type="button" style={knopf(true)} onClick={onSchliessen}>
            Schließen
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

