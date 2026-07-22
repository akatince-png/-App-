import React, { useCallback, useMemo, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, StatusBadge, TextArea } from "../ui/primitives";
import { accent, accentDark, accentSoft, blue, cardBorder, textMain, textMuted } from "../ui/theme";
import { NEBENWIRKUNGEN_OPTIONEN, STAERKE_OPTIONEN, WOCHENTAGE } from "../constants";
import { addDays, fmtDate, keyOf, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

// Eine kleine, harmonische Farbfamilie statt eines Regenbogens: zwei kühle
// Töne (Peptide/Medikamente) und zwei warme (Supplemente/Mahlzeiten) — so
// bleibt jede Kategorie auf einen Blick unterscheidbar, ohne unruhig zu wirken.
const KATEGORIE = {
  peptid: { bg: accentSoft, text: accentDark, dot: accent, label: "Peptid" },
  hormon: { bg: "#EAF0F8", text: "#3A5A87", dot: blue, label: "Medikament" },
  supplement: { bg: "#F6EFE1", text: "#8C651F", dot: "#B8863D", label: "Supplement" },
  mahlzeit: { bg: "#F5E9E2", text: "#94502F", dot: "#C17A54", label: "Mahlzeit" },
};

// Feste Tageszeiten bekommen eine repräsentative Stunde, damit sie sich sinnvoll
// in den Stunden-Zeitstrahl neben Peptiden/Hormonen einordnen; freie/eigene
// Zeiten (z. B. "Vor dem Training") landen ohne feste Stunde ganz unten.
const TAGESZEIT_STUNDE = { Morgens: "08", Mittags: "13", Abends: "20" };

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Sonstige Zeiten";
}

function statusText(done, total) {
  if (total === 0) return "Für heute steht nichts an. 🌿";
  if (done === total) return "Alles erledigt — stark! 🎉";
  if (done === 0) return "Auf geht's — der erste Punkt wartet.";
  if (done / total >= 0.66) return "Fast geschafft, weiter so!";
  return `${total - done} von ${total} stehen noch an.`;
}

function ProgressRing({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cardBorder} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="800" fill={textMain}>
        {total > 0 ? `${Math.round(pct * 100)}%` : "—"}
      </text>
    </svg>
  );
}

