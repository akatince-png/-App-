import React, { useState } from "react";
import { Shell, Card, Label, TextInput, Pill, PrimaryButton, StatusBadge } from "../ui/primitives";
import { accent, accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { TAGESZEITEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const LEERE_MAHLZEIT = { name: "", tageszeiten: [], hinweis: "", zutaten: [{ name: "", menge: "" }] };

export default function NutritionView({ onHome }) {
  const { mahlzeiten, mahlzeitHinzufuegen, mahlzeitEntfernen, mahlzeitErledigt, toggleMahlzeitErledigt } = useAppData();
  const [neueMahlzeit, setNeueMahlzeit] = useState(LEERE_MAHLZEIT);
  const [mahlzeitTag, setMahlzeitTag] = useState(new Date());
  const [eigeneZeit, setEigeneZeit] = useState("");
  const [mahlzeitError, setMahlzeitError] = useState(null);

  const toggleNeueMahlzeitZeit = (z) =>
    setNeueMahlzeit((prev) => ({
      ...prev,
      tageszeiten: prev.tageszeiten.includes(z) ? prev.tageszeiten.filter((x) => x !== z) : [...prev.tageszeiten, z],
    }));

  const eigeneZeitHinzufuegen = () => {
    const z = eigeneZeit.trim();
    if (!z || neueMahlzeit.tageszeiten.includes(z)) return;
    setNeueMahlzeit((prev) => ({ ...prev, tageszeiten: [...prev.tageszeiten, z] }));
    setEigeneZeit("");
  };

  const zutatAendern = (index, feld, wert) => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: prev.zutaten.map((z, i) => (i === index ? { ...z, [feld]: wert } : z)) }));
  };
  const zutatHinzufuegen = () => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: [...prev.zutaten, { name: "", menge: "" }] }));
  };
  const zutatEntfernen = (index) => {
    setNeueMahlzeit((prev) => ({ ...prev, zutaten: prev.zutaten.filter((_, i) => i !== index) }));
  };

  const submit = async () => {
    setMahlzeitError(null);
    const result = await mahlzeitHinzufuegen(neueMahlzeit);
    if (!result?.ok) {
      setMahlzeitError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeueMahlzeit(LEERE_MAHLZEIT);
  };

  const today = new Date();
  const montag = addDays(today, -((today.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));
  const tagStr = toLocalISODate(mahlzeitTag);
  const heuteAnzahl = mahlzeiten.reduce((sum, m) => sum + m.tageszeiten.length, 0);
  const heuteErledigtAnzahl = mahlzeiten.reduce(
    (sum, m) => sum + m.tageszeiten.filter((z) => mahlzeitErledigt[`${tagStr}__${m.id}__${z}`]).length,
    0
  );

  const alleZeiten = [
    ...TAGESZEITEN,
    ...Array.from(new Set(mahlzeiten.flatMap((m) => m.tageszeiten))).filter((z) => !TAGESZEITEN.includes(z)),
  ];

  return (
    <Shell>
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

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neue Mahlzeit</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Name</Label>
        <TextInput value={neueMahlzeit.name} onChange={(v) => setNeueMahlzeit((p) => ({ ...p, name: v }))} placeholder="z. B. Erste Mahlzeit / Proteinmahlzeit" />

        <Label>Tageszeit(en)</Label>
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
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 2 }}>
              <TextInput value={z.name} onChange={(v) => zutatAendern(i, "name", v)} placeholder="Zutat, z. B. Reis" />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput value={z.menge} onChange={(v) => zutatAendern(i, "menge", v)} placeholder="Menge" />
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

        <Label>Hinweis (optional)</Label>
        <TextInput value={neueMahlzeit.hinweis} onChange={(v) => setNeueMahlzeit((p) => ({ ...p, hinweis: v }))} placeholder="z. B. Ohne Zucker" />

        {mahlzeitError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{mahlzeitError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neueMahlzeit.name.trim() || neueMahlzeit.tageszeiten.length === 0}>
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
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAGE[d.getDay()]}</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {alleZeiten.map((zeit) => {
            const items = mahlzeiten.filter((m) => m.tageszeiten.includes(zeit));
            if (items.length === 0) return null;
            return (
              <React.Fragment key={zeit}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{zeit}</div>
                <Card style={{ marginBottom: 14 }}>
                  {items.map((m, i) => {
                    const k = `${tagStr}__${m.id}__${zeit}`;
                    const done = !!mahlzeitErledigt[k];
                    return (
                      <div
                        key={m.id}
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
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: i < mahlzeiten.length - 1 ? `1px solid ${cardBorder}` : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>
                    {m.tageszeiten.join(", ")} {m.hinweis && `· ${m.hinweis}`}
                  </div>
                  {m.zutaten.length > 0 && (
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                      {m.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => mahlzeitEntfernen(m.id)}
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
          </Card>
        </>
      )}
    </Shell>
  );
}
