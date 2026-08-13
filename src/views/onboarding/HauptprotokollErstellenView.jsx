import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../../ui/primitives";
import { accent, blue, cardBorder, danger, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useAppData } from "../../context/AppDataContext";
import { useT } from "../../i18n/translate";
import { toLocalISODate } from "../../utils/dates";

const BEISPIELE = [
  "Sommer 2026",
  "Muskelaufbau",
  "Gesundheitsreise",
  "Vorbereitung OP",
  "Marathon 2026",
  "Stoffwechseloptimierung",
];

// Erster Schritt vor allen Kategorien, sowohl beim echten Erst-Onboarding als
// auch beim späteren "Neues Protokoll" (+"-Button bei bestehenden Konten):
// das Hauptprotokoll bekommt einen Namen und ein Startdatum, bevor irgendein
// Teilprotokoll (Schlaf, Ernährung, ...) eingerichtet wird. Dieses Startdatum
// ist danach die Vorbelegung für jedes Teilprotokoll, falls dort kein
// eigenes, abweichendes Startdatum gewählt wird.
//
// `zeigeBestehendesAlsOption` (13.08., Nachtrag): Nutzerinnen-Bug-Report —
// jeder erneute Durchlauf des Onboardings (z. B. über "Onboarding erneut
// durchlaufen" in Mehr, zum Testen) landete stillschweigend wieder hier und
// legte JEDES Mal ein frisches Hauptprotokoll an, wobei das eigentlich noch
// laufende automatisch archiviert wurde (`hauptprotokollErstellen` in
// useHauptprotokollData.js archiviert das bisherige aktive immer beim
// Anlegen eines neuen). Ist ein Hauptprotokoll schon aktiv, wird jetzt
// zuerst "Weiter mit diesem Protokoll" angeboten, statt ungefragt ein neues
// zu erzeugen — nur der explizite "+"-Button ("Neues Protokoll",
// `startPhase="hauptprotokoll"` in AuthenticatedApp.jsx) bekommt dieses Prop
// NICHT gesetzt, weil genau dort ein neues Protokoll der ausdrückliche
// Zweck ist.
export default function HauptprotokollErstellenView({ onDone, onBack, onCancel, zeigeBestehendesAlsOption = false }) {
  const { hauptprotokollErstellen, verknuepfeMitHauptprotokoll, aktivesHauptprotokoll } = useAppData();
  const { t, tLabel } = useT();
  const gibtBestehendesAnGeboten = zeigeBestehendesAlsOption && !!aktivesHauptprotokoll;
  const [modus, setModus] = useState(gibtBestehendesAnGeboten ? "bestehend" : "neu");
  const [name, setName] = useState("");
  const [startdatum, setStartdatum] = useState(toLocalISODate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name.trim()) {
      setError(t("hauptprotokoll.error.name"));
      return;
    }
    setError(null);
    setSaving(true);
    const result = await hauptprotokollErstellen({ name, startdatum });
    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || t("hauptprotokoll.error.speichern"));
      return;
    }
    // Peptid-Protokoll (protocols) ist die einzige Kategorie mit eigenem
    // "ein aktives Protokoll"-Modell statt einer einfachen Katalogtabelle —
    // wird deshalb hier nachträglich verknüpft statt schon bei seiner
    // eigenen (oft früheren) Erstellung.
    if (result.hauptprotokoll?.id) {
      verknuepfeMitHauptprotokoll(result.hauptprotokoll.id);
    }
    onDone();
  };

  if (modus === "bestehend" && aktivesHauptprotokoll) {
    return (
      <Shell>
        <OnboardingNavArrows onBack={onBack} backLabel={tLabel("Zurück")} onForward={onDone} forwardLabel={t("hauptprotokoll.weiter")} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${accent}, ${blue})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 16,
              boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
            }}
          >
            📋
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>{t("hauptprotokoll.bestehend.titel")}</div>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>{t("hauptprotokoll.bestehend.hinweis")}</div>
        </div>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{aktivesHauptprotokoll.name}</div>
          {aktivesHauptprotokoll.startdatum && (
            <div style={{ fontSize: 12.5, color: textMuted }}>seit {aktivesHauptprotokoll.startdatum}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            <PrimaryButton onClick={onDone}>{t("hauptprotokoll.bestehend.weiter", { name: aktivesHauptprotokoll.name })}</PrimaryButton>
            <button
              type="button"
              onClick={() => setModus("neu")}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: `1px solid ${cardBorder}`,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("hauptprotokoll.bestehend.neuAnlegen")}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "transparent",
                  color: textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tLabel("Abbrechen")}
              </button>
            )}
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <OnboardingNavArrows
        onBack={onBack}
        backLabel={tLabel("Zurück")}
        onForward={submit}
        forwardLabel={saving ? t("onboarding.saving") : t("hauptprotokoll.weiter")}
        forwardDisabled={saving}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
            boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
          }}
        >
          📋
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>{t("hauptprotokoll.titel")}</div>
        <div style={{ fontSize: 13, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>{t("hauptprotokoll.intro")}</div>
      </div>

      <Card>
        <Label>{t("hauptprotokoll.name.label")}</Label>
        <TextInput value={name} onChange={setName} placeholder={t("hauptprotokoll.name.placeholder")} />
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
          {BEISPIELE.map((b) => (
            <Pill key={b} label={b} selected={name === b} onClick={() => setName(b)} />
          ))}
        </div>

        <Label>{t("hauptprotokoll.startdatum.label")}</Label>
        <TextInput type="date" value={startdatum} onChange={setStartdatum} />
        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{t("hauptprotokoll.startdatum.hinweis")}</div>

        {error && <div style={{ color: danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <PrimaryButton onClick={submit} disabled={saving}>
            {saving ? t("onboarding.saving") : t("hauptprotokoll.weiter")}
          </PrimaryButton>
          {gibtBestehendesAnGeboten && (
            <button
              type="button"
              onClick={() => setModus("bestehend")}
              style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "transparent", color: accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {t("hauptprotokoll.neu.zurueck")}
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: `1px solid ${cardBorder}`,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
            >
              {tLabel("Abbrechen")}
            </button>
          )}
        </div>
      </Card>
    </Shell>
  );
}
