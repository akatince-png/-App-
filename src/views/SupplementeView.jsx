import React, { useState } from "react";
import { Shell, Card, Label, TextInput, Pill, PrimaryButton, StatusBadge } from "../ui/primitives";
import GrundEingabe from "../ui/GrundEingabe";
import { accent, accentDark, cardBorder, danger, textMuted } from "../ui/theme";
import { HINWEISE, TAGESZEITEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import ViewHeader from "../ui/ViewHeader";

function SupplementZeile({ s, istLetzte, onAendern, onEntfernen }) {
  const [offen, setOffen] = useState(false);
  const [entwurf, setEntwurf] = useState({ name: s.name, tageszeiten: s.tageszeiten, hinweis: s.hinweis });
  const [grund, setGrund] = useState("");

  const toggleZeit = (z) =>
    setEntwurf((p) => ({ ...p, tageszeiten: p.tageszeiten.includes(z) ? p.tageszeiten.filter((x) => x !== z) : [...p.tageszeiten, z] }));

  const speichern = () => {
    onAendern(s, entwurf, grund);
    setGrund("");
    setOffen(false);
  };

  return (
    <div style={{ padding: "8px 0", borderBottom: istLetzte ? "none" : `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: textMuted }}>
            {/* Im Onboarding angelegte Supplemente haben konkrete Uhrzeiten
                statt der groben Tageszeiten — sonst stünde hier nichts. */}
            {(s.uhrzeiten?.length ? s.uhrzeiten : s.tageszeiten).join(", ")}
            {s.menge && ` · ${s.menge}`}
            {s.hinweis && ` · ${s.hinweis}`}
          </div>
        </div>
        <button
          onClick={() => setOffen((v) => !v)}
          style={{ border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginRight: 12 }}
        >
          {offen ? "Zu" : "Bearbeiten"}
        </button>
        <button onClick={() => onEntfernen(s)} style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}>
          ×
        </button>
      </div>
      {offen && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#FAFBFA", border: `1px solid ${cardBorder}` }}>
          <Label>Name</Label>
          <TextInput value={entwurf.name} onChange={(v) => setEntwurf((p) => ({ ...p, name: v }))} />
          <Label>Tageszeit(en)</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {TAGESZEITEN.map((z) => (
              <Pill key={z} label={z} selected={entwurf.tageszeiten.includes(z)} onClick={() => toggleZeit(z)} />
            ))}
          </div>
          <Label>Hinweis</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {HINWEISE.map((h) => (
              <Pill key={h} label={h} selected={entwurf.hinweis === h} onClick={() => setEntwurf((p) => ({ ...p, hinweis: p.hinweis === h ? "" : h }))} />
            ))}
          </div>
          <GrundEingabe grund={grund} onChange={setGrund} />
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={speichern} disabled={!entwurf.name.trim() || entwurf.tageszeiten.length === 0}>
              Speichern
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

const LEERES_SUPPLEMENT = { name: "", tageszeiten: [], hinweis: "" };
const LEERES_REZEPT = { name: "", hinweis: "", zutaten: [{ name: "", menge: "" }] };

const UNTERTABS = [
  { id: "supplemente", label: "Supplemente" },
  { id: "rezepte", label: "Mischungen" },
];

export default function SupplementeView({ onHome, embedded = false }) {
  const [tab, setTab] = useState("supplemente");

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="💊 Supplemente" onHome={onHome} />
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {UNTERTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: `1px solid ${tab === t.id ? accent : cardBorder}`,
              background: tab === t.id ? accent : "#fff",
              color: tab === t.id ? "#fff" : textMuted,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "supplemente" ? <SupplementeSection /> : <RezepteSection />}
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}

function SupplementeSection() {
  const {
    supplemente,
    supplementHinzufuegen,
    supplementAendern,
    supplementEntfernen,
    supplementErledigt,
    toggleSupplementErledigt,
    confirmAlleTageszeit,
    aenderungVermerken,
  } = useAppData();
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
    aenderungVermerken({
      kategorie: "supplement",
      itemName: neuesSupplement.name,
      aktion: "hinzugefügt",
      detail: neuesSupplement.tageszeiten.join(", "),
    });
    setNeuesSupplement(LEERES_SUPPLEMENT);
    setCustomHinweis("");
  };

  // Übergabe an <KiChat onUebernehmen>: legt das im Gespräch besprochene
  // Supplement über denselben Weg an wie das manuelle Formular unten.
  const handleSupplementUebernehmen = async (verlauf) => {
    const s = await AIService.supplementAusChat({ verlauf, coachName: getCoachName() });
    const result = await supplementHinzufuegen({ name: s.name, tageszeiten: s.tageszeiten, hinweis: s.hinweis || "" });
    if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken({ kategorie: "supplement", itemName: s.name, aktion: "hinzugefügt", detail: s.tageszeiten.join(", ") });
    return s;
  };

  const handleAendern = (s, entwurf, grund) => {
    const aenderungen = [];
    if (entwurf.name !== s.name) aenderungen.push(`Name: ${s.name} → ${entwurf.name}`);
    if (entwurf.tageszeiten.join(",") !== s.tageszeiten.join(",")) {
      aenderungen.push(`Tageszeiten: ${s.tageszeiten.join(", ") || "–"} → ${entwurf.tageszeiten.join(", ") || "–"}`);
    }
    if (entwurf.hinweis !== s.hinweis) aenderungen.push(`Hinweis: ${s.hinweis || "–"} → ${entwurf.hinweis || "–"}`);
    if (aenderungen.length > 0) {
      aenderungVermerken({ kategorie: "supplement", itemName: s.name, aktion: "geändert", detail: aenderungen.join("; "), grund });
    }
    supplementAendern(s.id, entwurf);
  };

  const handleEntfernen = (s) => {
    aenderungVermerken({ kategorie: "supplement", itemName: s.name, aktion: "entfernt", detail: s.tageszeiten.join(", ") });
    supplementEntfernen(s.id);
  };

  const today = new Date();
  const montag = addDays(today, -((today.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));
  const tagStr = toLocalISODate(supplementTag);
  // Ein Supplement wird über konkrete Uhrzeiten geführt (im Onboarding
  // angelegt) ODER über die groben Tageszeiten (ältere Einträge) — beide
  // Varianten zählen hier gleichwertig.
  const zeitenVon = (s) => (s.uhrzeiten?.length ? s.uhrzeiten : s.tageszeiten || []);
  const heuteAnzahl = supplemente.reduce((sum, s) => sum + zeitenVon(s).length, 0);
  const heuteErledigtAnzahl = supplemente.reduce(
    (sum, s) => sum + zeitenVon(s).filter((z) => supplementErledigt[`${tagStr}__${s.id}__${z}`]).length,
    0
  );

  // Feste Tageszeiten zuerst, danach alle frei benannten Zeiten/Anlässe und
  // konkreten Uhrzeiten, die irgendein Supplement tatsächlich benutzt.
  const alleZeiten = [
    ...TAGESZEITEN,
    ...Array.from(new Set(supplemente.flatMap(zeitenVon))).filter((z) => !TAGESZEITEN.includes(z)),
  ];

  return (
    <>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
        Sag, welches Supplement du nehmen willst und wann — der Coach fragt bei Bedarf nach.
      </div>
      <KiChat
        bereich="supplemente"
        systemPrompt="Du hilfst dabei, ein neues Supplement für eine bestehende App einzurichten. Frag nach, zu welcher(n) Tageszeit(en) (Morgens/Mittags/Abends) es genommen werden soll und ob es einen Hinweis gibt (z. B. zur Mahlzeit, nüchtern, vor/nach dem Training), falls das noch fehlt. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Welches Supplement möchtest du hinzufügen?`}
        onUebernehmen={handleSupplementUebernehmen}
        uebernehmenLabel="Supplement anlegen"
        renderErgebnis={(s) => (
          <div style={{ padding: 12, borderRadius: 12, background: "#F6EFE1", fontSize: 12.5, lineHeight: 1.6 }}>
            "{s.name}" wurde angelegt · {s.tageszeiten.join(", ")}
            {s.hinweis ? ` · ${s.hinweis}` : ""}
          </div>
        )}
      />

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neues Supplement (manuell)</div>
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
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAGE[(d.getDay() + 6) % 7]}</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {alleZeiten.map((zeit) => {
            const items = supplemente.filter((s) => zeitenVon(s).includes(zeit));
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
              <SupplementZeile key={s.id} s={s} istLetzte={i === supplemente.length - 1} onAendern={handleAendern} onEntfernen={handleEntfernen} />
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function RezepteSection() {
  const { rezepte, rezeptHinzufuegen, rezeptEntfernen, rezeptErledigt, toggleRezeptErledigt } = useAppData();
  const [neuesRezept, setNeuesRezept] = useState(LEERES_REZEPT);
  const [rezeptError, setRezeptError] = useState(null);

  const today = new Date();
  const tagStr = toLocalISODate(today);

  const zutatAendern = (index, feld, wert) => {
    setNeuesRezept((prev) => ({
      ...prev,
      zutaten: prev.zutaten.map((z, i) => (i === index ? { ...z, [feld]: wert } : z)),
    }));
  };
  const zutatHinzufuegen = () => {
    setNeuesRezept((prev) => ({ ...prev, zutaten: [...prev.zutaten, { name: "", menge: "" }] }));
  };
  const zutatEntfernen = (index) => {
    setNeuesRezept((prev) => ({ ...prev, zutaten: prev.zutaten.filter((_, i) => i !== index) }));
  };

  const submit = async () => {
    setRezeptError(null);
    const result = await rezeptHinzufuegen(neuesRezept);
    if (!result?.ok) {
      setRezeptError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeuesRezept(LEERES_REZEPT);
  };

  const gueltig = neuesRezept.name.trim() && neuesRezept.zutaten.some((z) => z.name.trim());

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neuer Drink</div>
      <Card style={{ marginBottom: 14 }}>
        <Label>Name</Label>
        <TextInput value={neuesRezept.name} onChange={(v) => setNeuesRezept((p) => ({ ...p, name: v }))} placeholder="z. B. Pre-Workout" />

        <Label>Zutaten</Label>
        {neuesRezept.zutaten.map((z, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 2 }}>
              <TextInput value={z.name} onChange={(v) => zutatAendern(i, "name", v)} placeholder="Zutat, z. B. Kreatin" />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput value={z.menge} onChange={(v) => zutatAendern(i, "menge", v)} placeholder="Menge" />
            </div>
            {neuesRezept.zutaten.length > 1 && (
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

        <Label>Zeitpunkt / Anlass (optional)</Label>
        <TextInput value={neuesRezept.hinweis} onChange={(v) => setNeuesRezept((p) => ({ ...p, hinweis: v }))} placeholder="z. B. Direkt vor dem Training" />

        {rezeptError && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{rezeptError}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!gueltig}>
            + Drink speichern
          </PrimaryButton>
        </div>
      </Card>

      {rezepte.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Drinks angelegt — leg oben deinen ersten an, z. B. Pre-Workout oder deinen Elektrolyt-Drink.
          </div>
        </Card>
      ) : (
        rezepte.map((r) => {
          const k = `${tagStr}__${r.id}`;
          const done = !!rezeptErledigt[k];
          return (
            <Card key={r.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</div>
                  {r.hinweis && <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{r.hinweis}</div>}
                </div>
                <button
                  onClick={() => rezeptEntfernen(r.id)}
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginTop: 8, marginBottom: 10 }}>
                {r.zutaten.map((z) => (
                  <div key={z.id} style={{ fontSize: 12, color: textMuted, padding: "2px 0" }}>
                    • {z.name} {z.menge && `— ${z.menge}`}
                  </div>
                ))}
              </div>
              {done ? (
                <StatusBadge status="erledigt" />
              ) : (
                <button
                  onClick={() => toggleRezeptErledigt(tagStr, r.id)}
                  style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Heute bestätigen
                </button>
              )}
            </Card>
          );
        })
      )}
    </>
  );
}
