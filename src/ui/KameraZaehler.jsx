import React, { useEffect, useRef, useState } from "react";
import { KAMERA_UEBUNGEN, gelenkWinkel, neuerZaehler, zaehlerSchritt } from "../utils/wiederholungZaehler";

// Kamera-Zählung (26.09.): Handy hinstellen, Übung machen – die App erkennt
// die Körperhaltung (MediaPipe Pose, läuft komplett im Browser; das Bild
// wird nicht hochgeladen oder gespeichert) und zählt Wiederholungen mit.
// Die Erkennung (~6 MB) wird erst beim ersten Öffnen geladen.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODELL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

let landmarkerPromise = null;
async function landmarkerLaden() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM);
      const optionen = (delegate) => ({ baseOptions: { modelAssetPath: MODELL, delegate }, runningMode: "VIDEO", numPoses: 1 });
      // Grafikkarte, wenn möglich – sonst Prozessor (ältere Geräte).
      try {
        return await PoseLandmarker.createFromOptions(vision, optionen("GPU"));
      } catch {
        return PoseLandmarker.createFromOptions(vision, optionen("CPU"));
      }
    })().catch((e) => {
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

export default function KameraZaehler({ uebung, ziel, onFertig, onAbbrechen }) {
  const meta = KAMERA_UEBUNGEN[uebung];
  const videoRef = useRef(null);
  const [status, setStatus] = useState("laden"); // laden | bereit | fehler
  const [fehler, setFehler] = useState(null);
  const [zaehler, setZaehler] = useState(neuerZaehler);
  const [sichtbar, setSichtbar] = useState(false);
  const zRef = useRef(neuerZaehler());

  useEffect(() => {
    let stream;
    let raf;
    let aus = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (aus) return;
        const v = videoRef.current;
        v.srcObject = stream;
        await v.play();
        const landmarker = await landmarkerLaden();
        if (aus) return;
        setStatus("bereit");
        let letzteZeit = -1;
        const schleife = () => {
          if (aus) return;
          if (v.readyState >= 2 && v.currentTime !== letzteZeit) {
            letzteZeit = v.currentTime;
            const jetzt = performance.now();
            const r = landmarker.detectForVideo(v, jetzt);
            const w = gelenkWinkel(r?.landmarks?.[0], uebung);
            setSichtbar(w != null);
            const neu = zaehlerSchritt(zRef.current, w, uebung, jetzt);
            if (neu !== zRef.current) {
              zRef.current = neu;
              setZaehler(neu);
            }
          }
          raf = requestAnimationFrame(schleife);
        };
        schleife();
      } catch (e) {
        console.error(e);
        setFehler(e?.name === "NotAllowedError" ? "Kamera nicht erlaubt – bitte in den Browser-Einstellungen freigeben." : "Kamera oder Erkennung konnte nicht gestartet werden.");
        setStatus("fehler");
      }
    })();
    return () => {
      aus = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [uebung]);

  return (
    <div aria-label="Kamera-Zählung" style={{ textAlign: "center" }}>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0F1638", aspectRatio: "4 / 3", maxWidth: 420, margin: "0 auto" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: status === "bereit" ? 1 : 0.3 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div data-kamera-anzahl style={{ fontSize: 72, fontWeight: 900, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>{zaehler.anzahl}</div>
          {ziel ? <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>von {ziel}</div> : null}
        </div>
        <div style={{ position: "absolute", left: 8, top: 8, fontSize: 11.5, fontWeight: 800, padding: "4px 8px", borderRadius: 99, background: status === "bereit" ? (sichtbar ? "#1E8E5A" : "#C27A00") : "rgba(255,255,255,.2)", color: "#fff" }}>
          {status === "laden" ? "Erkennung lädt …" : status === "fehler" ? "Fehler" : sichtbar ? `● ${meta?.label} erkannt` : "Körper nicht ganz im Bild"}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", margin: "8px 0" }}>{fehler || meta?.hinweis} Das Bild bleibt auf deinem Gerät.</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button type="button" onClick={() => onFertig?.(zaehler.anzahl)} style={{ border: "none", borderRadius: 14, padding: "12px 18px", background: "#1E8E5A", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
          ✓ Satz fertig ({zaehler.anzahl})
        </button>
        <button type="button" onClick={onAbbrechen} style={{ border: "1.5px solid #D6D9E0", borderRadius: 14, padding: "12px 14px", background: "#fff", fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
          Ohne Kamera
        </button>
      </div>
    </div>
  );
}
