import React, { useState } from "react";
import { Shell, PrimaryButton } from "../ui/primitives";
import { accent, cardBorder, textMain, textMuted } from "../ui/theme";
import OnboardingNavArrows from "../ui/OnboardingNavArrows";
import { KopfEntlastungIllustration, UebersichtIllustration, RuheIllustration } from "../ui/WelcomeIllustrations";
import { useT } from "../i18n/translate";
import { useLanguage, SUPPORTED_LANGS } from "../i18n/LanguageContext";

// Drei Willkommens-Folien vor dem eigentlichen Onboarding — bewusst neu
// gestaltet (Nutzerinnen-Vorgabe, 29.07.): nicht die Funktionen der App
// verkaufen, sondern das Gefühl transportieren "ich muss nicht mehr alles
// selbst im Kopf behalten". Referenz: Apple/Headspace/Notion-Onboarding —
// ruhig, viel Weißraum, eine Illustration statt Icon-Emoji, wenig Text.
const SLIDES = [
  { Illustration: KopfEntlastungIllustration, titelKey: "welcome.slide1.titel", textKey: "welcome.slide1.text" },
  { Illustration: UebersichtIllustration, titelKey: "welcome.slide2.titel", textKey: "welcome.slide2.text" },
  { Illustration: RuheIllustration, titelKey: "welcome.slide3.titel", textKey: "welcome.slide3.text" },
];

export default function WelcomeView({ onDone, onCancel }) {
  const { t, tLabel, lang } = useT();
  const { setLang } = useLanguage();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const weiter = () => (isLast ? onDone() : setIndex((i) => i + 1));

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingTop: 4, paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {SUPPORTED_LANGS.map((langCode) => (
            <button
              key={langCode}
              onClick={() => setLang(langCode)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: `1px solid ${cardBorder}`,
                background: lang === langCode ? "#1E2B29" : "#fff",
                color: lang === langCode ? "#fff" : "#6B7280",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {langCode.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={onDone}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "8px 12px" }}
        >
          {t("welcome.skip")}
        </button>
      </div>

      <OnboardingNavArrows
        onBack={index > 0 ? () => setIndex((i) => i - 1) : undefined}
        backLabel={tLabel("Zurück")}
        onForward={weiter}
        forwardLabel={isLast ? t("welcome.button.los") : tLabel("Weiter")}
      />

      {/* key={index} sorgt dafür, dass die fadeInUp-Animation (siehe
          index.css) bei jedem Folienwechsel neu anläuft, statt nur beim
          allerersten Rendern. */}
      <div
        key={index}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 40,
          marginBottom: 40,
          animation: "fadeInUp 0.45s ease-out",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <slide.Illustration size={132} />
        </div>
        <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.3, textAlign: "center", maxWidth: 300, color: textMain }}>
          {t(slide.titelKey)}
        </div>
        <div style={{ fontSize: 15, color: textMuted, textAlign: "center", lineHeight: 1.7, maxWidth: 300, marginTop: 16, whiteSpace: "pre-wrap" }}>
          {t(slide.textKey)}
        </div>
        {isLast && (
          <div style={{ fontSize: 15, fontWeight: 700, color: textMain, textAlign: "center", lineHeight: 1.6, maxWidth: 280, marginTop: 22 }}>
            {t("welcome.slide3.abschluss")}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 28 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: 4,
              background: i === index ? accent : cardBorder,
              transition: "all 0.25s ease",
            }}
          />
        ))}
      </div>

      <PrimaryButton onClick={weiter}>{isLast ? t("welcome.button.los") : tLabel("Weiter")}</PrimaryButton>

      {onCancel && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer", padding: "8px 12px" }}
          >
            {t("mehr.konto.abmelden")}
          </button>
        </div>
      )}
    </Shell>
  );
}
