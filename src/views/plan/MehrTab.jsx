import React, { useState } from "react";
import { Card, Pill } from "../../ui/primitives";
import { accentDark, accentSoft, cardBorder, danger, success, textMuted } from "../../ui/theme";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useT } from "../../i18n/translate";
import { CATEGORY_STEPS } from "../onboarding/categorySteps";
import { AIService } from "../../services/aiService";

export default function MehrTab({ onOpenLexikon }) {
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
  } = useAppData();
  const { lang, setLang } = useLanguage();
  const { t, tLabel } = useT();
  const [resetMsg, setResetMsg] = useState(null);
  const [testMsg, setTestMsg] = useState(null);
  const [kiLadend, setKiLadend] = useState(false);
  const [kiAntwort, setKiAntwort] = useState(null);
  const [kiFehler, setKiFehler] = useState(null);

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

  // Erster Testaufruf des KI-Coach-Moduls direkt aus der App heraus — prüft
  // die ganze Kette (Vercel-ENV → Browser → Ollama) ohne eigene Testseite.
  const handleKiTest = async () => {
    setKiLadend(true);
    setKiAntwort(null);
    setKiFehler(null);
    try {
      const antwort = await AIService.morgenImpuls({});
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
        {CATEGORY_STEPS.map((step, i) => (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < CATEGORY_STEPS.length - 1 ? `1px solid ${cardBorder}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700 }}>
              <span>{step.icon}</span>
              <span>{tLabel(step.label)}</span>
            </div>
            <Pill
              label={erinnerungen[step.key] ? t("common.erinnerung.ja") : t("common.erinnerung.nein")}
              selected={!!erinnerungen[step.key]}
              onClick={() => setErinnerung(step.key, !erinnerungen[step.key])}
            />
          </div>
        ))}
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

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>KI-Coach</div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
          Testet die Verbindung zu deinem lokalen Ollama — funktioniert nur, wenn Ollama auf diesem Computer gerade läuft und du die Seite auf demselben Computer geöffnet hast.
        </div>
        <button
          onClick={handleKiTest}
          disabled={kiLadend}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 12,
            border: `1px solid ${accentDark}`,
            fontSize: 14,
            fontWeight: 700,
            cursor: kiLadend ? "not-allowed" : "pointer",
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
