import React from "react";

// Gezeichnete Mikrofon-/Stop-Icons statt Emoji — geteilt zwischen KiChat.jsx
// und OnboardingCoachGuide.jsx, damit Sprachbedienung überall gleich aussieht.
export function MikrofonIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8.5" y="2" width="7" height="13" rx="3.5" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M12 18v3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.3 21.2h7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StopIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  );
}
