import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../../ui/primitives";
import { accent, blue, danger, textMuted } from "../../ui/theme";
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
export default function HauptprotokollErstellenView({ onDone }) {
  const { hauptprotokollErstellen } = useAppData();
  const { t } = useT();
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
    onDone();
  };

  return (
    <Shell>
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

        <div style={{ marginTop: 18 }}>
          <PrimaryButton onClick={submit} disabled={saving}>
            {saving ? t("onboarding.saving") : t("hauptprotokoll.weiter")}
          </PrimaryButton>
        </div>
      </Card>
    </Shell>
  );
}
