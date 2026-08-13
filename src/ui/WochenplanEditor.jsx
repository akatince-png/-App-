import React, { useState } from "react";
import { Card, CheckRow, Label, Pill, TextInput } from "./primitives";
import TimeWheelField from "./TimeWheelField";
import NumberWheelField from "./NumberWheelField";
import AutocompleteInput from "./AutocompleteInput";
import { accentDark, cardBorder, danger, textMuted } from "./theme";
import { ALLE_UEBUNGEN, TRAININGSARTEN, WOCHENTAGE } from "../constants";
import { useT } from "../i18n/translate";

export const WOCHENTAGE_VOLL = { Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag", Fr: "Freitag", Sa: "Samstag", So: "Sonntag" };

const LEERE_WARMUP = { aktiv: false, dauerMin: "10", beschreibung: "" };

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// Ein Trainingsplan als Liste einzelner Einheiten statt einer starren
// "eine Art pro Wochentag"-Zuweisung: beliebig viele Einheiten pro Tag zu
// unterschiedlichen Uhrzeiten, mehrere Trainingsarten pro Einheit kombinierbar
// (z. B. Kraft + Cardio) und optionales Aufwärmen/Cool-down mit Dauer +
// Kurzbeschreibung. Geteilt zwischen TrainingView (laufende Pflege) und dem
// Onboarding-Trainingsschritt, damit beide Einstiegspunkte denselben
// tatsächlichen Wochenplan bearbeiten.
export default function WochenplanEditor({ trainingWochenplan, wochenplanHinzufuegen, wochenplanEntfernen, titel }) {
  const { t, tLabel } = useT();
  const titelAnzeige = titel === undefined ? t("onboarding.training.wochenplan.titel") : titel;

  const [wochentag, setWochentag] = useState(null);
  const [uhrzeit, setUhrzeit] = useState("08:00");
  const [arten, setArten] = useState([]);
  const [saetze, setSaetze] = useState("");
  const [wiederholungen, setWiederholungen] = useState("");
  const [uebungen, setUebungen] = useState("");
  const [warmup, setWarmup] = useState(LEERE_WARMUP);
  const [cooldown, setCooldown] = useState(LEERE_WARMUP);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setWochentag(null);
    setUhrzeit("08:00");
    setArten([]);
    setSaetze("");
    setWiederholungen("");
    setUebungen("");
    setWarmup(LEERE_WARMUP);
    setCooldown(LEERE_WARMUP);
  };

  const hinzufuegen = async () => {
    if (!wochentag || !uhrzeit || saving) return;
    setSaving(true);
    await wochenplanHinzufuegen({ wochentag, uhrzeit, arten, saetze, wiederholungen, uebungen, warmup, cooldown });
    setSaving(false);
    reset();
  };

  const nachTagGruppiert = WOCHENTAGE.map((tag) => ({
    tag,
    einheiten: trainingWochenplan.filter((w) => w.wochentag === tag).sort((a, b) => (a.uhrzeit || "").localeCompare(b.uhrzeit || "")),
  })).filter((g) => g.einheiten.length > 0);

  return (
    <>
      {titelAnzeige && <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{titelAnzeige}</div>}
      <Card style={{ marginBottom: 14 }}>
        <Label>{t("onboarding.training.einheit.wochentag.label")}</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {WOCHENTAGE.map((tag) => (
            <Pill key={tag} label={tLabel(WOCHENTAGE_VOLL[tag])} selected={wochentag === tag} onClick={() => setWochentag(tag)} />
          ))}
        </div>

        <Label>{t("onboarding.training.einheit.uhrzeit.label")}</Label>
        <TimeWheelField value={uhrzeit} onChange={setUhrzeit} />

        <Label>{t("onboarding.training.einheit.art.label")}</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TRAININGSARTEN.map((a) => (
            <Pill key={a} label={tLabel(a)} selected={arten.includes(a)} onClick={() => setArten((prev) => toggleInArray(prev, a))} />
          ))}
        </div>

        <Label>{t("onboarding.training.einheit.saetze.label")}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <NumberWheelField value={saetze} onChange={setSaetze} min={1} max={20} placeholder={t("onboarding.training.einheit.saetze.placeholder")} />
          </div>
          <div style={{ flex: 1 }}>
            <NumberWheelField
              value={wiederholungen}
              onChange={setWiederholungen}
              min={1}
              max={50}
              placeholder={t("onboarding.training.einheit.wiederholungen.placeholder")}
            />
          </div>
        </div>
        <Label>{t("onboarding.training.einheit.uebungen.label")}</Label>
        <AutocompleteInput value={uebungen} onChange={setUebungen} options={ALLE_UEBUNGEN} placeholder={t("onboarding.training.einheit.uebungen.placeholder")} mehrfach />

        <div style={{ marginTop: 14 }}>
          <CheckRow label={t("onboarding.training.einheit.warmup.label")} checked={warmup.aktiv} onToggle={() => setWarmup((p) => ({ ...p, aktiv: !p.aktiv }))} />
          {warmup.aktiv && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 110 }}>
                <NumberWheelField value={warmup.dauerMin} onChange={(v) => setWarmup((p) => ({ ...p, dauerMin: v }))} min={1} max={60} placeholder="Min." />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput
                  value={warmup.beschreibung}
                  onChange={(v) => setWarmup((p) => ({ ...p, beschreibung: v }))}
                  placeholder={t("onboarding.training.einheit.warmup.placeholder")}
                />
              </div>
            </div>
          )}

          <CheckRow
            label={t("onboarding.training.einheit.cooldown.label")}
            checked={cooldown.aktiv}
            onToggle={() => setCooldown((p) => ({ ...p, aktiv: !p.aktiv }))}
          />
          {cooldown.aktiv && (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 110 }}>
                <NumberWheelField value={cooldown.dauerMin} onChange={(v) => setCooldown((p) => ({ ...p, dauerMin: v }))} min={1} max={60} placeholder="Min." />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput
                  value={cooldown.beschreibung}
                  onChange={(v) => setCooldown((p) => ({ ...p, beschreibung: v }))}
                  placeholder={t("onboarding.training.einheit.cooldown.placeholder")}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={hinzufuegen}
          disabled={!wochentag || !uhrzeit || saving}
          className="mp-tap"
          style={{
            width: "100%",
            marginTop: 16,
            minHeight: 48,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            background: !wochentag || !uhrzeit ? "#B7D8D1" : accentDark,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: !wochentag || !uhrzeit ? "not-allowed" : "pointer",
          }}
        >
          {t("onboarding.training.einheit.hinzufuegen")}
        </button>
      </Card>

      {nachTagGruppiert.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          {nachTagGruppiert.map((gruppe, gi) => (
            <div key={gruppe.tag} style={{ marginBottom: gi < nachTagGruppiert.length - 1 ? 14 : 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>{tLabel(WOCHENTAGE_VOLL[gruppe.tag])}</div>
              {gruppe.einheiten.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: `1px solid ${cardBorder}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {e.uhrzeit} Uhr{e.arten.length > 0 ? ` · ${e.arten.map((a) => tLabel(a)).join(" + ")}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                      {[
                        e.uebungen,
                        e.saetze && e.wiederholungen ? `${e.saetze}×${e.wiederholungen}` : "",
                        e.warmup?.aktiv ? `Warm-up ${e.warmup.dauerMin ? `${e.warmup.dauerMin} Min.` : ""}${e.warmup.beschreibung ? ` (${e.warmup.beschreibung})` : ""}` : "",
                        e.cooldown?.aktiv
                          ? `Cool-down ${e.cooldown.dauerMin ? `${e.cooldown.dauerMin} Min.` : ""}${e.cooldown.beschreibung ? ` (${e.cooldown.beschreibung})` : ""}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => wochenplanEntfernen(e.id)}
                    style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
