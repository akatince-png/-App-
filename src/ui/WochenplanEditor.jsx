import React, { useState } from "react";
import { Card, CheckRow, Label, Pill, TextInput } from "./primitives";
import TimeWheelField from "./TimeWheelField";
import NumberWheelField from "./NumberWheelField";
import UebungenEditor, { LEERE_UEBUNG } from "./UebungenEditor";
import { accentDark, cardBorder, danger, textMuted } from "./theme";
import { ALLE_UEBUNGEN, TRAININGSARTEN, WOCHENTAGE } from "../constants";
import { wochenplanUebungenText } from "../utils/dayItems";
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
export default function WochenplanEditor({ trainingWochenplan, wochenplanHinzufuegen, wochenplanBearbeiten, wochenplanEntfernen, titel }) {
  const { t, tLabel } = useT();
  const titelAnzeige = titel === undefined ? t("onboarding.training.wochenplan.titel") : titel;

  // Mehrfachauswahl statt nur einem Wochentag — Nutzerinnen-Vorgabe
  // (13.08.): dieselbe Einheit (z. B. eine Cardio-Morgenroutine) soll sich
  // in einem Zug für beliebig viele/beliebige Tage anlegen lassen, nicht
  // nur alle-oder-einer. Beim Speichern entsteht pro gewähltem Tag eine
  // eigene Zeile (unverändertes Datenmodell: eine Zeile = ein Tag).
  const [wochentage, setWochentage] = useState([]);
  const [uhrzeit, setUhrzeit] = useState("08:00");
  const [arten, setArten] = useState([]);
  const [uebungenListe, setUebungenListe] = useState([{ ...LEERE_UEBUNG }]);
  const [warmup, setWarmup] = useState(LEERE_WARMUP);
  const [cooldown, setCooldown] = useState(LEERE_WARMUP);
  const [saving, setSaving] = useState(false);
  // Statt Löschen + Neuanlegen lässt sich eine bestehende Einheit jetzt
  // direkt bearbeiten (Nutzerinnen-Vorgabe, 13.08. — z. B. nachträglich
  // Aufwärmen/Cool-down bei einer schon gespeicherten Einheit ergänzen).
  // bearbeitenId != null: das Formular oben zeigt/speichert diese eine
  // bestehende Zeile statt neue anzulegen; Wochentag-Auswahl wird dabei auf
  // Einfachauswahl umgeschaltet, weil eine bestehende Zeile nur zu einem Tag
  // gehört.
  const [bearbeitenId, setBearbeitenId] = useState(null);

  const reset = () => {
    setWochentage([]);
    setUhrzeit("08:00");
    setArten([]);
    setUebungenListe([{ ...LEERE_UEBUNG }]);
    setWarmup(LEERE_WARMUP);
    setCooldown(LEERE_WARMUP);
    setBearbeitenId(null);
  };

  const starteBearbeiten = (e) => {
    setBearbeitenId(e.id);
    setWochentage([e.wochentag]);
    setUhrzeit(e.uhrzeit || "08:00");
    setArten(e.arten || []);
    setUebungenListe(e.uebungenListe?.length ? e.uebungenListe.map((u) => ({ ...LEERE_UEBUNG, ...u })) : [{ ...LEERE_UEBUNG }]);
    setWarmup(e.warmup || LEERE_WARMUP);
    setCooldown(e.cooldown || LEERE_WARMUP);
  };

  const uebungAendern = (index, feld, wert) =>
    setUebungenListe((prev) => prev.map((u, i) => (i === index ? { ...u, [feld]: wert } : u)));
  const uebungHinzufuegen = () => setUebungenListe((prev) => [...prev, { ...LEERE_UEBUNG }]);
  const uebungEntfernen = (index) => setUebungenListe((prev) => prev.filter((_, i) => i !== index));

  const speichern = async () => {
    if (!wochentage.length || !uhrzeit || saving) return;
    setSaving(true);
    const uebungenGefuellt = uebungenListe.filter((u) => u.name.trim());
    if (bearbeitenId) {
      await wochenplanBearbeiten(bearbeitenId, { wochentag: wochentage[0], uhrzeit, arten, uebungenListe: uebungenGefuellt, warmup, cooldown });
    } else {
      // Nacheinander statt Promise.all, damit bei einem Fehler mitten in der
      // Reihe nichts unbemerkt durcheinandergerät.
      for (const tag of wochentage) {
        await wochenplanHinzufuegen({ wochentag: tag, uhrzeit, arten, uebungenListe: uebungenGefuellt, warmup, cooldown });
      }
    }
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
          {!bearbeitenId && (
            <Pill
              label={t("onboarding.schlaf.alle")}
              selected={wochentage.length === WOCHENTAGE.length}
              onClick={() => setWochentage(wochentage.length === WOCHENTAGE.length ? [] : [...WOCHENTAGE])}
            />
          )}
          {WOCHENTAGE.map((tag) => (
            <Pill
              key={tag}
              label={tLabel(WOCHENTAGE_VOLL[tag])}
              selected={wochentage.includes(tag)}
              onClick={() => setWochentage(bearbeitenId ? [tag] : (prev) => toggleInArray(prev, tag))}
            />
          ))}
        </div>
        {!bearbeitenId && wochentage.length > 1 && (
          <div style={{ fontSize: 11, color: textMuted, marginTop: -6, marginBottom: 8 }}>
            Wird für {wochentage.length} Tage gleichzeitig angelegt.
          </div>
        )}

        <Label>{t("onboarding.training.einheit.uhrzeit.label")}</Label>
        <TimeWheelField value={uhrzeit} onChange={setUhrzeit} />

        <Label>{t("onboarding.training.einheit.art.label")}</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TRAININGSARTEN.map((a) => (
            <Pill key={a} label={tLabel(a)} selected={arten.includes(a)} onClick={() => setArten((prev) => toggleInArray(prev, a))} />
          ))}
        </div>

        <UebungenEditor
          uebungen={uebungenListe}
          optionen={ALLE_UEBUNGEN}
          gewichtPlatzhalter="Gewicht"
          onAendern={uebungAendern}
          onEntfernen={uebungEntfernen}
          onHinzufuegen={uebungHinzufuegen}
        />

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

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {bearbeitenId && (
            <button
              type="button"
              onClick={reset}
              className="mp-tap"
              style={{ flex: 1, minHeight: 48, padding: "12px", borderRadius: 14, border: `1px solid ${cardBorder}`, background: "#fff", color: textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Abbrechen
            </button>
          )}
          <button
            type="button"
            onClick={speichern}
            disabled={!wochentage.length || !uhrzeit || saving}
            className="mp-tap"
            style={{
              flex: 2,
              minHeight: 48,
              padding: "12px",
              borderRadius: 14,
              border: "none",
              background: !wochentage.length || !uhrzeit ? "#B7D8D1" : accentDark,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: !wochentage.length || !uhrzeit ? "not-allowed" : "pointer",
            }}
          >
            {bearbeitenId ? "Änderungen speichern" : t("onboarding.training.einheit.hinzufuegen")}
          </button>
        </div>
        {!wochentage.length && (
          <div style={{ fontSize: 11.5, color: danger, marginTop: 6, textAlign: "center" }}>Bitte oben zuerst mindestens einen Wochentag auswählen.</div>
        )}
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
                        wochenplanUebungenText(e),
                        e.warmup?.aktiv ? `Warm-up ${e.warmup.dauerMin ? `${e.warmup.dauerMin} Min.` : ""}${e.warmup.beschreibung ? ` (${e.warmup.beschreibung})` : ""}` : "",
                        e.cooldown?.aktiv
                          ? `Cool-down ${e.cooldown.dauerMin ? `${e.cooldown.dauerMin} Min.` : ""}${e.cooldown.beschreibung ? ` (${e.cooldown.beschreibung})` : ""}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {wochenplanBearbeiten && (
                      <button
                        type="button"
                        onClick={() => starteBearbeiten(e)}
                        title="Bearbeiten"
                        style={{ border: "none", background: "transparent", color: accentDark, fontSize: 15, cursor: "pointer", padding: "0 4px" }}
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => wochenplanEntfernen(e.id)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
