import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput, Stepper } from "../../ui/primitives";
import ZieldauerField from "../../ui/ZieldauerField";
import { accentDark, danger, textMuted } from "../../ui/theme";
import { TAGESZEITEN, EINNAHMEARTEN, MEDIKAMENTE_KATEGORIEN } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { CATEGORY_STEPS } from "./categorySteps";

const ZIEL_LEER = { modus: "offen", wochen: "" };

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

// Ein Kurz-Screen pro "Pläne"-Bereich (Gewohnheiten, Schlaf, Hydration,
// Ernährung, Training, Supplemente, Medikamente) — jeweils "Später" vs.
// "Jetzt einrichten", bei Jetzt 2–4 Felder plus Zieldauer. Peptide sind hier
// bewusst nicht dabei, die laufen schon über ProtocolFormView davor.
export default function OnboardingCategoriesView({ onFinished }) {
  const { gewohnheitHinzufuegen, hydrationZielMl, hydrationZielSetzen, mahlzeitHinzufuegen, supplementHinzufuegen, hormonHinzufuegen, setCategoryZiel } =
    useAppData();

  const [index, setIndex] = useState(0);
  const [modus, setModus] = useState(null); // null | "jetzt"
  const [ziel, setZiel] = useState(ZIEL_LEER);
  const [eingerichtet, setEingerichtet] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [gName, setGName] = useState("");
  const [schlafBett, setSchlafBett] = useState("22:30");
  const [schlafAuf, setSchlafAuf] = useState("06:30");
  const [hydrationMl, setHydrationMl] = useState(String(hydrationZielMl || 2500));
  const [mahlName, setMahlName] = useState("");
  const [mahlZeiten, setMahlZeiten] = useState([]);
  const [trainingProWoche, setTrainingProWoche] = useState("3");
  const [suppName, setSuppName] = useState("");
  const [suppZeiten, setSuppZeiten] = useState([]);
  const [medName, setMedName] = useState("");
  const [medMenge, setMedMenge] = useState("");
  const [medKategorie, setMedKategorie] = useState("Hormone");
  const [medEinnahmeart, setMedEinnahmeart] = useState("Injektion");

  const step = CATEGORY_STEPS[index];
  const istLetzter = index === CATEGORY_STEPS.length - 1;

  const resetLokal = () => {
    setModus(null);
    setZiel(ZIEL_LEER);
    setError(null);
    setGName("");
    setSchlafBett("22:30");
    setSchlafAuf("06:30");
    setHydrationMl(String(hydrationZielMl || 2500));
    setMahlName("");
    setMahlZeiten([]);
    setTrainingProWoche("3");
    setSuppName("");
    setSuppZeiten([]);
    setMedName("");
    setMedMenge("");
    setMedKategorie("Hormone");
    setMedEinnahmeart("Injektion");
  };

  const weiter = (wurdeEingerichtet) => {
    const naechsteListe = wurdeEingerichtet ? [...eingerichtet, { icon: step.icon, label: step.label }] : eingerichtet;
    if (istLetzter) {
      onFinished(naechsteListe);
      return;
    }
    setEingerichtet(naechsteListe);
    setIndex((i) => i + 1);
    resetLokal();
  };

  const uebernehmen = async () => {
    setError(null);
    setSaving(true);
    let result = { ok: true };

    if (step.key === "gewohnheiten") {
      if (!gName.trim()) {
        setError("Bitte einen Namen eingeben.");
        setSaving(false);
        return;
      }
      result = await gewohnheitHinzufuegen({
        name: gName,
        icon: "🌱",
        uhrzeit: "",
        zielTage: ziel.modus === "wochen" && ziel.wochen ? Number(ziel.wochen) * 7 : null,
      });
    } else if (step.key === "schlaf") {
      setCategoryZiel("schlaf", { bettzeit: schlafBett, aufwachzeit: schlafAuf, modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "hydration") {
      await hydrationZielSetzen(Math.max(0, Number(hydrationMl) || 0));
      setCategoryZiel("hydration", { modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "ernaehrung") {
      if (!mahlName.trim()) {
        setError("Bitte einen Namen eingeben.");
        setSaving(false);
        return;
      }
      if (mahlZeiten.length === 0) {
        setError("Bitte mindestens eine Tageszeit wählen.");
        setSaving(false);
        return;
      }
      result = await mahlzeitHinzufuegen({ name: mahlName, tageszeiten: mahlZeiten, hinweis: "" });
      if (result?.ok) setCategoryZiel("ernaehrung", { modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "training") {
      setCategoryZiel("training", { modus: ziel.modus, wochen: ziel.wochen, proWoche: trainingProWoche });
    } else if (step.key === "supplemente") {
      if (!suppName.trim()) {
        setError("Bitte einen Namen eingeben.");
        setSaving(false);
        return;
      }
      if (suppZeiten.length === 0) {
        setError("Bitte mindestens eine Tageszeit wählen.");
        setSaving(false);
        return;
      }
      result = await supplementHinzufuegen({ name: suppName, tageszeiten: suppZeiten, hinweis: "" });
      if (result?.ok) setCategoryZiel("supplemente", { modus: ziel.modus, wochen: ziel.wochen });
    } else if (step.key === "medikamente") {
      if (!medName.trim()) {
        setError("Bitte einen Namen eingeben.");
        setSaving(false);
        return;
      }
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
      if (result?.ok) setCategoryZiel("medikamente", { modus: ziel.modus, wochen: ziel.wochen });
    }

    setSaving(false);
    if (!result?.ok) {
      setError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    weiter(true);
  };

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
          {index + 1} von {CATEGORY_STEPS.length}
        </div>
        <div className="mp-tap" onClick={() => onFinished(eingerichtet)} style={{ fontSize: 12, fontWeight: 700, color: accentDark, cursor: "pointer" }}>
          Alles überspringen
        </div>
      </div>
      <Stepper step={index} total={CATEGORY_STEPS.length} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 28 }}>{step.icon}</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{step.label} einrichten?</div>
      </div>

      {modus === null && (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            Du kannst diesen Bereich jetzt kurz einrichten oder später jederzeit über das Dashboard nachholen.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => setModus("jetzt")}>Jetzt einrichten</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
              Später einrichten
            </PrimaryButton>
          </div>
        </Card>
      )}

      {modus === "jetzt" && (
        <Card>
          {step.key === "gewohnheiten" && (
            <>
              <Label>Name der Gewohnheit</Label>
              <TextInput value={gName} onChange={setGName} placeholder="z. B. 10 Minuten Spaziergang" />
            </>
          )}

          {step.key === "schlaf" && (
            <>
              <Label>Bettzeit</Label>
              <TextInput type="time" value={schlafBett} onChange={setSchlafBett} />
              <Label>Aufwachzeit</Label>
              <TextInput type="time" value={schlafAuf} onChange={setSchlafAuf} />
              <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>→ Ziel: {berechneSchlafstunden(schlafBett, schlafAuf)} Std. Schlaf</div>
            </>
          )}

          {step.key === "hydration" && (
            <>
              <Label>Tagesziel (ml)</Label>
              <TextInput type="number" value={hydrationMl} onChange={setHydrationMl} placeholder="z. B. 2500" />
            </>
          )}

          {step.key === "ernaehrung" && (
            <>
              <Label>Name der Mahlzeit</Label>
              <TextInput value={mahlName} onChange={setMahlName} placeholder="z. B. Frühstück" />
              <Label>Tageszeiten</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {TAGESZEITEN.map((t) => (
                  <Pill key={t} label={t} selected={mahlZeiten.includes(t)} onClick={() => setMahlZeiten((prev) => toggleInArray(prev, t))} />
                ))}
              </div>
            </>
          )}

          {step.key === "training" && (
            <>
              <Label>Wie oft pro Woche?</Label>
              <TextInput type="number" value={trainingProWoche} onChange={setTrainingProWoche} placeholder="z. B. 3" />
            </>
          )}

          {step.key === "supplemente" && (
            <>
              <Label>Name des Supplements</Label>
              <TextInput value={suppName} onChange={setSuppName} placeholder="z. B. Vitamin D" />
              <Label>Tageszeiten</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {TAGESZEITEN.map((t) => (
                  <Pill key={t} label={t} selected={suppZeiten.includes(t)} onClick={() => setSuppZeiten((prev) => toggleInArray(prev, t))} />
                ))}
              </div>
            </>
          )}

          {step.key === "medikamente" && (
            <>
              <Label>Name</Label>
              <TextInput value={medName} onChange={setMedName} placeholder="z. B. Metformin" />
              <Label>Dosis</Label>
              <TextInput value={medMenge} onChange={setMedMenge} placeholder="z. B. 500mg" />
              <Label>Kategorie</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {MEDIKAMENTE_KATEGORIEN.map((k) => (
                  <Pill key={k} label={k} selected={medKategorie === k} onClick={() => setMedKategorie(k)} />
                ))}
              </div>
              <Label>Einnahmeart</Label>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {EINNAHMEARTEN.map((a) => (
                  <Pill key={a} label={a} selected={medEinnahmeart === a} onClick={() => setMedEinnahmeart(a)} />
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 14 }}>
            <ZieldauerField value={ziel} onChange={setZiel} />
          </div>

          {error && <div style={{ color: danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            <PrimaryButton onClick={uebernehmen} disabled={saving}>
              {saving ? "Speichert..." : "Speichern & weiter"}
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => weiter(false)}>
              Doch überspringen
            </PrimaryButton>
          </div>
        </Card>
      )}
    </Shell>
  );
}
