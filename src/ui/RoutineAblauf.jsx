import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, PrimaryButton } from "./primitives";
import Timer from "./Timer";
import { textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";

const ROUTINE_ANLASS = { morgen: "morgenroutine", abend: "abendroutine" };

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_EMOJI = { morgen: "🌅", abend: "🌙" };
const ABSCHLUSS_TEXT = {
  morgen: "Du bist startklar für den Tag. Wünsch dir einen wunderschönen Tag!",
  abend: "Gut gemacht — Zeit, zur Ruhe zu kommen. Schlaf gut.",
};

// Geführter Ablauf-Screen (Phase 1, 13.08.): führt Schritt für Schritt durch
// die konfigurierten Routine-Schritte, mit Countdown + Vorwarnton kurz vor
// Ende je Schritt — gegen das ADHS-typische "sich in der Zeit verlieren".
// "Schritt fertig" geht jederzeit, auch vor Ablauf des Timers (z. B. wenn
// etwas schneller ging als geplant). Tatsächlich gebrauchte Zeit je Schritt
// wird mitgeschrieben und am Ende als ein Durchlauf gespeichert.
export default function RoutineAblauf({ routine, schritte, onAbschluss, onAbbrechen, routineDurchlaufSpeichern }) {
  const { spotifyVerbunden, spotifyAnlaesse, spotifyAbspielen } = useAppData();
  const [index, setIndex] = useState(0);
  const [fertig, setFertig] = useState(false);
  const protokollRef = useRef([]);
  const startZeitRef = useRef(Date.now());
  const gestartetUmRef = useRef(new Date().toISOString());

  // Startet automatisch die zugeordnete Playlist (falls unter "Schritte
  // einrichten" → Playlist eine hinterlegt ist), einmalig beim Start dieses
  // Durchlaufs — nicht bei jedem Schrittwechsel.
  useEffect(() => {
    const uri = spotifyAnlaesse[ROUTINE_ANLASS[routine]]?.uri;
    if (uri && spotifyVerbunden) spotifyAbspielen(uri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aktuell = schritte[index];

  const weiter = () => {
    const tatsaechlichSek = Math.round((Date.now() - startZeitRef.current) / 1000);
    protokollRef.current = [...protokollRef.current, { name: aktuell.name, geplantMin: aktuell.dauerMin, tatsaechlichSek }];
    if (index + 1 < schritte.length) {
      setIndex((i) => i + 1);
      startZeitRef.current = Date.now();
    } else {
      routineDurchlaufSpeichern?.({ routine, schritte: protokollRef.current, gestartetUm: gestartetUmRef.current });
      setFertig(true);
    }
  };

  if (!schritte.length) {
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
            Für die {ROUTINE_LABEL[routine]} sind noch keine Schritte eingerichtet.
          </div>
          <PrimaryButton onClick={onAbbrechen}>Zurück</PrimaryButton>
        </Card>
      </Shell>
    );
  }

  if (fertig) {
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>{ROUTINE_EMOJI[routine]}</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{ROUTINE_LABEL[routine]} abgeschlossen!</div>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 16 }}>{ABSCHLUSS_TEXT[routine]}</div>
          <PrimaryButton onClick={onAbschluss}>Zurück zum Tag</PrimaryButton>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginBottom: 8 }}>
        {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]} · Schritt {index + 1} von {schritte.length}
      </div>
      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{aktuell.name}</div>
        <Timer key={aktuell.id} mode="countdown" initialSeconds={(Number(aktuell.dauerMin) || 5) * 60} autoStart vorwarnungSek={30} onFertig={weiter} />
        <div style={{ marginTop: 14 }}>
          <PrimaryButton onClick={weiter} variant="success">
            Schritt fertig
          </PrimaryButton>
        </div>
      </Card>
      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={onAbbrechen}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer", padding: 8 }}
        >
          Routine abbrechen
        </button>
      </div>
    </Shell>
  );
}