export default function TagesplanView({ onHome }) {
  const {
    plan,
    erledigt,
    saveFeedback,
    skipFeedback,
    hormonPlan,
    hormonErledigt,
    toggleHormonErledigt,
    supplemente,
    supplementErledigt,
    toggleSupplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    toggleMahlzeitErledigt,
  } = useAppData();

  const [modus, setModus] = useState("tag"); // 'tag' | 'woche'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [feedbackOpen, setFeedbackOpen] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });

  const openFeedback = (dose, key) => {
    setFeedbackOpen(key);
    setDraftFeedback({ nebenwirkungen: [], staerke: "", notizen: "", fotoPreview: null, fotoFile: null });
  };
  const toggleDraftNebenwirkung = (n) =>
    setDraftFeedback((prev) => ({
      ...prev,
      nebenwirkungen: prev.nebenwirkungen.includes(n) ? prev.nebenwirkungen.filter((x) => x !== n) : [...prev.nebenwirkungen, n],
    }));
  const handleSaveFeedback = (dose) => {
    saveFeedback(dose, draftFeedback);
    setFeedbackOpen(null);
  };
  const handleSkipFeedback = (dose) => {
    skipFeedback(dose);
    setFeedbackOpen(null);
  };

  const today = new Date();
  const montag = addDays(selectedDate, -((selectedDate.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));

  const itemsForDate = useCallback(
    (date) => {
      const tagStr = toLocalISODate(date);
      const items = [];

      plan
        .filter((d) => sameDay(d.date, date))
        .forEach((d) => {
          const k = keyOf(d.date, d.peptid, d.uhrzeit);
          items.push({
            kategorie: "peptid",
            key: `p-${k}`,
            hour: d.uhrzeit.slice(0, 2),
            uhrzeit: d.uhrzeit,
            name: d.peptid,
            detail: d.menge,
            done: !!erledigt[k],
            raw: d,
            onConfirm: () => openFeedback(d, `p-${k}`),
          });
        });

      hormonPlan
        .filter((d) => sameDay(d.date, date))
        .forEach((d) => {
          const k = `${tagStr}__${d.name}__${d.uhrzeit}`;
          items.push({
            kategorie: "hormon",
            key: `h-${k}`,
            hour: d.uhrzeit.slice(0, 2),
            uhrzeit: d.uhrzeit,
            name: d.name,
            detail: d.menge,
            done: !!hormonErledigt[k],
            onConfirm: () => toggleHormonErledigt(tagStr, d.name, d.uhrzeit),
          });
        });

      supplemente.forEach((s) => {
        s.tageszeiten.forEach((zeit) => {
          const k = `${tagStr}__${s.id}__${zeit}`;
          items.push({
            kategorie: "supplement",
            key: `s-${k}`,
            hour: TAGESZEIT_STUNDE[zeit] || null,
            uhrzeit: zeit,
            name: s.name,
            detail: s.hinweis,
            done: !!supplementErledigt[k],
            onConfirm: () => toggleSupplementErledigt(tagStr, s.id, zeit),
          });
        });
      });

      mahlzeiten.forEach((m) => {
        m.tageszeiten.forEach((zeit) => {
          const k = `${tagStr}__${m.id}__${zeit}`;
          items.push({
            kategorie: "mahlzeit",
            key: `m-${k}`,
            hour: TAGESZEIT_STUNDE[zeit] || null,
            uhrzeit: zeit,
            name: m.name,
            detail: m.hinweis,
            done: !!mahlzeitErledigt[k],
            onConfirm: () => toggleMahlzeitErledigt(tagStr, m.id, zeit),
          });
        });
      });

      items.sort((a, b) => {
        const ha = a.hour ?? "99";
        const hb = b.hour ?? "99";
        if (ha !== hb) return ha.localeCompare(hb);
        return a.uhrzeit.localeCompare(b.uhrzeit);
      });
      return items;
    },
    [
      plan,
      erledigt,
      hormonPlan,
      hormonErledigt,
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

  const buckets = useMemo(() => {
    const map = new Map();
    tagesItems.forEach((item) => {
      const key = item.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, [tagesItems]);

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

      <div style={{ display: "flex", gap: 14, marginBottom: 18, fontSize: 11, color: textMuted, flexWrap: "wrap" }}>
        {Object.entries(KATEGORIE).map(([key, k]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot }} />
            {k.label}
          </div>
        ))}
      </div>

      {modus === "tag" && (
        <>
          {tagesItems.length === 0 && (
            <Card>
              <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Für diesen Tag steht nichts an. 🌿</div>
            </Card>
          )}

          {buckets.map(([hour, items]) => (
            <React.Fragment key={hour || "sonstige"}>
              <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 8 }}>{hourLabel(hour)}</div>
              <Card style={{ marginBottom: 16 }}>
                {items.map((item, i) => {
                  const k = KATEGORIE[item.kategorie];
                  const isOpen = feedbackOpen === item.key;
                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: "12px 0",
                        borderBottom: i < items.length - 1 ? `1px solid ${cardBorder}` : "none",
                      }}
                    >
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
                            style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 12, border: `1.5px dashed ${accent}`, background: "#fff", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 4 }}
                          >
                            📷 Foto aufnehmen
                          </label>
                          {draftFeedback.fotoPreview && (
                            <img src={draftFeedback.fotoPreview} alt="Nebenwirkung" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />
                          )}
                          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            <div style={{ flex: 1 }}>
                              <PrimaryButton onClick={() => handleSkipFeedback(item.raw)} variant="ghost">
                                Überspringen
                              </PrimaryButton>
                            </div>
                            <div style={{ flex: 1 }}>
                              <PrimaryButton onClick={() => handleSaveFeedback(item.raw)} variant="success">
                                Speichern
                              </PrimaryButton>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            </React.Fragment>
          ))}
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
