import React, { useState } from "react";
import { Shell, Card, Label, TextInput, Pill, PrimaryButton, StatusBadge } from "../ui/primitives";
import { accent, accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { HINWEISE, TAGESZEITEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const LEERES_SUPPLEMENT = { name: "", tageszeiten: [], hinweis: "" };

export default function SupplementeView({ onHome }) {
  const { supplemente, supplementHinzufuegen, supplementEntfernen, supplementErledigt, toggleSupplementErledigt, confirmAlleTageszeit } =
    useAppData();
  const [neuesSupplement, setNeuesSupplement] = useState(LEERES_SUPPLEMENT);
  const [supplementTag, setSupplementTag] = useState(new Date());
  const [eigeneZeit, setEigeneZeit] = useState("");
  const [customHinweis, setCustomHinweis] = useState("");
  const [supplementError, setSupplementError] = useState(null);

  const toggleNeuesSupplementZeit = (z) =>
    setNeuesSupplement((prev) => ({
      ...prev,
      tageszeiten: prev.tageszeiten.includes(z) ? prev.tageszeiten.filter((x) => x !== z) : [...prev.tageszeiten, z],
    }));

  const eigeneZeitHinzufuegen = () => {
    const z = eigeneZeit.trim();
    if (!z || neuesSupplement.tageszeiten.includes(z)) return;
    setNeuesSupplement((prev) => ({ ...prev, tageszeiten: [...prev.tageszeiten, z] }));
    setEigeneZeit("");
  };

  const submit = async () => {
    setSupplementError(null);
    const hinweis = neuesSupplement.hinweis === "Sonstiges" ? customHinweis.trim() : neuesSupplement.hinweis;
    const result = await supplementHinzufuegen({ ...neuesSupplement, hinweis });
    if (!result?.ok) {
      setSupplementError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeuesSupplement(LEERES_SUPPLEMENT);
    setCustomHinweis("");
  };

  const today = new Date();
  const montag = addDays(today, -((today.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));
  const tagStr = toLocalISODate(supplementTag);
  const heuteAnzahl = supplemente.reduce((sum, s) => sum + s.tageszeiten.length, 0);
  const heuteErledigtAnzahl = supplemente.reduce(
    (sum, s) => sum + s.tageszeiten.filter((z) => supplementErledigt[`${tagStr}__${s.id}__${z}`]).length,
    0
  );

  // Feste Tageszeiten zuerst, danach alle frei benannten Zeiten/Anlässe, die
  // irgendein Supplement tatsächlich benutzt (z. B. "Vor dem Training").
  const alleZeiten = [
    ...TAGESZEITEN,
    ...Array.from(new Set(supplemente.flatMap((s) => s.tageszeiten))).filter((z) => !TAGESZEITEN.includes(z)),
  ];

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>💊 Supplemente</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neues Supplement</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Name</Label>
        <TextInput value={neuesSupplement.name} onChange={(v) => setNeuesSupplement((p) => ({ ...p, name: v }))} placeholder="z. B. Omega-3" />
        <Label>Tageszeit(en)</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {TAGESZEITEN.map((z) => (
            <Pill key={z} label={z} selected={neuesSupplement.tageszeiten.includes(z)} onClick={() => toggleNeuesSupplementZeit(z)} />
          ))}
          {neuesSupplement.tageszeiten
            .filter((z) => !TAGESZEITEN.includes(z))
            .map((z) => (
              <Pill key={z} label={z} selected onClick={() => toggleNeuesSupplementZeit(z)} />
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
        <Label>Hinweis (optional)</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {HINWEISE.map((h) => (
            <Pill
              key={h}
              label={h}
              selected={neuesSupplement.hinweis === h}
              onClick={() => setNeuesSupplement((p) => ({ ...p, hinweis: p.hinweis === h ? "" : h }))}
            />
          ))}
        </div>
        {neuesSupplement.hinweis === "Sonstiges" && (
          <div style={{ marginTop: 6 }}>
            <TextInput value={customHinweis} onChange={setCustomHinweis} placeholder="z. B. Mit viel Wasser einnehmen" />
          </div>
        )}
        {supplementError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{supplementError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neuesSupplement.name.trim() || neuesSupplement.tageszeiten.length === 0}>
            + Zum Plan hinzufügen
          </PrimaryButton>
        </div>
      </Card>

      {supplemente.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Supplemente im Plan — leg oben dein erstes an.
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
                <div style={{ fontSize: 11, color: textMuted }}>Gaben am {fmtDate(supplementTag)}</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{supplemente.length}</div>
                <div style={{ fontSize: 11, color: textMuted }}>Supplemente im Plan</div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto" }}>
            {wochentage.map((d, i) => {
              const active = sameDay(d, supplementTag);
              return (
                <button
                  key={i}
                  onClick={() => setSupplementTag(d)}
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
            const items = supplemente.filter((s) => s.tageszeiten.includes(zeit));
            if (items.length === 0) return null;
            const offeneIds = items.filter((s) => !supplementErledigt[`${tagStr}__${s.id}__${zeit}`]).map((s) => s.id);
            return (
              <React.Fragment key={zeit}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{zeit}</div>
                  {offeneIds.length > 1 && (
                    <button
                      onClick={() => confirmAlleTageszeit(tagStr, zeit, items.map((s) => s.id))}
                      style={{ border: "none", background: "transparent", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Alle bestätigen
                    </button>
                  )}
                </div>
                <Card style={{ marginBottom: 14 }}>
                  {items.map((s, i) => {
                    const k = `${tagStr}__${s.id}__${zeit}`;
                    const done = !!supplementErledigt[k];
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: i < items.length - 1 ? `1px solid ${cardBorder}` : "none",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                          {s.hinweis && <div style={{ fontSize: 12, color: textMuted }}>{s.hinweis}</div>}
                        </div>
                        {done ? (
                          <StatusBadge status="erledigt" />
                        ) : (
                          <button
                            onClick={() => toggleSupplementErledigt(tagStr, s.id, zeit)}
                            style={{
                              padding: "7px 16px",
                              borderRadius: 10,
                              border: "none",
                              background: accent,
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
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

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dein Plan verwalten</div>
          <Card>
            {supplemente.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: i < supplemente.length - 1 ? `1px solid ${cardBorder}` : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>
                    {s.tageszeiten.join(", ")} {s.hinweis && `· ${s.hinweis}`}
                  </div>
                </div>
                <button
                  onClick={() => supplementEntfernen(s.id)}
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
