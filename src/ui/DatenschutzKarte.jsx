import React, { useState } from "react";
import { Card, TextInput } from "./primitives";
import { danger, success, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { kontoLoeschen } from "../data/kontoLoeschen";

// Mehr → Datenschutz & Konto (28.09., App-Store-Vorbereitung):
// Einwilligungen ansehen, KI-Funktionen ein-/ausschalten, Datenschutz-
// erklärung/Impressum öffnen und das Konto endgültig löschen.
const WORT = "LÖSCHEN";
const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : null);

export default function DatenschutzKarte() {
  const { einwilligung, einwilligungSetzen, isAdmin } = useAppData();
  const { signOut } = useAuth();
  const { proband, verlasseVerwaltung } = useAdmin();
  const [entwurf, setEntwurf] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState(null);
  const kiAn = !!einwilligung?.kiAm;
  // Admins löschen ihr eigenes Konto nicht über die App; im Verwalten-Modus
  // löscht der Coach das Konto der verwalteten Person.
  const loeschenMoeglich = !!proband || !isAdmin;

  const kiUmschalten = async () => {
    setMeldung(null);
    const r = await einwilligungSetzen({ ki: !kiAn });
    if (!r?.ok) setMeldung(r?.error || "Speichern hat nicht geklappt.");
  };

  const loeschen = async () => {
    setLaeuft(true);
    setMeldung(null);
    const r = await kontoLoeschen(proband ? proband.id : null);
    setLaeuft(false);
    if (!r.ok) return setMeldung(r.error);
    if (proband) {
      setEntwurf("");
      verlasseVerwaltung?.();
    } else {
      await signOut();
    }
  };

  const link = { color: "color-mix(in srgb, #2D6FD6 var(--mp-schrift), var(--mp-schrift-hell))", fontWeight: 700, fontSize: 13, textDecoration: "none" };
  return (
    <Card style={{ marginBottom: 14 }}>
      <div data-datenschutz-karte>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <div>
            <span style={{ color: success, fontWeight: 700 }}>✓</span> Datenschutz-Einwilligung {einwilligung?.datenschutzAm ? `vom ${datum(einwilligung.datenschutzAm)}` : isAdmin ? "(Admin-Konto)" : "noch offen"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0", padding: "10px 12px", background: "color-mix(in srgb, #F4F7FC var(--mp-flaeche), var(--mp-karte))", borderRadius: 12 }}>
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>
            <b>KI-Funktionen</b> {kiAn ? `erlaubt seit ${datum(einwilligung.kiAm)}` : "aus"}
            <div style={{ fontSize: 12, color: textMuted }}>Aka-Chat, Lexikon, Foto-Auslesen, Vorlese-Stimme (Google, Groq). Ohne KI geht alles per Hand.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={kiAn}
            aria-label="KI-Funktionen erlauben"
            onClick={kiUmschalten}
            style={{ width: 50, height: 30, borderRadius: 99, border: "none", cursor: "pointer", background: kiAn ? "var(--mp-accent)" : "#C9CED9", position: "relative", flexShrink: 0 }}
          >
            <span style={{ position: "absolute", top: 3, left: kiAn ? 23 : 3, width: 24, height: 24, borderRadius: 99, background: "var(--mp-karte)", transition: "left .15s" }} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: loeschenMoeglich ? 14 : 0 }}>
          <a href="#/datenschutz" style={link}>
            Datenschutzerklärung
          </a>
          <a href="#/impressum" style={link}>
            Impressum
          </a>
        </div>
        {loeschenMoeglich && (
          <div style={{ borderTop: "1px solid color-mix(in srgb, #EAEAE5 var(--mp-flaeche), var(--mp-rand-dunkel))", paddingTop: 12 }} data-konto-loeschen>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, color: danger }}>🗑️ {proband ? `Konto von ${proband.vorname || proband.email} löschen` : "Konto löschen"}</div>
            <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.45, marginBottom: 8 }}>
              Löscht {proband ? "den Zugang und alle Einträge und Fotos dieser Person" : "deinen Zugang und alle deine Einträge und Fotos"} endgültig. Das lässt sich nicht rückgängig machen.
            </div>
            <TextInput value={entwurf} onChange={setEntwurf} placeholder={`Zum Bestätigen „${WORT}“ tippen`} />
            <button
              type="button"
              onClick={loeschen}
              disabled={entwurf.trim().toUpperCase() !== WORT || laeuft}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                background: danger,
                color: "#fff",
                opacity: entwurf.trim().toUpperCase() === WORT && !laeuft ? 1 : 0.5,
                cursor: entwurf.trim().toUpperCase() === WORT && !laeuft ? "pointer" : "not-allowed",
              }}
            >
              {laeuft ? "Wird gelöscht …" : "Konto endgültig löschen"}
            </button>
          </div>
        )}
        {meldung && <div style={{ color: danger, fontSize: 12.5, marginTop: 8 }}>{meldung}</div>}
      </div>
    </Card>
  );
}
