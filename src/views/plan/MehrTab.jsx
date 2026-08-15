import React, { useState } from "react";
import { Card, Label, Pill, TextInput } from "../../ui/primitives";
import { accentDark, accentSoft, cardBorder, danger, success, textMuted } from "../../ui/theme";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useT } from "../../i18n/translate";
import { CATEGORY_STEPS } from "../onboarding/categorySteps";
import VorlaufFeld from "../../ui/VorlaufFeld";

// Morgen-/Abendroutine und Workout-Flow sind keine der 8 Onboarding-
// Kategorien (categorySteps.js — die haben je eigene Einrichtungs-Screens,
// die es für diese drei nicht gibt), deshalb separat gehalten statt dort
// mit reingemischt. Erinnerungen dafür funktionieren aber nach demselben
// Muster (erinnerungen[key] = {aktiv, vorlaufMinuten}), s. u. — Nutzerinnen-
// Vorgabe (15.08., spätabends): "auch für Morgenroutine, Abendroutine,
// Workout-Flow" (zusätzlich zu den bereits bestehenden Kategorien).
// mitTagen bei workflow, weil workflow_plaene wie training_wochenplan echte
// Wochentage kennt — Morgen-/Abendroutine laufen dagegen ohne Wochentag,
// täglich zum selben Zeitrahmen-Start (routine_einstellungen).
const WEITERE_ERINNERUNGEN = [
  { key: "morgenroutine", icon: "🌅", label: "Morgenroutine" },
  { key: "abendroutine", icon: "🌆", label: "Abendroutine" },
  { key: "workflow", icon: "🔁", label: "Workout-Flow", mitTagen: true },
];
import { AIService } from "../../services/aiService";
import { getCoachName, saveCoachName, STANDARD_COACH_NAME, getKiAktiv, saveKiAktiv } from "../../utils/coachStorage";
import { spotifyAutorisierenUrl, spotifyPlaylistUriNormalisieren } from "../../services/spotify";

// Bausteine des aktiven Hauptprotokolls, an-/abschaltbar ohne den kompletten
// Onboarding-Assistenten (der dabei archiviert + neu anlegt) durchlaufen zu
// müssen (Nutzerinnen-Vorgabe, 15.08. — bewusst HIER unter "Mehr" statt in
// "Archiv": Archiv soll nur fertige/abgeschlossene Protokolle zeigen, hier
// ist der Ort fürs laufende, bearbeitbare Protokoll). Schlaf & Hydration
// sind bewusst nicht abschaltbar ("Kernessenz"), Morgen-/Abendroutine
// erscheinen hier gar nicht — die sind keine teilprotokolle (siehe
// RoutineTabView.jsx), sondern ohnehin immer erreichbar. Jede Änderung
// landet zusätzlich im Tagesverlauf (Archiv → Protokolle) — funktioniert
// unverändert, wenn ein Admin das Protokoll einer Coachee im
// "Verwalten"-Modus bearbeitet.
const BAUSTEINE_KATEGORIEN = [
  { kategorie: "schlaf", label: "Schlaf", kern: true },
  { kategorie: "hydration", label: "Hydration", kern: true },
  { kategorie: "tageslicht", label: "Tageslicht", kern: false },
  { kategorie: "ernaehrung", label: "Ernährung", kern: false },
  { kategorie: "training", label: "Training", kern: false },
  { kategorie: "gewohnheiten", label: "Gewohnheiten", kern: false },
  { kategorie: "supplemente", label: "Supplemente", kern: false },
  { kategorie: "medikamente", label: "Medikamente", kern: false },
];

