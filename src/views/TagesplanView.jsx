import React, { useCallback, useMemo, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import { accent, accentDark, accentSoft, cardBorder, textMuted } from "../ui/theme";
import {
  NEBENWIRKUNGEN_OPTIONEN,
  STAERKE_OPTIONEN,
  VERTRAEGLICHKEIT_OPTIONEN,
  WIRKUNG_OPTIONEN,
  WOCHENTAGE,
} from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { statusText } from "../utils/motivation";
import { buildDayItems, KATEGORIE_META as KATEGORIE } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Sonstige Zeiten";
}

const FEEDBACK_HEADER = {
  peptid: "Wie war es seit der letzten Injektion?",
  hormon: "Wie war die Einnahme?",
  supplement: "Wie war's?",
};

function FeedbackPanel({ item, kategorie, draftFeedback, setDraftFeedback, toggleDraftNebenwirkung, onSkip, onSave }) {
  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: accentSoft, border: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{FEEDBACK_HEADER[kategorie]}</div>

      {kategorie === "hormon" && (
        <>
          <Label>Verträglichkeit</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {VERTRAEGLICHKEIT_OPTIONEN.map((v) => (
              <Pill key={v} label={v} selected={draftFeedback.vertraeglichkeit === v} onClick={() => setDraftFeedback((p) => ({ ...p, vertraeglichkeit: v }))} />
            ))}
          </div>
        </>
      )}

      {(kategorie === "hormon" || kategorie === "supplement") && (
        <>
          <Label>Wirkung bemerkt?</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {WIRKUNG_OPTIONEN.map((w) => (
              <Pill key={w} label={w} selected={draftFeedback.wirkung === w} onClick={() => setDraftFeedback((p) => ({ ...p, wirkung: w }))} />
            ))}
          </div>
        </>
      )}

      <Label>Welche Nebenwirkungen hattest du?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {NEBENWIRKUNGEN_OPTIONEN.map((n) => (
          <Pill key={n} label={n} selected={draftFeedback.nebenwirkungen.includes(n)} onClick={() => toggleDraftNebenwirkung(n)} />
        ))}
      </div>

      {kategorie === "peptid" && (
        <>
          <Label>Wie stark?</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {STAERKE_OPTIONEN.map((s) => (
              <Pill key={s} label={s} selected={draftFeedback.staerke === s} onClick={() => setDraftFeedback((p) => ({ ...p, staerke: s }))} />
            ))}
          </div>
        </>
      )}

      <Label>Notizen (optional)</Label>
      <TextArea value={draftFeedback.notizen} onChange={(v) => setDraftFeedback((p) => ({ ...p, notizen: v }))} placeholder="Hier kannst du alles aufschreiben..." />

      {kategorie === "peptid" && (
        <>
          <Label>Foto (optional) — z. B. Rötung oder Knubbel an der Einstichstelle</Label>
          <input
            type="file"
            accept="image/*"
            id={`tagesplan-nebenwirkung-foto-${item.key}`}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setDraftFeedback((p) => ({ ...p, fotoFile: file, fotoPreview: URL.createObjectURL(file) }));
            }}
          />
          <label
            htmlFor={`tagesplan-nebenwirkung-foto-${item.key}`}
            style={{ display: "block", textAlign: "center", padding: "9px", borderRadius: 10, border: `1.5px dashed ${accent}`, background: "#fff", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 4 }}
          >
            📷 Foto aufnehmen
          </label>
          {draftFeedback.fotoPreview && (
            <img src={draftFeedback.fotoPreview} alt="Nebenwirkung" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onSkip} variant="ghost">
            Überspringen
          </PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onSave} variant="success">
            Speichern
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function TagesplanView({ onHome, onOpenTraining }) {
  const {
    plan,
    erledigt,
    dosierung,
    saveFeedback,
    skipFeedback,
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    saveHormonFeedback,
    skipHormonFeedback,
    supplemente,
    supplementErledigt,
    saveSupplementFeedback,
    skipSupplementFeedback,
    mahlzeiten,
    mahlzeitErledigt,
    toggleMahlzeitErledigt,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
    trainingHinzufuegen,
    gewohnheiten,
    gewohnheitErledigt,
    toggleGewohnheitErledigt,
  } = useAppData();

  const [modus, setModus] = useState("tag"); // 'tag' | 'woche'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [feedbackKategorie, setFeedbackKategorie] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({
    nebenwirkungen: [],
    staerke: "Keine",
    vertraeglichkeit: "Gut",
    wirkung: "Ja",
    notizen: "",
    fotoPreview: null,
    fotoFile: null,
  });
  const openFeedback = (dose, key, kategorie) => {
    setFeedbackOpen(key);
    setFeedbackKategorie(kategorie);
    // Positive Standardwerte vorausgewählt statt leer — der häufigste Fall
    // (alles in Ordnung) ist damit mit einem Tap auf "Speichern" erledigt.
    setDraftFeedback({ nebenwirkungen: [], staerke: "Keine", vertraeglichkeit: "Gut", wirkung: "Ja", notizen: "", fotoPreview: null, fotoFile: null });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));
  const handleSaveFeedback = (dose) => {
    if (feedbackKategorie === "peptid") saveFeedback(dose, draftFeedback);
    else if (feedbackKategorie === "hormon") saveHormonFeedback(dose, draftFeedback);
    else if (feedbackKategorie === "supplement") saveSupplementFeedback(dose, draftFeedback);
    setFeedbackOpen(null);
    setFeedbackKategorie(null);
  };
  const handleSkipFeedback = (dose) => {
    if (feedbackKategorie === "peptid") skipFeedback(dose);
    else if (feedbackKategorie === "hormon") skipHormonFeedback(dose);
    else if (feedbackKategorie === "supplement") skipSupplementFeedback(dose);
    setFeedbackOpen(null);
    setFeedbackKategorie(null);
  };

  const today = new Date();
  const montag = addDays(selectedDate, -((selectedDate.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));

  // Ein Trainings-Tagesplan-Punkt ist entweder schon eine echte Zeile (aus
  // trainingEintraege) oder nur virtuell aus dem Wochenplan abgeleitet. Beim
  // Antippen wird ein virtueller Punkt erst zu einer echten Zeile (aus der
  // Vorlage befüllt) und dann direkt ins Live-Workout geöffnet.
  const starteTraining = useCallback(
    async (item) => {
      if (!item.raw.virtuell) {
        onOpenTraining(item.raw.id);
        return;
      }
      const tpl = item.raw.template;
      const result = await trainingHinzufuegen({
        datum: item.raw.datum,
        uhrzeit: item.raw.uhrzeit || "",
        art: item.raw.art,
        name: tpl?.name || "",
        uebungen: tpl?.uebungen || [],
        dauerMin: tpl?.dauerMin || "",
        distanzKm: tpl?.distanzKm || "",
        puls: tpl?.puls || "",
        runden: tpl?.runden || "",
        intervallArbeitSek: tpl?.intervallArbeitSek || "",
        intervallPauseSek: tpl?.intervallPauseSek || "",
        rpe: "",
        kalorien: "",
        energielevel: "",
        schmerzen: "",
        bemerkungen: "",
        erledigt: false,
      });
      if (result?.ok) onOpenTraining(result.eintrag.id);
    },
    [onOpenTraining, trainingHinzufuegen]
  );

  const itemsForDate = useCallback(
    (date) => {
      const tagStr = toLocalISODate(date);
      const items = buildDayItems(date, {
        plan,
        erledigt,
        dosierung,
        hormonPlan,
        hormonErledigt,
        hormonDosierung,
        supplemente,
        supplementErledigt,
        mahlzeiten,
        mahlzeitErledigt,
        trainingEintraege,
        trainingWochenplan,
        trainingTemplates,
        gewohnheiten,
        gewohnheitErledigt,
      });
      return items.map((item) => {
        if (item.kategorie === "peptid") return { ...item, doseRef: item.raw, onConfirm: () => openFeedback(item.raw, item.key, "peptid") };
        if (item.kategorie === "hormon") return { ...item, doseRef: item.raw, onConfirm: () => openFeedback(item.raw, item.key, "hormon") };
        if (item.kategorie === "supplement") {
          const doseRef = { datum: tagStr, id: item.raw.id, zeit: item.uhrzeit };
          return { ...item, doseRef, onConfirm: () => openFeedback(doseRef, item.key, "supplement") };
        }
        if (item.kategorie === "training") return { ...item, onConfirm: () => starteTraining(item) };
        if (item.kategorie === "gewohnheit") return { ...item, onConfirm: () => toggleGewohnheitErledigt(tagStr, item.raw.id) };
        return { ...item, onConfirm: () => toggleMahlzeitErledigt(tagStr, item.raw.id, item.uhrzeit) };
      });
    },
    [
      plan,
      erledigt,
      dosierung,
      hormonPlan,
      hormonErledigt,
      hormonDosierung,
      supplemente,
      supplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      toggleMahlzeitErledigt,
      trainingEintraege,
      trainingWochenplan,
      trainingTemplates,
      gewohnheiten,
      gewohnheitErledigt,
      toggleGewohnheitErledigt,
      starteTraining,
    ]
  );

  const tagesItems = useMemo(() => itemsForDate(selectedDate), [selectedDate, itemsForDate]);

  const buckets = useMemo(() => {
    const map = new Map();
    tagesItems.forEach((item) => {
      const key = item.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, [tagesItems]);

  // Zeigt an, welcher Zeitblock gerade "dran" ist — auch müde auf einen Blick
  // erkennbar, ohne die ganze Liste durchgehen zu müssen. Nur relevant, wenn
  // der ausgewählte Tag heute ist; der nächste noch offene Block ab jetzt.
  const jetztHour = useMemo(() => {
    if (!sameDay(selectedDate, today)) return null;
    const nowStr = String(new Date().getHours()).padStart(2, "0");
    const kommend = buckets.map(([hour]) => hour).filter((hour) => hour && hour >= nowStr);
    return kommend.length ? kommend.sort()[0] : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, buckets]);

  const erledigtCount = tagesItems.filter((i) => i.done).length;

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🗓️ Tagesplan</div>
        <button
          className="mp-tap"
          onClick={onHome}
          style={{ width: 40, height: 40, borderRadius: 13, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 16, cursor: "pointer" }}
          title="Zum Dashboard"
        >
          ⌂
        </button>
      </div>

      {modus === "tag" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ProgressRing done={erledigtCount} total={tagesItems.length} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 3 }}>{fmtDate(selectedDate)}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{statusText(erledigtCount, tagesItems.length)}</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "tag", label: "Tag" },
          { id: "woche", label: "Woche" },
        ].map((t) => (
          <button
            key={t.id}
            className="mp-tap"
            onClick={() => setModus(t.id)}
            style={{
              flex: 1,
              minHeight: 44,
              padding: "9px 0",
              borderRadius: 13,
              border: `1px solid ${modus === t.id ? accent : cardBorder}`,
              background: modus === t.id ? accent : "#fff",
              color: modus === t.id ? "#fff" : textMuted,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {modus === "tag" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {wochentage.map((d, i) => {
            const active = sameDay(d, selectedDate);
            return (
              <button
                key={i}
                className="mp-tap"
                onClick={() => {
                  setSelectedDate(d);
                  setModus("tag");
                }}
                style={{
                  flex: "1 0 44px",
                  minHeight: 52,
                  padding: "8px 4px",
                  borderRadius: 13,
                  border: `1px solid ${active ? accent : cardBorder}`,
                  background: active ? accent : "#fff",
                  color: active ? "#fff" : sameDay(d, today) ? accentDark : textMuted,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAGE[d.getDay()]}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>
      )}

      {modus === "tag" && (
        <>
          {tagesItems.length === 0 && (
            <Card>
              <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Für diesen Tag steht nichts an. 🌿</div>
            </Card>
          )}

          {buckets.map(([hour, entries]) => {
            const istJetzt = hour === jetztHour;
            return (
            <React.Fragment key={hour || "sonstige"}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: istJetzt ? accentDark : textMuted }}>{hourLabel(hour)}</div>
                {istJetzt && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: accent, padding: "2px 8px", borderRadius: 8 }}>
                    JETZT
                  </span>
                )}
              </div>
              <Card style={{ marginBottom: 16, border: istJetzt ? `1.5px solid ${accent}` : undefined }}>
                {entries.map((item, i) => {
                  const k = KATEGORIE[item.kategorie];
                  const isOpen = feedbackOpen === item.key;
                  return (
                    <div key={item.key} style={{ padding: "12px 0", borderBottom: i < entries.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, marginTop: 6, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                              {item.name} {item.uhrzeit && <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {item.uhrzeit}</span>}
                            </div>
                            {item.detail && <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                            <div style={{ fontSize: 10, fontWeight: 700, color: k.text, background: k.bg, display: "inline-block", padding: "2px 8px", borderRadius: 8, marginTop: 4 }}>
                              {k.label}
                            </div>
                          </div>
                        </div>
                        {item.done ? (
                          <StatusBadge status="erledigt" />
                        ) : (
                          <button
                            className="mp-tap"
                            onClick={item.onConfirm}
                            style={{ minHeight: 40, padding: "8px 16px", borderRadius: 12, border: "none", background: k.dot, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                          >
                            {item.kategorie === "training" ? "Training starten" : "Bestätigen"}
                          </button>
                        )}
                      </div>

                      {["peptid", "hormon", "supplement"].includes(item.kategorie) && isOpen && (
                        <FeedbackPanel
                          item={item}
                          kategorie={item.kategorie}
                          draftFeedback={draftFeedback}
                          setDraftFeedback={setDraftFeedback}
                          toggleDraftNebenwirkung={toggleDraftNebenwirkung}
                          onSkip={() => handleSkipFeedback(item.doseRef)}
                          onSave={() => handleSaveFeedback(item.doseRef)}
                        />
                      )}
                    </div>
                  );
                })}
              </Card>
            </React.Fragment>
            );
          })}
        </>
      )}

      {modus === "woche" && (
        <>
          {wochentage.map((d) => {
            const items = itemsForDate(d);
            const done = items.filter((i) => i.done).length;
            const perKategorie = ["peptid", "hormon", "supplement", "mahlzeit", "training", "gewohnheit"].map((kat) => ({
              kat,
              count: items.filter((i) => i.kategorie === kat).length,
            }));
            return (
              <button
                key={d.toDateString()}
                className="mp-tap"
                onClick={() => {
                  setSelectedDate(d);
                  setModus("tag");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1px solid ${sameDay(d, today) ? accent : cardBorder}`,
                  borderRadius: 18,
                  background: "#fff",
                  padding: "14px 18px",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDate(d)}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>
                    {items.length > 0 ? `${done}/${items.length} erledigt` : "nichts geplant"}
                  </div>
                </div>
                {items.length > 0 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {perKategorie
                      .filter((p) => p.count > 0)
                      .map((p) => (
                        <div key={p.kat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: KATEGORIE[p.kat].text }}>
                          <div style={{ width: 7, height: 7, borderRadius: 4, background: KATEGORIE[p.kat].dot }} />
                          {p.count}× {KATEGORIE[p.kat].label}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </>
      )}
    </Shell>
  );
}
