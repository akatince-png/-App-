import React, { useCallback, useMemo, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import { accent, accentDark, accentSoft, cardBorder, textMuted } from "../ui/theme";
import { NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { statusText } from "../utils/motivation";
import { buildDayItems, KATEGORIE_META as KATEGORIE } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Sonstige Zeiten";
}

function FeedbackPanel({ item, draftFeedback, setDraftFeedback, toggleDraftNebenwirkung, onSkip, onSave }) {
  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: accentSoft, border: `1px solid ${cardBorder}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Wie war es seit der letzten Injektion?</div>
      <Label>Welche Nebenwirkungen hattest du?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {NEBENWIRKUNGEN_OPTIONEN.map((n) => (
          <Pill key={n} label={n} selected={draftFeedback.nebenwirkungen.includes(n)} onClick={() => toggleDraftNebenwirkung(n)} />
        ))}
      </div>
      <Label>Wie stark?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {STAERKE_OPTIONEN.map((s) => (
          <Pill key={s} label={s} selected={draftFeedback.staerke === s} onClick={() => setDraftFeedback((p) => ({ ...p, staerke: s }))} />
        ))}
      </div>
      <Label>Notizen (optional)</Label>
      <TextArea value={draftFeedback.notizen} onChange={(v) => setDraftFeedback((p) => ({ ...p, notizen: v }))} placeholder="Hier kannst du alles aufschreiben..." />
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

export default function TagesplanView({ onHome }) {
  const {
    plan,
    erledigt,
    dosierung,
    saveFeedback,
    skipFeedback,
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    toggleHormonErledigt,
    supplemente,
    supplementErledigt,
    toggleSupplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    toggleMahlzeitErledigt,
    routinen,
    routineErledigt,
    toggleRoutineErledigt,
  } = useAppData();

  const [modus, setModus] = useState("tag"); // 'tag' | 'woche'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ nebenwirkungen: [], staerke: "Keine", notizen: "", fotoPreview: null, fotoFile: null });
  // Wenn eine Routine mit noch offenem Peptid-Anteil bestätigt wird: merkt sich,
  // welche Routine (an welchem Tag) nach dem Ausfüllen/Überspringen des
  // Nebenwirkungen-Formulars als erledigt markiert werden soll.
  const [pendingRoutineConfirm, setPendingRoutineConfirm] = useState(null);

  const openFeedback = (dose, key) => {
    setFeedbackOpen(key);
    // "Keine" vorausgewählt statt leer — der häufigste Fall (keine
    // Nebenwirkung) ist damit mit einem Tap auf "Speichern" erledigt.
    setDraftFeedback({ nebenwirkungen: [], staerke: "Keine", notizen: "", fotoPreview: null, fotoFile: null });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));
  const finishPendingRoutine = () => {
    if (pendingRoutineConfirm) {
      toggleRoutineErledigt(pendingRoutineConfirm.tagStr, pendingRoutineConfirm.routineId);
      setPendingRoutineConfirm(null);
    }
  };
  const handleSaveFeedback = (dose) => {
    saveFeedback(dose, draftFeedback);
    setFeedbackOpen(null);
    finishPendingRoutine();
  };
  const handleSkipFeedback = (dose) => {
    skipFeedback(dose);
    setFeedbackOpen(null);
    finishPendingRoutine();
  };

  const today = new Date();
  const montag = addDays(selectedDate, -((selectedDate.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));

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
      });
      return items.map((item) => {
        if (item.kategorie === "peptid") return { ...item, onConfirm: () => openFeedback(item.raw, item.key) };
        if (item.kategorie === "hormon") return { ...item, onConfirm: () => toggleHormonErledigt(tagStr, item.name, item.uhrzeit) };
        if (item.kategorie === "supplement") return { ...item, onConfirm: () => toggleSupplementErledigt(tagStr, item.raw.id, item.uhrzeit) };
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
      toggleHormonErledigt,
      supplemente,
      supplementErledigt,
      toggleSupplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      toggleMahlzeitErledigt,
    ]
  );

  const tagesItems = useMemo(() => itemsForDate(selectedDate), [selectedDate, itemsForDate]);
  const tagStr = toLocalISODate(selectedDate);

  // Bestätigt eine Routine als Ganzes: alle nicht-peptid Bestandteile werden
  // sofort und ohne weitere Rückfrage im Hintergrund dokumentiert. Enthält die
  // Routine ein noch offenes Peptid, öffnet sich dafür weiterhin das
  // Nebenwirkungen-Formular (das war dir wichtig) — die Routine gilt danach
  // als erledigt. Ein zweites offenes Peptid in derselben Routine (seltener
  // Sonderfall) wird automatisch ohne Nebenwirkungen übersprungen, damit
  // nicht mehrere Formulare nacheinander aufgehen.
  const confirmRoutine = (routine, matchedItems) => {
    const offenePeptide = [];
    matchedItems.forEach((item) => {
      if (item.done) return;
      if (item.kategorie === "peptid") {
        offenePeptide.push(item);
        return;
      }
      item.onConfirm();
    });

    if (offenePeptide.length === 0) {
      toggleRoutineErledigt(tagStr, routine.id);
      return;
    }
    offenePeptide.slice(1).forEach((item) => skipFeedback(item.raw));
    setPendingRoutineConfirm({ tagStr, routineId: routine.id });
    openFeedback(offenePeptide[0].raw, offenePeptide[0].key);
  };

  // Fasst Einträge, die zu einer Routine gehören, zu einem einzigen Punkt
  // zusammen; alles andere bleibt einzeln sichtbar wie bisher.
  const tagesEntries = useMemo(() => {
    const consumed = new Set();
    const routineEntries = [];
    routinen.forEach((routine) => {
      const refIds = new Set(routine.items.map((i) => `${i.type}:${i.refId}`));
      const matchedItems = tagesItems.filter((item) => refIds.has(`${item.kategorie}:${item.refId}`));
      if (matchedItems.length === 0) return;
      matchedItems.forEach((item) => consumed.add(item.key));
      const hours = matchedItems.map((i) => i.hour).filter(Boolean);
      const hour = routine.uhrzeit ? routine.uhrzeit.slice(0, 2) : hours.length ? hours.sort()[0] : null;
      const done = !!routineErledigt[`${tagStr}__${routine.id}`];
      routineEntries.push({
        kind: "routine",
        key: `routine-${routine.id}`,
        hour,
        uhrzeit: routine.uhrzeit || "",
        icon: routine.icon,
        name: routine.name,
        matchedItems,
        done,
        onConfirm: () => confirmRoutine(routine, matchedItems),
      });
    });
    const ungrouped = tagesItems.filter((item) => !consumed.has(item.key)).map((item) => ({ kind: "item", ...item }));
    return [...ungrouped, ...routineEntries].sort((a, b) => (a.hour ?? "99").localeCompare(b.hour ?? "99"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagesItems, routinen, routineErledigt, tagStr]);

  const buckets = useMemo(() => {
    const map = new Map();
    tagesEntries.forEach((entry) => {
      const key = entry.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, [tagesEntries]);

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
          {tagesEntries.length === 0 && (
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
                {entries.map((entry, i) => {
                  if (entry.kind === "routine") {
                    const offenesPeptid = entry.matchedItems.find((m) => m.kategorie === "peptid" && feedbackOpen === m.key);
                    return (
                      <div key={entry.key} style={{ padding: "12px 0", borderBottom: i < entries.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ fontSize: 18, flexShrink: 0 }}>{entry.icon}</div>
                            <div>
                              <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                                {entry.name} {entry.uhrzeit && <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {entry.uhrzeit}</span>}
                              </div>
                              <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{entry.matchedItems.map((m) => m.name).join(", ")}</div>
                            </div>
                          </div>
                          {entry.done ? (
                            <StatusBadge status="erledigt" />
                          ) : (
                            <button
                              className="mp-tap"
                              onClick={entry.onConfirm}
                              style={{ minHeight: 40, padding: "8px 16px", borderRadius: 12, border: "none", background: accentDark, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                            >
                              Bestätigen
                            </button>
                          )}
                        </div>
                        {offenesPeptid && (
                          <FeedbackPanel
                            item={offenesPeptid}
                            draftFeedback={draftFeedback}
                            setDraftFeedback={setDraftFeedback}
                            toggleDraftNebenwirkung={toggleDraftNebenwirkung}
                            onSkip={() => handleSkipFeedback(offenesPeptid.raw)}
                            onSave={() => handleSaveFeedback(offenesPeptid.raw)}
                          />
                        )}
                      </div>
                    );
                  }

                  const item = entry;
                  const k = KATEGORIE[item.kategorie];
                  const isOpen = feedbackOpen === item.key;
                  return (
                    <div key={item.key} style={{ padding: "12px 0", borderBottom: i < entries.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, marginTop: 6, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                              {item.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {item.uhrzeit}</span>
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
                            Bestätigen
                          </button>
                        )}
                      </div>

                      {item.kategorie === "peptid" && isOpen && (
                        <FeedbackPanel
                          item={item}
                          draftFeedback={draftFeedback}
                          setDraftFeedback={setDraftFeedback}
                          toggleDraftNebenwirkung={toggleDraftNebenwirkung}
                          onSkip={() => handleSkipFeedback(item.raw)}
                          onSave={() => handleSaveFeedback(item.raw)}
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
            const perKategorie = ["peptid", "hormon", "supplement", "mahlzeit"].map((kat) => ({
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
