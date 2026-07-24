import React, { useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import { accent, blue, cardBorder, textMuted } from "../ui/theme";
import Logo from "../ui/Logo";
import { useT } from "../i18n/translate";

const SLIDES = [
  {
    icon: "🧬",
    titelKey: "welcome.slide1.titel",
    textKey: "welcome.slide1.text",
  },
  {
    icon: "🗓️",
    titelKey: "welcome.slide2.titel",
    textKey: "welcome.slide2.text",
  },
  {
    icon: "🚀",
    titelKey: "welcome.slide3.titel",
    textKey: "welcome.slide3.text",
  },
];

export default function WelcomeView({ onDone }) {
  const { t, tLabel } = useT();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          onClick={onDone}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          {t("welcome.skip")}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 28 }}>
        {index === 0 ? (
          <div style={{ marginBottom: 20 }}>
            <Logo size={72} />
          </div>
        ) : (
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
            {slide.icon}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>{t(slide.titelKey)}</div>
        <div style={{ fontSize: 14, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>{t(slide.textKey)}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: i === index ? accent : cardBorder,
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>

      <Card>
        <PrimaryButton onClick={() => (isLast ? onDone() : setIndex((i) => i + 1))}>{isLast ? t("welcome.button.los") : tLabel("Weiter")}</PrimaryButton>
      </Card>
    </Shell>
  );
}
