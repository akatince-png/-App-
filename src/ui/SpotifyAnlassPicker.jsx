import React, { useState } from "react";
import { Pill } from "./primitives";
import { textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";

// Ordnet eine der unter "Mehr → Musik" angelegten Spotify-Playlists einem
// festen Anlass zu (Morgenroutine, Abendroutine, Training, Gewohnheiten) —
// separat von Akas Rate-Logik im Chat (SPOTIFY_PLAY-Marker), die weiterhin
// unverändert funktioniert. Wiederverwendet in RoutineTabView.jsx,
// GewohnheitenView.jsx und TrainingView.jsx (13.08., Nachtrag).
export default function SpotifyAnlassPicker({ anlass, label = "🎵 Playlist" }) {
  const { spotifyVerbunden, spotifyPlaylists, spotifyAnlaesse, spotifyAnlassSetzen, spotifyAnlassEntfernen, spotifyAbspielen } = useAppData();
  const [testet, setTestet] = useState(false);
  const aktuelle = spotifyAnlaesse[anlass];
  const praefix = label ? `${label}: ` : "";

  if (!spotifyVerbunden) {
    return (
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 10 }}>
        {praefix}Verbinde zuerst Spotify unter "Mehr → Musik", um hier eine Playlist zuzuordnen.
      </div>
    );
  }

  if (spotifyPlaylists.length === 0) {
    return (
      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 10 }}>
        {praefix}Lege unter "Mehr → Musik" zuerst eine Playlist an, dann kannst du sie hier zuordnen.
      </div>
    );
  }

  const testen = async () => {
    if (!aktuelle?.uri) return;
    setTestet(true);
    await spotifyAbspielen(aktuelle.uri);
    setTestet(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      {label && <div style={{ fontSize: 11.5, fontWeight: 700, color: textMuted, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
        {spotifyPlaylists.map((p) => (
          <Pill key={p.id} label={p.name} selected={aktuelle?.playlistId === p.id} onClick={() => spotifyAnlassSetzen(anlass, p.id)} />
        ))}
        {aktuelle && <Pill label="✕ Keine" onClick={() => spotifyAnlassEntfernen(anlass)} />}
      </div>
      {aktuelle && (
        <button
          type="button"
          onClick={testen}
          disabled={testet}
          style={{ marginTop: 6, border: "none", background: "transparent", color: textMuted, fontSize: 11, fontWeight: 700, cursor: testet ? "not-allowed" : "pointer", padding: 0 }}
        >
          {testet ? "Startet…" : "▶️ Jetzt testen"}
        </button>
      )}
    </div>
  );
}
