import React from "react";
import { Shell, Card, Label, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import ProgressRing from "../ui/ProgressRing";
import GrundEingabe from "../ui/GrundEingabe";
import ZeitErinnerungenCard from "../ui/ZeitErinnerungenCard";
import NumberWheelField from "../ui/NumberWheelField";
import { cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { KATEGORIE_META } from "../utils/dayItems";
import { useZielMitKorrektur } from "../ui/useZielMitKorrektur";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe, siehe
// dayItems.js (KATEGORIE_META.bildschirmzeit).
const { text: accentDark } = KATEGORIE_META.bildschirmzeit;

const SCHNELLAUSWAHL = [
  { label: "Kurz gescrollt", minuten: 10 },
  { label: "Social Media", minuten: 20 },
  { label: "Video/Serie geschaut", minuten: 45 },
  { label: "Längere Zeit am Handy", minuten: 90 },
];

// Umgekehrte Logik zu Hydration/Tageslicht (Nutzerinnen-Vorgabe, 15.09.):
// dort ist "Ziel erreicht" der Erfolg (mehr ist besser), hier ist das
// Tagesziel eine OBERGRENZE — darunter bleiben ist der Erfolg, sie zu
// überschreiten kein Grund zum Feiern.
function motivationsText(heuteMinuten, zielMinuten) {
  if (zielMinuten === 0) return "Trag dein Tageslimit ein, um loszulegen.";
  if (heuteMinuten === 0) return "Heute noch keine Bildschirmzeit erfasst.";
  if (heuteMinuten > zielMinuten) return `Limit um ${heuteMinuten - zielMinuten} Min. überschritten.`;
  const rest = zielMinuten - heuteMinuten;
  if (heuteMinuten / zielMinuten >= 0.8) return `Noch ${rest} Min. bis zum Limit — knapp.`;
  return `Noch ${rest} Min. im grünen Bereich.`;
}

// Bildschirmzeit-Tracking (Nutzerinnen-Vorgabe, 15.09.): wie viel Zeit am
// Tag mit dem Telefon verbracht wird, v. a. Freizeit-Scrollen. Bewusst rein
// manuell — ein automatisches Auslesen der echten Bildschirmzeit direkt
// vom Telefon ist aus einer Browser-/PWA-App heraus technisch nicht
// möglich (weder iOS noch Android geben Web-Apps Zugriff auf ihre
// Screen-Time-/Digital-Wellbeing-Daten, siehe Migration 0086) — dieselbe
// Grenze gilt für jede Web-App, nicht nur für AKA.
//
// Gleicher Aufbau wie TageslichtView.jsx (Ring, Schnellauswahl, Korrektur,
// Tagesziel, Erinnerung, Verlauf), aber OHNE die dortige KiChat-gestützte
// Zielfindung — hier reicht die einfache manuelle Zieleingabe, ein
// eigenes AIService-Gespräch dafür wäre Overkill für ein einzelnes Feld.
// Wichtigster inhaltlicher Unterschied: das Tagesziel ist hier eine
// Obergrenze (möchte man UNTERSCHREITEN), nicht ein Mindestwert (möchte
// man ERREICHEN) wie bei Hydration/Tageslicht — siehe motivationsText().
export default function BildschirmzeitView({ onHome, embedded = false }) {
  const {
    bildschirmzeitEintraege,
    bildschirmzeitHeuteMinuten,
    bildschirmzeitZielMinuten,
    bildschirmzeitHinzufuegen,
    bildschirmzeitZielSetzen,
    bildschirmzeitZielZuruecksetzen,
    aenderungVermerken,
  } = useAppData();
  const {
    zielEntwurf,
    setZielEntwurf,
    korrekturEntwurf,
    setKorrekturEntwurf,
    zielGrund,
    setZielGrund,
    fehler,
    schnellHinzufuegen,
    zielSpeichern,
    zielZuruecksetzen,
    korrekturSetzen,
  } = useZielMitKorrektur({
    zielWert: bildschirmzeitZielMinuten,
    heuteWert: bildschirmzeitHeuteMinuten,
    hinzufuegen: bildschirmzeitHinzufuegen,
    zielSetzen: bildschirmzeitZielSetzen,
    zielZuruecksetzen: bildschirmzeitZielZuruecksetzen,
    aenderungVermerken,
    kategorie: "bildschirmzeit",
    itemName: "Bildschirmzeit-Limit",
    einheit: "Min.",
    kachelName: "Bildschirmzeit",
    defaultZiel: 60,
  });

  const ueberLimit = bildschirmzeitZielMinuten > 0 && bildschirmzeitHeuteMinuten > bildschirmzeitZielMinuten;

  const content = (
    <>
      {!embedded && <ViewHeader title="📱 Bildschirmzeit" onHome={onHome} />}

      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ProgressRing
            done={bildschirmzeitHeuteMinuten}
            total={bildschirmzeitZielMinuten}
            size={92}
            color={ueberLimit ? danger : accentDark}
          />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: ueberLimit ? danger : accentDark }}>
          {bildschirmzeitHeuteMinuten} <span style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>/ {bildschirmzeitZielMinuten} Min.</span>
        </div>
        <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>
          {motivationsText(bildschirmzeitHeuteMinuten, bildschirmzeitZielMinuten)}
        </div>
      </Card>

      {fehler && <div style={{ fontSize: 12.5, color: danger, marginBottom: 14, textAlign: "center" }}>{fehler}</div>}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Schnell hinzufügen</div>
      <Card akzent style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCHNELLAUSWAHL.map((opt) => (
            <button
              key={opt.label}
              className="mp-btn"
              onClick={() => schnellHinzufuegen(opt.minuten)}
              style={{
                minHeight: 64,
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
                background: "#FAFBFA",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: textMain }}>+{opt.minuten} Min.</span>
              <span style={{ fontSize: 11.5, color: textMuted }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verschätzt?</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Trag die tatsächliche Gesamtzeit für heute ein, um einen falschen Tipp zu korrigieren.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <NumberWheelField
              value={korrekturEntwurf}
              onChange={setKorrekturEntwurf}
              min={0}
              max={720}
              step={5}
              placeholder={`z. B. ${bildschirmzeitHeuteMinuten}`}
            />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={korrekturSetzen}>
              Setzen
            </PrimaryButton>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Tageslimit</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Limit in Minuten (Obergrenze, nicht Ziel zum Erreichen)</Label>
            <NumberWheelField value={zielEntwurf} onChange={setZielEntwurf} min={0} max={720} step={5} placeholder="60" />
          </div>
          <div style={{ width: 110 }}>
            <PrimaryButton variant="ghost" onClick={zielSpeichern}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
        <GrundEingabe grund={zielGrund} onChange={setZielGrund} />
        {bildschirmzeitZielMinuten !== 60 && (
          <button
            type="button"
            onClick={zielZuruecksetzen}
            style={{ marginTop: 10, border: "none", background: "transparent", color: danger, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            Limit zurücksetzen
          </button>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerung</div>
      <Card style={{ marginBottom: 14 }}>
        <ZeitErinnerungenCard kategorie="bildschirmzeit" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="20:00" />
      </Card>

      {bildschirmzeitEintraege.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verlauf</div>
          <Card>
            {bildschirmzeitEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.datum}
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}
                >
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <span style={{ fontWeight: 700 }}>{e.minuten} Min.</span>
                </div>
              ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell bereich="bildschirmzeit">{content}</Shell>;
}