// Baut den Schnappschuss der aktuell geltenden Werte je Kategorie — reine
// Snapshots (kein automatisches Diffing), ausgelöst über "Version
// festhalten" (Nutzerinnen-Vorgabe, 15.08.: "die alte Einstellung soll noch
// abgespeichert sein, wenn ich was verändere"). Felder direkt aus den
// jeweiligen Kategorie-Hooks, siehe deren return-Objekte.
function snapshotFuer(kategorie, appData) {
  switch (kategorie) {
    case "schlaf":
      return appData.categoryZiele?.schlaf || null;
    case "hydration":
      return { zielMl: appData.hydrationZielMl };
    case "tageslicht":
      return { zielMinuten: appData.tageslichtZielMinuten };
    case "ernaehrung":
      return { mahlzeiten: appData.mahlzeiten, mealWochenplan: appData.mealWochenplan };
    case "training":
      return { trainingWochenplan: appData.trainingWochenplan };
    case "gewohnheiten":
      return { gewohnheiten: appData.gewohnheiten };
    case "supplemente":
      return { supplemente: appData.supplemente };
    case "medikamente":
      return { hormone: appData.hormone };
    default:
      return null;
  }
}

function AktuellesProtokoll() {
  const appData = useAppData();
  const { aktivesHauptprotokoll, teilprotokolle, teilprotokollSpeichern, aenderungVermerken, versionFesthalten } = appData;
  const [versionLaeuft, setVersionLaeuft] = useState(null); // kategorie | null

  if (!aktivesHauptprotokoll) return null;

  const zeileFuer = (kategorie) => teilprotokolle.find((t) => t.hauptprotokoll_id === aktivesHauptprotokoll.id && t.kategorie === kategorie);

  const versionFuerBausteinFesthalten = async (b) => {
    const notiz = window.prompt(`Kurze Notiz zu dieser Version von "${b.label}" (optional):`, "");
    if (notiz === null) return; // abgebrochen
    setVersionLaeuft(b.kategorie);
    const snapshot = snapshotFuer(b.kategorie, appData);
    const result = await versionFesthalten(aktivesHauptprotokoll.id, b.kategorie, snapshot, notiz);
    setVersionLaeuft(null);
    if (result?.ok) {
      aenderungVermerken({
        kategorie: "protokoll",
        itemName: b.label,
        aktion: "Version festgehalten",
        detail: notiz || `Aktuelle Einstellung von „${b.label}" gesichert`,
      });
    }
  };

  const seitWoche = (kategorie) => {
    const zeile = zeileFuer(kategorie);
    if (!zeile?.aktiv || !zeile.aktiviert_am) return null;
    const start = new Date(aktivesHauptprotokoll.startdatum);
    const aktiviert = new Date(zeile.aktiviert_am);
    const wochen = Math.floor((aktiviert - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, wochen);
  };

  const umschalten = (b) => {
    const bestehend = zeileFuer(b.kategorie);
    const naechsterZustand = !(bestehend?.aktiv ?? false);
    teilprotokollSpeichern(aktivesHauptprotokoll.id, b.kategorie, {
      aktiv: naechsterZustand,
      eigenerStartdatum: bestehend?.eigenes_startdatum ?? null,
      laufzeitWochen: bestehend?.laufzeit_wochen ?? null,
    });
    aenderungVermerken({
      kategorie: "protokoll",
      itemName: b.label,
      aktion: naechsterZustand ? "aktiviert" : "deaktiviert",
      detail: `Baustein im Protokoll „${aktivesHauptprotokoll.name}"`,
    });
  };

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>📋 Aktuelles Protokoll: {aktivesHauptprotokoll.name}</div>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10, lineHeight: 1.5 }}>
        Bausteine an-/ausschalten. Zum Bearbeiten der Inhalte in "Alle Pläne" auf den passenden Reiter tippen. "📌" hält die
        aktuelle Einstellung als Version fest, bevor du sie änderst — sichtbar unter Archiv → Protokolle. Jede Änderung
        erscheint zusätzlich im Tagesverlauf dort.
      </div>
      <Card style={{ marginBottom: 20 }}>
        {BAUSTEINE_KATEGORIEN.map((b, i) => {
          const aktiv = b.kern || !!zeileFuer(b.kategorie)?.aktiv;
          const woche = b.kern ? 1 : seitWoche(b.kategorie);
          return (
            <div
              key={b.kategorie}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < BAUSTEINE_KATEGORIEN.length - 1 ? `1px solid ${cardBorder}` : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{b.label}</div>
                {aktiv && woche && <div style={{ fontSize: 10.5, color: textMuted, marginTop: 1 }}>Seit Woche {woche}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => versionFuerBausteinFesthalten(b)}
                  disabled={versionLaeuft === b.kategorie}
                  title="Aktuelle Einstellung als Version festhalten"
                  style={{
                    border: `1px solid ${cardBorder}`,
                    background: "#fff",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    fontSize: 13,
                    cursor: versionLaeuft === b.kategorie ? "wait" : "pointer",
                    opacity: versionLaeuft === b.kategorie ? 0.5 : 1,
                  }}
                >
                  📌
                </button>
                {b.kern ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: accentDark, background: accentSoft, padding: "4px 10px", borderRadius: 10 }}>
                    Immer aktiv
                  </span>
                ) : (
                  <Pill label={aktiv ? "Aktiv" : "Inaktiv"} selected={aktiv} onClick={() => umschalten(b)} />
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}

export default function MehrTab({ onOpenLexikon, onOpenAdmin }) {
  const { signOut, user } = useAuth();
  const {
    resetOnboarding,
    pushUnterstuetzt,
    pushAktiv,
    pushLadend,
    pushFehler,
    pushAktivieren,
    pushDeaktivieren,
    pushTestSenden,
    erinnerungen,
    setErinnerung,
    spotifyVerbunden,
    spotifyPlaylists,
    spotifyPlaylistHinzufuegen,
    spotifyPlaylistLoeschen,
    spotifyVerbindungTrennen,
    spotifyAbspielen,
    spotifyTestet,
    spotifyFehler,
    spotifyAutoPlayToken,
    spotifyAutoPlayTokenErzeugen,
    spotifyVerbindungFehler,
  } = useAppData();
  const { lang, setLang } = useLanguage();
  const { t, tLabel } = useT();
  const [resetMsg, setResetMsg] = useState(null);
  // Ohne sofortige sichtbare Reaktion tippt man bei der vollen Weiterleitung
  // zu Spotify (die ein paar Sekunden dauern kann) leicht nochmal — dann
  // startet ein zweiter Anmelde-Durchlauf parallel, dessen Code beim
  // Rücksprung schon verbraucht ist (Bug-Report: "ich drücke drauf, es
  // reagiert nicht", mehrere Aufrufe kurz hintereinander in den Supabase-
  // Invocations sichtbar). Sperrt den Knopf daher direkt nach dem ersten Tap.
  const [spotifyVerbindungWirdGestartet, setSpotifyVerbindungWirdGestartet] = useState(false);
  const [testMsg, setTestMsg] = useState(null);
  const [neuerPlaylistName, setNeuerPlaylistName] = useState("");
  const [neuerPlaylistLink, setNeuerPlaylistLink] = useState("");
  const [playlistFehler, setPlaylistFehler] = useState(null);
  const [testetPlaylistId, setTestetPlaylistId] = useState(null);
  const [autoPlayLaedt, setAutoPlayLaedt] = useState(false);
  const [autoPlayKopiert, setAutoPlayKopiert] = useState(false);
  const [kiLadend, setKiLadend] = useState(false);
  const [kiAntwort, setKiAntwort] = useState(null);
  const [kiFehler, setKiFehler] = useState(null);
  const [coachName, setCoachNameState] = useState(getCoachName());
  const [kiAktiv, setKiAktivState] = useState(() => getKiAktiv());

  const handleKiAktivUmschalten = (next) => {
    setKiAktivState(next);
    saveKiAktiv(next);
  };

  const DATENSCHUTZ = ["mehr.datenschutz.1", "mehr.datenschutz.2", "mehr.datenschutz.3", "mehr.datenschutz.4", "mehr.datenschutz.5"];
  const ERWEITERUNGEN = ["mehr.erweiterungen.1", "mehr.erweiterungen.2", "mehr.erweiterungen.3", "mehr.erweiterungen.4"];

  const handleResetOnboarding = async () => {
    setResetMsg(null);
    const result = await resetOnboarding();
    if (!result?.ok) {
      setResetMsg(result?.error || t("mehr.testen.reset.error"));
      return;
    }
    // Setzt u. a. Peptid-Protokoll, Gewohnheiten, Mahlzeiten, Supplemente
    // und Medikamente serverseitig zurück — ein voller Reload lädt die App
    // komplett neu und landet dadurch direkt wieder im Willkommens-Flow,
    // statt dass der Nutzer sich extra ab- und wieder anmelden muss.
    window.location.reload();
  };

  const handleTestSenden = async () => {
    setTestMsg(null);
    const result = await pushTestSenden();
    setTestMsg(result?.ok ? t("mehr.push.test.success") : result?.error || t("mehr.push.test.error"));
  };

  const handlePlaylistHinzufuegen = async () => {
    setPlaylistFehler(null);
    if (!neuerPlaylistName.trim() || !neuerPlaylistLink.trim()) {
      setPlaylistFehler("Bitte Name und Link eintragen.");
      return;
    }
    const result = await spotifyPlaylistHinzufuegen(neuerPlaylistName, spotifyPlaylistUriNormalisieren(neuerPlaylistLink));
    if (!result.ok) {
      setPlaylistFehler(result.error);
      return;
    }
    setNeuerPlaylistName("");
    setNeuerPlaylistLink("");
  };

  const handlePlaylistTesten = async (playlist) => {
    setTestetPlaylistId(playlist.id);
    await spotifyAbspielen(playlist.uri);
    setTestetPlaylistId(null);
  };

  const handleAutoPlayTokenErzeugen = async () => {
    setAutoPlayLaedt(true);
    await spotifyAutoPlayTokenErzeugen();
    setAutoPlayLaedt(false);
  };

  const autoPlayUrl = spotifyAutoPlayToken
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spotify-play?token=${spotifyAutoPlayToken}`
    : null;

  const handleAutoPlayUrlKopieren = async () => {
    if (!autoPlayUrl) return;
    await navigator.clipboard.writeText(autoPlayUrl);
    setAutoPlayKopiert(true);
    setTimeout(() => setAutoPlayKopiert(false), 2000);
  };

  // Erster Testaufruf des ADHS-Coach-Moduls direkt aus der App heraus — prüft
  // die ganze Kette (Vercel-ENV → Browser → Ollama) ohne eigene Testseite.
  const handleKiTest = async () => {
    setKiLadend(true);
    setKiAntwort(null);
    setKiFehler(null);
    try {
      const antwort = await AIService.morgenImpuls({ coachName });
      setKiAntwort(antwort);
    } catch (err) {
      setKiFehler(err.message);
    } finally {
      setKiLadend(false);
    }
  };

  return (
    <>
      {onOpenLexikon && (
        <button
          onClick={onOpenLexikon}
          className="mp-tap"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px",
            borderRadius: 14,
            border: `1px solid ${cardBorder}`,
            background: "#fff",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>{t("mehr.lexikon")}</span>
          <span style={{ color: textMuted, fontSize: 16 }}>›</span>
        </button>
      )}

      {onOpenAdmin && (
        <button
          onClick={onOpenAdmin}
          className="mp-tap"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px",
            borderRadius: 14,
            border: `1px solid ${cardBorder}`,
            background: "#fff",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>Admin-Dashboard</span>
          <span style={{ color: textMuted, fontSize: 16 }}>›</span>
        </button>
      )}

      <AktuellesProtokoll />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.sprache")}</div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex" }}>
          <Pill label={t("common.language.de")} selected={lang === "de"} onClick={() => setLang("de")} />
          <Pill label={t("common.language.en")} selected={lang === "en"} onClick={() => setLang("en")} />
          <Pill label={t("common.language.tr")} selected={lang === "tr"} onClick={() => setLang("tr")} />
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.erinnerungen")}</div>
      <Card style={{ marginBottom: 14 }}>
        {!pushUnterstuetzt ? (
          <div style={{ fontSize: 13, color: textMuted }}>{t("mehr.push.unsupported")}</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("mehr.push.intro")}</div>
            <button
              onClick={pushAktiv ? pushDeaktivieren : pushAktivieren}
              disabled={pushLadend}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: pushAktiv ? `1px solid ${danger}` : "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: pushLadend ? "not-allowed" : "pointer",
                background: pushAktiv ? "#fff" : accentDark,
                color: pushAktiv ? danger : "#fff",
              }}
            >
              {pushLadend ? t("mehr.push.loading") : pushAktiv ? t("mehr.push.deaktivieren") : t("mehr.push.aktivieren")}
            </button>
            {pushFehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{pushFehler}</div>}
            {pushAktiv && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={handleTestSenden}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: `1px solid ${accentDark}`, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "#fff", color: accentDark }}
                >
                  {t("mehr.push.test")}
                </button>
                {testMsg && <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>{testMsg}</div>}
              </div>
            )}
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>{t("mehr.erinnerungen.kategorien.intro")}</div>
        {[...CATEGORY_STEPS, ...WEITERE_ERINNERUNGEN].map((step, i, alle) => {
          const wert = erinnerungen[step.key];
          const vorlaufMinuten = wert && typeof wert === "object" ? wert.vorlaufMinuten : undefined;
          const setVorlauf = (minuten) => {
            const bestehend = wert && typeof wert === "object" ? wert : {};
            setErinnerung(step.key, { ...bestehend, aktiv: true, vorlaufMinuten: minuten });
          };
          return (
            <div
              key={step.key}
              style={{
                padding: "10px 0",
                borderBottom: i < alle.length - 1 ? `1px solid ${cardBorder}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700 }}>
                  <span>{step.icon}</span>
                  <span>{tLabel(step.label)}</span>
                </div>
                <Pill
                  label={wert ? t("common.erinnerung.ja") : t("common.erinnerung.nein")}
                  selected={!!wert}
                  onClick={() => setErinnerung(step.key, !wert)}
                />
              </div>
              {wert && (
                <VorlaufFeld
                  value={vorlaufMinuten}
                  onChange={setVorlauf}
                  mitTagen={step.mitTagen ?? (step.key === "training" || step.key === "ernaehrung")}
                />
              )}
            </div>
          );
        })}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Musik (Spotify)</div>
      <Card style={{ marginBottom: 20 }}>
        {!spotifyVerbunden ? (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
              Verbinde Spotify, damit dein Assistent deine Playlist starten kann — z. B. morgens zum Aufwachen. Braucht ein
              Spotify-Premium-Konto.
            </div>
            <button
              type="button"
              disabled={spotifyVerbindungWirdGestartet}
              onClick={() => {
                setSpotifyVerbindungWirdGestartet(true);
                window.location.assign(spotifyAutorisierenUrl());
              }}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: spotifyVerbindungWirdGestartet ? "default" : "pointer",
                background: accentDark,
                color: "#fff",
                opacity: spotifyVerbindungWirdGestartet ? 0.6 : 1,
              }}
            >
              {spotifyVerbindungWirdGestartet ? "Verbinde …" : "Mit Spotify verbinden"}
            </button>
            {spotifyVerbindungWirdGestartet && (
              <div style={{ fontSize: 11.5, color: textMuted, marginTop: 8 }}>
                Du wirst zu Spotify weitergeleitet — das kann ein paar Sekunden dauern. Bitte nicht nochmal tippen.
              </div>
            )}
            {spotifyVerbindungFehler && (
              <div style={{ fontSize: 12, color: danger, marginTop: 10, lineHeight: 1.5 }}>{spotifyVerbindungFehler}</div>
            )}
            <div style={{ fontSize: 10.5, color: textMuted, marginTop: 10, wordBreak: "break-all" }}>
              Diagnose: Spotify-App-ID ist {import.meta.env.VITE_SPOTIFY_CLIENT_ID ? "hinterlegt" : "NICHT hinterlegt"}
              {import.meta.env.VITE_SPOTIFY_CLIENT_ID ? ` (endet auf …${import.meta.env.VITE_SPOTIFY_CLIENT_ID.slice(-4)})` : ""}.
            </div>
            <div style={{ fontSize: 10.5, color: textMuted, marginTop: 6 }}>
              Falls der Knopf oben nicht reagiert, tippe direkt auf diesen Link:
            </div>
            <a href={spotifyAutorisierenUrl()} style={{ fontSize: 10.5, color: accentDark, wordBreak: "break-all", display: "block", marginTop: 2 }}>
              {spotifyAutorisierenUrl()}
            </a>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ color: success, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 13, color: textMuted }}>Spotify ist verbunden.</span>
            </div>

            <div style={{ fontSize: 12, color: textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              Lege beliebig viele Playlists mit eigenem Namen an — dein Assistent hört im Gespräch selbst heraus, welche
              gemeint ist (z. B. "spiel meine Trainingsplaylist" oder "ich brauch was zum Runterkommen"), du musst dafür
              keine festen Kategorien einstellen.
            </div>

            {spotifyPlaylists?.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 0", borderBottom: `1px solid ${cardBorder}` }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>{p.name}</span>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handlePlaylistTesten(p)}
                    disabled={spotifyTestet}
                    style={{ padding: "7px 12px", borderRadius: 10, border: `1px solid ${accentDark}`, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#fff", color: accentDark }}
                  >
                    {testetPlaylistId === p.id ? "Startet…" : "Testen"}
                  </button>
                  <button
                    onClick={() => spotifyPlaylistLoeschen(p.id)}
                    style={{ padding: "7px 10px", borderRadius: 10, border: "none", background: "transparent", color: danger, fontSize: 12, cursor: "pointer" }}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
            {spotifyFehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{spotifyFehler}</div>}

            <div style={{ marginTop: 16 }}>
              <Label>Neue Playlist: Name (z. B. "Training", "Chillen abends")</Label>
              <TextInput value={neuerPlaylistName} onChange={setNeuerPlaylistName} placeholder="Name" />
              <Label>Link aus der Spotify-App</Label>
              <TextInput value={neuerPlaylistLink} onChange={setNeuerPlaylistLink} placeholder="https://open.spotify.com/playlist/..." />
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={handlePlaylistHinzufuegen}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", background: accentDark, color: "#fff" }}
                >
                  Playlist hinzufügen
                </button>
              </div>
              {playlistFehler && <div style={{ fontSize: 12, color: danger, marginTop: 8 }}>{playlistFehler}</div>}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
              <Label>Automatischer Start (z. B. per iOS-Kurzbefehl)</Label>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 10, lineHeight: 1.5 }}>
                Ein eigener Link, den z. B. ein Kurzbefehl morgens nach dem Öffnen von Spotify aufrufen kann — startet dann
                deine Standard-Playlist, ganz ohne dass du dich extra anmelden musst. Optional{" "}
                <code style={{ fontSize: 11 }}>&playlist=Name</code> anhängen, um eine bestimmte Playlist statt der
                Standard-Playlist zu starten.
              </div>
              {autoPlayUrl ? (
                <>
                  <div
                    style={{
                      fontSize: 11.5,
                      wordBreak: "break-all",
                      background: "#FAFBFA",
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      marginBottom: 8,
                      color: textMuted,
                    }}
                  >
                    {autoPlayUrl}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleAutoPlayUrlKopieren}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${accentDark}`, background: "#fff", color: accentDark, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      {autoPlayKopiert ? "Kopiert ✓" : "Link kopieren"}
                    </button>
                    <button
                      onClick={handleAutoPlayTokenErzeugen}
                      disabled={autoPlayLaedt}
                      style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer" }}
                    >
                      {autoPlayLaedt ? "…" : "Neu erzeugen"}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 6, lineHeight: 1.5 }}>
                    "Neu erzeugen" macht den bisherigen Link ungültig — nützlich, falls er mal in falsche Hände geraten
                    sein sollte.
                  </div>
                </>
              ) : (
                <button
                  onClick={handleAutoPlayTokenErzeugen}
                  disabled={autoPlayLaedt}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", background: accentDark, color: "#fff" }}
                >
                  {autoPlayLaedt ? "Erzeugt…" : "Automatik-Link erzeugen"}
                </button>
              )}
            </div>

            <button
              onClick={spotifyVerbindungTrennen}
              style={{ width: "100%", marginTop: 16, padding: "10px 16px", borderRadius: 12, border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer" }}
            >
              Spotify trennen
            </button>
          </>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.datenschutz")}</div>
      <Card style={{ marginBottom: 14 }}>
        {DATENSCHUTZ.map((key) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
            <span style={{ color: success, fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13 }}>{t(key)}</span>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.erweiterungen")}</div>
      <Card style={{ marginBottom: 14 }}>
        {ERWEITERUNGEN.map((key) => (
          <div key={key} style={{ fontSize: 13, padding: "5px 0", color: textMuted }}>
            • {t(key)}
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.konto")}</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("mehr.konto.angemeldet", { email: user?.email })}</div>
        <button
          onClick={signOut}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", background: "#FDE9EC", color: danger }}
        >
          {t("mehr.konto.abmelden")}
        </button>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Assistent</div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${cardBorder}` }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Assistent {kiAktiv ? "aktiv" : "ausgeschaltet"}</div>
            <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2, maxWidth: 220 }}>
              {kiAktiv
                ? "Der Assistent (Chat, Sprache, Vorschläge) ist überall in der App verfügbar."
                : "Kein Assistent mehr sichtbar — alle manuellen Formulare funktionieren unverändert."}
            </div>
          </div>
          <Pill label={kiAktiv ? "An" : "Aus"} selected={kiAktiv} onClick={() => handleKiAktivUmschalten(!kiAktiv)} />
        </div>

        <Label>Name deines Assistenten</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <TextInput
              value={coachName === STANDARD_COACH_NAME ? "" : coachName}
              onChange={setCoachNameState}
              placeholder="z. B. Finn"
              onKeyPress={(e) => e.key === "Enter" && saveCoachName(coachName)}
            />
          </div>
          <button
            type="button"
            onClick={() => saveCoachName(coachName)}
            style={{ padding: "0 16px", borderRadius: 10, border: "none", background: accentDark, color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Speichern
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: textMuted, marginTop: -6, marginBottom: 14 }}>
          Dein Assistent stellt sich danach überall in der App unter diesem Namen vor, statt mit dem Standardnamen "{STANDARD_COACH_NAME}". Nur auf diesem Gerät gespeichert.
        </div>

        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
          Testet die Verbindung zu deinem lokalen Ollama — funktioniert nur, wenn Ollama auf diesem Computer gerade läuft und du die Seite auf demselben Computer geöffnet hast.
        </div>
        <button
          onClick={handleKiTest}
          disabled={kiLadend || !kiAktiv}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 12,
            border: `1px solid ${accentDark}`,
            fontSize: 14,
            fontWeight: 700,
            opacity: kiAktiv ? 1 : 0.5,
            cursor: kiLadend || !kiAktiv ? "not-allowed" : "pointer",
            background: "#fff",
            color: accentDark,
          }}
        >
          {kiLadend ? "Frage Ollama…" : "Morgen-Impuls testen"}
        </button>
        {kiAntwort && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: accentSoft, fontSize: 13.5, lineHeight: 1.5 }}>{kiAntwort}</div>
        )}
        {kiFehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{kiFehler}</div>}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t("mehr.testen")}</div>
      <Card>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("mehr.testen.intro")}</div>
        <button
          onClick={handleResetOnboarding}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1px solid ${accentDark}`, fontSize: 14, fontWeight: 700, cursor: "pointer", background: "#fff", color: accentDark }}
        >
          {t("mehr.testen.reset")}
        </button>
        {resetMsg && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{resetMsg}</div>}
      </Card>
    </>
  );
}
