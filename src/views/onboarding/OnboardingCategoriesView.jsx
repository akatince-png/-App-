import React, { useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextInput, Stepper } from "../../ui/primitives";
import ZieldauerField from "../../ui/ZieldauerField";
import ErinnerungField from "../../ui/ErinnerungField";
import WochenplanEditor from "../../ui/WochenplanEditor";
import ProtocolFormView from "../ProtocolFormView";
import { accentDark, accentSoft, cardBorder, danger, textMuted } from "../../ui/theme";
import { TAGESZEITEN, EINNAHMEARTEN, MEDIKAMENTE_KATEGORIEN, WOCHENTAGE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { CATEGORY_STEPS } from "./categorySteps";
import { useT } from "../../i18n/translate";
import { toLocalISODate } from "../../utils/dates";

const ZIEL_LEER = { modus: "offen", wochen: "" };
const MULTI_ADD_KEYS = ["gewohnheiten", "ernaehrung", "supplemente", "medikamente"];

const neuerSchlafblock = (wochentage) => ({
  id: Math.random().toString(36).slice(2),
  wochentage,
  bettzeit: "22:30",
  aufwachzeit: "06:30",
});
const neueZutat = () => ({ name: "", menge: "" });

function berechneSchlafstunden(bett, auf) {
  if (!bett || !auf) return "–";
  const [bh, bm] = bett.split(":").map(Number);
  const [ah, am] = auf.split(":").map(Number);
  let minuten = ah * 60 + am - (bh * 60 + bm);
  if (minuten <= 0) minuten += 24 * 60;
  return Math.round((minuten / 60) * 10) / 10;
}

function toggleInArray(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// Kompakter "+"-Button im selben Stil wie an anderen Stellen der App
// (z. B. DosierungFields "+ weitere Uhrzeit") — hier mehrfach für
// Schlafblöcke, Hydration-Erinnerungszeiten und Zutaten wiederverwendet.
function AddZeile({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: 10,
        border: "1px dashed #C7D8D2",
        background: "transparent",
        color: disabled ? textMuted : accentDark,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        marginBottom: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

// Ein Kurz-Screen pro "Pläne"-Bereich, in der Reihenfolge natürlichster bis
// unnatürlichster/klinischster Tracking-Punkt (Schlaf, Hydration, Ernährung,
// Training, Gewohnheiten, Supplemente, Medikamente, Peptid-Protokoll ganz am
// Ende) — jeweils dieselbe "Jetzt einrichten?"-Gate-Seite. Beim
// Peptid-Protokoll führt "Jetzt einrichten" zum bestehenden mehrstufigen
// ProtocolFormView statt zu eigenen Feldern hier — die Gate-Seite davor sieht
// aber genauso aus wie bei jedem anderen Bereich.
//
// Vier Bereiche (Gewohnheiten/Ernährung/Supplemente/Medikamente) erlauben
// mehrere Einträge nacheinander, statt nach dem ersten sofort zum nächsten
// Bereich zu springen — "+ Hinzufügen" bleibt auf der Seite und sammelt eine
// "bereits hinzugefügt"-Liste, "Weiter" schließt den Bereich bewusst ab.
export default function OnboardingCategoriesView({ onFinished, onCancel }) {
  const {
    gewohnheitHinzufuegen,
    hydrationZielMl,
    hydrationZielSetzen,
    mahlzeitHinzufuegen,
    supplementHinzufuegen,
    hormonHinzufuegen,
    setCategoryZiel,
    trainingWochenplan,
    trainingTemplates,
    wochenplanSetzen,
    wochenplanEntfernen,
    erinnerungen,
    setErinnerung,
    aktivesHauptprotokoll,
    teilprotokollSpeichern,
  } = useAppData();
  const { t, tLabel } = useT();

  const [index, setIndex] = useState(0);
  const [modus, setModus] = useState(null); // null | "jetzt"
  const [ziel, setZiel] = useState(ZIEL_LEER);
  const [eingerichtet, setEingerichtet] = useState([]); // [{ key, icon, label }]
  const [hinzugefuegt, setHinzugefuegt] = useState([]); // Namen, die in diesem Bereich schon gespeichert wurden
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Eigenes Startdatum je Teilprotokoll (weicht optional vom Hauptprotokoll ab)
  const [eigenesStartdatumAktiv, setEigenesStartdatumAktiv] = useState(false);
  const [eigenesStartdatum, setEigenesStartdatum] = useState(toLocalISODate(new Date()));

  // Gewohnheiten
  const [gName, setGName] = useState("");
  const [gMenge, setGMenge] = useState("");
  const [gUhrzeit, setGUhrzeit] = useState("");
  const [gZielTage, setGZielTage] = useState("");

  // Schlaf — mehrere Blöcke, jeweils mit eigenen Wochentagen (z. B. Woche
  // anders als Wochenende), damit auch als Wecker nutzbar.
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);

  // Hydration
  const [hydrationMl, setHydrationMl] = useState(String(hydrationZielMl || 2500));
  const [hydrationZeiten, setHydrationZeiten] = useState(
    Array.isArray(erinnerungen?.hydration?.zeiten) ? erinnerungen.hydration.zeiten : []
  );
  const [hydrationNeueZeit, setHydrationNeueZeit] = useState("12:00");

  // Ernährung
  const [mahlName, setMahlName] = useState("");
  const [mahlZeiten, setMahlZeiten] = useState([]);
  const [mahlZutaten, setMahlZutaten] = useState([neueZutat()]);

  // Supplemente
  const [suppName, setSuppName] = useState("");
  const [suppZeiten, setSuppZeiten] = useState([]);

  // Medikamente
  const [medName, setMedName] = useState("");
  const [medMenge, setMedMenge] = useState("");
  const [medKategorie, setMedKategorie] = useState("Hormone");
  const [medEinnahmeart, setMedEinnahmeart] = useState("Injektion");

  // Peptid-Protokoll
  const [protocolStep, setProtocolStep] = useState(0);

  const step = CATEGORY_STEPS[index];
  const istLetzter = index === CATEGORY_STEPS.length - 1;
  const istMultiAdd = MULTI_ADD_KEYS.includes(step.key);

  const resetEingabeFelder = () => {
    setGName("");
    setGMenge("");
    setGUhrzeit("");
    setGZielTage("");
    setSchlafBloecke([neuerSchlafblock([...WOCHENTAGE])]);
    setHydrationMl(String(hydrationZielMl || 2500));
    setHydrationZeiten(Array.isArray(erinnerungen?.hydration?.zeiten) ? erinnerungen.hydration.zeiten : []);
    setHydrationNeueZeit("12:00");
    setMahlName("");
    setMahlZeiten([]);
    setMahlZutaten([neueZutat()]);
    setSuppName("");
    setSuppZeiten([]);
    setMedName("");
    setMedMenge("");
    setMedKategorie("Hormone");
    setMedEinnahmeart("Injektion");
    setProtocolStep(0);
    setEigenesStartdatumAktiv(false);
    setEigenesStartdatum(toLocalISODate(new Date()));
  };

  const resetLokal = () => {
    setModus(null);
    setZiel(ZIEL_LEER);
    setError(null);
    setHinzugefuegt([]);
    resetEingabeFelder();
  };

  const weiter = (wurdeEingerichtet) => {
    const ohneAktuellen = eingerichtet.filter((e) => e.key !== step.key);
    const naechsteListe = wurdeEingerichtet ? [...ohneAktuellen, { key: step.key, icon: step.icon, label: step.label }] : ohneAktuellen;
    // Teilprotokoll-Zuordnung (aktiv/inaktiv, eigenes Startdatum, Laufzeit)
    // — eine Zeile je Kategorie unter dem aktuellen Hauptprotokoll, egal ob
    // gerade eingerichtet oder übersprungen wurde.
    if (aktivesHauptprotokoll?.id) {
      teilprotokollSpeichern(aktivesHauptprotokoll.id, step.key, {
        aktiv: wurdeEingerichtet,
        eigenerStartdatum: eigenesStartdatumAktiv ? eigenesStartdatum : null,
        laufzeitWochen: ziel.modus === "wochen" && ziel.wochen ? Number(ziel.wochen) : null,
      });
    }
    if (istLetzter) {
      onFinished(naechsteListe);
      return;
    }
    setEingerichtet(naechsteListe);
    setIndex((i) => i + 1);
    resetLokal();
  };

  const zurueck = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
    resetLokal();
  };

  // ---------------------------------------------------------------------
  // Schlaf: Wochentage je Block; ein Tag kann nur einem Block angehören,
  // damit klar ist, welche Bett-/Aufwachzeit an welchem Tag als Wecker gilt.
  // ---------------------------------------------------------------------
  const tageBelegtVonAnderen = (idx) => schlafBloecke.filter((_, i) => i !== idx).flatMap((b) => b.wochentage);
  const verfuegbareTage = (idx) => WOCHENTAGE.filter((tag) => !tageBelegtVonAnderen(idx).includes(tag));

  const toggleBlockTag = (idx, tag) => {
    setSchlafBloecke((prev) => prev.map((b, i) => (i === idx ? { ...b, wochentage: toggleInArray(b.wochentage, tag) } : b)));
  };
  const blockAlleUmschalten = (idx) => {
    const verfuegbar = verfuegbareTage(idx);
    setSchlafBloecke((prev) =>
      prev.map((b, i) => {
        if (i !== idx) return b;
        const vollstaendig = verfuegbar.length > 0 && verfuegbar.every((t) => b.wochentage.includes(t));
        return { ...b, wochentage: vollstaendig ? [] : [...verfuegbar] };
      })
    );
  };
  const setBlockFeld = (idx, feld, val) => {
    setSchlafBloecke((prev) => prev.map((b, i) => (i === idx ? { ...b, [feld]: val } : b)));
  };
  const schlafblockHinzufuegen = () => {
    const belegt = schlafBloecke.flatMap((b) => b.wochentage);
    const frei = WOCHENTAGE.filter((t) => !belegt.includes(t));
    if (frei.length === 0) return;
    setSchlafBloecke((prev) => [...prev, neuerSchlafblock(frei)]);
  };
  const schlafblockEntfernen = (idx) => {
    setSchlafBloecke((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };
  const alleTageVergeben = WOCHENTAGE.every((t) => schlafBloecke.some((b) => b.wochentage.includes(t)));

  // ---------------------------------------------------------------------
  // Hydration: konkrete Erinnerungszeiten statt nur eines Ja/Nein-Schalters
  // — direkt in der erinnerungen-Präferenz mitgespeichert (kategorie ->
  // { aktiv, zeiten } statt nur ein Boolean), damit ein späterer
  // automatischer Versand weiß, wann er erinnern soll.
  // ---------------------------------------------------------------------
  const handleErinnerungChange = (v) => {
    if (step.key === "hydration") {
      setErinnerung("hydration", v ? { aktiv: true, zeiten: hydrationZeiten } : false);
    } else {
      setErinnerung(step.key, v);
    }
  };
  const hydrationZeitHinzufuegen = () => {
    const z = hydrationNeueZeit;
    if (!z || hydrationZeiten.includes(z)) return;
    const next = [...hydrationZeiten, z].sort();
    setHydrationZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
  };
  const hydrationZeitAendern = (i, val) => {
    const next = hydrationZeiten.map((z, idx) => (idx === i ? val : z));
    setHydrationZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
  };
  const hydrationZeitEntfernen = (i) => {
    const next = hydrationZeiten.filter((_, idx) => idx !== i);
    setHydrationZeiten(next);
    setErinnerung("hydration", { aktiv: true, zeiten: next });
  };

  // ---------------------------------------------------------------------
  // Ernährung: Zutaten-Zeilen wie im vollen Ernährungsplan.
  // ---------------------------------------------------------------------
  const zutatAendern = (i, feld, val) => setMahlZutaten((prev) => prev.map((z, idx) => (idx === i ? { ...z, [feld]: val } : z)));
  const zutatHinzufuegen = () => setMahlZutaten((prev) => [...prev, neueZutat()]);
  const zutatEntfernen = (i) => setMahlZutaten((prev) => prev.filter((_, idx) => idx !== i));

  // ---------------------------------------------------------------------
  // Speichern: einmalige Bereiche (Schlaf/Hydration/Training) springen nach
  // dem Speichern direkt weiter; Listen-Bereiche (Gewohnheiten/Ernährung/
  // Supplemente/Medikamente) bleiben auf der Seite und sammeln weitere
  // Einträge, bis "Weiter" bewusst angetippt wird.
  // ---------------------------------------------------------------------
  const speichernUndWeiter = async () => {
    setError(null);
    setSaving(true);
    let result = { ok: true };

    if (step.key === "schlaf") {
      setCategoryZiel("schlaf", {
        bloecke: schlafBloecke.map(({ wochentage, bettzeit, aufwachzeit }) => ({ wochentage, bettzeit, aufwachzeit })),
        modus: ziel.modus,
        wochen: ziel.wochen,
      });
    } else if (step.key === "hydration") {
      await hydrationZielSetzen(Math.max(0, Number(hydrationMl) || 0));
      setCategoryZiel("hydration", { modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "training") {
      // Der Wochenplan selbst wird schon beim Antippen der Pillen direkt
      // gespeichert (wochenplanSetzen/-Entfernen, wie in TrainingView) —
      // hier wird nur noch die Zieldauer festgehalten.
      setCategoryZiel("training", { modus: ziel.modus, wochen: ziel.wochen });
    }

    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || t("onboarding.error.speichern"));
      return;
    }
    weiter(true);
  };

  const hinzufuegen = async () => {
    setError(null);
    setSaving(true);
    let result = { ok: true };
    let label = "";

    if (step.key === "gewohnheiten") {
      if (!gName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      label = gName.trim();
      result = await gewohnheitHinzufuegen({ name: gName, icon: "🌱", menge: gMenge, uhrzeit: gUhrzeit, zielTage: gZielTage ? Number(gZielTage) : null });
      if (result?.ok) {
        setGName("");
        setGMenge("");
        setGUhrzeit("");
        setGZielTage("");
      }
    } else if (step.key === "ernaehrung") {
      if (!mahlName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      if (mahlZeiten.length === 0) {
        setError(t("onboarding.error.tageszeit"));
        setSaving(false);
        return;
      }
      label = mahlName.trim();
      result = await mahlzeitHinzufuegen({ name: mahlName, tageszeiten: mahlZeiten, hinweis: "", zutaten: mahlZutaten });
      if (result?.ok) {
        setMahlName("");
        setMahlZeiten([]);
        setMahlZutaten([neueZutat()]);
      }
    } else if (step.key === "supplemente") {
      if (!suppName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      if (suppZeiten.length === 0) {
        setError(t("onboarding.error.tageszeit"));
        setSaving(false);
        return;
      }
      label = suppName.trim();
      result = await supplementHinzufuegen({ name: suppName, tageszeiten: suppZeiten, hinweis: "" });
      if (result?.ok) {
        setSuppName("");
        setSuppZeiten([]);
      }
    } else if (step.key === "medikamente") {
      if (!medName.trim()) {
        setError(t("onboarding.error.name"));
        setSaving(false);
        return;
      }
      label = medName.trim();
      result = await hormonHinzufuegen({
        name: medName,
        menge: medMenge,
        kategorie: medKategorie,
        einnahmeart: medEinnahmeart,
        intervallTyp: "fixed",
        intervallDays: 7,
        customDays: "",
        onDays: "",
        offDays: "",
        weekdays: [],
        eigenerStart: "",
        uhrzeiten: ["20:00"],
      });
      if (result?.ok) {
        setMedName("");
        setMedMenge("");
        setMedKategorie("Hormone");
        setMedEinnahmeart("Injektion");
      }
    }

    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || t("onboarding.error.speichern"));
      return;
    }
    setHinzugefuegt((prev) => [...prev, label]);
  };

  // Peptid-Protokoll ist der einzige Bereich mit einem eigenen mehrstufigen
  // Formular statt 2–4 Feldern — bekommt trotzdem dieselbe Gate-Seite wie
  // jeder andere Bereich (unten), nur dass "Jetzt einrichten" hier zum
  // bestehenden ProtocolFormView führt statt zu Feldern in dieser Ansicht.
  // "Peptide überspringen" innerhalb des Formulars zählt bewusst NICHT als
  // eingerichtet (onSkip statt onFinish).
  if (step.key === "peptide" && modus === "jetzt") {
    return (
      <ProtocolFormView
        step={protocolStep}
        setStep={setProtocolStep}
        onFinish={() => weiter(true)}
        onSkip={() => weiter(false)}
        onHome={onCancel}
      />
    );
  }

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
            {t("onboarding.categories.progress", { current: index + 1, total: CATEGORY_STEPS.length })}
          </div>
          {index > 0 && (
            <div className="mp-tap" onClick={zurueck} style={{ fontSize: 12, fontWeight: 700, color: textMuted, cursor: "pointer" }}>
              {t("onboarding.zurueck")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="mp-tap" onClick={() => onFinished(eingerichtet)} style={{ fontSize: 12, fontWeight: 700, color: accentDark, cursor: "pointer" }}>
            {tLabel("Alles überspringen")}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 14, cursor: "pointer", flexShrink: 0 }}
              title={tLabel("Abbrechen")}
            >
              ⌂
            </button>
          )}
        </div>
      </div>
      <Stepper step={index} total={CATEGORY_STEPS.length} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 28 }}>{step.icon}</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{t("onboarding.gate.title", { label: tLabel(step.label) })}</div>
      </div>

      {modus === null && (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            {t("onboarding.gate.instructions")}
          </div>
          <div style={{ marginBottom: 16 }}>
            <ErinnerungField value={erinnerungen[step.key]} onChange={handleErinnerungChange} />
            {step.key === "hydration" && erinnerungen.hydration && (
              <div style={{ marginTop: 10 }}>
                <Label>{t("onboarding.hydration.erinnerungszeiten.label")}</Label>
                {hydrationZeiten.map((zeit, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <TextInput type="time" value={zeit} onChange={(v) => hydrationZeitAendern(i, v)} />
                    </div>
                    <button
                      type="button"
                      onClick={() => hydrationZeitEntfernen(i)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 6px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <TextInput type="time" value={hydrationNeueZeit} onChange={setHydrationNeueZeit} />
                  </div>
                  <button
                    type="button"
                    onClick={hydrationZeitHinzufuegen}
                    style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
          {step.key !== "peptide" && (
            <div style={{ marginBottom: 16 }}>
              <CheckRow
                label={t("onboarding.eigenesStartdatum.checkbox")}
                checked={eigenesStartdatumAktiv}
                onToggle={() => setEigenesStartdatumAktiv((v) => !v)}
              />
              {eigenesStartdatumAktiv && (
                <div style={{ marginTop: 8 }}>
                  <Label>{t("onboarding.eigenesStartdatum.label")}</Label>
                  <TextInput type="date" value={eigenesStartdatum} onChange={setEigenesStartdatum} />
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => setModus("jetzt")}>{tLabel("Jetzt einrichten")}</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
              {tLabel("Später einrichten")}
            </PrimaryButton>
          </div>
        </Card>
      )}

      {modus === "jetzt" && (
        <Card>
          {istMultiAdd && hinzugefuegt.length > 0 && (
            <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 12, background: accentSoft, fontSize: 12.5, fontWeight: 600 }}>
              {t("onboarding.hinzugefuegt.label")}: {hinzugefuegt.join(", ")}
            </div>
          )}

          {step.key === "gewohnheiten" && (
            <>
              <Label>{t("onboarding.gewohnheiten.name.label")}</Label>
              <TextInput value={gName} onChange={setGName} placeholder={t("onboarding.gewohnheiten.name.placeholder")} />
              <Label>{t("onboarding.gewohnheiten.menge.label")}</Label>
              <TextInput value={gMenge} onChange={setGMenge} placeholder={t("onboarding.gewohnheiten.menge.placeholder")} />
              <Label>{t("onboarding.gewohnheiten.uhrzeit.label")}</Label>
              <TextInput type="time" value={gUhrzeit} onChange={setGUhrzeit} />
              <Label>{t("onboarding.gewohnheiten.zieltage.label")}</Label>
              <TextInput type="number" value={gZielTage} onChange={setGZielTage} placeholder={t("onboarding.gewohnheiten.zieltage.placeholder")} />
            </>
          )}

          {step.key === "schlaf" && (
            <>
              {schlafBloecke.map((block, idx) => (
                <div key={block.id} style={{ marginBottom: idx < schlafBloecke.length - 1 ? 20 : 0, paddingBottom: idx < schlafBloecke.length - 1 ? 16 : 0, borderBottom: idx < schlafBloecke.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                  <Label>{t("onboarding.schlaf.tage.label")}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    <Pill label={t("onboarding.schlaf.alle")} selected={verfuegbareTage(idx).length > 0 && verfuegbareTage(idx).every((t2) => block.wochentage.includes(t2))} onClick={() => blockAlleUmschalten(idx)} />
                    {verfuegbareTage(idx).map((tag) => (
                      <Pill key={tag} label={tag} selected={block.wochentage.includes(tag)} onClick={() => toggleBlockTag(idx, tag)} />
                    ))}
                  </div>
                  <Label>{t("onboarding.schlaf.bettzeit.label")}</Label>
                  <TextInput type="time" value={block.bettzeit} onChange={(v) => setBlockFeld(idx, "bettzeit", v)} />
                  <Label>{t("onboarding.schlaf.aufwachzeit.label")}</Label>
                  <TextInput type="time" value={block.aufwachzeit} onChange={(v) => setBlockFeld(idx, "aufwachzeit", v)} />
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
                    {t("onboarding.schlaf.ziel", { stunden: berechneSchlafstunden(block.bettzeit, block.aufwachzeit) })}
                  </div>
                  {schlafBloecke.length > 1 && (
                    <button
                      type="button"
                      onClick={() => schlafblockEntfernen(idx)}
                      style={{ marginTop: 8, border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      {t("onboarding.schlaf.block.entfernen")}
                    </button>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <AddZeile label={t("onboarding.schlaf.block.hinzufuegen")} onClick={schlafblockHinzufuegen} disabled={alleTageVergeben} />
              </div>
            </>
          )}

          {step.key === "hydration" && (
            <>
              <Label>{t("onboarding.hydration.tagesziel.label")}</Label>
              <TextInput type="number" value={hydrationMl} onChange={setHydrationMl} placeholder={t("onboarding.hydration.tagesziel.placeholder")} />
            </>
          )}

          {step.key === "ernaehrung" && (
            <>
              <Label>{t("onboarding.ernaehrung.name.label")}</Label>
              <TextInput value={mahlName} onChange={setMahlName} placeholder={t("onboarding.ernaehrung.name.placeholder")} />
              <Label>{t("onboarding.ernaehrung.tageszeiten.label")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {TAGESZEITEN.map((zeit) => (
                  <Pill key={zeit} label={tLabel(zeit)} selected={mahlZeiten.includes(zeit)} onClick={() => setMahlZeiten((prev) => toggleInArray(prev, zeit))} />
                ))}
              </div>
              <Label>{t("onboarding.ernaehrung.zutaten.label")}</Label>
              {mahlZutaten.map((z, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 2 }}>
                    <TextInput value={z.name} onChange={(v) => zutatAendern(i, "name", v)} placeholder={t("onboarding.ernaehrung.zutat.placeholder")} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextInput value={z.menge} onChange={(v) => zutatAendern(i, "menge", v)} placeholder={t("onboarding.ernaehrung.zutatmenge.placeholder")} />
                  </div>
                  {mahlZutaten.length > 1 && (
                    <button type="button" onClick={() => zutatEntfernen(i)} style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              <AddZeile label={t("onboarding.ernaehrung.zutat.hinzufuegen")} onClick={zutatHinzufuegen} />
            </>
          )}

          {step.key === "training" && (
            <>
              <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t("onboarding.training.frage")}</div>
              <WochenplanEditor
                trainingWochenplan={trainingWochenplan}
                trainingTemplates={trainingTemplates}
                wochenplanSetzen={wochenplanSetzen}
                wochenplanEntfernen={wochenplanEntfernen}
                titel={null}
              />
            </>
          )}

          {step.key === "supplemente" && (
            <>
              <Label>{t("onboarding.supplemente.tageszeiten.label")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {TAGESZEITEN.map((zeit) => (
                  <Pill key={zeit} label={tLabel(zeit)} selected={suppZeiten.includes(zeit)} onClick={() => setSuppZeiten((prev) => toggleInArray(prev, zeit))} />
                ))}
              </div>
              <Label>{t("onboarding.supplemente.name.label")}</Label>
              <TextInput value={suppName} onChange={setSuppName} placeholder={t("onboarding.supplemente.name.placeholder")} />
            </>
          )}

          {step.key === "medikamente" && (
            <>
              <Label>{tLabel("Name")}</Label>
              <TextInput value={medName} onChange={setMedName} placeholder={t("onboarding.medikamente.name.placeholder")} />
              <Label>{tLabel("Dosis")}</Label>
              <TextInput value={medMenge} onChange={setMedMenge} placeholder={t("onboarding.medikamente.dosis.placeholder")} />
              <Label>{tLabel("Kategorie")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {MEDIKAMENTE_KATEGORIEN.map((k) => (
                  <Pill key={k} label={tLabel(k)} selected={medKategorie === k} onClick={() => setMedKategorie(k)} />
                ))}
              </div>
              <Label>{tLabel("Einnahmeart")}</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {EINNAHMEARTEN.map((a) => (
                  <Pill key={a} label={tLabel(a)} selected={medEinnahmeart === a} onClick={() => setMedEinnahmeart(a)} />
                ))}
              </div>
            </>
          )}

          {!istMultiAdd && (
            <div style={{ marginTop: 14 }}>
              <ZieldauerField value={ziel} onChange={setZiel} />
            </div>
          )}

          {error && <div style={{ color: danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {istMultiAdd ? (
              <>
                <PrimaryButton onClick={hinzufuegen} disabled={saving}>
                  {saving ? t("onboarding.saving") : t("onboarding.hinzufuegen")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(hinzugefuegt.length > 0)}>
                  {hinzugefuegt.length > 0 ? tLabel("Weiter") : tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            ) : (
              <>
                <PrimaryButton onClick={speichernUndWeiter} disabled={saving}>
                  {saving ? t("onboarding.saving") : tLabel("Speichern & weiter")}
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
                  {tLabel("Doch überspringen")}
                </PrimaryButton>
              </>
            )}
          </div>
        </Card>
      )}
    </Shell>
  );
}
