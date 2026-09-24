import React, { useEffect, useRef } from "react";
import { accentSoft, textMain, textMuted } from "./theme";

// Reine CSS-Scroll-Snap-Wheel (kein Modal, keine neue Abhängigkeit) —
// tippen öffnet das Feld inline, hochscrollen wählt den Wert, loslassen
// rastet ein. Ersetzt getippte Zahlen-/Zeit-Felder, wo die Werte aus
// einem kleinen, festen Bereich stammen (siehe NumberWheelField/TimeWheelField).
// tippt/vibriert kurz bei jeder Wertänderung — ersetzt das fehlende
// haptische Feedback eines nativen Pickers, wo die Plattform es unterstützt.
function hapticTick() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(8);
  }
}

export default function WheelPicker({ values, value, onChange, itemHeight = 54, visibleCount = 5 }) {
  const scrollRef = useRef(null);
  const settleTimer = useRef(null);
  const justClickedRef = useRef(false);
  // Merkt sich den Index, auf den die Scroll-Position zuletzt (durch uns
  // selbst, per Tap oder Scroll-Snap) ausgerichtet wurde. `null` erzwingt
  // beim allerersten Rendern den initialen Sprung.
  const lastKnownIndexRef = useRef(null);
  const padCount = Math.floor(visibleCount / 2);
  const height = itemHeight * visibleCount;
  const index = Math.max(0, values.indexOf(value));

  // Bug-Fix: lief bisher nur einmal beim Mount ([]-Deps trotz Kommentar
  // "bei externem Wertwechsel ... springen"). Änderte sich `value` von
  // außen, während dieselbe WheelPicker-Instanz offen blieb (z. B. der Coach
  // füllt das Feld, oder ein Supabase-Roundtrip bringt einen aktualisierten
  // Wert zurück), sprang die Scroll-Position nie mit — der fett hervor-
  // gehobene Wert (der reaktiv aus der Prop berechnet wird) und die
  // physische Position liefen auseinander. Jetzt reagiert der Effekt auf
  // `index`, überspringt den Sprung aber, wenn die Position bereits durch
  // einen eigenen Tap/Scroll-Snap auf denselben Index gebracht wurde (siehe
  // lastKnownIndexRef-Updates unten) — so kollidiert er nicht mit einer
  // gerade laufenden Nutzer-Interaktion.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (lastKnownIndexRef.current === index) return;
    lastKnownIndexRef.current = index;
    el.scrollTo({ top: index * itemHeight, behavior: "instant" });
  }, [index, itemHeight]);

  // Bug-Fix ("Picker hakt beim Scrollen"): der feste 120ms-Debounce-Timer
  // feuerte öfter noch WÄHREND der Browser sein eigenes CSS-Scroll-Snapping
  // (scrollSnapType) zu Ende animierte — die dadurch ausgelöste zusätzliche
  // `scrollTo({behavior:"smooth"})` lief der noch laufenden nativen
  // Snap-Animation entgegen, was sich als kurzes Stocken/Ruckeln anfühlte.
  // Das native `scrollend`-Event (breit unterstützt: Chrome/Edge/Firefox,
  // Safari ab 17.4) feuert erst, wenn wirklich nichts mehr in Bewegung ist
  // — dort reicht ein reines Auslesen der Endposition, ohne der bereits
  // korrekt eingerasteten Snap-Animation selbst noch hinterherzuscrollen.
  // Der Debounce-Timer bleibt als Fallback für ältere Safari-Versionen ohne
  // `scrollend`.
  const scrollEndUnterstuetzt = typeof window !== "undefined" && "onscrollend" in window;

  const werteUebernehmen = (erzwingeSnap) => {
    // Ein Tap hat onChange bereits mit dem korrekten Wert aufgerufen —
    // das Scroll-Snapping, das der Tap selbst über scrollTo auslöst, darf
    // diesen Wert nicht mit einem (durch Snap-Verhalten abweichenden)
    // Scroll-Endpunkt überschreiben.
    if (justClickedRef.current) {
      justClickedRef.current = false;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const nextIndex = Math.round(el.scrollTop / itemHeight);
    const clamped = Math.min(values.length - 1, Math.max(0, nextIndex));
    lastKnownIndexRef.current = clamped;
    // Nur noch korrigierend nachscrollen, wenn die native Snap-Rundung
    // tatsächlich daneben liegt (z. B. Browser ohne `scrollend`, wo wir
    // etwas früher/später als der exakte Snap-Punkt messen) — sitzt die
    // Position schon exakt richtig, entfällt die zusätzliche Animation.
    if (erzwingeSnap && el.scrollTop !== clamped * itemHeight) {
      el.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
    }
    if (values[clamped] !== value) {
      onChange(values[clamped]);
      hapticTick();
    }
  };

  const handleScroll = () => {
    if (scrollEndUnterstuetzt) return; // übernimmt onScrollEndCapture unten
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => werteUebernehmen(true), 180);
  };

  const handleScrollEnd = () => werteUebernehmen(true);

  return (
    <div style={{ position: "relative", height }}>
      <div
        style={{
          position: "absolute",
          top: padCount * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
          background: accentSoft,
          borderRadius: 10,
          pointerEvents: "none",
        }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onScrollEnd={handleScrollEnd}
        className="mp-wheel"
        style={{
          height,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          position: "relative",
        }}
      >
        <div style={{ height: padCount * itemHeight }} />
        {values.map((v, i) => {
          const dist = Math.abs(i - index);
          return (
            <div
              key={v}
              className="mp-wheel-item"
              onClick={() => {
                justClickedRef.current = true;
                lastKnownIndexRef.current = i;
                const el = scrollRef.current;
                if (el) el.scrollTo({ top: i * itemHeight, behavior: "smooth" });
                if (v !== value) {
                  onChange(v);
                  hapticTick();
                }
              }}
              style={{
                height: itemHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scrollSnapAlign: "center",
                fontSize: dist === 0 ? 24 : 18,
                fontWeight: dist === 0 ? 800 : 600,
                color: dist === 0 ? textMain : textMuted,
                opacity: dist === 0 ? 1 : Math.max(0.35, 1 - dist * 0.3),
                cursor: "pointer",
              }}
            >
              {v}
            </div>
          );
        })}
        <div style={{ height: padCount * itemHeight }} />
      </div>
    </div>
  );
}
