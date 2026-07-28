import React from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { accent, accentDark, accentSoft, blue, cardBorder, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useT } from "../../i18n/translate";
import { useAppData } from "../../context/AppDataContext";
import { ISTZUSTAND_FRAGEN } from "./OnboardingCategoriesView";

// Kurzformel für die gewählte Zieldauer (siehe ZieldauerField/ZIEL_LEER) —
// "offen" heißt bewusst kein Enddatum, sonst die gewählte Wochenzahl.
function zieldauerText(ziel) {
  if (!ziel) return null;
  if (ziel.modus === "wochen" && ziel.wochen) return `${ziel.wochen} Wochen`;
  if (ziel.modus === "offen") return "Ohne festes Enddatum, dauerhaft";
  return null;
}

// Kurzer Klartext-Auszug dessen, was im Plan selbst steckt — je Kategorie
// aus dem, was categoryZiele beim Speichern mit abgelegt hat (siehe
// OnboardingCategoriesView: speichernUndWeiter). Bewusst nur die Felder, die
// ohne weitere Datenbank-Abfragen schon vorliegen — reicht für den
// Abschluss-Screen, ohne den Zeitrahmen zu sprengen.
function planInhaltText(kategorie, ziel) {
  if (kategorie === "schlaf" && Array.isArray(ziel?.bloecke) && ziel.bloecke.length > 0) {
    return ziel.bloecke.map((b) => `${b.bettzeit}–${b.aufwachzeit} Uhr`).join(", ");
  }
  return null;
}

// Abschluss-Screen nach dem Onboarding — ersetzt den bisherigen stillen
// Sprung zum Dashboard mit einem echten, positiven Abschluss-Moment.
// `eingerichteteBereiche`: Array aus { icon, label } — nur tatsächlich
// ausgefüllte Bereiche, übersprungene tauchen bewusst nicht auf (keine
// "0 von 8"-Beschämung). Für die fünf Ist-Zustand-Bereiche (siehe
// ISTZUSTAND_FRAGEN) zeigt diese Seite zusätzlich im Detail: den erfragten
// Ist-Zustand, die gewählte Zieldauer und — soweit schon in categoryZiele
// vorhanden — was der Plan selbst beinhaltet.
export default function OnboardingCompletionView({ eingerichteteBereiche, onDone, onBack }) {
  const { t, tLabel } = useT();
  const { categoryZiele } = useAppData();
  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={tLabel("Zurück")} onForward={onDone} forwardLabel={t("onboarding.completion.los")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            marginBottom: 20,
            boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
          }}
        >
          🎉
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
          {t("onboarding.completion.title")}
        </div>
        <div style={{ fontSize: 14, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
          {t("onboarding.completion.subtitle")}
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 10 }}>{t("onboarding.completion.eingerichtet")}</div>
        {eingerichteteBereiche.map((b) => {
          const ziel = categoryZiele?.[b.key];
          const fragen = ISTZUSTAND_FRAGEN[b.key];
          const beantwortet = fragen?.filter((f) => (ziel?.istZustand?.[f.key] || "").trim());
          const dauer = zieldauerText(ziel);
          const inhalt = planInhaltText(b.key, ziel);
          const hatDetail = (beantwortet && beantwortet.length > 0) || dauer || inhalt;
          return (
            <div key={b.label} style={{ padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: accentSoft,
                    color: accentDark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {b.icon} {tLabel(b.label)}
                </div>
              </div>
              {hatDetail && (
                <div style={{ marginTop: 8, marginLeft: 36, fontSize: 12.5, color: textMuted, lineHeight: 1.6 }}>
                  {beantwortet?.map((f) => (
                    <div key={f.key}>
                      <span style={{ fontWeight: 700, color: accentDark }}>{tLabel(f.frage)}</span> {ziel.istZustand[f.key]}
                    </div>
                  ))}
                  {dauer && (
                    <div>
                      <span style={{ fontWeight: 700, color: accentDark }}>{tLabel("Ziel:")}</span> {dauer}
                    </div>
                  )}
                  {inhalt && (
                    <div>
                      <span style={{ fontWeight: 700, color: accentDark }}>{tLabel("Plan:")}</span> {inhalt}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
        {t("onboarding.completion.rest")}
      </div>

      <Card>
        <PrimaryButton onClick={onDone} variant="success">
          {t("onboarding.completion.los")}
        </PrimaryButton>
      </Card>
    </Shell>
  );
}
