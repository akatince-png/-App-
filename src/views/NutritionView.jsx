import React, { useState } from "react";
import { Shell, Card, Label, TextInput, Pill, PrimaryButton, StatusBadge } from "../ui/primitives";
import GrundEingabe from "../ui/GrundEingabe";
import WochentagPills from "../ui/WochentagPills";
import { SignedPhoto } from "../ui/SignedPhoto";
import { accent, accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { TAGESZEITEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const LEERE_MAHLZEIT = { name: "", tageszeiten: [], wochentage: [], hinweis: "", zutaten: [{ name: "", menge: "", mengeGramm: "", kcalPro100g: "" }] };

function kcalFuerZutat(z) {
  const g = Number(z.mengeGramm);
  const k = Number(z.kcalPro100g);
  if (!g || !k) return 0;
  return (g / 100) * k;
}

function ZutatKcalFelder({ zutat, onChange }) {
  const [offen, setOffen] = useState(false);
  const kcal = kcalFuerZutat(zutat);
  return (
    <div style={{ marginBottom: 6 }}>
      {!offen ? (
        <button
          onClick={() => setOffen(true)}
          style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 0" }}
        >
          + Menge in Gramm {kcal > 0 && `(≈ ${Math.round(kcal)} kcal)`}
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <TextInput type="number" value={zutat.mengeGramm} onChange={(v) => onChange("mengeGramm", v)} placeholder="Gramm" />
          </div>
          <div style={{ flex: 1 }}>
            <TextInput type="number" value={zutat.kcalPro100g} onChange={(v) => onChange("kcalPro100g", v)} placeholder="kcal/100g" />
          </div>
          <div style={{ fontSize: 11, color: textMuted, whiteSpace: "nowrap" }}>{kcal > 0 ? `≈ ${Math.round(kcal)} kcal` : ""}</div>
        </div>
      )}
    </div>
  );
}

function MahlzeitZeile({ m, istLetzte, wochenplanEintraege, onAendern, onEntfernen, onWochentagToggle, onZutatAendern, onFotoAendern }) {
  const [offen, setOffen] = useState(false);
  const [entwurf, setEntwurf] = useState({ name: m.name, tageszeiten: m.tageszeiten, hinweis: m.hinweis });
  const [zutatenEntwurf, setZutatenEntwurf] = useState(() => m.zutaten.map((z) => ({ ...z })));
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState(null);
  const [fotoFehler, setFotoFehler] = useState(null);

  const fotoAuswaehlen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFotoFehler(null);
    const result = await onFotoAendern(m.id, file);
    if (!result?.ok) setFotoFehler(result?.error || "Foto speichern fehlgeschlagen.");
  };

  const zugewieseneTage = wochenplanEintraege.map((w) => w.wochentag);
  const gesamtKcal = m.zutaten.reduce((sum, z) => sum + kcalFuerZutat(z), 0);

  const toggleZeit = (z) =>
    setEntwurf((p) => ({ ...p, tageszeiten: p.tageszeiten.includes(z) ? p.tageszeiten.filter((x) => x !== z) : [...p.tageszeiten, z] }));

  const zutatEntwurfAendern = (id, feld, wert) =>
    setZutatenEntwurf((prev) => prev.map((z) => (z.id === id ? { ...z, [feld]: wert } : z)));

  const oeffnen = () => {
    setEntwurf({ name: m.name, tageszeiten: m.tageszeiten, hinweis: m.hinweis });
    setZutatenEntwurf(m.zutaten.map((z) => ({ ...z })));
    setFehler(null);
    setOffen(true);
  };

  const speichern = async () => {
    setFehler(null);
    const geaenderteZutaten = zutatenEntwurf.filter((z) => {
      const original = m.zutaten.find((oz) => oz.id === z.id);
      return original && (String(original.mengeGramm ?? "") !== String(z.mengeGramm ?? "") || String(original.kcalPro100g ?? "") !== String(z.kcalPro100g ?? ""));
    });
    for (const z of geaenderteZutaten) {
      const result = await onZutatAendern(m.id, z.id, { mengeGramm: z.mengeGramm, kcalPro100g: z.kcalPro100g });
      if (!result?.ok) {
        setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
        return;
      }
    }
    onAendern(m, entwurf, grund);
    setGrund("");
    setOffen(false);
  };

  return (
    <div style={{ padding: "8px 0", borderBottom: istLetzte ? "none" : `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {m.fotoPath && (
          <div style={{ marginRight: 10, flexShrink: 0 }}>
            <SignedPhoto path={m.fotoPath} alt={m.name} size={40} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
          <div style={{ fontSize: 11, color: textMuted }}>
            {zugewieseneTage.length > 0 ? zugewieseneTage.join(", ") : "Keinem Wochentag zugewiesen"}
            {m.hinweis && ` · ${m.hinweis}`}
            {gesamtKcal > 0 && ` · ≈ ${Math.round(gesamtKcal)} kcal gesamt`}
          </div>
          {m.zutaten.length > 0 && (
            <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
              {m.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · ")}
            </div>
          )}
        </div>
        <button
          onClick={() => (offen ? setOffen(false) : oeffnen())}
          style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginRight: 12 }}
        >
          {offen ? "Zu" : "Bearbeiten"}
        </button>
        <button onClick={() => onEntfernen(m)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
          ×
        </button>
      </div>
      {offen && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
          <Label>Name</Label>
          <TextInput value={entwurf.name} onChange={(v) => setEntwurf((p) => ({ ...p, name: v }))} />
          <Label>Wochentage</Label>
          <WochentagPills selected={zugewieseneTage} onToggle={(tag) => onWochentagToggle(m, tag, zugewieseneTage.includes(tag))} />
          <Label>Tageszeit(en)</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {TAGESZEITEN.map((z) => (
              <Pill key={z} label={z} selected={entwurf.tageszeiten.includes(z)} onClick={() => toggleZeit(z)} />
            ))}
          </div>
          <Label>Hinweis</Label>
          <TextInput value={entwurf.hinweis} onChange={(v) => setEntwurf((p) => ({ ...p, hinweis: v }))} placeholder="optional" />
          <Label>Foto</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {m.fotoPath && <SignedPhoto path={m.fotoPath} alt={m.name} size={44} />}
            <input type="file" accept="image/*" id={`mahlzeit-foto-${m.id}`} style={{ display: "none" }} onChange={fotoAuswaehlen} />
            <label
              htmlFor={`mahlzeit-foto-${m.id}`}
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: accentDark,
                border: `1px dashed ${cardBorder}`,
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              📷 {m.fotoPath ? "Foto ersetzen" : "Foto hinzufügen"}
            </label>
          </div>
          {fotoFehler && <div style={{ fontSize: 12, color: danger, marginTop: 4 }}>{fotoFehler}</div>}
          {zutatenEntwurf.length > 0 && (
            <>
              <Label>Zutaten</Label>
              {zutatenEntwurf.map((z) => (
                <div key={z.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{z.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <TextInput type="number" value={z.mengeGramm ?? ""} onChange={(v) => zutatEntwurfAendern(z.id, "mengeGramm", v)} placeholder="Gramm" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextInput type="number" value={z.kcalPro100g ?? ""} onChange={(v) => zutatEntwurfAendern(z.id, "kcalPro100g", v)} placeholder="kcal/100g" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          <GrundEingabe grund={grund} onChange={setGrund} />
          {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={speichern} disabled={!entwurf.name.trim()}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NutritionView({ onHome, embedded = false }) {
  const {
    mahlzeiten,
    mahlzeitHinzufuegen,
    mahlzeitAendern,
    mahlzeitEntfernen,
    zutatAendern,
    setMahlzeitFoto,
    mahlzeitErledigt,
    toggleMahlzeitErledigt,
    mealWochenplan,
    wochenplanMahlzeitSetzen,
    wochenplanMahlzeitEntfernen,
    aenderungVermerken,
  } = useAppData();
  const [neueMahlzeit, setNeueMahlzeit] = useState(LEERE_MAHLZEIT);
  const [mahlzeitTag, setMahlzeitTag] = useState(new Date());
  const [eigeneZeit, setEigeneZeit] = useState("");
  const [mahlzeitError, setMahlzeitError] = useState(null);

  const toggleNeueMahlzeitZeit = (z) =>
    setNeueMahlzeit((prev) => ({
      ...prev,
      tageszeiten: prev.tageszeiten.includes(z) ? prev.tageszeiten.filter((x) => x !== z) : [...prev.tageszeiten, z],
    }));

  const toggleNeueMahlzeitWochentag = (tag) =>
    setNeueMahlzeit((prev) => ({
      ...prev,
      wochentage: prev.wochentage.includes(tag) ? prev.wochentage.filter((t) => t !== tag) : [...prev.wochentage, tag],
    }));

  const eigeneZeitHinzufuegen = () => {
    const z = eigeneZeit.trim();
    if (!z || neueMahlzeit.tageszeiten.includes(z)) return;
    setNeueMahlzeit((prev) => ({ ...prev, tageszeiten: [...prev.tageszeiten, z] }));
    setEigeneZeit("");
  };

  const entwurfZutatAendern = (index, feld, wert) => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: prev.zutaten.map((z, i) => (i === index ? { ...z, [feld]: wert } : z)) }));
  };
  const zutatHinzufuegen = () => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: [...prev.zutaten, { name: "", menge: "", mengeGramm: "", kcalPro100g: "" }] }));
  };
  const zutatEntfernen = (index) => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: prev.zutaten.filter((_, i) => i !== index) }));
  };

  const neueMahlzeitKcal = neueMahlzeit.zutaten.reduce((sum, z) => sum + kcalFuerZutat(z), 0);

  const submit = async () => {
    setMahlzeitError(null);
    const result = await mahlzeitHinzufuegen(neueMahlzeit);
    if (!result?.ok) {
      setMahlzeitError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    const wochentagErgebnisse = await Promise.all(
      neueMahlzeit.wochentage.map((tag) =>
        wochenplanMahlzeitSetzen(tag, { mealId: result.meal.id, tageszeit: neueMahlzeit.tageszeiten[0] || null, uhrzeit: null })
      )
    );
    const fehlgeschlagen = wochentagErgebnisse.find((r) => !r?.ok);
    if (fehlgeschlagen) {
      setMahlzeitError(
        `Mahlzeit wurde angelegt, aber nicht allen Wochentagen zugewiesen: ${fehlgeschlagen.error || "Speichern fehlgeschlagen."}`
      );
    }
    aenderungVermerken({
      kategorie: "mahlzeit",
      itemName: neueMahlzeit.name,
      aktion: "hinzugefügt",
      detail: neueMahlzeit.wochentage.length > 0 ? neueMahlzeit.wochentage.join(", ") : "noch keinem Tag zugewiesen",
    });
    setNeueMahlzeit(LEERE_MAHLZEIT);
  };

  const handleAendern = (m, entwurf, grund) => {
    const aenderungen = [];
    if (entwurf.name !== m.name) aenderungen.push(`Name: ${m.name} → ${entwurf.name}`);
    if (entwurf.tageszeiten.join(",") !== m.tageszeiten.join(",")) {
      aenderungen.push(`Tageszeiten: ${m.tageszeiten.join(", ") || "–"} → ${entwurf.tageszeiten.join(", ") || "–"}`);
    }
    if (entwurf.hinweis !== m.hinweis) aenderungen.push(`Hinweis: ${m.hinweis || "–"} → ${entwurf.hinweis || "–"}`);
    if (aenderungen.length > 0) {
      aenderungVermerken({ kategorie: "mahlzeit", itemName: m.name, aktion: "geändert", detail: aenderungen.join("; "), grund });
    }
    mahlzeitAendern(m.id, entwurf);
  };

  const handleEntfernen = (m) => {
    const tage = mealWochenplan.filter((w) => w.mealId === m.id).map((w) => w.wochentag);
    aenderungVermerken({ kategorie: "mahlzeit", itemName: m.name, aktion: "entfernt", detail: tage.join(", ") });
    mahlzeitEntfernen(m.id);
  };

  const handleWochentagToggle = async (m, tag, warZugewiesen) => {
    if (warZugewiesen) {
      const zeilen = mealWochenplan.filter((w) => w.mealId === m.id && w.wochentag === tag);
      await Promise.all(zeilen.map((w) => wochenplanMahlzeitEntfernen(w.id)));
      aenderungVermerken({ kategorie: "mahlzeit", itemName: m.name, aktion: "geändert", detail: `${tag} entfernt` });
    } else {
      await wochenplanMahlzeitSetzen(tag, { mealId: m.id, tageszeit: m.tageszeiten[0] || null, uhrzeit: null });
      aenderungVermerken({ kategorie: "mahlzeit", itemName: m.name, aktion: "geändert", detail: `${tag} hinzugefügt` });
    }
  };

  const today = new Date();
  const montag = addDays(today, -((today.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));
  const tagStr = toLocalISODate(mahlzeitTag);
  const wochentagLabel = WOCHENTAGE[(mahlzeitTag.getDay() + 6) % 7];

  // Nur Mahlzeiten, die diesem Wochentag tatsächlich zugewiesen sind — nicht
  // mehr jede Mahlzeit an jedem Tag (siehe dayItems.js für dieselbe Logik
  // im Tagesplan).
  const tagesEintraege = mealWochenplan
    .filter((w) => w.wochentag === wochentagLabel)
    .map((w) => ({ ...w, mahlzeit: mahlzeiten.find((m) => m.id === w.mealId) }))
    .filter((e) => e.mahlzeit);

  const heuteAnzahl = tagesEintraege.length;
  const heuteErledigtAnzahl = tagesEintraege.filter((e) => mahlzeitErledigt[`${tagStr}__${e.mealId}__${e.tageszeit || "Mahlzeit"}`]).length;

  const zeitGruppen = Array.from(new Set(tagesEintraege.map((e) => e.tageszeit || "Mahlzeit")));

  const content = (
    <>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>🥗 Ernährungsplan</div>
          <button
            onClick={onHome}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Zum Dashboard"
          >
            ⌂
          </button>
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neue Mahlzeit</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Name</Label>
        <TextInput value={neueMahlzeit.name} onChange={(v) => setNeueMahlzeit((p) => ({ ...p, name: v }))} placeholder="z. B. Erste Mahlzeit / Proteinmahlzeit" />

        <Label>Wann in der Woche?</Label>
        <WochentagPills selected={neueMahlzeit.wochentage} onToggle={toggleNeueMahlzeitWochentag} />
        <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
          Leer lassen = die Mahlzeit wird angelegt, taucht aber noch in keinem Tagesplan auf — Tage kannst du jederzeit später anpassen.
        </div>

        <Label>Tageszeit (optional, nur zur Beschriftung)</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TAGESZEITEN.map((z) => (
            <Pill key={z} label={z} selected={neueMahlzeit.tageszeiten.includes(z)} onClick={() => toggleNeueMahlzeitZeit(z)} />
          ))}
          {neueMahlzeit.tageszeiten
            .filter((z) => !TAGESZEITEN.includes(z))
            .map((z) => (
              <Pill key={z} label={z} selected onClick={() => toggleNeueMahlzeitZeit(z)} />
            ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={eigeneZeit} onChange={setEigeneZeit} placeholder="Eigene Zeit/Anlass, z. B. Vor dem Training" />
          </div>
          <button
            onClick={eigeneZeitHinzufuegen}
            style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
          >
            +
          </button>
        </div>

        <Label>Zutaten (optional)</Label>
        {neueMahlzeit.zutaten.map((z, i) => (
          <div key={i}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 2 }}>
                <TextInput value={z.name} onChange={(v) => entwurfZutatAendern(i, "name", v)} placeholder="Zutat, z. B. Reis" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput value={z.menge} onChange={(v) => entwurfZutatAendern(i, "menge", v)} placeholder="Menge" />
              </div>
              {neueMahlzeit.zutaten.length > 1 && (
                <button
                  onClick={() => zutatEntfernen(i)}
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer", padding: "0 4px" }}
                >
                  ×
                </button>
              )}
            </div>
            <ZutatKcalFelder zutat={z} onChange={(feld, wert) => entwurfZutatAendern(i, feld, wert)} />
          </div>
        ))}
        <button
          onClick={zutatHinzufuegen}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 10,
            border: `1px dashed ${cardBorder}`,
            background: "transparent",
            color: accentDark,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          + weitere Zutat
        </button>
        {neueMahlzeitKcal > 0 && (
          <div style={{ fontSize: 12, color: textMuted, fontWeight: 700, marginBottom: 6 }}>≈ {Math.round(neueMahlzeitKcal)} kcal gesamt</div>
        )}

        <Label>Hinweis (optional)</Label>
        <TextInput value={neueMahlzeit.hinweis} onChange={(v) => setNeueMahlzeit((p) => ({ ...p, hinweis: v }))} placeholder="z. B. Ohne Zucker" />

        {mahlzeitError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{mahlzeitError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neueMahlzeit.name.trim()}>
            + Zum Plan hinzufügen
          </PrimaryButton>
        </div>
      </Card>

      {mahlzeiten.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Mahlzeiten im Plan — leg oben deine erste an.
          </div>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: accentDark }}>
                  {heuteErledigtAnzahl}/{heuteAnzahl}
                </div>
                <div style={{ fontSize: 11, color: textMuted }}>Mahlzeiten am {fmtDate(mahlzeitTag)}</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{mahlzeiten.length}</div>
                <div style={{ fontSize: 11, color: textMuted }}>Mahlzeiten im Plan</div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto" }}>
            {wochentage.map((d, i) => {
              const active = sameDay(d, mahlzeitTag);
              return (
                <button
                  key={i}
                  onClick={() => setMahlzeitTag(d)}
                  style={{
                    flex: "1 0 42px",
                    padding: "8px 4px",
                    borderRadius: 10,
                    border: `1px solid ${active ? accent : cardBorder}`,
                    background: active ? accent : "#fff",
                    color: active ? "#fff" : sameDay(d, today) ? accentDark : textMuted,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAGE[(d.getDay() + 6) % 7]}</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {zeitGruppen.length === 0 && (
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Für diesen Tag sind keine Mahlzeiten eingeplant.</div>
            </Card>
          )}

          {zeitGruppen.map((zeit) => {
            const items = tagesEintraege.filter((e) => (e.tageszeit || "Mahlzeit") === zeit);
            if (items.length === 0) return null;
            return (
              <React.Fragment key={zeit}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{zeit}</div>
                <Card style={{ marginBottom: 14 }}>
                  {items.map((e, i) => {
                    const m = e.mahlzeit;
                    const k = `${tagStr}__${m.id}__${zeit}`;
                    const done = !!mahlzeitErledigt[k];
                    return (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: i < items.length - 1 ? `1px solid ${cardBorder}` : "none",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                          {m.hinweis && <div style={{ fontSize: 12, color: textMuted }}>{m.hinweis}</div>}
                        </div>
                        {done ? (
                          <StatusBadge status="erledigt" />
                        ) : (
                          <button
                            onClick={() => toggleMahlzeitErledigt(tagStr, m.id, zeit)}
                            style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Bestätigen
                          </button>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </React.Fragment>
            );
          })}

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Deinen Ernährungsplan verwalten</div>
          <Card>
            {mahlzeiten.map((m, i) => (
              <MahlzeitZeile
                key={m.id}
                m={m}
                istLetzte={i === mahlzeiten.length - 1}
                wochenplanEintraege={mealWochenplan.filter((w) => w.mealId === m.id)}
                onAendern={handleAendern}
                onEntfernen={handleEntfernen}
                onWochentagToggle={handleWochentagToggle}
                onZutatAendern={zutatAendern}
                onFotoAendern={setMahlzeitFoto}
              />
            ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
