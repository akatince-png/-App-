import React, { useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import { accent, blue, cardBorder, textMuted } from "../ui/theme";
import Logo from "../ui/Logo";

const SLIDES = [
  {
    icon: "🧬",
    titel: "Hi, herzlich willkommen bei MyProtocols!",
    text: "Schön, dass du dich für uns entschieden hast. Wir helfen dir dabei, Peptide, Medikamente, Supplemente, Gewohnheiten, Schlaf, Hydration, Ernährung und Training an einem Ort zu protokollieren — statt in Notizzetteln und deinem Kopf.",
  },
  {
    icon: "🗓️",
    titel: "So funktioniert's",
    text: "Dein Tagesplan zeigt dir jeden Tag genau, was ansteht — einmal antippen und abgehakt. Alle Details (Menge, Einnahmeart, Mischungen) findest du übersichtlich in Protokolle, wann immer du sie brauchst.",
  },
  {
    icon: "🚀",
    titel: "Einmal kurz investieren, langfristig Ruhe haben",
    text: "Ein paar Minuten heute, um dein Protokoll einzurichten — und danach hast du alles im Griff, ohne nachdenken zu müssen. Jeden Bereich kannst du einzeln jetzt einrichten oder überspringen und später nachholen. Los geht's!",
  },
];

export default function WelcomeView({ onDone }) {
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
          Überspringen
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
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>{slide.titel}</div>
        <div style={{ fontSize: 14, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>{slide.text}</div>
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
        <PrimaryButton onClick={() => (isLast ? onDone() : setIndex((i) => i + 1))}>{isLast ? "Los geht's" : "Weiter"}</PrimaryButton>
      </Card>
    </Shell>
  );
}
