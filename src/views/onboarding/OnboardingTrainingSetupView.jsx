import React, { useState } from "react";
import { Shell, Card, Label, PrimaryButton, TextInput, Pill } from "../../ui/primitives";
import { cardBorder, textMuted, accentDark, accentSoft, danger } from "../../ui/theme";
import { TRAININGSARTEN } from "../../constants";
import WochenplanEditor from "../../ui/WochenplanEditor";
import { useT } from "../../i18n/translate";

/**
 * OnboardingTrainingSetupView: Trainings-Setup für Onboarding
 * Nutzer wählt:
 * 1. An welchen Wochentagen trainiert
 * 2. Für jeden Tag mehrere Trainingseinheiten zu verschiedenen Uhrzeiten
 * 3. Optional: Trainingsart und erste Übungen
 */
export default function OnboardingTrainingSetupView({
  trainingWochenplan,
  wochenplanSetzen,
  wochenplanEntfernen,
  trainingTemplates,
  onDone,
  onBack,
}) {
  const { t, tLabel } = useT();
  const [trainingsEinheiten, setTrainingsEinheiten] = useState([]);
  const [editingEinheit, setEditingEinheit] = useState(null);
  const [neuEinheit, setNeuEinheit] = useState({
    wochentag: "",
    uhrzeit: "08:00",
    art: "",
    name: "",
  });

  // Wochentage mit Trainingseinheiten
  const wochentageAusWochenplan = trainingWochenplan.map((w) => w.wochentag);

  const handleTrainingHinzufuegen = () => {
    if (!neuEinheit.wochentag || !neuEinheit.uhrzeit) {
      return;
    }
    const einheit = {
      id: `${neuEinheit.wochentag}-${neuEinheit.uhrzeit}-${Date.now()}`,
      ...neuEinheit,
      art: neuEinheit.art || "",
      name: neuEinheit.name || "",
    };
    setTrainingsEinheiten([...trainingsEinheiten, einheit]);
    setNeuEinheit({ wochentag: "", uhrzeit: "08:00", art: "", name: "" });
  };

  const handleTrainingEntfernen = (id) => {
    setTrainingsEinheiten(trainingsEinheiten.filter((e) => e.id !== id));
  };

  const groupedEinheiten = {};
  trainingsEinheiten.forEach((e) => {
    if (!groupedEinheiten[e.wochentag]) groupedEinheiten[e.wochentag] = [];
    groupedEinheiten[e.wochentag].push(e);
  });

  return (
    <Shell>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>🏋️ {tLabel("Training")}</div>
        <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.5 }}>
          {t("onboarding.training.intro", {
            defaultValue: "Lege fest, an welchen Tagen und zu welchen Uhrzeiten du trainieren möchtest. Du kannst mehrere Einheiten pro Tag planen.",
          })}
        </div>
      </div>

      {/* Schritt 1: Wochentage auswählen */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 12 }}>
          Schritt 1: Trainingstage wählen
        </div>
        <WochenplanEditor
          trainingWochenplan={trainingWochenplan}
          trainingTemplates={trainingTemplates}
          wochenplanSetzen={wochenplanSetzen}
          wochenplanEntfernen={wochenplanEntfernen}
          titel={null}
        />
      </div>

      {/* Schritt 2: Trainingseinheiten hinzufügen */}
      {wochentageAusWochenplan.length > 0 && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 12 }}>
              Schritt 2: Trainingseinheiten hinzufügen
            </div>

            <Card style={{ marginBottom: 16 }}>
              <Label>Wochentag</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {wochentageAusWochenplan.map((wt) => (
                  <Pill
                    key={wt}
                    label={tLabel(wt)}
                    selected={neuEinheit.wochentag === wt}
                    onClick={() => setNeuEinheit({ ...neuEinheit, wochentag: wt })}
                  />
                ))}
              </div>

              <Label>Uhrzeit</Label>
              <TextInput
                type="time"
                value={neuEinheit.uhrzeit}
                onChange={(v) => setNeuEinheit({ ...neuEinheit, uhrzeit: v })}
              />

              <Label>Trainingsart (optional)</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TRAININGSARTEN.map((art) => (
                  <Pill
                    key={art}
                    label={tLabel(art)}
                    selected={neuEinheit.art === art}
                    onClick={() => setNeuEinheit({ ...neuEinheit, art })}
                  />
                ))}
              </div>

              <Label>Trainingsname (z.B. "Leg Day", "HIIT", optional)</Label>
              <TextInput
                value={neuEinheit.name}
                onChange={(v) => setNeuEinheit({ ...neuEinheit, name: v })}
                placeholder="z.B. Brust & Trizeps"
              />

              <PrimaryButton
                onClick={handleTrainingHinzufuegen}
                disabled={!neuEinheit.wochentag || !neuEinheit.uhrzeit}
                style={{ marginTop: 12 }}
              >
                + Trainingseinheit hinzufügen
              </PrimaryButton>
            </Card>

            {/* Liste der hinzugefügten Trainingseinheiten */}
            {trainingsEinheiten.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 8 }}>
                  Deine Trainingseinheiten ({trainingsEinheiten.length}):
                </div>
                {Object.entries(groupedEinheiten).map(([wt, einheiten]) => (
                  <Card key={wt} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: accentDark }}>
                      {tLabel(wt)}
                    </div>
                    {einheiten.sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit)).map((e) => (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: einheiten.indexOf(e) < einheiten.length - 1 ? `1px solid ${cardBorder}` : "none",
                        }}
                      >
                        <div style={{ fontSize: 12, flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>
                            {e.uhrzeit} Uhr {e.name ? `· ${e.name}` : ""}
                          </div>
                          {e.art && <div style={{ fontSize: 11, color: textMuted }}>{tLabel(e.art)}</div>}
                        </div>
                        <button
                          onClick={() => handleTrainingEntfernen(e.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: danger,
                            fontSize: 16,
                            cursor: "pointer",
                            padding: "0 8px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Hinweis */}
          <div style={{ marginBottom: 20, padding: 12, borderRadius: 12, background: accentSoft, border: `1px solid ${cardBorder}`, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: accentDark }}>💡 {tLabel("Tipp")}</div>
            <div>
              {t("onboarding.training.detailHinweis", {
                defaultValue:
                  "Du hast genug für den Anfang eingegeben! Die genauen Übungen (Sätze, Wiederholungen, Gewicht) kannst du später im Trainings-Bereich hinzufügen — dort kannst du auch Cardio, Kraft, HIIT und Bodyweight kombinieren.",
              })}
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease-out",
            }}
          >
            {tLabel("Zurück")}
          </button>
        )}
      </div>
    </Shell>
  );
}
