import React, { useState, useEffect } from "react";
import { Shell, PrimaryButton, Card, Label, Stepper } from "../../ui/primitives";
import { cardBorder, textMuted, accentSoft } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import RoutineSchritteEditor from "../../ui/RoutineSchritteEditor";
import RoutineSchritteListe from "../../ui/RoutineSchritteListe";
import TimeWheelField from "../../ui/TimeWheelField";
import KategorieErinnerung from "../../ui/KategorieErinnerung";
import SchlafplanCard, { neuerSchlafblock } from "../../ui/SchlafplanCard";
import KiChat from "../../ui/KiChat";
import { AIService } from "../../services/aiService";
import { getCoachName } from "../../utils/coachStorage";
import { WOCHENTAGE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { useT } from "../../i18n/translate";
import { ISTZUSTAND_FRAGEN } from "./OnboardingCategoriesView";
import { PROTOKOLL_SCHRITTE_GESAMT } from "./categorySteps";

// Morgen-/Abendroutine bewusst direkt nach Ziel/Profil/Laborwerte und VOR
// den 9 Kategorie-Plänen (Schlaf, Peptide, Supplemente, ...) — Nutzerinnen-
// Vorgabe (13.08.): der eigentliche Ursprungsgedanke der App (ADHS-gerechte
// Tagesstruktur) ist im Onboarding bisher untergegangen, weil alles aus der
// Peptid-Idee herausgewachsen ist. Alle anderen Kategorien sind aus dieser
// Sicht nur noch Zusatz-Bausteine, die sich später der Routine zuordnen
// lassen — deshalb kommt die Routine-Einrichtung jetzt zuerst.
export default function OnboardingRoutinenView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();
  const {
    routineSchritte,
    routineSchrittHinzufuegen,
    routineSchrittEntfernen,
    routineSchrittVerschieben,
    routineEinstellungen,
    routineZeitrahmenSetzen,
    categoryZiele,
    setCategoryZiel,
    aktivesHauptprotokoll,
    teilprotokollSpeichern,
  } = useAppData();
  const morgenSchritte = routineSchritte.filter((s) => s.routine === "morgen");
  const abendSchritte = routineSchritte.filter((s) => s.routine === "abend");
  const morgenEinstellung = routineEinstellungen.morgen || { startZeit: "", endZeit: "" };
  const abendEinstellung = routineEinstellungen.abend || { startZeit: "", endZeit: "" };

  // Schlaf — seit 16.09. hier statt als eigener Kategorie-Schritt
  // (Nutzerinnen-Vorgabe: "Schlafplan mit der Morgen- und Abendroutine gleich
  // zusammentun, die hängen ja alle unmittelbar miteinander zusammen"). Genau
  // dieselbe Bettzeit/Aufwachzeit-Blöcke-Logik wie zuvor in
  // OnboardingCategoriesView.jsx, nur hierher verschoben; die Datenform
  // (categoryZiele.schlaf, teilprotokolle-Zeile) bleibt unverändert, damit
  // MehrTab.jsx, OnboardingCompletionView.jsx & Co. unverändert weiterlaufen.
  const [schlafIntervallTyp, setSchlafIntervallTyp] = useState("weekdays"); // "fixed" | "weekdays"
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);
  const [schlafIstZustand, setSchlafIstZustand] = useState("");
  const [schlafSaving, setSchlafSaving] = useState(false);
  const [schlafError, setSchlafError] = useState(null);

  useEffect(() => {
    const gespeicherteBloecke = categoryZiele?.schlaf?.bloecke;
    if (gespeicherteBloecke?.length) {
      setSchlafIntervallTyp(
        gespeicherteBloecke.length === 1 && gespeicherteBloecke[0].wochentage.length === WOCHENTAGE.length ? "fixed" : "weekdays"
      );
      setSchlafBloecke(gespeicherteBloecke.map((b) => ({ ...neuerSchlafblock(b.wochentage), ...b })));
    }
    if (categoryZiele?.schlaf?.istZustand?.aktuell) {
      setSchlafIstZustand(categoryZiele.schlaf.istZustand.aktuell);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Einzelnes Feld eines Blocks setzen — auch von handleRoutineUebernehmen
  // (Aka-Übernahme von Bettzeit/Aufwachzeit) genutzt, deshalb als
  // eigenständige Funktion statt inline in onBloeckeChange.
  const setBlockFeld = (idx, feld, val) => {
    setSchlafBloecke((prev) => prev.map((b, i) => (i === idx ? { ...b, [feld]: val } : b)));
  };

  // Bug-Fix (Nutzerinnen-Report, 16.09.: "bei Morgenroutine, Abendroutine
  // und Schlaf kann ich Aka nicht einsetzen, ich habe keinen Button") —
  // diese Seite hatte bisher gar keine KiChat-Einbindung, obwohl die dafür
  // nötige Extraktion (AIService.morgenAbendroutineAusChat) existiert und an
  // anderer Stelle (RoutineTabView.jsx: routineAusChat) längst produktiv
  // läuft. EIN gemeinsamer Chat für alle drei Karten (statt drei einzelner)
  // — der schwebende Aka-Knopf ist `position: fixed` und würde bei mehreren
  // gleichzeitig eingebetteten KiChat-Instanzen exakt übereinander liegen.
  const handleRoutineUebernehmen = async (verlauf) => {
    const coachName = getCoachName();
    const r = await AIService.morgenAbendroutineAusChat({ verlauf, coachName });
    r.morgenSchritte.forEach((s) => routineSchrittHinzufuegen("morgen", s.name, s.dauerMin || 5));
    r.abendSchritte.forEach((s) => routineSchrittHinzufuegen("abend", s.name, s.dauerMin || 5));
    if (r.bettzeit) setBlockFeld(0, "bettzeit", r.bettzeit);
    if (r.aufwachzeit) setBlockFeld(0, "aufwachzeit", r.aufwachzeit);
    return r;
  };

  const weiter = async () => {
    setSchlafError(null);
    setSchlafSaving(true);
    const bloecke =
      schlafIntervallTyp === "fixed"
        ? [{ ...schlafBloecke[0], wochentage: [...WOCHENTAGE] }]
        : schlafBloecke;
    setCategoryZiel("schlaf", {
      bloecke: bloecke.map(({ wochentage, bettzeit, aufwachzeit }) => ({ wochentage, bettzeit, aufwachzeit })),
      istZustand: { aktuell: schlafIstZustand },
    });
    if (aktivesHauptprotokoll?.id) {
      try {
        const result = await teilprotokollSpeichern(aktivesHauptprotokoll.id, "schlaf", {
          aktiv: true,
          eigenerStartdatum: null,
          laufzeitWochen: null,
        });
        if (!result?.ok) {
          setSchlafError(result?.error || t("onboarding.error.speichern"));
          setSchlafSaving(false);
          return;
        }
      } catch (err) {
        console.error(err);
        setSchlafError(err?.message || t("onboarding.error.speichern"));
        setSchlafSaving(false);
        return;
      }
    }
    setSchlafSaving(false);
    onDone({ key: "schlaf", icon: "😴", label: "Schlafplan" });
  };

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={t("onboarding.zurueck")} onForward={onDone} forwardLabel={tLabel("Überspringen")} />

      <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 10 }}>
        {t("onboarding.categories.progress", { current: 2, total: PROTOKOLL_SCHRITTE_GESAMT })}
      </div>
      <Stepper step={1} total={PROTOKOLL_SCHRITTE_GESAMT} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🌅🌙</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>Morgen- & Abendroutine</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>
        Kein guter Morgen ohne einen guten Abend davor — und ein guter Tag beginnt schon beim Aufwachen. Alles andere in dieser App
        (Schlaf, Training, Supplemente, ...) sind Bausteine, die sich später in diese beiden Routinen einordnen. Leg jetzt schon fest,
        welche Schritte für dich zu einem guten Start bzw. Abschluss des Tages gehören — kannst du jederzeit später anpassen.
      </div>

      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Sag {getCoachName()}, was zu deiner Morgen-/Abendroutine und deinem Schlaf gehört — er füllt die Felder unten für dich aus.
      </div>
      <KiChat
        bereich="morgenAbendroutine"
        systemPrompt="Du hilfst dabei, Morgenroutine, Abendroutine und Schlafplan für eine bestehende App aufzubauen. Frag nach, was die Person sowieso schon jeden Morgen/Abend macht (kein Neuanfang von null), in welcher Reihenfolge, wie lange jeder Schritt ungefähr dauert, und wann sie normalerweise ins Bett geht bzw. aufwacht. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Lass uns deine Morgen- und Abendroutine sowie deinen Schlafrhythmus aufbauen — was gehört für dich dazu?`}
        onUebernehmen={handleRoutineUebernehmen}
        uebernehmenLabel="Übernehmen"
        renderErgebnis={() => (
          <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
            Felder ausgefüllt — bitte kurz prüfen und unten speichern.
          </div>
        )}
      />

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🌅 Morgenroutine</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
          Was gehört für dich zu einem guten Start in den Tag? Z. B. "15 Min. Tageslicht", "Kaffee/Shake machen", "Duschen", "20 Min.
          Training".
        </div>
        <Label>Weckzeit</Label>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 6, marginTop: -6 }}>
          Die Morgenroutine schließt direkt ans Aufwachen an — daraus errechnen sich unten die Uhrzeiten der einzelnen Schritte.
        </div>
        <TimeWheelField value={morgenEinstellung.startZeit} onChange={(v) => routineZeitrahmenSetzen("morgen", v, morgenEinstellung.endZeit)} />
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
          <RoutineSchritteEditor
            routine="morgen"
            schritte={morgenSchritte}
            onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("morgen", name, dauerMin)}
          />
        </div>
      </Card>

      <RoutineSchritteListe routine="morgen" schritte={morgenSchritte} onEntfernen={routineSchrittEntfernen} onVerschieben={routineSchrittVerschieben} />

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🌙 Abendroutine</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
          Was hilft dir, den Tag mental abzuschließen und gut einzuschlafen? Z. B. "Tag reflektieren", "Supplemente nehmen", "Bildschirm
          aus".
        </div>
        <Label>Beginn der Abendroutine</Label>
        <TimeWheelField value={abendEinstellung.startZeit} onChange={(v) => routineZeitrahmenSetzen("abend", v, abendEinstellung.endZeit)} />
        <div style={{ marginTop: 14 }}>
          <KategorieErinnerung kategorie="abendroutine" label="🔔 Vorab dran erinnern" />
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
          <RoutineSchritteEditor
            routine="abend"
            schritte={abendSchritte}
            onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("abend", name, dauerMin)}
          />
        </div>
      </Card>

      <RoutineSchritteListe routine="abend" schritte={abendSchritte} onEntfernen={routineSchrittEntfernen} onVerschieben={routineSchrittVerschieben} />

      <SchlafplanCard
        intervallTyp={schlafIntervallTyp}
        onIntervallTypChange={setSchlafIntervallTyp}
        bloecke={schlafBloecke}
        onBloeckeChange={setSchlafBloecke}
        istZustand={schlafIstZustand}
        onIstZustandChange={setSchlafIstZustand}
        istZustandFrage={ISTZUSTAND_FRAGEN.schlaf[0].frage}
        istZustandPlaceholder={ISTZUSTAND_FRAGEN.schlaf[0].placeholder}
        fehler={schlafError}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={weiter} disabled={schlafSaving}>
          {schlafSaving ? "Einen Moment..." : tLabel("Weiter")}
        </PrimaryButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: `1px solid ${cardBorder}`,
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease-out",
            }}
          >
            {tLabel("Abbrechen")}
          </button>
        )}
      </div>
    </Shell>
  );
}
