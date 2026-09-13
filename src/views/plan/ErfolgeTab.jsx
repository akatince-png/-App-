import React, { useMemo, useState } from "react";
import { Card } from "../../ui/primitives";
import Icon from "../../ui/Icon";
import { accent, accentSoft, cardBorder, textMain, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { useErrungenschaften } from "../../data/useErrungenschaften";
import { STREAK_SCHWELLEN, PUNKTE_SCHWELLEN, badgeLabel, badgeBeschreibung, alleBadges } from "../../utils/errungenschaften";

function naechsteSchwelle(wert, schwellen) {
  return schwellen.find((s) => s > wert) ?? null;
}

function formatDatum(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Punkte-/Streak-/Abzeichen-Übersicht (Nutzerin-Vorgabe, 11.09.): 1 Punkt
// pro erledigtem Eintrag, Streaks pro Kategorie + global, Abzeichen bei
// festen Meilensteinen (siehe utils/errungenschaften.js). Bewusst als
// eigener Reiter im "Archiv"-Hub neben Statistik, nicht als separate
// Hauptansicht — analog zu StatistikTab.jsx im Aufbau/Stil.
export default function ErfolgeTab() {
  const appData = useAppData();
  const {
    userId,
    supplementErledigt,
    mahlzeitErledigt,
    hormonErledigt,
    gewohnheitErledigt,
    trainingEintraege,
    routineDurchlaeufe,
    schlafEintraege,
    atemuebungLogs,
    hydrationEintraege,
    hydrationZielMl,
    tageslichtEintraege,
    tageslichtZielMinuten,
  } = appData;

  const quellen = useMemo(
    () => ({
      supplementErledigt,
      mahlzeitErledigt,
      hormonErledigt,
      gewohnheitErledigt,
      trainingEintraege,
      routineDurchlaeufe,
      schlafEintraege,
      atemuebungLogs,
      hydrationEintraege,
      hydrationZielMl,
      tageslichtEintraege,
      tageslichtZielMinuten,
    }),
    [
      supplementErledigt,
      mahlzeitErledigt,
      hormonErledigt,
      gewohnheitErledigt,
      trainingEintraege,
      routineDurchlaeufe,
      schlafEintraege,
      atemuebungLogs,
      hydrationEintraege,
      hydrationZielMl,
      tageslichtEintraege,
      tageslichtZielMinuten,
    ]
  );

  const { gesamtPunkte, kategorien, globalerStreak, verdiente, ladend, neueBadgeKeys } = useErrungenschaften(userId, quellen);

  const erreichteAbzeichen = useMemo(
    () => Object.entries(verdiente).sort(([, a], [, b]) => new Date(b) - new Date(a)),
    [verdiente]
  );

  const naechstesGlobalesStreakZiel = naechsteSchwelle(globalerStreak, STREAK_SCHWELLEN);
  const naechstesPunkteZiel = naechsteSchwelle(gesamtPunkte, PUNKTE_SCHWELLEN);

  // "Alle Abzeichen"-Übersicht (Nutzerin-Vorgabe, 12.09.): auch die noch
  // nicht verdienten Abzeichen sollen sichtbar sein, gruppiert nach
  // Kategorie + "Gesamt", mit Klick-Beschreibung, was dafür nötig ist.
  const [ausgewaehlterBadge, setAusgewaehlterBadge] = useState(null);
  const badgeGruppen = useMemo(() => {
    const gruppen = new Map();
    alleBadges().forEach((b) => {
      if (!gruppen.has(b.gruppe)) gruppen.set(b.gruppe, { gruppenLabel: b.gruppenLabel, icon: b.icon, grad: b.grad, badges: [] });
      gruppen.get(b.gruppe).badges.push(b);
    });
    return Array.from(gruppen.values());
  }, []);
  const aktuellerWertFuer = (badge) => {
    if (badge.typ === "punkte") return gesamtPunkte;
    if (badge.gruppe === "global") return globalerStreak;
    return kategorien.find((k) => k.key === badge.gruppe)?.streak ?? 0;
  };

  if (ladend) {
    return <div style={{ fontSize: 13, color: textMuted, textAlign: "center", marginTop: 40 }}>Erfolge werden geladen...</div>;
  }

  return (
    <>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="trophy" size={26} color={accent} />
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{gesamtPunkte}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Punkte gesamt</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Icon name="flame" size={26} color="#E08A3C" />
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{globalerStreak}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Tage am Stück (gesamt)</div>
          </div>
        </div>
        {(naechstesGlobalesStreakZiel || naechstesPunkteZiel) && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}`, fontSize: 12, color: textMuted }}>
            {naechstesGlobalesStreakZiel && (
              <div>
                Nächstes Streak-Abzeichen: {globalerStreak} von {naechstesGlobalesStreakZiel} Tagen
              </div>
            )}
            {naechstesPunkteZiel && (
              <div>
                Nächstes Punkte-Abzeichen: {gesamtPunkte} von {naechstesPunkteZiel} Punkten
              </div>
            )}
          </div>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Kategorien</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        {kategorien
          .filter((k) => k.punkte > 0)
          .map((k) => {
            const naechste = naechsteSchwelle(k.streak, STREAK_SCHWELLEN);
            return (
              <Card key={k.key} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${k.grad[0]}, ${k.grad[1]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={k.icon} size={16} color="#fff" />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textMain, lineHeight: 1.2 }}>{k.label}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: textMuted }}>
                  <span>{k.punkte} Pkt.</span>
                  {k.streak > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon name="flame" size={13} color="#E08A3C" />
                      {k.streak}
                    </span>
                  )}
                </div>
                {naechste && (
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>
                    noch {naechste - k.streak} Tage bis {naechste}er-Streak
                  </div>
                )}
              </Card>
            );
          })}
      </div>
      {kategorien.every((k) => k.punkte === 0) && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: textMuted }}>
            Noch keine erledigten Einträge — sobald etwas abgehakt wird (Training, Supplemente, Routinen, ...), tauchen hier Punkte und Streaks auf.
          </div>
        </Card>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Verdiente Abzeichen</div>
      <Card style={{ marginBottom: 14 }}>
        {erreichteAbzeichen.length === 0 ? (
          <div style={{ fontSize: 13, color: textMuted }}>Noch keine Abzeichen verdient — der erste Meilenstein ist 7 Tage am Stück.</div>
        ) : (
          erreichteAbzeichen.map(([badgeKey, erreichtAm]) => (
            <div
              key={badgeKey}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${cardBorder}`,
                animation: neueBadgeKeys.has(badgeKey) ? "fadeInUp 0.4s ease-out" : undefined,
                background: neueBadgeKeys.has(badgeKey) ? accentSoft : "transparent",
                borderRadius: neueBadgeKeys.has(badgeKey) ? 10 : 0,
                paddingLeft: neueBadgeKeys.has(badgeKey) ? 8 : 0,
              }}
            >
              <Icon name="trophy" size={18} color={accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{badgeLabel(badgeKey)}</div>
                <div style={{ fontSize: 11, color: textMuted }}>erreicht am {formatDatum(erreichtAm)}</div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Alle Abzeichen — auch die noch nicht freigeschalteten, damit man
          sieht, was als Nächstes ansteht (Nutzerin-Vorgabe, 12.09.). Klick
          auf ein Abzeichen zeigt darunter, was konkret dafür nötig ist. */}
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Alle Abzeichen</div>
      <Card style={{ marginBottom: 14 }}>
        {badgeGruppen.map((gruppe) => (
          <div key={gruppe.gruppenLabel} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>{gruppe.gruppenLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {gruppe.badges.map((badge) => {
                const freigeschaltet = !!verdiente[badge.key];
                const ausgewaehlt = ausgewaehlterBadge === badge.key;
                return (
                  <button
                    key={badge.key}
                    type="button"
                    onClick={() => setAusgewaehlterBadge(ausgewaehlt ? null : badge.key)}
                    title={badgeLabel(badge.key)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: ausgewaehlt ? `2px solid ${accent}` : `1px solid ${cardBorder}`,
                      background: freigeschaltet ? (gruppe.grad ? `linear-gradient(135deg, ${gruppe.grad[0]}, ${gruppe.grad[1]})` : accent) : "#F2F2F0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      opacity: freigeschaltet ? 1 : 0.55,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={badge.icon} size={15} color={freigeschaltet ? "#fff" : textMuted} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: freigeschaltet ? "#fff" : textMuted, marginTop: 1 }}>{badge.schwelle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {ausgewaehlterBadge && (
          <div style={{ marginTop: 4, padding: 12, background: accentSoft, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{badgeLabel(ausgewaehlterBadge)}</div>
            <div style={{ fontSize: 12, color: textMain, marginBottom: 6 }}>{badgeBeschreibung(ausgewaehlterBadge)}</div>
            {verdiente[ausgewaehlterBadge] ? (
              <div style={{ fontSize: 11, color: textMuted }}>✅ Erreicht am {formatDatum(verdiente[ausgewaehlterBadge])}</div>
            ) : (
              (() => {
                const badge = alleBadges().find((b) => b.key === ausgewaehlterBadge);
                const aktuell = badge ? aktuellerWertFuer(badge) : 0;
                return (
                  <div style={{ fontSize: 11, color: textMuted }}>
                    Noch nicht erreicht — aktuell {aktuell} von {badge?.schwelle ?? "?"}.
                  </div>
                );
              })()
            )}
          </div>
        )}
      </Card>
    </>
  );
}
