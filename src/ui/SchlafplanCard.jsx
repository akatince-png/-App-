import React from "react";
import { Card, Label, Pill, TextArea } from "./primitives";
import { accentSoft, accentDark, cardBorder, danger, textMuted } from "./theme";
import TimeWheelField from "./TimeWheelField";
import ZeitErinnerungenCard from "./ZeitErinnerungenCard";
import { WOCHENTAGE } from "../constants";
import { useT } from "../i18n/translate";

export function neuerSchlafblock(wochentage) {
  return { id: Math.random().toString(36).slice(2), wochentage, bettzeit: "22:30", aufwachzeit: "06:30" };
}

export function berechneSchlafstunden(bett, auf) {
  if (!bett || !auf) return "–";
  const [bh, bm] = bett.split(":").map(Number);
  const [ah, am] = auf.split(":").map(Number);
  let minuten = ah * 60 + am - (bh * 60 + bm);
  if (minuten <= 0) minuten += 24 * 60;
  return Math.round((minuten / 60) * 10) / 10;
}

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function AddZeile({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: 10,
        border: "1px dashed #C7D8D2",
        background: "transparent",
        color: disabled ? textMuted : accentDark,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        marginBottom: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

// Schlafplan-Karte (Bettzeit/Aufwachzeit je Wochentag-Block) — bis 17.09.
// nur Teil von OnboardingRoutinenView.jsx, dort ausgelagert, damit dieselbe
// Karte auch außerhalb des Onboardings verfügbar ist (siehe RoutineTabView.jsx,
// Nutzerinnen-Report: der einmal im Onboarding festgelegte Schlafplan ließ
// sich danach nirgends mehr bearbeiten). Rein kontrolliert — hält selbst
// keinen State, damit Onboarding (sammelt Änderungen erst bis zum
// abschließenden "Weiter") und RoutineTabView (soll sofort speichern, wie
// der Rest der Seite) dieselbe Oberfläche unterschiedlich verdrahten können.
export default function SchlafplanCard({
  intervallTyp,
  onIntervallTypChange,
  bloecke,
  onBloeckeChange,
  istZustand,
  onIstZustandChange,
  fehler,
  titel = "😴 Schlafplan",
  intro = "Wann gehst du normalerweise ins Bett, wann willst du aufwachen? Schließt direkt an deine Abendroutine an.",
  istZustandFrage = "Wie ist dein aktueller Schlaf?",
  istZustandPlaceholder = "z. B. unruhig, zu wenig, wache oft auf …",
  zeigeErinnerung = true,
}) {
  const { t, tLabel } = useT();

  const tageBelegtVonAnderen = (idx) => bloecke.filter((_, i) => i !== idx).flatMap((b) => b.wochentage);
  const verfuegbareTage = (idx) => WOCHENTAGE.filter((tag) => !tageBelegtVonAnderen(idx).includes(tag));
  const toggleBlockTag = (idx, tag) => {
    onBloeckeChange(bloecke.map((b, i) => (i === idx ? { ...b, wochentage: toggleInArray(b.wochentage, tag) } : b)));
  };
  const blockAlleUmschalten = (idx) => {
    const verfuegbar = verfuegbareTage(idx);
    onBloeckeChange(
      bloecke.map((b, i) => {
        if (i !== idx) return b;
        const vollstaendig = verfuegbar.length > 0 && verfuegbar.every((t) => b.wochentage.includes(t));
        return { ...b, wochentage: vollstaendig ? [] : [...verfuegbar] };
      })
    );
  };
  const setBlockFeld = (idx, feld, val) => {
    onBloeckeChange(bloecke.map((b, i) => (i === idx ? { ...b, [feld]: val } : b)));
  };
  const schlafblockHinzufuegen = () => {
    const belegt = bloecke.flatMap((b) => b.wochentage);
    const frei = WOCHENTAGE.filter((t) => !belegt.includes(t));
    if (frei.length === 0) return;
    onBloeckeChange([...bloecke, neuerSchlafblock(frei)]);
  };
  const schlafblockEntfernen = (idx) => {
    onBloeckeChange(bloecke.length > 1 ? bloecke.filter((_, i) => i !== idx) : bloecke);
  };
  const alleTageVergeben = WOCHENTAGE.every((t) => bloecke.some((b) => b.wochentage.includes(t)));

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{titel}</div>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>{intro}</div>
      <Label>{tLabel("Intervall")}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 16 }}>
        <Pill label={tLabel("Täglich")} selected={intervallTyp === "fixed"} onClick={() => onIntervallTypChange("fixed")} />
        <Pill label={tLabel("Bestimmte Wochentage")} selected={intervallTyp === "weekdays"} onClick={() => onIntervallTypChange("weekdays")} />
      </div>
      {intervallTyp === "fixed" ? (
        <div style={{ padding: "12px", borderRadius: 12, background: accentSoft, marginBottom: 14 }}>
          <Label>{t("onboarding.schlaf.bettzeit.label")}</Label>
          <TimeWheelField value={bloecke[0]?.bettzeit || "22:30"} onChange={(v) => setBlockFeld(0, "bettzeit", v)} />
          <Label>{t("onboarding.schlaf.aufwachzeit.label")}</Label>
          <TimeWheelField value={bloecke[0]?.aufwachzeit || "06:30"} onChange={(v) => setBlockFeld(0, "aufwachzeit", v)} />
          <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
            {t("onboarding.schlaf.ziel", { stunden: berechneSchlafstunden(bloecke[0]?.bettzeit, bloecke[0]?.aufwachzeit) })}
          </div>
        </div>
      ) : (
        <>
          {bloecke.map((block, idx) => (
            <div
              key={block.id}
              style={{
                marginBottom: idx < bloecke.length - 1 ? 20 : 0,
                paddingBottom: idx < bloecke.length - 1 ? 16 : 0,
                borderBottom: idx < bloecke.length - 1 ? `1px solid ${cardBorder}` : "none",
              }}
            >
              <Label>{t("onboarding.schlaf.tage.label")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <Pill
                  label={t("onboarding.schlaf.alle")}
                  selected={verfuegbareTage(idx).length > 0 && verfuegbareTage(idx).every((t2) => block.wochentage.includes(t2))}
                  onClick={() => blockAlleUmschalten(idx)}
                />
                {verfuegbareTage(idx).map((tag) => (
                  <Pill key={tag} label={tag} selected={block.wochentage.includes(tag)} onClick={() => toggleBlockTag(idx, tag)} />
                ))}
              </div>
              <Label>{t("onboarding.schlaf.bettzeit.label")}</Label>
              <TimeWheelField value={block.bettzeit} onChange={(v) => setBlockFeld(idx, "bettzeit", v)} />
              <Label>{t("onboarding.schlaf.aufwachzeit.label")}</Label>
              <TimeWheelField value={block.aufwachzeit} onChange={(v) => setBlockFeld(idx, "aufwachzeit", v)} />
              <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
                {t("onboarding.schlaf.ziel", { stunden: berechneSchlafstunden(block.bettzeit, block.aufwachzeit) })}
              </div>
              {bloecke.length > 1 && (
                <button
                  type="button"
                  onClick={() => schlafblockEntfernen(idx)}
                  style={{ marginTop: 8, border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                >
                  {t("onboarding.schlaf.block.entfernen")}
                </button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <AddZeile label={t("onboarding.schlaf.block.hinzufuegen")} onClick={schlafblockHinzufuegen} disabled={alleTageVergeben} />
          </div>
        </>
      )}
      <div style={{ marginTop: 16 }}>
        <Label>{istZustandFrage}</Label>
        <TextArea value={istZustand} onChange={onIstZustandChange} placeholder={istZustandPlaceholder} diktierbar />
      </div>
      {zeigeErinnerung && (
        <div style={{ marginTop: 16 }}>
          <ZeitErinnerungenCard kategorie="schlaf" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="22:00" />
        </div>
      )}
      {fehler && <div style={{ marginTop: 12, fontSize: 12.5, color: danger, fontWeight: 600 }}>{fehler}</div>}
    </Card>
  );
}
